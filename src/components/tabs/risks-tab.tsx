'use client';

import * as React from 'react';
import { useRouter } from 'next/navigation';
import {
  PlusIcon,
  PencilIcon,
  TrashIcon,
  MoreHorizontalIcon,
  ShieldAlertIcon,
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
import { createRisk, updateRisk, deleteRisk } from '@/actions/risks';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';

type Risk = typeof import('@/db/schema').risks.$inferSelect;

// ---------- Constants ----------

const RISK_STATUSES = [
  { value: 'identified', label: 'Identified', color: 'bg-yellow-500/15 text-yellow-600 dark:text-yellow-400' },
  { value: 'analyzed', label: 'Analyzed', color: 'bg-blue-500/15 text-blue-600 dark:text-blue-400' },
  { value: 'response_planned', label: 'Response Planned', color: 'bg-purple-500/15 text-purple-600 dark:text-purple-400' },
  { value: 'implemented', label: 'Implemented', color: 'bg-cyan-500/15 text-cyan-600 dark:text-cyan-400' },
  { value: 'closed', label: 'Closed', color: 'bg-emerald-500/15 text-emerald-600 dark:text-emerald-400' },
  { value: 'materialized', label: 'Materialized', color: 'bg-red-500/15 text-red-600 dark:text-red-400' },
] as const;

const RESPONSE_TYPES = [
  { value: 'avoid', label: 'Avoid' },
  { value: 'mitigate', label: 'Mitigate' },
  { value: 'transfer', label: 'Transfer' },
  { value: 'accept', label: 'Accept' },
  { value: 'escalate', label: 'Escalate' },
  { value: 'exploit', label: 'Exploit' },
  { value: 'enhance', label: 'Enhance' },
  { value: 'share', label: 'Share' },
] as const;

const RISK_CATEGORIES = [
  { value: 'technical', label: 'Technical' },
  { value: 'schedule', label: 'Schedule' },
  { value: 'finance', label: 'Finance' },
  { value: 'resource', label: 'Resource' },
  { value: 'stakeholder', label: 'Stakeholder' },
  { value: 'external', label: 'External' },
  { value: 'other', label: 'Other' },
] as const;

const SCALE_LABELS = ['Very Low', 'Low', 'Medium', 'High', 'Very High'] as const;

function getRiskStatusMeta(value: string | null) {
  return RISK_STATUSES.find((s) => s.value === value) ?? RISK_STATUSES[0];
}

function getRiskScoreColor(score: number | null): string {
  if (score == null) return 'bg-zinc-500/15 text-zinc-600 dark:text-zinc-400';
  if (score <= 4) return 'bg-emerald-500/15 text-emerald-700 dark:text-emerald-400';
  if (score <= 9) return 'bg-yellow-500/15 text-yellow-700 dark:text-yellow-400';
  if (score <= 16) return 'bg-orange-500/15 text-orange-700 dark:text-orange-400';
  return 'bg-red-500/15 text-red-700 dark:text-red-400';
}

function RiskScoreBadge({ score }: { score: number | null }) {
  if (score == null) return null;
  return (
    <span className={cn('inline-flex items-center rounded-full px-1.5 py-0.5 text-[10px] font-bold', getRiskScoreColor(score))}>
      {score}
    </span>
  );
}

function RiskStatusBadge({ value }: { value: string | null }) {
  const meta = getRiskStatusMeta(value);
  return (
    <span className={cn('inline-flex items-center rounded-full px-1.5 py-0.5 text-[10px] font-medium', meta.color)}>
      {meta.label}
    </span>
  );
}

// ---------- Schemas ----------

const riskSchema = z.object({
  title: z.string().min(1, 'Title is required').max(500),
  description: z.string().optional(),
  category: z.string().optional(),
  probability: z.number().min(1).max(5),
  impact: z.number().min(1).max(5),
  status: z.string(),
  responseType: z.string().optional(),
  responseAction: z.string().optional(),
  owner: z.string().optional(),
});

type RiskForm = z.infer<typeof riskSchema>;

// ---------- Create/Edit Risk Dialog ----------

function RiskFormDialog({
  projectId,
  risk,
  open,
  onOpenChange,
  onSaved,
}: {
  projectId: number;
  risk?: Risk | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSaved: (risk: Risk) => void;
}) {
  const [isPending, startTransition] = React.useTransition();
  const isEditing = !!risk;

  const form = useForm<RiskForm>({
    resolver: zodResolver(riskSchema),
    defaultValues: {
      title: risk?.title ?? '',
      description: risk?.description ?? '',
      category: risk?.category ?? '',
      probability: risk?.probability ?? 3,
      impact: risk?.impact ?? 3,
      status: risk?.status ?? 'identified',
      responseType: risk?.responseType ?? '',
      responseAction: risk?.responseAction ?? '',
      owner: risk?.owner ?? '',
    },
  });

  React.useEffect(() => {
    form.reset({
      title: risk?.title ?? '',
      description: risk?.description ?? '',
      category: risk?.category ?? '',
      probability: risk?.probability ?? 3,
      impact: risk?.impact ?? 3,
      status: risk?.status ?? 'identified',
      responseType: risk?.responseType ?? '',
      responseAction: risk?.responseAction ?? '',
      owner: risk?.owner ?? '',
    });
  }, [risk, form]);

  function onSubmit(data: RiskForm) {
    startTransition(async () => {
      try {
        let saved: Risk;
        if (isEditing && risk) {
          saved = await updateRisk(risk.id, projectId, {
            title: data.title,
            description: data.description || null,
            category: data.category || null,
            probability: data.probability,
            impact: data.impact,
            status: data.status,
            responseType: data.responseType || null,
            responseAction: data.responseAction || null,
            owner: data.owner || null,
          });
        } else {
          saved = await createRisk({
            projectId,
            title: data.title,
            description: data.description || null,
            category: data.category || null,
            probability: data.probability,
            impact: data.impact,
            status: data.status,
            responseType: data.responseType || null,
            responseAction: data.responseAction || null,
            owner: data.owner || null,
          });
        }
        toast.success(isEditing ? 'Risk updated' : 'Risk created');
        onSaved(saved);
        onOpenChange(false);
        if (!isEditing) form.reset();
      } catch (error) {
        toast.error(isEditing ? 'Failed to update risk' : 'Failed to create risk');
        console.error(error);
      }
    });
  }

  const probability = form.watch('probability');
  const impact = form.watch('impact');
  const riskScore = probability * impact;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg max-h-[85vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{isEditing ? 'Edit Risk' : 'Add Risk'}</DialogTitle>
          <DialogDescription>
            {isEditing ? 'Update risk details.' : 'Add a new risk to the register.'}
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
                  <FormControl><Input placeholder="Risk title" {...field} /></FormControl>
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
                  <FormControl>
                    <Textarea className="min-h-[80px] resize-none" placeholder="Describe the risk..." {...field} />
                  </FormControl>
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
                      {RISK_CATEGORIES.map((c) => <SelectItem key={c.value} value={c.value}>{c.label}</SelectItem>)}
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />
            <div className="grid grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="probability"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Probability (1-5)</FormLabel>
                    <Select value={String(field.value)} onValueChange={(v) => field.onChange(Number(v))}>
                      <FormControl><SelectTrigger className="w-full"><SelectValue /></SelectTrigger></FormControl>
                      <SelectContent>
                        {SCALE_LABELS.map((label, i) => (
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
                name="impact"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Impact (1-5)</FormLabel>
                    <Select value={String(field.value)} onValueChange={(v) => field.onChange(Number(v))}>
                      <FormControl><SelectTrigger className="w-full"><SelectValue /></SelectTrigger></FormControl>
                      <SelectContent>
                        {SCALE_LABELS.map((label, i) => (
                          <SelectItem key={i + 1} value={String(i + 1)}>{i + 1} - {label}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>
            <div className="flex items-center gap-2 text-sm">
              <span className="text-muted-foreground">Risk Score:</span>
              <RiskScoreBadge score={riskScore} />
              <span className="text-muted-foreground">({probability} x {impact})</span>
            </div>
            <FormField
              control={form.control}
              name="status"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Status</FormLabel>
                  <Select value={field.value} onValueChange={field.onChange}>
                    <FormControl><SelectTrigger className="w-full"><SelectValue /></SelectTrigger></FormControl>
                    <SelectContent>
                      {RISK_STATUSES.map((s) => <SelectItem key={s.value} value={s.value}>{s.label}</SelectItem>)}
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="responseType"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Response Type</FormLabel>
                  <Select value={field.value ?? ''} onValueChange={field.onChange}>
                    <FormControl><SelectTrigger className="w-full"><SelectValue placeholder="Select response type" /></SelectTrigger></FormControl>
                    <SelectContent>
                      <SelectItem value="">None</SelectItem>
                      {RESPONSE_TYPES.map((r) => <SelectItem key={r.value} value={r.value}>{r.label}</SelectItem>)}
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="responseAction"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Response Action</FormLabel>
                  <FormControl>
                    <Textarea className="min-h-[60px] resize-none" placeholder="Describe the response action..." {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="owner"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Owner</FormLabel>
                  <FormControl><Input placeholder="Risk owner" {...field} /></FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <DialogFooter showCloseButton>
              <Button type="submit" disabled={isPending}>
                {isPending ? 'Saving...' : isEditing ? 'Save Changes' : 'Add Risk'}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}

// ---------- Delete Risk Confirmation ----------

function DeleteRiskDialog({
  risk,
  open,
  onOpenChange,
  onDeleted,
}: {
  risk: Risk | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onDeleted: () => void;
}) {
  const [isPending, startTransition] = React.useTransition();

  function handleDelete() {
    if (!risk) return;
    startTransition(async () => {
      try {
        await deleteRisk(risk.id, risk.projectId);
        toast.success('Risk deleted');
        onDeleted();
        onOpenChange(false);
      } catch (error) {
        toast.error('Failed to delete risk');
        console.error(error);
      }
    });
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Delete Risk</DialogTitle>
          <DialogDescription>
            Are you sure you want to delete &ldquo;{risk?.title}&rdquo;? This action cannot be undone.
          </DialogDescription>
        </DialogHeader>
        <DialogFooter showCloseButton>
          <Button variant="destructive" onClick={handleDelete} disabled={isPending}>
            {isPending ? 'Deleting...' : 'Delete Risk'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

// ---------- Risk Heat Map (5×5 P×I matrix) ----------

const CELL_COLORS: Record<string, string> = {
  low: 'bg-emerald-500/10 dark:bg-emerald-500/20',
  medium: 'bg-yellow-500/10 dark:bg-yellow-500/20',
  high: 'bg-orange-500/10 dark:bg-orange-500/20',
  critical: 'bg-red-500/10 dark:bg-red-500/20',
};

function getCellLevel(p: number, i: number): string {
  const score = p * i;
  if (score >= 15) return 'critical';
  if (score >= 9) return 'high';
  if (score >= 5) return 'medium';
  return 'low';
}

function RiskHeatMap({ risks }: { risks: Risk[] }) {
  const activeRisks = risks.filter(r => r.status !== 'closed' && r.status !== 'materialized');

  function getRisksAtCell(p: number, i: number) {
    return activeRisks.filter(r => r.probability === p && r.impact === i);
  }

  return (
    <Card>
      <CardContent className="pt-4 overflow-x-auto">
        <div className="flex items-start gap-3 min-w-[360px]">
          {/* Y-axis label */}
          <div className="flex flex-col justify-between text-[10px] text-muted-foreground py-5" style={{ height: '200px', writingMode: 'horizontal-tb' }}>
            <span>High Impact</span>
            <span className="text-center">Impact</span>
            <span>Low Impact</span>
          </div>

          <div className="flex-1">
            {/* Grid: rows = impact 5→1 (top=high), cols = probability 1→5 (left=low) */}
            <div className="grid gap-0.5" style={{ gridTemplateColumns: 'repeat(5, 1fr)' }}>
              {[5, 4, 3, 2, 1].map((impact) =>
                [1, 2, 3, 4, 5].map((prob) => {
                  const cellRisks = getRisksAtCell(prob, impact);
                  const level = getCellLevel(prob, impact);
                  return (
                    <div
                      key={`${prob}-${impact}`}
                      className={cn(
                        'relative rounded p-1 min-h-[38px] border border-border/40',
                        CELL_COLORS[level],
                      )}
                      title={`P:${prob} × I:${impact} = ${prob * impact}`}
                    >
                      {cellRisks.length > 0 && (
                        <div className="flex flex-wrap gap-0.5">
                          {cellRisks.map(r => (
                            <div
                              key={r.id}
                              className="truncate max-w-full rounded bg-background/70 px-1 py-0.5 text-[9px] font-medium leading-none"
                              title={r.title}
                            >
                              {r.title.length > 10 ? r.title.slice(0, 10) + '…' : r.title}
                            </div>
                          ))}
                        </div>
                      )}
                      <span className="absolute bottom-0.5 right-1 text-[9px] text-muted-foreground/40 select-none">
                        {prob * impact}
                      </span>
                    </div>
                  );
                })
              )}
            </div>

            {/* X-axis labels */}
            <div className="mt-1 grid gap-0.5 text-center text-[10px] text-muted-foreground" style={{ gridTemplateColumns: 'repeat(5, 1fr)' }}>
              {['1\nVery Low', '2\nLow', '3\nMedium', '4\nHigh', '5\nVery High'].map((lbl, i) => (
                <div key={i} className="leading-tight">{lbl.replace('\n', '\n')}</div>
              ))}
            </div>
            <p className="mt-1 text-center text-[10px] text-muted-foreground">Probability →</p>
          </div>
        </div>

        {/* Legend */}
        <div className="mt-3 flex items-center gap-3 text-[10px] text-muted-foreground">
          <span className="flex items-center gap-1"><span className="h-2 w-2 rounded bg-emerald-500/40" />Low (1-4)</span>
          <span className="flex items-center gap-1"><span className="h-2 w-2 rounded bg-yellow-500/40" />Medium (5-8)</span>
          <span className="flex items-center gap-1"><span className="h-2 w-2 rounded bg-orange-500/40" />High (9-14)</span>
          <span className="flex items-center gap-1"><span className="h-2 w-2 rounded bg-red-500/40" />Critical (15-25)</span>
        </div>
      </CardContent>
    </Card>
  );
}

// ---------- Risk Item ----------

function RiskItem({
  risk,
  onEdit,
  onDelete,
}: {
  risk: Risk;
  onEdit: (risk: Risk) => void;
  onDelete: (risk: Risk) => void;
}) {
  const riskScore = risk.probability * risk.impact;

  return (
    <div className="group flex items-start gap-3 rounded-lg border p-3 transition-colors hover:bg-muted/50">
      <ShieldAlertIcon className="mt-0.5 size-5 shrink-0 text-muted-foreground/70" />
      <div className="min-w-0 flex-1">
        <div className="flex items-center gap-2 flex-wrap">
          <span className="text-sm font-medium">{risk.title}</span>
          <RiskScoreBadge score={riskScore} />
          <RiskStatusBadge value={risk.status} />
        </div>
        {risk.description && (
          <p className="mt-0.5 text-xs text-muted-foreground line-clamp-2">{risk.description}</p>
        )}
        <div className="mt-1 flex items-center gap-3 text-[11px] text-muted-foreground flex-wrap">
          <span>P: {risk.probability}/5</span>
          <span>I: {risk.impact}/5</span>
          {risk.category && <span className="capitalize">{risk.category}</span>}
          {risk.responseType && <span className="capitalize">{risk.responseType.replace('_', ' ')}</span>}
          {risk.owner && <span>Owner: {risk.owner}</span>}
          <span>{formatDate(risk.createdAt)}</span>
        </div>
      </div>

      <DropdownMenu>
        <DropdownMenuTrigger render={<Button variant="ghost" size="icon-sm" className="opacity-0 group-hover:opacity-100 transition-opacity" />}>
          <MoreHorizontalIcon className="size-4" />
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end">
          <DropdownMenuItem onClick={() => onEdit(risk)}>
            <PencilIcon className="mr-2 size-4" /> Edit Risk
          </DropdownMenuItem>
          <DropdownMenuSeparator />
          <DropdownMenuItem
            className="text-destructive focus:text-destructive"
            onClick={() => onDelete(risk)}
          >
            <TrashIcon className="mr-2 size-4" /> Delete Risk
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  );
}

// ---------- Risks Tab ----------

export function RisksTab({ projectId, initialRisks }: { projectId: number; initialRisks: Risk[] }) {
  const router = useRouter();
  const [risks, setRisks] = React.useState<Risk[]>(initialRisks);
  const [showCreate, setShowCreate] = React.useState(false);
  const [editingRisk, setEditingRisk] = React.useState<Risk | null>(null);
  const [deletingRisk, setDeletingRisk] = React.useState<Risk | null>(null);

  function handleRiskCreated(risk: Risk) {
    setRisks((prev) => [risk, ...prev]);
    router.refresh();
  }

  function handleRiskUpdated(risk: Risk) {
    setRisks((prev) => prev.map((r) => (r.id === risk.id ? risk : r)));
    setEditingRisk(null);
    router.refresh();
  }

  function handleRiskDeleted() {
    if (deletingRisk) {
      setRisks((prev) => prev.filter((r) => r.id !== deletingRisk.id));
    }
    setDeletingRisk(null);
    router.refresh();
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <p className="text-sm text-muted-foreground">
          {risks.length} risk{risks.length !== 1 ? 's' : ''}
        </p>
        <Button size="sm" onClick={() => setShowCreate(true)}>
          <PlusIcon className="mr-1.5 size-4" /> Add Risk
        </Button>
      </div>

      {risks.length > 0 && <RiskHeatMap risks={risks} />}

      {risks.length === 0 ? (
        <div className="rounded-xl border-2 border-dashed p-8 text-center">
          <ShieldAlertIcon className="mx-auto size-8 text-muted-foreground/50" />
          <p className="mt-2 text-sm font-medium">No risks yet</p>
          <p className="text-xs text-muted-foreground">Add risks to track potential threats and opportunities.</p>
        </div>
      ) : (
        <div className="space-y-2">
          {risks.map((risk) => (
            <RiskItem
              key={risk.id}
              risk={risk}
              onEdit={setEditingRisk}
              onDelete={setDeletingRisk}
            />
          ))}
        </div>
      )}

      <RiskFormDialog
        projectId={projectId}
        open={showCreate}
        onOpenChange={setShowCreate}
        onSaved={handleRiskCreated}
      />

      <RiskFormDialog
        projectId={projectId}
        risk={editingRisk}
        open={!!editingRisk}
        onOpenChange={(open) => { if (!open) setEditingRisk(null); }}
        onSaved={handleRiskUpdated}
      />

      <DeleteRiskDialog
        risk={deletingRisk}
        open={!!deletingRisk}
        onOpenChange={(open) => { if (!open) setDeletingRisk(null); }}
        onDeleted={handleRiskDeleted}
      />
    </div>
  );
}