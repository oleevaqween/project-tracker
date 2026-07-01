'use client';

import Link from 'next/link';
import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';
import { BriefcaseIcon, PlusIcon, FolderKanbanIcon, TrendingUpIcon } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { StaggerContainer, StaggerItem, Reveal } from '@/components/motion';
import { PMBOKGuide } from '@/components/pmbok';

type Portfolio = {
  id: number;
  userId: string;
  name: string;
  description: string | null;
  color: string | null;
  createdAt: Date;
  updatedAt: Date;
  projectCount: number;
  avgProgress: number;
};

interface PortfoliosClientProps {
  portfolios: Portfolio[];
  unassignedCount: number;
}

const COLOR_MAP: Record<string, { bg: string; border: string; text: string; shadow: string }> = {
  amber:   { bg: 'bg-amber-500/10',   border: 'border-amber-500',   text: 'text-amber-700 dark:text-amber-400',   shadow: 'shadow-[4px_4px_0_0_theme(colors.amber.500)]' },
  violet:  { bg: 'bg-violet-500/10',  border: 'border-violet-500',  text: 'text-violet-700 dark:text-violet-400',  shadow: 'shadow-[4px_4px_0_0_theme(colors.violet.500)]' },
  emerald: { bg: 'bg-emerald-500/10', border: 'border-emerald-500', text: 'text-emerald-700 dark:text-emerald-400', shadow: 'shadow-[4px_4px_0_0_theme(colors.emerald.500)]' },
  sky:     { bg: 'bg-sky-500/10',     border: 'border-sky-500',     text: 'text-sky-700 dark:text-sky-400',     shadow: 'shadow-[4px_4px_0_0_theme(colors.sky.500)]' },
  rose:    { bg: 'bg-rose-500/10',    border: 'border-rose-500',    text: 'text-rose-700 dark:text-rose-400',    shadow: 'shadow-[4px_4px_0_0_theme(colors.rose.500)]' },
  slate:   { bg: 'bg-slate-500/10',   border: 'border-slate-500',   text: 'text-slate-700 dark:text-slate-400',   shadow: 'shadow-[4px_4px_0_0_theme(colors.slate.500)]' },
};

const COLORS = Object.keys(COLOR_MAP);

type ProjectOption = { id: number; name: string; status: string; portfolioId: number | null };

