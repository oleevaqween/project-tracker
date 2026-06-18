'use client';

import * as React from 'react';
import { StaggerContainer, StaggerItem, NumberTicker, Reveal, GradientMesh, LightRays } from '@/components/motion';
import { StatusPieChart, ProgressRing, WeeklyVelocityChart } from '@/components/progress-charts';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { PMBOKGuide } from '@/components/pmbok';
import Link from 'next/link';
import {
  FolderKanbanIcon,
  CheckCircle2Icon,
  ListTodoIcon,
  TrendingUpIcon,
  BriefcaseIcon,
  ShieldAlertIcon,
  AlertTriangleIcon,
} from 'lucide-react';
import { motion } from 'framer-motion';
import { toast } from 'sonner';
import { savePrinciplesReflection } from '@/actions/preferences';
import { cn } from '@/lib/utils';

type PortfolioStat = {
  id: number;
  name: string;
  color: string;
  projectCount: number;
  avgProgress: number;
  activeProjects: number;
  completedProjects: number;
  taskDone: number;
  taskTotal: number;
  openRisks: number;
  highRisks: number;
  totalBudget: number;
};

interface DashboardClientProps {
  displayName: string | null;
  username: string | null;
  totalProjects: number;
  completedProjects: number;
  totalTasks: number;
  completedTasks: number;
  avgProgress: number;
  statusCounts: { status: string; count: number }[];
  weeklyVelocity: { week: string; completed: number; created: number }[];
  portfolioBreakdown: PortfolioStat[];
  unassignedCount: number;
  initialPrinciples: Record<string, number>;
}

// ── PMBOK 8 Principles Scorecard ─────────────────────────────────────────────

const PRINCIPLES = [
  { key: 'holistic',       label: 'Adopt a holistic view',                         desc: 'Consider the broader organisational and environmental context.' },
  { key: 'value',          label: 'Focus on value',                                 desc: 'Continually evaluate and deliver outcomes that create value.' },
  { key: 'quality',        label: 'Embed quality into processes & deliverables',    desc: 'Maintain a focus on quality throughout the project lifecycle.' },
  { key: 'accountable',    label: 'Be an accountable leader',                       desc: 'Demonstrate commitment, integrity, and accountability at all times.' },
  { key: 'sustainability', label: 'Integrate sustainability within all project areas', desc: 'Address short- and long-term sustainability impacts of the project.' },
  { key: 'empowered',      label: 'Build an empowered culture',                     desc: 'Foster a collaborative environment where team members can thrive.' },
] as const;

function ratingLabel(n: number) {
  return ['', 'Critical', 'At Risk', 'Needs Work', 'Good', 'Excellent'][n] ?? '';
}

