import { cn } from '@/lib/utils';

const KEYS = [
  { key: '↵', label: 'New item' },
  { key: '⇥', label: 'Indent' },
  { key: '⇧⇥', label: 'Outdent' },
  { key: 'Esc', label: 'Cancel' },
] as const;

export function WbsKeyboardStrip({ className }: { className?: string }) {
  return (
    <div className={cn('flex items-center gap-3 flex-wrap', className)}>
      {KEYS.map(({ key, label }) => (
        <div key={key} className="flex items-center gap-1.5">
          <kbd className="inline-flex items-center justify-center rounded border border-border bg-muted px-1.5 py-0.5 font-mono text-[10px] font-medium text-muted-foreground shadow-[0_1px_0_0_hsl(var(--border))] dark:shadow-[0_1px_0_0_rgba(255,255,255,0.08)]">
            {key}
          </kbd>
          <span className="font-mono text-[10px] text-muted-foreground/60 tracking-[0.06em]">
            {label}
          </span>
        </div>
      ))}
    </div>
  );
}
