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

  // Upload to storage using admin client.
  // Use application/octet-stream so the bucket's MIME allowlist never blocks
  // any supported format (PDF, DOCX, TXT, MD, CSV).
  const storagePath = `documents/${user.id}/${projectId}/${Date.now()}-${file.name}`;
  const adminSupabase = createAdminClient();
  const { error: uploadError } = await adminSupabase.storage
    .from('documents')
    .upload(storagePath, file, { contentType: 'application/octet-stream' });

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

  // Extract text from the in-memory File (no storage round-trip) and embed.
  // PDF parse + embed + batch insert ≈ 4-7s — within Vercel Hobby's 10s cap.
  try {
    let textContent: string;

    if (ext === 'pdf') {
      // pdf-parse v2 uses a PDFParse class, not a default-function export.
      const { PDFParse } = await import('pdf-parse');
      const buffer = Buffer.from(await file.arrayBuffer());
      const parser = new PDFParse({ data: buffer });
      const textResult = await parser.getText();
      textContent = textResult.text;

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
    // Surface the real error so the user sees 'failed' + message, not 'pending'.
    const errorMessage = err instanceof Error ? err.message : 'Processing failed';
    console.error('Document embedding failed for doc', doc.id, errorMessage);
    try {
      await db
        .update(documents)
        .set({ processingStatus: 'failed', processingError: errorMessage })
        .where(eq(documents.id, doc.id));
    } catch {
      // DB update failed — not much we can do
    }
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
