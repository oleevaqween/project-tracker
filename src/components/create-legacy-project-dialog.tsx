'use client';

import * as React from 'react';
import { useRouter } from 'next/navigation';
import { ArchiveIcon, BriefcaseIcon } from 'lucide-react';
import { toast } from 'sonner';
import { createLegacyProject } from '@/actions/projects';
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
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';

type PortfolioOption = { id: number; name: string; color: string | null };

const PROJECT_CATEGORIES = [
  'Software / Technology',
  'Marketing / Comms',
  'Construction / Infrastructure',
  'Finance / Banking',
  'Healthcare',
  'Research / Academia',
  'Operations / Process',
  'Design / Creative',
  'Consulting',
  'Other',
];

export function CreateLegacyProjectDialog() {
  const router = useRouter();
  const [open, setOpen] = React.useState(false);
  const [saving, setSaving] = React.useState(false);
  const [portfolios, setPortfolios] = React.useState<PortfolioOption[]>([]);

  const [name, setName] = React.useState('');
  const [description, setDescription] = React.useState('');
  const [category, setCategory] = React.useState('');
  const [portfolioId, setPortfolioId] = React.useState('');
  const [startDate, setStartDate] = React.useState('');
  const [completedDate, setCompletedDate] = React.useState('');
  const [clientOrg, setClientOrg] = React.useState('');
  const [yourRole, setYourRole] = React.useState('');
  const [teamSize, setTeamSize] = React.useState('');
  const [methodology, setMethodology] = React.useState('');
  const [deliverables, setDeliverables] = React.useState('');
  const [outcome, setOutcome] = React.useState('');
  const [skills, setSkills] = React.useState('');
  const [lessons, setLessons] = React.useState('');

  React.useEffect(() => {
    if (!open) return;
    fetch('/api/portfolios')
      .then((r) => r.json())
      .then((data: PortfolioOption[]) => setPortfolios(Array.isArray(data) ? data : []))
      .catch(() => setPortfolios([]));
  }, [open]);

  function reset() {
    setName(''); setDescription(''); setCategory(''); setPortfolioId('');
    setStartDate(''); setCompletedDate(''); setClientOrg(''); setYourRole('');
    setTeamSize(''); setMethodology(''); setDeliverables(''); setOutcome('');
    setSkills(''); setLessons('');
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!name.trim()) return;
    setSaving(true);
    try {
      const project = await createLegacyProject({
        name: name.trim(),
        description: description.trim() || null,
        category: category || null,
        portfolioId: portfolioId ? Number(portfolioId) : null,
        startDate: startDate ? new Date(startDate) : null,
        completedDate: completedDate ? new Date(completedDate) : null,
        legacySummary: {
          clientOrg: clientOrg.trim() || undefined,
          yourRole: yourRole.trim() || undefined,
          teamSize: teamSize.trim() || undefined,
          methodology: methodology.trim() || undefined,
          deliverables: deliverables.trim() || undefined,
          outcome: outcome.trim() || undefined,
          skills: skills.trim() || undefined,
          lessons: lessons.trim() || undefined,
        },
      });
      toast.success(`"${name.trim()}" added to your legacy projects`);
      reset();
      setOpen(false);
      router.push(`/projects/${project.id}`);
    } catch {
      toast.error('Failed to save project');
    } finally {
      setSaving(false);
    }
  }

  return (
    <Dialog open={open} onOpenChange={(v) => { setOpen(v); if (!v) reset(); }}>
      <DialogTrigger render={<Button variant="outline" />}>
        <ArchiveIcon className="mr-2 size-4" />
        Import Legacy Project
      </DialogTrigger>

      <DialogContent className="sm:max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <ArchiveIcon className="size-5 text-muted-foreground" />
            Import Legacy Project
          </DialogTitle>
          <DialogDescription>
            Record a past project you completed before using this app. No PMBOK
            framework required. Just fill in what you remember.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="flex flex-col gap-5">
          {/* Basics */}
          <section className="flex flex-col gap-3">
            <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Basics</p>

            <div className="flex flex-col gap-1.5">
              <Label htmlFor="lp-name">Project Name *</Label>
              <Input
                id="lp-name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="e.g. NHS Digital Transformation"
                required
              />
            </div>

            <div className="flex flex-col gap-1.5">
              <Label htmlFor="lp-desc">Short Description</Label>
              <Textarea
                id="lp-desc"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="One or two sentences about what the project was..."
                className="min-h-[64px] resize-none"
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="flex flex-col gap-1.5">
                <Label htmlFor="lp-category">Category</Label>
                <Select value={category} onValueChange={(val) => setCategory(val ?? '')}>
                  <SelectTrigger id="lp-category" className="w-full">
                    <SelectValue placeholder="Select category" />
                  </SelectTrigger>
                  <SelectContent>
                    {PROJECT_CATEGORIES.map((c) => (
                      <SelectItem key={c} value={c}>{c}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="flex flex-col gap-1.5">
                <Label htmlFor="lp-portfolio" className="flex items-center gap-1.5">
                  <BriefcaseIcon className="size-3.5 text-muted-foreground" />
                  Portfolio
                </Label>
                <Select value={portfolioId} onValueChange={(val) => setPortfolioId(val ?? '')}>
                  <SelectTrigger id="lp-portfolio" className="w-full">
                    <SelectValue placeholder="No portfolio" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="">No portfolio</SelectItem>
                    {portfolios.map((p) => (
                      <SelectItem key={p.id} value={String(p.id)}>{p.name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="flex flex-col gap-1.5">
                <Label htmlFor="lp-start">Start Date</Label>
                <Input id="lp-start" type="date" value={startDate} onChange={(e) => setStartDate(e.target.value)} />
              </div>
              <div className="flex flex-col gap-1.5">
                <Label htmlFor="lp-end">Completion Date</Label>
                <Input id="lp-end" type="date" value={completedDate} onChange={(e) => setCompletedDate(e.target.value)} />
              </div>
            </div>
          </section>

          {/* Context */}
          <section className="flex flex-col gap-3">
            <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Context</p>

            <div className="grid grid-cols-2 gap-3">
              <div className="flex flex-col gap-1.5">
                <Label htmlFor="lp-client">Client / Organisation</Label>
                <Input id="lp-client" value={clientOrg} onChange={(e) => setClientOrg(e.target.value)} placeholder="e.g. Accenture, NHS, Personal" />
              </div>
              <div className="flex flex-col gap-1.5">
                <Label htmlFor="lp-role">Your Role</Label>
                <Input id="lp-role" value={yourRole} onChange={(e) => setYourRole(e.target.value)} placeholder="e.g. Project Manager, Tech Lead" />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="flex flex-col gap-1.5">
                <Label htmlFor="lp-team">Team Size</Label>
                <Input id="lp-team" value={teamSize} onChange={(e) => setTeamSize(e.target.value)} placeholder="e.g. 5 people" />
              </div>
              <div className="flex flex-col gap-1.5">
                <Label htmlFor="lp-method">Methodology</Label>
                <Input id="lp-method" value={methodology} onChange={(e) => setMethodology(e.target.value)} placeholder="e.g. Agile, Waterfall, Prince2" />
              </div>
            </div>
          </section>

          {/* Substance */}
          <section className="flex flex-col gap-3">
            <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Substance</p>

            <div className="flex flex-col gap-1.5">
              <Label htmlFor="lp-deliverables">Key Deliverables</Label>
              <Textarea id="lp-deliverables" value={deliverables} onChange={(e) => setDeliverables(e.target.value)} placeholder="What was produced or delivered..." className="min-h-[72px] resize-none" />
            </div>

            <div className="flex flex-col gap-1.5">
              <Label htmlFor="lp-outcome">Outcome / Result</Label>
              <Textarea id="lp-outcome" value={outcome} onChange={(e) => setOutcome(e.target.value)} placeholder="Was it successful? What was the impact?" className="min-h-[72px] resize-none" />
            </div>

            <div className="flex flex-col gap-1.5">
              <Label htmlFor="lp-skills">Technologies / Skills Used</Label>
              <Textarea id="lp-skills" value={skills} onChange={(e) => setSkills(e.target.value)} placeholder="e.g. React, SQL, Stakeholder Management, Risk Analysis" className="min-h-[64px] resize-none" />
            </div>

            <div className="flex flex-col gap-1.5">
              <Label htmlFor="lp-lessons">Key Lessons Learned</Label>
              <Textarea id="lp-lessons" value={lessons} onChange={(e) => setLessons(e.target.value)} placeholder="What would you do differently or repeat next time?" className="min-h-[72px] resize-none" />
            </div>
          </section>

          <DialogFooter showCloseButton>
            <Button type="submit" disabled={!name.trim() || saving}>
              {saving ? 'Saving…' : 'Save Legacy Project'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
