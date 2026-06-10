'use client';

import * as React from 'react';
import { useRouter } from 'next/navigation';
import {
  PlusIcon,
  PencilIcon,
  TrashIcon,
  MoreHorizontalIcon,
  CircleDotIcon,
} from 'lucide-react';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
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
import { createIssue, updateIssue, deleteIssue } from '@/actions/issues';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';

type Issue = typeof import('@/db/schema').issues.$inferSelect;

// ---------- Constants ----------

const ISSUE_STATUSES = [
  { value: 'open', label: 'Open', color: 'bg-red-500/15 text-red-600 dark:text-red-400' },
  { value: 'in_progress', label: 'In Progress', color: 'bg-blue-500/15 text-blue-600 dark:text-blue-400' },
  { value: 'resolved', label: 'Resolved', color: 'bg-emerald-500/15 text-emerald-600 dark:text-emerald-400' },
  { value: 'closed', label: 'Closed', color: 'bg-zinc-500/15 text-zinc-600 dark:text-zinc-400' },
] as const;

const ISSUE_IMPACTS = [
  { value: 'low', label: 'Low', color: 'bg-emerald-500/15 text-emerald-700 dark:text-emerald-400' },
  { value: 'medium', label: 'Medium', color: 'bg-yellow-500/15 text-yellow-700 dark:text-yellow-400' },
  { value: 'high', label: 'High', color: 'bg-orange-500/15 text-orange-700 dark:text-orange-400' },
  { value: 'critical', label: 'Critical', color: 'bg-red-500/15 text-red-700 dark:text-red-400' },
] as const;

function getIssueStatusMeta(value: string | null) {
  return ISSUE_STATUSES.find((s) => s.value === value) ?? ISSUE_STATUSES[0];
}

function getIssueImpactMeta(value: string | null) {
  return ISSUE_IMPACTS.find((i) => i.value === value) ?? ISSUE_IMPACTS[1];
}

function IssueStatusBadge({ value }: { value: string | null }) {
  const meta = getIssueStatusMeta(value);
  return (
    <span className={cn('inline-flex items-center rounded-full px-1.5 py-0.5 text-[10px] font-medium', meta.color)}>
      {meta.label}
    </span>
  );
}

function IssueImpactBadge({ value }: { value: string | null }) {
  const meta = getIssueImpactMeta(value);
  return (
    <span className={cn('inline-flex items-center rounded-full px-1.5 py-0.5 text-[10px] font-medium', meta.color)}>
      {meta.label}
    </span>
  );
}

// ---------- Schema ----------

const issueSchema = z.object({
  title: z.string().min(1, 'Title is required').max(500),
  description: z.string().optional(),
  impact: z.string(),
  owner: z.string().optional(),
  status: z.string(),
  resolvedDate: z.string().optional(),
});

type IssueForm = z.infer<typeof issueSchema>;

// ---------- Create/Edit Dialog ----------

