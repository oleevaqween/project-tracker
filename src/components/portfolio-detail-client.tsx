'use client';

import Link from 'next/link';
import { useState } from 'react';
import { motion } from 'framer-motion';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';
import {
  BriefcaseIcon, FolderKanbanIcon, CheckSquareIcon, ShieldAlertIcon,
  TrendingUpIcon, CheckCircle2Icon, CircleDotIcon, PauseCircleIcon, ArchiveIcon,
  ArrowLeftIcon, Trash2Icon, PencilIcon,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { StaggerContainer, StaggerItem, Reveal } from '@/components/motion';

type Portfolio = {
  id: number;
  userId: string;
  name: string;
  description: string | null;
  color: string | null;
  createdAt: Date;
  updatedAt: Date;
};

type Project = {
  id: number;
  name: string;
  description: string | null;
  status: string;
  progressPercent: number | null;
  category: string | null;
  startDate: Date | null;
  targetEndDate: Date | null;
};

type Task = {
  id: number;
  projectId: number;
  title: string;
  status: string;
  priority: string | null;
};

type Risk = {
  id: number;
  projectId: number;
  title: string;
  riskScore: number | null;
  status: string | null;
  category: string | null;
};

interface PortfolioDetailClientProps {
  portfolio: Portfolio;
  projects: Project[];
  tasks: Task[];
  risks: Risk[];
}

const COLOR_MAP: Record<string, { bg: string; border: string; text: string; shadow: string }> = {
  amber:   { bg: 'bg-amber-500/10',   border: 'border-amber-500',   text: 'text-amber-700 dark:text-amber-400',   shadow: 'shadow-[4px_4px_0_0_theme(colors.amber.500)]' },
  violet:  { bg: 'bg-violet-500/10',  border: 'border-violet-500',  text: 'text-violet-700 dark:text-violet-400',  shadow: 'shadow-[4px_4px_0_0_theme(colors.violet.500)]' },
  emerald: { bg: 'bg-emerald-500/10', border: 'border-emerald-500', text: 'text-emerald-700 dark:text-emerald-400', shadow: 'shadow-[4px_4px_0_0_theme(colors.emerald.500)]' },
  sky:     { bg: 'bg-sky-500/10',     border: 'border-sky-500',     text: 'text-sky-700 dark:text-sky-400',     shadow: 'shadow-[4px_4px_0_0_theme(colors.sky.500)]' },
  rose:    { bg: 'bg-rose-500/10',    border: 'border-rose-500',    text: 'text-rose-700 dark:text-rose-400',    shadow: 'shadow-[4px_4px_0_0_theme(colors.rose.500)]' },
  slate:   { bg: 'bg-slate-500/10',   border: 'border-slate-500',   text: 'text-slate-700 dark:text-slate-400',   shadow: 'shadow-[4px_4px_0_0_theme(colors.slate.500)]' },
};

const STATUS_ICON: Record<string, React.ReactNode> = {
  planning:    <CircleDotIcon className="size-3.5 text-sky-500" />,
  in_progress: <TrendingUpIcon className="size-3.5 text-amber-500" />,
  on_hold:     <PauseCircleIcon className="size-3.5 text-slate-400" />,
  completed:   <CheckCircle2Icon className="size-3.5 text-emerald-500" />,
  archived:    <ArchiveIcon className="size-3.5 text-slate-400" />,
};

function riskLevel(score: number | null) {
  if (!score) return { label: 'Unknown', cls: 'bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-300' };
  if (score >= 15) return { label: 'High', cls: 'bg-rose-100 text-rose-700 dark:bg-rose-900/40 dark:text-rose-300' };
  if (score >= 8)  return { label: 'Medium', cls: 'bg-amber-100 text-amber-700 dark:bg-amber-900/40 dark:text-amber-300' };
  return { label: 'Low', cls: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-300' };
}

export function PortfolioDetailClient({ portfolio, projects, tasks, risks }: PortfolioDetailClientProps) {
  const router = useRouter();
  const c = COLOR_MAP[portfolio.color ?? 'amber'] ?? COLOR_MAP.amber;

  const [deleting, setDeleting] = useState(false);

  const totalTasks = tasks.length;
  const doneTasks = tasks.filter((t) => t.status === 'done').length;
  const openRisks = risks.filter((r) => r.status !== 'closed').length;
  const avgProgress = projects.length > 0
    ? Math.round(projects.reduce((s, p) => s + (p.progressPercent ?? 0), 0) / projects.length)
    : 0;

  async function handleDelete() {
    if (!confirm(`Delete portfolio "${portfolio.name}"? Projects inside will remain but become unassigned.`)) return;
    setDeleting(true);
    try {
      const res = await fetch(`/api/portfolios/${portfolio.id}`, { method: 'DELETE' });
      if (!res.ok) throw new Error();
      toast.success(`Portfolio "${portfolio.name}" deleted`);
      router.push('/portfolios');
      router.refresh();
    } catch {
      toast.error('Failed to delete portfolio');
      setDeleting(false);
    }
  }

  return (
    <div className="flex flex-1 flex-col gap-6 p-6">
      {/* Header */}
      <Reveal direction="up">
        <div className="flex items-start justify-between gap-4">
          <div className="flex items-start gap-3">
            <div className={`mt-1 rounded-md border-2 ${c.border} ${c.bg} p-2.5`}>
              <BriefcaseIcon className={`size-6 ${c.text}`} />
            </div>
            <div>
              <h1 className={`text-2xl font-black tracking-tight ${c.text}`}>{portfolio.name}</h1>
              {portfolio.description && (
                <p className="text-sm text-muted-foreground mt-0.5 max-w-lg">{portfolio.description}</p>
              )}
            </div>
          </div>
          <Button
            variant="destructive"
            size="sm"
            onClick={handleDelete}
            disabled={deleting}
            className="gap-1.5"
          >
            <Trash2Icon className="size-3.5" />
            {deleting ? 'Deleting…' : 'Delete Portfolio'}
          </Button>
        </div>
      </Reveal>

      {/* KPI strip */}
      <Reveal direction="up">
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
          {[
            { label: 'Projects', value: projects.length, icon: FolderKanbanIcon },
            { label: 'Avg Progress', value: `${avgProgress}%`, icon: TrendingUpIcon },
            { label: 'Tasks Done', value: `${doneTasks}/${totalTasks}`, icon: CheckSquareIcon },
            { label: 'Open Risks', value: openRisks, icon: ShieldAlertIcon },
          ].map(({ label, value, icon: Icon }) => (
            <div key={label} className={`rounded-lg border-2 ${c.border} ${c.bg} p-4 ${c.shadow}`}>
              <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                <Icon className={`size-3.5 ${c.text}`} />
                {label}
              </div>
              <div className={`mt-1.5 text-2xl font-black ${c.text}`}>{value}</div>
            </div>
          ))}
        </div>
      </Reveal>

      {/* Projects */}
      <section>
        <Reveal direction="up">
          <h2 className="mb-3 text-sm font-black uppercase tracking-wider text-muted-foreground">
            Projects ({projects.length})
          </h2>
        </Reveal>

        {projects.length === 0 ? (
          <Reveal direction="up">
            <div className="rounded-lg border-2 border-dashed border-border p-8 text-center text-sm text-muted-foreground">
              No projects in this portfolio yet. Open a project and assign it here.
            </div>
          </Reveal>
        ) : (
          <StaggerContainer className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {projects.map((p) => (
              <StaggerItem key={p.id}>
                <Link href={`/projects/${p.id}`} className="group block focus:outline-none">
                  <motion.div
                    whileHover={{ y: -3 }}
                    whileTap={{ y: 1 }}
                    transition={{ type: 'spring', stiffness: 400, damping: 22 }}
                  >
                    <Card>
                      <CardContent className="p-4">
                        <div className="flex items-start justify-between gap-2">
                          <div className="min-w-0">
                            <p className="font-semibold text-sm group-hover:underline truncate">{p.name}</p>
                            {p.category && (
                              <p className="text-xs text-muted-foreground mt-0.5">{p.category}</p>
                            )}
                          </div>
                          <div className="shrink-0 flex items-center gap-1 text-xs text-muted-foreground capitalize">
                            {STATUS_ICON[p.status] ?? null}
                            {p.status.replace('_', ' ')}
                          </div>
                        </div>
                        <div className="mt-3">
                          <div className="flex items-center justify-between text-xs text-muted-foreground mb-1">
                            <span>Progress</span>
                            <span className="font-semibold">{p.progressPercent ?? 0}%</span>
                          </div>
                          <div className="h-1.5 rounded-full bg-muted overflow-hidden border border-border">
                            <motion.div
                              className={`h-full ${c.bg} border-r-2 ${c.border}`}
                              initial={{ width: 0 }}
                              animate={{ width: `${p.progressPercent ?? 0}%` }}
                              transition={{ duration: 0.7, ease: [0.34, 1.56, 0.64, 1] }}
                            />
                          </div>
                        </div>
                        <div className="mt-2 flex items-center gap-3 text-xs text-muted-foreground">
                          <span>{tasks.filter((t) => t.projectId === p.id).length} tasks</span>
                          <span>{risks.filter((r) => r.projectId === p.id).length} risks</span>
                        </div>
                      </CardContent>
                    </Card>
                  </motion.div>
                </Link>
              </StaggerItem>
            ))}
          </StaggerContainer>
        )}
      </section>

      {/* Risks summary */}
      {risks.length > 0 && (
        <section>
          <Reveal direction="up">
            <h2 className="mb-3 text-sm font-black uppercase tracking-wider text-muted-foreground">
              Risk Register ({risks.length})
            </h2>
          </Reveal>
          <Reveal direction="up">
            <Card>
              <CardContent className="p-0">
                <div className="divide-y divide-border">
                  {risks.slice(0, 8).map((r) => {
                    const lvl = riskLevel(r.riskScore);
                    const proj = projects.find((p) => p.id === r.projectId);
                    return (
                      <div key={r.id} className="flex items-center justify-between gap-3 px-4 py-3">
                        <div className="min-w-0">
                          <p className="text-sm font-medium truncate">{r.title}</p>
                          {proj && (
                            <p className="text-xs text-muted-foreground mt-0.5">{proj.name}</p>
                          )}
                        </div>
                        <div className="flex items-center gap-2 shrink-0">
                          <span className={`rounded-md px-2 py-0.5 text-xs font-semibold border ${lvl.cls}`}>
                            {lvl.label}
                          </span>
                          {r.riskScore != null && (
                            <span className="text-xs text-muted-foreground">Score: {r.riskScore}</span>
                          )}
                        </div>
                      </div>
                    );
                  })}
                  {risks.length > 8 && (
                    <div className="px-4 py-2 text-xs text-muted-foreground text-center">
                      +{risks.length - 8} more risks across projects
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          </Reveal>
        </section>
      )}
    </div>
  );
}
