'use client';

import { StaggerContainer, StaggerItem, NumberTicker, Reveal, GradientMesh, LightRays } from '@/components/motion';
import { StatusPieChart, ProgressRing, WeeklyVelocityChart } from '@/components/progress-charts';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { PMBOKGuide } from '@/components/pmbok';
import Link from 'next/link';
import {
  FolderKanbanIcon,
  CheckCircle2Icon,
  ListTodoIcon,
  TrendingUpIcon,
} from 'lucide-react';
import { motion } from 'framer-motion';

interface DashboardClientProps {
  displayName: string | null;
  totalProjects: number;
  completedProjects: number;
  totalTasks: number;
  completedTasks: number;
  avgProgress: number;
  statusCounts: { status: string; count: number }[];
  weeklyVelocity: { week: string; completed: number; created: number }[];
}

const KPI_CONFIG = [
  {
    label: 'Total Projects',
    sublabel: 'in portfolio',
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
              <p className="mt-0.5 text-[11px] text-muted-foreground">{sublabel}</p>
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

export function DashboardClient({
  displayName,
  totalProjects,
  completedProjects,
  totalTasks,
  completedTasks,
  avgProgress,
  statusCounts,
  weeklyVelocity,
}: DashboardClientProps) {
  const firstName = displayName ? displayName.split(' ')[0] : null;
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
              <p className="text-[11px] font-medium uppercase tracking-[0.12em] text-muted-foreground mb-2">
                OVERVIEW
              </p>
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
                ) : (
                  <span className="block text-[2.75rem] font-black font-heading tracking-[-0.025em]">
                    Your Portfolio
                  </span>
                )}
              </h1>
              <p className="mt-1 text-sm text-muted-foreground leading-relaxed">
                {totalProjects === 0
                  ? 'Create your first project to get started with PMBOK 8 tracking.'
                  : `Tracking ${totalProjects} project${totalProjects !== 1 ? 's' : ''} across all 8 Performance Domains.`}
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
