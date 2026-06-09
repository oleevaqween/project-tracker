'use client';

import * as React from 'react';
import { AlertTriangleIcon, RefreshCwIcon } from 'lucide-react';
import { Button } from '@/components/ui/button';

export default function DashboardError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  React.useEffect(() => {
    console.error('[Dashboard Error]', error);
  }, [error]);

  return (
    <div className="flex flex-1 flex-col items-center justify-center gap-6 p-12 text-center">
      <div className="rounded-full bg-destructive/10 p-4">
        <AlertTriangleIcon className="size-8 text-destructive" />
      </div>
      <div className="space-y-2">
        <h2 className="text-lg font-semibold">Something went wrong</h2>
        <p className="text-sm text-muted-foreground max-w-sm">
          {error.message ?? 'An unexpected error occurred. Please try again.'}
        </p>
        {error.digest && (
          <p className="text-xs font-mono text-muted-foreground/60">Error ID: {error.digest}</p>
        )}
      </div>
      <Button onClick={reset} variant="outline" size="sm" className="gap-2">
        <RefreshCwIcon className="size-3.5" />
        Try again
      </Button>
    </div>
  );
}
