# Project Tracker — State-of-the-Art Personal Portfolio Hub with RAG AI Assistant

## Context

Build a personal project portfolio + management hub for solo creators/developers. The app combines project showcase (portfolio) with project management (tasks, notes, docs) and a full RAG-powered AI assistant that can chat with your data, auto-suggest, draft descriptions, summarize progress, and generate reports. Must be visually stunning with dynamic animations. Budget: **$5-7/month tier** (OpenAI embeddings + gpt-4o-mini + Cohere rerank). Cloud-hosted. Beginner-friendly frontend.

The project management layer follows the **PMI PMBOK® Guide – Eighth Edition (2025)** — the industry gold standard — so every project tracked in this app is managed through a structured, professional framework.

---

## AI-Assisted Development

This project is built with **Claude Sonnet 4.6** and **GLM-5.1** as pair-programming assistants. This changes the timeline fundamentally.

### What AI Pair Programming Changes

| Task Type | Solo Developer | With Claude + GLM | Compression |
|---|---|---|---|
| Boilerplate (layouts, CRUD, forms) | 2-3 days | 2-4 hours | ~90% |
| Complex integrations (RAG, AI SDK, pgvector) | 1-2 weeks | 2-3 days | ~70% |
| Database schema + migrations | 1-2 days | 2-4 hours | ~85% |
| Debugging errors | 1-3 days | 2-8 hours | ~60% |
| UI components (animations, charts) | 3-5 days | 1-2 days | ~70% |
| Account setup / environment config | 1-2 days | 1-2 days | 0% (external) |
| Testing & QA in browser | 2-3 days | 1-2 days | ~40% |

### Corrected Timeline

**Original estimate (solo):** 10 weeks
**Corrected estimate (with AI pair programming):** **4–5 weeks full-time** (6-8h/day) or **6–8 weeks part-time** (3-4h/day)

| Phase | Original | AI-Assisted | Savings |
|---|---|---|---|
| Phase 1: Foundation | 2 weeks | 4 days | 60% |
| Phase 2: Visual Excellence | 2 weeks | 3 days | 70% |
| Phase 3: RAG + Knowledge Base | 3 weeks | 5-6 days | 65% |
| Phase 4: PMBOK Features + Analytics | 2 weeks | 6-7 days | 50% |
| Phase 5: Portfolio + Deployment | 1 week | 3 days | 57% |
| **Total** | **10 weeks** | **~4.5 weeks** | **~55%** |

### How to Use AI Assistance Effectively

- **Paste errors directly** into the chat — Claude diagnoses and fixes, GLM cross-checks
- **Describe components in plain English** — AI generates the full component file
- **Ask for the whole file, not snippets** — avoid patchwork code
- **Always read and understand what AI generates** before running it — you are the architect, AI is the typist
- **Use GLM for a second opinion** when Claude's output seems off, and vice versa
- **Verify AI SDK version numbers** before using — AI may reference outdated package versions

### AI Handoff Protocol

This plan is structured for **GLM-5.1** and **Claude Sonnet 4.6** working in relay. Each task is tagged `[GLM]` or `[CLAUDE]`. Transition points are marked with a `🔁 HANDOFF` block.

**If you are an AI reading this plan:**
- Only work on tasks tagged with your model name.
- When you reach a `🔁 HANDOFF` block, **stop immediately** and deliver the handoff message to Praise verbatim before doing anything else.
- Do not proceed past a handoff block unless Praise explicitly says "continue."
- If Praise says "continue," proceed but note in your response which model would normally own this task and why.

**Why this split exists:** GLM-5.1 handles boilerplate, UI, and standard patterns to conserve Claude tokens. Claude Sonnet 4.6 handles security-critical code (RLS, auth, rate limiting), architecture decisions, complex integrations (RAG pipeline, AI SDK), and hard bugs. The wrong model on the wrong task is the #1 source of subtle, expensive-to-debug errors in this project.

> **Critical note on the Vercel AI SDK:** The plan references specific AI SDK APIs. Before starting Phase 3, run `npm info ai version` to confirm the installed version matches the API surface you are coding against. AI assistants may reference APIs from older versions.

---

## Tech Stack

| Layer | Technology | Why |
|---|---|---|
| **Framework** | Next.js 15 (App Router) | Server Components, built-in API routes, streaming for AI, zero-config Vercel deploy, massive tutorial ecosystem |
| **Language** | TypeScript | Drizzle ORM is TS-first — schemas auto-generate types |
| **Styling** | Tailwind CSS v4 | oklch colors, utility-first, pairs perfectly with shadcn/ui |
| **Components** | shadcn/ui | You own the code, 50+ beautiful components, Radix primitives for accessibility |
| **Animations** | Framer Motion 11 | Declarative, composable motion primitives, layout animations, AnimatePresence |
| **Drag & Drop** | @dnd-kit/core + @dnd-kit/sortable | Headless DnD primitives for Kanban; Framer Motion handles the *animation* after drop, @dnd-kit handles the *interaction* |
| **Charts** | Recharts | Declarative, composable, animates well with Framer Motion |
| **Forms** | React Hook Form + Zod | Uncontrolled = no re-render per keystroke, auto-renders Zod errors |
| **Database** | Supabase (PostgreSQL) | Free tier: 500MB DB + 1GB storage + 50K MAU auth + pgvector + Realtime + RLS |
| **ORM** | Drizzle ORM | Native `vector` column, HNSW index, `cosineDistance` built-in, TS-first, lightweight |
| **Auth** | Supabase Auth | Built into free tier, email + Google OAuth, RLS ties to `auth.uid()` |
| **AI SDK** | Vercel AI SDK (verify current version) | `streamText` for streaming chat, `embed`/`embedMany` for embeddings, `useChat` hook |
| **Vector Search** | pgvector (via Supabase) | HNSW index + hybrid search (cosine + full-text with RRF) |
| **Hosting** | Vercel Hobby (free) | Zero-config Next.js deploy, 100GB bandwidth |

---

## PMI PMBOK® Guide — Eighth Edition (2025) Integration

The PMBOK® Guide – Eighth Edition was released November 2025. It is the most significant structural update since PMBOK® 7, blending principles-based mindset guidance with reintroduced process structure. This project tracker implements the PMBOK 8th Edition framework so every project you manage follows the industry gold standard.

### PMBOK 8th Edition Architecture Overview

```
┌─────────────────────────────────────────────────────────────────┐
│                    6 CORE PRINCIPLES                            │
│  (The "why" — values and behaviors that guide decision-making)  │
├─────────────────────────────────────────────────────────────────┤
│                   7 PERFORMANCE DOMAINS                         │
│  (The "what" — key areas of focus throughout the project)       │
├─────────────────────────────────────────────────────────────────┤
│                     5 FOCUS AREAS                               │
│  (The "when" — lifecycle stages from start to close)            │
│         + 40 NON-PRESCRIPTIVE PROCESSES                         │
│  (The "how" — adaptable practices within each stage)            │
└─────────────────────────────────────────────────────────────────┘
```

### The 6 Core Principles

These principles are the philosophical backbone of PMBOK 8. They are embedded in the app's AI assistant system prompt so the AI gives project advice aligned with these values.

| # | Principle | Meaning for This App |
|---|---|---|
| 1 | **Adopt a Holistic View** | AI assistant considers cross-project impacts when giving advice. Domain health dashboard shows the whole picture, not just one area. |
| 2 | **Focus on Value** | Progress is measured by outcomes (completed goals, stakeholder satisfaction) not just activity (tasks done). AI-generated reports emphasize value delivered. |
| 3 | **Embed Quality** | Quality checkpoints are built into the Executing focus area, not appended at the end. The charter requires acceptance criteria upfront. |
| 4 | **Lead Accountably** | Change requests require documented rationale. Decisions are logged in the activity feed with owner attribution. |
| 5 | **Integrate Sustainability** | Project closure includes a lessons learned review and knowledge handoff. Long-term impact is captured in the charter. |
| 6 | **Build Empowered Teams** | Stakeholder register tracks engagement strategies. AI suggests delegation and team empowerment approaches. |

### The 7 Performance Domains

Each performance domain maps to a dedicated section/tab within the project detail view.

| Domain | Description | App Features |
|---|---|---|
| **Governance** | Decision frameworks, strategic alignment, change control, accountability | Project Charter, Change Request Log, Activity Log, Integrated Change Control |
| **Scope** | Requirements definition, WBS, deliverable validation and control | WBS View on Tasks, Requirements in Charter, Validate Scope checklist |
| **Schedule** | Activity definition, sequencing, duration estimates, timeline management | Kanban board, task due dates, velocity charts, schedule baseline |
| **Finance** | Budget planning, cost estimation, spend tracking, ROI | Budget field on projects, cost estimates on tasks, AI usage cost tracker |
| **Risk** | Risk identification, qualitative/quantitative analysis, response planning | Risk Register with probability/impact matrix, AI risk suggestions |
| **Resources** | Team planning, resource acquisition, team development, utilization | Stakeholder Register, task assignment, resource calendar (future) |
| **Stakeholders** | Stakeholder identification, engagement planning, communication management | Stakeholder Register with power/interest grid, engagement tracking |

> **Note on Communications:** PMBOK 8 folds Communications into the Stakeholders domain — there is no separate Communications domain. Communication plans and records live in the Stakeholder Register.

### The 5 Focus Areas (Process Groups)

PMBOK 8 renames Process Groups as "Focus Areas" to signal they are approach-agnostic (work in predictive, agile, or hybrid contexts). Every project in the app has a current Focus Area shown on the project card and detail page.

```
Initiating ──► Planning ──► Executing ──► Monitoring & Controlling ──► Closing
    │              │             │                    │                    │
  Charter       Baselines    Deliverables          Variance            Lessons
  Stakeholders  WBS/Schedule  Team Mgmt            Change Control      Handoff
  Authorization Risk Register  Procurement         Performance Rpt     Sign-off
```

### The 40 Processes — Organized by Domain and Focus Area

The app supports all 40 non-prescriptive PMBOK 8 processes. Each process maps to an app feature or AI-assisted workflow.

#### Governance Domain (7 processes)

| Process | Focus Area | App Feature |
|---|---|---|
| Develop Project Charter | Initiating | Charter page — structured form with AI draft assist |
| Develop Project Management Plan | Planning | Project settings — baseline configuration |
| Direct and Manage Project Work | Executing | Dashboard, task CRUD, activity log |
| Manage Project Knowledge | Executing | Notes, Documents, Lessons Learned page |
| Monitor and Control Project Work | Monitoring & Controlling | Analytics dashboard, domain health indicators |
| Perform Integrated Change Control | Monitoring & Controlling | Change Request log with approval workflow |
| Close Project or Phase | Closing | Project closure checklist + lessons learned summary |

#### Scope Domain (6 processes)

