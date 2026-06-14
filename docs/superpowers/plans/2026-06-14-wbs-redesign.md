# WBS Redesign Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add a proper PMBOK 8-aligned WBS system — deliverables-first, separate from activities — with a per-project mode toggle, inline tree editor, WBS Dictionary, completeness indicator, and upgrade nudge at PMBOK milestone moments.

**Architecture:** Each project carries a `use_wbs` boolean (default true). "Use WBS" projects get a new WBS tab backed by a `wbs_elements` table (deliverables hierarchy). "Use Tasks" projects keep the existing task system and gain a completeness indicator nudging them toward WBS. The two systems connect via `tasks.wbs_element_id` (nullable FK). WBS codes are computed from tree position and stored on creation.

**Tech Stack:** Next.js 16 App Router, Drizzle ORM + Supabase PostgreSQL, Tailwind v4, Framer Motion 12, TypeScript, React Hook Form + Zod, Lucide icons, Sonner toasts.

---

## File Map

### New files
| File | Responsibility |
|---|---|
| `src/actions/wbs.ts` | Server actions: CRUD for wbs_elements, wbs code computation |
| `src/lib/wbs-utils.ts` | Pure functions: buildTree, assignWbsCodes, computeCompleteness |
| `src/components/wbs/wbs-keyboard-strip.tsx` | Keycap chip strip shown above tree editor |
| `src/components/wbs/wbs-node.tsx` | Single tree node: name, expand/collapse, dictionary trigger |
| `src/components/wbs/wbs-dictionary.tsx` | Progressive dictionary form: Tier 2 inline, Tier 3 collapsed |
| `src/components/wbs/wbs-tree-editor.tsx` | Full tree editor: manages flat row list + keyboard nav + auto-save |
| `src/components/wbs/wbs-tab.tsx` | Assembles editor + empty state + header for the WBS tab |
| `src/components/wbs/wbs-completeness-banner.tsx` | Slim banner for Use Tasks projects inside project detail |
| `src/components/project-mode-selector.tsx` | Two-card radio selector: Use WBS vs Use Tasks |

### Modified files
| File | What changes |
|---|---|
| `src/db/schema.ts` | Add `wbs_elements` table; add `use_wbs` to projects; add `wbs_element_id` to tasks |
| `src/actions/projects.ts` | Pass `useWbs` in createProject |
| `src/components/create-project-dialog.tsx` | Add ProjectModeSelector before submit |
| `src/components/project-detail-client.tsx` | Add WBS tab; inject nudge into advance-focus-area flow |
| `src/components/project-card-variants.tsx` | Add WBS completeness dot on cards for Use Tasks projects |
| `src/app/(dashboard)/projects/page.tsx` | Fetch wbs_elements count per project for card dot |

---

## Task 1: Schema — wbs_elements table + projects.use_wbs + tasks.wbs_element_id

**Files:**
- Modify: `src/db/schema.ts`

- [ ] **Step 1: Add `use_wbs` column to projects table**

In `src/db/schema.ts`, inside the `projects` pgTable definition, add after `isLegacy`:

```typescript
useWbs: boolean('use_wbs').notNull().default(true),
wbsNudgeDismissed: boolean('wbs_nudge_dismissed').notNull().default(false),
```

- [ ] **Step 2: Add `wbs_element_id` FK to tasks table**

In the `tasks` pgTable definition, add after `orderIndex`:

```typescript
wbsElementId: integer('wbs_element_id'),
```

And in the tasks table's constraint array (the second argument), add:
```typescript
foreignKey({ columns: [table.wbsElementId], foreignColumns: [] })
```
— leave this until after the wbs_elements table is defined. Do Step 3 first, then come back and add:
```typescript
foreignKey({ columns: [table.wbsElementId], foreignColumns: [wbsElements.id] }).onDelete('set null'),
```

- [ ] **Step 3: Add `wbs_elements` table**

Insert this block BEFORE the tasks table definition (so tasks can reference it):

```typescript
// ============ WBS ELEMENTS ============
export const wbsElements = pgTable('wbs_elements', {
  id: serial('id').primaryKey(),
  projectId: integer('project_id').notNull().references(() => projects.id, { onDelete: 'cascade' }),
  userId: varchar('user_id', { length: 36 }).notNull(),
  parentId: integer('parent_id'),
  wbsCode: varchar('wbs_code', { length: 30 }).notNull().default(''),
  name: varchar('name', { length: 255 }).notNull(),
  // Tier 2 dictionary fields — proper columns for querying
  description: text('description'),
  acceptanceCriteria: text('acceptance_criteria'),
  responsibleParty: varchar('responsible_party', { length: 255 }),
  estimatedCost: numeric('estimated_cost', { precision: 12, scale: 2 }),
  // Tier 3 dictionary fields — JSONB, optional depth
  dictionaryDetails: jsonb('dictionary_details').$type<{
    milestones?: string;
    resourcesRequired?: string;
    qualityRequirements?: string;
    assumptionsConstraints?: string;
  }>(),
  orderIndex: integer('order_index').notNull().default(0),
  createdAt: timestamp('created_at').notNull().defaultNow(),
  updatedAt: timestamp('updated_at').notNull().$onUpdate(() => new Date()),
}, (table) => [
  foreignKey({ columns: [table.parentId], foreignColumns: [table.id] }).onDelete('set null'),
  index('wbs_elements_project_idx').on(table.projectId),
]);
```

- [ ] **Step 4: Now add the FK on tasks.wbsElementId**

In the tasks table constraints array, add:
```typescript
foreignKey({ columns: [table.wbsElementId], foreignColumns: [wbsElements.id] }).onDelete('set null'),
```

- [ ] **Step 5: Add relations**

At the bottom of `src/db/schema.ts`, add:

```typescript
export const wbsElementsRelations = relations(wbsElements, ({ one, many }) => ({
  project: one(projects, { fields: [wbsElements.projectId], references: [projects.id] }),
  user: one(profiles, { fields: [wbsElements.userId], references: [profiles.id] }),
  parent: one(wbsElements, { fields: [wbsElements.parentId], references: [wbsElements.id], relationName: 'children' }),
  children: many(wbsElements, { relationName: 'children' }),
  tasks: many(tasks),
}));
```

Also update `tasksRelations` to include:
```typescript
wbsElement: one(wbsElements, { fields: [tasks.wbsElementId], references: [wbsElements.id] }),
```

And update `projectsRelations` to include:
```typescript
wbsElements: many(wbsElements),
```

- [ ] **Step 6: Type-check**

```bash
cd Project_tracker && npx tsc --noEmit 2>&1 | head -30
```

Expected: zero errors. Fix any import or type issues before continuing.

- [ ] **Step 7: Generate migration**

```powershell
$env:DATABASE_URL="<paste from .env.local>"; npx drizzle-kit generate
```

Expected output: new migration file in `drizzle/` referencing `wbs_elements`, `use_wbs`, `wbs_nudge_dismissed`, `wbs_element_id`.

- [ ] **Step 8: Run migration**

