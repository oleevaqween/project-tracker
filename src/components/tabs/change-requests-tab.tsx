'use client';

import * as React from 'react';
import { useRouter } from 'next/navigation';
import {
  PlusIcon,
  PencilIcon,
  TrashIcon,
  MoreHorizontalIcon,
  FileEditIcon,
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
import { createChangeRequest, updateChangeRequest, deleteChangeRequest } from '@/actions/change-requests';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';

type ChangeRequest = typeof import('@/db/schema').changeRequests.$inferSelect;

// ---------- Constants ----------

const CR_STATUSES = [
  { value: 'submitted', label: 'Submitted', color: 'bg-yellow-500/15 text-yellow-600 dark:text-yellow-400' },
  { value: 'under_review', label: 'Under Review', color: 'bg-blue-500/15 text-blue-600 dark:text-blue-400' },
  { value: 'approved', label: 'Approved', color: 'bg-emerald-500/15 text-emerald-600 dark:text-emerald-400' },
  { value: 'rejected', label: 'Rejected', color: 'bg-red-500/15 text-red-600 dark:text-red-400' },
  { value: 'implemented', label: 'Implemented', color: 'bg-emerald-500/15 text-emerald-600 dark:text-emerald-400' },
  { value: 'deferred', label: 'Deferred', color: 'bg-gray-500/15 text-gray-600 dark:text-gray-400' },
] as const;

const CR_PRIORITIES = [
  { value: 'low', label: 'Low', color: 'bg-zinc-500/15 text-zinc-600 dark:text-zinc-400' },
  { value: 'medium', label: 'Medium', color: 'bg-yellow-500/15 text-yellow-600 dark:text-yellow-400' },
  { value: 'high', label: 'High', color: 'bg-orange-500/15 text-orange-600 dark:text-orange-400' },
  { value: 'critical', label: 'Critical', color: 'bg-red-500/15 text-red-600 dark:text-red-400' },
] as const;

const CR_CHANGE_TYPES = [
  { value: 'scope', label: 'Scope' },
  { value: 'schedule', label: 'Schedule' },
  { value: 'finance', label: 'Finance' },
  { value: 'resource', label: 'Resource' },
  { value: 'quality', label: 'Quality' },
  { value: 'other', label: 'Other' },
] as const;

function getCRStatusMeta(value: string | null) {
  return CR_STATUSES.find((s) => s.value === value) ?? CR_STATUSES[0];
}

function getCRPriorityMeta(value: string | null) {
  return CR_PRIORITIES.find((p) => p.value === value) ?? CR_PRIORITIES[1];
}

function CRStatusBadge({ value }: { value: string | null }) {
  const meta = getCRStatusMeta(value);
  return (
    <span className={cn('inline-flex items-center rounded-full px-1.5 py-0.5 text-[10px] font-medium', meta.color)}>
      {meta.label}
    </span>
  );
}

function CRPriorityBadge({ value }: { value: string | null }) {
  const meta = getCRPriorityMeta(value);
  return (
    <span className={cn('inline-flex items-center rounded-full px-1.5 py-0.5 text-[10px] font-medium', meta.color)}>
      {meta.label}
    </span>
  );
}

// ---------- Schemas ----------

const changeRequestSchema = z.object({
  title: z.string().min(1, 'Title is required').max(500),
  description: z.string().min(1, 'Description is required'),
  requestedBy: z.string().optional(),
  changeType: z.string().min(1, 'Change type is required'),
  impactDescription: z.string().optional(),
  priority: z.string(),
  status: z.string(),
  reviewNotes: z.string().optional(),
});

type ChangeRequestForm = z.infer<typeof changeRequestSchema>;

// ---------- Create/Edit Change Request Dialog ----------

function ChangeRequestFormDialog({
  projectId,
  changeRequest,
  open,
  onOpenChange,
  onSaved,
}: {
  projectId: number;
  changeRequest?: ChangeRequest | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSaved: (cr: ChangeRequest) => void;
}) {
  const [isPending, startTransition] = React.useTransition();
  const isEditing = !!changeRequest;

  const form = useForm<ChangeRequestForm>({
    resolver: zodResolver(changeRequestSchema),
    defaultValues: {
      title: changeRequest?.title ?? '',
      description: changeRequest?.description ?? '',
      requestedBy: changeRequest?.requestedBy ?? '',
      changeType: changeRequest?.changeType ?? 'scope',
      impactDescription: changeRequest?.impactDescription ?? '',
      priority: changeRequest?.priority ?? 'medium',
      status: changeRequest?.status ?? 'submitted',
      reviewNotes: changeRequest?.reviewNotes ?? '',
    },
  });

  React.useEffect(() => {
    form.reset({
      title: changeRequest?.title ?? '',
      description: changeRequest?.description ?? '',
      requestedBy: changeRequest?.requestedBy ?? '',
      changeType: changeRequest?.changeType ?? 'scope',
      impactDescription: changeRequest?.impactDescription ?? '',
      priority: changeRequest?.priority ?? 'medium',
      status: changeRequest?.status ?? 'submitted',
      reviewNotes: changeRequest?.reviewNotes ?? '',
    });
  }, [changeRequest, form]);

  function onSubmit(data: ChangeRequestForm) {
    startTransition(async () => {
      try {
        let saved: ChangeRequest;
        if (isEditing && changeRequest) {
          saved = await updateChangeRequest(changeRequest.id, projectId, {
            title: data.title,
            description: data.description,
            requestedBy: data.requestedBy || null,
            changeType: data.changeType,
            impactDescription: data.impactDescription || null,
            priority: data.priority,
            status: data.status,
            reviewNotes: data.reviewNotes || null,
          });
        } else {
          saved = await createChangeRequest({
            projectId,
            title: data.title,
            description: data.description,
            requestedBy: data.requestedBy || null,
            changeType: data.changeType,
            impactDescription: data.impactDescription || null,
            priority: data.priority,
            status: data.status,
          });
        }
        toast.success(isEditing ? 'Change request updated' : 'Change request created');
        onSaved(saved);
        onOpenChange(false);
        if (!isEditing) form.reset();
      } catch (error) {
        toast.error(isEditing ? 'Failed to update change request' : 'Failed to create change request');
        console.error(error);
      }
    });
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg max-h-[85vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{isEditing ? 'Edit Change Request' : 'Add Change Request'}</DialogTitle>
          <DialogDescription>
            {isEditing ? 'Update change request details.' : 'Submit a new change request for this project.'}
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
                  <FormControl><Input placeholder="Change request title" {...field} /></FormControl>
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
                    <Textarea className="min-h-[80px] resize-none" placeholder="Describe the change..." {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <div className="grid grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="changeType"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Change Type *</FormLabel>
                    <Select value={field.value} onValueChange={field.onChange}>
                      <FormControl><SelectTrigger className="w-full"><SelectValue /></SelectTrigger></FormControl>
                      <SelectContent>
                        {CR_CHANGE_TYPES.map((t) => <SelectItem key={t.value} value={t.value}>{t.label}</SelectItem>)}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="priority"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Priority</FormLabel>
                    <Select value={field.value} onValueChange={field.onChange}>
                      <FormControl><SelectTrigger className="w-full"><SelectValue /></SelectTrigger></FormControl>
                      <SelectContent>
                        {CR_PRIORITIES.map((p) => <SelectItem key={p.value} value={p.value}>{p.label}</SelectItem>)}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>
            <FormField
              control={form.control}
              name="requestedBy"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Requested By</FormLabel>
                  <FormControl><Input placeholder="Name of requester" {...field} /></FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="impactDescription"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Impact Description</FormLabel>
                  <FormControl>
                    <Textarea className="min-h-[60px] resize-none" placeholder="Describe the impact on scope, schedule, cost..." {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            {isEditing && (
              <>
                <FormField
                  control={form.control}
                  name="status"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Status</FormLabel>
                      <Select value={field.value} onValueChange={field.onChange}>
                        <FormControl><SelectTrigger className="w-full"><SelectValue /></SelectTrigger></FormControl>
                        <SelectContent>
                          {CR_STATUSES.map((s) => <SelectItem key={s.value} value={s.value}>{s.label}</SelectItem>)}
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="reviewNotes"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Review Notes</FormLabel>
                      <FormControl>
                        <Textarea className="min-h-[60px] resize-none" placeholder="Notes from review..." {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </>
            )}
            <DialogFooter showCloseButton>
              <Button type="submit" disabled={isPending}>
                {isPending ? 'Saving...' : isEditing ? 'Save Changes' : 'Submit Request'}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}

// ---------- Delete Change Request Confirmation ----------

function DeleteChangeRequestDialog({
  changeRequest,
  open,
  onOpenChange,
  onDeleted,
}: {
  changeRequest: ChangeRequest | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onDeleted: () => void;
}) {
  const [isPending, startTransition] = React.useTransition();

  function handleDelete() {
    if (!changeRequest) return;
    startTransition(async () => {
      try {
        await deleteChangeRequest(changeRequest.id, changeRequest.projectId);
        toast.success('Change request deleted');
        onDeleted();
        onOpenChange(false);
      } catch (error) {
        toast.error('Failed to delete change request');
        console.error(error);
      }
    });
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Delete Change Request</DialogTitle>
          <DialogDescription>
            Are you sure you want to delete &ldquo;{changeRequest?.title}&rdquo;? This action cannot be undone.
          </DialogDescription>
        </DialogHeader>
        <DialogFooter showCloseButton>
          <Button variant="destructive" onClick={handleDelete} disabled={isPending}>
            {isPending ? 'Deleting...' : 'Delete Change Request'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

// ---------- Change Request Item ----------

function ChangeRequestItem({
  changeRequest,
  onEdit,
  onDelete,
}: {
  changeRequest: ChangeRequest;
  onEdit: (cr: ChangeRequest) => void;
  onDelete: (cr: ChangeRequest) => void;
}) {
  return (
    <div className="group flex items-start gap-3 rounded-lg border p-3 transition-colors hover:bg-muted/50">
      <FileEditIcon className="mt-0.5 size-5 shrink-0 text-muted-foreground/70" />
      <div className="min-w-0 flex-1">
        <div className="flex items-center gap-2 flex-wrap">
          <span className="text-sm font-medium">{changeRequest.title}</span>
          <CRStatusBadge value={changeRequest.status} />
          <CRPriorityBadge value={changeRequest.priority} />
        </div>
        {changeRequest.description && (
          <p className="mt-0.5 text-xs text-muted-foreground line-clamp-2">{changeRequest.description}</p>
        )}
        <div className="mt-1 flex items-center gap-3 text-[11px] text-muted-foreground flex-wrap">
          <span className="capitalize">{changeRequest.changeType}</span>
          {changeRequest.requestedBy && <span>By: {changeRequest.requestedBy}</span>}
          <span>{formatDate(changeRequest.createdAt)}</span>
        </div>
      </div>

      <DropdownMenu>
        <DropdownMenuTrigger render={<Button variant="ghost" size="icon-sm" className="opacity-0 group-hover:opacity-100 transition-opacity" />}>
          <MoreHorizontalIcon className="size-4" />
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end">
          <DropdownMenuItem onClick={() => onEdit(changeRequest)}>
            <PencilIcon className="mr-2 size-4" /> Edit Request
          </DropdownMenuItem>
          <DropdownMenuSeparator />
          <DropdownMenuItem
            className="text-destructive focus:text-destructive"
            onClick={() => onDelete(changeRequest)}
          >
            <TrashIcon className="mr-2 size-4" /> Delete Request
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  );
}

// ---------- Change Requests Tab ----------

export function ChangeRequestsTab({ projectId, initialChangeRequests }: { projectId: number; initialChangeRequests: ChangeRequest[] }) {
  const router = useRouter();
  const [changeRequests, setChangeRequests] = React.useState<ChangeRequest[]>(initialChangeRequests);
  const [showCreate, setShowCreate] = React.useState(false);
  const [editingCR, setEditingCR] = React.useState<ChangeRequest | null>(null);
  const [deletingCR, setDeletingCR] = React.useState<ChangeRequest | null>(null);

  function handleCRCreated(cr: ChangeRequest) {
    setChangeRequests((prev) => [cr, ...prev]);
    router.refresh();
  }

  function handleCRUpdated(cr: ChangeRequest) {
    setChangeRequests((prev) => prev.map((c) => (c.id === cr.id ? cr : c)));
    setEditingCR(null);
    router.refresh();
  }

  function handleCRDeleted() {
    if (deletingCR) {
      setChangeRequests((prev) => prev.filter((c) => c.id !== deletingCR.id));
    }
    setDeletingCR(null);
    router.refresh();
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <p className="text-sm text-muted-foreground">
          {changeRequests.length} change request{changeRequests.length !== 1 ? 's' : ''}
        </p>
        <Button size="sm" onClick={() => setShowCreate(true)}>
          <PlusIcon className="mr-1.5 size-4" /> Add Request
        </Button>
      </div>

      {changeRequests.length === 0 ? (
        <div className="rounded-xl border-2 border-dashed p-8 text-center">
          <FileEditIcon className="mx-auto size-8 text-muted-foreground/50" />
          <p className="mt-2 text-sm font-medium">No change requests yet</p>
          <p className="text-xs text-muted-foreground">Submit a change request to track project changes.</p>
        </div>
      ) : (
        <div className="space-y-2">
          {changeRequests.map((cr) => (
            <ChangeRequestItem
              key={cr.id}
              changeRequest={cr}
              onEdit={setEditingCR}
              onDelete={setDeletingCR}
            />
          ))}
        </div>
      )}

      <ChangeRequestFormDialog
        projectId={projectId}
        open={showCreate}
        onOpenChange={setShowCreate}
        onSaved={handleCRCreated}
      />

      <ChangeRequestFormDialog
        projectId={projectId}
        changeRequest={editingCR}
        open={!!editingCR}
        onOpenChange={(open) => { if (!open) setEditingCR(null); }}
        onSaved={handleCRUpdated}
      />

      <DeleteChangeRequestDialog
        changeRequest={deletingCR}
        open={!!deletingCR}
        onOpenChange={(open) => { if (!open) setDeletingCR(null); }}
        onDeleted={handleCRDeleted}
      />
    </div>
  );
}