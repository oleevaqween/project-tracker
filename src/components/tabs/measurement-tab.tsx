'use client';

import * as React from 'react';
import { toast } from 'sonner';
import { TrendingUpIcon, TrendingDownIcon, MinusIcon, InfoIcon } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { updateProject } from '@/actions/projects';
import { formatBudget } from '@/lib/project-helpers';

type Project = typeof import('@/db/schema').projects.$inferSelect;

// EVM metric card
function MetricCard({
  label, value, description, status, formula,
}: {
  label: string;
  value: string;
  description: string;
  status: 'good' | 'warn' | 'bad' | 'neutral';
  formula: string;
}) {
  const [showInfo, setShowInfo] = React.useState(false);
  const cfg = {
    good:    { border: 'border-emerald-500/40', bg: 'bg-emerald-500/5',  text: 'text-emerald-600 dark:text-emerald-400', icon: TrendingUpIcon   },
    warn:    { border: 'border-amber-500/40',   bg: 'bg-amber-500/5',    text: 'text-amber-600 dark:text-amber-400',     icon: MinusIcon        },
    bad:     { border: 'border-rose-500/40',    bg: 'bg-rose-500/5',     text: 'text-rose-600 dark:text-rose-400',       icon: TrendingDownIcon },
    neutral: { border: 'border-border',         bg: 'bg-muted/30',       text: 'text-muted-foreground',                  icon: MinusIcon        },
  }[status];
  const Icon = cfg.icon;

  return (
    <div className={cn('rounded-xl border-2 p-4 space-y-2', cfg.border, cfg.bg)}>
      <div className="flex items-center justify-between gap-2">
        <span className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">{label}</span>
        <button
          type="button"
          onClick={() => setShowInfo((v) => !v)}
          className="text-muted-foreground/40 hover:text-muted-foreground transition-colors"
        >
          <InfoIcon className="size-3.5" />
        </button>
      </div>
      <div className={cn('text-2xl font-black tabular-nums', cfg.text)}>
        {value}
        <Icon className={cn('inline ml-1.5 size-4 align-middle', cfg.text)} />
      </div>
      {showInfo && (
        <div className="text-[11px] text-muted-foreground space-y-0.5 border-t border-border/40 pt-2 mt-2">
          <p><span className="font-mono font-semibold text-foreground/70">{formula}</span></p>
          <p>{description}</p>
        </div>
      )}
    </div>
  );
}

function indexStatus(index: number): 'good' | 'warn' | 'bad' | 'neutral' {
  if (!isFinite(index)) return 'neutral';
  if (index >= 1.0) return 'good';
  if (index >= 0.8) return 'warn';
  return 'bad';
}

function varianceStatus(variance: number): 'good' | 'warn' | 'bad' | 'neutral' {
  if (!isFinite(variance)) return 'neutral';
  if (variance >= 0) return 'good';
  if (variance >= -0.1 * Math.abs(variance + 1)) return 'warn';
  return 'bad';
}

function fmt(n: number, currency: string) {
  return new Intl.NumberFormat('en-US', {
    style: 'currency', currency, maximumFractionDigits: 0,
  }).format(n);
}

function fmtIndex(n: number) {
  if (!isFinite(n)) return '—';
  return n.toFixed(2);
}

// Performance domains self-assessment — PMBOK 8 (7 domains)
const DOMAINS = [
  { key: 'governance',   label: 'Governance',   color: 'from-violet-500 to-violet-400'  },
  { key: 'scope',        label: 'Scope',        color: 'from-sky-500 to-sky-400'        },
  { key: 'schedule',     label: 'Schedule',     color: 'from-amber-500 to-amber-400'    },
  { key: 'finance',      label: 'Finance',      color: 'from-emerald-500 to-emerald-400'},
  { key: 'stakeholders', label: 'Stakeholders', color: 'from-rose-500 to-rose-400'      },
  { key: 'resources',    label: 'Resources',    color: 'from-blue-500 to-blue-400'      },
  { key: 'risk',         label: 'Risk',         color: 'from-orange-500 to-orange-400'  },
] as const;

type DomainKey = typeof DOMAINS[number]['key'];

type PerformanceDomains = Partial<Record<DomainKey, number>>;

function ratingColor(rating: number): string {
  if (rating >= 4) return 'bg-emerald-500/10 border-emerald-500 text-emerald-700 dark:text-emerald-400';
  if (rating >= 3) return 'bg-amber-500/10 border-amber-500 text-amber-700 dark:text-amber-400';
  return 'bg-rose-500/10 border-rose-500 text-rose-700 dark:text-rose-400';
}

