'use client';

import Link from 'next/link';
import { motion } from 'framer-motion';
import { CalendarIcon, CoinsIcon, ListTodoIcon, ArchiveIcon } from 'lucide-react';
import { StatusBadge, formatDate, formatBudget } from '@/lib/project-helpers';
import { FocusAreaStepper } from '@/components/focus-area-stepper';
import { StaggerItem } from '@/components/motion';
import { cn } from '@/lib/utils';

type Project = typeof import('@/db/schema').projects.$inferSelect;

interface ProjectCardProps {
  project: Project;
  taskCount: number;
  isFeatured?: boolean;
}

const STATUS_ACCENT: Record<string, string> = {
  active: 'from-blue-500',
  on_hold: 'from-amber-500',
  completed: 'from-emerald-500',
  cancelled: 'from-red-500',
  planning: 'from-violet-500',
};

const STATUS_BORDER: Record<string, string> = {
  active: 'border-l-blue-500',
  on_hold: 'border-l-amber-500',
  completed: 'border-l-emerald-500',
  cancelled: 'border-l-red-500',
  planning: 'border-l-violet-500',
};

const STATUS_GLOW: Record<string, string> = {
  active: 'hover:shadow-blue-500/10',
  on_hold: 'hover:shadow-amber-500/10',
  completed: 'hover:shadow-emerald-500/10',
  cancelled: 'hover:shadow-red-500/10',
  planning: 'hover:shadow-violet-500/10',
};

const STATUS_RING: Record<string, string> = {
  active: 'hover:border-blue-500/30',
  on_hold: 'hover:border-amber-500/30',
  completed: 'hover:border-emerald-500/30',
  cancelled: 'hover:border-red-500/30',
  planning: 'hover:border-violet-500/30',
};

