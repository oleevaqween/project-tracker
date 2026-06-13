# PMBOK 8 Structural Realignment — Implementation Plan

> **Status:** In Progress  
> **Do not commit until explicitly instructed.**

---

## Audit Findings (What Already Exists)

After reading the actual codebase, the initial build was more complete than initially assessed:

| Area | Status |
|---|---|
| Risk Register (table + actions + tab) | ✅ Already built |
| Stakeholder Register (table + actions + tab) | ✅ Already built |
| Issue Log (table + actions + tab) | ✅ Already built |
| Change Request Log (table + actions + tab) | ✅ Already built |
| Lessons Learned (table + actions + tab) | ✅ Already built |
| Charter tab | ✅ Already built |
| Notes tab | ✅ Already built |
| Reports tab | ✅ Already built |
| Portfolio detail page (KPIs, project grid, risk summary) | ✅ Already built |
| `budgetSpent` on projects (= AC for EVM) | ✅ In schema |
| `baselineStartDate/EndDate` on projects | ✅ In schema |
| `qualityMetrics` on projects (jsonb) | ✅ In schema |

**Genuinely missing / structurally wrong:**
- Dashboard shows flat all-projects view — not a true enterprise/cross-portfolio view
- Portfolio detail page has no PMBOK guide and uses a plain layout vs the rest of the app
- `programs` table does not exist (Portfolio → Program → Project hierarchy gap)
- No EVM fields: `earnedValue (EV)` and `plannedValue (PV)` not in schema
- No `performanceDomains` health field on projects
- `currentFocusArea` is never labelled as "Life Cycle Phase" in the UI

---

## Phase 1 — Fix the Portfolio / Enterprise Layer

**Goal:** Dashboard becomes true enterprise view (cross-portfolio). Portfolio pages get PMBOK guide and proper header design.

### 1.1 — Dashboard: Per-Portfolio Breakdown
- [x] Fetch `portfolios` + `risks` in dashboard server page alongside existing queries
- [x] Compute per-portfolio aggregates (project count, avg progress, task completion, open risks, total budget) from already-fetched data — no extra DB round-trips
- [x] Add `portfolioBreakdown` prop to `DashboardClient`
- [x] Add a Portfolio Health section to dashboard below the existing KPI cards — one card per portfolio showing its health at a glance
- [x] Show unassigned projects count (projects with no portfolioId) separately
- [x] Update dashboard hero subtitle to reference portfolios (e.g. "Across N portfolios")
- [x] Update PMBOK guide context on dashboard from `"dashboard"` to reflect enterprise framing

**Files:** `src/app/(dashboard)/dashboard/page.tsx`, `src/components/dashboard-client.tsx`

### 1.2 — Portfolio Detail Page: PMBOK Guide + Header Design
- [x] Add PMBOK guide component with `"portfolio"` context
- [x] Add full-width header band (matching projects/tasks page pattern) with eyebrow, h1, subtitle, KPI counter on right
- [x] Portfolio detail already has KPI strip, project grid, risk summary — keep those, just enhance the page frame

**Files:** `src/components/portfolio-detail-client.tsx`

### 1.3 — Portfolios List Page
- [x] Verify PMBOK guide exists; add if missing
- [x] Richer portfolio cards showing project count and avg progress

**Files:** `src/app/(dashboard)/portfolios/page.tsx`, `src/components/portfolios-client.tsx`

---

## Phase 2 — Add the Program Layer

**Goal:** Portfolio → Program → Projects hierarchy. Programs optional — standalone projects remain valid.

### 2.1 — Database Schema
- [ ] Add `programs` table:
  ```
  id, userId, portfolioId (FK → portfolios, nullable),
  name, description, status (active | completed | on_hold | cancelled),
  objectives, startDate, targetEndDate, createdAt, updatedAt
  ```
- [ ] Add optional `programId` (FK → programs, nullable) to `projects` table
- [ ] Generate and run Drizzle migration

**Files:** `src/db/schema.ts`, new migration file

### 2.2 — Server Actions
- [ ] `src/actions/programs.ts`: createProgram, updateProgram, deleteProgram, getProgramsByPortfolio, assignProjectToProgram

### 2.3 — Program Pages & UI
- [ ] `/programs` — list page (all programs across portfolios, grouped by portfolio)
- [ ] `/programs/[id]` — detail page (aggregate project health, description, actions)
- [ ] `CreateProgramDialog` component
- [ ] Update `CreateProjectDialog` + project edit: add optional "Program" dropdown
- [ ] Add "Programs" to sidebar between Portfolios and Projects
- [ ] PMBOK guide with `"program"` context on program pages

**Files:** New pages, new components, `src/components/app-sidebar.tsx`, `src/components/create-project-dialog.tsx`

---

## Phase 3 — Project Artifacts ✅ COMPLETE

All five PMBOK 8 artifact registers are fully built:
- Risk Register, Stakeholder Register, Issue Log, Change Log, Lessons Learned
- Each has: database table, server action file, tab component, wired into project detail

No further work needed here unless functional bugs are found during testing.

---

## Phase 4 — Earned Value Management (EVM)

**Goal:** Turn budget tracking into real PMBOK 8 Measurement domain support.

### 4.1 — Database Schema
Already available:
- `budget` = BAC (Budget at Completion) ✓
- `budgetSpent` = AC (Actual Cost) ✓
- `progressPercent` → can approximate EV = progressPercent% × BAC