| Process | Focus Area | App Feature |
|---|---|---|
| Plan Scope Management | Planning | Scope section in Project Charter |
| Collect Requirements | Planning | Requirements field in charter + notes |
| Define Scope | Planning | Project description + deliverables list |
| Create WBS | Planning | WBS tree view on Tasks page (hierarchical with WBS codes) |
| Validate Scope | Monitoring & Controlling | Acceptance criteria checklist per deliverable |
| Control Scope | Monitoring & Controlling | Change requests that affect scope |

#### Schedule Domain (6 processes)

| Process | Focus Area | App Feature |
|---|---|---|
| Plan Schedule Management | Planning | Schedule baseline in project settings |
| Define Activities | Planning | Task creation with WBS parent linkage |
| Sequence Activities | Planning | Task dependency field (predecessor task) |
| Estimate Activity Durations | Planning | Estimated hours field on tasks |
| Develop Schedule | Planning | Kanban board + Gantt-style timeline view |
| Control Schedule | Monitoring & Controlling | Velocity chart, overdue task tracking |

#### Finance Domain (4 processes)

| Process | Focus Area | App Feature |
|---|---|---|
| Plan Cost Management | Planning | Budget field in Project Charter |
| Estimate Costs | Planning | Estimated cost field on tasks |
| Determine Budget | Planning | Rolled-up budget = sum of task estimates |
| Control Costs | Monitoring & Controlling | Actual vs. estimated cost tracker, AI API cost log |

#### Risk Domain (7 processes)

| Process | Focus Area | App Feature |
|---|---|---|
| Plan Risk Management | Planning | Risk management approach in Charter |
| Identify Risks | Planning | Risk Register — AI suggests risks based on project type |
| Perform Qualitative Risk Analysis | Planning | Probability × Impact matrix (5×5 grid) |
| Perform Quantitative Risk Analysis | Planning | Expected Monetary Value field on risks |
| Plan Risk Responses | Planning | Response type (Avoid/Mitigate/Transfer/Accept) + action |
| Implement Risk Responses | Executing | Risk linked to tasks; status tracked |
| Monitor Risks | Monitoring & Controlling | Risk status dashboard, open risks on project overview |

#### Resources Domain (6 processes)

| Process | Focus Area | App Feature |
|---|---|---|
| Plan Resource Management | Planning | Resource plan section in Charter |
| Estimate Activity Resources | Planning | Assignee + effort estimate on tasks |
| Acquire Resources | Executing | Stakeholder register (team members) |
| Develop Team | Executing | Notes/docs for onboarding, training records |
| Manage Team | Executing | Task assignment, status tracking per person |
| Control Resources | Monitoring & Controlling | Resource utilization view (tasks per person) |

#### Stakeholders Domain (4 processes — includes Communications)

| Process | Focus Area | App Feature |
|---|---|---|
| Identify Stakeholders | Initiating | Stakeholder Register — AI suggests stakeholders based on project type |
| Plan Stakeholder Engagement | Planning | Engagement strategy + communication plan per stakeholder |
| Manage Stakeholder Engagement | Executing | Engagement status tracking, notes per stakeholder |
| Monitor Stakeholder Engagement | Monitoring & Controlling | Stakeholder engagement health on domain dashboard |

### How PMBOK 8 Principles Are Embedded in the AI Assistant

The AI chat assistant uses a PMBOK-aware system prompt that:
1. Frames suggestions through the 6 Core Principles
2. References the correct Performance Domain when answering questions
3. Identifies which Focus Area a question belongs to and answers appropriately
4. Uses process names when generating structured advice (e.g., "This sounds like a Perform Integrated Change Control situation...")
5. Can generate: Project Charters, Risk Registers, Stakeholder Registers, Lessons Learned summaries, and Progress Reports aligned to PMBOK 8 structure

---

## Database Schema (15 tables)

```
User (Supabase Auth)
  ├── profiles (username slug for public portfolio URL)
  ├──< Project (name, description, status, category, dates, progress, cover, isPublic, currentFocusArea, budget)
  │      ├──< Task (title, description, status, priority, due, order, parentId for subtasks, wbsCode, estimatedHours, estimatedCost, predecessorId)
  │      ├──< Note (title, markdown content)
  │      ├──< Document (uploaded file metadata + processing status)
  │      │      └──< DocumentChunk (content, embedding vector(1536), tsvector for FTS)
  │      ├──< Tag (many-to-many via project_tags)
  │      ├──< ActivityLog (entity, action, description, metadata)
  │      ├──< Stakeholder (name, role, interest, influence, engagementStrategy, communicationPlan, status)
  │      ├──< Risk (title, probability, impact, riskScore, responseType, responseAction, owner, status)
  │      ├──< ChangeRequest (title, changeType, impact, status, approvedBy)
  │      └──< LessonsLearned (title, description, category, phase, recommendation)
  ├──< ChatSession (title, optional projectId scope)
  │      └──< ChatMessage (role, content, sources JSON, model, tokenUsage)
  └──< AIUsageLog (operation, model, tokens, cost estimate, latency)
```

**Key schema details:**
- `document_chunks.embedding` uses `vector(1536)` dims (matching OpenAI text-embedding-3-small)
- HNSW index with `vector_cosine_ops` (m=16, ef_construction=64)
- `search_vector` is a native PostgreSQL `tsvector` column populated by trigger
- `hybrid_search()` SQL RPC combines cosine similarity + full-text search with Reciprocal Rank Fusion (RRF, k=60)
- Content hashes on chunks for idempotent re-ingestion
- `tasks.parentId` has a proper self-referencing FK constraint for subtask integrity
- `tasks.wbsCode` stores WBS numbering (e.g., "1.2.3") for PMBOK Scope domain
- `projects.currentFocusArea` tracks which PMBOK Focus Area the project is in
- `profiles` table provides username slugs for public portfolio URLs and stores per-user AI config (provider, model, API key)

**File:** `src/db/schema.ts` — single source of truth, all tables + relations + indexes

### Drizzle ORM Schema (TypeScript)

