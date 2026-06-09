'use client';

import * as React from 'react';
import Link from 'next/link';
import { motion, AnimatePresence } from 'framer-motion';
import { toast } from 'sonner';
import {
  CheckCircle2Icon,
  ClockIcon,
  AlertCircleIcon,
  CircleIcon,
  FilterIcon,
  FolderKanbanIcon,
  ListTodoIcon,
} from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { cn } from '@/lib/utils';
import {
  getTaskStatusMeta,
  getTaskPriorityMeta,
  formatDate,
  TASK_STATUSES,
  TASK_PRIORITIES,
} from '@/lib/project-helpers';
import { Reveal, StaggerContainer, StaggerItem } from '@/components/motion';
import { PMBOKGuide } from '@/components/pmbok';
import { updateTaskStatus } from '@/actions/tasks';

type Task = {
  id: number;
  projectId: number;
  projectName: string;
  title: string;
  description: string | null;
  status: string;
  priority: string | null;
  dueDate: Date | null;
  completedDate: Date | null;
  estimatedHours: string | null;
  wbsCode: string | null;
  orderIndex: number | null;
  parentId: number | null;
  predecessorId: number | null;
  estimatedCost: string | null;
  createdAt: Date;
  updatedAt: Date;
};

type Project = { id: number; name: string; status: string };

interface TasksClientProps {
  allTasks: Task[];
  projects: Project[];
}

const STATUS_COLUMNS = [
  { key: 'todo', label: 'To Do', icon: CircleIcon, color: 'text-muted-foreground/60' },
  { key: 'in_progress', label: 'In Progress', icon: ClockIcon, color: 'text-blue-500' },
  { key: 'review', label: 'Review', icon: AlertCircleIcon, color: 'text-amber-500' },
  { key: 'done', label: 'Done', icon: CheckCircle2Icon, color: 'text-emerald-500' },
] as const;

function TaskRow({ task, onStatusToggle }: { task: Task; onStatusToggle: (id: number, status: string) => void }) {
  const statusMeta = getTaskStatusMeta(task.status);
  const priorityMeta = getTaskPriorityMeta(task.priority);

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, x: -8 }}
      className="group flex items-start gap-3 rounded-lg border border-border/50 bg-card/60 p-3 backdrop-blur-sm transition-all hover:bg-muted/40 hover:border-border"
    >
      <motion.button
        type="button"
        onClick={() => onStatusToggle(task.id, task.status === 'done' ? 'todo' : 'done')}
        className="mt-0.5 shrink-0"
        whileTap={{ scale: 0.8, rotate: 10 }}
        transition={{ type: 'spring', stiffness: 500, damping: 15 }}
      >
        {task.status === 'done' ? (
          <CheckCircle2Icon className="size-5 text-emerald-500" />
        ) : task.status === 'in_progress' ? (
          <ClockIcon className="size-5 text-blue-500" />
        ) : task.status === 'review' ? (
          <AlertCircleIcon className="size-5 text-amber-500" />
        ) : (
          <CircleIcon className="size-5 text-muted-foreground/40" />
        )}
      </motion.button>

      <div className="min-w-0 flex-1">
        <div className="flex items-center gap-2 flex-wrap">
          <span
            className={cn(
              'text-sm font-medium',
              task.status === 'done' && 'line-through text-muted-foreground'
            )}
          >
            {task.title}
          </span>
          <span
            className={cn(
              'inline-flex items-center rounded-full px-1.5 py-0.5 text-[10px] font-medium',
              priorityMeta.color
            )}
          >
            {priorityMeta.label}
          </span>
        </div>
        <div className="mt-1 flex items-center gap-2 flex-wrap text-[11px] text-muted-foreground">
          <Link
            href={`/projects/${task.projectId}`}
            className="flex items-center gap-1 hover:text-primary transition-colors"
            onClick={(e) => e.stopPropagation()}
          >
            <FolderKanbanIcon className="size-3" />
            {task.projectName}
          </Link>
          <span className="text-border/60">·</span>
          <span
            className={cn(
              'inline-flex items-center rounded-full px-1.5 py-0.5 text-[10px] font-medium',
              statusMeta.color
            )}
          >
            {statusMeta.label}
          </span>
          {task.dueDate && (
            <>
              <span className="text-border/60">·</span>
              <span>Due {formatDate(task.dueDate)}</span>
            </>
          )}
          {task.estimatedHours && (
            <>
              <span className="text-border/60">·</span>
              <span>{task.estimatedHours}h</span>
            </>
          )}
        </div>
      </div>
    </motion.div>
  );
}

