'use client';

import { cn } from '@/lib/utils';
import { NetworkIcon, ListIcon, BadgeCheckIcon } from 'lucide-react';

interface ProjectModeSelectorProps {
  value: boolean; // true = Use WBS
  onChange: (useWbs: boolean) => void;
}

export function ProjectModeSelector({ value, onChange }: ProjectModeSelectorProps) {
  return (
    <div className="flex flex-col gap-2">
      <p className="text-sm font-medium">Project Mode</p>
      <div className="grid grid-cols-2 gap-3">
        {/* Use WBS card */}
        <button
          type="button"
          onClick={() => onChange(true)}
          className={cn(
            'relative flex flex-col gap-2 rounded-xl border-2 p-4 text-left transition-all duration-150',
            value
              ? 'border-primary bg-primary/5'
              : 'border-border bg-card hover:border-border/80 hover:bg-muted/30',
          )}
        >
          {value && (
            <span className="absolute top-2 right-2">
              <BadgeCheckIcon className="size-4 text-primary" />
            </span>
          )}
          <NetworkIcon className={cn('size-5', value ? 'text-primary' : 'text-muted-foreground')} />
          <div>
            <p className={cn('text-sm font-bold', value ? 'text-foreground' : 'text-muted-foreground')}>
              Use WBS
            </p>
            <p className="text-[11px] text-muted-foreground leading-relaxed mt-0.5">
              Deliverable-first. Build scope structure before execution.
            </p>
          </div>
          <span className="inline-flex self-start items-center gap-1 rounded-sm bg-primary/10 px-1.5 py-0.5 text-[9px] font-bold uppercase tracking-[0.1em] text-primary">
            PMBOK 8 Recommended
          </span>
          <p className="text-[10px] text-muted-foreground/60">
            Best for: formal PMs, client projects, governance reporting
          </p>
        </button>

        {/* Use Tasks card */}
        <button
          type="button"
          onClick={() => onChange(false)}
          className={cn(
            'flex flex-col gap-2 rounded-xl border-2 p-4 text-left transition-all duration-150',
            !value
              ? 'border-primary bg-primary/5'
              : 'border-border bg-card hover:border-border/80 hover:bg-muted/30',
          )}
        >
          <ListIcon className={cn('size-5', !value ? 'text-primary' : 'text-muted-foreground')} />
          <div>
            <p className={cn('text-sm font-bold', !value ? 'text-foreground' : 'text-muted-foreground')}>
              Use Tasks
            </p>
            <p className="text-[11px] text-muted-foreground leading-relaxed mt-0.5">
              Activity-first. Jump straight into tasks. WBS optional later.
            </p>
          </div>
          <p className="text-[10px] text-muted-foreground/60 mt-auto">
            Best for: quick starts, learning PMBOK, personal projects
          </p>
        </button>
      </div>
      <p className="text-[11px] text-muted-foreground/60 text-center">
        You can switch modes anytime from project settings.
      </p>
    </div>
  );
}