```typescript
import { pgTable, serial, text, varchar, timestamp, integer,
         boolean, jsonb, vector, index, unique, numeric, foreignKey } from 'drizzle-orm/pg-core';
import { relations, sql } from 'drizzle-orm';

// ============ PROFILES ============
export const profiles = pgTable('profiles', {
  id: varchar('id', { length: 36 }).primaryKey(), // Supabase auth.uid()
  username: varchar('username', { length: 50 }).notNull().unique(), // for /portfolio/[username]
  displayName: varchar('display_name', { length: 255 }),
  bio: text('bio'),
  avatarUrl: text('avatar_url'),
  aiConfig: jsonb('ai_config').$type<{
    provider: 'openai' | 'openrouter' | 'google' | 'anthropic' | 'ollama';
    model: string;           // e.g. 'gpt-4o-mini', 'claude-sonnet-4-6-20250514'
    apiKeyEncrypted?: string; // encrypted API key (server-side only)
    baseUrl?: string;         // for OpenRouter or custom endpoints
  }>().default({ provider: 'openai', model: 'gpt-4o-mini' }),
  createdAt: timestamp('created_at').notNull().defaultNow(),
  updatedAt: timestamp('updated_at').notNull().$onUpdate(() => new Date()),
});

// ============ PROJECTS ============
export const projects = pgTable('projects', {
  id: serial('id').primaryKey(),
  userId: varchar('user_id', { length: 36 }).notNull(),
  name: varchar('name', { length: 255 }).notNull(),
  description: text('description'),
  status: varchar('status', { length: 50 }).notNull().default('planning'),
  // planning | in_progress | on_hold | completed | archived
  currentFocusArea: varchar('current_focus_area', { length: 50 }).default('initiating'),
  // initiating | planning | executing | monitoring_controlling | closing
  category: varchar('category', { length: 100 }),
  startDate: timestamp('start_date'),
  targetEndDate: timestamp('target_end_date'),
  completedDate: timestamp('completed_date'),
  budget: numeric('budget', { precision: 12, scale: 2 }), // planned budget
  progressPercent: integer('progress_percent').default(0), // manually set; AI can update from task data
  coverImage: text('cover_image'), // Supabase Storage URL
  isPublic: boolean('is_public').default(false), // portfolio visibility
  createdAt: timestamp('created_at').notNull().defaultNow(),
  updatedAt: timestamp('updated_at').notNull().$onUpdate(() => new Date()),
});

// ============ TASKS ============
export const tasks = pgTable('tasks', {
  id: serial('id').primaryKey(),
  projectId: integer('project_id').notNull().references(() => projects.id, { onDelete: 'cascade' }),
  title: varchar('title', { length: 500 }).notNull(),
  description: text('description'),
  status: varchar('status', { length: 50 }).notNull().default('todo'),
  // todo | in_progress | review | done
  priority: varchar('priority', { length: 20 }).default('medium'),
  // low | medium | high | critical
  dueDate: timestamp('due_date'),
  completedDate: timestamp('completed_date'),
  estimatedHours: numeric('estimated_hours', { precision: 6, scale: 2 }),
  estimatedCost: numeric('estimated_cost', { precision: 10, scale: 2 }),
  wbsCode: varchar('wbs_code', { length: 20 }), // e.g. "1.2.3" for WBS numbering
  predecessorId: integer('predecessor_id'), // task dependency (sequence activities)
  orderIndex: integer('order_index').notNull().default(sql`(SELECT COALESCE(MAX(order_index), 0) + 1 FROM tasks)`),
  parentId: integer('parent_id'),
  createdAt: timestamp('created_at').notNull().defaultNow(),
  updatedAt: timestamp('updated_at').notNull().$onUpdate(() => new Date()),
}, (table) => [
  foreignKey({ columns: [table.parentId], foreignColumns: [table.id] }).onDelete('set null'),
  foreignKey({ columns: [table.predecessorId], foreignColumns: [table.id] }).onDelete('set null'),
]);

// ============ NOTES ============
export const notes = pgTable('notes', {
  id: serial('id').primaryKey(),
  projectId: integer('project_id').notNull().references(() => projects.id, { onDelete: 'cascade' }),
  title: varchar('title', { length: 500 }).notNull(),
  content: text('content'), // Markdown content
  createdAt: timestamp('created_at').notNull().defaultNow(),
  updatedAt: timestamp('updated_at').notNull().$onUpdate(() => new Date()),
});

// ============ DOCUMENTS ============
export const documents = pgTable('documents', {
  id: serial('id').primaryKey(),
  projectId: integer('project_id').notNull().references(() => projects.id, { onDelete: 'cascade' }),
  userId: varchar('user_id', { length: 36 }).notNull(),
  fileName: varchar('file_name', { length: 500 }).notNull(),
  fileType: varchar('file_type', { length: 50 }).notNull(), // pdf, md, txt, etc.
  storagePath: text('storage_path').notNull(), // Supabase Storage path
  fileSizeBytes: integer('file_size_bytes'),
  contentHash: varchar('content_hash', { length: 64 }), // SHA-256 for dedup
  processingStatus: varchar('processing_status', { length: 50 }).default('pending'),
  // pending | processing | completed | failed
  processingError: text('processing_error'), // error message if status = failed
  createdAt: timestamp('created_at').notNull().defaultNow(),
});

// ============ DOCUMENT CHUNKS (RAG Vectors) ============
export const documentChunks = pgTable(
  'document_chunks',
  {
    id: serial('id').primaryKey(),
    documentId: integer('document_id').notNull().references(() => documents.id, { onDelete: 'cascade' }),
    projectId: integer('project_id').notNull().references(() => projects.id, { onDelete: 'cascade' }),
    chunkIndex: integer('chunk_index').notNull(),
    content: text('content').notNull(),
    contentHash: varchar('content_hash', { length: 64 }).notNull(),
    embeddingModel: varchar('embedding_model', { length: 100 }),
    embedding: vector('embedding', { dimensions: 1536 }),
    tokenCount: integer('token_count'),
    metadata: jsonb('metadata'), // {page_num, section, header, ...}
    createdAt: timestamp('created_at').notNull().defaultNow(),
  },
  (table) => [
    index('document_chunks_embedding_idx')
      .using('hnsw', table.embedding.op('vector_cosine_ops'))
      .with({ m: '16', ef_construction: '64' }),
    index('document_chunks_project_idx').on(table.projectId),
    index('document_chunks_content_hash_idx').on(table.contentHash),
  ]
);

// ============ TAGS ============
export const tags = pgTable('tags', {
  id: serial('id').primaryKey(),
  userId: varchar('user_id', { length: 36 }).notNull(),
  name: varchar('name', { length: 100 }).notNull(),
  color: varchar('color', { length: 7 }).default('#6366f1'),
  createdAt: timestamp('created_at').notNull().defaultNow(),
});

// ============ PROJECT-TAG JUNCTION ============
export const projectTags = pgTable('project_tags', {
  projectId: integer('project_id').notNull().references(() => projects.id, { onDelete: 'cascade' }),
  tagId: integer('tag_id').notNull().references(() => tags.id, { onDelete: 'cascade' }),
}, (table) => [
  unique('project_tags_unique').on(table.projectId, table.tagId),
]);

// ============ TASK-TAG JUNCTION ============
export const taskTags = pgTable('task_tags', {
  taskId: integer('task_id').notNull().references(() => tasks.id, { onDelete: 'cascade' }),
  tagId: integer('tag_id').notNull().references(() => tags.id, { onDelete: 'cascade' }),
}, (table) => [
  unique('task_tags_unique').on(table.taskId, table.tagId),
]);

// ============ ACTIVITY LOG ============
export const activityLog = pgTable('activity_log', {
  id: serial('id').primaryKey(),
  userId: varchar('user_id', { length: 36 }).notNull(),
  projectId: integer('project_id').references(() => projects.id, { onDelete: 'set null' }),
  entityType: varchar('entity_type', { length: 50 }).notNull(),
  entityId: integer('entity_id'),
  action: varchar('action', { length: 50 }).notNull(),
  description: text('description'),
  metadata: jsonb('metadata'),
  createdAt: timestamp('created_at').notNull().defaultNow(),
});

// ============ STAKEHOLDER REGISTER (PMBOK 8 — Stakeholders Domain) ============
export const stakeholders = pgTable('stakeholders', {
  id: serial('id').primaryKey(),
  projectId: integer('project_id').notNull().references(() => projects.id, { onDelete: 'cascade' }),
  name: varchar('name', { length: 255 }).notNull(),
  role: varchar('role', { length: 255 }),        // e.g. "Sponsor", "End User", "Client"
  organization: varchar('organization', { length: 255 }),
  email: varchar('email', { length: 255 }),
  interest: integer('interest').default(3),       // 1-5 scale (power-interest grid)
  influence: integer('influence').default(3),     // 1-5 scale
  // interest + influence => grid quadrant: monitor | keep_informed | keep_satisfied | manage_closely
  engagementLevel: varchar('engagement_level', { length: 50 }).default('neutral'),
  // unaware | resistant | neutral | supportive | leading
  desiredEngagementLevel: varchar('desired_engagement_level', { length: 50 }),
  engagementStrategy: text('engagement_strategy'), // how to move to desired level
  communicationPlan: text('communication_plan'),   // frequency, method, content
  notes: text('notes'),
  createdAt: timestamp('created_at').notNull().defaultNow(),
  updatedAt: timestamp('updated_at').notNull().$onUpdate(() => new Date()),
});

// ============ RISK REGISTER (PMBOK 8 — Risk Domain) ============
export const risks = pgTable('risks', {
  id: serial('id').primaryKey(),
  projectId: integer('project_id').notNull().references(() => projects.id, { onDelete: 'cascade' }),
  title: varchar('title', { length: 500 }).notNull(),
  description: text('description'),
  category: varchar('category', { length: 100 }),
  // technical | schedule | finance | resource | stakeholder | external | other
  probability: integer('probability').notNull().default(3), // 1-5 (Very Low to Very High)
  impact: integer('impact').notNull().default(3),           // 1-5 (Very Low to Very High)
  riskScore: integer('risk_score').generatedAlwaysAs(sql`probability * impact`), // 1-25
  emv: numeric('emv', { precision: 12, scale: 2 }),  // Expected Monetary Value (quantitative)
  status: varchar('status', { length: 50 }).default('identified'),
  // identified | analyzed | response_planned | implemented | closed | materialized
  responseType: varchar('response_type', { length: 50 }),
  // avoid | mitigate | transfer | accept | escalate (threats)
  // exploit | enhance | share | accept (opportunities)
  responseAction: text('response_action'),
  owner: varchar('owner', { length: 255 }),
  residualRiskScore: integer('residual_risk_score'), // risk score after response
  relatedTaskId: integer('related_task_id').references(() => tasks.id, { onDelete: 'set null' }),
  createdAt: timestamp('created_at').notNull().defaultNow(),
  updatedAt: timestamp('updated_at').notNull().$onUpdate(() => new Date()),
});

// ============ CHANGE REQUEST LOG (PMBOK 8 — Governance: Perform Integrated Change Control) ============
export const changeRequests = pgTable('change_requests', {
  id: serial('id').primaryKey(),
  projectId: integer('project_id').notNull().references(() => projects.id, { onDelete: 'cascade' }),
  title: varchar('title', { length: 500 }).notNull(),
  description: text('description').notNull(),
  requestedBy: varchar('requested_by', { length: 255 }),
  changeType: varchar('change_type', { length: 50 }).notNull(),
  // scope | schedule | finance | resource | quality | other
  impactDescription: text('impact_description'), // impact on scope, schedule, cost, quality
  priority: varchar('priority', { length: 20 }).default('medium'),
  status: varchar('status', { length: 50 }).default('submitted'),
  // submitted | under_review | approved | rejected | implemented | deferred
  reviewNotes: text('review_notes'),
  approvedBy: varchar('approved_by', { length: 255 }),
  approvedAt: timestamp('approved_at'),
  implementedAt: timestamp('implemented_at'),
  createdAt: timestamp('created_at').notNull().defaultNow(),
  updatedAt: timestamp('updated_at').notNull().$onUpdate(() => new Date()),
});

// ============ LESSONS LEARNED (PMBOK 8 — Governance: Manage Project Knowledge) ============
export const lessonsLearned = pgTable('lessons_learned', {
  id: serial('id').primaryKey(),
  projectId: integer('project_id').notNull().references(() => projects.id, { onDelete: 'cascade' }),
  title: varchar('title', { length: 500 }).notNull(),
  description: text('description').notNull(),
  category: varchar('category', { length: 100 }),
  // process | technical | stakeholder | risk | schedule | finance | quality | other
  focusArea: varchar('focus_area', { length: 50 }),
  // which PMBOK Focus Area this lesson applies to
  impact: varchar('impact', { length: 20 }).default('neutral'),
  // positive | negative | neutral
  recommendation: text('recommendation'), // what to do differently next time
  createdAt: timestamp('created_at').notNull().defaultNow(),
  updatedAt: timestamp('updated_at').notNull().$onUpdate(() => new Date()),
});

// ============ CHAT SESSIONS ============
export const chatSessions = pgTable('chat_sessions', {
  id: serial('id').primaryKey(),
  userId: varchar('user_id', { length: 36 }).notNull(),
  title: varchar('title', { length: 255 }).default('New Chat'),
  projectId: integer('project_id').references(() => projects.id, { onDelete: 'set null'}),
  createdAt: timestamp('created_at').notNull().defaultNow(),
  updatedAt: timestamp('updated_at').notNull().$onUpdate(() => new Date()),
});

// ============ CHAT MESSAGES ============
export const chatMessages = pgTable('chat_messages', {
  id: serial('id').primaryKey(),
  sessionId: integer('session_id').notNull().references(() => chatSessions.id, { onDelete: 'cascade' }),
  role: varchar('role', { length: 20 }).notNull(), // user | assistant | system
  content: text('content').notNull(),
  sources: jsonb('sources'), // [{docId, chunkId, similarity, snippet}]
  modelUsed: varchar('model_used', { length: 100 }),
  tokenUsage: jsonb('token_usage'), // {prompt, completion, total}
  createdAt: timestamp('created_at').notNull().defaultNow(),
});

// ============ AI USAGE LOG ============
export const aiUsageLog = pgTable('ai_usage_log', {
  id: serial('id').primaryKey(),
  userId: varchar('user_id', { length: 36 }).notNull(),
  operationType: varchar('operation_type', { length: 50 }).notNull(),
  modelName: varchar('model_name', { length: 100 }).notNull(),
  promptTokens: integer('prompt_tokens'),
  completionTokens: integer('completion_tokens'),
  estimatedCostMicroCents: integer('estimated_cost_micro_cents'), // cost × 1,000,000 for precision
  latencyMs: integer('latency_ms'),
  metadata: jsonb('metadata'),
  createdAt: timestamp('created_at').notNull().defaultNow(),
});
```

### Relations

```typescript
export const projectsRelations = relations(projects, ({ many }) => ({
  tasks: many(tasks),
  notes: many(notes),
  documents: many(documents),
  projectTags: many(projectTags),
  activityLog: many(activityLog),
  chatSessions: many(chatSessions),
  stakeholders: many(stakeholders),
  risks: many(risks),
  changeRequests: many(changeRequests),
  lessonsLearned: many(lessonsLearned),
}));

export const tasksRelations = relations(tasks, ({ one, many }) => ({
  project: one(projects, { fields: [tasks.projectId], references: [projects.id] }),
  subtasks: many(tasks, { relationName: 'subtasks' }),
  parentTask: one(tasks, { fields: [tasks.parentId], references: [tasks.id], relationName: 'subtasks' }),
  predecessor: one(tasks, { fields: [tasks.predecessorId], references: [tasks.id], relationName: 'predecessor' }),
  taskTags: many(taskTags),
}));
```

