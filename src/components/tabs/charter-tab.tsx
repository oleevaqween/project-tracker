'use client';

import * as React from 'react';
import { useRouter } from 'next/navigation';
import { experimental_useObject as useObject } from '@ai-sdk/react';
import { z } from 'zod';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { toast } from 'sonner';
import { SparklesIcon, SaveIcon, Loader2Icon, ScrollTextIcon } from 'lucide-react';
import { saveCharter, type CharterData } from '@/actions/charter';
import { cn } from '@/lib/utils';

type Project = typeof import('@/db/schema').projects.$inferSelect;

const charterSchema = z.object({
  projectPurpose: z.string().optional(),
  objectives: z.string().optional(),
  scopeSummary: z.string().optional(),
  deliverables: z.string().optional(),
  acceptanceCriteria: z.string().optional(),
  assumptions: z.string().optional(),
  constraints: z.string().optional(),
  scheduleSummary: z.string().optional(),
  stakeholderOverview: z.string().optional(),
  riskApproach: z.string().optional(),
  successMetrics: z.string().optional(),
});

const CHARTER_FIELDS: { key: keyof CharterData; label: string; description: string }[] = [
  { key: 'projectPurpose', label: 'Project Purpose', description: 'Why this project exists and what problem it solves' },
  { key: 'objectives', label: 'Objectives', description: 'Measurable SMART objectives' },
  { key: 'scopeSummary', label: 'Scope Summary', description: 'In scope and explicitly out of scope' },
  { key: 'deliverables', label: 'Deliverables', description: 'Concrete outputs the project will produce' },
  { key: 'acceptanceCriteria', label: 'Acceptance Criteria', description: 'How success will be measured for each deliverable' },
  { key: 'assumptions', label: 'Assumptions', description: 'Key assumptions the plan is based on' },
  { key: 'constraints', label: 'Constraints', description: 'Known time, budget, resource, or technology constraints' },
  { key: 'scheduleSummary', label: 'Schedule Summary', description: 'High-level milestones and estimated timeline' },
  { key: 'stakeholderOverview', label: 'Stakeholder Overview', description: 'Key stakeholder groups and their interests' },
  { key: 'riskApproach', label: 'Risk Approach', description: 'Risk management strategy and top risk categories' },
  { key: 'successMetrics', label: 'Success Metrics', description: 'KPIs that define project success' },
];

export function CharterTab({ project }: { project: Project }) {
  const router = useRouter();
  const existingCharter = (project.charter ?? {}) as CharterData;
  const [fields, setFields] = React.useState<CharterData>(existingCharter);
  const [isSaving, setIsSaving] = React.useState(false);

  const { submit, isLoading, object: streamedCharter } = useObject({
    api: '/api/charter-draft',
    schema: charterSchema,
    onFinish({ object }: { object?: z.infer<typeof charterSchema> }) {
      if (object) {
        setFields((prev) => ({
          ...prev,
          ...(Object.fromEntries(
            Object.entries(object).filter(([, v]) => v && String(v).trim())
          ) as CharterData),
        }));
        toast.success('Charter draft complete');
      }
    },
    onError() {
      toast.error('Failed to draft charter. Check your AI settings.');
    },
  });

  // Merge streamed content into fields while streaming
  React.useEffect(() => {
    if (streamedCharter && isLoading) {
      setFields((prev) => ({
        ...prev,
        ...(Object.fromEntries(
          Object.entries(streamedCharter).filter(([, v]) => v && String(v).trim())
        ) as CharterData),
      }));
    }
  }, [streamedCharter, isLoading]);

  function handleDraftWithAI() {
    submit({
      name: project.name,
      description: project.description,
      category: project.category,
      budget: project.budget,
      startDate: project.startDate?.toISOString(),
      targetEndDate: project.targetEndDate?.toISOString(),
      existingCharter: Object.values(existingCharter).some(v => v) ? existingCharter : undefined,
    });
  }

  async function handleSave() {
    setIsSaving(true);
    try {
      await saveCharter(project.id, fields);
      router.refresh();
      toast.success('Charter saved');
    } catch {
      toast.error('Failed to save charter');
    } finally {
      setIsSaving(false);
    }
  }

  const hasContent = Object.values(fields).some(v => v && String(v).trim().length > 0);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-start justify-between gap-4">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <ScrollTextIcon className="size-5 text-primary" />
            <h2 className="text-lg font-semibold">Project Charter</h2>
          </div>
          <p className="text-sm text-muted-foreground">
            PMBOK 8 Governance domain: Develop Project Charter process
          </p>
        </div>
        <div className="flex gap-2 shrink-0">
          <Button
            variant="outline"
            size="sm"
            onClick={handleDraftWithAI}
            disabled={isLoading}
            className="gap-1.5"
          >
            {isLoading ? (
              <Loader2Icon className="size-3.5 animate-spin" />
            ) : (
              <SparklesIcon className="size-3.5" />
            )}
            {isLoading ? 'Drafting…' : 'Draft with AI'}
          </Button>
          <Button size="sm" onClick={handleSave} disabled={isSaving || !hasContent} className="gap-1.5">
            {isSaving ? <Loader2Icon className="size-3.5 animate-spin" /> : <SaveIcon className="size-3.5" />}
            Save Charter
          </Button>
        </div>
      </div>

      {/* Fields grid */}
      <div className="grid gap-5 md:grid-cols-2">
        {CHARTER_FIELDS.map(({ key, label, description }) => (
          <div
            key={key}
            className={cn(
              'space-y-1.5',
              (key === 'projectPurpose' || key === 'objectives' || key === 'scopeSummary') && 'md:col-span-2',
            )}
          >
            <Label htmlFor={key} className="text-sm font-medium">
              {label}
            </Label>
            <p className="text-xs text-muted-foreground">{description}</p>
            <Textarea
              id={key}
              value={fields[key] ?? ''}
              onChange={(e) => setFields((prev) => ({ ...prev, [key]: e.target.value }))}
              placeholder={isLoading && !fields[key] ? 'Generating…' : `Enter ${label.toLowerCase()}…`}
              className={cn(
                'min-h-[100px] resize-none text-sm transition-colors',
                isLoading && !fields[key] && 'animate-pulse bg-muted/50',
              )}
            />
          </div>
        ))}
      </div>

      {/* Save footer */}
      {hasContent && (
        <div className="flex justify-end pt-2 border-t">
          <Button onClick={handleSave} disabled={isSaving} className="gap-1.5">
            {isSaving ? <Loader2Icon className="size-4 animate-spin" /> : <SaveIcon className="size-4" />}
            Save Charter
          </Button>
        </div>
      )}
    </div>
  );
}
