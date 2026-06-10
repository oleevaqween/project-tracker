'use client';

import * as React from 'react';
import { UploadIcon, FileIcon, XIcon, Loader2Icon } from 'lucide-react';
import {
  Dialog,
  DialogTrigger,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogClose,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { uploadDocument } from '@/actions/documents';

type Project = {
  id: number;
  name: string;
  status: string;
};

interface DocumentUploadDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  projects: Project[];
  onSuccess: () => void;
}

const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB

export function DocumentUploadDialog({
  open,
  onOpenChange,
  projects,
  onSuccess,
}: DocumentUploadDialogProps) {
  const [selectedProjectId, setSelectedProjectId] = React.useState<string>('');
  const [file, setFile] = React.useState<File | null>(null);
  const [uploading, setUploading] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);
  const [dragOver, setDragOver] = React.useState(false);
  const inputRef = React.useRef<HTMLInputElement>(null);

  function handleFileSelect(f: File) {
    setError(null);
    const ext = f.name.split('.').pop()?.toLowerCase() ?? '';
    const allowedExts = ['pdf', 'docx', 'txt', 'md', 'csv'];
    if (!allowedExts.includes(ext)) {
      setError(`Unsupported file type. Allowed: PDF, DOCX, TXT, MD, CSV`);
      return;
    }
    if (f.size > MAX_FILE_SIZE) {
      setError('File too large (max 10MB)');
      return;
    }
    setFile(f);
  }

  function handleDrop(e: React.DragEvent) {
    e.preventDefault();
    setDragOver(false);
    const f = e.dataTransfer.files[0];
    if (f) handleFileSelect(f);
  }

  async function handleUpload() {
    if (!file || !selectedProjectId) return;
    setUploading(true);
    setError(null);

    try {
      const formData = new FormData();
      formData.append('file', file);
      formData.append('projectId', selectedProjectId);

      const result = await uploadDocument(formData);

      if (result.error) {
        setError(result.error);
        setUploading(false);
        return;
      }

      // uploadDocument now handles text extraction and embedding inline —
      // no separate API call needed. Close and refresh.
      setFile(null);
      setSelectedProjectId('');
      onSuccess();
    } catch {
      setError('Upload failed. Please try again.');
    } finally {
      setUploading(false);
    }
  }

  function reset() {
    setFile(null);
    setSelectedProjectId('');
    setError(null);
  }

  return (
    <Dialog
      open={open}
      onOpenChange={(isOpen) => {
        if (!isOpen) reset();
        onOpenChange(isOpen);
      }}
    >
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Upload Document</DialogTitle>
          <DialogDescription>
            Upload a document to your project&apos;s knowledge base. Supported formats: PDF, DOCX, TXT, MD, CSV.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          {/* Project selector */}
          <div className="space-y-2">
            <label className="text-sm font-medium">Project</label>
            <select
              value={selectedProjectId}
              onChange={(e) => setSelectedProjectId(e.target.value)}
              className="w-full h-9 rounded-md border border-input bg-background px-3 text-sm"
            >
              <option value="">Select a project...</option>
              {projects.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.name}
                </option>
              ))}
            </select>
          </div>

          {/* Drop zone */}
          <div
            className={cn(
              'flex flex-col items-center justify-center gap-3 rounded-lg border-2 border-dashed p-8 transition-colors cursor-pointer',
              dragOver ? 'border-primary bg-primary/5' : 'border-muted-foreground/25 hover:border-muted-foreground/50',
              file && 'border-primary/50 bg-primary/5'
            )}
            onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
            onDragLeave={() => setDragOver(false)}
            onDrop={handleDrop}
            onClick={() => inputRef.current?.click()}
          >
            <input
              ref={inputRef}
              type="file"
              accept=".pdf,.docx,.txt,.md,.csv"
              className="hidden"
              onChange={(e) => {
                const f = e.target.files?.[0];
                if (f) handleFileSelect(f);
              }}
            />

            {file ? (
              <div className="flex items-center gap-3">
                <FileIcon className="size-8 text-primary" />
                <div>
                  <p className="font-medium text-sm">{file.name}</p>
                  <p className="text-xs text-muted-foreground">
                    {(file.size / 1024).toFixed(1)} KB
                  </p>
                </div>
                <Button
                  variant="ghost"
                  size="icon-sm"
                  className="ml-2"
                  onClick={(e) => {
                    e.stopPropagation();
                    setFile(null);
                  }}
                >
                  <XIcon className="size-4" />
                </Button>
              </div>
            ) : (
              <>
                <UploadIcon className="size-8 text-muted-foreground" />
                <div className="text-center">
                  <p className="text-sm font-medium">Drop a file here or click to browse</p>
                  <p className="text-xs text-muted-foreground">PDF, DOCX, TXT, MD, CSV (max 10MB)</p>
                </div>
              </>
            )}
          </div>

          {error && (
            <p className="text-sm text-destructive">{error}</p>
          )}
        </div>

        <div className="flex justify-end gap-2">
          <DialogClose render={<Button variant="outline" />}>Cancel</DialogClose>
          <Button
            onClick={handleUpload}
            disabled={!file || !selectedProjectId || uploading}
            className="gap-2"
          >
            {uploading ? (
              <>
                <Loader2Icon className="size-4 animate-spin" />
                Uploading...
              </>
            ) : (
              <>
                <UploadIcon className="size-4" />
                Upload
              </>
            )}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}