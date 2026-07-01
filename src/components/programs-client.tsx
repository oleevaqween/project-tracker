'use client';

import Link from 'next/link';
import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';
import {
  LayersIcon, PlusIcon, FolderKanbanIcon, TrendingUpIcon, BriefcaseIcon,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { StaggerContainer, StaggerItem, Reveal } from '@/components/motion';
import { PMBOKGuide } from '@/components/pmbok';
import { createProgram } from '@/actions/programs';

type Program = {
  id: number;
  userId: string;
  portfolioId: number | null;
  name: string;
  description: string | null;
  objectives: string | null;
  status: string;
  startDate: Date | null;
  targetEndDate: Date | null;
  createdAt: Date;
  updatedAt: Date;
  projectCount: number;
  avgProgress: number;
  portfolioName: string | null;
};

type Portfolio = { id: number; name: string };

interface ProgramsClientProps {
  programs: Program[];
  portfolios: Portfolio[];
}

const STATUS_COLORS: Record<string, { bg: string; text: string; border: string; shadow: string }> = {
  active:    { bg: 'bg-sky-500/10',     text: 'text-sky-700 dark:text-sky-400',     border: 'border-sky-500',     shadow: 'shadow-[4px_4px_0_0_theme(colors.sky.500)]'     },
  completed: { bg: 'bg-emerald-500/10', text: 'text-emerald-700 dark:text-emerald-400', border: 'border-emerald-500', shadow: 'shadow-[4px_4px_0_0_theme(colors.emerald.500)]' },
  on_hold:   { bg: 'bg-amber-500/10',   text: 'text-amber-700 dark:text-amber-400',   border: 'border-amber-500',   shadow: 'shadow-[4px_4px_0_0_theme(colors.amber.500)]'   },
  cancelled: { bg: 'bg-rose-500/10',    text: 'text-rose-700 dark:text-rose-400',    border: 'border-rose-500',    shadow: 'shadow-[4px_4px_0_0_theme(colors.rose.500)]'    },
};

export function ProgramsClient({ programs, portfolios }: ProgramsClientProps) {
  const router = useRouter();
  const [creating, setCreating] = useState(false);
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [objectives, setObjectives] = useState('');
  const [portfolioId, setPortfolioId] = useState<string>('');
  const [saving, setSaving] = useState(false);

  async function handleCreate(e: React.FormEvent) {
    e.preventDefault();
    if (!name.trim()) return;
    setSaving(true);
    try {
      await createProgram({
        name: name.trim(),
        description: description.trim() || null,
        objectives: objectives.trim() || null,
        portfolioId: portfolioId ? Number(portfolioId) : null,
      });
      setName(''); setDescription(''); setObjectives(''); setPortfolioId('');
      setCreating(false);
      toast.success(`Program "${name.trim()}" created`);
      router.refresh();
    } catch {
      toast.error('Failed to create program');
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="flex flex-1 flex-col">
      {/* PAGE HEADER BAND */}
      <div className="border-b px-6 pt-8 pb-6 md:px-12 lg:px-16">
        <div className="flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <p className="text-[11px] font-medium uppercase tracking-[0.12em] text-muted-foreground mb-2">
              PORTFOLIO MANAGEMENT
            </p>
            <h1 className="text-[2.75rem] font-black font-heading tracking-[-0.025em] leading-[1.05] text-foreground">
              Programs
            </h1>
            <p className="mt-1 text-sm text-muted-foreground leading-relaxed">
              {programs.length === 0
                ? 'Group related projects into programs to coordinate toward a shared outcome.'
                : `${programs.length} program${programs.length !== 1 ? 's' : ''}, coordinating related projects toward shared strategic outcomes.`}
            </p>
          </div>
          <div className="flex items-center gap-2 pb-1">
            <Button onClick={() => setCreating(true)} className="gap-2">
              <PlusIcon className="size-4" />
              New Program
            </Button>
          </div>
        </div>
      </div>

      <div className="flex flex-1 flex-col gap-6 px-6 pt-6 pb-8 md:px-12 lg:px-16">
        <PMBOKGuide context="programs" />

        {/* Inline creation form */}
        <AnimatePresence>
          {creating && (
            <motion.div
              initial={{ opacity: 0, y: -12, scale: 0.97 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: -8, scale: 0.97 }}
              transition={{ type: 'spring', stiffness: 400, damping: 28 }}
            >
              <Card>
                <CardContent className="p-5">
                  <form onSubmit={handleCreate} className="flex flex-col gap-4">
                    <p className="text-sm font-semibold">New Program</p>
                    <input
                      autoFocus
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      placeholder="Program name (e.g. Digital Transformation Initiative)"
                      className="w-full rounded-md border-2 border-border bg-background px-3 py-2 text-sm shadow-[2px_2px_0_0_var(--neo-shadow-color)] focus:outline-none focus:border-primary"
                    />
                    <input
                      value={description}
                      onChange={(e) => setDescription(e.target.value)}
                      placeholder="Description: what shared outcome do these projects deliver? (optional)"
                      className="w-full rounded-md border-2 border-border bg-background px-3 py-2 text-sm shadow-[2px_2px_0_0_var(--neo-shadow-color)] focus:outline-none focus:border-primary"
                    />
                    <textarea
                      value={objectives}
                      onChange={(e) => setObjectives(e.target.value)}
                      placeholder="Program objectives: measurable benefits this program delivers (optional)"
                      rows={2}
                      className="w-full rounded-md border-2 border-border bg-background px-3 py-2 text-sm shadow-[2px_2px_0_0_var(--neo-shadow-color)] focus:outline-none focus:border-primary resize-none"
                    />
                    <div>
                      <label className="block text-xs text-muted-foreground mb-1">
                        Portfolio (optional)
                        {portfolios.length === 0 && (
                          <span className="ml-1 text-amber-500">(create a portfolio first to link one)</span>
                        )}
                      </label>
                      <select
                        value={portfolioId}
                        onChange={(e) => setPortfolioId(e.target.value)}
                        disabled={portfolios.length === 0}
                        className="w-full rounded-md border-2 border-border bg-background px-3 py-2 text-sm shadow-[2px_2px_0_0_var(--neo-shadow-color)] focus:outline-none focus:border-primary disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        <option value="">No portfolio (standalone program)</option>
                        {portfolios.map((p) => (
                          <option key={p.id} value={p.id}>{p.name}</option>
                        ))}
                      </select>
                    </div>
                    <div className="flex gap-2">
                      <Button type="submit" disabled={!name.trim() || saving}>
                        {saving ? 'Creating…' : 'Create Program'}
                      </Button>
                      <Button type="button" variant="outline" onClick={() => setCreating(false)}>Cancel</Button>
                    </div>
                  </form>
                </CardContent>
              </Card>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Program cards */}
        {programs.length === 0 && !creating ? (
          <Reveal direction="up">
            <div className="flex flex-col items-center justify-center gap-3 rounded-lg border-2 border-dashed border-border p-16 text-center">
              <LayersIcon className="size-12 text-muted-foreground/30" />
              <div>
                <p className="font-semibold">No programs yet</p>
                <p className="text-sm text-muted-foreground mt-1">
                  Create a program to group related projects toward a shared strategic outcome.
                </p>
              </div>
              <Button onClick={() => setCreating(true)} className="gap-2 mt-2">
                <PlusIcon className="size-4" /> Create your first program
              </Button>
            </div>
          </Reveal>
        ) : (
          <StaggerContainer className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {programs.map((p) => {
              const c = STATUS_COLORS[p.status] ?? STATUS_COLORS.active;
              return (
                <StaggerItem key={p.id}>
                  <Link href={`/programs/${p.id}`} className="group block focus:outline-none">
                    <motion.div
                      whileHover={{ y: -4 }}
                      whileTap={{ y: 2 }}
                      transition={{ type: 'spring', stiffness: 400, damping: 22 }}
                    >
                      <div className={`relative rounded-lg border-2 ${c.border} ${c.bg} p-5 transition-all ${c.shadow} hover:translate-x-[-2px] hover:translate-y-[-2px]`}>
                        <div className="flex items-start justify-between gap-3">
                          <div className="min-w-0">
                            <h2 className={`font-black text-lg tracking-tight ${c.text} group-hover:underline`}>
                              {p.name}
                            </h2>
                            {p.description && (
                              <p className="mt-0.5 text-xs text-muted-foreground line-clamp-2">{p.description}</p>
                            )}
                            {p.portfolioName && (
                              <div className="mt-1.5 flex items-center gap-1 text-xs text-muted-foreground">
                                <BriefcaseIcon className="size-3" />
                                {p.portfolioName}
                              </div>
                            )}
                          </div>
                          <div className={`shrink-0 rounded-md border-2 ${c.border} ${c.bg} p-2`}>
                            <LayersIcon className={`size-5 ${c.text}`} />
                          </div>
                        </div>
                        <div className="mt-4 flex items-center gap-4 text-xs text-muted-foreground">
                          <span className="flex items-center gap-1">
                            <FolderKanbanIcon className="size-3.5" />
                            {p.projectCount} project{p.projectCount !== 1 ? 's' : ''}
                          </span>
                          {p.projectCount > 0 && (
                            <span className="flex items-center gap-1">
                              <TrendingUpIcon className="size-3.5" />
                              {p.avgProgress}% avg
                            </span>
                          )}
                          <span className={`ml-auto capitalize text-[11px] font-semibold px-1.5 py-0.5 rounded-md border ${c.border} ${c.text}`}>
                            {p.status.replace('_', ' ')}
                          </span>
                        </div>
                        {p.projectCount > 0 && (
                          <div className="mt-3 h-2 rounded-full bg-muted overflow-hidden border border-border">
                            <motion.div
                              className={`h-full rounded-full ${c.bg} border-r-2 ${c.border}`}
                              initial={{ width: 0 }}
                              animate={{ width: `${p.avgProgress}%` }}
                              transition={{ duration: 0.8, delay: 0.2, ease: [0.34, 1.56, 0.64, 1] }}
                            />
                          </div>
                        )}
                      </div>
                    </motion.div>
                  </Link>
                </StaggerItem>
              );
            })}
          </StaggerContainer>
        )}
      </div>
    </div>
  );
}
