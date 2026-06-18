# Issues Resolution Plan — 2026-06-18 (FINAL)

Source issues: `issues.md` (13 items). All three open questions resolved.
Plan finalized with PMBOK 8 research, Q1–Q3 answers incorporated.

---

## Resolved design decisions

**Q1 — Gantt task dates:** Add `start_date` column to `tasks` table. Proper per-task Gantt bars using `startDate → dueDate`. Task form gets a "Start Date" field.

**Q2 — WBS → Task auto-creation rule (with checklist):**
- WBS element with **no parent** (top-level) → auto-creates a Task card in Kanban
- WBS element added **as a child** of another element → auto-adds a checklist item to the parent's linked task (does NOT create a new task card)
- No orphaned task problem: children are always checklist items, never independent cards
- Tasks gain a `checklistItems jsonb` column: `{ id, text, done }[]`

**Q3 — PMBOK 8 PM Plan document inputs (from PMI standard):**
The Project Management Plan integrates 12 subsidiary plans per PMBOK 8:
1. Scope Management Plan
2. Requirements Management Plan
3. Schedule Management Plan
4. Financial/Cost Management Plan
5. Quality Management Plan
6. Resource Management Plan
7. Communications Management Plan
8. Risk Management Plan
9. Procurement Management Plan
10. Stakeholder Engagement Plan
11. Change Management Plan
12. Configuration Management Plan

