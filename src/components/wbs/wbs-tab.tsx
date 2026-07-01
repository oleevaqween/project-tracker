import { NetworkIcon } from 'lucide-react';
import { WbsTreeEditor } from '@/components/wbs/wbs-tree-editor';
import type { WbsElement } from '@/lib/wbs-utils';

interface WbsTabProps {
  projectId: number;
  initialElements: WbsElement[];
}

export function WbsTab({ projectId, initialElements }: WbsTabProps) {
  const isEmpty = initialElements.length === 0;

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-start gap-3">
        <div className="rounded-lg bg-primary/10 p-2">
          <NetworkIcon className="size-5 text-primary" />
        </div>
        <div>
          <h2 className="text-base font-bold font-heading">Work Breakdown Structure</h2>
          <p className="text-sm text-muted-foreground">
            PMBOK 8 Scope Management: Create WBS process. Decompose project scope into deliverables.
          </p>
        </div>
      </div>

      {isEmpty && (
        <div className="rounded-xl border-2 border-dashed border-border/60 p-8 text-center">
          <NetworkIcon className="size-8 text-muted-foreground/30 mx-auto mb-3" />
          <h3 className="font-heading font-semibold text-base mb-1">No WBS elements yet</h3>
          <p className="text-sm text-muted-foreground max-w-sm mx-auto mb-4">
            Start by adding your top-level deliverables. Use Tab to create child elements and build your scope hierarchy.
          </p>
        </div>
      )}

      <WbsTreeEditor projectId={projectId} initialElements={initialElements} />
    </div>
  );
}
