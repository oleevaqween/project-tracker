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
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { cn } from '@/lib/utils';
import { REPORT_DEFINITIONS, type ReportType, type ReportReadiness } from '@/lib/reports/types';
import { computeReadiness } from '@/lib/reports/readiness';
import { db } from '@/db';

// ── Types ────────────────────────────────────────────────────────────────────

type ProjectSnap = {
  id: number;
  description?: string | null;
  charter?: Record<string, unknown> | null;
  startDate?: Date | null;
  targetEndDate?: Date | null;
  budget?: string | null;
  budgetSpent?: string | null;
  baselineStartDate?: Date | null;
  baselineEndDate?: Date | null;
  qualityMetrics?: Record<string, unknown> | null;
};

type DataSnap = {
  tasks: { estimatedHours?: string | null; actualHours?: string | null; dueDate?: Date | null }[];
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

// ── Main Component ───────────────────────────────────────────────────────────

export function ReportsTab({ projectId, project, data }: ReportsTabProps) {
  const [view, setView] = React.useState<'grid' | 'report'>('grid');
  const [activeType, setActiveType] = React.useState<ReportType | null>(null);
  const [streaming, setStreaming] = React.useState(false);
  const [content, setContent] = React.useState('');
  const [savedAt, setSavedAt] = React.useState<Date | null>(null);
  const contentRef = React.useRef<HTMLDivElement>(null);

  async function handleGenerate(type: ReportType) {
    setActiveType(type);
    setContent('');
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
        const err = await res.json().catch(() => ({ error: 'Failed to generate report' }));
        throw new Error(err.error ?? 'Failed to generate report');
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
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Failed to generate report');
      setView('grid');
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
      toast.success('Report saved');
    } catch {
      toast.error('Failed to save report');
    }
  }

  function handlePrint() {
    window.print();
  }

  const activeDefinition = REPORT_DEFINITIONS.find((r) => r.type === activeType);

  // ── Report view ──

  if (view === 'report') {
    return (
      <div className="space-y-4">
        {/* Toolbar */}
        <div className="flex items-center justify-between gap-3 print:hidden">
          <button
            onClick={() => { setView('grid'); setActiveType(null); setContent(''); }}
            className="flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors"
          >
            <ArrowLeftIcon className="size-4" />
            All Reports
          </button>
          <div className="flex items-center gap-2">
            {savedAt && (
              <span className="text-xs text-muted-foreground">
                Saved {savedAt.toLocaleTimeString()}
              </span>
            )}
            <Button variant="outline" size="sm" className="gap-1.5" onClick={handleSave} disabled={streaming || !content}>
              <SaveIcon className="size-3.5" />
              Save
            </Button>
            <Button variant="outline" size="sm" className="gap-1.5" onClick={handlePrint} disabled={streaming || !content}>
              <PrinterIcon className="size-3.5" />
              Print / Export PDF
            </Button>
          </div>
        </div>

        {/* Report content */}
        <Card ref={contentRef} className="print:shadow-none print:border-none">
          <CardHeader className="print:pb-2">
            <div className="flex items-center gap-2">
              <FileTextIcon className="size-5 text-primary print:hidden" />
              <CardTitle className="text-lg">{activeDefinition?.title}</CardTitle>
              {streaming && <Loader2Icon className="size-4 animate-spin text-muted-foreground ml-auto print:hidden" />}
            </div>
            <CardDescription className="print:hidden">
              PMBOK 8 {activeDefinition?.pmbok8Domain} Domain
            </CardDescription>
          </CardHeader>
          <CardContent>
            {content ? (
              <MarkdownContent content={content} />
            ) : streaming ? (
              <div className="flex items-center gap-2 text-sm text-muted-foreground py-8 justify-center">
                <Loader2Icon className="size-4 animate-spin" />
                Generating report…
              </div>
            ) : null}
          </CardContent>
        </Card>
      </div>
    );
  }

  // ── Grid view ──

  return (
    <div className="space-y-4">
      <div>
        <p className="text-sm text-muted-foreground">
          Generate any PMBOK 8 report from your live project data. The readiness indicator shows how rich the output will be based on your current data.
        </p>
      </div>

      <div className="grid gap-3 sm:grid-cols-2">
        {REPORT_DEFINITIONS.map((def) => {
          const readiness = computeReadiness(def.type, project, data);
          return (
            <Card
              key={def.type}
              className="flex flex-col transition-all hover:border-primary/30 hover:shadow-sm"
            >
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
                <Button
                  size="sm"
                  className="gap-1.5 w-full"
                  onClick={() => handleGenerate(def.type)}
                >
                  <SparklesIcon className="size-3.5" />
                  Generate
                </Button>
              </CardContent>
            </Card>
          );
        })}
      </div>
    </div>
  );
}
