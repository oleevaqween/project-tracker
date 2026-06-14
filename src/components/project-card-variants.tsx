'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useState, useTransition } from 'react';
import { motion } from 'framer-motion';
import { Pin } from 'lucide-react';
import { formatDate, formatBudget } from '@/lib/project-helpers';
import { FocusAreaStepper } from '@/components/focus-area-stepper';
import { StaggerItem } from '@/components/motion';
import { cn } from '@/lib/utils';
import { setFeaturedProject } from '@/actions/preferences';

type Project = typeof import('@/db/schema').projects.$inferSelect;

interface CardProps {
  project: Project;
  taskCount: number;
  isFeatured: boolean;
}

// ─── Color maps ───────────────────────────────────────────────────────────────

const STATUS_LABEL: Record<string, string> = {
  active:    'Active',
  on_hold:   'On Hold',
  completed: 'Completed',
  cancelled: 'Cancelled',
  planning:  'Planning',
};

const STATUS_PILL: Record<string, string> = {
  active:    'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300',
  on_hold:   'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-300',
  completed: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-300',
  cancelled: 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-300',
  planning:  'bg-violet-100 text-violet-700 dark:bg-violet-900/30 dark:text-violet-300',
};

const STATUS_HEADER_TINT: Record<string, string> = {
  active:    'bg-blue-50 dark:bg-transparent',
  on_hold:   'bg-amber-50 dark:bg-transparent',
  completed: 'bg-emerald-50 dark:bg-transparent',
  cancelled: 'bg-red-50 dark:bg-transparent',
  planning:  'bg-violet-50 dark:bg-transparent',
};

// ─── Micro-components ─────────────────────────────────────────────────────────

function CardBadge({ status }: { status: string }) {
  return (
    <span className={cn('text-[9px] font-bold tracking-[0.12em] rounded-sm px-1.5 py-0.5 uppercase shrink-0', STATUS_PILL[status] ?? 'bg-muted text-muted-foreground')}>
      {STATUS_LABEL[status] ?? status}
    </span>
  );
}

function CardCircle({ initial }: { initial: string }) {
  return (
    <div className="size-8 rounded-full bg-foreground/8 dark:bg-white/10 border border-foreground/10 dark:border-white/15 flex items-center justify-center text-foreground/70 dark:text-white/80 font-heading font-bold text-sm shrink-0">
      {initial}
    </div>
  );
}

function AllocationBar({ percent }: { percent: number | null }) {
  const filled = Math.min(percent ?? 0, 100);
  const empty  = 100 - filled;
  return (
    <div className="flex flex-col gap-1.5">
      <div className="flex h-6 rounded-md overflow-hidden">
        <motion.div
          className="bg-primary flex items-center justify-end pr-2 shrink-0"
          style={{ minWidth: filled > 0 ? '12%' : '0%' }}
          initial={{ width: 0 }}
          animate={{ width: `${filled}%` }}
          transition={{ duration: 0.8, delay: 0.2, ease: [0.34, 1.56, 0.64, 1] }}
        >
          {filled >= 20 && (
            <span className="font-mono text-[9px] font-bold text-black/60">{filled}%</span>
          )}
        </motion.div>
        <div className="flex-1 bg-foreground/5 dark:bg-white/8 flex items-center pl-2">
          {empty > 15 && (
            <span className="font-mono text-[9px] font-medium text-foreground/30 dark:text-white/30">{empty}%</span>
          )}
        </div>
      </div>
      <div className="flex items-center justify-between">
        <span className="font-mono text-[9px] text-muted-foreground/50 dark:text-white/35 tracking-[0.1em] uppercase">Complete</span>
        <span className="font-mono text-[9px] text-muted-foreground/50 dark:text-white/35 tracking-[0.1em] uppercase">Remaining</span>
      </div>
    </div>
  );
}

// ─── Pin button ───────────────────────────────────────────────────────────────
// Sits inside the card (inside the Link) — stopPropagation prevents navigation.
// Uses group-hover/card on the named group so Framer Motion nesting doesn't interfere.

