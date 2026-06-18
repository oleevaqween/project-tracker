'use client';

import * as React from 'react';
import { toast } from 'sonner';
import {
  ArrowLeftIcon,
  PrinterIcon,
  SaveIcon,
  Loader2Icon,
  SparklesIcon,
  FileTextIcon,
  FileIcon,
  CalendarIcon,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { cn } from '@/lib/utils';
import { REPORT_DEFINITIONS, type ReportType, type ReportReadiness } from '@/lib/reports/types';
import { computeReadiness } from '@/lib/reports/readiness';
import { updateProject } from '@/actions/projects';

// ── Types ────────────────────────────────────────────────────────────────────

type ProjectSnap = {
  id: number;
  name?: string | null;
  description?: string | null;
  charter?: Record<string, unknown> | null;
  startDate?: Date | null;
  targetEndDate?: Date | null;
  baselineStartDate?: Date | null;
  baselineEndDate?: Date | null;
  budget?: string | null;
  budgetSpent?: string | null;
  progressPercent?: number | null;
  qualityMetrics?: Record<string, unknown> | null;
};

type GanttTask = {
  id: number;
  title: string;
  status: string;
  startDate?: Date | null;
  dueDate?: Date | null;
};

type DataSnap = {
  tasks: {
    id?: number;
    title?: string;
    status?: string;
    startDate?: Date | null;
    dueDate?: Date | null;
    estimatedHours?: string | null;
    actualHours?: string | null;
  }[];
  risks: { probability?: number | null; impact?: number | null; responseAction?: string | null; owner?: string | null }[];
  stakeholders: { influence?: number | null; interest?: number | null; engagementStrategy?: string | null; communicationPlan?: string | null }[];
  changeRequests: { impactDescription?: string | null }[];
  lessonsLearned: { recommendation?: string | null }[];
  issues: { impact?: string | null; owner?: string | null }[];
};

interface ReportsTabProps {
  projectId: number;
  project: ProjectSnap;
  data: DataSnap;
  onProjectUpdated?: (updates: Partial<ProjectSnap>) => void;
}

// ── Readiness Badge ──────────────────────────────────────────────────────────

function ReadinessBadge({ readiness }: { readiness: ReportReadiness }) {
  const config = {
    basic:    { label: 'Basic',    cls: 'bg-red-500/10 text-red-600 dark:text-red-400 border-red-500/20' },
    standard: { label: 'Standard', cls: 'bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/20' },
    rich:     { label: 'Rich',     cls: 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20' },
  }[readiness.tier];

  return (
    <div className="flex items-center gap-2">
      <div className="flex-1 h-1.5 rounded-full bg-muted overflow-hidden">
        <div
          className={cn(
            'h-full rounded-full transition-all',
            readiness.tier === 'basic' ? 'bg-red-500' :
            readiness.tier === 'standard' ? 'bg-amber-500' : 'bg-emerald-500',
          )}
          style={{ width: `${readiness.score}%` }}
        />
      </div>
      <span className={cn('inline-flex items-center rounded-full border px-1.5 py-0.5 text-[10px] font-semibold shrink-0', config.cls)}>
        {config.label}
      </span>
    </div>
  );
}

// ── Markdown Renderer ────────────────────────────────────────────────────────

function MarkdownContent({ content }: { content: string }) {
  const lines = content.split('\n');

  return (
    <div className="space-y-1 text-sm leading-relaxed print:text-black">
      {lines.map((line, i) => {
        if (line.startsWith('## ')) {
          return (
            <h2 key={i} className="text-base font-bold mt-5 mb-1 text-foreground print:text-black">
              {renderInline(line.slice(3))}
            </h2>
          );
        }
        if (line.startsWith('### ')) {
          return (
            <h3 key={i} className="text-sm font-semibold mt-3 mb-0.5 text-foreground print:text-black">
              {renderInline(line.slice(4))}
            </h3>
          );
        }
        if (line === '---') {
          return <hr key={i} className="my-3 border-border print:border-gray-300" />;
        }
        if (line.startsWith('- ')) {
          return (
            <div key={i} className="flex gap-2 pl-2">
              <span className="mt-1.5 size-1.5 rounded-full bg-muted-foreground/50 shrink-0" />
              <span className="text-muted-foreground print:text-gray-700">{renderInline(line.slice(2))}</span>
            </div>
          );
        }
        if (/^\d+\.\s/.test(line)) {
          const num = line.match(/^(\d+)\./)?.[1];
          return (
            <div key={i} className="flex gap-2 pl-2">
              <span className="shrink-0 font-mono text-xs text-muted-foreground/70 w-4">{num}.</span>
              <span className="text-muted-foreground print:text-gray-700">{renderInline(line.replace(/^\d+\.\s/, ''))}</span>
            </div>
          );
        }
        if (line.trim() === '') {
          return <div key={i} className="h-1" />;
        }
        return (
          <p key={i} className="text-muted-foreground print:text-gray-700">
            {renderInline(line)}
          </p>
        );
      })}
    </div>
  );
}

function renderInline(text: string): React.ReactNode {
  const parts: React.ReactNode[] = [];
  const regex = /\*\*(.+?)\*\*/g;
  let last = 0;
  let match;
  while ((match = regex.exec(text)) !== null) {
    if (match.index > last) parts.push(text.slice(last, match.index));
    parts.push(<strong key={match.index} className="font-semibold text-foreground print:text-black">{match[1]}</strong>);
    last = match.index + match[0].length;
  }
  if (last < text.length) parts.push(text.slice(last));
  return parts.length === 1 && typeof parts[0] === 'string' ? parts[0] : <>{parts}</>;
}

// ── Schedule Baseline Strip ──────────────────────────────────────────────────

function BaselineStrip({ project, onProjectUpdated }: { project: ProjectSnap; onProjectUpdated?: (updates: Partial<ProjectSnap>) => void }) {
  const [saving, setSaving] = React.useState(false);

  async function handleSetBaseline() {
    if (!project.startDate && !project.targetEndDate) {
      toast.error('Set a project start date and target end date before setting a baseline.');
      return;
    }
    setSaving(true);
    try {
      const baselineStartDate = project.startDate ?? undefined;
      const baselineEndDate = project.targetEndDate ?? undefined;
      await updateProject(project.id, { baselineStartDate, baselineEndDate });
      toast.success('Schedule baseline set');
      onProjectUpdated?.({ baselineStartDate: baselineStartDate ?? null, baselineEndDate: baselineEndDate ?? null });
    } catch {
      toast.error('Failed to set baseline');
    } finally {
      setSaving(false);
    }
  }

  const hasBaseline = project.baselineStartDate != null;
  const fmt = (d: Date | null | undefined) =>
    d ? new Date(d).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' }) : '—';

  return (
    <div className="flex items-center justify-between gap-3 rounded-lg border bg-muted/30 px-4 py-3">
      <div className="flex items-center gap-2">
        <CalendarIcon className="size-4 text-muted-foreground shrink-0" />
        {hasBaseline ? (
          <div>
            <p className="text-xs font-semibold">Schedule Baseline Active</p>
            <p className="text-[11px] text-muted-foreground">
              {fmt(project.baselineStartDate)} → {fmt(project.baselineEndDate)}
            </p>
          </div>
        ) : (
          <div>
            <p className="text-xs font-semibold">No Schedule Baseline</p>
            <p className="text-[11px] text-muted-foreground">Set a baseline to track schedule variance.</p>
          </div>
        )}
      </div>
      <Button size="sm" variant={hasBaseline ? 'outline' : 'default'} onClick={handleSetBaseline} disabled={saving} className="shrink-0">
        {saving ? 'Saving…' : hasBaseline ? 'Update Baseline' : 'Set Baseline'}
      </Button>
    </div>
  );
}

// ── Gantt Timeline ───────────────────────────────────────────────────────────

const STATUS_COLORS: Record<string, string> = {
  done: 'bg-emerald-500',
  in_progress: 'bg-amber-500',
  review: 'bg-blue-400',
  todo: 'bg-muted-foreground/30',
};

function GanttTimeline({ project, tasks }: { project: ProjectSnap; tasks: GanttTask[] }) {
  const start = project.startDate ? new Date(project.startDate) : null;
  const end = project.targetEndDate ? new Date(project.targetEndDate) : null;

  if (!start || !end || end <= start) {
    return (
      <div className="rounded-lg border-2 border-dashed p-6 text-center text-xs text-muted-foreground">
        Set a project start date and target end date to see the Gantt timeline.
      </div>
    );
  }

  const totalMs = end.getTime() - start.getTime();
  const today = new Date();
  const todayPct = Math.max(0, Math.min(100, ((today.getTime() - start.getTime()) / totalMs) * 100));

  const baseline = project.baselineStartDate && project.baselineEndDate
    ? {
        left: Math.max(0, ((new Date(project.baselineStartDate).getTime() - start.getTime()) / totalMs) * 100),
        width: Math.max(0, Math.min(100, ((new Date(project.baselineEndDate).getTime() - new Date(project.baselineStartDate).getTime()) / totalMs) * 100)),
      }
    : null;

  const tasksWithDates = tasks.filter((t) => t.dueDate || t.startDate);

  const pct = (d: Date) => Math.max(0, Math.min(100, ((d.getTime() - start.getTime()) / totalMs) * 100));

  return (
    <div className="space-y-2">
      <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">Schedule Timeline</p>

      {/* Project bar */}
      <div className="relative h-8 rounded-lg bg-muted/40 border overflow-hidden">
        <div className="absolute inset-0 flex items-center px-3">
          <div className="relative h-3 w-full rounded-full bg-muted">
            <div className="absolute inset-0 rounded-full bg-primary/20" />
            {baseline && (
              <div
                className="absolute top-0 h-full rounded-full border-2 border-dashed border-primary/40 bg-transparent"
                style={{ left: `${baseline.left}%`, width: `${baseline.width}%` }}
              />
            )}
            {/* Today marker */}
            <div
              className="absolute top-[-4px] h-5 w-0.5 bg-red-500 z-10"
              style={{ left: `${todayPct}%` }}
              title={`Today: ${today.toLocaleDateString()}`}
            />
          </div>
        </div>
        <div className="absolute inset-0 flex items-center justify-between px-3 text-[10px] text-muted-foreground pointer-events-none">
          <span>{new Date(start).toLocaleDateString('en-GB', { day: 'numeric', month: 'short' })}</span>
          <span className="text-[10px] font-medium">Project Timeline</span>
          <span>{new Date(end).toLocaleDateString('en-GB', { day: 'numeric', month: 'short' })}</span>
        </div>
      </div>

      {/* Task bars */}
      {tasksWithDates.length > 0 ? (
        <div className="space-y-1.5 pt-1">
          {tasksWithDates.map((task) => {
            const taskStart = task.startDate ? new Date(task.startDate) : start;
            const taskEnd = task.dueDate ? new Date(task.dueDate) : taskStart;
            const leftPct = pct(taskStart);
            const widthPct = Math.max(1, pct(taskEnd) - leftPct);
            const barColor = STATUS_COLORS[task.status] ?? 'bg-muted-foreground/30';

            return (
              <div key={task.id} className="flex items-center gap-2">
                <div className="w-32 shrink-0 truncate text-[11px] text-muted-foreground text-right" title={task.title}>
                  {task.title}
                </div>
                <div className="relative flex-1 h-5 rounded bg-muted/40">
                  <div
                    className={cn('absolute top-0.5 h-4 rounded', barColor)}
                    style={{ left: `${leftPct}%`, width: `${widthPct}%` }}
                    title={`${task.status}: ${task.startDate ? new Date(task.startDate).toLocaleDateString() : '—'} → ${task.dueDate ? new Date(task.dueDate).toLocaleDateString() : '—'}`}
                  />
                  {/* Today marker on task row */}
                  <div
                    className="absolute top-0 h-full w-px bg-red-400/50"
                    style={{ left: `${todayPct}%` }}
                  />
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        <p className="text-[11px] text-muted-foreground/60 py-2">
          Add start and due dates to tasks to see them on the timeline.
        </p>
      )}
    </div>
  );
}

// ── Main Component ───────────────────────────────────────────────────────────

export function ReportsTab({ projectId, project, data, onProjectUpdated }: ReportsTabProps) {
  const [view, setView] = React.useState<'grid' | 'report'>('grid');
  const [activeType, setActiveType] = React.useState<ReportType | null>(null);
  const [streaming, setStreaming] = React.useState(false);
  const [content, setContent] = React.useState('');
  const [generateError, setGenerateError] = React.useState<string | null>(null);
  const [savedAt, setSavedAt] = React.useState<Date | null>(null);
  const contentRef = React.useRef<HTMLDivElement>(null);

  async function handleGenerate(type: ReportType) {
    setActiveType(type);
    setContent('');
    setGenerateError(null);
    setSavedAt(null);
    setView('report');
    setStreaming(true);

    try {
      const res = await fetch('/api/reports/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ projectId, reportType: type }),
      });

      if (!res.ok) {
        const err = await res.json().catch(() => ({ error: 'Failed to generate' }));
        throw new Error(err.error ?? 'Failed to generate');
      }

      const reader = res.body?.getReader();
      const decoder = new TextDecoder();
      if (!reader) throw new Error('No stream');

      let accumulated = '';
      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        accumulated += decoder.decode(value, { stream: true });
        setContent(accumulated);
      }

      if (!accumulated.trim()) {
        setGenerateError('The AI returned no content. Check your AI provider settings in Settings, then try again.');
        setContent('');
      }
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Failed to generate');
      setGenerateError(err instanceof Error ? err.message : 'Failed to generate');
    } finally {
      setStreaming(false);
    }
  }

  async function handleSave() {
    if (!activeType || !content) return;
    try {
      await fetch('/api/reports/save', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ projectId, reportType: activeType, content }),
      });
      setSavedAt(new Date());
      toast.success('Saved');
    } catch {
      toast.error('Failed to save');
    }
  }

  const activeDefinition = REPORT_DEFINITIONS.find((r) => r.type === activeType);
  const isDocument = activeDefinition?.category === 'document';

  // ── Report / Document view ──

  if (view === 'report') {
    return (
      <div className="space-y-4">
        <div className="flex items-center justify-between gap-3 print:hidden">
          <button
            onClick={() => { setView('grid'); setActiveType(null); setContent(''); setGenerateError(null); }}
            className="flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors"
          >
            <ArrowLeftIcon className="size-4" />
            {isDocument ? 'All Documents & Reports' : 'All Documents & Reports'}
          </button>
          <div className="flex items-center gap-2">
            {savedAt && (
              <span className="text-xs text-muted-foreground">Saved {savedAt.toLocaleTimeString()}</span>
            )}
            <Button variant="outline" size="sm" className="gap-1.5" onClick={handleSave} disabled={streaming || !content}>
              <SaveIcon className="size-3.5" />
              Save
            </Button>
            <Button variant="outline" size="sm" className="gap-1.5" onClick={() => window.print()} disabled={streaming || !content}>
              <PrinterIcon className="size-3.5" />
              Print / PDF
            </Button>
          </div>
        </div>

        <Card ref={contentRef} className="print:shadow-none print:border-none">
          <CardHeader className="print:pb-2">
            <div className="flex items-center gap-2">
              {isDocument ? (
                <FileIcon className="size-5 text-primary print:hidden" />
              ) : (
                <FileTextIcon className="size-5 text-primary print:hidden" />
              )}
              <CardTitle className="text-lg">{activeDefinition?.title}</CardTitle>
              {streaming && <Loader2Icon className="size-4 animate-spin text-muted-foreground ml-auto print:hidden" />}
            </div>
            <CardDescription className="print:hidden">
              PMBOK 8 · {activeDefinition?.pmbok8Domain} Domain · {isDocument ? 'Document' : 'Report'}
            </CardDescription>
          </CardHeader>
          <CardContent>
            {content ? (
              <MarkdownContent content={content} />
            ) : streaming ? (
              <div className="flex items-center gap-2 text-sm text-muted-foreground py-8 justify-center">
                <Loader2Icon className="size-4 animate-spin" />
                {isDocument ? 'Generating document…' : 'Generating report…'}
              </div>
            ) : generateError ? (
              <div className="flex flex-col items-center gap-3 py-10 text-center">
                <p className="text-sm text-muted-foreground max-w-sm">{generateError}</p>
                <Button size="sm" variant="outline" onClick={() => activeType && handleGenerate(activeType)} className="gap-1.5">
                  <SparklesIcon className="size-3.5" />
                  Try Again
                </Button>
              </div>
            ) : null}
          </CardContent>
        </Card>
      </div>
    );
  }

  // ── Grid view ──

  const documents = REPORT_DEFINITIONS.filter((d) => d.category === 'document');
  const reports = REPORT_DEFINITIONS.filter((d) => d.category === 'report');
  const ganttTasks: GanttTask[] = data.tasks
    .filter((t) => t.id != null)
    .map((t) => ({
      id: t.id!,
      title: t.title ?? 'Untitled',
      status: t.status ?? 'todo',
      startDate: t.startDate,
      dueDate: t.dueDate,
    }));

  return (
    <div className="space-y-6">
      {/* Baseline strip */}
      <BaselineStrip project={project} onProjectUpdated={onProjectUpdated} />

      {/* Gantt timeline */}
      <GanttTimeline project={project} tasks={ganttTasks} />

      <div className="border-t border-border/50" />

      {/* Documents section */}
      <section className="space-y-3">
        <div className="flex items-center gap-2">
          <FileIcon className="size-4 text-primary" />
          <h3 className="text-sm font-black uppercase tracking-wider">Project Documents</h3>
          <span className="text-[10px] text-muted-foreground ml-1">PMBOK 8 formal documents</span>
        </div>
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {documents.map((def) => {
            const readiness = computeReadiness(def.type, project, data);
            return (
              <Card key={def.type} className="flex flex-col transition-all hover:border-primary/30 hover:shadow-sm border-primary/20 bg-primary/[0.02]">
                <CardHeader className="pb-2">
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <CardTitle className="text-sm font-semibold">{def.title}</CardTitle>
                      <p className="text-[11px] text-primary/70 font-medium mt-0.5">
                        PMBOK 8 · {def.pmbok8Domain}
                      </p>
                    </div>
                    <FileIcon className="size-4 text-muted-foreground shrink-0 mt-0.5" />
                  </div>
                  <CardDescription className="text-xs mt-1">{def.description}</CardDescription>
                </CardHeader>
                <CardContent className="pt-0 mt-auto flex flex-col gap-3">
                  <ReadinessBadge readiness={readiness} />
                  <Button size="sm" className="gap-1.5 w-full" onClick={() => handleGenerate(def.type)}>
                    <SparklesIcon className="size-3.5" />
                    Generate Document
                  </Button>
                </CardContent>
              </Card>
            );
          })}
        </div>
      </section>

      <div className="border-t border-border/50" />

      {/* Reports section */}
      <section className="space-y-3">
        <div className="flex items-center gap-2">
          <FileTextIcon className="size-4 text-primary" />
          <h3 className="text-sm font-black uppercase tracking-wider">Project Reports</h3>
          <span className="text-[10px] text-muted-foreground ml-1">Generated from live project data</span>
        </div>
        <p className="text-xs text-muted-foreground -mt-1">
          The readiness indicator shows how rich the output will be based on your current data.
        </p>
        <div className="grid gap-3 sm:grid-cols-2">
          {reports.map((def) => {
            const readiness = computeReadiness(def.type, project, data);
            return (
              <Card key={def.type} className="flex flex-col transition-all hover:border-primary/30 hover:shadow-sm">
                <CardHeader className="pb-2">
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <CardTitle className="text-sm font-semibold">{def.title}</CardTitle>
                      <p className="text-[11px] text-primary/70 font-medium mt-0.5">
                        PMBOK 8 · {def.pmbok8Domain} Domain
                      </p>
                    </div>
                    <FileTextIcon className="size-4 text-muted-foreground shrink-0 mt-0.5" />
                  </div>
                  <CardDescription className="text-xs mt-1">{def.description}</CardDescription>
                </CardHeader>
                <CardContent className="pt-0 mt-auto flex flex-col gap-3">
                  <ReadinessBadge readiness={readiness} />
                  {readiness.missingItems.length > 0 && readiness.tier !== 'rich' && (
                    <p className="text-[10px] text-muted-foreground/70 line-clamp-2">
                      Add: {readiness.missingItems.slice(0, 3).join(', ')}
                      {readiness.missingItems.length > 3 ? ` +${readiness.missingItems.length - 3} more` : ''}
                    </p>
                  )}
                  <Button size="sm" className="gap-1.5 w-full" onClick={() => handleGenerate(def.type)}>
                    <SparklesIcon className="size-3.5" />
                    Generate Report
                  </Button>
                </CardContent>
              </Card>
            );
          })}
        </div>
      </section>
    </div>
  );
}