export function TasksClient({ allTasks, projects }: TasksClientProps) {
  const [tasks, setTasks] = React.useState<Task[]>(allTasks);
  const [filterProject, setFilterProject] = React.useState<string>('all');
  const [filterStatus, setFilterStatus] = React.useState<string>('all');
  const [filterPriority, setFilterPriority] = React.useState<string>('all');

  function handleStatusToggle(id: number, newStatus: string) {
    setTasks((prev) =>
      prev.map((t) =>
        t.id === id
          ? { ...t, status: newStatus, completedDate: newStatus === 'done' ? new Date() : t.completedDate }
          : t
      )
    );
    const task = tasks.find((t) => t.id === id);
    if (task) {
      updateTaskStatus(id, task.projectId, newStatus).catch(() => {
        toast.error('Failed to update task');
        setTasks(allTasks);
      });
    }
  }

  const filtered = tasks.filter((t) => {
    if (filterProject !== 'all' && String(t.projectId) !== filterProject) return false;
    if (filterStatus !== 'all' && t.status !== filterStatus) return false;
    if (filterPriority !== 'all' && t.priority !== filterPriority) return false;
    return true;
  });

  const byCols = STATUS_COLUMNS.map((col) => ({
    ...col,
    items: filtered.filter((t) => t.status === col.key),
  }));

  const totalDone = tasks.filter((t) => t.status === 'done').length;
  const completionRate = tasks.length > 0 ? Math.round((totalDone / tasks.length) * 100) : 0;

  return (
    <div className="flex flex-1 flex-col gap-6 p-6">
      <Reveal direction="up">
        <div className="flex items-start justify-between gap-4">
          <div>
            <h1 className="text-2xl font-black tracking-tight text-foreground">Tasks</h1>
            <p className="text-sm text-muted-foreground">
              {tasks.length} task{tasks.length !== 1 ? 's' : ''} across {projects.length} project
              {projects.length !== 1 ? 's' : ''} — {completionRate}% complete
            </p>
          </div>
        </div>
      </Reveal>

      <PMBOKGuide context="tasks" />

      {/* Stats bar */}
      <StaggerContainer className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        {STATUS_COLUMNS.map((col) => {
          const count = tasks.filter((t) => t.status === col.key).length;
          const Icon = col.icon;
          return (
            <StaggerItem key={col.key}>
              <motion.button
                type="button"
                onClick={() => setFilterStatus(filterStatus === col.key ? 'all' : col.key)}
                className="w-full"
                whileTap={{ scale: 0.95 }}
                transition={{ type: 'spring', stiffness: 400, damping: 18 }}
              >
                <Card
                  className={cn(
                    'border-border/50 bg-card/60 backdrop-blur-sm transition-all cursor-pointer hover:border-primary/30 hover:shadow-sm',
                    filterStatus === col.key && 'border-primary/40 bg-primary/5'
                  )}
                >
                  <CardContent className="flex items-center gap-2 p-3">
                    <Icon className={cn('size-4 shrink-0', col.color)} />
                    <div className="text-left min-w-0">
                      <p className="text-xs text-muted-foreground truncate">{col.label}</p>
                      <p className="text-lg font-bold tabular-nums leading-none">{count}</p>
                    </div>
                  </CardContent>
                </Card>
              </motion.button>
            </StaggerItem>
          );
        })}
      </StaggerContainer>

      {/* Filters */}
      <div className="flex flex-wrap items-center gap-2">
        <FilterIcon className="size-4 text-muted-foreground shrink-0" />
        <Select value={filterProject} onValueChange={(v) => setFilterProject(v ?? 'all')}>
          <SelectTrigger className="w-[160px] h-8 text-xs">
            <SelectValue placeholder="All projects" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All projects</SelectItem>
            {projects.map((p) => (
              <SelectItem key={p.id} value={String(p.id)}>
                {p.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Select value={filterStatus} onValueChange={(v) => setFilterStatus(v ?? 'all')}>
          <SelectTrigger className="w-[140px] h-8 text-xs">
            <SelectValue placeholder="All statuses" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All statuses</SelectItem>
            {TASK_STATUSES.map((s) => (
              <SelectItem key={s.value} value={s.value}>
                {s.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Select value={filterPriority} onValueChange={(v) => setFilterPriority(v ?? 'all')}>
          <SelectTrigger className="w-[140px] h-8 text-xs">
            <SelectValue placeholder="All priorities" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All priorities</SelectItem>
            {TASK_PRIORITIES.map((p) => (
              <SelectItem key={p.value} value={p.value}>
                {p.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        {(filterProject !== 'all' || filterStatus !== 'all' || filterPriority !== 'all') && (
          <Button
            variant="ghost"
            size="sm"
            className="h-8 text-xs"
            onClick={() => {
              setFilterProject('all');
              setFilterStatus('all');
              setFilterPriority('all');
            }}
          >
            Clear filters
          </Button>
        )}
        <span className="text-xs text-muted-foreground ml-auto">
          {filtered.length} task{filtered.length !== 1 ? 's' : ''}
        </span>
      </div>

      {/* Task list */}
      {filtered.length === 0 ? (
        <div className="flex flex-col items-center justify-center gap-3 rounded-xl border-2 border-dashed p-16 text-center">
          <ListTodoIcon className="size-10 text-muted-foreground/40" />
          <div>
            <p className="font-medium">
              {tasks.length === 0 ? 'No tasks yet' : 'No tasks match your filters'}
            </p>
            <p className="text-sm text-muted-foreground mt-1">
              {tasks.length === 0
                ? 'Create tasks inside your projects to see them here.'
                : 'Try adjusting your filters.'}
            </p>
          </div>
          {tasks.length === 0 && (
            <Button variant="outline" size="sm" nativeButton={false} render={<Link href="/projects" />}>
              Go to Projects
            </Button>
          )}
        </div>
      ) : (
        <div className="space-y-2">
          <AnimatePresence mode="popLayout">
            {filtered.map((task) => (
              <TaskRow key={task.id} task={task} onStatusToggle={handleStatusToggle} />
            ))}
          </AnimatePresence>
        </div>
      )}
    </div>
  );
}
