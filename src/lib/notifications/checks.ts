import { db } from '@/db';
import { projects, tasks, risks } from '@/db/schema';
import { eq, and, lt, lte, gte, not, inArray, isNotNull, asc } from 'drizzle-orm';

// Days in each PMBOK phase before a "phase stuck" alert fires
export const PHASE_THRESHOLDS: Record<string, number> = {
  initiating: 14,
  planning: 21,
  executing: 60,
  monitoring_controlling: 30,
  closing: 14,
};

export const PHASE_LABELS: Record<string, string> = {
  initiating: 'Initiating',
  planning: 'Planning',
  executing: 'Executing',
  monitoring_controlling: 'Monitoring & Controlling',
  closing: 'Closing',
};

export const PHASE_CHECKLISTS: Record<string, string[]> = {
  initiating: [
    'Develop the Project Charter',
    'Identify stakeholders and document in the stakeholder register',
    'Define high-level scope and objectives',
    'Obtain formal project authorization',
    'Establish initial budget and timeline estimates',
  ],
  planning: [
    'Develop the Work Breakdown Structure (WBS)',
    'Create the project schedule and identify the critical path',
    'Finalize the budget baseline',
    'Complete the risk register with initial assessments',
    'Define the communication management plan',
    'Identify and plan for resource requirements',
  ],
  executing: [
    'Confirm team alignment on deliverable expectations',
    'Conduct regular team status check-ins',
    'Manage stakeholder engagement and communications',
    'Perform quality assurance reviews',
    'Update task completion and log actual hours',
  ],
  monitoring_controlling: [
    'Generate status reports against the baseline',
    'Review and action outstanding change requests',
    'Assess the risk register for new or evolving risks',
    'Monitor schedule and budget variances (SV, CV)',
    'Update stakeholder engagement levels',
  ],
  closing: [
    'Obtain formal acceptance of all deliverables',
    'Capture lessons learned from all project phases',
    'Release project resources and close contracts',
    'Archive all project documentation',
    'Complete financial closeout and submit final report',
  ],
};

export interface OverdueTask {
  id: number;
  title: string;
  priority: string | null;
  dueDate: Date;
  projectName: string;
  daysOverdue: number;
}

export interface EscalatedRisk {
  id: number;
  title: string;
  riskScore: number | null;
  status: string | null;
  updatedAt: Date;
  projectName: string;
  daysStale: number;
}

export interface StuckPhase {
  projectId: number;
  projectName: string;
  phase: string;
  daysUnchanged: number;
  threshold: number;
  checklist: string[];
}

export interface DueSoonTask {
  id: number;
  title: string;
  dueDate: Date;
  priority: string | null;
  projectName: string;
}

export interface ProjectSummary {
  id: number;
  name: string;
  status: string;
  phase: string | null;
  progressPercent: number | null;
}

export interface NotificationData {
  projects: ProjectSummary[];
  overdueTasks: OverdueTask[];
  escalatedRisks: EscalatedRisk[];
  stuckPhases: StuckPhase[];
  dueSoon: DueSoonTask[];
}