function PrinciplesScorecard({ initial }: { initial: Record<string, number> }) {
  const [scores, setScores] = React.useState<Record<string, number>>(initial);
  const [saving, setSaving] = React.useState(false);
  const [saved, setSaved] = React.useState(Object.keys(initial).length > 0);
  const [collapsed, setCollapsed] = React.useState(Object.keys(initial).length > 0);

  async function handleSave() {
    setSaving(true);
    try {
      await savePrinciplesReflection(scores);
      toast.success('PMBOK 8 principles assessment saved');
      setSaved(true);
      setCollapsed(true);
    } catch {
      toast.error('Failed to save principles assessment');
    } finally {
      setSaving(false);
    }
  }

  if (collapsed && saved) {
    return (
      <Card className="border-amber-500/20 bg-amber-500/[0.02]">
        <CardContent className="pt-4 pb-3">
          <div className="flex items-center justify-between gap-3 flex-wrap">
            <div className="flex items-center gap-1.5">
              <span className="inline-flex items-center rounded-full bg-amber-500/10 px-2 py-0.5 text-[10px] font-bold text-amber-700 dark:text-amber-400">
                P8
              </span>
              <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">PMBOK 8 Principles</p>
            </div>
            <div className="flex items-center gap-1.5 flex-wrap">
              {PRINCIPLES.map((p) => {
                const score = scores[p.key] ?? 0;
                return score > 0 ? (
                  <span
                    key={p.key}
                    title={p.label}
                    className={cn(
                      'inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-semibold',
                      score >= 4 ? 'bg-emerald-500/10 text-emerald-700 dark:text-emerald-400' :
                      score >= 3 ? 'bg-amber-500/10 text-amber-700 dark:text-amber-400' :
                      'bg-rose-500/10 text-rose-700 dark:text-rose-400'
                    )}
                  >
                    {p.label.split(' ').slice(0, 2).join(' ')} · {score}/5
                  </span>
                ) : null;
              })}
            </div>
            <Button size="sm" variant="ghost" onClick={() => setCollapsed(false)} className="shrink-0 text-xs h-7">
              Re-assess
            </Button>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="border-amber-500/20 bg-amber-500/[0.02]">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="inline-flex items-center rounded-full bg-amber-500/10 px-2 py-0.5 text-[10px] font-bold text-amber-700 dark:text-amber-400">
              P8
            </span>
            <CardTitle className="text-sm font-black uppercase tracking-wider">PMBOK 8 Principles Self-Assessment</CardTitle>
          </div>
          <Button size="sm" onClick={handleSave} disabled={saving} className="shrink-0">
            {saving ? 'Saving…' : 'Save Assessment'}
          </Button>
        </div>
        <p className="text-xs text-muted-foreground mt-0.5">Rate each principle 1 (Critical) → 5 (Excellent) based on how well the project is applying it.</p>
      </CardHeader>
      <CardContent>
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
                      title={ratingLabel(n)}
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
      </CardContent>
    </Card>
  );
}

const KPI_CONFIG = [
  {
    label: 'Total Projects',
    sublabel: '',
    href: '/projects',
    icon: FolderKanbanIcon,
    gradient: 'from-primary/20 via-primary/5 to-transparent',
    border: 'border-primary/20 hover:border-primary/40',
    iconClass: 'text-primary bg-primary/15',
    glow: 'group-hover:shadow-primary/15',
    numberClass: 'text-foreground',
  },
  {
    label: 'Completed',
    sublabel: 'projects finished',
    href: '/projects',
    icon: CheckCircle2Icon,
    gradient: 'from-emerald-500/20 via-emerald-500/5 to-transparent',
    border: 'border-emerald-500/20 hover:border-emerald-500/40',
    iconClass: 'text-emerald-600 bg-emerald-500/15 dark:text-emerald-400',
    glow: 'group-hover:shadow-emerald-500/10',
    numberClass: 'text-foreground',
  },
  {
    label: 'Tasks Done',
    sublabel: 'work completed',
    href: '/tasks',
    icon: ListTodoIcon,
    gradient: 'from-violet-500/20 via-violet-500/5 to-transparent',
    border: 'border-violet-500/20 hover:border-violet-500/40',
    iconClass: 'text-violet-600 bg-violet-500/15 dark:text-violet-400',
    glow: 'group-hover:shadow-violet-500/10',
    numberClass: 'text-foreground',
  },
  {
    label: 'Avg. Progress',
    sublabel: 'across projects',
    href: '/analytics',
    icon: TrendingUpIcon,
    gradient: 'from-sky-500/20 via-sky-500/5 to-transparent',
    border: 'border-sky-500/20 hover:border-sky-500/40',
    iconClass: 'text-sky-600 bg-sky-500/15 dark:text-sky-400',
    glow: 'group-hover:shadow-sky-500/10',
    numberClass: 'text-foreground',
  },
] as const;

function KpiCard({
  label,
  sublabel,
  href,
  value,
  suffix,
  extra,
  icon: Icon,
  gradient,
  border,
  iconClass,
  glow,
  numberClass,
  index,
  featured = false,
}: {
  label: string;
  sublabel: string;
  href: string;
  value: number;
  suffix?: string;
  extra?: React.ReactNode;
  icon: React.ComponentType<{ className?: string }>;
  gradient: string;
  border: string;
  iconClass: string;
  glow: string;
  numberClass: string;
  index: number;
  featured?: boolean;
}) {
  return (
    <StaggerItem>
      <Link href={href} className="block focus:outline-none">
      <motion.div
        className="group relative cursor-pointer"
        whileHover={{ y: -4 }}
        whileTap={{ y: 2 }}
        transition={{ type: 'spring', stiffness: 400, damping: 22 }}
      >
        <div
          className={`relative overflow-hidden rounded-lg border-2 bg-card/80 backdrop-blur-sm transition-all duration-150 ${border} neo-card ${featured ? 'p-6' : 'p-5'}`}
        >
          <div
            className={`pointer-events-none absolute inset-0 bg-gradient-to-br ${gradient} opacity-60 transition-opacity duration-200 group-hover:opacity-90`}
          />

          <div className="relative flex items-start justify-between gap-3">
            <div className="min-w-0">
              {/* ALL-CAPS spaced label — retro-futurist signal */}
              <p className="text-[11px] font-medium uppercase tracking-[0.12em] text-muted-foreground">{label}</p>
              <motion.div
                className="mt-1 flex items-baseline gap-1"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.08 * index, duration: 0.4 }}
              >
                <span className={`font-sans tabular-nums ${featured ? 'text-5xl font-black tracking-[-0.04em]' : 'text-3xl font-black tracking-[-0.025em]'} ${numberClass}`}>
                  <NumberTicker value={value} delay={0.08 * index} />
                </span>
                {suffix && (
                  <span className={`font-semibold text-muted-foreground ${featured ? 'text-base' : 'text-sm'}`}>{suffix}</span>
                )}
              </motion.div>
              {sublabel && <p className="mt-0.5 text-[11px] text-muted-foreground">{sublabel}</p>}
              {extra}
            </div>

            <div className={`shrink-0 rounded-md p-2.5 border-2 border-current/20 ${iconClass}`}>
              <Icon className="size-5" />
            </div>
          </div>
        </div>
      </motion.div>
      </Link>
    </StaggerItem>
  );
}

