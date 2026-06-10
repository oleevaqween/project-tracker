'use server';

import { createClient, createAdminClient } from '@/lib/supabase/server';
import { db } from '@/db';
import { documents } from '@/db/schema';
import { eq, and } from 'drizzle-orm';
import { redirect } from 'next/navigation';
import { revalidatePath } from 'next/cache';
import { after } from 'next/server';
import { processDocument } from '@/lib/ai/embeddings';

const SUPPORTED_EXTENSIONS = ['.pdf', '.txt', '.md', '.csv', '.docx'];
const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB

export async function uploadDocument(formData: FormData) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect('/login');

  const file = formData.get('file') as File | null;
  const projectIdStr = formData.get('projectId') as string | null;
  const projectId = projectIdStr ? parseInt(projectIdStr) : NaN;

  if (!file || !projectIdStr || isNaN(projectId)) {
    return { error: 'File and project ID are required' };
  }

  // Validate file type
  const ext = file.name.split('.').pop()?.toLowerCase() ?? '';
  if (!SUPPORTED_EXTENSIONS.includes(`.${ext}`)) {
    return { error: `Unsupported file type. Allowed: ${SUPPORTED_EXTENSIONS.join(', ')}` };
  }

  // Validate file size
  if (file.size > MAX_FILE_SIZE) {
    return { error: 'File too large (max 10MB)' };
  }

  // Upload to Supabase Storage using admin client — the user-session client doesn't
  // reliably carry its JWT to storage in server action context. Auth is already
  // verified above; using the service role here is safe.
  const storagePath = `documents/${user.id}/${projectId}/${Date.now()}-${file.name}`;
  const adminSupabaseUpload = createAdminClient();
  const { error: uploadError } = await adminSupabaseUpload.storage
    .from('documents')
    .upload(storagePath, file);

  if (uploadError) {
    console.error('Storage upload error:', uploadError);
    return { error: `Upload failed: ${uploadError.message}` };
  }

  // Create document record
  const [doc] = await db
    .insert(documents)
    .values({
      projectId,
      userId: user.id,
      fileName: file.name,
      fileType: ext,
      storagePath,
      fileSizeBytes: file.size,
      processingStatus: 'pending',
    })
    .returning();

  // Process embeddings after the response is returned — runs in the same process,
  // no auth round-trip needed.
  after(async () => {
    try {
      const adminSupabase = createAdminClient();
      const { data: fileData, error: dlErr } = await adminSupabase.storage
        .from('documents')
        .download(doc.storagePath);

      if (dlErr || !fileData) {
        console.error('Background embedding: storage download failed', dlErr);
        await db.update(documents)
          .set({ processingStatus: 'failed', processingError: 'Storage download failed' })
          .where(eq(documents.id, doc.id));
        return;
      }

      let textContent: string;
      const buffer = Buffer.from(await fileData.arrayBuffer());
      if (ext === 'pdf') {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const pdfParse = (await import('pdf-parse')) as any;
        const pdfData = await pdfParse(buffer);
        textContent = pdfData.text ?? '';
        if (!textContent.trim()) {
          await db.update(documents)
            .set({ processingStatus: 'failed', processingError: 'Scanned/image-only PDF — no extractable text' })
            .where(eq(documents.id, doc.id));
          return;
        }
      } else if (ext === 'docx') {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const mammoth = (await import('mammoth')) as any;
        const result = await mammoth.extractRawText({ buffer });
        textContent = result.value ?? '';
        if (!textContent.trim()) {
          await db.update(documents)
            .set({ processingStatus: 'failed', processingError: 'DOCX appears to be empty or image-only' })
            .where(eq(documents.id, doc.id));
          return;
        }
      } else {
        textContent = await fileData.text();
      }

      await processDocument(doc.id, textContent, projectId);
    } catch (err) {
      console.error('Background embedding failed for doc', doc.id, err);
    }
  });

  revalidatePath(`/projects/${projectId}`);
  return { success: true, documentId: doc.id };
}

export async function getDocuments(projectId: number) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect('/login');

  return db
    .select()
    .from(documents)
    .where(
      and(eq(documents.projectId, projectId), eq(documents.userId, user.id))
    )
    .orderBy(documents.createdAt);
}

export async function deleteDocument(documentId: number, projectId: number) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect('/login');

  // Get the document to find storage path
  const [doc] = await db
    .select()
    .from(documents)
    .where(and(eq(documents.id, documentId), eq(documents.userId, user.id)));

  if (!doc) return { error: 'Document not found' };

  // Delete from storage
  await supabase.storage.from('documents').remove([doc.storagePath]);

  // Delete from DB (cascades to documentChunks)
  await db.delete(documents).where(eq(documents.id, documentId));

  revalidatePath(`/projects/${projectId}`);
  return { success: true };
}