'use client';

import * as React from 'react';
import {
  FileIcon,
  UploadIcon,
  TrashIcon,
  SearchIcon,
  FilterIcon,
  CheckCircle2Icon,
  ClockIcon,
  AlertCircleIcon,
  Loader2Icon,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { cn } from '@/lib/utils';
import { DocumentUploadDialog } from '@/components/document-upload-dialog';
import { deleteDocument } from '@/actions/documents';
import { useRouter } from 'next/navigation';

type Document = {
  id: number;
  projectId: number;
  userId: string;
  fileName: string;
  fileType: string;
  storagePath: string;
  fileSizeBytes: number | null;
  contentHash: string | null;
  processingStatus: string | null;
  processingError: string | null;
  createdAt: Date;
};

type Project = {
  id: number;
  name: string;
  status: string;
};

const statusConfig: Record<string, { label: string; icon: React.ElementType; color: string }> = {
  pending: { label: 'Pending', icon: ClockIcon, color: 'text-yellow-600 bg-yellow-50' },
  processing: { label: 'Processing', icon: Loader2Icon, color: 'text-blue-600 bg-blue-50' },
  completed: { label: 'Completed', icon: CheckCircle2Icon, color: 'text-green-600 bg-green-50' },
  failed: { label: 'Failed', icon: AlertCircleIcon, color: 'text-red-600 bg-red-50' },
};

function formatFileSize(bytes: number | null): string {
  if (!bytes) return '—';
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

export function KnowledgeBaseClient({
  documents: initialDocuments,
  projects,
  userId,
}: {
  documents: Document[];
  projects: Project[];
  userId: string;
}) {
  const router = useRouter();
  const [documents, setDocuments] = React.useState(initialDocuments);

  // Sync local state whenever the server re-fetches (router.refresh())
  React.useEffect(() => {
    setDocuments(initialDocuments);
  }, [initialDocuments]);
  const [searchQuery, setSearchQuery] = React.useState('');
  const [filterProjectId, setFilterProjectId] = React.useState<number | null>(null);
  const [uploadOpen, setUploadOpen] = React.useState(false);
  const [deletingId, setDeletingId] = React.useState<number | null>(null);

  const filteredDocs = React.useMemo(() => {
    let result = documents;

    if (filterProjectId) {
      result = result.filter((d) => d.projectId === filterProjectId);
    }

    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      result = result.filter((d) => d.fileName.toLowerCase().includes(q));
    }

    return result;
  }, [documents, filterProjectId, searchQuery]);

  async function handleDelete(documentId: number, projectId: number) {
    setDeletingId(documentId);
    try {
      const result = await deleteDocument(documentId, projectId);
      if (result.success) {
        setDocuments((prev) => prev.filter((d) => d.id !== documentId));
      }
    } catch (error) {
      console.error('Failed to delete document:', error);
    } finally {
      setDeletingId(null);
    }
  }

  function handleUploadSuccess() {
    setUploadOpen(false);
    router.refresh();
  }

  const projectMap = new Map(projects.map((p) => [p.id, p.name]));

  return (
    <div className="flex flex-1 flex-col gap-4 p-4 pt-0">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Knowledge Base</h1>
          <p className="text-sm text-muted-foreground">
            Upload documents to enable RAG-powered AI search
          </p>
        </div>
        <Button className="gap-2" onClick={() => setUploadOpen(true)}>
          <UploadIcon className="size-4" />
          Upload Document
        </Button>
      </div>

      {/* Filters */}
      <div className="flex items-center gap-3">
        <div className="relative flex-1">
          <SearchIcon className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="Search documents..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-9"
          />
        </div>
        <select
          value={filterProjectId ?? ''}
          onChange={(e) => setFilterProjectId(e.target.value ? parseInt(e.target.value) : null)}
          className="h-9 rounded-md border border-input bg-background px-3 text-sm"
        >
          <option value="">All projects</option>
          {projects.map((p) => (
            <option key={p.id} value={p.id}>
              {p.name}
            </option>
          ))}
        </select>
      </div>

      {/* Document list */}
      {filteredDocs.length === 0 ? (
        <div className="flex flex-col items-center justify-center gap-4 py-16 text-center">
          <div className="rounded-full bg-muted p-4">
            <FileIcon className="size-8 text-muted-foreground" />
          </div>
          <div>
            <h3 className="text-lg font-semibold">No documents yet</h3>
            <p className="text-sm text-muted-foreground">
              Upload PDFs, Word docs, text files, or markdown to enable AI-powered search
            </p>
          </div>
          <Button variant="outline" className="gap-2" onClick={() => setUploadOpen(true)}>
            <UploadIcon className="size-4" />
            Upload your first document
          </Button>
        </div>
      ) : (
        <div className="space-y-2">
          {filteredDocs.map((doc) => {
            const status = statusConfig[doc.processingStatus ?? 'pending'] ?? statusConfig.pending;
            const StatusIcon = status.icon;

            return (
              <div
                key={doc.id}
                className="flex items-center gap-4 rounded-lg border p-4 transition-colors hover:bg-muted/50"
              >
                <div className={cn('flex size-10 shrink-0 items-center justify-center rounded-lg', status.color)}>
                  <FileIcon className="size-5" />
                </div>

                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="font-medium truncate">{doc.fileName}</span>
                    <span className="text-xs text-muted-foreground uppercase">{doc.fileType}</span>
                  </div>
                  <div className="flex items-center gap-3 text-xs text-muted-foreground">
                    <span>{projectMap.get(doc.projectId) ?? 'Unknown project'}</span>
                    <span>{formatFileSize(doc.fileSizeBytes)}</span>
                    <span>{new Date(doc.createdAt).toLocaleDateString()}</span>
                  </div>
                  {doc.processingError && (
                    <p className="mt-1 text-xs text-destructive">{doc.processingError}</p>
                  )}
                </div>

                <div className={cn('flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-medium', status.color)}>
                  <StatusIcon className={cn('size-3.5', status.icon === Loader2Icon && 'animate-spin')} />
                  {status.label}
                </div>

                <Button
                  variant="ghost"
                  size="icon-sm"
                  className="shrink-0 text-muted-foreground hover:text-destructive"
                  disabled={deletingId === doc.id}
                  onClick={() => handleDelete(doc.id, doc.projectId)}
                >
                  {deletingId === doc.id ? (
                    <Loader2Icon className="size-4 animate-spin" />
                  ) : (
                    <TrashIcon className="size-4" />
                  )}
                </Button>
              </div>
            );
          })}
        </div>
      )}

      <DocumentUploadDialog
        open={uploadOpen}
        onOpenChange={setUploadOpen}
        projects={projects}
        onSuccess={handleUploadSuccess}
      />
    </div>
  );
}