'use client';

import * as React from 'react';
import { motion } from 'framer-motion';
import {
  CalendarIcon,
  LayersIcon,
  CheckCircle2Icon,
  CircleDotIcon,
  ShieldAlertIcon,
  GlobeIcon,
  MailIcon,
} from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import { FocusAreaBadge, StatusBadge, formatDate } from '@/lib/project-helpers';

type Profile = typeof import('@/db/schema').profiles.$inferSelect;
type Project = typeof import('@/db/schema').projects.$inferSelect;
type TaskRow = { id: number; projectId: number; status: string };
type RiskRow = { id: number; projectId: number; riskScore: number | null };

const CATEGORY_COLORS: Record<string, string> = {
  software: 'bg-violet-500/10 text-violet-600 dark:text-violet-400 border-violet-500/20',
  web: 'bg-sky-500/10 text-sky-600 dark:text-sky-400 border-sky-500/20',
  mobile: 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20',
  data: 'bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/20',
  design: 'bg-rose-500/10 text-rose-600 dark:text-rose-400 border-rose-500/20',
  research: 'bg-teal-500/10 text-teal-600 dark:text-teal-400 border-teal-500/20',
};

function getProgressColor(pct: number) {
  if (pct >= 80) return 'bg-emerald-500';
  if (pct >= 50) return 'bg-amber-500';
  return 'bg-blue-500';
}

function ProjectCard({
  project,
  tasks,
  risks,
  index,
}: {
  project: Project;
  tasks: TaskRow[];
  risks: RiskRow[];
  index: number;
}) {
  const doneTasks = tasks.filter((t) => t.status === 'done').length;
  const highRisks = risks.filter((r) => (r.riskScore ?? 0) >= 15).length;
  const progress = project.progressPercent ?? 0;
  const catColor = CATEGORY_COLORS[project.category?.toLowerCase() ?? ''] ?? 'bg-muted/50 text-muted-foreground border-border';

  return (
    <motion.div
      initial={{ opacity: 0, y: 32 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.45, delay: index * 0.07, ease: [0.16, 1, 0.3, 1] }}
      className="group rounded-2xl border bg-card overflow-hidden hover:shadow-lg hover:shadow-primary/5 transition-shadow duration-300"
    >
      {/* Cover / colour header */}
      {project.coverImage ? (
        <div className="h-44 overflow-hidden">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={project.coverImage}
            alt={project.name}
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
          />
        </div>
      ) : (
        <div
          className={cn(
            'h-24 flex items-center justify-center',
            project.status === 'completed'
              ? 'bg-gradient-to-br from-emerald-500/20 to-teal-500/20'
              : project.status === 'in_progress'
              ? 'bg-gradient-to-br from-violet-500/20 to-indigo-500/20'
              : 'bg-gradient-to-br from-muted/30 to-muted/60',
          )}
        >
          <LayersIcon className="size-10 text-muted-foreground/30" />
        </div>
      )}

      <div className="p-5 space-y-4">
        {/* Title + badges */}
        <div className="space-y-2">
          <div className="flex items-start justify-between gap-2">
            <h3 className="font-bold text-base leading-tight line-clamp-2 group-hover:text-primary transition-colors">
              {project.name}
            </h3>
            <StatusBadge value={project.status} className="shrink-0" />
          </div>
          <div className="flex items-center gap-1.5 flex-wrap">
            <FocusAreaBadge value={project.currentFocusArea ?? null} />
            {project.category && (
              <span className={cn('inline-flex items-center rounded-full border px-2 py-0.5 text-xs font-medium', catColor)}>
                {project.category}
              </span>
            )}
          </div>
        </div>

        {/* Description */}
        {project.description && (
          <p className="text-sm text-muted-foreground line-clamp-3 leading-relaxed">
            {project.description}
          </p>
        )}

        {/* Progress bar */}
        <div className="space-y-1.5">
          <div className="flex justify-between text-xs text-muted-foreground">
            <span>Progress</span>
            <span className="tabular-nums font-medium">{progress}%</span>
          </div>
          <div className="h-1.5 w-full rounded-full bg-muted overflow-hidden">
            <motion.div
              className={cn('h-full rounded-full', getProgressColor(progress))}
              initial={{ width: 0 }}
              animate={{ width: `${progress}%` }}
              transition={{ duration: 0.8, delay: index * 0.07 + 0.3, ease: 'easeOut' }}
            />
          </div>
        </div>

        {/* Stats row */}
        <div className="flex items-center gap-4 text-xs text-muted-foreground pt-1 border-t">
          {tasks.length > 0 && (
            <div className="flex items-center gap-1">
              <CheckCircle2Icon className="size-3.5 text-emerald-500" />
              <span>{doneTasks}/{tasks.length} tasks</span>
            </div>
          )}
          {risks.length > 0 && (
            <div className="flex items-center gap-1">
              <ShieldAlertIcon className={cn('size-3.5', highRisks > 0 ? 'text-red-500' : 'text-muted-foreground')} />
              <span>{risks.length} risk{risks.length !== 1 ? 's' : ''}</span>
            </div>
          )}
          {(project.startDate || project.targetEndDate) && (
            <div className="flex items-center gap-1 ml-auto">
              <CalendarIcon className="size-3.5" />
              <span>{project.targetEndDate ? formatDate(project.targetEndDate) : formatDate(project.startDate)}</span>
            </div>
          )}
        </div>

        {/* Charter deliverables preview */}
        {project.charter && (project.charter as Record<string, string>).deliverables && (
          <div className="rounded-lg bg-muted/50 p-3 text-xs text-muted-foreground space-y-1">
            <p className="font-medium text-foreground/70">Deliverables</p>
            <p className="line-clamp-2">{(project.charter as Record<string, string>).deliverables}</p>
          </div>
        )}
      </div>
    </motion.div>
  );
}

