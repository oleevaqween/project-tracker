'use client';

import * as React from 'react';
import { useRouter } from 'next/navigation';
import { DndContext, PointerSensor, KeyboardSensor, useSensor, useSensors, closestCorners } from '@dnd-kit/core';
import { SortableContext, verticalListSortingStrategy } from '@dnd-kit/sortable';
import { motion } from 'framer-motion';
import confetti from 'canvas-confetti';
import {
  FolderKanbanIcon,
  MoreHorizontalIcon,
  PlusIcon,
  PencilIcon,
  TrashIcon,
  CheckCircle2Icon,
  ClockIcon,
  AlertCircleIcon,
  CircleIcon,
  ChevronRightIcon,
  ListTreeIcon,
  LayoutDashboardIcon,
  ChevronDownIcon,
} from 'lucide-react';
import { toast } from 'sonner';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardAction } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { cn } from '@/lib/utils';
import {
  StatusBadge,
  FocusAreaBadge,
  formatDate,
  formatBudget,
  CURRENCIES,
  parseBudgetInput,
  formatBudgetInput,
  TASK_STATUSES,
  TASK_PRIORITIES,
  PROJECT_STATUSES,
  FOCUS_AREAS,
  getTaskStatusMeta,
  getTaskPriorityMeta,
} from '@/lib/project-helpers';
import { FocusAreaStepper } from '@/components/focus-area-stepper';
import { SortableTaskItem } from '@/components/sortable-task-item';
import { updateProject, deleteProject } from '@/actions/projects';
import { updateFocusArea } from '@/actions/projects';
import { NotesTab } from '@/components/tabs/notes-tab';
import { StakeholdersTab } from '@/components/tabs/stakeholders-tab';
import { RisksTab } from '@/components/tabs/risks-tab';
import { ChangeRequestsTab } from '@/components/tabs/change-requests-tab';
import { LessonsLearnedTab } from '@/components/tabs/lessons-learned-tab';
import { CharterTab } from '@/components/tabs/charter-tab';
import { LegacySummaryTab } from '@/components/tabs/legacy-summary-tab';
import { ReportsTab } from '@/components/tabs/reports-tab';
import { IssuesTab } from '@/components/tabs/issues-tab';
import { DomainHealthDashboard } from '@/components/domain-health-dashboard';
import { computeDomainHealth } from '@/lib/domain-health';
import {
  createTask,
  updateTask,
  deleteTask,
  updateTaskStatus,
} from '@/actions/tasks';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';

type Project = typeof import('@/db/schema').projects.$inferSelect;
type Task = typeof import('@/db/schema').tasks.$inferSelect;
type Note = typeof import('@/db/schema').notes.$inferSelect;
type Stakeholder = typeof import('@/db/schema').stakeholders.$inferSelect;
type Risk = typeof import('@/db/schema').risks.$inferSelect;
type ChangeRequest = typeof import('@/db/schema').changeRequests.$inferSelect;
type Lesson = typeof import('@/db/schema').lessonsLearned.$inferSelect;
type Issue = typeof import('@/db/schema').issues.$inferSelect;

// FOCUS_AREAS order for advancement
const FOCUS_AREA_SEQUENCE = ['initiating', 'planning', 'executing', 'monitoring_controlling', 'closing'];
const FOCUS_AREA_CHECKLIST: Record<string, string[]> = {
  initiating: ['Project Charter drafted and approved', 'Key stakeholders identified', 'High-level scope documented', 'Project authorized to proceed'],
  planning: ['Project Management Plan complete', 'WBS and task list created', 'Risk Register populated', 'Schedule baseline set', 'Stakeholders engaged'],
  executing: ['Deliverables are being produced', 'Team coordinated on active tasks', 'Change requests being logged', 'Stakeholder communications ongoing'],
  monitoring_controlling: ['All deliverables validated against acceptance criteria', 'All change requests resolved', 'Performance metrics reported', 'Risks monitored and closed'],
  closing: ['Project is complete. No further advancement.'],
};

// ---------- Edit Project Dialog ----------

const editProjectSchema = z.object({
  name: z.string().min(1, 'Project name is required').max(255),
  description: z.string().optional(),
  status: z.string(),
  currentFocusArea: z.string(),
  category: z.string().optional(),
  currency: z.string(),
  budget: z.string().optional(),
  startDate: z.string().optional(),
  targetEndDate: z.string().optional(),
});

type EditProjectForm = z.infer<typeof editProjectSchema>;