```powershell
node -e "
require('dotenv').config({ path: '.env.local' });
const { Client } = require('pg');
const fs = require('fs');
const client = new Client({ connectionString: process.env.DATABASE_URL });
client.connect().then(() => {
  const sql = fs.readFileSync('./drizzle/<migration-filename>.sql', 'utf8');
  const statements = sql.split('--> statement-breakpoint');
  return statements.reduce((p, s) => p.then(() => client.query(s.trim())), Promise.resolve());
}).then(() => { console.log('Migration complete'); client.end(); })
.catch(err => { console.error(err.message); client.end(); });
"
```

Expected: `Migration complete`

---

## Task 2: WBS utility functions

**Files:**
- Create: `src/lib/wbs-utils.ts`

- [ ] **Step 1: Create the file with all pure utility functions**

```typescript
export type WbsElement = {
  id: number;
  projectId: number;
  userId: string;
  parentId: number | null;
  wbsCode: string;
  name: string;
  description: string | null;
  acceptanceCriteria: string | null;
  responsibleParty: string | null;
  estimatedCost: string | null;
  dictionaryDetails: {
    milestones?: string;
    resourcesRequired?: string;
    qualityRequirements?: string;
    assumptionsConstraints?: string;
  } | null;
  orderIndex: number;
  createdAt: Date;
  updatedAt: Date;
};

export type WbsNode = WbsElement & { children: WbsNode[] };

// Build nested tree from flat array. Sorts siblings by orderIndex.
export function buildWbsTree(elements: WbsElement[]): WbsNode[] {
  const map = new Map<number, WbsNode>();
  elements.forEach((e) => map.set(e.id, { ...e, children: [] }));

  const roots: WbsNode[] = [];
  [...elements]
    .sort((a, b) => a.orderIndex - b.orderIndex)
    .forEach((e) => {
      if (e.parentId != null && map.has(e.parentId)) {
        map.get(e.parentId)!.children.push(map.get(e.id)!);
      } else {
        roots.push(map.get(e.id)!);
      }
    });
  return roots;
}

// Assign WBS codes by position in tree. Mutates nodes in place.
export function assignWbsCodes(nodes: WbsNode[], prefix = ''): void {
  nodes
    .sort((a, b) => a.orderIndex - b.orderIndex)
    .forEach((node, i) => {
      node.wbsCode = prefix ? `${prefix}.${i + 1}` : String(i + 1);
      if (node.children.length > 0) assignWbsCodes(node.children, node.wbsCode);
    });
}

// A node is a work package if it has no children.
export function isWorkPackage(node: WbsNode): boolean {
  return node.children.length === 0;
}

// Find parentId for a node at `level` given the flat editing rows above it.
export type EditRow = {
  key: string;       // unique key (temp or db id)
  dbId: number | null;
  name: string;
  level: number;     // 0 = root
};

export function resolveParentId(rows: EditRow[], currentIndex: number): number | null {
  const level = rows[currentIndex].level;
  if (level === 0) return null;
  // Search backwards for the nearest row with level - 1
  for (let i = currentIndex - 1; i >= 0; i--) {
    if (rows[i].level === level - 1 && rows[i].dbId != null) {
      return rows[i].dbId;
    }
  }
  return null;
}

// Compute sibling orderIndex for a new/moved node.
export function resolveOrderIndex(
  rows: EditRow[],
  currentIndex: number,
  parentId: number | null,
  existingElements: WbsElement[],
): number {
  // Count siblings (same parentId) that appear before this row in the list
  const siblings = existingElements.filter((e) => e.parentId === parentId);
  return siblings.length; // appended after all existing siblings
}

// Completeness for "Use Tasks" projects
export function computeWbsCompleteness(tasks: { wbsElementId: number | null }[]): {
  total: number;
  unassigned: number;
  percent: number;
} {
  const total = tasks.length;
  const unassigned = tasks.filter((t) => t.wbsElementId == null).length;
  const percent = total === 0 ? 0 : Math.round(((total - unassigned) / total) * 100);
  return { total, unassigned, percent };
}

// Dictionary completeness (for report tier detection)
export function dictionaryTier(node: WbsNode): 1 | 2 | 3 {
  const hasTier2 =
    node.description || node.acceptanceCriteria || node.responsibleParty || node.estimatedCost;
  if (!hasTier2) return 1;
  const d = node.dictionaryDetails;
  const hasTier3 = d && (d.milestones || d.resourcesRequired || d.qualityRequirements || d.assumptionsConstraints);
  return hasTier3 ? 3 : 2;
}
```

- [ ] **Step 2: Type-check**

```bash
npx tsc --noEmit 2>&1 | head -20
```

Expected: zero errors.

---

## Task 3: WBS server actions

**Files:**
- Create: `src/actions/wbs.ts`

- [ ] **Step 1: Create the file**

