'use server';

import { createClient, createAdminClient } from '@/lib/supabase/server';
import { db } from '@/db';
import { documents } from '@/db/schema';
import { eq, and } from 'drizzle-orm';
import { redirect } from 'next/navigation';
import { revalidatePath } from 'next/cache';
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

  const ext = file.name.split('.').pop()?.toLowerCase() ?? '';
  if (!SUPPORTED_EXTENSIONS.includes(`.${ext}`)) {
    return { error: `Unsupported file type. Allowed: ${SUPPORTED_EXTENSIONS.join(', ')}` };
  }

  if (file.size > MAX_FILE_SIZE) {
    return { error: 'File too large (max 10MB)' };
  }

  // Upload to storage using admin client
  const storagePath = `documents/${user.id}/${projectId}/${Date.now()}-${file.name}`;
  const adminSupabase = createAdminClient();
  const { error: uploadError } = await adminSupabase.storage
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

  // Extract text from the in-memory File — no storage round-trip needed.
  // This is the key to fitting within Vercel's function timeout:
  //   PDF parse + embed + batch insert ≈ 4-7s total, well under the 10s cap.
  try {
    let textContent: string;

    if (ext === 'pdf') {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const pdfParse = (await import('pdf-parse')) as any;
      const buffer = Buffer.from(await file.arrayBuffer());
      const pdfData = await pdfParse(buffer);
      textContent = pdfData.text as string;

      if (!textContent?.trim()) {
        await db
          .update(documents)
          .set({
            processingStatus: 'failed',
            processingError: 'PDF appears to be scanned/image-only — no extractable text.',
          })
          .where(eq(documents.id, doc.id));
        revalidatePath('/knowledge-base');
        revalidatePath(`/projects/${projectId}`);
        return { success: true, documentId: doc.id };
      }
    } else if (ext === 'docx') {
      const mammoth = await import('mammoth');
      const buffer = Buffer.from(await file.arrayBuffer());
      const result = await mammoth.extractRawText({ buffer });
      textContent = result.value;
    } else {
      textContent = await file.text();
    }

    await processDocument(doc.id, textContent, projectId);
  } catch (err) {
    // processDocument sets processingStatus to 'failed' in its own catch block.
    // We still return success so the uploaded file shows in the list.
    console.error('Document embedding failed for doc', doc.id, err);
  }

  revalidatePath('/knowledge-base');
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

  const [doc] = await db
    .select()
    .from(documents)
    .where(and(eq(documents.id, documentId), eq(documents.userId, user.id)));

  if (!doc) return { error: 'Document not found' };

  await supabase.storage.from('documents').remove([doc.storagePath]);
  await db.delete(documents).where(eq(documents.id, documentId));

  revalidatePath('/knowledge-base');
  revalidatePath(`/projects/${projectId}`);
  return { success: true };
}
