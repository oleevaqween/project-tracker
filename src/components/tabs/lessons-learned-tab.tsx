'use client';

import * as React from 'react';
import { useRouter } from 'next/navigation';
import {
  PlusIcon,
  PencilIcon,
  TrashIcon,
  MoreHorizontalIcon,
  LightbulbIcon,
} from 'lucide-react';
import { toast } from 'sonner';
import { Card, CardContent } from '@/components/ui/card';
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
import { formatDate } from '@/lib/project-helpers';
import { createLessonLearned, updateLessonLearned, deleteLessonLearned } from '@/actions/lessons-learned';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';

type Lesson = typeof import('@/db/schema').lessonsLearned.$inferSelect;

// ---------- Constants ----------

const FOCUS_AREAS = [
  { value: 'initiating', label: 'Initiating', color: 'bg-blue-500/15 text-blue-600 dark:text-blue-400' },
  { value: 'planning', label: 'Planning', color: 'bg-green-500/15 text-green-600 dark:text-green-400' },
  { value: 'executing', label: 'Executing', color: 'bg-amber-500/15 text-amber-600 dark:text-amber-400' },
  { value: 'monitoring_controlling', label: 'Monitoring & Controlling', color: 'bg-purple-500/15 text-purple-600 dark:text-purple-400' },
  { value: 'closing', label: 'Closing', color: 'bg-gray-500/15 text-gray-600 dark:text-gray-400' },
] as const;

const LESSON_CATEGORIES = [
  { value: 'process', label: 'Process' },
  { value: 'technical', label: 'Technical' },
  { value: 'stakeholder', label: 'Stakeholder' },
  { value: 'risk', label: 'Risk' },
  { value: 'schedule', label: 'Schedule' },
  { value: 'finance', label: 'Finance' },
  { value: 'quality', label: 'Quality' },
  { value: 'other', label: 'Other' },
] as const;

const LESSON_IMPACTS = [
  { value: 'positive', label: 'Positive', color: 'bg-emerald-500/15 text-emerald-600 dark:text-emerald-400' },
  { value: 'negative', label: 'Negative', color: 'bg-red-500/15 text-red-600 dark:text-red-400' },
  { value: 'neutral', label: 'Neutral', color: 'bg-zinc-500/15 text-zinc-600 dark:text-zinc-400' },
] as const;

function getFocusAreaMeta(value: string | null) {
  return FOCUS_AREAS.find((a) => a.value === value) ?? null;
}

function getImpactMeta(value: string | null) {
  return LESSON_IMPACTS.find((i) => i.value === value) ?? LESSON_IMPACTS[2];
}

function FocusAreaBadge({ value }: { value: string | null }) {
  const meta = getFocusAreaMeta(value);
  if (!meta) return null;
  return (
    <span className={cn('inline-flex items-center rounded-full px-1.5 py-0.5 text-[10px] font-medium', meta.color)}>
      {meta.label}
    </span>
  );
}

function LessonImpactBadge({ value }: { value: string | null }) {
  const meta = getImpactMeta(value);
  return (
    <span className={cn('inline-flex items-center rounded-full px-1.5 py-0.5 text-[10px] font-medium', meta.color)}>
      {meta.label}
    </span>
  );
}

// ---------- Schemas ----------

const lessonSchema = z.object({
  title: z.string().min(1, 'Title is required').max(500),
  description: z.string().min(1, 'Description is required'),
  focusArea: z.string().optional(),
  category: z.string().optional(),
  impact: z.string(),
  recommendation: z.string().optional(),
});

type LessonForm = z.infer<typeof lessonSchema>;

// ---------- Create/Edit Lesson Dialog ----------