Still need to add to `projects`:
- [ ] `plannedValue` (PV) — numeric, nullable — what value of work was PLANNED to be done by today
- [ ] `earnedValue` (EV) — numeric, nullable — override field (if null, auto-compute from progressPercent × budget)

**Files:** `src/db/schema.ts`, new migration

### 4.2 — Computed Metrics (client-side, no DB storage)
```
SPI  = EV / PV          (>1 = ahead of schedule)
CPI  = EV / AC          (>1 = under budget)
SV   = EV − PV          (positive = ahead)
CV   = EV − AC          (positive = under budget)
EAC  = BAC / CPI        (Estimate at Completion)
ETC  = EAC − AC         (Estimate to Complete)
VAC  = BAC − EAC        (Variance at Completion)
```

### 4.3 — Measurement Tab on Project Detail
- [ ] New "Measurement" tab (or update existing overview) showing:
  - PV and EV input fields (BAC comes from existing budget field, AC from budgetSpent)
  - Computed EVM metric cards with colour coding (green ≥1.0, amber 0.8–1.0, red <0.8)
  - Brief PMBOK 8 explanation of each metric
- [ ] Portfolio detail: show avg CPI and SPI across contained projects, flag at-risk projects

**Files:** `src/components/tabs/measurement-tab.tsx` (new), `src/components/project-detail-client.tsx`

---

## Phase 5 — Life Cycle Phase & Performance Domain Realignment

**Goal:** Correctly surface PMBOK 8's concurrent performance domains alongside life cycle phases.

### 5.1 — Rename `currentFocusArea` Display Label
- [ ] Change every UI label of "Focus Area" / "Current Phase" to **"Life Cycle Phase"**
- [ ] Keep existing values (Initiating → Closing) — they are valid PMBOK 8 life cycle phases
- [ ] Update PMBOK guide tooltip/card copy to clarify these are life cycle phases, not performance domains

**Files:** `src/lib/project-helpers.tsx`, `src/components/project-detail-client.tsx`, `src/components/focus-area-stepper.tsx`

### 5.2 — Performance Domain Health Indicators
- [ ] Add `performanceDomains` JSONB to `projects` schema — stores 1–5 health rating per domain:
  ```json
  { "stakeholders":3, "team":4, "developmentApproach":3, "planning":4,
    "projectWork":3, "delivery":4, "measurement":3, "uncertainty":2 }
  ```
- [ ] Migration
- [ ] "Performance Domains" section on project detail: 8 domain tiles, editable 1–5 health rating
- [ ] Colour coding: 1–2 red, 3 amber, 4–5 green
- [ ] Radar/spider chart of all 8 domains on project overview

**Files:** `src/db/schema.ts`, migration, `src/components/project-detail-client.tsx`

---

---

## Phase 6 — Sidebar Navigation Reorganization (PMBOK-Aligned)

**Goal:** Replace the flat "Navigation" sidebar group with PMBOK-hierarchical groups that mirror the Enterprise → Portfolio Management → Execution → Knowledge & AI tiers.

### Current state (flat, single group):
```
Navigation
  Dashboard | Projects | Tasks | Portfolios | Analytics | Knowledge Base | Chat
```

### Target state (4 PMBOK-aligned groups):
```
ENTERPRISE
  Dashboard

PORTFOLIO MANAGEMENT
  Portfolios
  Programs          ← added in Phase 2
  Projects

EXECUTION
  Tasks
  Analytics

KNOWLEDGE & AI
  Knowledge Base
  Chat
```

### 6.1 — Sidebar Restructure
- [ ] Replace single `navItems` array + single `SidebarGroup` with four named groups, each with its own `SidebarGroupLabel`
- [ ] Add Programs link (implemented in Phase 2; sidebar update deferred here until the `/programs` page exists)
- [ ] Active state: `pathname.startsWith(href)` stays the same
- [ ] Collapsed (icon-only) mode: group labels hidden, icons remain — no change needed to existing icon logic

**Files:** `src/components/app-sidebar.tsx`

---

## Implementation Order

```
Phase 1 (Portfolio/Enterprise layer)      ✅ Done
  → Phase 2 (Program layer — new DB)      ← CURRENT
    → Phase 6 (Sidebar reorganization)    ← immediately after Phase 2
      → Phase 4 (EVM — DB + UI)
        → Phase 5 (Realignment — DB + UI)
```
Phase 3 is complete. Phases 4 + 5 share a migration — run together.

---

## Progress Tracker

| Phase | Status | Notes |
|---|---|---|
| 1 — Portfolio / Enterprise Layer | ✅ Complete | Dashboard enterprise view, portfolio breakdown, PMBOK guides added |
| 2 — Program Layer | ✅ Complete | programs table, programId on projects, server actions, pages, UI components |
| 3 — Project Artifacts | ✅ Complete | All tabs + actions already built |
| 4 — EVM | ✅ Complete | plannedValue in schema; Measurement tab with SPI/CPI/SV/CV/EAC/ETC/VAC |
| 5 — Phase/Domain Realignment | ✅ Complete | "Focus Area" → "Life Cycle Phase"; performanceDomains JSONB; 8-domain self-assessment in Measurement tab |
| 6 — Sidebar Reorganization | ✅ Complete | 4 PMBOK groups: Enterprise, Portfolio Management, Execution, Knowledge & AI |