For the app, we generate the 5 most data-rich ones (others need data we don't collect yet):
- **Project Management Plan** (master) — pulls all available data
- **Scope Management Plan** — charter scope + WBS
- **Communications Management Plan** — stakeholders + engagement strategies
- **Risk Management Plan** — risk register + charter risk approach
- **Stakeholder Engagement Plan** — stakeholders + influence/interest + engagement strategy + last_engaged_date

---

## Root-cause summary

| # | Issue | Root Cause | Schema Δ |
|---|---|---|---|
| 1 | Charter wipes on tab switch | `CharterTab` unmounts on tab switch; `React.useState` re-initialises from stale parent prop | No |
| 2/11/12 | Phase gate always pre-ticked | All checklist items rendered with green icon unconditionally — no data checked | No |
| 3 | WBS → no Kanban card; keyboard guide cryptic | No task created on WBS insert; checklist feature missing; key labels unclear | No (JSONB) |
| 4 | No PM Plan document | Reports tab only has status reports; no formal PM document generation | No |
| 5 | No schedule baseline or Gantt | Baseline columns exist but no button; no Gantt view; tasks lack `startDate` | Yes (tasks) |
| 6 | No stakeholder engagement tracking | `stakeholders` table has no `last_engaged_date` | Yes |
| 7 | Wrong PMBOK 8 performance domains | `DOMAINS` array uses PMBOK 7 (8 domains) not PMBOK 8 (7 domains) | No (JSONB) |
| 8 | PMBOK 8 principles not in app | No principles scorecard or inline tooltips anywhere | Yes (user_prefs) |
| 9 | EVM PV field unexplained | No description for what to enter; metric descriptions are vague | No |
| 10 | Risk Report blank content | AI stream silently returns empty; client shows `null` when `content === ""` | No |
| 13 | Progress stuck at 0% | `progressPercent` never auto-updated; marking task "done" doesn't set `percentComplete = 100` | No |

---

## Single migration file

All schema changes go in **one file**: `drizzle/0005_issues_resolution.sql`

```sql
-- Issue 6: stakeholder engagement date
ALTER TABLE stakeholders
  ADD COLUMN IF NOT EXISTS last_engaged_date timestamp;

-- Issue 8: per-user PMBOK 8 principles self-assessment
ALTER TABLE user_preferences
  ADD COLUMN IF NOT EXISTS principles_reflection jsonb;

-- Issue 3: task checklist items (sub-activities from WBS children)
ALTER TABLE tasks
  ADD COLUMN IF NOT EXISTS checklist_items jsonb DEFAULT '[]'::jsonb;

-- Issue 5: task start date for Gantt
ALTER TABLE tasks
  ADD COLUMN IF NOT EXISTS start_date timestamp;
```

Drizzle schema (`src/db/schema.ts`) updated for all four columns.

---

## Phase A — Bug fixes (no schema changes)

### A1 · Issue 1 — Charter wipes on tab switch

**Files:** `src/components/tabs/charter-tab.tsx`, `src/components/project-detail-client.tsx`

**Root cause:** `ProjectDetailClient` holds `const [project, setProject] = useState(initialProject)`. After `saveCharter` succeeds, `charter-tab.tsx` calls `router.refresh()` (updates server cache) but never updates the parent's `project` state. When the user switches tabs, `CharterTab` unmounts. When they return, it remounts and calls `useState((project.charter ?? {}))` — which reads the stale parent state (old charter), not the just-saved data.

**Fix — two small changes:**

1. `charter-tab.tsx`: add `onSaved: (charter: CharterData) => void` to props. Call `onSaved(fields)` immediately after `await saveCharter(...)` succeeds, before `router.refresh()`.

2. `project-detail-client.tsx`: where `<CharterTab>` is rendered, pass:
   ```tsx
   onSaved={(charter) =>
     setProject((p) => ({ ...p, charter: charter as Record<string, unknown> }))
   }
   ```

On remount, `project.charter` in the parent is the saved data — `useState` initialises correctly.

---

### A2 · Issue 10 — Risk Report shows blank content

**Files:** `src/components/tabs/reports-tab.tsx`, `src/app/api/reports/generate/route.ts`

**Root cause:** When the AI model errors silently (empty stream, rate-limit, missing key), `streaming` becomes `false` and `content` stays `""`. The JSX branch `content ? <Markdown> : streaming ? <Spinner> : null` renders `null` — no error, no retry.

**Fix:**

`reports-tab.tsx`:
- Add `hasError` state (boolean)
- After the read loop completes, if `accumulated === ""`, set `hasError = true` and `setView('grid')`
- When `hasError` is true and view is 'grid', show an inline error banner above the report grid:
  `"Report generation returned no content. Check your AI provider settings in Settings, then try again."` with a dismiss button

`route.ts`:
- Wrap `getLanguageModel(aiConfig)` in a try/catch that returns `{ error: 'AI model not configured...' }` with status 400 (already done for model init, but verify error propagates for missing keys too)
- Add `onError` to `streamText` call: pipe error message into stream so at minimum a diagnostic string appears in `accumulated`

---

### A3 · Issue 13 — Progress stuck at 0%

**Files:** `src/actions/tasks.ts`, `src/actions/projects.ts`, new helper in `src/lib/project-helpers.tsx`

**Root cause:** `progressPercent` is a stored integer column. Clicking "Mark Done" calls `updateTaskStatus(id, 'done')` — which only updates `tasks.status`, never touches `tasks.percent_complete` or `projects.progress_percent`.

**Fix — two parts:**

**Part 1 — Auto-set `percentComplete` on status change** (in `updateTaskStatus`):
```
status → 'done'         : set percentComplete = 100
status → 'todo'         : set percentComplete = 0
status → 'in_progress'  : leave percentComplete unchanged
status → 'review'       : leave percentComplete unchanged
```

**Part 2 — `recomputeProjectProgress(projectId, db)` helper:**

```
PHASE_WEIGHTS = {
  initiating: 10, planning: 25, executing: 50,
  monitoring_controlling: 75, closing: 90
}

tasks = SELECT percent_complete FROM tasks WHERE project_id = $1
project = SELECT current_focus_area FROM projects WHERE id = $1

taskProgress  = tasks.length > 0 ? AVG(percent_complete) : 0
phaseProgress = PHASE_WEIGHTS[project.currentFocusArea] ?? 10

progress = tasks.length > 0
  ? Math.round(taskProgress * 0.7 + phaseProgress * 0.3)
  : phaseProgress

UPDATE projects SET progress_percent = progress WHERE id = $1
```

Call `recomputeProjectProgress` at the end of:
- `createTask` → after insert
- `updateTask` → after update
- `updateTaskStatus` → after update
- `deleteTask` → after delete
- `updateFocusArea` → after phase advance

---

## Phase B — Logic & data-driven features (no schema changes)

### B1 · Issues 2, 11, 12 — Data-driven soft gate for phase advancement

**Files:** `src/components/project-detail-client.tsx`

**Current state:** `AdvanceFocusAreaDialog` receives only `project`. The `FOCUS_AREA_CHECKLIST` is a `Record<string, string[]>` — plain strings, all rendered with a green `<CheckCircle2Icon>` unconditionally.

**Fix:**

**Step 1 — New type and compute function (above `FOCUS_AREA_CHECKLIST`):**

```ts
type GateItem = { text: string; done: boolean; optional?: boolean }

function computeGateItems(
  phase: string,
  project: Project,
  tasks: Task[],
  risks: Risk[],
  stakeholders: Stakeholder[],
  changeRequests: ChangeRequest[],
  wbsElements: WbsElement[],
): GateItem[]
```

**Gate item mappings:**

| Phase | Item text | Done condition | Optional |
|---|---|---|---|
| initiating | "Project Charter drafted" | `Object.values(project.charter ?? {}).some(v => v)` | No |
| initiating | "Key stakeholders identified" | `stakeholders.length > 0` | No |
| initiating | "Scope documented" | `(project.description ?? '').trim().length > 0` | No |
| initiating | "Project authorized to proceed" | `true` | — |
| planning | "WBS or task list created" | `wbsElements.length > 0 \|\| tasks.length > 0` | No |
| planning | "Risk register populated" | `risks.length > 0` | No |
| planning | "Schedule baseline set" | `project.baselineStartDate != null` | No |
| planning | "Stakeholders engaged" | `stakeholders.length > 0` | No |
| planning | "Charter complete" | `Object.values(project.charter ?? {}).some(v => v)` | No |
| executing | "Deliverables being produced" | `tasks.some(t => ['in_progress','done'].includes(t.status))` | No |
| executing | "Active tasks in progress" | `tasks.some(t => t.status === 'in_progress')` | No |
| executing | "Change requests logged" | `changeRequests.length > 0` | Yes (warn only) |
| executing | "Stakeholders identified for comms" | `stakeholders.length > 0` | No |
| monitoring | "All tasks completed" | `tasks.length > 0 && tasks.every(t => t.status === 'done')` | No |
| monitoring | "No pending change requests" | `changeRequests.every(cr => cr.status !== 'pending')` | No |
| monitoring | "Progress reported (> 0%)" | `(project.progressPercent ?? 0) > 0` | No |
| monitoring | "High-risk items addressed" | `!risks.some(r => (r.riskScore ?? 0) >= 12 && r.status === 'open')` | No |

**Step 2 — Update `AdvanceFocusAreaDialog`:**
- Accept `tasks`, `risks`, `stakeholders`, `changeRequests`, `wbsElements` as props
- Compute `const items = computeGateItems(...)` inside component
- Render each item: green `CheckCircle2Icon` when `done`, amber `AlertCircleIcon` when `!done`
- If any non-optional item is `done === false`: show amber banner at top of dialog:
  `"Some activities are incomplete. Review the flagged items before advancing — or proceed if you're satisfied this is acceptable."`
- Advance button always enabled (soft gate)

**Step 3 — Pass data from parent:**
`ProjectDetailClient` already holds `tasks`, `risks`, `stakeholders`, `changeRequests` in state. `wbsElements` is passed in as `initialWbsElements` prop (already fetched in `projects/[id]/page.tsx`). Store in local state and pass to the dialog.

> **Note:** After Issue D1 (lastEngagedDate) is implemented, upgrade the executing phase "Stakeholders identified for comms" check to: `stakeholders.some(s => s.lastEngagedDate != null)`.

---

### B2 · Issue 7 — Correct PMBOK 8 performance domains

**Files:** `src/components/tabs/measurement-tab.tsx`, `src/db/schema.ts`, `src/lib/domain-health.ts`

**Replace `DOMAINS` array** (PMBOK 7 → PMBOK 8):

```ts
// OLD (PMBOK 7 — 8 domains)
stakeholders | team | developmentApproach | planning | projectWork | delivery | measurement | uncertainty

// NEW (PMBOK 8 — 7 domains)
const DOMAINS = [
  { key: 'governance',   label: 'Governance',   color: 'from-violet-500 to-violet-400' },
  { key: 'scope',        label: 'Scope',        color: 'from-sky-500 to-sky-400'       },
  { key: 'schedule',     label: 'Schedule',     color: 'from-amber-500 to-amber-400'   },
  { key: 'finance',      label: 'Finance',      color: 'from-emerald-500 to-emerald-400'},
  { key: 'stakeholders', label: 'Stakeholders', color: 'from-rose-500 to-rose-400'     },
  { key: 'resources',    label: 'Resources',    color: 'from-blue-500 to-blue-400'     },
  { key: 'risk',         label: 'Risk',         color: 'from-orange-500 to-orange-400' },
] as const;
```

Update `DomainKey` type and `PerformanceDomains` type. Old JSONB data shows as "Not assessed" for new keys — no data migration needed.

`schema.ts`: update the `performanceDomains` JSONB type comment and key list.

`domain-health.ts`: audit for any references to old keys (`team`, `developmentApproach`, `planning`, `projectWork`, `delivery`, `measurement`, `uncertainty`) and replace with PMBOK 8 equivalents or remove.

---

### B3 · Issue 9 — EVM Planned Value UX

**File:** `src/components/tabs/measurement-tab.tsx`

**1 — Below the PV input, add helper text:**
```
"Enter the budget approved for work scheduled to be complete as of today.
Formula: Budget At Completion × (elapsed days ÷ total project days).
Example: a £50,000 project 40% through its timeline → enter £20,000."
```

**2 — Improve `MetricCard` description strings** for all 6 metrics:

| Metric | Improved description |
|---|---|
| EV (Earned Value) | "Budget value of work actually completed. Derived from your task % complete × total budget." |
| AC (Actual Cost) | "Real money spent so far. Enter this via Budget Spent in project settings." |
| SPI (Schedule Perf. Index) | "≥ 1.0 = ahead of schedule. < 1.0 = behind. SPI = EV ÷ PV." |
| CPI (Cost Perf. Index) | "≥ 1.0 = under budget. < 1.0 = over budget. CPI = EV ÷ AC." |
| SV (Schedule Variance) | "EV − PV. Positive = ahead of plan. Negative = behind plan." |
| CV (Cost Variance) | "EV − AC. Positive = under budget. Negative = over budget." |

---

## Phase C — UX improvements (no schema changes)

### C1 · Issue 3 — WBS → Tasks with checklist + readable keyboard guide

**Files:** `src/actions/wbs.ts`, `src/components/wbs/wbs-keyboard-strip.tsx`, `src/components/project-detail-client.tsx` (TaskItem), `src/components/sortable-task-item.tsx`

**Part 1 — Auto-create task or checklist item on WBS element creation:**

In `createWbsElement`:

```
if data.parentId === null:
  → Insert into tasks: { projectId, userId, title: name, status: 'todo', priority: 'medium',
                         wbsElementId: element.id, orderIndex: MAX+1 }

if data.parentId !== null:
  → Find the task linked to the parent: SELECT id FROM tasks WHERE wbs_element_id = parentId
  → If found: append checklist item to that task's checklist_items JSONB array:
              { id: crypto.randomUUID(), text: name, done: false }
              UPDATE tasks SET checklist_items = checklist_items || $item WHERE id = parentTaskId
  → If not found: do nothing (parent has no linked task)
```

**Part 2 — Task card shows checklist progress:**

In `TaskItem` (list view) and `SortableTaskItem` (Kanban):
- If `task.checklistItems.length > 0`: show `"2/4 ✓"` progress chip below the task title
- Amber `WBS` badge when `task.wbsElementId` is set

**Part 3 — Checklist editing inside Edit Task dialog:**

In `EditTaskDialog`:
- Below the % Complete slider, add a "Checklist" section
- List each `{ text, done }` item with a checkbox and delete icon
- "+ Add item" input at the bottom
- Items saved as part of `updateTask` call (add `checklistItems` to `editTaskSchema`)

**Part 4 — Replace cryptic keyboard strip:**

`wbs-keyboard-strip.tsx` — replace the icon-only keycap strip with readable text:

```
Enter  New sibling   Tab  Add child   Shift+Tab  Promote   Esc  Cancel
```

Render as a row of `<kbd>` elements with a short text label after each. Add a collapsible "?" toggle so experienced users can hide it.

---

### C2 · Issue 8 — PMBOK 8 principles

**Files:** `src/components/dashboard-client.tsx`, `src/actions/preferences.ts`, `src/components/tabs/charter-tab.tsx`, `src/components/tabs/risks-tab.tsx`, `src/components/tabs/stakeholders-tab.tsx`, `src/components/wbs/wbs-tab.tsx`, `src/components/tabs/measurement-tab.tsx`

**The 6 PMBOK 8 principles:**
1. Adopt a holistic view
2. Focus on value
3. Embed quality into processes & deliverables
4. Be an accountable leader
5. Integrate sustainability within all project areas
6. Build an empowered culture

**Part 1 — Dashboard principles scorecard:**

New `PrinciplesScorecard` component in `dashboard-client.tsx`:
- Card with title "PMBOK 8 Principles Self-Assessment"
- 6 principle rows, each with a 1–5 button rating (same pattern as performance domains)
- "Save Assessment" button → calls `savePrinciplesReflection(scores)` server action
  - Action upserts `user_preferences.principles_reflection` JSONB: `{ holistic: 4, value: 3, ... }`
- After first save, card collapses to a summary chip row showing each principle's score and a small "Re-assess" button
- Position: below the portfolio health cards on the dashboard, above the projects grid

**Part 2 — Inline principle badges in tab headers:**

Add a small `<PrincipleBadge>` component: amber `P8` chip that on hover shows a tooltip with the principle name + one-line description.

| Tab | Principle |
|---|---|
| Charter header | "Be an accountable leader" + "Focus on value" |
| Risks tab header | "Adopt a holistic view" + "Integrate sustainability" |
| Stakeholders tab header | "Build an empowered culture" |
| WBS tab header | "Embed quality into processes & deliverables" |
| Measurement tab header | "Adopt a holistic view" + "Focus on value" |

---

## Phase D — Schema changes (one migration)

Run `drizzle/0005_issues_resolution.sql` in Supabase SQL Editor before deploying Phase D code.

```sql
ALTER TABLE stakeholders    ADD COLUMN IF NOT EXISTS last_engaged_date  timestamp;
ALTER TABLE user_preferences ADD COLUMN IF NOT EXISTS principles_reflection jsonb;
ALTER TABLE tasks            ADD COLUMN IF NOT EXISTS checklist_items   jsonb DEFAULT '[]'::jsonb;
ALTER TABLE tasks            ADD COLUMN IF NOT EXISTS start_date        timestamp;
```

### D1 · Issue 6 — Stakeholder last_engaged_date

**Files:** `src/db/schema.ts`, `src/components/tabs/stakeholders-tab.tsx`, `src/actions/stakeholders.ts`

- Drizzle: `lastEngagedDate: timestamp('last_engaged_date')` on `stakeholders` table
- Add/Edit stakeholder form: "Last Engaged" date input (type="date")
- Stakeholder card: shows "Last engaged: 5 days ago" (or "Never engaged" if null) as a subtle subline
- Server action `createStakeholder` / `updateStakeholder`: accept and persist `lastEngagedDate`

**Phase gate upgrade:** Update executing gate check "Stakeholder comms ongoing" to:
`stakeholders.some(s => s.lastEngagedDate != null)`

### D2 · Issue 8 storage — Principles reflection column

- Drizzle: `principlesReflection: jsonb('principles_reflection').$type<Record<string, number>>()` on `userPreferences`
- `savePrinciplesReflection` server action: upserts `user_preferences` row for current user with `principlesReflection` value

### D3 · Issue 3 storage — Task checklist items

- Drizzle: `checklistItems: jsonb('checklist_items').$type<{ id: string; text: string; done: boolean }[]>().default([])` on `tasks`
- `updateTask` server action: accept `checklistItems` array and persist

### D4 · Issue 5 storage — Task start date

- Drizzle: `startDate: timestamp('start_date')` on `tasks`
- `createTask` / `updateTask` server actions: accept `startDate`
- Add/Edit task form: "Start Date" date input (optional)

---

## Phase E — New feature: Documents & Reports tab

### E1 · Issues 4 & 5 — Documents & Reports

**Files:** `src/components/project-detail-client.tsx`, `src/components/tabs/reports-tab.tsx`, `src/lib/reports/types.ts`, `src/lib/reports/prompts.ts`

**Step 1 — Rename tab:**
`<TabsTrigger value="reports">Reports</TabsTrigger>` → `Documents & Reports`

**Step 2 — Add `category` to report definitions:**
In `types.ts`, add `category: 'report' | 'document'` to `ReportDefinition`. Existing 10 types get `category: 'report'`. New types get `category: 'document'`.

**Step 3 — New document types:**

| Type key | Title | Primary DB inputs |
|---|---|---|
| `project_management_plan` | Project Management Plan | All: charter + WBS + stakeholders + risks + tasks + budget + quality_metrics + schedule |
| `scope_management_plan` | Scope Management Plan | Charter (scope, deliverables, acceptance criteria) + WBS elements |
| `communications_management_plan` | Communications Management Plan | Stakeholders (name, role, influence, interest, communication_plan, engagement_strategy, last_engaged_date) + project phase |
| `risk_management_plan` | Risk Management Plan | Risks (all fields) + charter risk_approach + project category + current phase |
| `stakeholder_engagement_plan` | Stakeholder Engagement Plan | Stakeholders (all fields incl. last_engaged_date) + charter stakeholder_overview + current phase |

**Step 4 — Two-section layout in `reports-tab.tsx`:**

```
┌──────────────────────────────────────────────────────┐
│  📄 Project Documents                                │
│  ┌────────────────┐ ┌──────────────────┐ ┌────────┐ │
│  │ PM Plan        │ │ Scope Mgmt Plan  │ │ Comms  │ │
│  └────────────────┘ └──────────────────┘ └────────┘ │
│  ┌─────────────────────┐ ┌────────────────────────┐  │
│  │ Risk Mgmt Plan      │ │ Stakeholder Eng. Plan  │  │
│  └─────────────────────┘ └────────────────────────┘  │
├──────────────────────────────────────────────────────┤
│  📊 Project Reports                                  │
│  [existing 10 report cards]                          │
└──────────────────────────────────────────────────────┘
```

Documents use a slightly different card style (document icon instead of chart icon, "Generate Document" label instead of "Generate Report").

**Step 5 — Schedule baseline section (top of Documents & Reports tab):**

Above both sections, a "Schedule" strip:
- If `project.baselineStartDate` is null: `[Set Baseline]` button — on click, calls `updateProject({ baselineStartDate: project.startDate, baselineEndDate: project.targetEndDate })` → `router.refresh()`
- If baseline is set: shows baseline set date + `[Update Baseline]` button

**Step 6 — Gantt timeline view:**

After the baseline strip, a `<ScheduleTimeline>` component:

```
Project: ├──────────────────────────────────────────┤
         startDate                          targetEndDate
Baseline: ┊·····················┊ (dashed overlay)
Today:   ▼ (red marker)

TASKS:
Task A   ├────────┤            (startDate → dueDate bar)
Task B        ├──────────┤
Task C              ├────┤     (color = status)
```

Implementation: CSS-based with `position: absolute` bars inside a relative container. Width and left offset computed as percentage of total project duration. No new library. Color by status (todo=gray, in_progress=amber, done=emerald). Tasks without `startDate` show as milestone markers at `dueDate`.

**Step 7 — Prompts in `prompts.ts`:**

Each document type gets a detailed prompt per PMBOK 8 standard. The `buildReportPrompt` function handles both `'report'` and `'document'` types from the same switch. Document prompts produce longer structured outputs (aim for 1000–2000 tokens vs 500–800 for reports) and include standard PMBOK section headings.

---

## Execution order

```
A1 → A2 → A3    (bug fixes, ship first)
      ↓
B1 → B2 → B3    (logic, depends on A3 for progress data)
      ↓
C1 → C2         (UX, C1 depends on D3 schema column)
      ↓
D (run SQL in Supabase, then deploy D1–D4 code)
      ↓
E1              (new tab, depends on D4 for task startDate)
```

Ship A + B together as one commit (no schema changes, quick wins visible immediately).
Ship C after migration runs (checklist_items column needed).
Ship E last (most new surface area).

---

## All files touched

| File | Phases |
|---|---|
| `src/components/tabs/charter-tab.tsx` | A1, C2 |
| `src/components/project-detail-client.tsx` | A1, B1, C1, E1 |
| `src/components/tabs/reports-tab.tsx` | A2, E1 |
| `src/app/api/reports/generate/route.ts` | A2 |
| `src/actions/tasks.ts` | A3, C1, D3, D4 |
| `src/actions/projects.ts` | A3 |
| `src/lib/project-helpers.tsx` | A3 (recomputeProjectProgress helper) |
| `src/actions/wbs.ts` | C1 |
| `src/components/wbs/wbs-keyboard-strip.tsx` | C1 |
| `src/components/sortable-task-item.tsx` | C1 |
| `src/components/tabs/measurement-tab.tsx` | B2, B3 |
| `src/db/schema.ts` | B2, D1, D2, D3, D4 |
| `src/lib/domain-health.ts` | B2 |
| `src/components/dashboard-client.tsx` | C2 |
| `src/actions/preferences.ts` | C2, D2 |
| `src/components/tabs/risks-tab.tsx` | C2 |
| `src/components/tabs/stakeholders-tab.tsx` | C2, D1 |
| `src/components/wbs/wbs-tab.tsx` | C2 |
| `src/components/tabs/legacy-summary-tab.tsx` | — (no change) |
| `src/lib/reports/types.ts` | E1 |
| `src/lib/reports/prompts.ts` | E1 |
| `drizzle/0005_issues_resolution.sql` | D1–D4 |
| `src/app/(dashboard)/projects/[id]/page.tsx` | B1 (pass wbsElements to client) |
| `src/app/(dashboard)/dashboard/page.tsx` | C2 (fetch user_preferences for principles) |