```typescript
'use server';

import { eq, and } from 'drizzle-orm';
import { db } from '@/db';
import { wbsElements, projects } from '@/db/schema';
import { createClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';
import { revalidatePath } from 'next/cache';
import { buildWbsTree, assignWbsCodes } from '@/lib/wbs-utils';

async function getAuthUser() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect('/login');
  return user;
}

export async function getWbsElements(projectId: number) {
  const user = await getAuthUser();
  return db
    .select()
    .from(wbsElements)
    .where(and(eq(wbsElements.projectId, projectId), eq(wbsElements.userId, user.id)))
    .orderBy(wbsElements.orderIndex);
}

export async function createWbsElement(data: {
  projectId: number;
  parentId: number | null;
  name: string;
  orderIndex: number;
}): Promise<{ id: number; wbsCode: string }> {
  const user = await getAuthUser();

  // Insert with placeholder code first
  const [element] = await db
    .insert(wbsElements)
    .values({
      projectId: data.projectId,
      userId: user.id,
      parentId: data.parentId,
      name: data.name.trim(),
      wbsCode: '',
      orderIndex: data.orderIndex,
    })
    .returning();

  // Recompute all codes for the project and persist
  await recomputeAndSaveWbsCodes(data.projectId, user.id);

  // Return the now-assigned code
  const [updated] = await db
    .select({ id: wbsElements.id, wbsCode: wbsElements.wbsCode })
    .from(wbsElements)
    .where(eq(wbsElements.id, element.id));

  revalidatePath(`/projects/${data.projectId}`);
  return { id: element.id, wbsCode: updated.wbsCode };
}

export async function updateWbsElement(
  id: number,
  data: Partial<{
    name: string;
    parentId: number | null;
    orderIndex: number;
    description: string;
    acceptanceCriteria: string;
    responsibleParty: string;
    estimatedCost: string;
    dictionaryDetails: {
      milestones?: string;
      resourcesRequired?: string;
      qualityRequirements?: string;
      assumptionsConstraints?: string;
    };
  }>,
) {
  const user = await getAuthUser();

  const [element] = await db
    .select({ projectId: wbsElements.projectId })
    .from(wbsElements)
    .where(and(eq(wbsElements.id, id), eq(wbsElements.userId, user.id)));

  if (!element) return;

  await db.update(wbsElements).set({ ...data, updatedAt: new Date() }).where(eq(wbsElements.id, id));

  if (data.parentId !== undefined || data.orderIndex !== undefined) {
    await recomputeAndSaveWbsCodes(element.projectId, user.id);
  }

  revalidatePath(`/projects/${element.projectId}`);
}

export async function deleteWbsElement(id: number) {
  const user = await getAuthUser();

  const [element] = await db
    .select({ projectId: wbsElements.projectId })
    .from(wbsElements)
    .where(and(eq(wbsElements.id, id), eq(wbsElements.userId, user.id)));

  if (!element) return;

  // Deleting a parent cascades to children via DB FK onDelete cascade
  // BUT our FK is onDelete: 'set null' (parent_id → self). So we need
  // to re-parent children to the deleted node's parent before deleting.
  const children = await db
    .select({ id: wbsElements.id })
    .from(wbsElements)
    .where(eq(wbsElements.parentId, id));

  const [toDelete] = await db
    .select({ parentId: wbsElements.parentId })
    .from(wbsElements)
    .where(eq(wbsElements.id, id));

  // Re-parent children to grandparent (or root if no grandparent)
  for (const child of children) {
    await db.update(wbsElements)
      .set({ parentId: toDelete?.parentId ?? null })
      .where(eq(wbsElements.id, child.id));
  }

  await db.delete(wbsElements).where(eq(wbsElements.id, id));
  await recomputeAndSaveWbsCodes(element.projectId, user.id);
  revalidatePath(`/projects/${element.projectId}`);
}

export async function setProjectWbsMode(projectId: number, useWbs: boolean) {
  const user = await getAuthUser();
  await db
    .update(projects)
    .set({ useWbs, updatedAt: new Date() })
    .where(and(eq(projects.id, projectId), eq(projects.userId, user.id)));
  revalidatePath(`/projects/${projectId}`);
}

export async function dismissWbsNudge(projectId: number) {
  const user = await getAuthUser();
  await db
    .update(projects)
    .set({ wbsNudgeDismissed: true, updatedAt: new Date() })
    .where(and(eq(projects.id, projectId), eq(projects.userId, user.id)));
}

// ── Private helper ────────────────────────────────────────────────────────────
// Fetches all elements for a project, builds the tree, assigns codes, persists.
async function recomputeAndSaveWbsCodes(projectId: number, userId: string) {
  const all = await db
    .select()
    .from(wbsElements)
    .where(and(eq(wbsElements.projectId, projectId), eq(wbsElements.userId, userId)))
    .orderBy(wbsElements.orderIndex);

  const tree = buildWbsTree(all);
  assignWbsCodes(tree);

  // Flatten the tree and batch-update codes
  const updates = flattenTree(tree);
  await Promise.all(
    updates.map(({ id, wbsCode }) =>
      db.update(wbsElements).set({ wbsCode }).where(eq(wbsElements.id, id))
    )
  );
}

function flattenTree(nodes: import('@/lib/wbs-utils').WbsNode[]): { id: number; wbsCode: string }[] {
  const result: { id: number; wbsCode: string }[] = [];
  function walk(ns: import('@/lib/wbs-utils').WbsNode[]) {
    ns.forEach((n) => { result.push({ id: n.id, wbsCode: n.wbsCode }); walk(n.children); });
  }
  walk(nodes);
  return result;
}
```

- [ ] **Step 2: Type-check**

```bash
npx tsc --noEmit 2>&1 | head -30
```

Expected: zero errors.

---

## Task 4: ProjectModeSelector component

**Files:**
- Create: `src/components/project-mode-selector.tsx`

- [ ] **Step 1: Create the two-card radio selector**

```typescript
'use client';

import { cn } from '@/lib/utils';
import { NetworkIcon, ListIcon, BadgeCheckIcon } from 'lucide-react';

interface ProjectModeSelectorProps {
  value: boolean; // true = Use WBS
  onChange: (useWbs: boolean) => void;
}

export function ProjectModeSelector({ value, onChange }: ProjectModeSelectorProps) {
  return (
    <div className="flex flex-col gap-2">
      <p className="text-sm font-medium">Project Mode</p>
      <div className="grid grid-cols-2 gap-3">
        {/* Use WBS card */}
        <button
          type="button"
          onClick={() => onChange(true)}
          className={cn(
            'relative flex flex-col gap-2 rounded-xl border-2 p-4 text-left transition-all duration-150',
            value
              ? 'border-primary bg-primary/5'
              : 'border-border bg-card hover:border-border/80 hover:bg-muted/30',
          )}
        >
          {value && (
            <span className="absolute top-2 right-2">
              <BadgeCheckIcon className="size-4 text-primary" />
            </span>
          )}
          <NetworkIcon className={cn('size-5', value ? 'text-primary' : 'text-muted-foreground')} />
          <div>
            <p className={cn('text-sm font-bold', value ? 'text-foreground' : 'text-muted-foreground')}>
              Use WBS
            </p>
            <p className="text-[11px] text-muted-foreground leading-relaxed mt-0.5">
              Deliverable-first. Build scope structure before execution.
            </p>
          </div>
          <span className="inline-flex self-start items-center gap-1 rounded-sm bg-primary/10 px-1.5 py-0.5 text-[9px] font-bold uppercase tracking-[0.1em] text-primary">
            PMBOK 8 Recommended
          </span>
          <p className="text-[10px] text-muted-foreground/60">
            Best for: formal PMs, client projects, governance reporting
          </p>
        </button>

        {/* Use Tasks card */}
        <button
          type="button"
          onClick={() => onChange(false)}
          className={cn(
            'flex flex-col gap-2 rounded-xl border-2 p-4 text-left transition-all duration-150',
            !value
              ? 'border-primary bg-primary/5'
              : 'border-border bg-card hover:border-border/80 hover:bg-muted/30',
          )}
        >
          <ListIcon className={cn('size-5', !value ? 'text-primary' : 'text-muted-foreground')} />
          <div>
            <p className={cn('text-sm font-bold', !value ? 'text-foreground' : 'text-muted-foreground')}>
              Use Tasks
            </p>
            <p className="text-[11px] text-muted-foreground leading-relaxed mt-0.5">
              Activity-first. Jump straight into tasks. WBS optional later.
            </p>
          </div>
          <p className="text-[10px] text-muted-foreground/60 mt-auto">
            Best for: quick starts, learning PMBOK, personal projects
          </p>
        </button>
      </div>
      <p className="text-[11px] text-muted-foreground/60 text-center">
        You can switch modes anytime from project settings.
      </p>
    </div>
  );
}
```

- [ ] **Step 2: Type-check**

```bash
npx tsc --noEmit 2>&1 | head -20
```

Expected: zero errors.

---

## Task 5: Add ProjectModeSelector to CreateProjectDialog

**Files:**
- Modify: `src/components/create-project-dialog.tsx`
- Modify: `src/actions/projects.ts`

- [ ] **Step 1: Add `useWbs` to the create project schema**

In `create-project-dialog.tsx`, add to `createProjectSchema`:
```typescript
useWbs: z.boolean().default(true),
```

And to `defaultValues`:
```typescript
useWbs: true,
```

- [ ] **Step 2: Import and add ProjectModeSelector to the form**

Add import:
```typescript
import { ProjectModeSelector } from '@/components/project-mode-selector';
```

Add to the form, just before `<DialogFooter>`:
```tsx
<ProjectModeSelector
  value={form.watch('useWbs')}
  onChange={(v) => form.setValue('useWbs', v)}
/>
```

