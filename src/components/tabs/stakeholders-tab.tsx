'use client';

import * as React from 'react';
import { useRouter } from 'next/navigation';
import {
  PlusIcon,
  PencilIcon,
  TrashIcon,
  MoreHorizontalIcon,
  UsersIcon,
} from 'lucide-react';
import { toast } from 'sonner';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
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
import { createStakeholder, updateStakeholder, deleteStakeholder } from '@/actions/stakeholders';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';

type Stakeholder = typeof import('@/db/schema').stakeholders.$inferSelect;

// ---------- Constants ----------

const ENGAGEMENT_LEVELS = [
  { value: 'unaware', label: 'Unaware', color: 'bg-gray-500/15 text-gray-600 dark:text-gray-400' },
  { value: 'resistant', label: 'Resistant', color: 'bg-red-500/15 text-red-600 dark:text-red-400' },
  { value: 'neutral', label: 'Neutral', color: 'bg-yellow-500/15 text-yellow-600 dark:text-yellow-400' },
  { value: 'supportive', label: 'Supportive', color: 'bg-green-500/15 text-green-600 dark:text-green-400' },
  { value: 'leading', label: 'Leading', color: 'bg-blue-500/15 text-blue-600 dark:text-blue-400' },
] as const;

const INTEREST_LABELS = ['Very Low', 'Low', 'Medium', 'High', 'Very High'] as const;
const INFLUENCE_LABELS = ['Very Low', 'Low', 'Medium', 'High', 'Very High'] as const;

function formatLastEngaged(date: Date | null | undefined): string {
  if (!date) return 'Never engaged';
  const days = Math.floor((Date.now() - new Date(date).getTime()) / 86_400_000);
  if (days === 0) return 'Engaged today';
  if (days === 1) return 'Engaged 1 day ago';
  return `Engaged ${days} days ago`;
}

function getEngagementMeta(value: string | null) {
  return ENGAGEMENT_LEVELS.find((e) => e.value === value) ?? ENGAGEMENT_LEVELS[2]; // default neutral
}

function EngagementBadge({ value }: { value: string | null }) {
  const meta = getEngagementMeta(value);
  return (
    <span className={cn('inline-flex items-center rounded-full px-1.5 py-0.5 text-[10px] font-medium', meta.color)}>
      {meta.label}
    </span>
  );
}

function getQuadrant(interest: number, influence: number): string {
  if (interest >= 3 && influence >= 3) return 'Manage Closely';
  if (interest < 3 && influence >= 3) return 'Keep Satisfied';
  if (interest >= 3 && influence < 3) return 'Keep Informed';
  return 'Monitor';
}

// ---------- Schemas ----------

const stakeholderSchema = z.object({
  name: z.string().min(1, 'Name is required').max(255),
  role: z.string().optional(),
  organization: z.string().optional(),
  email: z.string().email('Invalid email').or(z.literal('')).optional(),
  interest: z.number().min(1).max(5),
  influence: z.number().min(1).max(5),
  engagementLevel: z.string(),
  engagementStrategy: z.string().optional(),
  lastEngagedDate: z.string().optional(),
});

type StakeholderForm = z.infer<typeof stakeholderSchema>;

// ---------- Create/Edit Stakeholder Dialog ----------