function EditProjectDialog({
  project,
  open,
  onOpenChange,
  onProjectUpdated,
}: {
  project: Project;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onProjectUpdated: (project: Project) => void;
}) {
  const [isPending, startTransition] = React.useTransition();

  const form = useForm<EditProjectForm>({
    resolver: zodResolver(editProjectSchema),
    defaultValues: {
      name: project.name,
      description: project.description ?? '',
      status: project.status,
      currentFocusArea: project.currentFocusArea ?? 'initiating',
      category: project.category ?? '',
      currency: project.currency ?? 'USD',
      budget: project.budget ?? '',
      startDate: project.startDate ? new Date(project.startDate).toISOString().split('T')[0] : '',
      targetEndDate: project.targetEndDate ? new Date(project.targetEndDate).toISOString().split('T')[0] : '',
    },
  });

  // Reset form when project changes
  React.useEffect(() => {
    form.reset({
      name: project.name,
      description: project.description ?? '',
      status: project.status,
      currentFocusArea: project.currentFocusArea ?? 'initiating',
      category: project.category ?? '',
      currency: project.currency ?? 'USD',
      budget: project.budget ?? '',
      startDate: project.startDate ? new Date(project.startDate).toISOString().split('T')[0] : '',
      targetEndDate: project.targetEndDate ? new Date(project.targetEndDate).toISOString().split('T')[0] : '',
    });
  }, [project, form]);

  function onSubmit(data: EditProjectForm) {
    startTransition(async () => {
      try {
        const updated = await updateProject(project.id, {
          name: data.name,
          description: data.description || null,
          status: data.status,
          currentFocusArea: data.currentFocusArea || null,
          category: data.category || null,
          currency: data.currency || 'USD',
          budget: data.budget ? parseBudgetInput(data.budget) : null,
          startDate: data.startDate ? new Date(data.startDate) : null,
          targetEndDate: data.targetEndDate ? new Date(data.targetEndDate) : null,
        });
        if (!updated) {
          toast.error('Failed to update project');
          return;
        }
        toast.success('Project updated');
        onProjectUpdated(updated);
        onOpenChange(false);
      } catch (error) {
        toast.error('Failed to update project');
        console.error(error);
      }
    });
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg max-h-[85vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Edit Project</DialogTitle>
          <DialogDescription>Update project details and settings.</DialogDescription>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="flex flex-col gap-4">
            <FormField
              control={form.control}
              name="name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Name *</FormLabel>
                  <FormControl><Input {...field} /></FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="description"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Description</FormLabel>
                  <FormControl><Textarea className="min-h-[80px] resize-none" {...field} /></FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <div className="grid grid-cols-2 gap-4">
              <FormField control={form.control} name="status" render={({ field }) => (
                <FormItem>
                  <FormLabel>Status</FormLabel>
                  <Select value={field.value} onValueChange={field.onChange}>
                    <FormControl><SelectTrigger className="w-full"><SelectValue /></SelectTrigger></FormControl>
                    <SelectContent>
                      {PROJECT_STATUSES.map((s) => <SelectItem key={s.value} value={s.value}>{s.label}</SelectItem>)}
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )} />
              <FormField control={form.control} name="currentFocusArea" render={({ field }) => (
                <FormItem>
                  <FormLabel>Focus Area</FormLabel>
                  <Select value={field.value ?? undefined} onValueChange={field.onChange}>
                    <FormControl><SelectTrigger className="w-full"><SelectValue /></SelectTrigger></FormControl>
                    <SelectContent>
                      {FOCUS_AREAS.map((a) => <SelectItem key={a.value} value={a.value}>{a.label}</SelectItem>)}
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )} />
            </div>
            <FormField control={form.control} name="category" render={({ field }) => (
              <FormItem>
                <FormLabel>Category</FormLabel>
                <FormControl><Input placeholder="e.g. Software, Marketing" {...field} /></FormControl>
                <FormMessage />
              </FormItem>
            )} />
            <div className="grid grid-cols-[140px_1fr] gap-3">
              <FormField control={form.control} name="currency" render={({ field }) => (
                <FormItem>
                  <FormLabel>Currency</FormLabel>
                  <Select value={field.value} onValueChange={field.onChange}>
                    <FormControl><SelectTrigger className="w-full"><SelectValue /></SelectTrigger></FormControl>
                    <SelectContent>
                      {CURRENCIES.map((c) => <SelectItem key={c.code} value={c.code}>{c.label}</SelectItem>)}
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )} />
              <FormField control={form.control} name="budget" render={({ field }) => (
                <FormItem>
                  <FormLabel>Budget</FormLabel>
                  <FormControl>
                    <Input
                      type="text"
                      inputMode="numeric"
                      placeholder="0"
                      name={field.name}
                      ref={field.ref}
                      value={field.value ? formatBudgetInput(field.value) : ''}
                      onBlur={field.onBlur}
                      onChange={(e) => {
                        const input = e.target;
                        const selStart = input.selectionStart ?? input.value.length;
                        const rawDigitsBefore = input.value.slice(0, selStart).replace(/[^0-9.]/g, '').length;
                        const raw = input.value.replace(/[^0-9.]/g, '');
                        const formatted = raw ? formatBudgetInput(raw) : '';
                        field.onChange(raw);
                        requestAnimationFrame(() => {
                          if (!input.isConnected) return;
                          let count = 0;
                          let newPos = formatted.length;
                          for (let i = 0; i < formatted.length; i++) {
                            if (/[0-9.]/.test(formatted[i])) {
                              count++;
                              if (count > rawDigitsBefore) { newPos = i; break; }
                            }
                          }
                          input.setSelectionRange(newPos, newPos);
                        });
                      }}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )} />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <FormField control={form.control} name="startDate" render={({ field }) => (
                <FormItem>
                  <FormLabel>Start Date</FormLabel>
                  <FormControl><Input type="date" {...field} /></FormControl>
                  <FormMessage />
                </FormItem>
              )} />
              <FormField control={form.control} name="targetEndDate" render={({ field }) => (
                <FormItem>
                  <FormLabel>Target End Date</FormLabel>
                  <FormControl><Input type="date" {...field} /></FormControl>
                  <FormMessage />
                </FormItem>
              )} />
            </div>
            <DialogFooter showCloseButton>
              <Button type="submit" disabled={isPending}>
                {isPending ? 'Saving...' : 'Save Changes'}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}

// ---------- Create Task Dialog ----------

const createTaskSchema = z.object({
  title: z.string().min(1, 'Task title is required').max(500),
  description: z.string().optional(),
  status: z.string(),
  priority: z.string(),
  dueDate: z.string().optional(),
  estimatedHours: z.string().optional(),
});

type CreateTaskForm = z.infer<typeof createTaskSchema>;

function CreateTaskDialog({
  projectId,
  open,
  onOpenChange,
  onTaskCreated,
}: {
  projectId: number;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onTaskCreated: (task: Task) => void;
}) {
  const [isPending, startTransition] = React.useTransition();

  const form = useForm<CreateTaskForm>({
    resolver: zodResolver(createTaskSchema),
    defaultValues: {
      title: '',
      description: '',
      status: 'todo',
      priority: 'medium',
      dueDate: '',
      estimatedHours: '',
    },
  });

  function onSubmit(data: CreateTaskForm) {
    startTransition(async () => {
      try {
        const task = await createTask({
          projectId,
          title: data.title,
          description: data.description || null,
          status: data.status,
          priority: data.priority,
          dueDate: data.dueDate ? new Date(data.dueDate) : null,
          estimatedHours: data.estimatedHours || null,
        });
        toast.success('Task created');
        onTaskCreated(task);
        onOpenChange(false);
        form.reset();
      } catch (error) {
        toast.error('Failed to create task');
        console.error(error);
      }
    });
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg max-h-[85vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Add Task</DialogTitle>
          <DialogDescription>Create a new task for this project.</DialogDescription>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="flex flex-col gap-4">
            <FormField control={form.control} name="title" render={({ field }) => (
              <FormItem>
                <FormLabel>Title *</FormLabel>
                <FormControl><Input placeholder="Task title" {...field} /></FormControl>
                <FormMessage />
              </FormItem>
            )} />
            <FormField control={form.control} name="description" render={({ field }) => (
              <FormItem>
                <FormLabel>Description</FormLabel>
                <FormControl><Textarea className="min-h-[60px] resize-none" placeholder="Optional description..." {...field} /></FormControl>
                <FormMessage />
              </FormItem>
            )} />
            <div className="grid grid-cols-2 gap-4">
              <FormField control={form.control} name="status" render={({ field }) => (
                <FormItem>
                  <FormLabel>Status</FormLabel>
                  <Select value={field.value} onValueChange={field.onChange}>
                    <FormControl><SelectTrigger className="w-full"><SelectValue /></SelectTrigger></FormControl>
                    <SelectContent>
                      {TASK_STATUSES.map((s) => <SelectItem key={s.value} value={s.value}>{s.label}</SelectItem>)}
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )} />
              <FormField control={form.control} name="priority" render={({ field }) => (
                <FormItem>
                  <FormLabel>Priority</FormLabel>
                  <Select value={field.value} onValueChange={field.onChange}>
                    <FormControl><SelectTrigger className="w-full"><SelectValue /></SelectTrigger></FormControl>
                    <SelectContent>
                      {TASK_PRIORITIES.map((p) => <SelectItem key={p.value} value={p.value}>{p.label}</SelectItem>)}
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )} />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <FormField control={form.control} name="dueDate" render={({ field }) => (
                <FormItem>
                  <FormLabel>Due Date</FormLabel>
                  <FormControl><Input type="date" {...field} /></FormControl>
                  <FormMessage />
                </FormItem>
              )} />
              <FormField control={form.control} name="estimatedHours" render={({ field }) => (
                <FormItem>
                  <FormLabel>Est. Hours</FormLabel>
                  <FormControl><Input type="number" placeholder="0" min="0" step="0.5" {...field} /></FormControl>
                  <FormMessage />
                </FormItem>
              )} />
            </div>
            <DialogFooter showCloseButton>
              <Button type="submit" disabled={isPending}>
                {isPending ? 'Creating...' : 'Add Task'}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}

// ---------- Edit Task Dialog (EVM + details) ----------

const editTaskSchema = z.object({
  title: z.string().min(1, 'Task title is required').max(500),
  description: z.string().optional(),
  status: z.string(),
  priority: z.string(),
  dueDate: z.string().optional(),
  estimatedHours: z.string().optional(),
  estimatedCost: z.string().optional(),
  actualHours: z.string().optional(),
  actualCost: z.string().optional(),
  percentComplete: z.number().min(0).max(100),
});

type EditTaskForm = z.infer<typeof editTaskSchema>;

function EditTaskDialog({
  projectId,
  task,
  open,
  onOpenChange,
  onTaskUpdated,
}: {
  projectId: number;
  task: Task | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onTaskUpdated: (task: Task) => void;
}) {
  const [isPending, startTransition] = React.useTransition();

  const form = useForm<EditTaskForm>({
    resolver: zodResolver(editTaskSchema),
    defaultValues: {
      title: task?.title ?? '',
      description: task?.description ?? '',
      status: task?.status ?? 'todo',
      priority: task?.priority ?? 'medium',
      dueDate: task?.dueDate ? new Date(task.dueDate).toISOString().split('T')[0] : '',
      estimatedHours: task?.estimatedHours ?? '',
      estimatedCost: task?.estimatedCost ?? '',
      actualHours: task?.actualHours ?? '',
      actualCost: task?.actualCost ?? '',
      percentComplete: task?.percentComplete ?? 0,
    },
  });

  React.useEffect(() => {
    form.reset({
      title: task?.title ?? '',
      description: task?.description ?? '',
      status: task?.status ?? 'todo',
      priority: task?.priority ?? 'medium',
      dueDate: task?.dueDate ? new Date(task.dueDate).toISOString().split('T')[0] : '',
      estimatedHours: task?.estimatedHours ?? '',
      estimatedCost: task?.estimatedCost ?? '',
      actualHours: task?.actualHours ?? '',
      actualCost: task?.actualCost ?? '',
      percentComplete: task?.percentComplete ?? 0,
    });
  }, [task, form]);

  function onSubmit(data: EditTaskForm) {
    if (!task) return;
    startTransition(async () => {
      try {
        const updated = await updateTask(task.id, projectId, {
          title: data.title,
          description: data.description || null,
          status: data.status,
          priority: data.priority,
          dueDate: data.dueDate ? new Date(data.dueDate) : null,
          estimatedHours: data.estimatedHours || null,
          estimatedCost: data.estimatedCost || null,
          actualHours: data.actualHours || null,
          actualCost: data.actualCost || null,
          percentComplete: data.percentComplete,
        });
        if (!updated) return;
        toast.success('Task updated');
        onTaskUpdated(updated);
        onOpenChange(false);
      } catch (error) {
        toast.error('Failed to update task');
        console.error(error);
      }
    });
  }

  const percentComplete = form.watch('percentComplete');

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg max-h-[85vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Edit Task</DialogTitle>
          <DialogDescription>Update task details and record actuals for EVM tracking.</DialogDescription>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="flex flex-col gap-4">
            <FormField control={form.control} name="title" render={({ field }) => (
              <FormItem>
                <FormLabel>Title *</FormLabel>
                <FormControl><Input {...field} /></FormControl>
                <FormMessage />
              </FormItem>
            )} />
            <FormField control={form.control} name="description" render={({ field }) => (
              <FormItem>
                <FormLabel>Description</FormLabel>
                <FormControl><Textarea className="min-h-[60px] resize-none" {...field} /></FormControl>
                <FormMessage />
              </FormItem>
            )} />
            <div className="grid grid-cols-2 gap-4">
              <FormField control={form.control} name="status" render={({ field }) => (
                <FormItem>
                  <FormLabel>Status</FormLabel>
                  <Select value={field.value} onValueChange={field.onChange}>
                    <FormControl><SelectTrigger className="w-full"><SelectValue /></SelectTrigger></FormControl>
                    <SelectContent>
                      {TASK_STATUSES.map((s) => <SelectItem key={s.value} value={s.value}>{s.label}</SelectItem>)}
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )} />
              <FormField control={form.control} name="priority" render={({ field }) => (
                <FormItem>
                  <FormLabel>Priority</FormLabel>
                  <Select value={field.value} onValueChange={field.onChange}>
                    <FormControl><SelectTrigger className="w-full"><SelectValue /></SelectTrigger></FormControl>
                    <SelectContent>
                      {TASK_PRIORITIES.map((p) => <SelectItem key={p.value} value={p.value}>{p.label}</SelectItem>)}
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )} />
            </div>
            <FormField control={form.control} name="dueDate" render={({ field }) => (
              <FormItem>
                <FormLabel>Due Date</FormLabel>
                <FormControl><Input type="date" {...field} /></FormControl>
                <FormMessage />
              </FormItem>
            )} />

            {/* % Complete slider */}
            <FormField control={form.control} name="percentComplete" render={({ field }) => (
              <FormItem>
                <div className="flex items-center justify-between">
                  <FormLabel>% Complete</FormLabel>
                  <span className="text-sm font-semibold tabular-nums text-primary">{percentComplete}%</span>
                </div>
                <FormControl>
                  <input
                    type="range"
                    min={0}
                    max={100}
                    step={5}
                    value={field.value}
                    onChange={(e) => field.onChange(Number(e.target.value))}
                    className="w-full accent-primary"
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )} />

            {/* Planned (estimate) */}
            <div className="rounded-lg border p-3 space-y-3">
              <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">Planned (Estimates)</p>
              <div className="grid grid-cols-2 gap-4">
                <FormField control={form.control} name="estimatedHours" render={({ field }) => (
                  <FormItem>
                    <FormLabel>Est. Hours</FormLabel>
                    <FormControl><Input type="number" placeholder="0" min="0" step="0.5" {...field} /></FormControl>
                    <FormMessage />
                  </FormItem>
                )} />
                <FormField control={form.control} name="estimatedCost" render={({ field }) => (
                  <FormItem>
                    <FormLabel>Est. Cost ($)</FormLabel>
                    <FormControl><Input type="number" placeholder="0" min="0" step="0.01" {...field} /></FormControl>
                    <FormMessage />
                  </FormItem>
                )} />
              </div>
            </div>

            {/* Actuals (EVM) */}
            <div className="rounded-lg border p-3 space-y-3">
              <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">Actuals (EVM)</p>
              <div className="grid grid-cols-2 gap-4">
                <FormField control={form.control} name="actualHours" render={({ field }) => (
                  <FormItem>
                    <FormLabel>Actual Hours</FormLabel>
                    <FormControl><Input type="number" placeholder="0" min="0" step="0.5" {...field} /></FormControl>
                    <FormMessage />
                  </FormItem>
                )} />
                <FormField control={form.control} name="actualCost" render={({ field }) => (
                  <FormItem>
                    <FormLabel>Actual Cost ($)</FormLabel>
                    <FormControl><Input type="number" placeholder="0" min="0" step="0.01" {...field} /></FormControl>
                    <FormMessage />
                  </FormItem>
                )} />
              </div>
            </div>

            <DialogFooter showCloseButton>
              <Button type="submit" disabled={isPending}>
                {isPending ? 'Saving...' : 'Save Changes'}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}

// ---------- Task Item ----------

function TaskItem({
  task,
  onStatusChange,
  onDelete,
  onEdit,
}: {
  task: Task;
  onStatusChange: (id: number, status: string) => void;
  onDelete: (id: number) => void;
  onEdit: (task: Task) => void;
}) {
  const statusMeta = getTaskStatusMeta(task.status);
  const priorityMeta = getTaskPriorityMeta(task.priority);

  return (
    <div className="group flex items-start gap-3 rounded-lg border p-3 transition-colors hover:bg-muted/50">
      <button
        type="button"
        onClick={() => {
          const nextStatus = task.status === 'done' ? 'todo' : 'done';
          onStatusChange(task.id, nextStatus);
        }}
        className="mt-0.5 shrink-0"
        title={task.status === 'done' ? 'Mark as to do' : 'Mark as done'}
      >
        {task.status === 'done' ? (
          <CheckCircle2Icon className="size-5 text-emerald-500" />
        ) : task.status === 'in_progress' ? (
          <ClockIcon className="size-5 text-blue-500" />
        ) : task.status === 'review' ? (
          <AlertCircleIcon className="size-5 text-amber-500" />
        ) : (
          <CircleIcon className="size-5 text-muted-foreground/50" />
        )}
      </button>

      <div className="min-w-0 flex-1">
        <div className="flex items-center gap-2">
          <span className={cn('text-sm font-medium', task.status === 'done' && 'line-through text-muted-foreground')}>
            {task.title}
          </span>
          <span className={cn('inline-flex items-center rounded-full px-1.5 py-0.5 text-[10px] font-medium', priorityMeta.color)}>
            {priorityMeta.label}
          </span>
        </div>
        {task.description && (
          <p className="mt-0.5 text-xs text-muted-foreground line-clamp-2">{task.description}</p>
        )}
        <div className="mt-1 flex items-center gap-3 text-[11px] text-muted-foreground">
          <span className={cn('inline-flex items-center rounded-full px-1.5 py-0.5 text-[10px] font-medium', statusMeta.color)}>
            {statusMeta.label}
          </span>
          {task.dueDate && <span>Due {formatDate(task.dueDate)}</span>}
          {task.estimatedHours && <span>{task.estimatedHours}h est.</span>}
        </div>
      </div>

      <DropdownMenu>
        <DropdownMenuTrigger render={<Button variant="ghost" size="icon-sm" className="opacity-0 group-hover:opacity-100 transition-opacity" />}>
          <MoreHorizontalIcon className="size-4" />
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end">
          <DropdownMenuItem onClick={() => onEdit(task)}>
            <PencilIcon className="mr-2 size-4" /> Edit Task
          </DropdownMenuItem>
          <DropdownMenuSeparator />
          <DropdownMenuItem onClick={() => onStatusChange(task.id, 'in_progress')}>
            <ClockIcon className="mr-2 size-4" /> Mark In Progress
          </DropdownMenuItem>
          <DropdownMenuItem onClick={() => onStatusChange(task.id, 'review')}>
            <AlertCircleIcon className="mr-2 size-4" /> Mark Review
          </DropdownMenuItem>
          <DropdownMenuItem onClick={() => onStatusChange(task.id, 'done')}>
            <CheckCircle2Icon className="mr-2 size-4" /> Mark Done
          </DropdownMenuItem>
          <DropdownMenuSeparator />
          <DropdownMenuItem
            className="text-destructive focus:text-destructive"
            onClick={() => onDelete(task.id)}
          >
            <TrashIcon className="mr-2 size-4" /> Delete Task
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  );
}

// ---------- Overview Tab ----------

function OverviewTab({
  project,
  tasks,
  risks,
  stakeholders,
  changeRequests,
}: {
  project: Project;
  tasks: Task[];
  risks: Risk[];
  stakeholders: Stakeholder[];
  changeRequests: ChangeRequest[];
}) {
  const health = computeDomainHealth(project, tasks, risks, stakeholders, changeRequests);

  return (
    <div className="space-y-6">
      {/* ── OVERVIEW CARDS ── 7fr/5fr asymmetric (≠ KPI grid, ≠ chart grid)
          60/40 split makes Details card visually dominant, Progress card a
          tighter companion. Different ratio from every other grid in the app. */}
      <div className="grid gap-4 lg:grid-cols-[7fr_5fr]">
        <Card>
          <CardHeader>
            <CardTitle className="text-[11px] font-medium uppercase tracking-[0.12em] text-muted-foreground">Project Details</CardTitle>
          </CardHeader>
          <CardContent className="grid gap-3 text-sm">
            <div className="flex justify-between">
              <span className="text-muted-foreground">Status</span>
              <StatusBadge value={project.status} />
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Focus Area</span>
              <FocusAreaBadge value={project.currentFocusArea} />
            </div>
            {project.category && (
              <div className="flex justify-between">
                <span className="text-muted-foreground">Category</span>
                <span>{project.category}</span>
              </div>
            )}
            {project.budget && (
              <div className="flex justify-between">
                <span className="text-muted-foreground">Budget</span>
                <span>{formatBudget(project.budget, project.currency)}</span>
              </div>
            )}
            <div className="flex justify-between">
              <span className="text-muted-foreground">Start Date</span>
              <span>{formatDate(project.startDate)}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Target End</span>
              <span>{formatDate(project.targetEndDate)}</span>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-[11px] font-medium uppercase tracking-[0.12em] text-muted-foreground">Progress</CardTitle>
          </CardHeader>
          <CardContent className="grid gap-3">
            <div>
              <div className="flex items-center justify-between text-sm mb-2">
                <span className="text-muted-foreground">Overall Progress</span>
                <span className="font-medium">{project.progressPercent ?? 0}%</span>
              </div>
              <div className="h-2 w-full rounded-full bg-muted">
                <div
                  className="h-full rounded-full bg-primary transition-all"
                  style={{ width: `${Math.min(project.progressPercent ?? 0, 100)}%` }}
                />
              </div>
            </div>
            {project.completedDate && (
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Completed</span>
                <span>{formatDate(project.completedDate)}</span>
              </div>
            )}
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">Created</span>
              <span>{formatDate(project.createdAt)}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">Last Updated</span>
              <span>{formatDate(project.updatedAt)}</span>
            </div>
          </CardContent>
        </Card>

        {project.description && (
          <Card className="lg:col-span-2">
            <CardHeader>
              <CardTitle className="text-[11px] font-medium uppercase tracking-[0.12em] text-muted-foreground">Description</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm whitespace-pre-wrap">{project.description}</p>
            </CardContent>
          </Card>
        )}
      </div>

      {/* Domain Health Dashboard */}
      <DomainHealthDashboard health={health} />
    </div>
  );
}

// ---------- WBS Tree View ----------

type TaskNode = Task & { children: TaskNode[] };

function buildTaskTree(tasks: Task[]): TaskNode[] {
  const map = new Map<number, TaskNode>();
  tasks.forEach((t) => map.set(t.id, { ...t, children: [] }));

  const roots: TaskNode[] = [];
  tasks.forEach((t) => {
    if (t.parentId && map.has(t.parentId)) {
      map.get(t.parentId)!.children.push(map.get(t.id)!);
    } else if (!t.parentId) {
      roots.push(map.get(t.id)!);
    }
  });
  return roots;
}

function assignWbsCodes(nodes: TaskNode[], prefix = ''): void {
  nodes.forEach((node, i) => {
    if (!node.wbsCode) {
      node.wbsCode = prefix ? `${prefix}.${i + 1}` : String(i + 1);
    }
    if (node.children.length > 0) {
      assignWbsCodes(node.children, node.wbsCode);
    }
  });
}

function WbsTreeNode({
  node,
  depth = 0,
  onStatusChange,
  onDelete,
  onEdit,
}: {
  node: TaskNode;
  depth?: number;
  onStatusChange: (id: number, status: string) => void;
  onDelete: (id: number) => void;
  onEdit: (task: Task) => void;
}) {
  const [expanded, setExpanded] = React.useState(true);
  const statusMeta = getTaskStatusMeta(node.status);
  const priorityMeta = getTaskPriorityMeta(node.priority);

  return (
    <div>
      <div
        className={cn(
          'group flex items-start gap-2 rounded-lg border p-2.5 transition-colors hover:bg-muted/50',
          depth > 0 && 'ml-6 border-l-2 border-l-primary/20',
        )}
        style={depth > 0 ? { marginLeft: `${depth * 24}px` } : {}}
      >
        {node.children.length > 0 ? (
          <button
            onClick={() => setExpanded(!expanded)}
            className="mt-0.5 shrink-0 text-muted-foreground/60 hover:text-foreground"
          >
            {expanded ? (
              <ChevronDownIcon className="size-4" />
            ) : (
              <ChevronRightIcon className="size-4" />
            )}
          </button>
        ) : (
          <span className="mt-0.5 size-4 shrink-0" />
        )}

        <button
          type="button"
          onClick={() => {
            const next = node.status === 'done' ? 'todo' : 'done';
            onStatusChange(node.id, next);
          }}
          className="mt-0.5 shrink-0"
        >
          {node.status === 'done' ? (
            <CheckCircle2Icon className="size-4 text-emerald-500" />
          ) : node.status === 'in_progress' ? (
            <ClockIcon className="size-4 text-blue-500" />
          ) : (
            <CircleIcon className="size-4 text-muted-foreground/40" />
          )}
        </button>

        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2 flex-wrap">
            {node.wbsCode && (
              <code className="text-[10px] font-mono text-primary/70 bg-primary/5 px-1 py-0.5 rounded">
                {node.wbsCode}
              </code>
            )}
            <span className={cn('text-sm font-medium', node.status === 'done' && 'line-through text-muted-foreground')}>
              {node.title}
            </span>
            <span className={cn('inline-flex rounded-full px-1.5 py-0.5 text-[10px] font-medium', priorityMeta.color)}>
              {priorityMeta.label}
            </span>
          </div>
          {node.children.length > 0 && (
            <p className="text-[10px] text-muted-foreground mt-0.5">{node.children.length} subtask{node.children.length !== 1 ? 's' : ''}</p>
          )}
        </div>

        <DropdownMenu>
          <DropdownMenuTrigger render={<Button variant="ghost" size="icon-sm" className="opacity-0 group-hover:opacity-100 transition-opacity shrink-0" />}>
            <MoreHorizontalIcon className="size-3.5" />
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuItem onClick={() => onEdit(node)}>
              <PencilIcon className="mr-2 size-4" /> Edit Task
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem onClick={() => onStatusChange(node.id, 'in_progress')}>
              <ClockIcon className="mr-2 size-4" /> Mark In Progress
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => onStatusChange(node.id, 'done')}>
              <CheckCircle2Icon className="mr-2 size-4" /> Mark Done
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem className="text-destructive focus:text-destructive" onClick={() => onDelete(node.id)}>
              <TrashIcon className="mr-2 size-4" /> Delete
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>

      {expanded && node.children.map((child) => (
        <WbsTreeNode
          key={child.id}
          node={child}
          depth={depth + 1}
          onStatusChange={onStatusChange}
          onDelete={onDelete}
          onEdit={onEdit}
        />
      ))}
    </div>
  );
}

// ---------- Tasks Tab ----------

function TasksTab({ projectId, initialTasks }: { projectId: number; initialTasks: Task[] }) {
  const [tasks, setTasks] = React.useState<Task[]>(initialTasks);
  const [showCreate, setShowCreate] = React.useState(false);
  const [editingTask, setEditingTask] = React.useState<Task | null>(null);
  const [viewMode, setViewMode] = React.useState<'kanban' | 'wbs'>('kanban');

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 5 } }),
    useSensor(KeyboardSensor)
  );

  const todoTasks = tasks.filter((t) => t.status === 'todo');
  const inProgressTasks = tasks.filter((t) => t.status === 'in_progress');
  const reviewTasks = tasks.filter((t) => t.status === 'review');
  const doneTasks = tasks.filter((t) => t.status === 'done');

  function handleStatusChange(id: number, status: string) {
    setTasks((prev) =>
      prev.map((t) => (t.id === id ? { ...t, status, completedDate: status === 'done' ? new Date() : t.completedDate } : t))
    );
    updateTaskStatus(id, projectId, status).catch(() => {
      toast.error('Failed to update task status');
      setTasks(initialTasks);
    });
  }

  function handleDelete(id: number) {
    const prev = tasks;
    setTasks((ts) => ts.filter((t) => t.id !== id));
    deleteTask(id, projectId).catch(() => {
      toast.error('Failed to delete task');
      setTasks(prev);
    });
  }

  function handleTaskCreated(task: Task) {
    setTasks((prev) => [...prev, task]);
  }

  function handleTaskUpdated(task: Task) {
    setTasks((prev) => prev.map((t) => (t.id === task.id ? task : t)));
    setEditingTask(null);
  }

  function handleDragEnd(event: { active: { id: number | string }; over: { id: number | string } | null }) {
    const { active, over } = event;
    if (!over || active.id === over.id) return;

    const activeTask = tasks.find((t) => t.id === Number(active.id));
    if (!activeTask) return;

    // Find which column the item was dropped into by checking which column contains the over target
    const columns: Record<string, Task[]> = {
      todo: todoTasks,
      in_progress: inProgressTasks,
      review: reviewTasks,
      done: doneTasks,
    };

    for (const [status, colTasks] of Object.entries(columns)) {
      if (colTasks.some((t) => t.id === Number(over.id))) {
        if (activeTask.status !== status) {
          handleStatusChange(activeTask.id, status);
        }
        break;
      }
    }
  }

  const columns = [
    { key: 'todo' as const, label: 'To Do', items: todoTasks },
    { key: 'in_progress' as const, label: 'In Progress', items: inProgressTasks },
    { key: 'review' as const, label: 'Review', items: reviewTasks },
    { key: 'done' as const, label: 'Done', items: doneTasks },
  ];

  // Collect all task IDs for SortableContext
  const allTaskIds = tasks.map((t) => t.id);

  // WBS tree data (computed on view switch)
  const treeRoots = React.useMemo(() => {
    if (viewMode !== 'wbs') return [];
    const roots = buildTaskTree(tasks);
    assignWbsCodes(roots);
    return roots;
  }, [tasks, viewMode]);

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <p className="text-sm text-muted-foreground">{tasks.length} task{tasks.length !== 1 ? 's' : ''}</p>
        <div className="flex items-center gap-2">
          {/* View toggle */}
          <div className="flex rounded-lg border p-0.5 gap-0.5">
            <button
              onClick={() => setViewMode('kanban')}
              className={cn(
                'flex items-center gap-1 rounded-md px-2 py-1 text-xs font-medium transition-colors',
                viewMode === 'kanban' ? 'bg-primary text-primary-foreground' : 'text-muted-foreground hover:text-foreground',
              )}
            >
              <LayoutDashboardIcon className="size-3" /> Kanban
            </button>
            <button
              onClick={() => setViewMode('wbs')}
              className={cn(
                'flex items-center gap-1 rounded-md px-2 py-1 text-xs font-medium transition-colors',
                viewMode === 'wbs' ? 'bg-primary text-primary-foreground' : 'text-muted-foreground hover:text-foreground',
              )}
            >
              <ListTreeIcon className="size-3" /> WBS
            </button>
          </div>
          <Button size="sm" onClick={() => setShowCreate(true)}>
            <PlusIcon className="mr-1.5 size-4" /> Add Task
          </Button>
        </div>
      </div>

      {/* WBS Tree View */}
      {viewMode === 'wbs' && (
        <div className="space-y-1">
          {treeRoots.length === 0 ? (
            <div className="rounded-xl border-2 border-dashed p-8 text-center text-sm text-muted-foreground">
              No tasks yet. Add tasks to build your WBS.
            </div>
          ) : (
            treeRoots.map((node) => (
              <WbsTreeNode
                key={node.id}
                node={node}
                onStatusChange={handleStatusChange}
                onDelete={handleDelete}
                onEdit={setEditingTask}
              />
            ))
          )}
        </div>
      )}

      {/* Kanban View */}
      {viewMode !== 'wbs' && <DndContext
        sensors={sensors}
        collisionDetection={closestCorners}
        onDragEnd={handleDragEnd}
      >
        <div className="overflow-x-auto -mx-2 px-2">
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4 min-w-[640px]">
          {columns.map((col) => (
            <div key={col.key} className="space-y-2">
              <div className="flex items-center gap-2">
                <h3 className="text-sm font-medium">{col.label}</h3>
                <Badge variant="secondary" className="text-xs">{col.items.length}</Badge>
              </div>
              <SortableContext items={allTaskIds} strategy={verticalListSortingStrategy}>
                <div className="space-y-2 min-h-[60px]">
                  {col.items.length === 0 ? (
                    <div className="rounded-lg border border-dashed p-4 text-center text-xs text-muted-foreground">
                      No tasks
                    </div>
                  ) : (
                    col.items.map((task) => (
                      <SortableTaskItem
                        key={task.id}
                        task={task}
                        onStatusChange={handleStatusChange}
                        onDelete={handleDelete}
                        onEdit={setEditingTask}
                      />
                    ))
                  )}
                </div>
              </SortableContext>
            </div>
          ))}
        </div>
        </div>
      </DndContext>}

      <CreateTaskDialog
        projectId={projectId}
        open={showCreate}
        onOpenChange={setShowCreate}
        onTaskCreated={handleTaskCreated}
      />

      <EditTaskDialog
        projectId={projectId}
        task={editingTask}
        open={!!editingTask}
        onOpenChange={(open) => { if (!open) setEditingTask(null); }}
        onTaskUpdated={handleTaskUpdated}
      />
    </div>
  );
}

