import * as React from 'react';
import { cn } from '@/lib/utils';

const KEYS = [
  { key: 'Enter',      label: 'New sibling' },
  { key: 'Tab',        label: 'Add child'   },
  { key: 'Shift+Tab',  label: 'Promote'     },
  { key: 'Esc',        label: 'Cancel'      },
] as const;

export function WbsKeyboardStrip({ className }: { className?: string }) {
  const [collapsed, setCollapsed] = React.useState(false);

  if (collapsed) {
    return (
      <button
        type="button"
        onClick={() => setCollapsed(false)}
        className={cn('inline-flex items-center gap-1 text-[10px] text-muted-foreground/50 hover:text-muted-foreground transition-colors', className)}
      >
        <span className="font-mono rounded border border-border bg-muted px-1 py-0.5">?</span>
        Keyboard shortcuts
      </button>
    );
  }

  return (
    <div className={cn('flex items-center gap-3 flex-wrap', className)}>
      {KEYS.map(({ key, label }) => (
        <div key={key} className="flex items-center gap-1.5">
          <kbd className="inline-flex items-center justify-center rounded border border-border bg-muted px-1.5 py-0.5 font-mono text-[10px] font-medium text-muted-foreground shadow-[0_1px_0_0_hsl(var(--border))] dark:shadow-[0_1px_0_0_rgba(255,255,255,0.08)]">
            {key}
          </kbd>
          <span className="text-[10px] text-muted-foreground/60">{label}</span>
        </div>
      ))}
      <button
        type="button"
        onClick={() => setCollapsed(true)}
        className="ml-1 text-[10px] text-muted-foreground/40 hover:text-muted-foreground transition-colors"
      >
        Hide
      </button>
    </div>
  );
}