- [ ] **Step 3: Pass useWbs to createProject call**

In the `onSubmit` handler, add to the `createProject` call:
```typescript
useWbs: data.useWbs,
```

- [ ] **Step 4: Update createProject server action to accept useWbs**

In `src/actions/projects.ts`, the `ProjectInsert` type already covers all columns via Drizzle inference. The `createProject` function accepts `Omit<ProjectInsert, 'id' | 'userId' | 'createdAt' | 'updatedAt'>` so `useWbs` is already accepted once the schema column exists. Verify this compiles — no code change needed.

- [ ] **Step 5: Type-check + manual test**

```bash
npx tsc --noEmit 2>&1 | head -20
```

Open http://localhost:3000/projects → click "New Project" → verify the two-card mode selector appears above the submit button, defaulting to "Use WBS" selected.

---

## Task 6: WBS Keyboard Strip

**Files:**
- Create: `src/components/wbs/wbs-keyboard-strip.tsx`

- [ ] **Step 1: Create the keycap chip strip**

```typescript
import { cn } from '@/lib/utils';

const KEYS = [
  { key: '↵', label: 'New item' },
  { key: '⇥', label: 'Indent' },
  { key: '⇧⇥', label: 'Outdent' },
  { key: 'Esc', label: 'Cancel' },
] as const;

export function WbsKeyboardStrip({ className }: { className?: string }) {
  return (
    <div className={cn('flex items-center gap-3 flex-wrap', className)}>
      {KEYS.map(({ key, label }) => (
        <div key={key} className="flex items-center gap-1.5">
          <kbd className="inline-flex items-center justify-center rounded border border-border bg-muted px-1.5 py-0.5 font-mono text-[10px] font-medium text-muted-foreground shadow-[0_1px_0_0_hsl(var(--border))] dark:shadow-[0_1px_0_0_rgba(255,255,255,0.08)]">
            {key}
          </kbd>
          <span className="font-mono text-[10px] text-muted-foreground/60 tracking-[0.06em]">
            {label}
          </span>
        </div>
      ))}
    </div>
  );
}
```

- [ ] **Step 2: Type-check**

```bash
npx tsc --noEmit 2>&1 | head -20
```

---

## Task 7: WBS Dictionary component

**Files:**
- Create: `src/components/wbs/wbs-dictionary.tsx`

- [ ] **Step 1: Create the progressive dictionary form**

```typescript
'use client';

import * as React from 'react';
import { ChevronDownIcon } from 'lucide-react';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Input } from '@/components/ui/input';
import { cn } from '@/lib/utils';
import type { WbsElement } from '@/lib/wbs-utils';

interface WbsDictionaryProps {
  element: WbsElement;
  onUpdate: (data: Partial<WbsElement>) => void;
}

export function WbsDictionary({ element, onUpdate }: WbsDictionaryProps) {
  const [tier3Open, setTier3Open] = React.useState(false);
  const d = element.dictionaryDetails ?? {};

  return (
    <div className="flex flex-col gap-4 px-4 pb-4 pt-2 border-t border-border/30">
      {/* Tier 2 — always visible when expanded */}
      <div className="grid gap-3 sm:grid-cols-2">
        <div className="sm:col-span-2 flex flex-col gap-1">
          <Label className="text-[10px] font-mono uppercase tracking-[0.1em] text-muted-foreground">
            Description
          </Label>
          <p className="text-[10px] text-muted-foreground/50">What this deliverable is and what "done" looks like</p>
          <Textarea
            className="min-h-[72px] resize-none text-xs"
            value={element.description ?? ''}
            onChange={(e) => onUpdate({ description: e.target.value })}
            placeholder="Describe this deliverable..."
          />
        </div>
        <div className="sm:col-span-2 flex flex-col gap-1">
          <Label className="text-[10px] font-mono uppercase tracking-[0.1em] text-muted-foreground">
            Acceptance Criteria
          </Label>
          <p className="text-[10px] text-muted-foreground/50">How the deliverable will be verified as complete</p>
          <Textarea
            className="min-h-[60px] resize-none text-xs"
            value={element.acceptanceCriteria ?? ''}
            onChange={(e) => onUpdate({ acceptanceCriteria: e.target.value })}
            placeholder="Define acceptance criteria..."
          />
        </div>
        <div className="flex flex-col gap-1">
          <Label className="text-[10px] font-mono uppercase tracking-[0.1em] text-muted-foreground">
            Responsible Party
          </Label>
          <Input
            className="h-8 text-xs"
            value={element.responsibleParty ?? ''}
            onChange={(e) => onUpdate({ responsibleParty: e.target.value })}
            placeholder="Who owns this work package"
          />
        </div>
        <div className="flex flex-col gap-1">
          <Label className="text-[10px] font-mono uppercase tracking-[0.1em] text-muted-foreground">
            Estimated Cost
          </Label>
          <Input
            className="h-8 text-xs"
            type="number"
            value={element.estimatedCost ?? ''}
            onChange={(e) => onUpdate({ estimatedCost: e.target.value || null })}
            placeholder="0.00"
          />
        </div>
      </div>

      {/* Tier 3 — collapsed by default */}
      <div className="border rounded-lg border-border/40">
        <button
          type="button"
          onClick={() => setTier3Open((o) => !o)}
          className="flex w-full items-center justify-between px-3 py-2 text-left hover:bg-muted/30 transition-colors rounded-lg"
        >
          <span className="font-mono text-[10px] uppercase tracking-[0.1em] text-muted-foreground">
            Advanced Dictionary
          </span>
          <ChevronDownIcon
            className={cn('size-3.5 text-muted-foreground transition-transform duration-150', tier3Open && 'rotate-180')}
          />
        </button>
        {tier3Open && (
          <div className="grid gap-3 sm:grid-cols-2 px-3 pb-3">
            {[
              { key: 'milestones', label: 'Milestones', hint: 'Key dates for this deliverable' },
              { key: 'resourcesRequired', label: 'Resources Required', hint: 'People, tools, materials needed' },
              { key: 'qualityRequirements', label: 'Quality Requirements', hint: 'Standards this deliverable must meet' },
              { key: 'assumptionsConstraints', label: 'Assumptions & Constraints', hint: 'Specific to this work package' },
            ].map(({ key, label, hint }) => (
              <div key={key} className="flex flex-col gap-1">
                <Label className="text-[10px] font-mono uppercase tracking-[0.1em] text-muted-foreground">
                  {label}
                </Label>
                <p className="text-[10px] text-muted-foreground/50">{hint}</p>
                <Textarea
                  className="min-h-[56px] resize-none text-xs"
                  value={d[key as keyof typeof d] ?? ''}
                  onChange={(e) =>
                    onUpdate({
                      dictionaryDetails: { ...d, [key]: e.target.value },
                    })
                  }
                  placeholder={`Enter ${label.toLowerCase()}...`}
                />
              </div>
            ))}
          </div>
        )}
      </div>

      <p className="font-mono text-[10px] text-muted-foreground/40 text-center">
        Fill Tier 3 fields to unlock the Full Scope Baseline Report
      </p>
    </div>
  );
}
```