function PinButton({ projectId, isFeatured, visible }: { projectId: number; isFeatured: boolean; visible: boolean }) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();

  function handlePin(e: React.MouseEvent) {
    e.preventDefault();
    e.stopPropagation();
    startTransition(async () => {
      await setFeaturedProject(isFeatured ? null : projectId);
      router.refresh();
    });
  }

  return (
    <button
      onClick={handlePin}
      disabled={pending}
      aria-label={isFeatured ? 'Unpin hero card' : 'Pin as hero card'}
      style={{ opacity: visible || isFeatured ? 1 : 0, transition: 'opacity 150ms ease' }}
      className={cn(
        'absolute bottom-3 right-3 z-20 p-1.5 rounded-md',
        isFeatured
          ? 'text-primary bg-primary/10 hover:bg-primary/20'
          : 'text-muted-foreground/60 dark:text-white/40 hover:text-primary hover:bg-primary/10',
        pending && 'opacity-50 cursor-not-allowed',
      )}
    >
      <Pin
        size={13}
        className={cn(isFeatured ? 'fill-primary' : '')}
        style={{ rotate: isFeatured ? '0deg' : '45deg' }}
      />
    </button>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// VARIANT C — DARK DATA CARD (theme-aware)
// ─────────────────────────────────────────────────────────────────────────────

export function CardC_Featured({ project, taskCount, isFeatured }: CardProps) {
  const initial    = project.name?.[0]?.toUpperCase() ?? '?';
  const headerTint = STATUS_HEADER_TINT[project.status] ?? 'dark:bg-transparent';
  const [hovered, setHovered] = useState(false);

  return (
    <StaggerItem>
      <div
        onMouseEnter={() => setHovered(true)}
        onMouseLeave={() => setHovered(false)}
      >
        <Link href={`/projects/${project.id}`} className="block focus:outline-none focus-visible:ring-2 focus-visible:ring-ring/50">
          <motion.div
            whileHover={{ y: -4, scale: 1.008 }}
            whileTap={{ scale: 0.98 }}
            transition={{ type: 'spring', stiffness: 340, damping: 22 }}
            style={{ boxShadow: 'var(--card-c)' }}
            className={cn(
              'relative flex flex-col md:flex-row border rounded-xl overflow-hidden',
              'bg-card border-border/40 dark:border-white/8',
            )}
          >
            <PinButton projectId={project.id} isFeatured={isFeatured} visible={hovered} />

            {/* Left: identity + stats */}
            <div className="flex-1 min-w-0 flex flex-col">
              <div className={cn('flex items-center gap-2 px-5 pt-5 pb-4 border-b border-border/30 dark:border-white/6', headerTint)}>
                <CardCircle initial={initial} />
                <div className="flex-1 min-w-0">
                  <h2 className="font-heading text-base font-bold text-foreground dark:text-white/90 leading-tight hover:text-primary transition-colors duration-200 line-clamp-1">
                    {project.name}
                  </h2>
                  {project.startDate && (
                    <p className="font-mono text-[10px] text-muted-foreground/60 dark:text-white/30">
                      Started {formatDate(project.startDate)}
                    </p>
                  )}
                </div>
                <CardBadge status={project.status} />
                {project.isLegacy && (
                  <span className="text-[9px] font-bold tracking-[0.12em] rounded-sm px-1.5 py-0.5 uppercase bg-amber-100 text-amber-700 dark:bg-amber-900/40 dark:text-amber-400 shrink-0">
                    Legacy
                  </span>
                )}
              </div>

              {/* Stats — font-mono for numbers, not font-heading */}
              <div className="flex items-start gap-8 p-5">
                <div>
                  <p className="font-mono text-[9px] text-muted-foreground/50 dark:text-white/30 tracking-[0.14em] uppercase mb-1">TASKS</p>
                  <p className="font-mono text-2xl font-bold text-foreground dark:text-white/90 tabular-nums leading-none">
                    {String(taskCount).padStart(2, '0')}
                  </p>
                </div>
                {project.budget && (
                  <div>
                    <p className="font-mono text-[9px] text-muted-foreground/50 dark:text-white/30 tracking-[0.14em] uppercase mb-1">BUDGET</p>
                    <p className="font-mono text-xl font-bold text-foreground dark:text-white/90 leading-none">
                      {formatBudget(project.budget, project.currency)}
                    </p>
                  </div>
                )}
              </div>

              {project.currentFocusArea && (
                <div className="px-5 pb-5 -mt-2">
                  <FocusAreaStepper currentFocusArea={project.currentFocusArea} size="sm" />
                </div>
              )}
            </div>

            {/* Right: progress + description */}
            <div className="hidden md:flex flex-col justify-center gap-4 p-5 shrink-0 min-w-[260px] border-l border-border/30 dark:border-white/6">
              <p className="font-mono text-[9px] text-muted-foreground/50 dark:text-white/30 tracking-[0.14em] uppercase">COMPLETION</p>
              <AllocationBar percent={project.progressPercent} />
              {project.description && (
                <p className="text-xs text-muted-foreground/60 dark:text-white/30 line-clamp-2 leading-relaxed mt-1">
                  {project.description}
                </p>
              )}
            </div>
          </motion.div>
        </Link>
      </div>
    </StaggerItem>
  );
}

export function CardC_Standard({ project, taskCount, isFeatured }: CardProps) {
  const initial    = project.name?.[0]?.toUpperCase() ?? '?';
  const headerTint = STATUS_HEADER_TINT[project.status] ?? 'dark:bg-transparent';
  const [hovered, setHovered] = useState(false);

  return (
    <StaggerItem>
      <div
        onMouseEnter={() => setHovered(true)}
        onMouseLeave={() => setHovered(false)}
      >
        <Link href={`/projects/${project.id}`} className="block focus:outline-none focus-visible:ring-2 focus-visible:ring-ring/50">
          <motion.div
            whileHover={{ y: -6, scale: 1.015 }}
            whileTap={{ scale: 0.97 }}
            transition={{ type: 'spring', stiffness: 340, damping: 22 }}
            style={{ boxShadow: 'var(--card-c)' }}
            className={cn(
              'relative flex flex-col border rounded-xl overflow-hidden',
              'bg-card border-border/40 dark:border-white/8',
            )}
          >
            <PinButton projectId={project.id} isFeatured={isFeatured} visible={hovered} />

            <div className={cn('flex items-center gap-2 px-4 pt-4 pb-3 border-b border-border/30 dark:border-white/6', headerTint)}>
              <CardCircle initial={initial} />
              <div className="flex-1 min-w-0">
                <h2 className="font-heading text-sm font-bold text-foreground dark:text-white/90 leading-tight hover:text-primary transition-colors duration-200 line-clamp-1">
                  {project.name}
                </h2>
                {project.startDate && (
                  <p className="font-mono text-[9px] text-muted-foreground/60 dark:text-white/30">
                    {formatDate(project.startDate)}
                  </p>
                )}
              </div>
              <CardBadge status={project.status} />
            </div>

            <div className="p-4 flex flex-col gap-4">
              {/* Stats — font-mono for numbers */}
              <div className="flex items-start gap-6">
                <div>
                  <p className="font-mono text-[9px] text-muted-foreground/50 dark:text-white/30 tracking-[0.14em] uppercase mb-1">TASKS</p>
                  <p className="font-mono text-xl font-bold text-foreground dark:text-white/90 tabular-nums leading-none">
                    {String(taskCount).padStart(2, '0')}
                  </p>
                </div>
                {project.budget && (
                  <div>
                    <p className="font-mono text-[9px] text-muted-foreground/50 dark:text-white/30 tracking-[0.14em] uppercase mb-1">BUDGET</p>
                    <p className="font-mono text-base font-bold text-foreground dark:text-white/90 leading-none">
                      {formatBudget(project.budget, project.currency)}
                    </p>
                  </div>
                )}
              </div>

              <div>
                <p className="font-mono text-[9px] text-muted-foreground/50 dark:text-white/30 tracking-[0.14em] uppercase mb-2">COMPLETION</p>
                <AllocationBar percent={project.progressPercent} />
              </div>

              {project.currentFocusArea && (
                <FocusAreaStepper currentFocusArea={project.currentFocusArea} size="sm" />
              )}

              {project.isLegacy && (
                <span className="text-[9px] font-bold tracking-[0.12em] rounded-sm px-1.5 py-0.5 uppercase bg-amber-100 text-amber-700 dark:bg-amber-900/40 dark:text-amber-400 self-start">
                  Legacy
                </span>
              )}
            </div>
          </motion.div>
        </Link>
      </div>
    </StaggerItem>
  );
}
