'use client';

import * as React from 'react';
import { AlertTriangleIcon, RefreshCwIcon, ArrowLeftIcon } from 'lucide-react';
import { Button } from '@/components/ui/button';

export default function ProjectError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  React.useEffect(() => {
    console.error('[Project Error]', error);
  }, [error]);

  return (
    <div className="flex flex-1 flex-col items-center justify-center gap-6 p-12 text-center">
      <div className="rounded-full bg-destructive/10 p-4">
        <AlertTriangleIcon className="size-8 text-destructive" />
      </div>
      <div className="space-y-2">
        <h2 className="text-lg font-semibold">Failed to load project</h2>
        <p className="text-sm text-muted-foreground max-w-sm">
          {error.message ?? 'The project could not be loaded. It may have been deleted or you may not have access.'}
        </p>
        {error.digest && (
          <p className="text-xs font-mono text-muted-foreground/60">Error ID: {error.digest}</p>
        )}
      </div>
      <div className="flex gap-3">
        <Button variant="outline" size="sm" className="gap-2" onClick={() => window.history.back()}>
          <ArrowLeftIcon className="size-3.5" />
          Back to projects
        </Button>
        <Button onClick={reset} size="sm" className="gap-2">
          <RefreshCwIcon className="size-3.5" />
          Try again
        </Button>
      </div>
    </div>
  );
}
