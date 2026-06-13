'use client';

import * as React from 'react';
import { useRouter } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import { PlusIcon, BriefcaseIcon } from 'lucide-react';
import { createProject } from '@/actions/projects';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
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
import { PROJECT_STATUSES, FOCUS_AREAS, CURRENCIES, parseBudgetInput, formatBudgetInput } from '@/lib/project-helpers';
import { toast } from 'sonner';

const createProjectSchema = z.object({
  name: z.string().min(1, 'Project name is required').max(255),
  description: z.string().optional(),
  status: z.string(),
  currentFocusArea: z.string(),
  category: z.string().optional(),
  currency: z.string(),
  budget: z.string().optional(),
  startDate: z.string().optional(),
  targetEndDate: z.string().optional(),
  portfolioId: z.string().optional(),
});

type CreateProjectForm = z.infer<typeof createProjectSchema>;

type PortfolioOption = { id: number; name: string; color: string | null };

export function CreateProjectDialog() {
  const [open, setOpen] = React.useState(false);
  const [isPending, startTransition] = React.useTransition();
  const [portfolios, setPortfolios] = React.useState<PortfolioOption[]>([]);
  const router = useRouter();

  React.useEffect(() => {
    if (!open) return;
    fetch('/api/portfolios')
      .then((r) => r.json())
      .then((data: PortfolioOption[]) => setPortfolios(Array.isArray(data) ? data : []))
      .catch(() => setPortfolios([]));
  }, [open]);

  const form = useForm<CreateProjectForm>({
    resolver: zodResolver(createProjectSchema),
    defaultValues: {
      name: '',
      description: '',
      status: 'planning',
      currentFocusArea: 'initiating',
      category: '',
      currency: 'USD',
      budget: '',
      startDate: '',
      targetEndDate: '',
      portfolioId: '',
    },
  });

  function onSubmit(data: CreateProjectForm) {
    startTransition(async () => {
      try {
        const project = await createProject({
          name: data.name,
          description: data.description || null,
          status: data.status,
          currentFocusArea: data.currentFocusArea,
          category: data.category || null,
          currency: data.currency || 'USD',
          budget: data.budget ? parseBudgetInput(data.budget) : null,
          startDate: data.startDate ? new Date(data.startDate) : null,
          targetEndDate: data.targetEndDate ? new Date(data.targetEndDate) : null,
          portfolioId: data.portfolioId ? Number(data.portfolioId) : null,
        });

        toast.success('Project created');
        setOpen(false);
        form.reset();
        router.push(`/projects/${project.id}`);
      } catch (error) {
        toast.error('Failed to create project');
        console.error(error);
      }
    });
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger render={<Button />}>
        <PlusIcon className="mr-2 size-4" />
        New Project
      </DialogTrigger>
      <DialogContent className="sm:max-w-lg max-h-[85vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Create New Project</DialogTitle>
          <DialogDescription>
            Set up your project with PMBOK 8 process groups and tracking.
          </DialogDescription>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="flex flex-col gap-4">
            <FormField
              control={form.control}
              name="name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Project Name *</FormLabel>
                  <FormControl>
                    <Input placeholder="My Awesome Project" {...field} />
                  </FormControl>
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
                    <Textarea
                      placeholder="Brief project description..."
                      className="min-h-[80px] resize-none"
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="grid grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="status"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Status</FormLabel>
                    <Select value={field.value} onValueChange={field.onChange}>
                      <FormControl>
                        <SelectTrigger className="w-full">
                          <SelectValue placeholder="Status" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {PROJECT_STATUSES.map((s) => (
                          <SelectItem key={s.value} value={s.value}>
                            {s.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="currentFocusArea"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Focus Area</FormLabel>
                    <Select value={field.value} onValueChange={field.onChange}>
                      <FormControl>
                        <SelectTrigger className="w-full">
                          <SelectValue placeholder="Focus area" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {FOCUS_AREAS.map((a) => (
                          <SelectItem key={a.value} value={a.value}>
                            {a.label}
                          </SelectItem>
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
              name="category"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Category</FormLabel>
                  <FormControl>
                    <Input placeholder="e.g. Software, Marketing, Research" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="portfolioId"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="flex items-center gap-1.5">
                    <BriefcaseIcon className="size-3.5 text-muted-foreground" />
                    Portfolio
                  </FormLabel>
                  <Select value={field.value} onValueChange={field.onChange}>
                    <FormControl>
                      <SelectTrigger className="w-full">
                        <SelectValue placeholder="No portfolio (assign later)" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      <SelectItem value="">No portfolio</SelectItem>
                      {portfolios.map((p) => (
                        <SelectItem key={p.id} value={String(p.id)}>
                          {p.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="grid grid-cols-[140px_1fr] gap-3">
              <FormField
                control={form.control}
                name="currency"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Currency</FormLabel>
                    <Select value={field.value} onValueChange={field.onChange}>
                      <FormControl>
                        <SelectTrigger className="w-full">
                          <SelectValue placeholder="USD" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {CURRENCIES.map((c) => (
                          <SelectItem key={c.code} value={c.code}>
                            {c.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="budget"
                render={({ field }) => (
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
                          // Count raw digits before cursor so we can restore it after reformatting
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
                )}
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="startDate"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Start Date</FormLabel>
                    <FormControl>
                      <Input type="date" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="targetEndDate"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Target End Date</FormLabel>
                    <FormControl>
                      <Input type="date" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <DialogFooter showCloseButton>
              <Button type="submit" disabled={isPending}>
                {isPending ? 'Creating...' : 'Create Project'}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}