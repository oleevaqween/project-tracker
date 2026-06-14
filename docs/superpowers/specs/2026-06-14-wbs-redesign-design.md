# WBS Redesign — Design Spec
**Date:** 2026-06-14
**Status:** Approved for implementation

---

## 1. Problem Statement

The current WBS implementation blends two distinct PMBOK 8 concepts into a single "Tasks" entity:
- **WBS elements** (deliverables — the WHAT, lives in Scope Management)
- **Activities** (work actions — the HOW, lives in Schedule Management)

This violates PMBOK 8's separation between the Scope Baseline (WBS + WBS Dictionary + Scope Statement) and the Activity List (Schedule Management). It also prevents proper change governance — scope changes and schedule changes are indistinguishable.

The app's core purpose is strict PMBOK 8 alignment with ease of use. This redesign addresses the gap.

---

## 2. Core Design Decisions

### 2.1 Project Mode Toggle
Every project has a mode: **Use WBS** or **Use Tasks**.

- Chosen at project creation via a two-card selector UI
- Accessible again from project settings for the upgrade path
- **Default: Use WBS** (reflects the app's PMBOK 8 purpose)
- Clean addition going forward — existing tasks and projects are untouched

### 2.2 Separation of Concerns
- **WBS tab** — scope and deliverables only (WBS elements, work packages, WBS Dictionary)
- **Tasks tab** — activities only (work actions derived from work packages)
- Connected by a visible bridge: each activity shows its parent work package; each work package shows activity count and completion rollup

### 2.3 Change Request Routing
When filing a change request, the app asks:
> *"Does this change a deliverable or outcome (scope change) or the work being done (schedule change)?"*

Scope changes trigger formal Integrated Change Control. Schedule changes are handled at PM level. This distinction is now enforceable because WBS and activities are separate.

### 2.4 Upgrade Path (Tasks → WBS)
A "Use Tasks" project can upgrade to "Use WBS" at any time. The upgrade is triggered:
- Manually via project settings
- By the app at PMBOK milestone moments:
  - Focus area transition: Planning → Executing
  - First change request filed
  - First risk logged

**Upgrade prompt (three options — never blocking):**
> *"Before you move to Executing, PMBOK 8 recommends a baselined WBS. You have X tasks with no deliverable structure. Building your WBS now takes about 5 minutes."*
>
> **[Build WBS Now]** · **[Remind Me Later]** · **[Skip, I Understand the Risk]**

On upgrade, existing tasks become **unassigned activities** — preserved in full, visible in the Tasks tab, waiting to be linked to work packages.

---

## 3. WBS Builder UX

### 3.1 Entry Point
"Use WBS" projects land on the WBS tab first. If the WBS is empty, the builder is shown immediately with a welcoming empty state.

### 3.2 Tree Editor
Inline, keyboard-driven tree editor. No forms or dialogs for structure building.

| Key | Action |
|-----|--------|
| `Enter` | Add next sibling |
| `Tab` | Indent (make child of node above) |
| `Shift+Tab` | Outdent (promote to parent level) |
| `Esc` | Cancel / exit editing |

WBS codes assign automatically as the tree is built (1, 1.1, 1.1.1 etc.) and are stored on creation — not generated at render time.

### 3.3 Keyboard Instruction UI
Two layers — always visible and contextual:

**Keyboard chip strip** (always visible above the tree editor):
- A row of keycap-styled chips in IBM Plex Mono
- Shows: `↵ New item` · `⇥ Indent` · `⇧⇥ Outdent` · `Esc Cancel`
- Styled as physical keys — slight border, subtle shadow, retro-futurist aesthetic
- Ambient — part of the UI furniture, not a tooltip

**Contextual ghost text** (inside the active input, changes with context):
- First node: *"Type a deliverable name, then hit ↵"*
- After first Enter: *"↵ next · ⇥ indent · ⇧⇥ outdent"*
- Once user is past the learning stage: ghost text disappears

### 3.4 Node Types
The tree distinguishes between two node types visually:
- **WBS Element** — has children, represents a grouping deliverable
- **Work Package** — leaf node, lowest-level deliverable, can have activities assigned

Work packages are visually distinct (subtle amber left accent or badge) so users understand this is where activities are derived from.

---

## 4. WBS Dictionary

Each WBS node can be expanded to reveal dictionary fields. Three tiers of progressive disclosure.

### Tier 1 — Captured in the tree (zero extra clicks)
- WBS Code (auto-assigned, stored)
- Deliverable Name

### Tier 2 — Revealed on node expand (essential fields)
- **Description** — what this deliverable is and what "done" looks like
- **Acceptance Criteria** — how the deliverable will be verified as complete
- **Responsible Party** — who owns this work package
- **Estimated Cost** — budget allocated to this work package

These fields have proper database columns — they feed into cost rollups, ownership queries, and activity linking.

### Tier 3 — Advanced dictionary (one more click, collapsed by default)
- Milestones
- Resources Required
- Quality Requirements
- Assumptions and Constraints

Stored as a `dictionaryDetails` JSONB field — same pattern as `charter` and `qualityMetrics` in the existing schema.

### Dictionary completeness incentive
> *"Your WBS Dictionary is 60% complete — fill in Tier 3 fields to unlock the Full Scope Baseline Report"*

---

## 5. Reports Unlocked by Data Completeness

| Data filled | Report available |
|---|---|
| Tier 1 only | WBS Structure — tree view, codes, names |
| Tier 1 + Tier 2 | WBS Dictionary Report — description, acceptance criteria, ownership, cost summary |
| All three tiers | Full Scope Baseline Report — PMBOK 8 compliant, shareable with sponsors |

---

## 6. WBS Completeness Indicator

Appears on **"Use Tasks" mode projects only**. Option C — two levels of visibility.

### Level 1 — Project card (Projects page)
A small amber dot with "WBS" label on the card. Minimal, does not clutter the card design. Signals the gap when scanning the projects grid.

### Level 2 — Project detail page banner
A slim banner between the page header and tab bar. Visible on all tabs.

```
⬡ WBS not defined — 8 tasks have no deliverable assigned.
  Scope may be incomplete.   [Build WBS]   [Learn more]
```

Specific language — not just a percentage. Tells the user exactly what is missing and why it matters. Doubles as a teaching tool for learners.

---

## 7. Toggle UI — Project Creation

### Location
- Create Project dialog (primary)
- Project settings / edit (for upgrade path)

### Design
Two illustrated cards side by side, selectable as a radio group:

**Card 1 — Use WBS** (default selected)
- Icon: hierarchical tree symbol
- Headline: *Use WBS*
- Body: *Deliverable-first. Build scope structure before execution.*
- Badge: *PMBOK 8 Recommended*
- Sub-label: *Best for: formal PMs, client projects, governance reporting*

**Card 2 — Use Tasks**
- Icon: list symbol
- Headline: *Use Tasks*
- Body: *Activity-first. Jump straight into tasks. WBS optional later.*
- Sub-label: *Best for: quick starts, learning PMBOK, personal projects*

Selected card: amber primary border, subtle background tint.
Unselected card: muted.

Reassurance label beneath both cards:
> *"You can switch modes anytime from project settings."*

---

## 8. Data Architecture (Schema Changes)

### New table: `wbs_elements`
| Column | Type | Notes |
|---|---|---|
| `id` | serial PK | |
| `project_id` | integer FK → projects | cascade delete |
| `user_id` | varchar(36) FK → profiles | |
| `parent_id` | integer FK → wbs_elements | self-referential, null = root |
| `wbs_code` | varchar(20) | stored on creation, e.g. "1.2.3" |
| `name` | varchar(255) | the deliverable name |
| `node_type` | varchar(20) | 'element' or 'work_package' |
| `description` | text | Tier 2 |
| `acceptance_criteria` | text | Tier 2 |
| `responsible_party` | varchar(255) | Tier 2 |
| `estimated_cost` | numeric(12,2) | Tier 2 |
| `dictionary_details` | jsonb | Tier 3 (milestones, resources, quality, assumptions) |
| `order_index` | integer | for sibling ordering |
| `created_at` | timestamp | |
| `updated_at` | timestamp | |

### Modified table: `projects`
| Column | Type | Notes |
|---|---|---|
| `use_wbs` | boolean | default true — new projects default to WBS mode |

### Modified table: `tasks`
| Column | Type | Notes |
|---|---|---|
| `wbs_element_id` | integer FK → wbs_elements | null = unassigned activity, set null on delete |

---

## 9. What Stays Unchanged

- All existing tasks, projects, and data — untouched
- Current Kanban view — unchanged
- Current task fields (predecessorId, parentId, wbsCode on tasks) — preserved
- The existing WBS tree view on tasks — remains available for "Use Tasks" projects

---

## 10. Out of Scope for This Build

- AI-assisted WBS suggestion (grouping tasks into deliverables automatically) — future enhancement
- Public WBS sharing / export to PDF — future enhancement
- Multi-user WBS collaborative editing — future enhancement