- [ ] **Step 2: Type-check**

```bash
npx tsc --noEmit 2>&1 | head -20
```

---

## Task 8: WBS Node component

**Files:**
- Create: `src/components/wbs/wbs-node.tsx`

- [ ] **Step 1: Create the expandable tree node**

```typescript
'use client';

import * as React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronRightIcon, ChevronDownIcon, Trash2Icon, BookOpenIcon } from 'lucide-react';
import { cn } from '@/lib/utils';
import { WbsDictionary } from '@/components/wbs/wbs-dictionary';
import type { WbsNode as WbsNodeType, WbsElement } from '@/lib/wbs-utils';
import { isWorkPackage } from '@/lib/wbs-utils';

interface WbsNodeProps {
  node: WbsNodeType;
  depth?: number;
  onUpdate: (id: number, data: Partial<WbsElement>) => void;
  onDelete: (id: number) => void;
  onSave: (id: number) => void;
}

export function WbsNodeComponent({ node, depth = 0, onUpdate, onDelete, onSave }: WbsNodeProps) {
  const [childrenOpen, setChildrenOpen] = React.useState(true);
  const [dictOpen, setDictOpen] = React.useState(false);
  const [editing, setEditing] = React.useState(false);
  const [name, setName] = React.useState(node.name);
  const workPackage = isWorkPackage(node);

  function handleNameBlur() {
    setEditing(false);
    if (name.trim() && name.trim() !== node.name) {
      onUpdate(node.id, { name: name.trim() });
      onSave(node.id);
    }
  }

  return (
    <div>
      <div
        className={cn(
          'group flex items-start gap-1.5 rounded-lg py-1.5 pr-2 transition-colors hover:bg-muted/30',
          depth > 0 && 'border-l-2 border-primary/15',
        )}
        style={{ paddingLeft: `${depth * 20 + 8}px` }}
      >
        {/* Expand/collapse children */}
        {node.children.length > 0 ? (
          <button
            type="button"
            onClick={() => setChildrenOpen((o) => !o)}
            className="mt-0.5 shrink-0 text-muted-foreground/50 hover:text-foreground"
          >
            {childrenOpen
              ? <ChevronDownIcon className="size-3.5" />
              : <ChevronRightIcon className="size-3.5" />}
          </button>
        ) : (
          <span className="mt-0.5 size-3.5 shrink-0" />
        )}

        {/* WBS code */}
        <code className="mt-0.5 shrink-0 font-mono text-[10px] text-primary/60 bg-primary/5 px-1 py-0.5 rounded leading-none">
          {node.wbsCode}
        </code>

        {/* Work package indicator */}
        {workPackage && (
          <span className="mt-0.5 shrink-0 inline-flex items-center rounded-sm bg-amber-100 dark:bg-amber-900/30 px-1 py-0.5 font-mono text-[8px] font-bold uppercase tracking-[0.1em] text-amber-700 dark:text-amber-400">
            WP
          </span>
        )}

        {/* Name — editable inline */}
        {editing ? (
          <input
            autoFocus
            className="flex-1 min-w-0 bg-transparent text-sm outline-none border-b border-primary/40 pb-0.5"
            value={name}
            onChange={(e) => setName(e.target.value)}
            onBlur={handleNameBlur}
            onKeyDown={(e) => {
              if (e.key === 'Enter') { e.preventDefault(); handleNameBlur(); }
              if (e.key === 'Escape') { setEditing(false); setName(node.name); }
            }}
          />
        ) : (
          <span
            className="flex-1 min-w-0 text-sm text-foreground cursor-text"
            onDoubleClick={() => setEditing(true)}
          >
            {node.name}
          </span>
        )}

        {/* Actions — visible on hover */}
        <div className="ml-auto flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity shrink-0">
          <button
            type="button"
            onClick={() => setDictOpen((o) => !o)}
            className={cn(
              'p-1 rounded hover:bg-muted transition-colors',
              dictOpen ? 'text-primary' : 'text-muted-foreground/50',
            )}
            title="WBS Dictionary"
          >
            <BookOpenIcon className="size-3.5" />
          </button>
          <button
            type="button"
            onClick={() => onDelete(node.id)}
            className="p-1 rounded hover:bg-destructive/10 text-muted-foreground/50 hover:text-destructive transition-colors"
            title="Delete element"
          >
            <Trash2Icon className="size-3.5" />
          </button>
        </div>
      </div>

      {/* Dictionary — slides in below the node */}
      <AnimatePresence>
        {dictOpen && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="overflow-hidden ml-6"
          >
            <WbsDictionary
              element={node}
              onUpdate={(data) => onUpdate(node.id, data)}
            />
          </motion.div>
        )}
      </AnimatePresence>

      {/* Children */}
      <AnimatePresence>
        {childrenOpen && node.children.length > 0 && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.15 }}
          >
            {node.children.map((child) => (
              <WbsNodeComponent
                key={child.id}
                node={child}
                depth={depth + 1}
                onUpdate={onUpdate}
                onDelete={onDelete}
                onSave={onSave}
              />
            ))}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
```

- [ ] **Step 2: Type-check**

```bash
npx tsc --noEmit 2>&1 | head -20
```

---

## Task 9: WBS Tree Editor component

**Files:**
- Create: `src/components/wbs/wbs-tree-editor.tsx`

This is the most complex component. It manages a flat list of "edit rows" for keyboard-driven entry, auto-saves on commit, and displays the saved tree via WbsNodeComponent.

- [ ] **Step 1: Create the file**