function LessonFormDialog({
  projectId,
  lesson,
  open,
  onOpenChange,
  onSaved,
}: {
  projectId: number;
  lesson?: Lesson | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSaved: (lesson: Lesson) => void;
}) {
  const [isPending, startTransition] = React.useTransition();
  const isEditing = !!lesson;

  const form = useForm<LessonForm>({
    resolver: zodResolver(lessonSchema),
    defaultValues: {
      title: lesson?.title ?? '',
      description: lesson?.description ?? '',
      focusArea: lesson?.focusArea ?? '',
      category: lesson?.category ?? '',
      impact: lesson?.impact ?? 'neutral',
      recommendation: lesson?.recommendation ?? '',
    },
  });

  React.useEffect(() => {
    form.reset({
      title: lesson?.title ?? '',
      description: lesson?.description ?? '',
      focusArea: lesson?.focusArea ?? '',
      category: lesson?.category ?? '',
      impact: lesson?.impact ?? 'neutral',
      recommendation: lesson?.recommendation ?? '',
    });
  }, [lesson, form]);

  function onSubmit(data: LessonForm) {
    startTransition(async () => {
      try {
        let saved: Lesson;
        if (isEditing && lesson) {
          saved = await updateLessonLearned(lesson.id, projectId, {
            title: data.title,
            description: data.description,
            focusArea: data.focusArea || null,
            category: data.category || null,
            impact: data.impact,
            recommendation: data.recommendation || null,
          });
        } else {
          saved = await createLessonLearned({
            projectId,
            title: data.title,
            description: data.description,
            focusArea: data.focusArea || null,
            category: data.category || null,
            impact: data.impact,
            recommendation: data.recommendation || null,
          });
        }
        toast.success(isEditing ? 'Lesson updated' : 'Lesson created');
        onSaved(saved);
        onOpenChange(false);
        if (!isEditing) form.reset();
      } catch (error) {
        toast.error(isEditing ? 'Failed to update lesson' : 'Failed to create lesson');
        console.error(error);
      }
    });
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg max-h-[85vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{isEditing ? 'Edit Lesson' : 'Add Lesson'}</DialogTitle>
          <DialogDescription>
            {isEditing ? 'Update this lesson learned.' : 'Record a new lesson learned for this project.'}
          </DialogDescription>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="flex flex-col gap-4">
            <FormField
              control={form.control}
              name="title"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Title *</FormLabel>
                  <FormControl><Input placeholder="Lesson title" {...field} /></FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="description"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Description *</FormLabel>
                  <FormControl>
                    <Textarea className="min-h-[80px] resize-none" placeholder="Describe what happened..." {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <div className="grid grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="focusArea"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Focus Area</FormLabel>
                    <Select value={field.value ?? ''} onValueChange={field.onChange}>
                      <FormControl><SelectTrigger className="w-full"><SelectValue placeholder="Select area" /></SelectTrigger></FormControl>
                      <SelectContent>
                        <SelectItem value="">None</SelectItem>
                        {FOCUS_AREAS.map((a) => <SelectItem key={a.value} value={a.value}>{a.label}</SelectItem>)}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="category"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Category</FormLabel>
                    <Select value={field.value ?? ''} onValueChange={field.onChange}>
                      <FormControl><SelectTrigger className="w-full"><SelectValue placeholder="Select category" /></SelectTrigger></FormControl>
                      <SelectContent>
                        <SelectItem value="">None</SelectItem>
                        {LESSON_CATEGORIES.map((c) => <SelectItem key={c.value} value={c.value}>{c.label}</SelectItem>)}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>
            <FormField
              control={form.control}
              name="impact"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Impact</FormLabel>
                  <Select value={field.value} onValueChange={field.onChange}>
                    <FormControl><SelectTrigger className="w-full"><SelectValue /></SelectTrigger></FormControl>
                    <SelectContent>
                      {LESSON_IMPACTS.map((i) => <SelectItem key={i.value} value={i.value}>{i.label}</SelectItem>)}
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="recommendation"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Recommendation</FormLabel>
                  <FormControl>
                    <Textarea className="min-h-[60px] resize-none" placeholder="What to do differently next time..." {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <DialogFooter showCloseButton>
              <Button type="submit" disabled={isPending}>
                {isPending ? 'Saving...' : isEditing ? 'Save Changes' : 'Add Lesson'}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}

// ---------- Delete Lesson Confirmation ----------

function DeleteLessonDialog({
  lesson,
  open,
  onOpenChange,
  onDeleted,
}: {
  lesson: Lesson | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onDeleted: () => void;
}) {
  const [isPending, startTransition] = React.useTransition();

  function handleDelete() {
    if (!lesson) return;
    startTransition(async () => {
      try {
        await deleteLessonLearned(lesson.id, lesson.projectId);
        toast.success('Lesson deleted');
        onDeleted();
        onOpenChange(false);
      } catch (error) {
        toast.error('Failed to delete lesson');
        console.error(error);
      }
    });
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Delete Lesson</DialogTitle>
          <DialogDescription>
            Are you sure you want to delete &ldquo;{lesson?.title}&rdquo;? This action cannot be undone.
          </DialogDescription>
        </DialogHeader>
        <DialogFooter showCloseButton>
          <Button variant="destructive" onClick={handleDelete} disabled={isPending}>
            {isPending ? 'Deleting...' : 'Delete Lesson'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

// ---------- Lesson Item ----------

function LessonItem({
  lesson,
  onEdit,
  onDelete,
}: {
  lesson: Lesson;
  onEdit: (lesson: Lesson) => void;
  onDelete: (lesson: Lesson) => void;
}) {
  return (
    <div className="group flex items-start gap-3 rounded-lg border p-3 transition-colors hover:bg-muted/50">
      <LightbulbIcon className="mt-0.5 size-5 shrink-0 text-muted-foreground/70" />
      <div className="min-w-0 flex-1">
        <div className="flex items-center gap-2 flex-wrap">
          <span className="text-sm font-medium">{lesson.title}</span>
          <FocusAreaBadge value={lesson.focusArea} />
          <LessonImpactBadge value={lesson.impact} />
        </div>
        {lesson.description && (
          <p className="mt-0.5 text-xs text-muted-foreground line-clamp-2">{lesson.description}</p>
        )}
        <div className="mt-1 flex items-center gap-3 text-[11px] text-muted-foreground flex-wrap">
          {lesson.category && <span className="capitalize">{lesson.category}</span>}
          {lesson.recommendation && <span>Has recommendation</span>}
          <span>{formatDate(lesson.createdAt)}</span>
        </div>
      </div>

      <DropdownMenu>
        <DropdownMenuTrigger render={<Button variant="ghost" size="icon-sm" className="opacity-0 group-hover:opacity-100 transition-opacity" />}>
          <MoreHorizontalIcon className="size-4" />
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end">
          <DropdownMenuItem onClick={() => onEdit(lesson)}>
            <PencilIcon className="mr-2 size-4" /> Edit Lesson
          </DropdownMenuItem>
          <DropdownMenuSeparator />
          <DropdownMenuItem
            className="text-destructive focus:text-destructive"
            onClick={() => onDelete(lesson)}
          >
            <TrashIcon className="mr-2 size-4" /> Delete Lesson
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  );
}

// ---------- Lessons Learned Tab ----------

export function LessonsLearnedTab({ projectId, initialLessons }: { projectId: number; initialLessons: Lesson[] }) {
  const router = useRouter();
  const [lessons, setLessons] = React.useState<Lesson[]>(initialLessons);
  const [showCreate, setShowCreate] = React.useState(false);
  const [editingLesson, setEditingLesson] = React.useState<Lesson | null>(null);
  const [deletingLesson, setDeletingLesson] = React.useState<Lesson | null>(null);

  function handleLessonCreated(lesson: Lesson) {
    setLessons((prev) => [lesson, ...prev]);
    router.refresh();
  }

  function handleLessonUpdated(lesson: Lesson) {
    setLessons((prev) => prev.map((l) => (l.id === lesson.id ? lesson : l)));
    setEditingLesson(null);
    router.refresh();
  }

  function handleLessonDeleted() {
    if (deletingLesson) {
      setLessons((prev) => prev.filter((l) => l.id !== deletingLesson.id));
    }
    setDeletingLesson(null);
    router.refresh();
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <p className="text-sm text-muted-foreground">
          {lessons.length} lesson{lessons.length !== 1 ? 's' : ''}
        </p>
        <Button size="sm" onClick={() => setShowCreate(true)}>
          <PlusIcon className="mr-1.5 size-4" /> Add Lesson
        </Button>
      </div>

      {lessons.length === 0 ? (
        <div className="rounded-xl border-2 border-dashed p-8 text-center">
          <LightbulbIcon className="mx-auto size-8 text-muted-foreground/50" />
          <p className="mt-2 text-sm font-medium">No lessons learned yet</p>
          <p className="text-xs text-muted-foreground">Record lessons learned to improve future projects.</p>
        </div>
      ) : (
        <div className="space-y-2">
          {lessons.map((lesson) => (
            <LessonItem
              key={lesson.id}
              lesson={lesson}
              onEdit={setEditingLesson}
              onDelete={setDeletingLesson}
            />
          ))}
        </div>
      )}

      <LessonFormDialog
        projectId={projectId}
        open={showCreate}
        onOpenChange={setShowCreate}
        onSaved={handleLessonCreated}
      />

      <LessonFormDialog
        projectId={projectId}
        lesson={editingLesson}
        open={!!editingLesson}
        onOpenChange={(open) => { if (!open) setEditingLesson(null); }}
        onSaved={handleLessonUpdated}
      />

      <DeleteLessonDialog
        lesson={deletingLesson}
        open={!!deletingLesson}
        onOpenChange={(open) => { if (!open) setDeletingLesson(null); }}
        onDeleted={handleLessonDeleted}
      />
    </div>
  );
}