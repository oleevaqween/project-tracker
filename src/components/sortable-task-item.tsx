'use client';

import * as React from 'react';
import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import {
  CheckCircle2Icon,
  ClockIcon,
  AlertCircleIcon,
  CircleIcon,
  MoreHorizontalIcon,
  TrashIcon,
  PencilIcon,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { cn } from '@/lib/utils';
import { getTaskStatusMeta, getTaskPriorityMeta, formatDate } from '@/lib/project-helpers';

export type Task = typeof import('@/db/schema').tasks.$inferSelect;

interface SortableTaskItemProps {
  task: Task;
  onStatusChange: (id: number, status: string) => void;
  onDelete: (id: number) => void;
  onEdit?: (task: Task) => void;
}

export function SortableTaskItem({ task, onStatusChange, onDelete, onEdit }: SortableTaskItemProps) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: task.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  };

  const statusMeta = getTaskStatusMeta(task.status);
  const priorityMeta = getTaskPriorityMeta(task.priority ?? 'medium');

  return (
    <div
      ref={setNodeRef}
      style={style}
      {...attributes}
      {...listeners}
      className={cn(
        'group flex items-start gap-3 rounded-lg border bg-card p-3 transition-all hover:bg-muted/50 cursor-grab',
        isDragging && 'opacity-50 shadow-lg scale-105 z-50',
      )}
    >
      <button
        type="button"
        onClick={(e) => {
          e.stopPropagation();
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
          {onEdit && (
            <DropdownMenuItem onClick={() => onEdit(task)}>
              <PencilIcon className="mr-2 size-4" /> Edit Task
            </DropdownMenuItem>
          )}
          {onEdit && <DropdownMenuSeparator />}
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