```typescript
'use client';

import * as React from 'react';
import { PlusIcon } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { WbsKeyboardStrip } from '@/components/wbs/wbs-keyboard-strip';
import { WbsNodeComponent } from '@/components/wbs/wbs-node';
import { buildWbsTree, type WbsElement, type EditRow } from '@/lib/wbs-utils';
import { resolveParentId } from '@/lib/wbs-utils';
import { createWbsElement, updateWbsElement, deleteWbsElement } from '@/actions/wbs';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';

interface WbsTreeEditorProps {
  projectId: number;
  initialElements: WbsElement[];
}

let rowKeyCounter = 0;
function nextKey() { return `row-${++rowKeyCounter}`; }

export function WbsTreeEditor({ projectId, initialElements }: WbsTreeEditorProps) {
  const [elements, setElements] = React.useState<WbsElement[]>(initialElements);
  const [editRows, setEditRows] = React.useState<EditRow[]>([]);
  const [isAdding, setIsAdding] = React.useState(false);
  const inputRefs = React.useRef<Map<string, HTMLInputElement>>(new Map());

  const tree = buildWbsTree(elements);

  // ── Edit row keyboard handlers ──────────────────────────────────────────────

  function startAdding() {
    const key = nextKey();
    setEditRows([{ key, dbId: null, name: '', level: 0 }]);
    setIsAdding(true);
    // Focus happens via ref callback
    requestAnimationFrame(() => inputRefs.current.get(key)?.focus());
  }

  function handleKeyDown(e: React.KeyboardEvent<HTMLInputElement>, index: number) {
    const rows = [...editRows];
    const row = rows[index];

    if (e.key === 'Enter') {
      e.preventDefault();
      commitRow(index, rows, () => {
        // Add sibling after commit
        const key = nextKey();
        const newRow: EditRow = { key, dbId: null, name: '', level: row.level };
        const updated = [...rows];
        updated.splice(index + 1, 0, newRow);
        setEditRows(updated);
        requestAnimationFrame(() => inputRefs.current.get(key)?.focus());
      });
    } else if (e.key === 'Tab') {
      e.preventDefault();
      if (e.shiftKey) {
        // Outdent: decrease level (min 0)
        if (row.level > 0) {
          rows[index] = { ...row, level: row.level - 1 };
          setEditRows(rows);
        }
      } else {
        // Indent: can only indent if there's a row above at same or higher level
        if (index > 0) {
          const maxLevel = rows[index - 1].level + 1;
          rows[index] = { ...row, level: Math.min(row.level + 1, maxLevel) };
          setEditRows(rows);
        }
      }
    } else if (e.key === 'Escape') {
      e.preventDefault();
      if (row.name.trim() === '') {
        // Remove empty row
        const updated = rows.filter((_, i) => i !== index);
        if (updated.length === 0) { setIsAdding(false); setEditRows([]); }
        else setEditRows(updated);
      } else {
        // Commit and stop
        commitRow(index, rows, () => { setIsAdding(false); setEditRows([]); });
      }
    }
  }

  async function commitRow(index: number, rows: EditRow[], after?: () => void) {
    const row = rows[index];
    if (!row.name.trim()) { after?.(); return; }

    const parentId = resolveParentId(rows, index);
    const orderIndex = elements.filter((e) => e.parentId === parentId).length;

    try {
      const { id, wbsCode } = await createWbsElement({
        projectId,
        parentId,
        name: row.name.trim(),
        orderIndex,
      });

      // Add to local elements so the tree re-renders
      const newElement: WbsElement = {
        id,
        projectId,
        userId: '',
        parentId,
        wbsCode,
        name: row.name.trim(),
        description: null,
        acceptanceCriteria: null,
        responsibleParty: null,
        estimatedCost: null,
        dictionaryDetails: null,
        orderIndex,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      setElements((prev) => {
        // Update WBS codes: simple rebuild
        return [...prev, newElement];
      });

      // Update the row's dbId so further parent resolution works
      const updated = [...rows];
      updated[index] = { ...row, dbId: id };
      setEditRows(updated);

      after?.();
    } catch {
      toast.error('Failed to save WBS element');
    }
  }

  async function handleUpdate(id: number, data: Partial<WbsElement>) {
    setElements((prev) => prev.map((e) => (e.id === id ? { ...e, ...data } : e)));
  }

  async function handleSave(id: number) {
    const el = elements.find((e) => e.id === id);
    if (!el) return;
    try {
      await updateWbsElement(id, {
        name: el.name,
        description: el.description ?? undefined,
        acceptanceCriteria: el.acceptanceCriteria ?? undefined,
        responsibleParty: el.responsibleParty ?? undefined,
        estimatedCost: el.estimatedCost ?? undefined,
        dictionaryDetails: el.dictionaryDetails ?? undefined,
      });
    } catch {
      toast.error('Failed to update element');
    }
  }

  async function handleDelete(id: number) {
    setElements((prev) => prev.filter((e) => e.id !== id));
    try {
      await deleteWbsElement(id);
    } catch {
      toast.error('Failed to delete element');
    }
  }

  // Auto-save dictionary updates on blur — debounced 800ms
  const saveTimer = React.useRef<NodeJS.Timeout | null>(null);
  async function handleDictionaryUpdate(id: number, data: Partial<WbsElement>) {
    handleUpdate(id, data);
    if (saveTimer.current) clearTimeout(saveTimer.current);
    saveTimer.current = setTimeout(() => handleSave(id), 800);
  }

  return (
    <div className="flex flex-col gap-4">
      {/* Keyboard strip */}
      <WbsKeyboardStrip />

      {/* Saved tree */}
      {tree.length > 0 && (
        <div className="rounded-xl border border-border/40 bg-card overflow-hidden">
          <div className="p-3">
            {tree.map((node) => (
              <WbsNodeComponent
                key={node.id}
                node={node}
                depth={0}
                onUpdate={handleDictionaryUpdate}
                onDelete={handleDelete}
                onSave={handleSave}
              />
            ))}
          </div>
        </div>
      )}

      {/* Inline edit rows for keyboard entry */}
      {isAdding && (
        <div className="rounded-xl border border-primary/30 bg-card overflow-hidden p-3 flex flex-col gap-0.5">
          {editRows.map((row, index) => (
            <div
              key={row.key}
              className="flex items-center gap-2"
              style={{ paddingLeft: `${row.level * 20}px` }}
            >
              <span className="font-mono text-[10px] text-muted-foreground/40 w-8 shrink-0">
                {/* Ghost WBS code preview */}
                {row.level === 0
                  ? String(elements.filter((e) => e.parentId == null).length + 1)
                  : '•'}
              </span>
              <input
                ref={(el) => {
                  if (el) inputRefs.current.set(row.key, el);
                  else inputRefs.current.delete(row.key);
                }}
                className="flex-1 bg-transparent text-sm outline-none placeholder:text-muted-foreground/30"
                value={row.name}
                placeholder={
                  index === 0 && editRows.length === 1
                    ? 'Type a deliverable name, then hit ↵'
                    : '↵ next · ⇥ indent · ⇧⇥ outdent'
                }
                onChange={(e) => {
                  const updated = [...editRows];
                  updated[index] = { ...row, name: e.target.value };
                  setEditRows(updated);
                }}
                onKeyDown={(e) => handleKeyDown(e, index)}
              />
            </div>
          ))}
        </div>
      )}

      {/* Add root element button */}
      <Button
        variant="outline"
        size="sm"
        className="self-start gap-1.5"
        onClick={startAdding}
      >
        <PlusIcon className="size-3.5" />
        Add deliverable
      </Button>
    </div>
  );
}
```

- [ ] **Step 2: Type-check**

```bash
npx tsc --noEmit 2>&1 | head -20
```

Expected: zero errors.

---

## Task 10: WBS Tab component

**Files:**
- Create: `src/components/wbs/wbs-tab.tsx`

- [ ] **Step 1: Create the tab wrapper**

```typescript
import { NetworkIcon } from 'lucide-react';
import { WbsTreeEditor } from '@/components/wbs/wbs-tree-editor';
import { getWbsElements } from '@/actions/wbs';
import type { WbsElement } from '@/lib/wbs-utils';

interface WbsTabProps {
  projectId: number;
  initialElements: WbsElement[];
}

export function WbsTab({ projectId, initialElements }: WbsTabProps) {
  const isEmpty = initialElements.length === 0;

  return (
    <div className="flex flex-col gap-6">
      {/* Header */}
      <div className="flex items-start gap-3">
        <div className="rounded-lg bg-primary/10 p-2">
          <NetworkIcon className="size-5 text-primary" />
        </div>
        <div>
          <h2 className="text-base font-bold font-heading">Work Breakdown Structure</h2>
          <p className="text-sm text-muted-foreground">
            PMBOK 8 Scope Management — Create WBS process. Decompose project scope into deliverables.
          </p>
        </div>
      </div>

      {/* Empty state */}
      {isEmpty && (
        <div className="rounded-xl border-2 border-dashed border-border/60 p-8 text-center">
          <NetworkIcon className="size-8 text-muted-foreground/30 mx-auto mb-3" />
          <h3 className="font-heading font-semibold text-base mb-1">No WBS elements yet</h3>
          <p className="text-sm text-muted-foreground max-w-sm mx-auto mb-4">
            Start by adding your top-level deliverables. Use Tab to create child elements and build your scope hierarchy.
          </p>
        </div>
      )}

      {/* Tree editor */}
      <WbsTreeEditor projectId={projectId} initialElements={initialElements} />
    </div>
  );
}
```