function IssueFormDialog({
  projectId,
  issue,
  open,
  onOpenChange,
  onSaved,
}: {
  projectId: number;
  issue?: Issue | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSaved: (issue: Issue) => void;
}) {
  const [isPending, startTransition] = React.useTransition();
  const isEditing = !!issue;

  const form = useForm<IssueForm>({
    resolver: zodResolver(issueSchema),
    defaultValues: {
      title: issue?.title ?? '',
      description: issue?.description ?? '',
      impact: issue?.impact ?? 'medium',
      owner: issue?.owner ?? '',
      status: issue?.status ?? 'open',
      resolvedDate: issue?.resolvedDate ? new Date(issue.resolvedDate).toISOString().split('T')[0] : '',
    },
  });

  React.useEffect(() => {
    form.reset({
      title: issue?.title ?? '',
      description: issue?.description ?? '',
      impact: issue?.impact ?? 'medium',
      owner: issue?.owner ?? '',
      status: issue?.status ?? 'open',
      resolvedDate: issue?.resolvedDate ? new Date(issue.resolvedDate).toISOString().split('T')[0] : '',
    });
  }, [issue, form]);

  function onSubmit(data: IssueForm) {
    startTransition(async () => {
      try {
        let saved: Issue;
        if (isEditing && issue) {
          saved = await updateIssue(issue.id, projectId, {
            title: data.title,
            description: data.description || null,
            impact: data.impact,
            owner: data.owner || null,
            status: data.status,
            resolvedDate: data.resolvedDate ? new Date(data.resolvedDate) : null,
          });
        } else {
          saved = await createIssue({
            projectId,
            title: data.title,
            description: data.description || null,
            impact: data.impact,
            owner: data.owner || null,
            status: data.status,
            resolvedDate: data.resolvedDate ? new Date(data.resolvedDate) : null,
          });
        }
        toast.success(isEditing ? 'Issue updated' : 'Issue logged');
        onSaved(saved);
        onOpenChange(false);
        if (!isEditing) form.reset();
      } catch (error) {
        toast.error(isEditing ? 'Failed to update issue' : 'Failed to log issue');
        console.error(error);
      }
    });
  }

  const watchedStatus = form.watch('status');

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg max-h-[85vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{isEditing ? 'Edit Issue' : 'Log Issue'}</DialogTitle>
          <DialogDescription>
            {isEditing ? 'Update issue details.' : 'Record a new issue for this project.'}
          </DialogDescription>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="flex flex-col gap-4">
            <FormField control={form.control} name="title" render={({ field }) => (
              <FormItem>
                <FormLabel>Title *</FormLabel>
                <FormControl><Input placeholder="Issue title" {...field} /></FormControl>
                <FormMessage />
              </FormItem>
            )} />
            <FormField control={form.control} name="description" render={({ field }) => (
              <FormItem>
                <FormLabel>Description</FormLabel>
                <FormControl>
                  <Textarea className="min-h-[80px] resize-none" placeholder="Describe the issue..." {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )} />
            <div className="grid grid-cols-2 gap-4">
              <FormField control={form.control} name="impact" render={({ field }) => (
                <FormItem>
                  <FormLabel>Impact</FormLabel>
                  <Select value={field.value} onValueChange={field.onChange}>
                    <FormControl><SelectTrigger className="w-full"><SelectValue /></SelectTrigger></FormControl>
                    <SelectContent>
                      {ISSUE_IMPACTS.map((i) => <SelectItem key={i.value} value={i.value}>{i.label}</SelectItem>)}
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )} />
              <FormField control={form.control} name="status" render={({ field }) => (
                <FormItem>
                  <FormLabel>Status</FormLabel>
                  <Select value={field.value} onValueChange={field.onChange}>
                    <FormControl><SelectTrigger className="w-full"><SelectValue /></SelectTrigger></FormControl>
                    <SelectContent>
                      {ISSUE_STATUSES.map((s) => <SelectItem key={s.value} value={s.value}>{s.label}</SelectItem>)}
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )} />
            </div>
            <FormField control={form.control} name="owner" render={({ field }) => (
              <FormItem>
                <FormLabel>Owner</FormLabel>
                <FormControl><Input placeholder="Who owns this issue?" {...field} /></FormControl>
                <FormMessage />
              </FormItem>
            )} />
            {(watchedStatus === 'resolved' || watchedStatus === 'closed') && (
              <FormField control={form.control} name="resolvedDate" render={({ field }) => (
                <FormItem>
                  <FormLabel>Resolved Date</FormLabel>
                  <FormControl><Input type="date" {...field} /></FormControl>
                  <FormMessage />
                </FormItem>
              )} />
            )}
            <DialogFooter showCloseButton>
              <Button type="submit" disabled={isPending}>
                {isPending ? 'Saving...' : isEditing ? 'Save Changes' : 'Log Issue'}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}

// ---------- Delete Confirmation ----------

function DeleteIssueDialog({
  issue,
  open,
  onOpenChange,
  onDeleted,
}: {
  issue: Issue | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onDeleted: () => void;
}) {
  const [isPending, startTransition] = React.useTransition();

  function handleDelete() {
    if (!issue) return;
    startTransition(async () => {
      try {
        await deleteIssue(issue.id, issue.projectId);
        toast.success('Issue deleted');
        onDeleted();
        onOpenChange(false);
      } catch (error) {
        toast.error('Failed to delete issue');
        console.error(error);
      }
    });
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Delete Issue</DialogTitle>
          <DialogDescription>
            Are you sure you want to delete &ldquo;{issue?.title}&rdquo;? This action cannot be undone.
          </DialogDescription>
        </DialogHeader>
        <DialogFooter showCloseButton>
          <Button variant="destructive" onClick={handleDelete} disabled={isPending}>
            {isPending ? 'Deleting...' : 'Delete Issue'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

// ---------- Issue Item ----------

function IssueItem({
  issue,
  onEdit,
  onDelete,
}: {
  issue: Issue;
  onEdit: (issue: Issue) => void;
  onDelete: (issue: Issue) => void;
}) {
  return (
    <div className="group flex items-start gap-3 rounded-lg border p-3 transition-colors hover:bg-muted/50">
      <CircleDotIcon className="mt-0.5 size-5 shrink-0 text-muted-foreground/70" />
      <div className="min-w-0 flex-1">
        <div className="flex items-center gap-2 flex-wrap">
          <span className={cn('text-sm font-medium', (issue.status === 'resolved' || issue.status === 'closed') && 'line-through text-muted-foreground')}>
            {issue.title}
          </span>
          <IssueImpactBadge value={issue.impact} />
          <IssueStatusBadge value={issue.status} />
        </div>
        {issue.description && (
          <p className="mt-0.5 text-xs text-muted-foreground line-clamp-2">{issue.description}</p>
        )}
        <div className="mt-1 flex items-center gap-3 text-[11px] text-muted-foreground flex-wrap">
          {issue.owner && <span>Owner: {issue.owner}</span>}
          {issue.resolvedDate && <span>Resolved {formatDate(issue.resolvedDate)}</span>}
          <span>Logged {formatDate(issue.createdAt)}</span>
        </div>
      </div>

      <DropdownMenu>
        <DropdownMenuTrigger render={<Button variant="ghost" size="icon-sm" className="opacity-0 group-hover:opacity-100 transition-opacity" />}>
          <MoreHorizontalIcon className="size-4" />
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end">
          <DropdownMenuItem onClick={() => onEdit(issue)}>
            <PencilIcon className="mr-2 size-4" /> Edit Issue
          </DropdownMenuItem>
          <DropdownMenuSeparator />
          <DropdownMenuItem
            className="text-destructive focus:text-destructive"
            onClick={() => onDelete(issue)}
          >
            <TrashIcon className="mr-2 size-4" /> Delete Issue
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  );
}

// ---------- Issues Tab ----------

export function IssuesTab({ projectId, initialIssues }: { projectId: number; initialIssues: Issue[] }) {
  const router = useRouter();
  const [issuesList, setIssuesList] = React.useState<Issue[]>(initialIssues);
  const [showCreate, setShowCreate] = React.useState(false);
  const [editingIssue, setEditingIssue] = React.useState<Issue | null>(null);
  const [deletingIssue, setDeletingIssue] = React.useState<Issue | null>(null);

  const openCount = issuesList.filter((i) => i.status === 'open' || i.status === 'in_progress').length;

  function handleIssueCreated(issue: Issue) {
    setIssuesList((prev) => [issue, ...prev]);
    router.refresh();
  }

  function handleIssueUpdated(issue: Issue) {
    setIssuesList((prev) => prev.map((i) => (i.id === issue.id ? issue : i)));
    setEditingIssue(null);
    router.refresh();
  }

  function handleIssueDeleted() {
    if (deletingIssue) {
      setIssuesList((prev) => prev.filter((i) => i.id !== deletingIssue.id));
    }
    setDeletingIssue(null);
    router.refresh();
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <p className="text-sm text-muted-foreground">
          {issuesList.length} issue{issuesList.length !== 1 ? 's' : ''}
          {openCount > 0 && (
            <span className="ml-1.5 inline-flex items-center rounded-full bg-red-500/15 px-1.5 py-0.5 text-[10px] font-medium text-red-600 dark:text-red-400">
              {openCount} open
            </span>
          )}
        </p>
        <Button size="sm" onClick={() => setShowCreate(true)}>
          <PlusIcon className="mr-1.5 size-4" /> Log Issue
        </Button>
      </div>

      {issuesList.length === 0 ? (
        <div className="rounded-xl border-2 border-dashed p-8 text-center">
          <CircleDotIcon className="mx-auto size-8 text-muted-foreground/50" />
          <p className="mt-2 text-sm font-medium">No issues logged</p>
          <p className="text-xs text-muted-foreground">Record issues that arise during project execution.</p>
        </div>
      ) : (
        <div className="space-y-2">
          {issuesList.map((issue) => (
            <IssueItem
              key={issue.id}
              issue={issue}
              onEdit={setEditingIssue}
              onDelete={setDeletingIssue}
            />
          ))}
        </div>
      )}

      <IssueFormDialog
        projectId={projectId}
        open={showCreate}
        onOpenChange={setShowCreate}
        onSaved={handleIssueCreated}
      />

      <IssueFormDialog
        projectId={projectId}
        issue={editingIssue}
        open={!!editingIssue}
        onOpenChange={(open) => { if (!open) setEditingIssue(null); }}
        onSaved={handleIssueUpdated}
      />

      <DeleteIssueDialog
        issue={deletingIssue}
        open={!!deletingIssue}
        onOpenChange={(open) => { if (!open) setDeletingIssue(null); }}
        onDeleted={handleIssueDeleted}
      />
    </div>
  );
}