const PORTFOLIO_COLORS: Record<string, { bg: string; text: string; border: string; bar: string }> = {
  amber:   { bg: 'bg-amber-500/10',   text: 'text-amber-600 dark:text-amber-400',   border: 'border-amber-500/30',   bar: 'bg-amber-500' },
  violet:  { bg: 'bg-violet-500/10',  text: 'text-violet-600 dark:text-violet-400',  border: 'border-violet-500/30',  bar: 'bg-violet-500' },
  emerald: { bg: 'bg-emerald-500/10', text: 'text-emerald-600 dark:text-emerald-400', border: 'border-emerald-500/30', bar: 'bg-emerald-500' },
  sky:     { bg: 'bg-sky-500/10',     text: 'text-sky-600 dark:text-sky-400',     border: 'border-sky-500/30',     bar: 'bg-sky-500' },
  rose:    { bg: 'bg-rose-500/10',    text: 'text-rose-600 dark:text-rose-400',    border: 'border-rose-500/30',    bar: 'bg-rose-500' },
  slate:   { bg: 'bg-slate-500/10',   text: 'text-slate-600 dark:text-slate-400',   border: 'border-slate-500/30',   bar: 'bg-slate-400' },
};

export function DashboardClient({
  displayName,
  username,
  totalProjects,
  completedProjects,
  totalTasks,
  completedTasks,
  avgProgress,
  statusCounts,
  weeklyVelocity,
  portfolioBreakdown,
  unassignedCount,
  initialPrinciples,
}: DashboardClientProps) {
  const firstName = displayName ? displayName.split(' ')[0] : (username ?? null);
  const completionRate = totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0;

  return (
    <div className="relative flex flex-1 flex-col overflow-hidden">

      {/* Persistent ambient atmosphere — very-low-opacity mesh covers the entire
          dashboard content area, not just the hero. Creates warm haze behind
          all cards and charts at ~18% of login-screen intensity. */}
      <GradientMesh className="opacity-[0.18]" speed={22} />

      {/* ── HERO BAND ─────────────────────────────────────────────────────
          Light amber→purple→teal tint gradient (.hero-gradient in globals.css).
          Dark mode automatically switches to a deeper version via .dark selector.
      ─────────────────────────────────────────────────────────────────── */}
      <div className="hero-gradient relative overflow-hidden px-6 pt-8 pb-12 md:px-12 lg:px-16">
        <LightRays />
        <Reveal direction="up">
          <div className="relative grid grid-cols-1 lg:grid-cols-[1fr_auto] items-end gap-6">

            {/* Left: identity block */}
            <div>
              <h1 className="leading-[1.05] text-foreground">
                {firstName ? (
                  <>
                    <span className="block text-sm font-medium text-muted-foreground tracking-normal mb-1">
                      Welcome back,
                    </span>
                    <span className="block text-[clamp(2rem,4.5vw,2.75rem)] font-black font-heading tracking-[-0.025em]">
                      {firstName}
                    </span>
                  </>
                ) : null}
              </h1>
              <p className="mt-1 text-sm text-muted-foreground leading-relaxed">
                {totalProjects === 0
                  ? 'Create a portfolio and your first project to begin PMBOK 8 tracking.'
                  : portfolioBreakdown.length > 0
                    ? `${portfolioBreakdown.length} portfolio${portfolioBreakdown.length !== 1 ? 's' : ''}, ${totalProjects} project${totalProjects !== 1 ? 's' : ''} across your enterprise.`
                    : `${totalProjects} project${totalProjects !== 1 ? 's' : ''} — assign them to portfolios for governance.`}
              </p>
            </div>

            {/* Right: oversized stat — the asymmetric anchor, desktop only */}
            <div className="hidden lg:flex flex-col items-end shrink-0">
              <p className="text-[11px] font-medium uppercase tracking-[0.12em] text-muted-foreground mb-1">
                AVG. PROGRESS
              </p>
              <div className="flex items-baseline gap-1.5">
                <span className="font-sans text-7xl font-black tracking-[-0.04em] text-foreground tabular-nums leading-none">
                  <NumberTicker value={avgProgress} delay={0.2} />
                </span>
                <span className="text-2xl font-bold text-muted-foreground self-end mb-1">%</span>
              </div>
            </div>
          </div>
        </Reveal>

        <div className="absolute bottom-0 left-0 right-0 h-px bg-gradient-to-r from-border via-border/40 to-transparent" />
      </div>

      {/* ── CONTENT ZONE ───────────────────────────────────────────────────
          Distinct padding rhythm from the hero band above.
          Two layout rows below: KPI grid (4-col asymmetric) and
          chart grid (5-col split) — different structures, no two alike.
      ─────────────────────────────────────────────────────────────────── */}
      <div className="flex flex-col gap-6 px-6 pt-6 pb-8 md:px-12 lg:px-16">

        <PMBOKGuide context="dashboard" />

        {/* KPI Cards — first column is 2fr (featured), rest are 1fr.
            On mobile: 2 equal columns.
            On desktop: 2fr + 1fr + 1fr + 1fr — first card is visually dominant. */}
        <StaggerContainer className="grid auto-rows-min gap-4 grid-cols-2 lg:grid-cols-[2fr_1fr_1fr_1fr]">
          <KpiCard
            label={KPI_CONFIG[0].label}
            sublabel={KPI_CONFIG[0].sublabel}
            href={KPI_CONFIG[0].href}
            value={totalProjects}
            icon={KPI_CONFIG[0].icon}
            gradient={KPI_CONFIG[0].gradient}
            border={KPI_CONFIG[0].border}
            iconClass={KPI_CONFIG[0].iconClass}
            glow={KPI_CONFIG[0].glow}
            numberClass={KPI_CONFIG[0].numberClass}
            index={0}
            featured
          />
          <KpiCard
            label={KPI_CONFIG[1].label}
            sublabel={KPI_CONFIG[1].sublabel}
            href={KPI_CONFIG[1].href}
            value={completedProjects}
            icon={KPI_CONFIG[1].icon}
            gradient={KPI_CONFIG[1].gradient}
            border={KPI_CONFIG[1].border}
            iconClass={KPI_CONFIG[1].iconClass}
            glow={KPI_CONFIG[1].glow}
            numberClass={KPI_CONFIG[1].numberClass}
            index={1}
          />
          <KpiCard
            label={KPI_CONFIG[2].label}
            sublabel={KPI_CONFIG[2].sublabel}
            href={KPI_CONFIG[2].href}
            value={completedTasks}
            suffix={totalTasks > 0 ? `/ ${totalTasks}` : undefined}
            icon={KPI_CONFIG[2].icon}
            gradient={KPI_CONFIG[2].gradient}
            border={KPI_CONFIG[2].border}
            iconClass={KPI_CONFIG[2].iconClass}
            glow={KPI_CONFIG[2].glow}
            numberClass={KPI_CONFIG[2].numberClass}
            index={2}
          />
          <KpiCard
            label={KPI_CONFIG[3].label}
            sublabel={KPI_CONFIG[3].sublabel}
            href={KPI_CONFIG[3].href}
            value={avgProgress}
            suffix="%"
            icon={KPI_CONFIG[3].icon}
            gradient={KPI_CONFIG[3].gradient}
            border={KPI_CONFIG[3].border}
            iconClass={KPI_CONFIG[3].iconClass}
            glow={KPI_CONFIG[3].glow}
            numberClass={KPI_CONFIG[3].numberClass}
            index={3}
          />
        </StaggerContainer>

        {/* ── PORTFOLIO HEALTH ─────────────────────────────────────────────
            Enterprise view: one card per portfolio showing its aggregate health.
            Visible only when the user has at least one portfolio.
        ─────────────────────────────────────────────────────────────────── */}
        {portfolioBreakdown.length > 0 && (
          <section>
            <Reveal direction="up">
              <div className="flex items-center justify-between mb-3">
                <p className="text-[11px] font-medium uppercase tracking-[0.12em] text-muted-foreground">
                  Portfolio Health
                </p>
                <Link href="/portfolios" className="text-[11px] font-medium text-primary hover:underline tracking-wide uppercase">
                  View all
                </Link>
              </div>
            </Reveal>
            <StaggerContainer className="grid gap-3 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
              {portfolioBreakdown.map((p) => {
                const c = PORTFOLIO_COLORS[p.color] ?? PORTFOLIO_COLORS.amber;
                const taskPct = p.taskTotal > 0 ? Math.round((p.taskDone / p.taskTotal) * 100) : 0;
                return (
                  <StaggerItem key={p.id}>
                    <Link href={`/portfolios/${p.id}`} className="block focus:outline-none group">
                      <motion.div
                        whileHover={{ y: -3 }}
                        whileTap={{ y: 1 }}
                        transition={{ type: 'spring', stiffness: 400, damping: 22 }}
                      >
                        <div className={`relative rounded-lg border bg-card/70 backdrop-blur-sm p-4 transition-all duration-200 group-hover:bg-card/90 ${c.border}`}>
                          {/* Header row */}
                          <div className="flex items-start justify-between gap-2 mb-3">
                            <div className="flex items-center gap-2 min-w-0">
                              <div className={`shrink-0 rounded-md p-1.5 ${c.bg}`}>
                                <BriefcaseIcon className={`size-3.5 ${c.text}`} />
                              </div>
                              <p className={`font-semibold text-sm truncate group-hover:underline ${c.text}`}>{p.name}</p>
                            </div>
                            {p.highRisks > 0 && (
                              <div className="flex items-center gap-1 shrink-0 text-rose-500">
                                <AlertTriangleIcon className="size-3" />
                                <span className="text-[10px] font-bold">{p.highRisks}</span>
                              </div>
                            )}
                          </div>

                          {/* Progress bar */}
                          <div className="mb-2">
                            <div className="flex items-center justify-between text-[10px] text-muted-foreground mb-1">
                              <span>Avg Progress</span>
                              <span className="font-semibold tabular-nums">{p.avgProgress}%</span>
                            </div>
                            <div className="h-1 rounded-full bg-muted/60 overflow-hidden">
                              <motion.div
                                className={`h-full rounded-full ${c.bar}`}
                                initial={{ width: 0 }}
                                animate={{ width: `${p.avgProgress}%` }}
                                transition={{ duration: 0.7, ease: [0.34, 1.56, 0.64, 1] }}
                              />
                            </div>
                          </div>

                          {/* Stats row */}
                          <div className="flex items-center gap-3 text-[10px] text-muted-foreground flex-wrap">
                            <span className="flex items-center gap-1">
                              <FolderKanbanIcon className="size-3" />
                              {p.projectCount} project{p.projectCount !== 1 ? 's' : ''}
                            </span>
                            <span className="flex items-center gap-1">
                              <CheckCircle2Icon className="size-3" />
                              {p.taskDone}/{p.taskTotal} tasks
                            </span>
                            {p.openRisks > 0 && (
                              <span className="flex items-center gap-1">
                                <ShieldAlertIcon className="size-3" />
                                {p.openRisks} risk{p.openRisks !== 1 ? 's' : ''}
                              </span>
                            )}
                          </div>
                        </div>
                      </motion.div>
                    </Link>
                  </StaggerItem>
                );
              })}

            </StaggerContainer>
          </section>
        )}

        {/* PMBOK 8 Principles Scorecard */}
        <PrinciplesScorecard initial={initialPrinciples} />

        {/* Charts — 5-column grid: Status (col 1–2) | Progress (col 3) | Velocity (col 4–5).
            Explicitly different structure from the 4-col KPI row above.
            Velocity gets more horizontal room to breathe as the data-dense chart. */}
        <StaggerContainer className="grid gap-4 grid-cols-1 lg:grid-cols-5">
          <StaggerItem className="lg:col-span-2">
            <Card className="border-border/50 bg-card/60 backdrop-blur-sm hover:border-border/80 transition-colors h-full">
              <CardHeader className="pb-2">
                <CardTitle className="text-[11px] font-medium uppercase tracking-[0.12em] text-muted-foreground">
                  Project Status
                </CardTitle>
              </CardHeader>
              <CardContent>
                <StatusPieChart statusCounts={statusCounts} />
              </CardContent>
            </Card>
          </StaggerItem>

          <StaggerItem className="lg:col-span-1">
            <Card className="border-border/50 bg-card/60 backdrop-blur-sm hover:border-border/80 transition-colors h-full">
              <CardHeader className="pb-2">
                <CardTitle className="text-[11px] font-medium uppercase tracking-[0.12em] text-muted-foreground">
                  Completion
                </CardTitle>
              </CardHeader>
              <CardContent className="flex flex-col items-center gap-3">
                <ProgressRing value={completionRate} size={120} label="tasks" />
                <p className="text-xs text-muted-foreground text-center">
                  {completedTasks} of {totalTasks} tasks
                </p>
              </CardContent>
            </Card>
          </StaggerItem>

          <StaggerItem className="lg:col-span-2">
            <Card className="border-border/50 bg-card/60 backdrop-blur-sm hover:border-border/80 transition-colors h-full">
              <CardHeader className="pb-2">
                <CardTitle className="text-[11px] font-medium uppercase tracking-[0.12em] text-muted-foreground">
                  Weekly Velocity
                </CardTitle>
              </CardHeader>
              <CardContent>
                <WeeklyVelocityChart data={weeklyVelocity} />
              </CardContent>
            </Card>
          </StaggerItem>
        </StaggerContainer>

      </div>
    </div>
  );
}