function ratingLabel(rating: number | undefined): string {
  if (!rating) return 'Not assessed';
  return ['', 'Critical', 'At Risk', 'Needs Work', 'Good', 'Excellent'][rating] ?? '';
}

function PerformanceDomainsPanel({
  projectId, initial, onSaved,
}: {
  projectId: number;
  initial: PerformanceDomains;
  onSaved?: (domains: PerformanceDomains) => void;
}) {
  const [domains, setDomains] = React.useState<PerformanceDomains>(initial);
  const [saving, setSaving] = React.useState(false);

  React.useEffect(() => { setDomains(initial); }, [initial]);

  async function handleSave() {
    setSaving(true);
    try {
      await updateProject(projectId, { performanceDomains: domains });
      toast.success('Performance domain ratings saved');
      onSaved?.(domains);
    } catch {
      toast.error('Failed to save ratings');
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-sm font-black uppercase tracking-wider">PMBOK 8 Performance Domains</h3>
          <p className="text-xs text-muted-foreground mt-0.5">Self-assessment: rate each domain 1 (Critical) → 5 (Excellent)</p>
        </div>
        <Button size="sm" onClick={handleSave} disabled={saving} className="gap-1.5">
          {saving ? 'Saving…' : 'Save Ratings'}
        </Button>
      </div>

      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        {DOMAINS.map((d) => {
          const rating = domains[d.key] ?? 0;
          return (
            <div key={d.key} className={cn('rounded-xl border-2 p-3 space-y-2', rating ? ratingColor(rating) : 'border-border bg-muted/20')}>
              <div>
                <p className="text-xs font-semibold text-foreground/80">{d.label}</p>
                {rating > 0 && (
                  <p className={cn('text-[11px] font-medium mt-0.5', rating >= 4 ? 'text-emerald-600 dark:text-emerald-400' : rating >= 3 ? 'text-amber-600 dark:text-amber-400' : 'text-rose-600 dark:text-rose-400')}>
                    {ratingLabel(rating)}
                  </p>
                )}
              </div>
              <div className="flex gap-1">
                {[1, 2, 3, 4, 5].map((n) => (
                  <button
                    key={n}
                    type="button"
                    onClick={() => setDomains((prev) => ({ ...prev, [d.key]: n === prev[d.key] ? 0 : n }))}
                    className={cn(
                      'flex-1 h-7 rounded-md border-2 text-xs font-bold transition-all',
                      domains[d.key] === n
                        ? 'border-current bg-current/20 scale-105'
                        : 'border-border bg-background hover:border-primary/50 text-muted-foreground'
                    )}
                  >
                    {n}
                  </button>
                ))}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

// PMBOK 8 Principles self-assessment — 6 principles
const PRINCIPLES = [
  { key: 'holistic',       label: 'Adopt a holistic view',                            desc: 'Consider the broader organisational and environmental context.' },
  { key: 'value',          label: 'Focus on value',                                    desc: 'Continually evaluate and deliver outcomes that create value.' },
  { key: 'quality',        label: 'Embed quality into processes & deliverables',       desc: 'Maintain a focus on quality throughout the project lifecycle.' },
  { key: 'accountable',    label: 'Be an accountable leader',                          desc: 'Demonstrate commitment, integrity, and accountability at all times.' },
  { key: 'sustainability', label: 'Integrate sustainability within all project areas', desc: 'Address short- and long-term sustainability impacts of the project.' },
  { key: 'empowered',      label: 'Build an empowered culture',                        desc: 'Foster a collaborative environment where team members can thrive.' },
] as const;

type PrincipleKey = typeof PRINCIPLES[number]['key'];
type PrinciplesReflection = Partial<Record<PrincipleKey, number>>;

function principleRatingLabel(n: number) {
  return ['', 'Critical', 'At Risk', 'Needs Work', 'Good', 'Excellent'][n] ?? '';
}

function PrinciplesAssessment({
  projectId, initial, onSaved,
}: {
  projectId: number;
  initial: PrinciplesReflection;
  onSaved?: (principles: PrinciplesReflection) => void;
}) {
  const [scores, setScores] = React.useState<PrinciplesReflection>(initial);
  const [saving, setSaving] = React.useState(false);

  React.useEffect(() => { setScores(initial); }, [initial]);

  async function handleSave() {
    setSaving(true);
    try {
      await updateProject(projectId, { principlesReflection: scores });
      toast.success('Principles assessment saved');
      onSaved?.(scores);
    } catch {
      toast.error('Failed to save principles assessment');
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-sm font-black uppercase tracking-wider">PMBOK 8 Principles Self-Assessment</h3>
          <p className="text-xs text-muted-foreground mt-0.5">Rate each principle 1 (Critical) → 5 (Excellent) based on how well the project is applying it.</p>
        </div>
        <Button size="sm" onClick={handleSave} disabled={saving} className="gap-1.5">
          {saving ? 'Saving…' : 'Save Assessment'}
        </Button>
      </div>

      <div className="space-y-3">
        {PRINCIPLES.map((p) => {
          const score = scores[p.key] ?? 0;
          return (
            <div key={p.key} className="flex items-center gap-3">
              <div className="flex-1 min-w-0">
                <p className="text-xs font-medium truncate">{p.label}</p>
                <p className="text-[10px] text-muted-foreground truncate">{p.desc}</p>
              </div>
              <div className="flex items-center gap-1 shrink-0">
                {[1, 2, 3, 4, 5].map((n) => (
                  <button
                    key={n}
                    type="button"
                    title={principleRatingLabel(n)}
                    onClick={() => setScores((prev) => ({ ...prev, [p.key]: n === prev[p.key] ? 0 : n }))}
                    className={cn(
                      'size-7 rounded-md border-2 text-xs font-bold transition-all',
                      scores[p.key] === n
                        ? n >= 4 ? 'border-emerald-500 bg-emerald-500/20 text-emerald-700 dark:text-emerald-400'
                          : n >= 3 ? 'border-amber-500 bg-amber-500/20 text-amber-700 dark:text-amber-400'
                          : 'border-rose-500 bg-rose-500/20 text-rose-700 dark:text-rose-400'
                        : 'border-border bg-background hover:border-primary/50 text-muted-foreground'
                    )}
                  >
                    {n}
                  </button>
                ))}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

// Main tab
export function MeasurementTab({
  project,
  onProjectUpdated,
}: {
  project: Project;
  onProjectUpdated?: (updates: Partial<Project>) => void;
}) {
  const [pvInput, setPvInput] = React.useState(
    project.plannedValue ? String(project.plannedValue) : ''
  );
  const [savingPv, setSavingPv] = React.useState(false);

  // Sync pvInput when parent project state changes (e.g. after tab switch)
  React.useEffect(() => {
    setPvInput(project.plannedValue ? String(project.plannedValue) : '');
  }, [project.plannedValue]);

  const BAC = Number(project.budget ?? 0);
  const AC  = Number(project.budgetSpent ?? 0);
  const PV  = Number(pvInput || 0);
  const EV  = BAC > 0 ? ((project.progressPercent ?? 0) / 100) * BAC : 0;
  const currency = project.currency ?? 'USD';

  const SPI = PV > 0 ? EV / PV : NaN;
  const CPI = AC > 0 ? EV / AC : NaN;
  const SV  = PV > 0 ? EV - PV : NaN;
  const CV  = AC > 0 ? EV - AC : NaN;
  const EAC = CPI > 0 ? BAC / CPI : NaN;
  const ETC = isFinite(EAC) ? EAC - AC : NaN;
  const VAC = isFinite(EAC) ? BAC - EAC : NaN;

  const hasEvm = BAC > 0;

  async function savePv() {
    setSavingPv(true);
    try {
      await updateProject(project.id, { plannedValue: pvInput || null });
      toast.success('Planned Value saved');
      onProjectUpdated?.({ plannedValue: pvInput || null });
    } catch {
      toast.error('Failed to save Planned Value');
    } finally {
      setSavingPv(false);
    }
  }

  return (
    <div className="space-y-8">
      {/* EVM Section */}
      <section className="space-y-4">
        <div>
          <h3 className="text-sm font-black uppercase tracking-wider">Earned Value Management</h3>
          <p className="text-xs text-muted-foreground mt-0.5">PMBOK 8 Measurement Performance Domain</p>
        </div>

        {!hasEvm ? (
          <div className="rounded-xl border-2 border-dashed border-border p-8 text-center text-sm text-muted-foreground">
            Set a project budget in Project Settings to enable EVM calculations.
          </div>
        ) : (
          <>
            {/* Inputs */}
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
              {[
                { label: 'BAC (Budget at Completion)', value: fmt(BAC, currency), note: 'From project budget (baseline)' },
                { label: 'AC (Actual Cost)',            value: fmt(AC, currency),  note: 'From Budget Spent field' },
                { label: 'EV (Earned Value)',           value: fmt(EV, currency),  note: `${project.progressPercent ?? 0}% × BAC` },
              ].map((item) => (
                <div key={item.label} className="rounded-xl border-2 border-border bg-muted/20 p-4">
                  <p className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">{item.label}</p>
                  <p className="text-xl font-black tabular-nums mt-1">{item.value}</p>
                  <p className="text-[10px] text-muted-foreground mt-1">{item.note}</p>
                </div>
              ))}

              {/* PV input */}
              <div className="rounded-xl border-2 border-primary/30 bg-primary/5 p-4 space-y-2">
                <p className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">PV (Planned Value)</p>
                <p className="text-[10px] text-muted-foreground">
                  Budget approved for work scheduled to be done by today. Formula: Budget × (elapsed days ÷ total project days). E.g. a project 40% through its timeline with a {fmt(50000, currency)} budget → enter {fmt(20000, currency)}.
                </p>
                <div className="flex gap-2">
                  <Input
                    type="number"
                    min="0"
                    step="1000"
                    placeholder="0"
                    value={pvInput}
                    onChange={(e) => setPvInput(e.target.value)}
                    className="h-8 text-sm"
                  />
                  <Button size="sm" onClick={savePv} disabled={savingPv} className="h-8 shrink-0">
                    {savingPv ? '…' : 'Set'}
                  </Button>
                </div>
              </div>
            </div>

            {/* Computed metrics */}
            {PV > 0 && (
              <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
                <MetricCard
                  label="SPI (Schedule Performance Index)"
                  value={fmtIndex(SPI)}
                  description="Are you on schedule? ≥ 1.0 = ahead. 0.85–0.99 = slightly behind — review plan. < 0.85 = significantly behind — corrective action required."
                  status={indexStatus(SPI)}
                  formula="SPI = EV ÷ PV"
                />
                <MetricCard
                  label="CPI (Cost Performance Index)"
                  value={fmtIndex(CPI)}
                  description="Are you within budget? ≥ 1.0 = under budget (good). 0.80–0.99 = slight overrun — monitor closely. < 0.80 = critical overrun — escalate to sponsor."
                  status={indexStatus(CPI)}
                  formula="CPI = EV ÷ AC"
                />
                <MetricCard
                  label="SV (Schedule Variance)"
                  value={isFinite(SV) ? fmt(SV, currency) : '—'}
                  description="Budget value of being ahead or behind schedule. Positive = ahead of plan. Negative = behind — identify delayed tasks and recover."
                  status={varianceStatus(SV)}
                  formula="SV = EV − PV"
                />
                <MetricCard
                  label="CV (Cost Variance)"
                  value={isFinite(CV) ? fmt(CV, currency) : '—'}
                  description="How much you are over or under budget for work completed. Positive = under budget. Negative = over budget — review actual spend."
                  status={varianceStatus(CV)}
                  formula="CV = EV − AC"
                />
                <MetricCard
                  label="EAC (Estimate at Completion)"
                  value={isFinite(EAC) ? fmt(EAC, currency) : '—'}
                  description="Projected final cost if current spending efficiency continues. If EAC > BAC, you will likely overrun your budget."
                  status={isFinite(EAC) ? (EAC <= BAC ? 'good' : 'bad') : 'neutral'}
                  formula="EAC = BAC ÷ CPI"
                />
                <MetricCard
                  label="ETC (Estimate to Complete)"
                  value={isFinite(ETC) ? fmt(ETC, currency) : '—'}
                  description="How much more money is needed to finish the project from today, based on current CPI."
                  status="neutral"
                  formula="ETC = EAC − AC"
                />
                <MetricCard
                  label="VAC (Variance at Completion)"
                  value={isFinite(VAC) ? fmt(VAC, currency) : '—'}
                  description="Expected budget surplus (positive) or overrun (negative) when project closes. Share with sponsor if negative."
                  status={isFinite(VAC) ? (VAC >= 0 ? 'good' : 'bad') : 'neutral'}
                  formula="VAC = BAC − EAC"
                />
              </div>
            )}

            {PV === 0 && (
              <p className="text-xs text-muted-foreground">
                Set Planned Value above to compute SPI, CPI, and variance metrics.
              </p>
            )}
          </>
        )}
      </section>

      <div className="border-t border-border/50" />

      {/* Performance Domains */}
      <PerformanceDomainsPanel
        projectId={project.id}
        initial={(project.performanceDomains as PerformanceDomains) ?? {}}
        onSaved={(domains) => onProjectUpdated?.({ performanceDomains: domains })}
      />

      <div className="border-t border-border/50" />

      {/* Principles Assessment */}
      <PrinciplesAssessment
        projectId={project.id}
        initial={(project.principlesReflection as PrinciplesReflection) ?? {}}
        onSaved={(principles) => onProjectUpdated?.({ principlesReflection: principles })}
      />
    </div>
  );
}
