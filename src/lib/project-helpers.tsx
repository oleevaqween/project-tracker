import { cn } from '@/lib/utils';

// ---------- Status helpers ----------

export const PROJECT_STATUSES = [
  { value: 'planning', label: 'Planning', color: 'bg-blue-500/15 text-blue-600 dark:text-blue-400' },
  { value: 'in_progress', label: 'In Progress', color: 'bg-amber-500/15 text-amber-600 dark:text-amber-400' },
  { value: 'on_hold', label: 'On Hold', color: 'bg-gray-500/15 text-gray-600 dark:text-gray-400' },
  { value: 'completed', label: 'Completed', color: 'bg-emerald-500/15 text-emerald-600 dark:text-emerald-400' },
  { value: 'archived', label: 'Archived', color: 'bg-zinc-500/15 text-zinc-600 dark:text-zinc-400' },
] as const;

export const FOCUS_AREAS = [
  { value: 'initiating', label: 'Initiating', color: 'bg-violet-500/15 text-violet-600 dark:text-violet-400' },
  { value: 'planning', label: 'Planning', color: 'bg-sky-500/15 text-sky-600 dark:text-sky-400' },
  { value: 'executing', label: 'Executing', color: 'bg-amber-500/15 text-amber-600 dark:text-amber-400' },
  { value: 'monitoring_controlling', label: 'Monitoring & Controlling', color: 'bg-rose-500/15 text-rose-600 dark:text-rose-400' },
  { value: 'closing', label: 'Closing', color: 'bg-emerald-500/15 text-emerald-600 dark:text-emerald-400' },
] as const;

export const TASK_STATUSES = [
  { value: 'todo', label: 'To Do', color: 'bg-zinc-500/15 text-zinc-600 dark:text-zinc-400' },
  { value: 'in_progress', label: 'In Progress', color: 'bg-blue-500/15 text-blue-600 dark:text-blue-400' },
  { value: 'review', label: 'Review', color: 'bg-amber-500/15 text-amber-600 dark:text-amber-400' },
  { value: 'done', label: 'Done', color: 'bg-emerald-500/15 text-emerald-600 dark:text-emerald-400' },
] as const;

export const TASK_PRIORITIES = [
  { value: 'low', label: 'Low', color: 'bg-zinc-500/15 text-zinc-600 dark:text-zinc-400' },
  { value: 'medium', label: 'Medium', color: 'bg-blue-500/15 text-blue-600 dark:text-blue-400' },
  { value: 'high', label: 'High', color: 'bg-amber-500/15 text-amber-600 dark:text-amber-400' },
  { value: 'critical', label: 'Critical', color: 'bg-red-500/15 text-red-600 dark:text-red-400' },
] as const;

export function getStatusMeta(value: string) {
  return PROJECT_STATUSES.find((s) => s.value === value) ?? PROJECT_STATUSES[0];
}

export function getFocusAreaMeta(value: string | null) {
  return FOCUS_AREAS.find((a) => a.value === value) ?? null;
}

export function getTaskStatusMeta(value: string) {
  return TASK_STATUSES.find((s) => s.value === value) ?? TASK_STATUSES[0];
}

export function getTaskPriorityMeta(value: string | null) {
  return TASK_PRIORITIES.find((p) => p.value === value) ?? TASK_PRIORITIES[1];
}

export function StatusBadge({ value, className }: { value: string; className?: string }) {
  const meta = getStatusMeta(value);
  return (
    <span className={cn('inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium', meta.color, className)}>
      {meta.label}
    </span>
  );
}

export function FocusAreaBadge({ value, className }: { value: string | null; className?: string }) {
  const meta = getFocusAreaMeta(value);
  if (!meta) return null;
  return (
    <span className={cn('inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium', meta.color, className)}>
      {meta.label}
    </span>
  );
}

export function formatDate(date: Date | string | null): string {
  if (!date) return '—';
  return new Intl.DateTimeFormat('en-US', { month: 'short', day: 'numeric', year: 'numeric', timeZone: 'UTC' }).format(new Date(date));
}

export const CURRENCIES = [
  { code: 'USD', label: 'USD ($)' },
  { code: 'NGN', label: 'NGN (₦)' },
  { code: 'EUR', label: 'EUR (€)' },
  { code: 'GBP', label: 'GBP (£)' },
] as const;

export type CurrencyCode = typeof CURRENCIES[number]['code'];

export function formatBudget(budget: string | null, currency: string | null = 'USD'): string {
  if (!budget) return '—';
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: currency ?? 'USD',
    maximumFractionDigits: 0,
  }).format(Number(budget));
}

export function parseBudgetInput(value: string): string {
  return value.replace(/[^0-9.]/g, '');
}

export function formatBudgetInput(value: string): string {
  const clean = value.replace(/[^0-9.]/g, '');
  if (!clean) return clean;
  const [integer, decimal] = clean.split('.');
  const formatted = parseInt(integer || '0', 10).toLocaleString('en-US');
  return decimal !== undefined ? `${formatted}.${decimal}` : formatted;
}