export function PortfoliosClient({ portfolios, unassignedCount }: PortfoliosClientProps) {
  const router = useRouter();
  const [creating, setCreating] = useState(false);
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [color, setColor] = useState('amber');
  const [saving, setSaving] = useState(false);
  const [availableProjects, setAvailableProjects] = useState<ProjectOption[]>([]);
  const [selectedProjectIds, setSelectedProjectIds] = useState<Set<number>>(new Set());

  function openCreating() {
    setCreating(true);
    fetch('/api/projects')
      .then((r) => r.json())
      .then((data: ProjectOption[]) => setAvailableProjects(Array.isArray(data) ? data : []))
      .catch(() => setAvailableProjects([]));
  }

  function toggleProject(id: number) {
    setSelectedProjectIds((prev) => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });
  }

  async function handleCreate(e: React.FormEvent) {
    e.preventDefault();
    if (!name.trim()) return;
    setSaving(true);
    try {
      const res = await fetch('/api/portfolios', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: name.trim(),
          description: description.trim() || null,
          color,
          projectIds: Array.from(selectedProjectIds),
        }),
      });
      if (!res.ok) throw new Error('Failed to create portfolio');
      setName(''); setDescription(''); setColor('amber');
      setSelectedProjectIds(new Set()); setCreating(false);
      toast.success(`Portfolio "${name.trim()}" created`);
      router.refresh();
    } catch {
      toast.error('Failed to create portfolio');
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
              Portfolios
            </h1>
            <p className="mt-1 text-sm text-muted-foreground leading-relaxed">
              {portfolios.length === 0
                ? 'Create a portfolio to group projects by client or company.'
                : `${portfolios.length} portfolio${portfolios.length !== 1 ? 's' : ''}. Group projects by client or organisation.`}
            </p>
          </div>
          <div className="flex items-center gap-2 pb-1">
            <Button onClick={openCreating} className="gap-2">
              <PlusIcon className="size-4" />
              New Portfolio
            </Button>
          </div>
        </div>
      </div>

      <div className="flex flex-1 flex-col gap-6 px-6 pt-6 pb-8 md:px-12 lg:px-16">
        <PMBOKGuide context="portfolios" />
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
                  <p className="text-sm font-semibold">New Portfolio</p>
                  <input
                    autoFocus
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="Portfolio name (e.g. PwC, Accenture, Personal)"
                    className="w-full rounded-md border-2 border-border bg-background px-3 py-2 text-sm shadow-[2px_2px_0_0_var(--neo-shadow-color)] focus:outline-none focus:border-primary"
                  />
                  <input
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    placeholder="Description (optional)"
                    className="w-full rounded-md border-2 border-border bg-background px-3 py-2 text-sm shadow-[2px_2px_0_0_var(--neo-shadow-color)] focus:outline-none focus:border-primary"
                  />
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-medium text-muted-foreground">Color:</span>
                    {COLORS.map((c) => (
                      <button
                        key={c}
                        type="button"
                        onClick={() => setColor(c)}
                        className={`size-6 rounded-md border-2 transition-transform ${COLOR_MAP[c].bg} ${color === c ? `${COLOR_MAP[c].border} scale-110` : 'border-transparent'}`}
                        title={c}
                      />
                    ))}
                  </div>
                  {availableProjects.length > 0 && (
                    <div>
                      <p className="text-xs font-medium text-muted-foreground mb-2">Link projects (optional)</p>
                      <div className="max-h-40 overflow-y-auto flex flex-col gap-1 rounded-md border border-border p-2 bg-background/50">
                        {availableProjects.map((p) => (
                          <label key={p.id} className="flex items-center gap-2 cursor-pointer rounded px-2 py-1 hover:bg-muted/50 transition-colors">
                            <input
                              type="checkbox"
                              checked={selectedProjectIds.has(p.id)}
                              onChange={() => toggleProject(p.id)}
                              className="rounded"
                            />
                            <span className="text-sm flex-1 truncate">{p.name}</span>
                            {p.portfolioId && (
                              <span className="text-[10px] text-muted-foreground shrink-0">in portfolio</span>
                            )}
                          </label>
                        ))}
                      </div>
                    </div>
                  )}
                  <div className="flex gap-2">
                    <Button type="submit" disabled={!name.trim() || saving}>
                      {saving ? 'Creating…' : 'Create Portfolio'}
                    </Button>
                    <Button type="button" variant="outline" onClick={() => setCreating(false)}>Cancel</Button>
                  </div>
                </form>
              </CardContent>
            </Card>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Portfolio cards */}
      {portfolios.length === 0 && !creating ? (
        <Reveal direction="up">
          <div className="flex flex-col items-center justify-center gap-3 rounded-lg border-2 border-dashed border-border p-16 text-center">
            <BriefcaseIcon className="size-12 text-muted-foreground/30" />
            <div>
              <p className="font-semibold">No portfolios yet</p>
              <p className="text-sm text-muted-foreground mt-1">
                Create a portfolio to group projects by client or company.
              </p>
            </div>
            <Button onClick={openCreating} className="gap-2 mt-2">
              <PlusIcon className="size-4" /> Create your first portfolio
            </Button>
          </div>
        </Reveal>
      ) : (
        <StaggerContainer className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {portfolios.map((p) => {
            const c = COLOR_MAP[p.color ?? 'amber'] ?? COLOR_MAP.amber;
            return (
              <StaggerItem key={p.id}>
                <Link href={`/portfolios/${p.id}`} className="group block focus:outline-none">
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
                        </div>
                        <div className={`shrink-0 rounded-md border-2 ${c.border} ${c.bg} p-2`}>
                          <BriefcaseIcon className={`size-5 ${c.text}`} />
                        </div>
                      </div>
                      <div className="mt-4 flex items-center gap-4 text-xs text-muted-foreground">
                        <span className="flex items-center gap-1">
                          <FolderKanbanIcon className="size-3.5" />
                          {p.projectCount} project{p.projectCount !== 1 ? 's' : ''}
                        </span>
                        <span className="flex items-center gap-1">
                          <TrendingUpIcon className="size-3.5" />
                          {p.avgProgress}% avg progress
                        </span>
                      </div>
                      {p.projectCount > 0 && (
                        <div className="mt-3 h-2 rounded-full bg-muted overflow-hidden border border-border">
                          <motion.div
                            className={`h-full rounded-full ${c.bg} border-r-2 ${c.border}`}
                            style={{ background: undefined }}
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

      {/* Unassigned projects notice */}
      {unassignedCount > 0 && (
        <Reveal direction="up">
          <div className="rounded-lg border-2 border-dashed border-border p-4 text-sm text-muted-foreground">
            <span className="font-semibold text-foreground">{unassignedCount}</span> project{unassignedCount !== 1 ? 's are' : ' is'} not assigned to any portfolio. Open a project and assign it from the project settings.
          </div>
        </Reveal>
      )}
      </div>
    </div>
  );
}