export async function getNotificationData(userId: string): Promise<NotificationData | null> {
  const now = new Date();

  // All non-archived projects for the user
  const userProjects = await db
    .select()
    .from(projects)
    .where(and(
      eq(projects.userId, userId),
      not(inArray(projects.status, ['archived']))
    ));

  if (userProjects.length === 0) return null;

  // Active projects (not completed, not archived) are subject to alert checks
  const activeProjects = userProjects.filter(
    (p) => p.status !== 'completed' && p.status !== 'archived'
  );

  // --- Overdue tasks ---
  let overdueTasks: OverdueTask[] = [];
  if (activeProjects.length > 0) {
    const rows = await db
      .select({
        id: tasks.id,
        title: tasks.title,
        priority: tasks.priority,
        dueDate: tasks.dueDate,
        projectName: projects.name,
      })
      .from(tasks)
      .innerJoin(projects, eq(tasks.projectId, projects.id))
      .where(and(
        eq(projects.userId, userId),
        not(inArray(tasks.status, ['done'])),
        isNotNull(tasks.dueDate),
        lt(tasks.dueDate, now),
        not(inArray(projects.status, ['archived', 'completed']))
      ))
      .orderBy(asc(tasks.dueDate));

    overdueTasks = rows
      .filter((r) => r.dueDate != null)
      .map((r) => ({
        id: r.id,
        title: r.title,
        priority: r.priority,
        dueDate: r.dueDate!,
        projectName: r.projectName,
        daysOverdue: Math.floor((now.getTime() - r.dueDate!.getTime()) / 86_400_000),
      }));
  }

  // --- Escalated risks: score >= 12 (high on 5×5 matrix), not closed, stale > 7 days ---
  let escalatedRisks: EscalatedRisk[] = [];
  if (activeProjects.length > 0) {
    const sevenDaysAgo = new Date(now.getTime() - 7 * 86_400_000);
    const rows = await db
      .select({
        id: risks.id,
        title: risks.title,
        riskScore: risks.riskScore,
        status: risks.status,
        updatedAt: risks.updatedAt,
        projectName: projects.name,
      })
      .from(risks)
      .innerJoin(projects, eq(risks.projectId, projects.id))
      .where(and(
        eq(projects.userId, userId),
        not(inArray(risks.status, ['closed', 'materialized'])),
        gte(risks.riskScore, 12),
        lt(risks.updatedAt, sevenDaysAgo),
        not(inArray(projects.status, ['archived', 'completed']))
      ));

    escalatedRisks = rows.map((r) => ({
      id: r.id,
      title: r.title,
      riskScore: r.riskScore,
      status: r.status,
      updatedAt: r.updatedAt,
      projectName: r.projectName,
      daysStale: Math.floor((now.getTime() - r.updatedAt.getTime()) / 86_400_000),
    }));
  }

  // --- Stuck phases: project updatedAt older than the phase-specific threshold ---
  const stuckPhases: StuckPhase[] = activeProjects
    .filter((p) => p.currentFocusArea != null)
    .map((p) => {
      const phase = p.currentFocusArea!;
      const threshold = PHASE_THRESHOLDS[phase] ?? 30;
      const daysUnchanged = Math.floor((now.getTime() - p.updatedAt.getTime()) / 86_400_000);
      return {
        projectId: p.id,
        projectName: p.name,
        phase,
        daysUnchanged,
        threshold,
        checklist: PHASE_CHECKLISTS[phase] ?? [],
      };
    })
    .filter((p) => p.daysUnchanged > p.threshold);

  // --- Due soon: tasks due within the next 48 hours ---
  let dueSoon: DueSoonTask[] = [];
  if (activeProjects.length > 0) {
    const in48h = new Date(now.getTime() + 48 * 60 * 60 * 1000);
    const rows = await db
      .select({
        id: tasks.id,
        title: tasks.title,
        dueDate: tasks.dueDate,
        priority: tasks.priority,
        projectName: projects.name,
      })
      .from(tasks)
      .innerJoin(projects, eq(tasks.projectId, projects.id))
      .where(and(
        eq(projects.userId, userId),
        not(inArray(tasks.status, ['done'])),
        isNotNull(tasks.dueDate),
        gte(tasks.dueDate, now),
        lte(tasks.dueDate, in48h),
        not(inArray(projects.status, ['archived', 'completed']))
      ))
      .orderBy(asc(tasks.dueDate));

    dueSoon = rows
      .filter((r) => r.dueDate != null)
      .map((r) => ({
        id: r.id,
        title: r.title,
        dueDate: r.dueDate!,
        priority: r.priority,
        projectName: r.projectName,
      }));
  }

  const projectSummaries: ProjectSummary[] = userProjects.map((p) => ({
    id: p.id,
    name: p.name,
    status: p.status,
    phase: p.currentFocusArea,
    progressPercent: p.progressPercent,
  }));

  return { projects: projectSummaries, overdueTasks, escalatedRisks, stuckPhases, dueSoon };
}