function AvatarFallback({ name }: { name: string }) {
  const initials = name
    .split(' ')
    .map((n) => n[0])
    .slice(0, 2)
    .join('')
    .toUpperCase();
  return (
    <div className="flex size-full items-center justify-center bg-gradient-to-br from-primary/30 to-primary/10 text-primary font-bold text-2xl">
      {initials}
    </div>
  );
}

export function PublicPortfolioClient({
  profile,
  projects: projectList,
  tasksByProject,
  risksByProject,
}: {
  profile: Profile;
  projects: Project[];
  tasksByProject: Record<number, TaskRow[]>;
  risksByProject: Record<number, RiskRow[]>;
}) {
  const completedCount = projectList.filter((p) => p.status === 'completed').length;
  const inProgressCount = projectList.filter((p) => p.status === 'in_progress').length;

  return (
    <main className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8 py-12 space-y-12">
      {/* Profile hero */}
      <motion.section
        initial={{ opacity: 0, y: 24 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
        className="flex flex-col sm:flex-row items-center sm:items-start gap-6"
      >
        {/* Avatar */}
        <div className="size-24 rounded-2xl overflow-hidden border-2 border-border shrink-0 shadow-lg">
          {profile.avatarUrl ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={profile.avatarUrl} alt={profile.displayName ?? profile.username} className="w-full h-full object-cover" />
          ) : (
            <AvatarFallback name={profile.displayName ?? profile.username} />
          )}
        </div>

        {/* Name + bio */}
        <div className="space-y-3 text-center sm:text-left">
          <div>
            <h1 className="text-3xl font-black tracking-tight">
              {profile.displayName ?? profile.username}
            </h1>
            <p className="text-sm text-muted-foreground font-mono mt-0.5">@{profile.username}</p>
          </div>
          {profile.bio && (
            <p className="text-sm text-muted-foreground max-w-lg leading-relaxed">{profile.bio}</p>
          )}

          {/* Stats pills */}
          <div className="flex items-center gap-2 flex-wrap justify-center sm:justify-start">
            <div className="flex items-center gap-1.5 rounded-full border bg-card px-3 py-1 text-xs font-medium">
              <CircleDotIcon className="size-3.5 text-primary" />
              {projectList.length} project{projectList.length !== 1 ? 's' : ''}
            </div>
            {completedCount > 0 && (
              <div className="flex items-center gap-1.5 rounded-full border bg-card px-3 py-1 text-xs font-medium">
                <CheckCircle2Icon className="size-3.5 text-emerald-500" />
                {completedCount} completed
              </div>
            )}
            {inProgressCount > 0 && (
              <div className="flex items-center gap-1.5 rounded-full border bg-card px-3 py-1 text-xs font-medium">
                <GlobeIcon className="size-3.5 text-amber-500" />
                {inProgressCount} active
              </div>
            )}
          </div>
        </div>
      </motion.section>

      {/* Projects grid */}
      <section className="space-y-6">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-semibold">Projects</h2>
          <Badge variant="secondary" className="tabular-nums">{projectList.length}</Badge>
        </div>

        {projectList.length === 0 ? (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="rounded-2xl border border-dashed p-16 flex flex-col items-center gap-3 text-center"
          >
            <LayersIcon className="size-10 text-muted-foreground/30" />
            <p className="text-sm font-medium">No public projects yet</p>
            <p className="text-xs text-muted-foreground">Projects marked as public will appear here.</p>
          </motion.div>
        ) : (
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {projectList.map((project, i) => (
              <ProjectCard
                key={project.id}
                project={project}
                tasks={tasksByProject[project.id] ?? []}
                risks={risksByProject[project.id] ?? []}
                index={i}
              />
            ))}
          </div>
        )}
      </section>

      {/* Footer */}
      <footer className="border-t pt-8 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-muted-foreground">
        <p>Portfolio powered by PMBOK 8 · Project Tracker</p>
        <div className="flex items-center gap-4">
          <a
            href="https://github.com/oleevaqween"
            target="_blank"
            rel="noopener noreferrer"
            className="hover:text-foreground transition-colors underline-offset-4 hover:underline font-mono"
          >
            github.com/oleevaqween
          </a>
          <p className="font-mono">Member since {new Date(profile.createdAt).getFullYear()}</p>
        </div>
      </footer>
    </main>
  );
}
