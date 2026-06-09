'use client';

import * as React from 'react';
import { toast } from 'sonner';
import { useRouter } from 'next/navigation';
import {
  BuildingIcon,
  UserIcon,
  TrophyIcon,
  PackageIcon,
  WrenchIcon,
  UsersIcon,
  LayersIcon,
  BookOpenIcon,
  PencilIcon,
  SaveIcon,
  XIcon,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { updateLegacySummary } from '@/actions/projects';

type LegacySummary = {
  clientOrg?: string;
  yourRole?: string;
  outcome?: string;
  deliverables?: string;
  skills?: string;
  teamSize?: string;
  methodology?: string;
  lessons?: string;
};

interface LegacySummaryTabProps {
  projectId: number;
  summary: LegacySummary | null;
}

const FIELDS: {
  key: keyof LegacySummary;
  label: string;
  icon: React.ElementType;
  placeholder: string;
  multiline?: boolean;
}[] = [
  { key: 'clientOrg',   label: 'Client / Organisation', icon: BuildingIcon, placeholder: 'e.g. Accenture, NHS, Personal', multiline: false },
  { key: 'yourRole',    label: 'Your Role',              icon: UserIcon,     placeholder: 'e.g. Project Manager, Tech Lead', multiline: false },
  { key: 'teamSize',    label: 'Team Size',              icon: UsersIcon,    placeholder: 'e.g. 5 people', multiline: false },
  { key: 'methodology', label: 'Methodology Used',       icon: LayersIcon,   placeholder: 'e.g. Agile, Waterfall, Prince2', multiline: false },
  { key: 'deliverables', label: 'Key Deliverables',      icon: PackageIcon,  placeholder: 'What was produced or delivered...', multiline: true },
  { key: 'outcome',     label: 'Outcome / Result',       icon: TrophyIcon,   placeholder: 'Was it successful? What was the impact?', multiline: true },
  { key: 'skills',      label: 'Technologies / Skills',  icon: WrenchIcon,   placeholder: 'e.g. React, SQL, Stakeholder Management', multiline: true },
  { key: 'lessons',     label: 'Key Lessons Learned',    icon: BookOpenIcon, placeholder: 'What would you do differently or repeat?', multiline: true },
];

export function LegacySummaryTab({ projectId, summary }: LegacySummaryTabProps) {
  const router = useRouter();
  const [editing, setEditing] = React.useState(false);
  const [saving, setSaving] = React.useState(false);
  const [form, setForm] = React.useState<LegacySummary>(summary ?? {});

  function handleChange(key: keyof LegacySummary, value: string) {
    setForm((prev) => ({ ...prev, [key]: value }));
  }

  async function handleSave() {
    setSaving(true);
    try {
      await updateLegacySummary(projectId, form);
      toast.success('Summary saved');
      setEditing(false);
      router.refresh();
    } catch {
      toast.error('Failed to save summary');
    } finally {
      setSaving(false);
    }
  }

  function handleCancel() {
    setForm(summary ?? {});
    setEditing(false);
  }

  const isEmpty = FIELDS.every((f) => !form[f.key]);

  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm text-muted-foreground">
            A snapshot of this project — captured outside the PMBOK framework.
          </p>
        </div>
        {!editing ? (
          <Button variant="outline" size="sm" className="gap-2" onClick={() => setEditing(true)}>
            <PencilIcon className="size-3.5" />
            {isEmpty ? 'Add Summary' : 'Edit'}
          </Button>
        ) : (
          <div className="flex gap-2">
            <Button variant="ghost" size="sm" className="gap-2" onClick={handleCancel} disabled={saving}>
              <XIcon className="size-3.5" />
              Cancel
            </Button>
            <Button size="sm" className="gap-2" onClick={handleSave} disabled={saving}>
              <SaveIcon className="size-3.5" />
              {saving ? 'Saving…' : 'Save'}
            </Button>
          </div>
        )}
      </div>

      {isEmpty && !editing ? (
        <div className="flex flex-col items-center justify-center gap-3 rounded-xl border-2 border-dashed p-12 text-center">
          <BookOpenIcon className="size-10 text-muted-foreground/30" />
          <div>
            <p className="font-medium">No summary yet</p>
            <p className="text-sm text-muted-foreground mt-1">
              Click "Add Summary" to document this legacy project.
            </p>
          </div>
        </div>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2">
          {FIELDS.map(({ key, label, icon: Icon, placeholder, multiline }) => {
            const value = form[key] ?? '';
            return (
              <Card
                key={key}
                className={multiline ? 'sm:col-span-2' : ''}
              >
                <CardHeader className="pb-2 pt-4 px-4">
                  <CardTitle className="flex items-center gap-2 text-sm font-semibold">
                    <Icon className="size-4 text-muted-foreground" />
                    {label}
                  </CardTitle>
                </CardHeader>
                <CardContent className="px-4 pb-4">
                  {editing ? (
                    multiline ? (
                      <Textarea
                        value={value}
                        onChange={(e) => handleChange(key, e.target.value)}
                        placeholder={placeholder}
                        className="min-h-[80px] resize-none text-sm"
                      />
                    ) : (
                      <Input
                        value={value}
                        onChange={(e) => handleChange(key, e.target.value)}
                        placeholder={placeholder}
                        className="text-sm"
                      />
                    )
                  ) : (
                    <p className={`text-sm ${value ? 'text-foreground' : 'text-muted-foreground/50 italic'}`}>
                      {value || placeholder}
                    </p>
                  )}
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}