### SQL Migration: pgvector + FTS Trigger + Hybrid Search RPC

```sql
-- Enable pgvector
CREATE EXTENSION IF NOT EXISTS vector WITH SCHEMA extensions;

-- Full-text search trigger (search_vector is tsvector type in the DB, text in Drizzle schema)
CREATE OR REPLACE FUNCTION document_chunks_search_vector_update()
RETURNS TRIGGER AS $$
BEGIN
  NEW.search_vector := to_tsvector('english', COALESCE(NEW.content, ''));
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_document_chunks_search_vector
  BEFORE INSERT OR UPDATE OF content ON document_chunks
  FOR EACH ROW EXECUTE FUNCTION document_chunks_search_vector_update();

-- Hybrid search RPC function
CREATE OR REPLACE FUNCTION hybrid_search(
  query_embedding vector(1536),
  query_text text,
  match_project_id integer DEFAULT NULL,
  match_threshold float DEFAULT 0.5,
  match_count int DEFAULT 10,
  rrf_k int DEFAULT 60
)
RETURNS TABLE (
  id integer, document_id integer, project_id integer,
  content text, metadata jsonb, similarity float, rank_score float
) AS $$
WITH vector_results AS (
  SELECT dc.id, dc.document_id, dc.project_id, dc.content, dc.metadata,
    1 - (dc.embedding <=> query_embedding) AS similarity,
    ROW_NUMBER() OVER (ORDER BY dc.embedding <=> query_embedding) AS rank_ix
  FROM document_chunks dc
  WHERE dc.embedding IS NOT NULL
    AND (match_project_id IS NULL OR dc.project_id = match_project_id)
    AND 1 - (dc.embedding <=> query_embedding) > match_threshold
  ORDER BY dc.embedding <=> query_embedding
  LIMIT match_count * 3
),
fts_results AS (
  SELECT dc.id, dc.document_id, dc.project_id, dc.content, dc.metadata,
    ts_rank_cd(dc.search_vector::tsvector, websearch_to_tsquery('english', query_text)) AS fts_score,
    ROW_NUMBER() OVER (ORDER BY ts_rank_cd(dc.search_vector::tsvector, websearch_to_tsquery('english', query_text)) DESC) AS rank_ix
  FROM document_chunks dc
  WHERE dc.search_vector::tsvector @@ websearch_to_tsquery('english', query_text)
    AND (match_project_id IS NULL OR dc.project_id = match_project_id)
  LIMIT match_count * 3
),
combined AS (
  SELECT
    COALESCE(v.id, f.id) AS id,
    COALESCE(v.document_id, f.document_id) AS document_id,
    COALESCE(v.project_id, f.project_id) AS project_id,
    COALESCE(v.content, f.content) AS content,
    COALESCE(v.metadata, f.metadata) AS metadata,
    COALESCE(v.similarity, 0) AS similarity,
    COALESCE(1.0 / (rrf_k + v.rank_ix), 0) + COALESCE(1.0 / (rrf_k + f.rank_ix), 0) AS rank_score
  FROM vector_results v
  FULL OUTER JOIN fts_results f ON v.id = f.id
)
SELECT * FROM combined ORDER BY rank_score DESC LIMIT match_count;
$$ LANGUAGE sql STABLE;

-- Risk score auto-calculation (alternative to generated column if DB version doesn't support it)
-- The schema uses generatedAlwaysAs; if unsupported, use a trigger instead.

-- RLS Policies — enable at project start, use permissive policy in dev, tighten for prod
ALTER TABLE projects ENABLE ROW LEVEL SECURITY;
ALTER TABLE tasks ENABLE ROW LEVEL SECURITY;
ALTER TABLE notes ENABLE ROW LEVEL SECURITY;
ALTER TABLE documents ENABLE ROW LEVEL SECURITY;
ALTER TABLE stakeholders ENABLE ROW LEVEL SECURITY;
ALTER TABLE risks ENABLE ROW LEVEL SECURITY;
ALTER TABLE change_requests ENABLE ROW LEVEL SECURITY;
ALTER TABLE lessons_learned ENABLE ROW LEVEL SECURITY;

-- Development: permissive (tighten in Phase 5)
CREATE POLICY "dev_all" ON projects FOR ALL USING (true);
-- Production: restrict to owner
-- CREATE POLICY "owner_only" ON projects FOR ALL USING (user_id = auth.uid());
```

---

## RAG Architecture

```
[Upload/Write] --> [Chunking (500 chars, 100 overlap)] --> [Embed via OpenAI] --> [Store in pgvector]
                                                                          |
[User Query] --> [Embed Query via OpenAI] --> [hybrid_search RPC] --> [Cohere Rerank] --> [Build Context] --> [LLM streamText] --> [Streaming Response + Citations]
```

### Ingestion (`src/lib/rag/ingest.ts`)
1. Upload file to Supabase Storage → create `documents` row → validate file type (pdf/md/txt only) + size limit
2. Chunk: `RecursiveCharacterTextSplitter` pattern (500 chars, 100 overlap). PDF via `pdf-parse` (note: fails on scanned/image-only PDFs — log to `processingError`)
3. Generate content hash per chunk (SHA-256) for idempotent retries
4. Embed chunks: OpenAI `text-embedding-3-small` API (1536 dims)
5. Store in `document_chunks` with embedding (search_vector populated by DB trigger)

### Retrieval (`src/lib/rag/retrieve.ts`)
1. Embed query using same model
2. Call `hybrid_search()` RPC — combines vector + full-text with RRF
3. Rerank top-30 results with Cohere `rerank-v3.5`
4. Assemble top 5-8 chunks into context with source metadata + citation instructions