function StakeholderFormDialog({
  projectId,
  stakeholder,
  open,
  onOpenChange,
  onSaved,
}: {
  projectId: number;
  stakeholder?: Stakeholder | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSaved: (stakeholder: Stakeholder) => void;
}) {
  const [isPending, startTransition] = React.useTransition();
  const isEditing = !!stakeholder;

  const toDateInputValue = (d: Date | null | undefined) =>
    d ? new Date(d).toISOString().slice(0, 10) : '';

  const form = useForm<StakeholderForm>({
    resolver: zodResolver(stakeholderSchema),
    defaultValues: {
      name: stakeholder?.name ?? '',
      role: stakeholder?.role ?? '',
      organization: stakeholder?.organization ?? '',
      email: stakeholder?.email ?? '',
      interest: stakeholder?.interest ?? 3,
      influence: stakeholder?.influence ?? 3,
      engagementLevel: stakeholder?.engagementLevel ?? 'neutral',
      engagementStrategy: stakeholder?.engagementStrategy ?? '',
      lastEngagedDate: toDateInputValue(stakeholder?.lastEngagedDate),
    },
  });

  React.useEffect(() => {
    form.reset({
      name: stakeholder?.name ?? '',
      role: stakeholder?.role ?? '',
      organization: stakeholder?.organization ?? '',
      email: stakeholder?.email ?? '',
      interest: stakeholder?.interest ?? 3,
      influence: stakeholder?.influence ?? 3,
      engagementLevel: stakeholder?.engagementLevel ?? 'neutral',
      engagementStrategy: stakeholder?.engagementStrategy ?? '',
      lastEngagedDate: toDateInputValue(stakeholder?.lastEngagedDate),
    });
  }, [stakeholder, form]);

  function onSubmit(data: StakeholderForm) {
    startTransition(async () => {
      try {
        let saved: Stakeholder;
        const lastEngagedDate = data.lastEngagedDate ? new Date(data.lastEngagedDate) : null;
        if (isEditing && stakeholder) {
          const result = await updateStakeholder(stakeholder.id, projectId, {
            name: data.name,
            role: data.role || null,
            organization: data.organization || null,
            email: data.email || null,
            interest: data.interest,
            influence: data.influence,
            engagementLevel: data.engagementLevel,
            engagementStrategy: data.engagementStrategy || null,
            lastEngagedDate,
          });
          if (!result) return;
          saved = result;
        } else {
          saved = await createStakeholder({
            projectId,
            name: data.name,
            role: data.role || null,
            organization: data.organization || null,
            email: data.email || null,
            interest: data.interest,
            influence: data.influence,
            engagementLevel: data.engagementLevel,
            engagementStrategy: data.engagementStrategy || null,
            lastEngagedDate,
          });
        }
        toast.success(isEditing ? 'Stakeholder updated' : 'Stakeholder added');
        onSaved(saved);
        onOpenChange(false);
        if (!isEditing) form.reset();
      } catch (error) {
        toast.error(isEditing ? 'Failed to update stakeholder' : 'Failed to add stakeholder');
        console.error(error);
      }
    });
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg max-h-[85vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{isEditing ? 'Edit Stakeholder' : 'Add Stakeholder'}</DialogTitle>
          <DialogDescription>
            {isEditing ? 'Update stakeholder details.' : 'Add a new stakeholder to this project.'}
          </DialogDescription>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="flex flex-col gap-4">
            <FormField
              control={form.control}
              name="name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Name *</FormLabel>
                  <FormControl><Input placeholder="Stakeholder name" {...field} /></FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <div className="grid grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="role"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Role</FormLabel>
                    <FormControl><Input placeholder="e.g. Sponsor, End User" {...field} /></FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="organization"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Organization</FormLabel>
                    <FormControl><Input placeholder="Organization" {...field} /></FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>
            <FormField
              control={form.control}
              name="email"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Email</FormLabel>
                  <FormControl><Input type="email" placeholder="email@example.com" {...field} /></FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <div className="grid grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="interest"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Interest (1-5)</FormLabel>
                    <Select value={String(field.value)} onValueChange={(v) => field.onChange(Number(v))}>
                      <FormControl><SelectTrigger className="w-full"><SelectValue /></SelectTrigger></FormControl>
                      <SelectContent>
                        {INTEREST_LABELS.map((label, i) => (
                          <SelectItem key={i + 1} value={String(i + 1)}>{i + 1} - {label}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="influence"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Influence (1-5)</FormLabel>
                    <Select value={String(field.value)} onValueChange={(v) => field.onChange(Number(v))}>
                      <FormControl><SelectTrigger className="w-full"><SelectValue /></SelectTrigger></FormControl>
                      <SelectContent>
                        {INFLUENCE_LABELS.map((label, i) => (
                          <SelectItem key={i + 1} value={String(i + 1)}>{i + 1} - {label}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>
            <FormField
              control={form.control}
              name="engagementLevel"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Engagement Level</FormLabel>
                  <Select value={field.value} onValueChange={field.onChange}>
                    <FormControl><SelectTrigger className="w-full"><SelectValue /></SelectTrigger></FormControl>
                    <SelectContent>
                      {ENGAGEMENT_LEVELS.map((e) => (
                        <SelectItem key={e.value} value={e.value}>{e.label}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="engagementStrategy"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Engagement Strategy</FormLabel>
                  <FormControl>
                    <Textarea
                      className="min-h-[60px] resize-none"
                      placeholder="How to engage this stakeholder..."
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="lastEngagedDate"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Last Engaged</FormLabel>
                  <FormControl>
                    <Input type="date" max={new Date().toISOString().slice(0, 10)} {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <DialogFooter showCloseButton>
              <Button type="submit" disabled={isPending}>
                {isPending ? 'Saving...' : isEditing ? 'Save Changes' : 'Add Stakeholder'}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}

// ---------- Delete Stakeholder Confirmation ----------

function DeleteStakeholderDialog({
  stakeholder,
  open,
  onOpenChange,
  onDeleted,
}: {
  stakeholder: Stakeholder | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onDeleted: () => void;
}) {
  const [isPending, startTransition] = React.useTransition();

  function handleDelete() {
    if (!stakeholder) return;
    startTransition(async () => {
      try {
        await deleteStakeholder(stakeholder.id, stakeholder.projectId);
        toast.success('Stakeholder removed');
        onDeleted();
        onOpenChange(false);
      } catch (error) {
        toast.error('Failed to remove stakeholder');
        console.error(error);
      }
    });
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Remove Stakeholder</DialogTitle>
          <DialogDescription>
            Are you sure you want to remove &ldquo;{stakeholder?.name}&rdquo; from this project? This action cannot be undone.
          </DialogDescription>
        </DialogHeader>
        <DialogFooter showCloseButton>
          <Button variant="destructive" onClick={handleDelete} disabled={isPending}>
            {isPending ? 'Removing...' : 'Remove Stakeholder'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

// ---------- Power-Interest Grid ----------

const QUADRANT_CONFIG = [
  {
    key: 'keep_satisfied',
    label: 'Keep Satisfied',
    description: 'High influence, low interest',
    bg: 'bg-amber-50 dark:bg-amber-950/30',
    border: 'border-amber-200 dark:border-amber-800',
    dotColor: 'fill-amber-500',
    interestRange: [1, 2] as const,
    influenceRange: [3, 5] as const,
  },
  {
    key: 'manage_closely',
    label: 'Manage Closely',
    description: 'High influence, high interest',
    bg: 'bg-red-50 dark:bg-red-950/30',
    border: 'border-red-200 dark:border-red-800',
    dotColor: 'fill-red-500',
    interestRange: [3, 5] as const,
    influenceRange: [3, 5] as const,
  },
  {
    key: 'monitor',
    label: 'Monitor',
    description: 'Low influence, low interest',
    bg: 'bg-zinc-50 dark:bg-zinc-900/30',
    border: 'border-zinc-200 dark:border-zinc-700',
    dotColor: 'fill-zinc-400',
    interestRange: [1, 2] as const,
    influenceRange: [1, 2] as const,
  },
  {
    key: 'keep_informed',
    label: 'Keep Informed',
    description: 'Low influence, high interest',
    bg: 'bg-blue-50 dark:bg-blue-950/30',
    border: 'border-blue-200 dark:border-blue-800',
    dotColor: 'fill-blue-500',
    interestRange: [3, 5] as const,
    influenceRange: [1, 2] as const,
  },
] as const;

function PowerInterestGrid({ stakeholders }: { stakeholders: Stakeholder[] }) {
  function getStakeholdersForQuadrant(interestRange: readonly [number, number], influenceRange: readonly [number, number]) {
    return stakeholders.filter(
      (s) => s.interest! >= interestRange[0] && s.interest! <= interestRange[1]
        && s.influence! >= influenceRange[0] && s.influence! <= influenceRange[1],
    );
  }

  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="text-sm font-medium">Power-Interest Grid</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-2 gap-2">
          {QUADRANT_CONFIG.map((q) => {
            const items = getStakeholdersForQuadrant(q.interestRange, q.influenceRange);
            return (
              <div
                key={q.key}
                className={cn('rounded-lg border p-3', q.bg, q.border)}
              >
                <div className="mb-1">
                  <p className="text-xs font-semibold">{q.label}</p>
                  <p className="text-[10px] text-muted-foreground">{q.description}</p>
                </div>
                {items.length === 0 ? (
                  <p className="text-[10px] text-muted-foreground/60 italic">No stakeholders</p>
                ) : (
                  <div className="space-y-1">
                    {items.map((s) => (
                      <div
                        key={s.id}
                        className="flex items-center gap-1.5 text-[11px]"
                      >
                        <svg width="6" height="6" viewBox="0 0 6 6" className="shrink-0">
                          <circle cx="3" cy="3" r="3" className={q.dotColor} />
                        </svg>
                        <span className="truncate font-medium">{s.name}</span>
                        <EngagementBadge value={s.engagementLevel} />
                      </div>
                    ))}
                  </div>
                )}
              </div>
            );
          })}
        </div>
        <div className="mt-2 flex items-center justify-between text-[10px] text-muted-foreground">
          <span>Low Influence</span>
          <span>High Influence</span>
        </div>
        <div className="flex items-center justify-center text-[10px] text-muted-foreground -mt-0.5">
          <span className="rotate-0">Low Interest</span>
          <span className="mx-2">|</span>
          <span>High Interest</span>
        </div>
      </CardContent>
    </Card>
  );
}

// ---------- Stakeholder Item ----------

function StakeholderItem({
  stakeholder,
  onEdit,
  onDelete,
}: {
  stakeholder: Stakeholder;
  onEdit: (s: Stakeholder) => void;
  onDelete: (s: Stakeholder) => void;
}) {
  return (
    <div className="group flex items-start gap-3 rounded-lg border p-3 transition-colors hover:bg-muted/50">
      <div className="flex size-8 shrink-0 items-center justify-center rounded-full bg-primary/10 text-xs font-medium text-primary">
        {stakeholder.name.charAt(0).toUpperCase()}
      </div>
      <div className="min-w-0 flex-1">
        <div className="flex items-center gap-2">
          <span className="text-sm font-medium">{stakeholder.name}</span>
          <EngagementBadge value={stakeholder.engagementLevel} />
        </div>
        <div className="mt-0.5 flex items-center gap-2 text-xs text-muted-foreground">
          {stakeholder.role && <span>{stakeholder.role}</span>}
          {stakeholder.organization && (
            <>
              {stakeholder.role && <span>&middot;</span>}
              <span>{stakeholder.organization}</span>
            </>
          )}
        </div>
        {stakeholder.engagementStrategy && (
          <p className="mt-1 text-[11px] text-muted-foreground line-clamp-1">
            {stakeholder.engagementStrategy}
          </p>
        )}
        <div className="mt-1 flex items-center gap-3 text-[10px] text-muted-foreground">
          <span>Interest: {stakeholder.interest}/5</span>
          <span>Influence: {stakeholder.influence}/5</span>
          <span className="font-medium">
            {getQuadrant(stakeholder.interest ?? 3, stakeholder.influence ?? 3)}
          </span>
        </div>
        <p className={cn('mt-0.5 text-[10px]', stakeholder.lastEngagedDate ? 'text-emerald-600 dark:text-emerald-400' : 'text-muted-foreground/60 italic')}>
          {formatLastEngaged(stakeholder.lastEngagedDate)}
        </p>
      </div>

      <DropdownMenu>
        <DropdownMenuTrigger render={<Button variant="ghost" size="icon-sm" className="opacity-0 group-hover:opacity-100 transition-opacity" />}>
          <MoreHorizontalIcon className="size-4" />
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end">
          <DropdownMenuItem onClick={() => onEdit(stakeholder)}>
            <PencilIcon className="mr-2 size-4" /> Edit Stakeholder
          </DropdownMenuItem>
          <DropdownMenuSeparator />
          <DropdownMenuItem
            className="text-destructive focus:text-destructive"
            onClick={() => onDelete(stakeholder)}
          >
            <TrashIcon className="mr-2 size-4" /> Remove Stakeholder
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  );
}

// ---------- Stakeholders Tab ----------

export function StakeholdersTab({ projectId, initialStakeholders }: { projectId: number; initialStakeholders: Stakeholder[] }) {
  const router = useRouter();
  const [stakeholders, setStakeholders] = React.useState<Stakeholder[]>(initialStakeholders);
  const [showCreate, setShowCreate] = React.useState(false);
  const [editingStakeholder, setEditingStakeholder] = React.useState<Stakeholder | null>(null);
  const [deletingStakeholder, setDeletingStakeholder] = React.useState<Stakeholder | null>(null);

  function handleStakeholderCreated(stakeholder: Stakeholder) {
    setStakeholders((prev) => [...prev, stakeholder]);
    router.refresh();
  }

  function handleStakeholderUpdated(stakeholder: Stakeholder) {
    setStakeholders((prev) => prev.map((s) => (s.id === stakeholder.id ? stakeholder : s)));
    setEditingStakeholder(null);
    router.refresh();
  }

  function handleStakeholderDeleted() {
    if (deletingStakeholder) {
      setStakeholders((prev) => prev.filter((s) => s.id !== deletingStakeholder.id));
    }
    setDeletingStakeholder(null);
    router.refresh();
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <p className="text-sm text-muted-foreground">
          {stakeholders.length} stakeholder{stakeholders.length !== 1 ? 's' : ''}
        </p>
        <Button size="sm" onClick={() => setShowCreate(true)}>
          <PlusIcon className="mr-1.5 size-4" /> Add Stakeholder
        </Button>
      </div>

      <PowerInterestGrid stakeholders={stakeholders} />

      {stakeholders.length === 0 ? (
        <div className="rounded-xl border-2 border-dashed p-8 text-center">
          <UsersIcon className="mx-auto size-8 text-muted-foreground/50" />
          <p className="mt-2 text-sm font-medium">No stakeholders yet</p>
          <p className="text-xs text-muted-foreground">Add stakeholders to map their influence and interest.</p>
        </div>
      ) : (
        <div className="space-y-2">
          {stakeholders.map((s) => (
            <StakeholderItem
              key={s.id}
              stakeholder={s}
              onEdit={setEditingStakeholder}
              onDelete={setDeletingStakeholder}
            />
          ))}
        </div>
      )}

      <StakeholderFormDialog
        projectId={projectId}
        open={showCreate}
        onOpenChange={setShowCreate}
        onSaved={handleStakeholderCreated}
      />

      <StakeholderFormDialog
        projectId={projectId}
        stakeholder={editingStakeholder}
        open={!!editingStakeholder}
        onOpenChange={(open) => { if (!open) setEditingStakeholder(null); }}
        onSaved={handleStakeholderUpdated}
      />

      <DeleteStakeholderDialog
        stakeholder={deletingStakeholder}
        open={!!deletingStakeholder}
        onOpenChange={(open) => { if (!open) setDeletingStakeholder(null); }}
        onDeleted={handleStakeholderDeleted}
      />
    </div>
  );
}