'use client';

import * as React from 'react';
import { ChevronDownIcon } from 'lucide-react';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Input } from '@/components/ui/input';
import { cn } from '@/lib/utils';
import type { WbsElement } from '@/lib/wbs-utils';

interface WbsDictionaryProps {
  element: WbsElement;
  onUpdate: (data: Partial<WbsElement>) => void;
}

function formatCost(value: string | null): string {
  if (!value) return '';
  const n = Number(value.replace(/,/g, ''));
  return isNaN(n) ? value : n.toLocaleString('en-US');
}

export function WbsDictionary({ element, onUpdate }: WbsDictionaryProps) {
  const [tier3Open, setTier3Open] = React.useState(false);
  const [costDisplay, setCostDisplay] = React.useState(() => formatCost(element.estimatedCost));
  const d = element.dictionaryDetails ?? {};

  React.useEffect(() => {
    setCostDisplay(formatCost(element.estimatedCost));
  }, [element.estimatedCost]);

  return (
    <div className="flex flex-col gap-4 px-4 pb-4 pt-2 border-t border-border/30">
      {/* Tier 2: always visible when expanded */}
      <div className="grid gap-3 sm:grid-cols-2">
        <div className="sm:col-span-2 flex flex-col gap-1">
          <Label className="text-[10px] font-mono uppercase tracking-[0.1em] text-muted-foreground">
            Description
          </Label>
          <p className="text-[10px] text-muted-foreground/50">What this deliverable is and what &quot;done&quot; looks like</p>
          <Textarea
            className="min-h-[72px] resize-none text-xs"
            value={element.description ?? ''}
            onChange={(e) => onUpdate({ description: e.target.value })}
            placeholder="Describe this deliverable..."
          />
        </div>
        <div className="sm:col-span-2 flex flex-col gap-1">
          <Label className="text-[10px] font-mono uppercase tracking-[0.1em] text-muted-foreground">
            Acceptance Criteria
          </Label>
          <p className="text-[10px] text-muted-foreground/50">How the deliverable will be verified as complete</p>
          <Textarea
            className="min-h-[60px] resize-none text-xs"
            value={element.acceptanceCriteria ?? ''}
            onChange={(e) => onUpdate({ acceptanceCriteria: e.target.value })}
            placeholder="Define acceptance criteria..."
          />
        </div>
        <div className="flex flex-col gap-1">
          <Label className="text-[10px] font-mono uppercase tracking-[0.1em] text-muted-foreground">
            Responsible Party
          </Label>
          <Input
            className="h-8 text-xs"
            value={element.responsibleParty ?? ''}
            onChange={(e) => onUpdate({ responsibleParty: e.target.value })}
            placeholder="Who owns this work package"
          />
        </div>
        <div className="flex flex-col gap-1">
          <Label className="text-[10px] font-mono uppercase tracking-[0.1em] text-muted-foreground">
            Estimated Cost
          </Label>
          <Input
            className="h-8 text-xs"
            type="text"
            inputMode="numeric"
            value={costDisplay}
            onChange={(e) => {
              const raw = e.target.value;
              setCostDisplay(raw);
              const stripped = raw.replace(/,/g, '').trim();
              if (stripped === '') { onUpdate({ estimatedCost: null }); return; }
              if (/^\d*\.?\d*$/.test(stripped)) onUpdate({ estimatedCost: stripped });
            }}
            onBlur={() => setCostDisplay(formatCost(element.estimatedCost))}
            placeholder="0"
          />
        </div>
      </div>

      {/* Tier 3: collapsed by default */}
      <div className="border rounded-lg border-border/40">
        <button
          type="button"
          onClick={() => setTier3Open((o) => !o)}
          className="flex w-full items-center justify-between px-3 py-2 text-left hover:bg-muted/30 transition-colors rounded-lg"
        >
          <span className="font-mono text-[10px] uppercase tracking-[0.1em] text-muted-foreground">
            Advanced Dictionary
          </span>
          <ChevronDownIcon
            className={cn('size-3.5 text-muted-foreground transition-transform duration-150', tier3Open && 'rotate-180')}
          />
        </button>
        {tier3Open && (
          <div className="grid gap-3 sm:grid-cols-2 px-3 pb-3">
            {[
              { key: 'milestones', label: 'Milestones', hint: 'Key dates for this deliverable' },
              { key: 'resourcesRequired', label: 'Resources Required', hint: 'People, tools, materials needed' },
              { key: 'qualityRequirements', label: 'Quality Requirements', hint: 'Standards this deliverable must meet' },
              { key: 'assumptionsConstraints', label: 'Assumptions & Constraints', hint: 'Specific to this work package' },
            ].map(({ key, label, hint }) => (
              <div key={key} className="flex flex-col gap-1">
                <Label className="text-[10px] font-mono uppercase tracking-[0.1em] text-muted-foreground">
                  {label}
                </Label>
                <p className="text-[10px] text-muted-foreground/50">{hint}</p>
                <Textarea
                  className="min-h-[56px] resize-none text-xs"
                  value={d[key as keyof typeof d] ?? ''}
                  onChange={(e) =>
                    onUpdate({
                      dictionaryDetails: { ...d, [key]: e.target.value },
                    })
                  }
                  placeholder={`Enter ${label.toLowerCase()}...`}
                />
              </div>
            ))}
          </div>
        )}
      </div>

      <p className="font-mono text-[10px] text-muted-foreground/40 text-center">
        Fill Tier 3 fields to unlock the Full Scope Baseline Report
      </p>
    </div>
  );
}
