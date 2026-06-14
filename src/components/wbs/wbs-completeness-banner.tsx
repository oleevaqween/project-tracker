'use client';

import { useRouter } from 'next/navigation';
import { useTransition } from 'react';
import { NetworkIcon, XIcon } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { setProjectWbsMode, dismissWbsNudge } from '@/actions/wbs';
import { computeWbsCompleteness } from '@/lib/wbs-utils';
import { cn } from '@/lib/utils';

interface WbsCompletenessBannerProps {
  projectId: number;
  tasks: { wbsElementId: number | null }[];
  nudgeDismissed: boolean;
}

export function WbsCompletenessBanner({ projectId, tasks, nudgeDismissed }: WbsCompletenessBannerProps) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const { unassigned, total } = computeWbsCompleteness(tasks);

  if (nudgeDismissed || total === 0) return null;

  function handleBuildWbs() {
    startTransition(async () => {
      await setProjectWbsMode(projectId, true);
      router.refresh();
    });
  }

  function handleDismiss() {
    startTransition(async () => {
      await dismissWbsNudge(projectId);
      router.refresh();
    });
  }

  return (
    <div className={cn(
      'flex items-center gap-3 rounded-lg border border-amber-200 dark:border-amber-900/40',
      'bg-amber-50 dark:bg-amber-900/10 px-4 py-2.5',
    )}>
      <NetworkIcon className="size-4 text-amber-600 dark:text-amber-400 shrink-0" />
      <p className="flex-1 text-xs text-amber-800 dark:text-amber-300">
        <span className="font-semibold">WBS not defined</span>
        {unassigned > 0
          ? ` — ${unassigned} task${unassigned !== 1 ? 's' : ''} have no deliverable assigned. Scope may be incomplete.`
          : ' — No deliverable structure defined for this project.'}
      </p>
      <div className="flex items-center gap-2 shrink-0">
        <Button
          size="sm"
          variant="outline"
          className="h-7 text-xs border-amber-300 dark:border-amber-700 text-amber-700 dark:text-amber-300 hover:bg-amber-100 dark:hover:bg-amber-900/30"
          onClick={handleBuildWbs}
          disabled={pending}
        >
          Build WBS
        </Button>
        <button
          type="button"
          onClick={handleDismiss}
          disabled={pending}
          className="text-amber-500 hover:text-amber-700 dark:text-amber-500 dark:hover:text-amber-300 transition-colors"
          title="Dismiss"
        >
          <XIcon className="size-3.5" />
        </button>
      </div>
    </div>
  );
}
