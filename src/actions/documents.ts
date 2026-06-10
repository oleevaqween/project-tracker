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
      // pdf-parse v2 / pdfjs-dist v5 references DOMMatrix (browser-only API)
      // at module load time, crashing in Node.js. Polyfill the minimal subset
      // pdfjs needs so the module initialises; we only call getTextContent()
      // which does not use the rendering pipeline that needs real DOMMatrix math.
      if (typeof (globalThis as any).DOMMatrix === 'undefined') {
        (globalThis as any).DOMMatrix = class DOMMatrix {
          a=1; b=0; c=0; d=1; e=0; f=0;
          m11=1; m12=0; m13=0; m14=0;
          m21=0; m22=1; m23=0; m24=0;
          m31=0; m32=0; m33=1; m34=0;
          m41=0; m42=0; m43=0; m44=1;
          is2D=true; isIdentity=true;
          constructor(init?: string | number[]) {
            if (Array.isArray(init) && init.length >= 6) {
              [this.a, this.b, this.c, this.d, this.e, this.f] = init as number[];
              this.m11=this.a; this.m22=this.d; this.m41=this.e; this.m42=this.f;
            }
          }
          static fromMatrix(m: any) {
            return new (globalThis as any).DOMMatrix([m.a??1,m.b??0,m.c??0,m.d??1,m.e??0,m.f??0]);
          }
          static fromFloat64Array(a: Float64Array) { return new (globalThis as any).DOMMatrix([...a] as number[]); }
          static fromFloat32Array(a: Float32Array) { return new (globalThis as any).DOMMatrix([...a] as number[]); }
          multiply() { return new (globalThis as any).DOMMatrix(); }
          translate() { return new (globalThis as any).DOMMatrix(); }
          scale() { return new (globalThis as any).DOMMatrix(); }
          rotate() { return new (globalThis as any).DOMMatrix(); }
          inverse() { return new (globalThis as any).DOMMatrix(); }
          transformPoint(p?: {x?:number;y?:number}) { return {x:p?.x??0, y:p?.y??0, z:0, w:1}; }
          toFloat32Array() { return new Float32Array([this.a,this.b,this.c,this.d,this.e,this.f]); }
          toFloat64Array() { return new Float64Array([this.a,this.b,this.c,this.d,this.e,this.f]); }
          toString() { return `matrix(${this.a},${this.b},${this.c},${this.d},${this.e},${this.f})`; }
        };
      }

      // Use pdfjs-dist directly (it's already installed as pdf-parse's dep).
      // getTextContent() extracts raw text without the canvas/SVG rendering
      // pipeline, so the DOMMatrix stub above is sufficient.
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const pdfjs = (await import('pdfjs-dist/legacy/build/pdf.mjs')) as any;
      pdfjs.GlobalWorkerOptions.workerSrc = ''; // inline mode — no worker thread
      const buffer = Buffer.from(await file.arrayBuffer());
      const loadingTask = pdfjs.getDocument({ data: new Uint8Array(buffer) });
      const pdfDoc = await loadingTask.promise;
      const pageTexts: string[] = [];
      for (let pageNum = 1; pageNum <= pdfDoc.numPages; pageNum++) {
        const page = await pdfDoc.getPage(pageNum);
        const content = await page.getTextContent();
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const pageText = (content.items as any[])
          .filter((item) => typeof item.str === 'string')
          .map((item) => item.str)
          .join(' ');
        pageTexts.push(pageText);
        page.cleanup();
      }
      await pdfDoc.destroy();
      textContent = pageTexts.join('\n\n');

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