- [ ] **Step 2: Type-check**

```bash
npx tsc --noEmit 2>&1 | head -20
```

---

## Task 11: WBS Completeness Banner

**Files:**
- Create: `src/components/wbs/wbs-completeness-banner.tsx`

- [ ] **Step 1: Create the slim banner for Use Tasks projects**

```typescript
'use client';

import { useRouter } from 'next/navigation';
import { useTransition } from 'react';
import { NetworkIcon, XIcon } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { setProjectWbsMode, dismissWbsNudge } from '@/actions/wbs';
import { computeWbsCompleteness } from '@/lib/wbs-utils';
import { cn } from '@/lib/utils';

interface WbsCompletenessBannerProps {
  projectId: number;
  tasks: { wbsElementId: number | null }[];
  nudgeDismissed: boolean;
}

export function WbsCompletenessBanner({ projectId, tasks, nudgeDismissed }: WbsCompletenessBannerProps) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const { unassigned, total, percent } = computeWbsCompleteness(tasks);

  if (nudgeDismissed || total === 0) return null;

  async function handleBuildWbs() {
    startTransition(async () => {
      await setProjectWbsMode(projectId, true);
      router.refresh();
    });
  }

  async function handleDismiss() {
    startTransition(async () => {
      await dismissWbsNudge(projectId);
      router.refresh();
    });
  }

  return (
    <div className={cn(
      'flex items-center gap-3 rounded-lg border border-amber-200 dark:border-amber-900/40',
      'bg-amber-50 dark:bg-amber-900/10 px-4 py-2.5',
    )}>
      <NetworkIcon className="size-4 text-amber-600 dark:text-amber-400 shrink-0" />
      <p className="flex-1 text-xs text-amber-800 dark:text-amber-300">
        <span className="font-semibold">WBS not defined</span>
        {unassigned > 0
          ? ` — ${unassigned} task${unassigned !== 1 ? 's' : ''} have no deliverable assigned. Scope may be incomplete.`
          : ' — No deliverable structure defined for this project.'}
      </p>
      <div className="flex items-center gap-2 shrink-0">
        <Button
          size="sm"
          variant="outline"
          className="h-7 text-xs border-amber-300 dark:border-amber-700 text-amber-700 dark:text-amber-300 hover:bg-amber-100 dark:hover:bg-amber-900/30"
          onClick={handleBuildWbs}
          disabled={pending}
        >
          Build WBS
        </Button>
        <button
          type="button"
          onClick={handleDismiss}
          disabled={pending}
          className="text-amber-500 hover:text-amber-700 dark:text-amber-500 dark:hover:text-amber-300 transition-colors"
          title="Dismiss"
        >
          <XIcon className="size-3.5" />
        </button>
      </div>
    </div>
  );
}
```

- [ ] **Step 2: Type-check**

```bash
npx tsc --noEmit 2>&1 | head -20
```

---

## Task 12: Integrate WBS tab + banner into ProjectDetailClient

**Files:**
- Modify: `src/components/project-detail-client.tsx`
- Modify: `src/app/(dashboard)/projects/[id]/page.tsx`

- [ ] **Step 1: Fetch wbs_elements in the project detail page**

In `src/app/(dashboard)/projects/[id]/page.tsx`:

Add `wbsElements` to the import from schema:
```typescript
import { profiles, projects, portfolios, programs, tasks, notes, stakeholders, risks, changeRequests, lessonsLearned, issues, wbsElements } from '@/db/schema';
```

After the existing queries, add:
```typescript
const projectWbsElements = project.useWbs
  ? await db.select().from(wbsElements).where(eq(wbsElements.projectId, id)).orderBy(wbsElements.orderIndex)
  : [];
```

Pass to `ProjectDetailClient`:
```typescript
initialWbsElements={projectWbsElements}
```

- [ ] **Step 2: Update ProjectDetailClient props**

At the top of `ProjectDetailClient`'s props destructuring, add:
```typescript
initialWbsElements: typeof import('@/db/schema').wbsElements.$inferSelect[];
```

- [ ] **Step 3: Import new components in ProjectDetailClient**

```typescript
import { WbsTab } from '@/components/wbs/wbs-tab';
import { WbsCompletenessBanner } from '@/components/wbs/wbs-completeness-banner';
```

- [ ] **Step 4: Add WBS tab trigger in the TabsList**

After the `<TabsTrigger value="charter">` line, add:
```tsx
{project.useWbs && (
  <TabsTrigger value="wbs" className="rounded-lg px-3 py-1.5 text-xs font-semibold">
    WBS
  </TabsTrigger>
)}
```

- [ ] **Step 5: Add WBS tab content**

After the `<TabsContent value="charter">` block, add:
```tsx
{project.useWbs && (
  <TabsContent value="wbs" className="mt-4">
    <WbsTab projectId={project.id} initialElements={initialWbsElements} />
  </TabsContent>
)}
```

- [ ] **Step 6: Add completeness banner for Use Tasks projects**

Find the Tabs component opening tag. Just ABOVE it, add:
```tsx
{!project.useWbs && (
  <WbsCompletenessBanner
    projectId={project.id}
    tasks={tasks.map((t) => ({ wbsElementId: t.wbsElementId ?? null }))}
    nudgeDismissed={project.wbsNudgeDismissed ?? false}
  />
)}
```

Where `tasks` is the `initialTasks` prop renamed to `tasks` locally (check existing naming in the component).

- [ ] **Step 7: Type-check + manual test**

```bash
npx tsc --noEmit 2>&1 | head -30
```

Open a project in the browser:
- If `useWbs = true`: verify WBS tab appears, tree editor loads, keyboard strip is visible
- If `useWbs = false`: verify amber banner appears below header

---

## Task 13: Upgrade nudge at focus area transition

**Files:**
- Modify: `src/components/project-detail-client.tsx`

The existing "Advance" button opens `advanceOpen` dialog. We intercept this flow for "Use Tasks" projects advancing to Executing.

- [ ] **Step 1: Add wbs nudge state**

In `ProjectDetailClient`, add:
```typescript
const [wbsNudgeOpen, setWbsNudgeOpen] = React.useState(false);
const [pendingFocusArea, setPendingFocusArea] = React.useState<string | null>(null);
```

- [ ] **Step 2: Find the FOCUS_AREA_SEQUENCE constant and the advance dialog**

