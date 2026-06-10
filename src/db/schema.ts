import {
  pgTable, serial, text, varchar, timestamp, integer,
  boolean, jsonb, index, unique, numeric, foreignKey, vector,
} from 'drizzle-orm/pg-core';
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

// ============ PORTFOLIOS ============
export const portfolios = pgTable('portfolios', {
  id: serial('id').primaryKey(),
  userId: varchar('user_id', { length: 36 }).notNull(),
  name: varchar('name', { length: 255 }).notNull(),
  description: text('description'),
  color: varchar('color', { length: 30 }).default('amber'),
  // amber | violet | emerald | sky | rose | slate
  createdAt: timestamp('created_at').notNull().defaultNow(),
  updatedAt: timestamp('updated_at').notNull().$onUpdate(() => new Date()),
});

// ============ PROJECTS ============
export const projects = pgTable('projects', {
  id: serial('id').primaryKey(),
  userId: varchar('user_id', { length: 36 }).notNull(),
  portfolioId: integer('portfolio_id'),
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
  budget: numeric('budget', { precision: 12, scale: 2 }),
  currency: varchar('currency', { length: 3 }).default('USD'), // USD | NGN | EUR | GBP
  budgetSpent: numeric('budget_spent', { precision: 12, scale: 2 }),
  baselineStartDate: timestamp('baseline_start_date'),
  baselineEndDate: timestamp('baseline_end_date'),
  qualityMetrics: jsonb('quality_metrics').$type<{
    defectsFound?: number;
    defectsResolved?: number;
    testCoverage?: number;
    inspectionsPassed?: number;
    inspectionsFailed?: number;
    qualityScore?: number;
    notes?: string;
  }>(),
  progressPercent: integer('progress_percent').default(0),
  coverImage: text('cover_image'), // Supabase Storage URL
  isPublic: boolean('is_public').default(false), // portfolio visibility
  isLegacy: boolean('is_legacy').notNull().default(false),
  legacySummary: jsonb('legacy_summary').$type<{
    clientOrg?: string;
    yourRole?: string;
    outcome?: string;
    deliverables?: string;
    skills?: string;
    teamSize?: string;
    methodology?: string;
    lessons?: string;
  }>(),
  charter: jsonb('charter').$type<{
    projectPurpose?: string;
    objectives?: string;
    scopeSummary?: string;
    deliverables?: string;
    acceptanceCriteria?: string;
    assumptions?: string;
    constraints?: string;
    scheduleSummary?: string;
    stakeholderOverview?: string;
    riskApproach?: string;
    successMetrics?: string;
  }>(),
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
  actualHours: numeric('actual_hours', { precision: 6, scale: 2 }),
  estimatedCost: numeric('estimated_cost', { precision: 10, scale: 2 }),
  actualCost: numeric('actual_cost', { precision: 10, scale: 2 }),
  percentComplete: integer('percent_complete').default(0),
  wbsCode: varchar('wbs_code', { length: 20 }), // e.g. "1.2.3" for WBS numbering
  predecessorId: integer('predecessor_id'), // task dependency (sequence activities)
  orderIndex: integer('order_index').notNull().default(0),
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
      .with({ m: 16, ef_construction: 64 }),
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

// ============ ISSUE LOG (PMBOK 8 — Monitoring & Controlling) ============
export const issues = pgTable('issues', {
  id: serial('id').primaryKey(),
  projectId: integer('project_id').notNull().references(() => projects.id, { onDelete: 'cascade' }),
  title: varchar('title', { length: 500 }).notNull(),
  description: text('description'),
  impact: varchar('impact', { length: 20 }).default('medium'), // low | medium | high | critical
  owner: varchar('owner', { length: 255 }),
  status: varchar('status', { length: 50 }).default('open').notNull(), // open | in_progress | resolved | closed
  resolvedDate: timestamp('resolved_date'),
  createdAt: timestamp('created_at').notNull().defaultNow(),
  updatedAt: timestamp('updated_at').notNull().$onUpdate(() => new Date()),
});

// ============ PROJECT REPORTS ============
export const projectReports = pgTable('project_reports', {
  id: serial('id').primaryKey(),
  userId: varchar('user_id', { length: 36 }).notNull(),
  projectId: integer('project_id').notNull().references(() => projects.id, { onDelete: 'cascade' }),
  type: varchar('type', { length: 100 }).notNull(),
  content: text('content').notNull(),
  createdAt: timestamp('created_at').notNull().defaultNow(),
});

// ============ CHAT SESSIONS ============
export const chatSessions = pgTable('chat_sessions', {
  id: serial('id').primaryKey(),
  userId: varchar('user_id', { length: 36 }).notNull(),
  title: varchar('title', { length: 255 }).default('New Chat'),
  projectId: integer('project_id').references(() => projects.id, { onDelete: 'set null' }),
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

// ============================================================
// RELATIONS
// ============================================================

export const portfoliosRelations = relations(portfolios, ({ one, many }) => ({
  user: one(profiles, { fields: [portfolios.userId], references: [profiles.id] }),
  projects: many(projects),
}));

export const profilesRelations = relations(profiles, ({ many }) => ({
  portfolios: many(portfolios),
  projects: many(projects),
  chatSessions: many(chatSessions),
  documents: many(documents),
  aiUsageLog: many(aiUsageLog),
}));

export const projectsRelations = relations(projects, ({ one, many }) => ({
  user: one(profiles, { fields: [projects.userId], references: [profiles.id] }),
  portfolio: one(portfolios, { fields: [projects.portfolioId], references: [portfolios.id] }),
  tasks: many(tasks),
  notes: many(notes),
  documents: many(documents),
  projectTags: many(projectTags),
  activityLog: many(activityLog),
  stakeholders: many(stakeholders),
  risks: many(risks),
  changeRequests: many(changeRequests),
  lessonsLearned: many(lessonsLearned),
  chatSessions: many(chatSessions),
  issues: many(issues),
  projectReports: many(projectReports),
}));

export const tasksRelations = relations(tasks, ({ one, many }) => ({
  project: one(projects, { fields: [tasks.projectId], references: [projects.id] }),
  subtasks: many(tasks, { relationName: 'subtasks' }),
  parentTask: one(tasks, { fields: [tasks.parentId], references: [tasks.id], relationName: 'subtasks' }),
  predecessor: one(tasks, { fields: [tasks.predecessorId], references: [tasks.id], relationName: 'predecessor' }),
  successors: many(tasks, { relationName: 'predecessor' }),
  taskTags: many(taskTags),
  relatedRisks: many(risks, { relationName: 'relatedRisks' }),
}));

export const notesRelations = relations(notes, ({ one }) => ({
  project: one(projects, { fields: [notes.projectId], references: [projects.id] }),
}));

export const documentsRelations = relations(documents, ({ one, many }) => ({
  project: one(projects, { fields: [documents.projectId], references: [projects.id] }),
  user: one(profiles, { fields: [documents.userId], references: [profiles.id] }),
  chunks: many(documentChunks),
}));

export const documentChunksRelations = relations(documentChunks, ({ one }) => ({
  document: one(documents, { fields: [documentChunks.documentId], references: [documents.id] }),
  project: one(projects, { fields: [documentChunks.projectId], references: [projects.id] }),
}));

export const tagsRelations = relations(tags, ({ many }) => ({
  projectTags: many(projectTags),
  taskTags: many(taskTags),
}));

export const projectTagsRelations = relations(projectTags, ({ one }) => ({
  project: one(projects, { fields: [projectTags.projectId], references: [projects.id] }),
  tag: one(tags, { fields: [projectTags.tagId], references: [tags.id] }),
}));

export const taskTagsRelations = relations(taskTags, ({ one }) => ({
  task: one(tasks, { fields: [taskTags.taskId], references: [tasks.id] }),
  tag: one(tags, { fields: [taskTags.tagId], references: [tags.id] }),
}));

export const activityLogRelations = relations(activityLog, ({ one }) => ({
  project: one(projects, { fields: [activityLog.projectId], references: [projects.id] }),
}));

export const stakeholdersRelations = relations(stakeholders, ({ one }) => ({
  project: one(projects, { fields: [stakeholders.projectId], references: [projects.id] }),
}));

export const risksRelations = relations(risks, ({ one }) => ({
  project: one(projects, { fields: [risks.projectId], references: [projects.id] }),
  relatedTask: one(tasks, { fields: [risks.relatedTaskId], references: [tasks.id], relationName: 'relatedRisks' }),
}));

export const changeRequestsRelations = relations(changeRequests, ({ one }) => ({
  project: one(projects, { fields: [changeRequests.projectId], references: [projects.id] }),
}));

export const lessonsLearnedRelations = relations(lessonsLearned, ({ one }) => ({
  project: one(projects, { fields: [lessonsLearned.projectId], references: [projects.id] }),
}));

export const chatSessionsRelations = relations(chatSessions, ({ one, many }) => ({
  user: one(profiles, { fields: [chatSessions.userId], references: [profiles.id] }),
  project: one(projects, { fields: [chatSessions.projectId], references: [projects.id] }),
  messages: many(chatMessages),
}));

export const chatMessagesRelations = relations(chatMessages, ({ one }) => ({
  session: one(chatSessions, { fields: [chatMessages.sessionId], references: [chatSessions.id] }),
}));

export const aiUsageLogRelations = relations(aiUsageLog, ({ one }) => ({
  user: one(profiles, { fields: [aiUsageLog.userId], references: [profiles.id] }),
}));

export const issuesRelations = relations(issues, ({ one }) => ({
  project: one(projects, { fields: [issues.projectId], references: [projects.id] }),
}));

export const projectReportsRelations = relations(projectReports, ({ one }) => ({
  project: one(projects, { fields: [projectReports.projectId], references: [projects.id] }),
}));