export function ProjectCard({ project, taskCount, isFeatured = false }: ProjectCardProps) {
  const accentGradient = STATUS_ACCENT[project.status] ?? 'from-primary';
  const statusBorder = STATUS_BORDER[project.status] ?? 'border-l-primary';
  const shadowGlow = STATUS_GLOW[project.status] ?? 'hover:shadow-primary/10';
  const ringHover = STATUS_RING[project.status] ?? 'hover:border-primary/30';

  if (isFeatured) {
    /* ── FEATURED CARD (horizontal, full-width) ──────────────────────────
       Used for the first project in the list. Horizontal layout with a
       left-side status bar instead of top bar. More prominent presentation
       with progress displayed right-anchored. Distinct from the grid cards.
    ──────────────────────────────────────────────────────────────────── */
    return (
      <StaggerItem>
        <Link href={`/projects/${project.id}`} className="group block focus:outline-none">
          <motion.div
            whileHover={{ y: -4, scale: 1.008 }}
            whileTap={{ scale: 0.98 }}
            transition={{ type: 'spring', stiffness: 340, damping: 22 }}
          >
            <div
              className={cn(
                'relative flex flex-col md:flex-row rounded-xl border border-border/50 bg-card/70 backdrop-blur-sm overflow-hidden transition-all duration-300',
                'hover:shadow-xl hover:bg-card/90',
                'border-l-4',
                statusBorder,
                shadowGlow,
              )}
            >
              {/* Hover overlay */}
              <div className={cn('pointer-events-none absolute inset-0 opacity-0 group-hover:opacity-[0.04] transition-opacity duration-300 bg-gradient-to-br to-transparent', accentGradient)} />

              {/* Left: identity block — name, description, focus stepper */}
              <div className="relative flex-1 min-w-0 p-6 flex flex-col gap-3">
                <div className="flex items-start justify-between gap-3 flex-wrap">
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-1.5 flex-wrap mb-1">
                      <h2 className="font-semibold text-base leading-snug group-hover:text-primary transition-colors duration-200">
                        {project.name}
                      </h2>
                      {project.isLegacy && (
                        <span className="inline-flex items-center gap-1 rounded-full border border-amber-500/40 bg-amber-500/10 px-1.5 py-0.5 text-[10px] font-medium text-amber-600 dark:text-amber-400 shrink-0">
                          <ArchiveIcon className="size-2.5" />
                          Legacy
                        </span>
                      )}
                    </div>
                    {project.description && (
                      <p className="text-sm text-muted-foreground/70 line-clamp-2 leading-relaxed">
                        {project.description}
                      </p>
                    )}
                  </div>
                  {/* Status badge — visible on mobile only (desktop it's in right col) */}
                  <div className="md:hidden">
                    <StatusBadge value={project.status} />
                  </div>
                </div>

                {project.currentFocusArea && (
                  <FocusAreaStepper currentFocusArea={project.currentFocusArea} size="sm" />
                )}

                {/* Meta row */}
                <div className="flex items-center gap-4 text-[11px] text-muted-foreground/60 flex-wrap mt-auto">
                  <span className="flex items-center gap-1">
                    <ListTodoIcon className="size-3" />
                    <span className="font-medium tabular-nums">{taskCount}</span>
                    <span>task{taskCount !== 1 ? 's' : ''}</span>
                  </span>
                  {project.budget && (
                    <span className="flex items-center gap-1">
                      <CoinsIcon className="size-3" />
                      {formatBudget(project.budget, project.currency)}
                    </span>
                  )}
                  {project.startDate && (
                    <span className="flex items-center gap-1">
                      <CalendarIcon className="size-3" />
                      {formatDate(project.startDate)}
                    </span>
                  )}
                </div>
              </div>

              {/* Right: data sidebar — progress stat + status (desktop) */}
              <div className="relative hidden md:flex flex-col items-end justify-between gap-4 p-6 pl-0 shrink-0 min-w-[160px]">
                <StatusBadge value={project.status} />

                {project.progressPercent !== null && project.progressPercent > 0 ? (
                  <div className="text-right">
                    <p className="text-[11px] font-medium uppercase tracking-[0.12em] text-muted-foreground mb-1">
                      PROGRESS
                    </p>
                    <div className="flex items-baseline gap-0.5 justify-end">
                      <span className="font-heading text-4xl font-black tracking-[-0.04em] text-primary leading-none tabular-nums">
                        {project.progressPercent}
                      </span>
                      <span className="font-mono text-lg font-bold text-primary/60">%</span>
                    </div>
                  </div>
                ) : (
                  <div className="text-right">
                    <p className="text-[11px] font-medium uppercase tracking-[0.12em] text-muted-foreground">
                      NO PROGRESS
                    </p>
                  </div>
                )}
              </div>
            </div>
          </motion.div>
        </Link>
      </StaggerItem>
    );
  }

  /* ── STANDARD CARD (vertical, grid item) ────────────────────────────── */
  return (
    <StaggerItem>
      <Link href={`/projects/${project.id}`} className="group block focus:outline-none">
        <motion.div
          whileHover={{ y: -6, scale: 1.015 }}
          whileTap={{ scale: 0.97 }}
          transition={{ type: 'spring', stiffness: 340, damping: 22 }}
        >
          <div
            className={cn(
              'relative flex flex-col rounded-xl border border-border/50 bg-card/70 backdrop-blur-sm overflow-hidden transition-all duration-300',
              'hover:shadow-xl hover:bg-card/90',
              shadowGlow,
              ringHover
            )}
          >
            {/* Colored top accent bar */}
            <div className={cn('h-0.5 w-full bg-gradient-to-r to-transparent opacity-80', accentGradient)} />

            {/* Hover overlay */}
            <div className={cn('pointer-events-none absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-300 bg-gradient-to-br to-transparent', accentGradient, 'opacity-0 group-hover:opacity-[0.04]')} />

            <div className="relative p-4 flex flex-col gap-3">
              {/* Header */}
              <div className="flex items-start justify-between gap-2">
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-1.5 flex-wrap">
                    <h2 className="font-semibold text-sm leading-snug line-clamp-1 group-hover:text-primary transition-colors duration-200">
                      {project.name}
                    </h2>
                    {project.isLegacy && (
                      <span className="inline-flex items-center gap-1 rounded-full border border-amber-500/40 bg-amber-500/10 px-1.5 py-0.5 text-[10px] font-medium text-amber-600 dark:text-amber-400 shrink-0">
                        <ArchiveIcon className="size-2.5" />
                        Legacy
                      </span>
                    )}
                  </div>
                  {project.description && (
                    <p className="mt-0.5 text-xs text-muted-foreground/70 line-clamp-2 leading-relaxed">
                      {project.description}
                    </p>
                  )}
                </div>
                <StatusBadge value={project.status} />
              </div>

              {/* Focus area stepper */}
              {project.currentFocusArea && (
                <FocusAreaStepper currentFocusArea={project.currentFocusArea} size="sm" />
              )}

              {/* Progress bar */}
              {project.progressPercent !== null && project.progressPercent > 0 && (
                <div>
                  <div className="flex items-center justify-between text-[11px] text-muted-foreground mb-1.5">
                    <span>Progress</span>
                    <span className="font-bold tabular-nums text-foreground/70">
                      {project.progressPercent}%
                    </span>
                  </div>
                  <div className="h-1.5 w-full rounded-full bg-muted/60 overflow-hidden">
                    <motion.div
                      className={cn(
                        'h-full rounded-full bg-gradient-to-r to-primary/50',
                        `${accentGradient.replace('from-', 'from-').replace('500', '400')}`
                      )}
                      style={{
                        background: `linear-gradient(to right, var(--color-primary), color-mix(in oklch, var(--color-primary), transparent 50%))`,
                      }}
                      initial={{ width: 0 }}
                      animate={{ width: `${Math.min(project.progressPercent, 100)}%` }}
                      transition={{ duration: 0.8, delay: 0.15, ease: [0.34, 1.56, 0.64, 1] }}
                    />
                  </div>
                </div>
              )}

              {/* Meta row */}
              <div className="flex items-center gap-3 text-[11px] text-muted-foreground/60 flex-wrap">
                <span className="flex items-center gap-1">
                  <ListTodoIcon className="size-3" />
                  <span className="font-medium tabular-nums">{taskCount}</span>
                  <span>task{taskCount !== 1 ? 's' : ''}</span>
                </span>
                {project.budget && (
                  <span className="flex items-center gap-1">
                    <CoinsIcon className="size-3" />
                    {formatBudget(project.budget, project.currency)}
                  </span>
                )}
                {project.startDate && (
                  <span className="flex items-center gap-1">
                    <CalendarIcon className="size-3" />
                    {formatDate(project.startDate)}
                  </span>
                )}
              </div>
            </div>
          </div>
        </motion.div>
      </Link>
    </StaggerItem>
  );
}