// ---------- Placeholder tabs ----------

function PlaceholderTab({ title, description }: { title: string; description: string }) {
  return (
    <div className="flex flex-col items-center justify-center gap-4 rounded-xl border-2 border-dashed p-12 text-center">
      <h3 className="text-lg font-semibold">{title}</h3>
      <p className="text-sm text-muted-foreground max-w-sm">{description}</p>
    </div>
  );
}

// ---------- Focus Area Advancement ----------

function AdvanceFocusAreaDialog({
  project,
  open,
  onOpenChange,
  onAdvanced,
}: {
  project: Project;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onAdvanced: (newArea: string) => void;
}) {
  const [isPending, startTransition] = React.useTransition();
  const currentIdx = FOCUS_AREA_SEQUENCE.indexOf(project.currentFocusArea ?? 'initiating');
  const nextArea = FOCUS_AREA_SEQUENCE[currentIdx + 1];
  const nextLabel = nextArea?.replace(/_/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase()) ?? '';
  const checklist = FOCUS_AREA_CHECKLIST[project.currentFocusArea ?? 'initiating'] ?? [];

  function handleAdvance() {
    if (!nextArea) return;
    startTransition(async () => {
      try {
        await updateFocusArea(project.id, nextArea);
        toast.success(`Advanced to ${nextLabel}`);
        onAdvanced(nextArea);
        onOpenChange(false);

        // Fire confetti
        confetti({
          particleCount: 120,
          spread: 80,
          origin: { y: 0.55 },
          colors: ['#6366f1', '#f59e0b', '#10b981', '#3b82f6'],
        });
      } catch {
        toast.error('Failed to advance Focus Area');
      }
    });
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Advance to {nextLabel}</DialogTitle>
          <DialogDescription>
            Before advancing, confirm the following PMBOK 8 recommended activities are complete:
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-2 py-2">
          {checklist.map((item, i) => (
            <div key={i} className="flex items-start gap-2 text-sm">
              <CheckCircle2Icon className="mt-0.5 size-4 shrink-0 text-emerald-500" />
              <span>{item}</span>
            </div>
          ))}
        </div>
        <DialogFooter showCloseButton>
          <Button onClick={handleAdvance} disabled={isPending || !nextArea} className="gap-1.5">
            {isPending ? 'Advancing...' : `Advance to ${nextLabel}`}
            <ChevronRightIcon className="size-4" />
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

// ---------- Main Client Component ----------

export function ProjectDetailClient({
  project: initialProject,
  initialTasks,
  initialNotes,
  initialStakeholders,
  initialRisks,
  initialChangeRequests,
  initialLessonsLearned,
  initialIssues,
}: {
  project: Project;
  initialTasks: Task[];
  initialNotes: Note[];
  initialStakeholders: Stakeholder[];
  initialRisks: Risk[];
  initialChangeRequests: ChangeRequest[];
  initialLessonsLearned: Lesson[];
  initialIssues: Issue[];
}) {
  const router = useRouter();
  const [project, setProject] = React.useState(initialProject);
  const [editOpen, setEditOpen] = React.useState(false);
  const [deleteOpen, setDeleteOpen] = React.useState(false);
  const [advanceOpen, setAdvanceOpen] = React.useState(false);
  const [isDeleting, startDeleteTransition] = React.useTransition();

  const currentIdx = FOCUS_AREA_SEQUENCE.indexOf(project.currentFocusArea ?? 'initiating');
  const canAdvance = currentIdx < FOCUS_AREA_SEQUENCE.length - 1;

  function handleDeleteProject() {
    startDeleteTransition(async () => {
      try {
        await deleteProject(project.id);
        toast.success('Project deleted');
        router.push('/projects');
      } catch (error) {
        toast.error('Failed to delete project');
        console.error(error);
      }
    });
  }

  function handleFocusAreaAdvanced(newArea: string) {
    setProject((p) => ({ ...p, currentFocusArea: newArea }));
    router.refresh();
  }

  return (
    <div className="flex flex-1 flex-col overflow-hidden">
      {/* ── PROJECT HEADER BAND ───────────────────────────────────────────────
          Asymmetric two-column: identity left (name/status/stepper/desc),
          data right (progress stat + actions). The oversized progress number
          right-anchored mirrors the dashboard avg% — consistent retro-futurist
          typographic moment. Full-bleed band with border-b creates a clear
          spatial break from the tab content below.
      ──────────────────────────────────────────────────────────────────── */}
      <motion.div
        className="border-b px-6 pt-8 pb-6 md:px-12 lg:px-16"
        initial={{ opacity: 0, y: 28 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
      >
        <div className="grid grid-cols-1 lg:grid-cols-[1fr_auto] gap-6 items-start">
          {/* Left: project identity */}
          <div className="space-y-3 min-w-0">
            <p className="text-[11px] font-medium uppercase tracking-[0.12em] text-muted-foreground">
              PROJECTS / DETAIL
            </p>
            <div className="flex items-center gap-3 flex-wrap">
              <h1 className="text-[2.75rem] font-black font-heading tracking-[-0.025em] leading-[1.05] bg-gradient-to-r from-foreground to-foreground/60 bg-clip-text text-transparent">
                {project.name}
              </h1>
              <StatusBadge value={project.status} />
            </div>
            <div className="flex items-center gap-3 flex-wrap">
              {project.currentFocusArea && (
                <FocusAreaStepper currentFocusArea={project.currentFocusArea} size="md" />
              )}
              {canAdvance && (
                <Button
                  variant="outline"
                  size="sm"
                  className="h-7 gap-1 text-xs border-primary/30 text-primary hover:bg-primary/5"
                  onClick={() => setAdvanceOpen(true)}
                >
                  Advance <ChevronRightIcon className="size-3" />
                </Button>
              )}
            </div>
            {project.description && (
              <p className="text-sm text-muted-foreground/80 line-clamp-2 max-w-xl">{project.description}</p>
            )}
          </div>

          {/* Right: data sidebar — progress stat + actions */}
          <div className="flex flex-col items-start lg:items-end gap-4 shrink-0">
            <div className="lg:text-right">
              <p className="text-[11px] font-medium uppercase tracking-[0.12em] text-muted-foreground mb-1">
                PROGRESS
              </p>
              <div className="flex items-baseline gap-1 lg:justify-end">
                <span className="font-heading text-5xl font-black tracking-[-0.04em] text-primary leading-none tabular-nums">
                  {project.progressPercent ?? 0}
                </span>
                <span className="font-mono text-xl font-bold text-primary/60">%</span>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Button variant="outline" size="sm" onClick={() => setEditOpen(true)}>
                <PencilIcon className="mr-1.5 size-3.5" /> Edit
              </Button>
              <Button variant="outline" size="sm" className="text-destructive hover:text-destructive" onClick={() => setDeleteOpen(true)}>
                <TrashIcon className="mr-1.5 size-3.5" /> Delete
              </Button>
            </div>
          </div>
        </div>
      </motion.div>

      {/* ── TAB CONTENT ZONE ────────────────────────────────────────────────
          Different spatial rhythm from header: inner padding, no border.
          Layout contrast between the full-bleed header above and this
          contained zone below gives the page its structural identity.
      ──────────────────────────────────────────────────────────────────── */}
      <div className="flex flex-col gap-6 px-6 pt-6 pb-8 md:px-12 lg:px-16">

      {/* Tabs — legacy projects get a simplified summary view */}
      {project.isLegacy ? (
        <LegacySummaryTab
          projectId={project.id}
          summary={project.legacySummary as Parameters<typeof LegacySummaryTab>[0]['summary']}
        />
      ) : (
        <Tabs defaultValue="overview">
          <TabsList className="h-auto flex-wrap gap-1 bg-muted/60 p-1 rounded-xl w-fit">
            <TabsTrigger value="overview" className="rounded-lg px-3 py-1.5 text-xs font-semibold">Overview</TabsTrigger>
            <TabsTrigger value="charter" className="rounded-lg px-3 py-1.5 text-xs font-semibold">Charter</TabsTrigger>
            <TabsTrigger value="tasks" className="rounded-lg px-3 py-1.5 text-xs font-semibold">Tasks</TabsTrigger>
            <TabsTrigger value="notes" className="rounded-lg px-3 py-1.5 text-xs font-semibold">Notes</TabsTrigger>
            <TabsTrigger value="stakeholders" className="rounded-lg px-3 py-1.5 text-xs font-semibold">Stakeholders</TabsTrigger>
            <TabsTrigger value="risks" className="rounded-lg px-3 py-1.5 text-xs font-semibold">Risks</TabsTrigger>
            <TabsTrigger value="changes" className="rounded-lg px-3 py-1.5 text-xs font-semibold">Changes</TabsTrigger>
            <TabsTrigger value="lessons" className="rounded-lg px-3 py-1.5 text-xs font-semibold">Lessons</TabsTrigger>
            <TabsTrigger value="issues" className="rounded-lg px-3 py-1.5 text-xs font-semibold">Issues</TabsTrigger>
            <TabsTrigger value="reports" className="rounded-lg px-3 py-1.5 text-xs font-semibold">Reports</TabsTrigger>
          </TabsList>

          <TabsContent value="overview" className="mt-4">
            <OverviewTab
              project={project}
              tasks={initialTasks}
              risks={initialRisks}
              stakeholders={initialStakeholders}
              changeRequests={initialChangeRequests}
            />
          </TabsContent>

          <TabsContent value="charter" className="mt-4">
            <CharterTab project={project} />
          </TabsContent>

          <TabsContent value="tasks" className="mt-4">
            <TasksTab projectId={project.id} initialTasks={initialTasks} />
          </TabsContent>

          <TabsContent value="notes" className="mt-4">
            <NotesTab projectId={project.id} initialNotes={initialNotes} />
          </TabsContent>

          <TabsContent value="stakeholders" className="mt-4">
            <StakeholdersTab projectId={project.id} initialStakeholders={initialStakeholders} />
          </TabsContent>

          <TabsContent value="risks" className="mt-4">
            <RisksTab projectId={project.id} initialRisks={initialRisks} />
          </TabsContent>

          <TabsContent value="changes" className="mt-4">
            <ChangeRequestsTab projectId={project.id} initialChangeRequests={initialChangeRequests} />
          </TabsContent>

          <TabsContent value="lessons" className="mt-4">
            <LessonsLearnedTab projectId={project.id} initialLessons={initialLessonsLearned} />
          </TabsContent>

          <TabsContent value="issues" className="mt-4">
            <IssuesTab projectId={project.id} initialIssues={initialIssues} />
          </TabsContent>

          <TabsContent value="reports" className="mt-4">
            <ReportsTab
              projectId={project.id}
              project={project as Parameters<typeof ReportsTab>[0]['project']}
              data={{
                tasks: initialTasks,
                risks: initialRisks,
                stakeholders: initialStakeholders,
                changeRequests: initialChangeRequests,
                lessonsLearned: initialLessonsLearned,
                issues: initialIssues,
              }}
            />
          </TabsContent>
        </Tabs>
      )}

      {/* Edit dialog */}
      <EditProjectDialog project={project} open={editOpen} onOpenChange={setEditOpen} onProjectUpdated={setProject} />

      {/* Advance Focus Area dialog */}
      <AdvanceFocusAreaDialog
        project={project}
        open={advanceOpen}
        onOpenChange={setAdvanceOpen}
        onAdvanced={handleFocusAreaAdvanced}
      />

      {/* Delete confirmation */}
      <Dialog open={deleteOpen} onOpenChange={setDeleteOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Delete Project</DialogTitle>
            <DialogDescription>
              Are you sure you want to delete &ldquo;{project.name}&rdquo;? This action cannot be undone. All tasks, notes, and data will be permanently removed.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter showCloseButton>
            <Button variant="destructive" onClick={handleDeleteProject} disabled={isDeleting}>
              {isDeleting ? 'Deleting...' : 'Delete Project'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
      </div>{/* end tab content zone */}
    </div>
  );
}

