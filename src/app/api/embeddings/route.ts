import { NextRequest, NextResponse } from 'next/server';
import { createClient, createAdminClient } from '@/lib/supabase/server';
import { db } from '@/db';
import { documents } from '@/db/schema';
import { eq, and } from 'drizzle-orm';
import { processDocument } from '@/lib/ai/embeddings';

export const maxDuration = 300;

export async function POST(req: NextRequest) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { documentId } = await req.json() as { documentId: number };
  if (!documentId) {
    return NextResponse.json({ error: 'documentId required' }, { status: 400 });
  }

  const [doc] = await db
    .select()
    .from(documents)
    .where(and(eq(documents.id, documentId), eq(documents.userId, user.id)))
    .limit(1);

  if (!doc) {
    return NextResponse.json({ error: 'Document not found' }, { status: 404 });
  }

  if (doc.processingStatus === 'completed') {
    return NextResponse.json({ ok: true, status: 'already_completed' });
  }

  const adminSupabase = createAdminClient();
  const { data: fileData, error: downloadError } = await adminSupabase.storage
    .from('documents')
    .download(doc.storagePath);

  if (downloadError || !fileData) {
    await db.update(documents)
      .set({ processingStatus: 'failed', processingError: 'Failed to download file from storage' })
      .where(eq(documents.id, documentId));
    return NextResponse.json({ error: 'Failed to download file from storage' }, { status: 500 });
  }

  try {
    let textContent: string;
    const ext = doc.fileType.toLowerCase();

    if (ext === 'pdf') {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const pdfParse = (await import('pdf-parse')) as any;
      const buffer = Buffer.from(await fileData.arrayBuffer());
      const pdfData = await pdfParse(buffer);
      textContent = pdfData.text;

      if (!textContent?.trim()) {
        await db.update(documents)
          .set({ processingStatus: 'failed', processingError: 'PDF appears to be scanned/image-only — no extractable text.' })
          .where(eq(documents.id, documentId));
        return NextResponse.json({ error: 'Scanned PDF — no extractable text' }, { status: 422 });
      }
    } else if (ext === 'docx') {
      const mammoth = await import('mammoth');
      const buffer = Buffer.from(await fileData.arrayBuffer());
      const result = await mammoth.extractRawText({ buffer });
      textContent = result.value;

      if (!textContent?.trim()) {
        await db.update(documents)
          .set({ processingStatus: 'failed', processingError: 'DOCX appears to contain no extractable text.' })
          .where(eq(documents.id, documentId));
        return NextResponse.json({ error: 'No extractable text in DOCX' }, { status: 422 });
      }
    } else {
      textContent = await fileData.text();
    }

    await processDocument(documentId, textContent, doc.projectId);
    return NextResponse.json({ ok: true, status: 'completed' });
  } catch (err) {
    const msg = err instanceof Error ? err.message : 'Processing failed';
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