### Generation (`src/app/api/chat/route.ts`)
1. Vercel AI SDK `streamText` with tool-based RAG (LLM decides when to search)
2. **Read-only tools**: `searchKnowledgeBase`, `getProjectSummary`, `listTasks`, `listRisks`, `listStakeholders`, `assessDomainHealth`
3. **Write tools (require confirmation UI before execution)**: `createTask`, `createRisk`, `createLessonsLearned`
4. PMBOK-aware system prompt builder (includes project's current Focus Area + domain health)
5. Streaming response via `useChat` hook on frontend
6. Sources stored in `chatMessages.sources` for clickable citation chips
7. Usage logged to `aiUsageLog` (cost stored as micro-cents for precision)

### AI Tools — PMBOK-Specific

| Tool | Type | PMBOK Domain | What It Does |
|---|---|---|---|
| `searchKnowledgeBase` | Read | All | Hybrid RAG search across project docs |
| `getProjectSummary` | Read | Governance | Summarizes project status across all 7 domains |
| `listTasks` | Read | Schedule/Scope | Retrieves task list with WBS codes |
| `listRisks` | Read | Risk | Returns risk register with scores |
| `listStakeholders` | Read | Stakeholders | Returns stakeholder register |
| `assessDomainHealth` | Read | All | Scores each of the 7 domains Red/Amber/Green |
| `draftProjectCharter` | Read | Governance | AI generates charter draft from project description |
| `suggestRisks` | Read | Risk | AI identifies likely risks for project type |
| `generateLessonsLearned` | Read | Governance | AI summarizes lessons from activity log + notes |
| `createTask` | **Write** | Schedule | Creates task (requires user confirmation) |
| `createRisk` | **Write** | Risk | Adds risk to register (requires confirmation) |
| `logLessonLearned` | **Write** | Governance | Saves lesson (requires confirmation) |

### Embedding Model Options (by Budget Tier)

| Tier | Model | Dimensions | Cost | Quality |
|---|---|---|---|---|
| **✅ Selected ($5-7)** | OpenAI `text-embedding-3-small` | 1536 | ~$0.02/1M tokens | Excellent |
| ~~$0~~ | ~~`Xenova/bge-small-en-v1.5` (local via Transformers.js)~~ | ~~384~~ | ~~$0~~ | ~~Good — 33MB download, cold start risk on Vercel~~ |

### LLM Provider Architecture — User-Configurable

The app uses a **provider-agnostic LLM configuration** stored in user settings. Users can switch providers and models from the Settings page without code changes.

**Supported providers** (via Vercel AI SDK):

| Provider | Models | API Key Env Var | Notes |
|---|---|---|---|
| **OpenAI** | gpt-4o-mini, gpt-4o, gpt-4.1, o3-mini | `OPENAI_API_KEY` | Direct API. Default for $5-7 tier |
| **OpenRouter** | 200+ models (gpt-4o-mini, Claude, Gemini, Llama, etc.) | `OPENROUTER_API_KEY` | One key for all providers. Slight markup over direct API |
| **Google** | Gemini 2.5 Flash, Gemini 2.5 Pro | `GOOGLE_AI_API_KEY` | Free tier available (60 RPM) |
| **Anthropic** | Claude Sonnet 4.6, Claude Haiku 4.5 | `ANTHROPIC_API_KEY` | Best reasoning quality. Higher cost |
| **Ollama** | Llama 3.1, Mistral, etc. (local) | N/A (runs locally) | Full privacy. Requires local machine with 8GB+ RAM |

**How it works:**
1. User goes to Settings → AI Configuration
2. Selects a provider from dropdown (OpenAI, OpenRouter, Google, Anthropic, Ollama)
3. Enters their API key (stored encrypted in user settings, or via server-side env vars for security)
4. Selects a model from the provider's available models
5. The `/api/chat` route reads the user's provider config and instantiates the correct Vercel AI SDK provider
6. All AI tools (RAG, charter drafting, risk suggesting, etc.) work identically regardless of provider

**Architecture (`src/lib/ai/models.ts`):**
```typescript
// Provider factory — returns the correct AI SDK provider based on user config
// The chat route calls createProvider(config) and passes it to streamText()
type ProviderConfig = {
  provider: 'openai' | 'openrouter' | 'google' | 'anthropic' | 'ollama';
  apiKey?: string;          // server-side env var for hosted providers
  model: string;            // e.g. 'gpt-4o-mini', 'claude-sonnet-4-6-20250514'
  baseUrl?: string;         // for OpenRouter or custom endpoints
};

function createProvider(config: ProviderConfig) {
  switch (config.provider) {
    case 'openai':     return createOpenAI({ apiKey: config.apiKey });
    case 'openrouter': return createOpenAI({ apiKey: config.apiKey, baseURL: 'https://openrouter.ai/api/v1' });
    case 'google':      return createGoogleGenerativeAI({ apiKey: config.apiKey });
    case 'anthropic':   return createAnthropic({ apiKey: config.apiKey });
    case 'ollama':      return createOllama({ baseURL: 'http://localhost:11434' });
  }
}
```

**Default configuration (can be overridden per-user in Settings):**
| Setting | Default | User Can Override? |
|---|---|---|
| LLM Provider | OpenAI | Yes — dropdown in Settings |
| LLM Model | gpt-4o-mini | Yes — model selector updates based on provider |
| Embedding Provider | OpenAI | No — fixed at 1536 dims (schema constraint) |
| Embedding Model | text-embedding-3-small | No — fixed (all vectors must use same model) |
| Reranking Provider | Cohere | No — included at $5-7 tier |
| API Key | Server env var | Yes — can also enter personal key in Settings |

> **Important**: The embedding model is NOT user-configurable. All vectors in the database must use the same embedding model (OpenAI text-embedding-3-small @ 1536 dims). Switching embedding models would require re-embedding all documents. The LLM, however, is fully swappable — any provider works because the Vercel AI SDK normalizes the interface.

### Key RAG Architecture Decisions

| Decision | Choice | Rationale |
|---|---|---|
| Chunking strategy | 500 chars, 100 overlap | Balance between context completeness and embedding quality |
| Hybrid search over pure vector | RRF with k=60 | Production RAG best practice. Vector misses keyword-exact; FTS misses semantic similarity |
| HNSW over IVFFlat | m=16, ef_construction=64 | Better recall-latency tradeoff for <500K vectors, no training step |
| Tool-based RAG | AI SDK `tool` API | LLM decides when to search, reducing unnecessary retrieval |
| Write tools require confirmation | UI confirmation step | Prevents prompt injection via uploaded documents triggering database writes |
| Content hashes on chunks | SHA-256 | Idempotent re-ingestion: unchanged chunks skipped on document update |

---

## Frontend Architecture

### Directory Structure

```
src/
  app/
    layout.tsx                              # ThemeProvider, SidebarProvider, Toaster
    (auth)/
      layout.tsx                            # Centered card layout, no sidebar
      login/page.tsx
      signup/page.tsx
      onboarding/page.tsx                   # Username setup → creates profiles row
    (dashboard)/
      layout.tsx                            # Sidebar + SidebarInset + header
      dashboard/page.tsx                    # KPIs, PMBOK domain health, activity feed, charts
      projects/
        page.tsx                            # Project grid with filters + Focus Area badges
        [id]/
          page.tsx                          # Project overview + domain health summary
          charter/page.tsx                  # Project Charter (Initiating) — PMBOK Governance
          tasks/page.tsx                    # Kanban + WBS tree view
          notes/page.tsx
          documents/page.tsx
          stakeholders/page.tsx             # Stakeholder Register — PMBOK Stakeholders Domain
          risks/page.tsx                    # Risk Register + 5×5 matrix — PMBOK Risk Domain
          changes/page.tsx                  # Change Request Log — PMBOK Governance
          lessons/page.tsx                  # Lessons Learned — PMBOK Knowledge Management
          settings/page.tsx
      tasks/page.tsx                        # Cross-project Kanban + list views
      knowledge-base/page.tsx               # Upload, browse, search documents
      analytics/page.tsx                    # Charts + domain health + AI usage tracker
      ai-chat/
        page.tsx                            # Chat interface (new session)
        [sessionId]/page.tsx                # Continue existing session
      settings/page.tsx                     # User prefs, AI provider/model config (dropdown), API key input
        components/
          ai-config-panel.tsx              # Provider dropdown, model selector, API key input, test connection button
  components/
    ui/                                     # shadcn/ui primitives (auto-generated)
    motion/                                 # Reusable animation primitives
      stagger-container.tsx
      reveal.tsx
      number-ticker.tsx
      glow-card.tsx
      split-text.tsx
      gradient-mesh.tsx
    layout/
      app-sidebar.tsx                       # Sidebar with nav groups, collapsible
      header-breadcrumb.tsx
      user-nav.tsx
    dashboard/
      kpi-card.tsx
      activity-feed.tsx
      progress-ring.tsx
      project-status-chart.tsx
      velocity-chart.tsx
      domain-health-overview.tsx            # 7-domain RAG status grid on dashboard
    projects/
      project-card.tsx                      # Card with Focus Area badge
      project-grid.tsx
      project-filters.tsx
      create-project-dialog.tsx
      focus-area-stepper.tsx                # Visual PMBOK lifecycle stepper component
    pmbok/
      charter-form.tsx                      # Structured project charter form (AI draft button)
      stakeholder-register.tsx              # Table + power/interest grid visualization
      stakeholder-form.tsx                  # Add/edit stakeholder
      risk-register.tsx                     # Risk table with heat map color coding
      risk-form.tsx                         # Add/edit risk with probability/impact sliders
      risk-matrix.tsx                       # Interactive 5×5 probability-impact grid
      change-request-list.tsx               # Change log with status badges
      change-request-form.tsx
      lessons-learned-list.tsx
      lessons-learned-form.tsx
      domain-health-card.tsx                # Single domain: status + key metrics
      domain-health-radar.tsx               # Recharts radar chart — 7 domain scores
      pmbok-process-checklist.tsx           # 40-process completion tracker per project
    tasks/
      kanban-board.tsx                      # @dnd-kit DnD + Framer Motion layout animations
      wbs-tree.tsx                          # Hierarchical WBS view with codes
      task-card.tsx
      task-detail-sheet.tsx
      task-list.tsx
    knowledge-base/
      document-upload.tsx                   # Drag-drop zone + progress + error state for scanned PDFs
      document-list.tsx
      document-preview.tsx
    ai-chat/
      chat-interface.tsx
      message-list.tsx
      citation-chip.tsx
      suggested-queries.tsx
      project-context-picker.tsx
      tool-confirmation-dialog.tsx          # User confirms before AI writes to DB
    analytics/
      completion-timeline.tsx
      tag-distribution.tsx
      weekly-velocity.tsx
      ai-usage-tracker.tsx
      focus-area-timeline.tsx               # Shows how long project spent in each Focus Area
  lib/
    utils.ts
    db/
      index.ts
      schema.ts
    rag/
      ingest.ts
      retrieve.ts
      embeddings.ts
    ai/
      models.ts
      tools.ts
      system-prompt.ts                      # PMBOK 8 principles + current project context
    supabase/
      client.ts
      server.ts
    hooks/
      use-projects.ts
      use-tasks.ts
      use-risks.ts
      use-stakeholders.ts
      use-change-requests.ts
      use-lessons-learned.ts
      use-activity.ts
    validations/
      project.ts
      task.ts
      stakeholder.ts
      risk.ts
      change-request.ts
      lessons-learned.ts
```

### Animation System — 6 Composable Primitives

| Primitive | Effect | Used For |
|---|---|---|
| **StaggerContainer** | Children animate in 80ms apart with spring physics | KPI card grids, project card grids, task lists, risk register rows |
| **Reveal** | Scroll-triggered fade-up (`whileInView`) | Section entrances, charts, domain health cards |
| **NumberTicker** | Animated count-up from 0 to target | Dashboard KPI values, risk score counts, domain health scores |
| **GlowCard** | Glassmorphism + animated gradient border + hover scale | Project cards, KPI cards, risk matrix cells |
| **GradientMesh** | Slowly morphing 3-4 color gradient | Dashboard background, chat header, charter page hero |
| **SplitText** | Character-by-character reveal animation | Page headings, Focus Area labels, empty state titles |

### Design System Foundations

**Color Palette** (oklch, Tailwind v4 native):
- Primary: Electric indigo gradient (`oklch(0.7 0.18 270)` to `oklch(0.6 0.22 290)`)
- Accent: Warm amber for highlights (`oklch(0.78 0.16 80)`)
- Success: Vibrant emerald (`oklch(0.72 0.18 155)`)
- Warning: Amber (`oklch(0.78 0.16 80)`) — used for medium risks
- Danger: Coral red (`oklch(0.65 0.22 25)`) — used for high risks
- Background: Deep navy dark mode (`oklch(0.14 0.02 270)`), warm off-white light mode
- Glass: `backdrop-blur-xl` with `bg-white/5` (dark) or `bg-white/70` (light)

**PMBOK Domain Colors** (for domain health indicators):
- Governance: Indigo | Scope: Sky | Schedule: Violet | Finance: Emerald
- Risk: Amber → Red (scales with score) | Resources: Teal | Stakeholders: Rose

**Typography**:
- Headings: Inter (tight tracking, bold weight)
- Body: Inter Regular (1.125rem base)
- Monospace: JetBrains Mono for WBS codes, risk scores, cost values

### Key "Wow" Moments

1. **Dashboard First Load**: GradientMesh aurora background, KPI cards stagger in, NumberTicker counts up, 7-domain health radar chart draws in, activity feed slides from left.

2. **Project Card Hover**: Scale to 1.03, GlowCard border brightens, Focus Area badge pulses, cover image scales slightly (1.05). On click, card expands with layoutId animation.

3. **Risk Matrix**: 5×5 grid where each cell color-transitions from green (low) to red (critical) with spring physics. Risks appear as animated dots on the matrix.

4. **Kanban Task Drag** (@dnd-kit): Pickup adds shadow + 2deg rotation. Remaining cards reorder with Framer Motion layout animation. Drop has spring bounce.

5. **AI Chat Streaming**: Tokens stream in. When AI calls `assessDomainHealth`, a mini domain health card animates in inline within the chat. Citation chips fade in after response.

6. **Focus Area Stepper**: On the project overview, the 5 Focus Areas are displayed as an animated progress stepper. Moving a project to the next phase triggers a confetti burst.

7. **Charter AI Draft**: Click "Draft with AI" on the Charter page — the form fields fill in one by one with a typewriter effect as the AI streams the charter content.

8. **Dark/Light Mode Toggle**: Colors smoothly interpolate. GradientMesh shifts aurora (dark) → warm sunset (light).

### Performance Guardrails for Animations

- Use `will-change: transform` only on elements currently animating
- Prefer `transform` and `opacity` animations (GPU-composited)
- Use `viewport={{ once: true }}` on scroll reveals
- Lazy-load Framer Motion for below-fold components
- Respect `prefers-reduced-motion`: return static elements when user prefers reduced motion
- @dnd-kit and Framer Motion work independently — dnd-kit manages state, Framer Motion manages visual transitions

---

## API Design

### Server Actions (CRUD, co-located with features)

| Action File | Actions |
|---|---|
| `projects/actions.ts` | `createProject`, `updateProject`, `deleteProject`, `updateProjectStatus`, `updateFocusArea` |
| `projects/[id]/actions.ts` | `createTask`, `updateTask`, `deleteTask`, `updateTaskStatus`, `reorderTasks`, `createNote`, `updateNote`, `deleteNote` |
| `projects/[id]/charter/actions.ts` | `saveCharter`, `updateCharter` |
| `projects/[id]/stakeholders/actions.ts` | `createStakeholder`, `updateStakeholder`, `deleteStakeholder` |
| `projects/[id]/risks/actions.ts` | `createRisk`, `updateRisk`, `deleteRisk`, `updateRiskStatus` |
| `projects/[id]/changes/actions.ts` | `createChangeRequest`, `updateChangeRequestStatus` |
| `projects/[id]/lessons/actions.ts` | `createLesson`, `updateLesson`, `deleteLesson` |
| `knowledge-base/actions.ts` | `uploadDocument`, `deleteDocument`, `reprocessDocument` |
| `settings/actions.ts` | `updateUserPreferences`, `updateAIModelConfig` (provider, model, apiKey), `updateUsername` |

### API Routes (streaming/background)

| Route | Method | Purpose |
|---|---|---|
| `/api/chat` | POST | RAG chat endpoint with PMBOK-aware tools. Rate limited: 30 req/min per user |
| `/api/embeddings` | POST | Generate embeddings for a document (background). Rate limited: 10 req/min per user |

> **Rate limiting must be implemented in Phase 3 when these routes are created** — not deferred to Phase 5.

### Data Fetching Strategy

- **Server Components**: Direct Drizzle queries (zero client JS for data fetching)
- **Client mutations**: Server Actions with `useTransition` + `revalidatePath`
- **Realtime updates**: Supabase Realtime for activity feed
- **Optimistic updates**: TanStack Query `useMutation` with `onMutate` rollback for Kanban reorder

---

## Build Phases

> **AI-Assisted Timeline**: With Claude Sonnet 4.6 and GLM-5.1 as pair-programming assistants, each phase is roughly 55-65% faster than a solo build. Paste errors directly into chat. Ask for full component files. Review everything before running it.

---

### Phase 1: Foundation (Days 1–4) — "Skeleton That Works"

**Goal**: Running app with auth, username onboarding, sidebar layout, and project CRUD. RLS enabled from day one.

1. `[GLM]` Initialize Next.js 15 project with TypeScript, Tailwind v4, App Router
2. `[GLM]` Install and configure shadcn/ui (`npx shadcn@latest init`)
3. `[GLM]` Install shadcn sidebar block (`npx shadcn add sidebar-07`) — icon-collapse variant
4. `[GLM]` Set up Supabase project, get connection string

---

> 🔁 **HANDOFF → Claude Sonnet 4.6**
> **If you are GLM-5.1:** Project scaffolding is complete. Tasks 5–8 are the database schema, migrations, and security configuration — these must be handled by Claude Sonnet 4.6.
> **Tell Praise:** "I've finished the initial setup (Next.js, shadcn, sidebar block, Supabase project connection). The next tasks — schema design, migrations, RLS, and Supabase Auth config — are Claude Sonnet 4.6 territory. Please switch models. Type 'continue' if you want me to attempt them."
> **If you are Claude Sonnet 4.6:** Proceed — tasks 5–8 are yours.

---

5. `[CLAUDE]` Set up Drizzle ORM with full schema file (all 15 tables — build the whole schema now)
6. `[CLAUDE]` Run `drizzle-kit generate` to produce migration files, then `drizzle-kit migrate` to apply
7. `[CLAUDE]` Enable RLS on all tables with a permissive dev policy (`FOR ALL USING (true)`)
8. `[CLAUDE]` Configure Supabase Auth (email + Google OAuth)

---

> 🔁 **HANDOFF → GLM-5.1**
> **If you are Claude Sonnet 4.6:** Schema (15 tables), migrations, RLS, and Auth config are done. Tasks 9 and 11–16 are auth page UI plus layout and CRUD — GLM-5.1 territory.
> **Tell Praise:** "Schema, migrations, RLS, and Supabase Auth are configured. The next tasks — auth pages, dashboard layout, project pages, and basic CRUD — are UI work for GLM-5.1. Switch models to save tokens. Type 'continue' if you want me to handle them."
> **If you are GLM-5.1:** Proceed — tasks 9 and 11–16 are yours. Build the auth pages and all UI. Task 10 (profiles logic) will be wired by Claude after you finish.

---

9. `[GLM]` Build auth pages (login, signup, onboarding for username) using shadcn Card + Form
11. `[GLM]` Build dashboard layout: `SidebarProvider` + `AppSidebar` + `SidebarInset`
12. `[GLM]` Build Projects page: Server Component fetching projects, grid of Cards with Focus Area badge
13. `[GLM]` Build Create Project dialog: RHF + Zod form in shadcn Dialog
14. `[GLM]` Build Project detail page with tab navigation (Charter, Tasks, Notes, Docs, Stakeholders, Risks, Changes, Lessons)
15. `[GLM]` Basic project + task CRUD within project detail
16. `[GLM]` Deploy to Vercel

---

> 🔁 **HANDOFF → Claude Sonnet 4.6**
> **If you are GLM-5.1:** UI is complete and the app is deployed. Tasks 10 and 17 are server-side auth logic and security middleware — Claude Sonnet 4.6 must handle these.
> **Tell Praise:** "Auth pages, layout, project CRUD, and initial Vercel deploy are done. Tasks 10 and 17 — profiles row creation logic on first login, and the rate limiting middleware — are Claude Sonnet 4.6 work. Switch models. Type 'continue' if you want me to attempt them."
> **If you are Claude Sonnet 4.6:** Proceed — tasks 10 and 17 are yours.

---

10. `[CLAUDE]` Build `profiles` row creation on first login (username → public portfolio URL)
17. `[CLAUDE]` Set up Vercel Edge Middleware for rate limiting (`/api/*` routes) — middleware file only, activated in Phase 3

**Deliverable**: Log in, create projects, add tasks, see them in a sidebar. RLS on. Rate limiting middleware ready.

---

### Phase 2: Visual Excellence (Days 5–7) — "Make It Beautiful"

**Goal**: Transform the skeleton into a visually stunning dashboard with the PMBOK domain health radar visible.

1. `[GLM]` Install Framer Motion + @dnd-kit/core + @dnd-kit/sortable
2. `[GLM]` Build motion primitives — `stagger-container.tsx`, `reveal.tsx`, `number-ticker.tsx`, `gradient-mesh.tsx`, `split-text.tsx` *(skip `glow-card.tsx` — that is a Claude task below)*
5. `[GLM]` Add Focus Area stepper component to project cards and detail header
6. `[GLM]` Animate Project cards: stagger entrance on grid, hover scale + glow, cover image scale
8. `[GLM]` Add dark mode with `next-themes`: ThemeProvider in root layout, ThemeToggle in sidebar footer
9. `[GLM]` Add loading states with shadcn Skeleton + Framer Motion fade
10. `[GLM]` Build progress visualization: Recharts pie chart for project status, SVG progress rings, animated bar chart for weekly velocity

---

> 🔁 **HANDOFF → Claude Sonnet 4.6**
> **If you are GLM-5.1:** Basic motion primitives, dark mode, loading states, project card animations, and Recharts charts are done. The next tasks require Claude — GlowCard (glassmorphism is subtle to get right), the full Dashboard animation integration, the domain health radar, and the @dnd-kit + Framer Motion Kanban (two libraries that conflict if wired incorrectly).
> **Tell Praise:** "Phase 2 GLM work is done — motion primitives (minus GlowCard), dark mode, loading states, card animations, and progress charts. Tasks 2b, 3, 4, and 7 are Claude Sonnet 4.6 territory. Switch models. Type 'continue' if you want me to attempt them."
> **If you are Claude Sonnet 4.6:** Proceed — tasks 2b, 3, 4, and 7 are yours.

---

2b. `[CLAUDE]` Build `glow-card.tsx` motion primitive — glassmorphism + animated gradient border + hover scale (`will-change: transform`, GPU-only properties only)
3. `[CLAUDE]` Animate the Dashboard page: wire StaggerContainer, NumberTicker, GlowCard, and GradientMesh aurora background together into the KPI card grid — this is the primary "wow" moment and must be verified visually
4. `[CLAUDE]` Add domain health radar chart (Recharts Radar, 7 axes — all showing placeholder data initially)
7. `[CLAUDE]` Build Kanban board for tasks: @dnd-kit for drag interactions, Framer Motion `layout` for reorder animation, `AnimatePresence` for card enter/exit — dnd-kit manages state, Framer Motion manages visuals only

**Deliverable**: Dashboard that looks "dynamically amazing" with glassmorphism, animated KPIs, smooth transitions, domain health radar, and PMBOK Focus Area stepper.

---

### Phase 3: Knowledge Base + RAG + Rate Limiting (Days 8–13) — "AI That Knows Your Projects"

**Goal**: Document upload, embedding pipeline, hybrid search, RAG chat, and AI rate limiting live.

1. `[CLAUDE]` Activate rate limiting on `/api/chat` and `/api/embeddings` in the Vercel Edge Middleware (30 req/min, 10 req/min respectively)
2. `[CLAUDE]` Build pgvector extension migration + `hybrid_search` RPC function in Supabase SQL editor

---

> 🔁 **HANDOFF → GLM-5.1**
> **If you are Claude Sonnet 4.6:** Rate limiting is activated and the pgvector/hybrid_search SQL is done. Task 3 is the document upload UI — a standalone UI component GLM-5.1 can build independently.
> **Tell Praise:** "Rate limiting is live and pgvector + hybrid_search SQL is done. Task 3 — document upload UI (drag-drop zone, progress bar, error states) — is GLM-5.1 work. Switch models to save tokens. Type 'continue' if you want me to handle it."
> **If you are GLM-5.1:** Proceed — task 3 is yours.

---

3. `[GLM]` Build document upload UI (drag-drop zone, progress bar, clear error state for scanned/unsupported PDFs)

---

> 🔁 **HANDOFF → Claude Sonnet 4.6**
> **If you are GLM-5.1:** Upload UI is done. Tasks 4–6 are the core RAG backend — chunking, embeddings, and retrieval. These three files are tightly coupled and must be built by Claude Sonnet 4.6.
> **Tell Praise:** "Document upload UI is done. Tasks 4–6 are Claude Sonnet 4.6 work — chunking pipeline, embedding abstraction, and retrieval pipeline. These are interconnected and need Claude. Switch models. Type 'continue' if you want me to attempt them."
> **If you are Claude Sonnet 4.6:** Proceed — tasks 4–6 are yours.

---

4. `[CLAUDE]` Build chunking pipeline (`src/lib/rag/ingest.ts`): text/MD splitter, PDF parser (`pdf-parse`), content hash generation, status update to `failed` with error message on exception
5. `[CLAUDE]` Build embedding provider (`src/lib/rag/embeddings.ts`): OpenAI `text-embedding-3-small` (1536 dims) via Vercel AI SDK
6. `[CLAUDE]` Build retrieval pipeline (`src/lib/rag/retrieve.ts`): call `hybrid_search()` RPC, assemble context with citations

---

> 🔁 **HANDOFF → GLM-5.1**
> **If you are Claude Sonnet 4.6:** Core RAG backend (chunking, embeddings, retrieval) is done. Tasks 7 and 10 are verification and chat UI shell — GLM-5.1 work. Build the chat UI layout now; you will wire the `useChat` hook to Claude's API route after Claude completes task 8.
> **Tell Praise:** "Core RAG pipeline done. Tasks 7 and 10 — verifying the AI SDK version and building the chat UI shell — are GLM-5.1 work. Build the UI structure now; Claude will wire the API route next. Switch models. Type 'continue' if you want me to handle them."
> **If you are GLM-5.1:** Proceed — tasks 7 and 10 are yours. On task 10, build the layout and component structure only; leave the actual `useChat` API connection for after Claude finishes task 8.

---

7. `[GLM]` Verify Vercel AI SDK version matches API surface in this plan before writing the chat route (`npm info ai version` — log the confirmed version number)
10. `[GLM]` Build chat UI shell: streaming bubble layout, citation chip placeholders, suggested queries component, project context picker — wire `useChat` hook to API route after Claude completes task 8

---

> 🔁 **HANDOFF → Claude Sonnet 4.6**
> **If you are GLM-5.1:** SDK version confirmed and chat UI shell is built. Tasks 8, 9, 11, 12, and 13 are Claude territory — the streaming chat API route, PMBOK AI tools, write-confirmation dialog, message storage, usage tracking, and the full E2E integration test.
> **Tell Praise:** "AI SDK version confirmed and chat UI shell is built. Tasks 8, 9, 11, 12, 13 are Claude Sonnet 4.6 work — chat route, AI tools, write-confirmation dialog, DB storage, and E2E test. Switch models. Type 'continue' if you want me to attempt them."
> **If you are Claude Sonnet 4.6:** Proceed — tasks 8, 9, 11, 12, and 13 are yours. After task 8, signal GLM-5.1 to wire the `useChat` hook in the chat UI (task 10 completion step).

---

8. `[CLAUDE]` Build AI chat API route (`src/app/api/chat/route.ts`): `streamText`, PMBOK-aware system prompt, read-only tools (searchKnowledgeBase, getProjectSummary, listTasks, listRisks, listStakeholders, assessDomainHealth), write tools with `requiresConfirmation` flag
9. `[CLAUDE]` Build `tool-confirmation-dialog.tsx` — AI proposes a write action, user approves/rejects before it executes
11. `[CLAUDE]` Store chat messages in `chatMessages` table
12. `[CLAUDE]` Build AI usage tracking into `aiUsageLog` (cost in micro-cents)
13. `[CLAUDE]` Test end-to-end: upload doc → ask question → get cited answer → AI proposes creating a task → confirm → task appears

**Deliverable**: Upload project documents, ask natural language questions, get cited answers. AI can propose (but not silently execute) write actions. Rate limiting live.

---

### Phase 4: PMBOK Features + Analytics + Polish (Days 14–20) — "Professional PM, Beautiful Insights"

**Goal**: Full PMBOK 8th Edition feature set, analytics dashboard, and UX polish.

#### PMBOK Feature Implementation — Forms & Tables (GLM-5.1 first)

1a. `[GLM]` Build **Project Charter page** form (`/projects/[id]/charter`):
   - Structured form fields: project purpose, objectives, scope summary, deliverables, acceptance criteria, assumptions, constraints, budget, schedule summary, stakeholder overview, risk approach
   - Save as structured JSON. Add a placeholder "Draft with AI" button — Claude wires the AI streaming in task 1b
   - Saves as structured JSON in project settings or as a note with `charter` tag

2a. `[GLM]` Build **Stakeholder Register** table + form (`/projects/[id]/stakeholders`):
   - Table view: name, role, organization, interest (1-5), influence (1-5), engagement level, desired engagement
   - Add/edit stakeholder form with engagement strategy and communication plan fields
   - Add placeholder "Identify with AI" button — Claude wires it in task 2b
   - *(Leave the power/interest grid visualization for Claude — task 2b)*

3a. `[GLM]` Build **Risk Register** table + form (`/projects/[id]/risks`):
   - Table view: title, category, probability, impact, risk score (P×I), status, owner, response type
   - Risk score color coding: 1-5 (green), 6-12 (amber), 15-25 (red)
   - Add/edit risk form: probability/impact sliders → live risk score preview
   - Risk linked to related task for implementation tracking
   - Add placeholder "Suggest Risks" button — Claude wires it in task 3b
   - *(Leave the interactive 5×5 heat map for Claude — task 3b)*

4. `[GLM]` Build **Change Request Log** (`/projects/[id]/changes`):
   - Table with: title, type (scope/schedule/finance/resource), status badge, priority, requested date
   - Detail sheet: full description, impact analysis, review notes, approval decision
   - Status workflow: Submitted → Under Review → Approved/Rejected → Implemented

5a. `[GLM]` Build **Lessons Learned** list + form (`/projects/[id]/lessons`):
   - List view: title, category, focus area, impact (positive/negative/neutral), recommendation
   - Filter by category, focus area, and impact type
   - Add placeholder "Generate from Activity Log" button — Claude wires it in task 5b

---

> 🔁 **HANDOFF → Claude Sonnet 4.6**
> **If you are GLM-5.1:** Charter form, Stakeholder table/form, Risk table/form, Change Request log, and Lessons Learned list are all built with placeholder AI buttons. The next tasks are Claude territory — power/interest grid, risk heat map, AI streaming, WBS tree, Focus Area advancement logic, and Domain Health scoring.
> **Tell Praise:** "PMBOK form and table UIs are done (Charter, Stakeholder Register, Risk Register, Change Requests, Lessons Learned — all with placeholder AI buttons). Tasks 1b, 2b, 3b, 5b, 6, 7, and 8 are Claude Sonnet 4.6 work. Switch models. Type 'continue' if you want me to attempt them."
> **If you are Claude Sonnet 4.6:** Proceed — tasks 1b, 2b, 3b, 5b, 6, 7, and 8 are yours.

---

1b. `[CLAUDE]` Wire **"Draft with AI" button** on Charter page — `streamText` streams charter content into form fields with typewriter effect
2b. `[CLAUDE]` Build **Stakeholder power/interest grid**: Recharts ScatterChart, 4 quadrants (Monitor / Keep Informed / Keep Satisfied / Manage Closely), stakeholders plotted as labeled dots. Wire "Identify with AI" button — AI suggests likely stakeholders based on project type and description.
3b. `[CLAUDE]` Build **interactive 5×5 probability-impact heat map**: cells animate on hover, risks appear as labeled dots with spring physics. Wire "Suggest Risks" AI button — identifies likely risks for this project type.
5b. `[CLAUDE]` Wire **"Generate from Activity Log" AI button** — AI reads activity log + notes and surfaces lessons as structured entries
6. `[CLAUDE]` Build **WBS Tree View** on Tasks page:
   - Toggle between Kanban view and WBS hierarchical tree view
   - WBS codes displayed on task cards (e.g., "1.2.3")
   - WBS code auto-generator (increments based on parent)
   - Collapsible tree nodes with subtask counts
7. `[CLAUDE]` Build **Focus Area advancement**:
   - "Advance to next Focus Area" button on project overview
   - Confirmation dialog: checklist of recommended processes for the current Focus Area
   - Confetti animation on advancement
   - Focus Area history logged to activity log
8. `[CLAUDE]` Build **Domain Health Dashboard** on project overview:
   - 7 domain health cards, each showing RAG status (Red/Amber/Green) + key metric
   - Recharts Radar chart showing all 7 domain scores
   - "Assess with AI" button → AI evaluates each domain based on project data and provides scores + commentary

---

> 🔁 **HANDOFF → GLM-5.1**
> **If you are Claude Sonnet 4.6:** Complex PMBOK visualizations and AI integrations are done. The next tasks are standard analytics charts and UX polish — GLM-5.1 territory.
> **Tell Praise:** "PMBOK complex components done (power/interest grid, risk heat map, WBS tree, Focus Area advancement, Domain Health + all AI buttons wired). Standard analytics charts and UX polish are GLM-5.1 work. Switch models to save tokens. Type 'continue' if you want me to handle them."
> **If you are GLM-5.1:** Proceed — tasks 9a and 11–15 are yours. Tasks 9b and 10 (domain-logic charts and AI features) will stay with Claude after.

---

#### Analytics Implementation

9a. `[GLM]` Build Analytics page — standard Recharts charts:
   - Completion timeline (area chart) — tasks completed over time
   - Tag distribution (treemap)
   - Weekly velocity (bar chart)
   - AI usage/cost tracker (bar chart — cost per day)
   - *(Leave Focus Area time distribution and risk score trend for Claude — task 9b)*

#### UX Polish

11. `[GLM]` Build keyboard shortcuts and command palette (Cmd+K): navigate to any project, create task, open chat, advance focus area
12. `[GLM]` Toast notifications for all CRUD operations (Sonner)
13. `[GLM]` Empty states with illustrations and PMBOK-aware prompts ("Start by creating a Project Charter")
14. `[GLM]` Error boundaries with friendly messages
15. `[GLM]` Server Component streaming with `loading.tsx` skeleton screens

---

> 🔁 **HANDOFF → Claude Sonnet 4.6**
> **If you are GLM-5.1:** Standard analytics charts and all UX polish are done. The remaining Phase 4 tasks are Claude territory — domain-logic charts that require querying activity log data, and AI-powered features.
> **Tell Praise:** "Analytics (standard charts) and UX polish (command palette, toasts, empty states, error boundaries, skeletons) are done. Tasks 9b and 10 — Focus Area timeline, risk score trend chart, and the AI-powered summary/report/suggestion features — are Claude Sonnet 4.6 work. Switch models. Type 'continue' if you want me to handle them."
> **If you are Claude Sonnet 4.6:** Proceed — tasks 9b and 10 are yours.

---

9b. `[CLAUDE]` Build domain-logic analytics charts:
   - Focus Area time distribution (pie chart — how long project spent in each Focus Area, derived from activity log timestamps)
   - Risk score trend (line chart — total risk exposure over time, derived from historical risk data)

10. `[CLAUDE]` Build AI-powered features:
    - Auto-generate project summary (LLM call with all project data)
    - Progress report generation (LLM summarizes activity log per PMBOK domain)
    - Smart task suggestions based on project type and WBS

**Deliverable**: Full PMBOK 8th Edition feature set (Charter, Stakeholders, Risks, Changes, Lessons, WBS, Domain Health, Focus Area lifecycle), analytics dashboard, polished UX.

---

### Phase 5: Portfolio Showcase + Production Deployment (Days 21–23) — "Ship It"

**Goal**: Public portfolio page, production RLS, and live deployment.

1. `[GLM]` Build public portfolio route (`/portfolio/[username]`):
   - Resolves `username` → `profiles.id` → query projects where `is_public = true`
   - Beautiful card grid with cover images, tags, Focus Area badge (shows "Completed" for done projects)
   - Project detail: timeline, description, tech stack, screenshots
   - No sidebar (marketing-style layout)
4. `[GLM]` Set up custom domain on Vercel
7. `[GLM]` Mobile responsive polish: sidebar → Sheet on mobile, kanban → horizontal scroll, risk matrix → scrollable
9. `[GLM]` Write README with setup instructions

---

> 🔁 **HANDOFF → Claude Sonnet 4.6**
> **If you are GLM-5.1:** Portfolio UI, mobile polish, and README are done. The remaining tasks are all security-critical or verification work — production RLS for 15 tables, migration workflow confirmation, environment variable audit, error monitoring, and the final verification checklist. These must be handled by Claude Sonnet 4.6.
> **Tell Praise:** "Portfolio page, mobile polish, and README are done. Tasks 2, 3, 5, 6, and 8 are Claude Sonnet 4.6 work — production RLS policies (all 15 tables), migration workflow, security audit, Sentry setup, and final verification. Switch models. Type 'continue' if you want me to attempt them."
> **If you are Claude Sonnet 4.6:** Proceed — tasks 2, 3, 5, 6, and 8 are yours.

---

2. `[CLAUDE]` Tighten RLS policies — replace dev permissive policy with owner-only for all 15 tables:
   ```sql
   DROP POLICY "dev_all" ON projects;
   CREATE POLICY "owner_only" ON projects FOR ALL USING (user_id = auth.uid());
   -- Repeat for all 15 tables; public projects readable by anyone:
   CREATE POLICY "public_read" ON projects FOR SELECT USING (is_public = true);
   ```
3. `[CLAUDE]` Confirm migration workflow is clean: all schema changes went through `drizzle-kit generate` → review SQL → `drizzle-kit migrate`. Verify no `drizzle-kit push` was ever run against the production database.
5. `[CLAUDE]` Environment variable audit in Vercel dashboard — confirm `SUPABASE_SERVICE_KEY` is server-only (never `NEXT_PUBLIC_`), all keys present and correctly scoped
6. `[CLAUDE]` Error monitoring setup (Sentry free tier or Vercel Runtime Logs)
8. `[CLAUDE]` Final testing per verification checklist (see Verification Checklist section below)

**Deliverable**: Production-ready app deployed on Vercel with custom domain, proper RLS, correct migration workflow.

---

## Budget Tiers

### Tier 1: $0/month — Fully Free ~~(not selected)~~

| Service | Tier | Monthly Limit | Notes |
|---|---|---|---|
| **Vercel** | Hobby | 100GB bandwidth, 1M function invocations, 4 CPU-hours | Pauses after 1 week inactivity (auto-unpause on visit) |
| **Supabase** | Free | 500MB DB, 1GB storage, 50K MAU auth, 2 projects | Pauses after 1 week inactivity. ~40-60MB preoccupied by system schemas |
| ~~Embeddings~~ | ~~Local: `Xenova/bge-small-en-v1.5`~~ | ~~Unlimited~~ | ~~384 dimensions, cold start risk on Vercel~~ |
| ~~LLM~~ | ~~Gemini 2.5 Flash free tier~~ | ~~60 RPM, 32K context~~ | ~~Content may be used by Google. Rate-limited~~ |
| ~~Alternative LLM~~ | ~~Ollama local (Llama 3.1 8B)~~ | ~~Unlimited~~ | ~~Requires 8GB+ RAM. Full privacy~~ |
| ~~Total~~ | | ~~**$0/month**~~ | ~~Viable but has cold start and tool-call reliability issues~~ |

**$0 tier constraints** (not applicable — $5-7 tier selected): ~~Supabase and Vercel both pause after 1 week of inactivity — giving portfolio visitors a ~30s cold start. This is a hard UX problem for the public portfolio page. Transformers.js local embedding risks cold start timeout on Vercel's 10s function limit. 500MB database with 15 tables + pgvector limits document storage to ~50-100 documents.~~

**$5-7 tier notes**: Cold start on Vercel/Supabase still applies (both free tiers), but embedding cold start is eliminated (OpenAI API call, not local model). 500MB database limit still applies — ~50-100 documents before needing Supabase Pro ($25/mo). Reranking with Cohere significantly improves retrieval quality.

### Tier 2: ~$5-7/month — Minimal Paid (Best Value) ✅ SELECTED

| Service | Tier | Cost | Notes |
|---|---|---|---|
| **Vercel** | Hobby (free) | $0 | Same limits as Tier 1 |
| **Supabase** | Free | $0 | Same limits as Tier 1 |
| **Embeddings** | OpenAI `text-embedding-3-small` | ~$0.50 | ~5000 embeddings/month at $0.02/1M tokens. Fixed — all vectors use this model |
| **LLM** | OpenAI `gpt-4o-mini` (or any provider via Settings) | ~$3-5 | ~50 chat sessions/month. **User can switch to OpenRouter, Google, Anthropic, or Ollama in Settings** |
| **Reranking** | Cohere `rerank-v3.5` | ~$1 | 1000 search queries/month, $0.001/query |
| **Total** | | **~$5-7/month** | **Huge quality upgrade**: better embeddings, configurable LLM, reranking, no cold start worries on embedding |

> **OpenRouter alternative**: If you prefer one API key for all models, use OpenRouter instead of OpenAI directly. Cost is similar (~$0.17/1M input for gpt-4o-mini). OpenRouter also gives access to Claude, Gemini, Llama, and 200+ other models with a single key — just change the provider in Settings.

### Tier 3: ~$28-33/month — Production

| Service | Tier | Cost | Notes |
|---|---|---|---|
| **Supabase** | Pro | $25/month | 8GB DB, 100GB storage, 100K MAU, daily backups, no pausing |
| **Vercel** | Hobby (free) | $0 | (upgrade to Pro $20 for commercial use) |
| **Embeddings** | OpenAI `text-embedding-3-small` | ~$1 | More documents, still negligible |
| **LLM** | Claude Sonnet 4.6 | ~$5-7 | ~100 chat sessions/month. Superior reasoning for PMBOK-guided RAG |
| **Reranking** | Cohere `rerank-v3.5` | ~$2 | More search volume |
| **Total** | | **~$28-33/month** | No pausing, daily backups, 8GB DB for many documents, best AI quality |

### Cost Optimization Strategies

1. **Cache embeddings**: Store permanently in pgvector. Generate once per chunk. Re-use across all queries.
2. **Batch embeddings**: Use AI SDK `embedMany()` instead of per-chunk API calls.
3. **Smaller LLM for simple tasks**: We're already using `gpt-4o-mini` as our primary LLM. If upgrading to Claude Sonnet for complex RAG answers, route charter drafting/summarization to `gpt-4o-mini` to save costs.
4. **Compress chat history**: Only send last 10 messages as context. For cross-session memory, use a summary compression strategy (AI summarizes old messages into a short paragraph before dropping them).
5. **Monitor usage**: The `aiUsageLog` table tracks every API call with cost in micro-cents for precision.

**Recommendation**: **$5-7 tier selected** ✅ — eliminates embedding cold start, gives reliable tool calling via OpenAI, adds Cohere reranking for better retrieval. Move to Tier 3 when you want no pausing for portfolio visitors, daily backups, or exceed 500MB database.

---

## Deployment Strategy

### Environment Variables

```
.env.local (development)
  DATABASE_URL=               # Supabase direct connection (for Drizzle)
  NEXT_PUBLIC_SUPABASE_URL=   # Supabase project URL
  NEXT_PUBLIC_SUPABASE_ANON=  # Supabase anon key (public, safe)
  SUPABASE_SERVICE_KEY=       # Service role key (server-only, NEVER NEXT_PUBLIC_)
  OPENAI_API_KEY=             # Required — embeddings + default LLM
  OPENROUTER_API_KEY=         # Optional — alternative provider for all models
  GOOGLE_AI_API_KEY=          # Optional — for Gemini provider
  ANTHROPIC_API_KEY=          # Optional — for Claude provider
  COHERE_API_KEY=             # Required — reranking
```

### Deployment Pipeline

1. **Branch strategy**: `main` = production, `dev` = development. Feature branches off `dev`.
2. **Vercel auto-deploy**: Connected to GitHub. Push to `main` → production deploy. Push to `dev` → preview deploy.
3. **Database migrations**: Always use `drizzle-kit generate` → review the generated SQL → `drizzle-kit migrate`. Never use `drizzle-kit push` against production.
4. **Environment variables**: Set in Vercel dashboard. `SUPABASE_SERVICE_KEY` must never appear as `NEXT_PUBLIC_`.

### Supabase Project Configuration

1. Enable `vector` extension: `CREATE EXTENSION vector WITH SCHEMA extensions;`
2. Enable RLS on all 15 tables (dev: permissive policy; prod: owner-only)
3. Set up Storage bucket for documents: `project-documents` bucket with 50MB max file size, allowed MIME types: `application/pdf`, `text/plain`, `text/markdown`
4. Configure Auth providers: Email + Google OAuth
5. Set up `hybrid_search` RPC function
6. Set up `document_chunks_search_vector_update` trigger

### Performance Considerations

- Server Components by default — only `"use client"` when interactivity needed
- Streaming: `loading.tsx` files for instant skeleton UI
- Image optimization: Next.js `<Image>` for cover images
- Database connection pooling: Supabase Shared Pooler connection string (port 6543) for Drizzle

---

## Verification Checklist

### Core Functionality
1. **Auth + Onboarding**: Sign up → enter username → see dashboard → username visible at `/portfolio/[username]`
2. **Projects**: Create project → add tasks → edit → verify on dashboard → advance Focus Area
3. **Kanban**: Drag task between columns → verify order persists after refresh
4. **WBS**: Switch to WBS tree view → verify hierarchy and codes display correctly
5. **RAG**: Upload PDF → wait for processing → ask question in chat → verify answer cites source document
6. **AI Write Tools**: Ask AI to create a task → confirmation dialog appears → approve → task created
7. **Analytics**: Create 5+ projects with tasks → verify charts render with real data
8. **Portfolio**: Mark project public → visit `/portfolio/[username]` → verify visible without login
9. **Mobile**: Sidebar → sheet on mobile, kanban → horizontal scroll, risk matrix → scrollable
10. **Dark mode**: Toggle → smooth color transition + GradientMesh shifts

### PMBOK 8th Edition Features
11. **Project Charter**: Open charter page → fill fields → save → AI draft populates fields
12. **Focus Area**: Advance project from Initiating → Planning → verify badge updates on card
13. **Stakeholder Register**: Add stakeholder → verify power/interest grid places them correctly
14. **Risk Register**: Add risk with probability=4, impact=5 → verify score=20 → verify red color in matrix
15. **Change Request**: Submit change request → change status to Approved → verify status badge updates
16. **Lessons Learned**: Add lesson → generate from AI → verify lessons list populates
17. **Domain Health**: Open domain health on project overview → verify 7 domains show with AI assessment

### Security + Data Integrity
18. **RLS (production)**: Log out → attempt to fetch `/api/projects` directly → verify 403
19. **Rate limiting**: Send 31 chat requests in 1 minute → verify 429 on the 31st
20. **AI write confirmation**: Verify AI cannot create tasks without user clicking "Confirm" in dialog
21. **File validation**: Attempt to upload `.exe` file → verify rejection with clear error
