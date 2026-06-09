'use client';

import { StaggerContainer, StaggerItem, NumberTicker, Reveal, GradientMesh } from '@/components/motion';
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
          className={`relative overflow-hidden rounded-lg border-2 bg-card transition-all duration-150 ${border} neo-card p-5`}
        >
          <div
            className={`pointer-events-none absolute inset-0 bg-gradient-to-br ${gradient} opacity-60 transition-opacity duration-200 group-hover:opacity-90`}
          />

          <div className="relative flex items-start justify-between gap-3">
            <div className="min-w-0">
              <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground/70">{label}</p>
              <motion.div
                className="mt-1 flex items-baseline gap-1"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.08 * index, duration: 0.4 }}
              >
                <span className={`text-3xl font-black tabular-nums tracking-tight ${numberClass}`}>
                  <NumberTicker value={value} delay={0.08 * index} />
                </span>
                {suffix && (
                  <span className="text-sm font-semibold text-muted-foreground/60">{suffix}</span>
                )}
              </motion.div>
              <p className="mt-0.5 text-[11px] text-muted-foreground/50">{sublabel}</p>
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
    <div className="relative flex flex-1 flex-col gap-6 p-6 overflow-hidden">
      <GradientMesh className="rounded-2xl opacity-40" />

      {/* Hero section */}
      <Reveal direction="up">
        <div className="relative flex items-start justify-between gap-4 flex-wrap">
          <div>
            <h1 className="text-3xl font-black tracking-tight text-foreground">
              {firstName ? `Welcome back, ${firstName}` : 'Your Portfolio'}
            </h1>
            <p className="mt-1 text-sm text-muted-foreground/70">
              {totalProjects === 0
                ? 'Create your first project to get started with PMBOK 8 tracking.'
                : `Tracking ${totalProjects} project${totalProjects !== 1 ? 's' : ''} across all 8 Performance Domains.`}
            </p>
          </div>
        </div>
      </Reveal>

      {/* PMBOK Guide */}
      <PMBOKGuide context="dashboard" />

      {/* KPI Cards */}
      <StaggerContainer className="grid auto-rows-min gap-4 md:grid-cols-2 lg:grid-cols-4">
        <KpiCard label={KPI_CONFIG[0].label} sublabel={KPI_CONFIG[0].sublabel} href={KPI_CONFIG[0].href} value={totalProjects} icon={KPI_CONFIG[0].icon} gradient={KPI_CONFIG[0].gradient} border={KPI_CONFIG[0].border} iconClass={KPI_CONFIG[0].iconClass} glow={KPI_CONFIG[0].glow} numberClass={KPI_CONFIG[0].numberClass} index={0} />
        <KpiCard label={KPI_CONFIG[1].label} sublabel={KPI_CONFIG[1].sublabel} href={KPI_CONFIG[1].href} value={completedProjects} icon={KPI_CONFIG[1].icon} gradient={KPI_CONFIG[1].gradient} border={KPI_CONFIG[1].border} iconClass={KPI_CONFIG[1].iconClass} glow={KPI_CONFIG[1].glow} numberClass={KPI_CONFIG[1].numberClass} index={1} />
        <KpiCard label={KPI_CONFIG[2].label} sublabel={KPI_CONFIG[2].sublabel} href={KPI_CONFIG[2].href} value={completedTasks} suffix={totalTasks > 0 ? `/ ${totalTasks}` : undefined} icon={KPI_CONFIG[2].icon} gradient={KPI_CONFIG[2].gradient} border={KPI_CONFIG[2].border} iconClass={KPI_CONFIG[2].iconClass} glow={KPI_CONFIG[2].glow} numberClass={KPI_CONFIG[2].numberClass} index={2} />
        <KpiCard label={KPI_CONFIG[3].label} sublabel={KPI_CONFIG[3].sublabel} href={KPI_CONFIG[3].href} value={avgProgress} suffix="%" icon={KPI_CONFIG[3].icon} gradient={KPI_CONFIG[3].gradient} border={KPI_CONFIG[3].border} iconClass={KPI_CONFIG[3].iconClass} glow={KPI_CONFIG[3].glow} numberClass={KPI_CONFIG[3].numberClass} index={3} />
      </StaggerContainer>

      {/* Charts */}
      <StaggerContainer className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        <StaggerItem>
          <Card className="border-border/50 bg-card/60 backdrop-blur-sm hover:border-border/80 transition-colors">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-semibold text-muted-foreground/80">Project Status</CardTitle>
            </CardHeader>
            <CardContent>
              <StatusPieChart statusCounts={statusCounts} />
            </CardContent>
          </Card>
        </StaggerItem>

        <StaggerItem>
          <Card className="border-border/50 bg-card/60 backdrop-blur-sm hover:border-border/80 transition-colors">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-semibold text-muted-foreground/80">Portfolio Completion</CardTitle>
            </CardHeader>
            <CardContent className="flex flex-col items-center gap-3">
              <ProgressRing value={completionRate} size={120} label="tasks" />
              <p className="text-xs text-muted-foreground/60">
                {completedTasks} of {totalTasks} tasks completed
              </p>
            </CardContent>
          </Card>
        </StaggerItem>

        <StaggerItem>
          <Card className="border-border/50 bg-card/60 backdrop-blur-sm hover:border-border/80 transition-colors">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-semibold text-muted-foreground/80">Weekly Velocity</CardTitle>
            </CardHeader>
            <CardContent>
              <WeeklyVelocityChart data={weeklyVelocity} />
            </CardContent>
          </Card>
        </StaggerItem>
      </StaggerContainer>
    </div>
  );
}