Search the file for `advanceOpen` and `AdvanceFocusAreaDialog` (or similar). The dialog calls `handleFocusAreaAdvanced`. We need to intercept BEFORE the dialog opens when:
- `project.useWbs === false`
- `project.wbsNudgeDismissed === false`
- The next focus area is `'executing'` or later

- [ ] **Step 3: Add interception logic to the Advance button click**

Find the Advance button's `onClick`. Wrap it:
```typescript
onClick={() => {
  const nextArea = FOCUS_AREA_SEQUENCE[currentIdx + 1];
  const isExecutingOrLater = ['executing', 'monitoring_controlling', 'closing'].includes(nextArea ?? '');
  if (!project.useWbs && !project.wbsNudgeDismissed && isExecutingOrLater) {
    setPendingFocusArea(nextArea ?? null);
    setWbsNudgeOpen(true);
  } else {
    setAdvanceOpen(true);
  }
}}
```

- [ ] **Step 4: Add the WBS nudge dialog**

Import Dialog components are already imported. Add this dialog to the return JSX:

```tsx
<Dialog open={wbsNudgeOpen} onOpenChange={setWbsNudgeOpen}>
  <DialogContent className="sm:max-w-md">
    <DialogHeader>
      <DialogTitle className="flex items-center gap-2">
        <NetworkIcon className="size-5 text-primary" />
        Before you advance to {pendingFocusArea?.replace('_', ' ')}
      </DialogTitle>
      <DialogDescription>
        PMBOK 8 recommends a baselined WBS before execution begins.
        You currently have {initialTasks.filter((t) => !t.wbsElementId).length} tasks with no deliverable structure.
        Building your WBS now takes about 5 minutes and gives you clear scope boundaries,
        traceable activities, and a baseline to measure change against.
      </DialogDescription>
    </DialogHeader>
    <DialogFooter className="flex-col gap-2 sm:flex-col">
      <Button
        className="w-full"
        onClick={async () => {
          await setProjectWbsMode(project.id, true);
          setWbsNudgeOpen(false);
          router.refresh();
        }}
      >
        Build WBS Now
      </Button>
      <Button
        variant="outline"
        className="w-full"
        onClick={() => { setWbsNudgeOpen(false); setAdvanceOpen(true); }}
      >
        Remind Me Later
      </Button>
      <Button
        variant="ghost"
        className="w-full text-muted-foreground text-xs"
        onClick={async () => {
          await dismissWbsNudge(project.id);
          setWbsNudgeOpen(false);
          setAdvanceOpen(true);
        }}
      >
        Skip — I understand the risk
      </Button>
    </DialogFooter>
  </DialogContent>
</Dialog>
```

Add missing imports:
```typescript
import { setProjectWbsMode, dismissWbsNudge } from '@/actions/wbs';
import { NetworkIcon } from 'lucide-react';
```

- [ ] **Step 5: Type-check + manual test**

```bash
npx tsc --noEmit 2>&1 | head -20
```

On a "Use Tasks" project, click Advance toward Executing — verify the WBS nudge dialog appears with all three options.

---

## Task 14: WBS completeness dot on project cards

**Files:**
- Modify: `src/components/project-card-variants.tsx`
- Modify: `src/app/(dashboard)/projects/page.tsx`

- [ ] **Step 1: Fetch task wbsElementId data on the projects page**

In `src/app/(dashboard)/projects/page.tsx`, the existing task count query only fetches `projectId` and `count`. Modify it to also fetch `wbsElementId`:

```typescript
const taskWbsData = await db
  .select({ projectId: tasks.projectId, wbsElementId: tasks.wbsElementId })
  .from(tasks);

// Build a map: projectId → unassigned count (tasks with no wbsElementId)
const wbsUnassignedMap = new Map<number, number>();
taskWbsData.forEach(({ projectId, wbsElementId }) => {
  if (!wbsElementId) {
    wbsUnassignedMap.set(projectId, (wbsUnassignedMap.get(projectId) ?? 0) + 1);
  }
});
```

Pass to `ProjectGrid`:
```tsx
<ProjectGrid
  projects={userProjects}
  taskCountMap={taskCountMap}
  featuredProjectId={featuredProjectId}
  wbsUnassignedMap={wbsUnassignedMap}
/>
```

- [ ] **Step 2: Update ProjectGrid to accept and pass wbsUnassignedMap**

In `src/components/project-grid.tsx`, add to props:
```typescript
wbsUnassignedMap: Map<number, number>;
```

Pass to each card:
```tsx
wbsUnassigned={wbsUnassignedMap.get(p.id) ?? 0}
```

- [ ] **Step 3: Add the WBS dot to project cards**

In `src/components/project-card-variants.tsx`, add `wbsUnassigned` to `CardProps`:
```typescript
wbsUnassigned?: number;
```

In `CardC_Standard`, inside the header row (after the `CardBadge`), add:
```tsx
{!project.useWbs && (wbsUnassigned ?? 0) > 0 && (
  <span
    title={`${wbsUnassigned} tasks have no WBS assignment`}
    className="shrink-0 flex items-center gap-1 rounded-sm bg-amber-100 dark:bg-amber-900/30 px-1.5 py-0.5 font-mono text-[8px] font-bold uppercase tracking-[0.08em] text-amber-700 dark:text-amber-400"
  >
    WBS
  </span>
)}
```

Apply the same pattern to `CardC_Featured`.

- [ ] **Step 4: Type-check + manual test**

```bash
npx tsc --noEmit 2>&1 | head -20
```

Expected: "Use Tasks" projects with unassigned tasks show a small amber "WBS" dot on the card.

---

## Task 15: Final build verification

- [ ] **Step 1: Full type-check**

```bash
npx tsc --noEmit 2>&1
```

Expected: zero errors.

- [ ] **Step 2: Build**

```bash
npm run build 2>&1 | tail -20
```

Expected: `✓ Compiled successfully`

- [ ] **Step 3: Manual smoke test checklist**

Visit http://localhost:3000/projects and verify:

1. **Create project** — mode selector shows, "Use WBS" is default selected
2. **Use WBS project** — WBS tab appears in project detail, tree editor shows with keyboard strip
3. **Add deliverables** — type name, Enter adds sibling, Tab indents, Shift+Tab outdents, WBS codes auto-assign (1, 1.1, 1.1.1)
4. **Double-click node name** — inline edit works, blur saves to DB
5. **Dictionary icon** — click opens Tier 2 fields, Advanced accordion opens Tier 3
6. **Use Tasks project** — amber WBS banner appears below header, "Build WBS" upgrades mode
7. **Card dot** — Use Tasks cards with unassigned tasks show amber WBS badge
8. **Advance nudge** — Use Tasks project advancing to Executing shows three-option dialog

- [ ] **Step 4: Commit**

```bash
git add src/db/schema.ts src/actions/wbs.ts src/lib/wbs-utils.ts src/components/wbs/ src/components/project-mode-selector.tsx src/components/create-project-dialog.tsx src/components/project-detail-client.tsx src/components/project-card-variants.tsx src/components/project-grid.tsx src/app/(dashboard)/projects/page.tsx src/app/(dashboard)/projects/[id]/page.tsx drizzle/
git commit -m "feat: add PMBOK 8-aligned WBS system with project mode toggle, tree editor, WBS dictionary, and completeness indicator"
```
