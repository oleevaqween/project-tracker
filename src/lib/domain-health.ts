export type DomainStatus = 'green' | 'amber' | 'red';

export type DomainScore = {
  key: string;
  name: string;
  score: number; // 0-100
  status: DomainStatus;
  detail: string;
};

export type DomainHealthResult = {
  domains: DomainScore[];
  overallScore: number;
  overallStatus: DomainStatus;
};

function statusFromScore(score: number): DomainStatus {
  if (score >= 70) return 'green';
  if (score >= 40) return 'amber';
  return 'red';
}

type Task = { status: string; dueDate: Date | null; wbsCode: string | null; estimatedCost: string | null };
type Risk = { riskScore: number | null; responseType: string | null; status: string | null };
type Stakeholder = { engagementStrategy: string | null; communicationPlan: string | null; engagementLevel: string | null; desiredEngagementLevel: string | null };
type ChangeRequest = { status: string | null };
type Project = { budget: string | null; progressPercent: number | null; charter: unknown; description: string | null };

export function computeDomainHealth(
  project: Project,
  tasks: Task[],
  risks: Risk[],
  stakeholders: Stakeholder[],
  changeRequests: ChangeRequest[],
): DomainHealthResult {
  const now = new Date();

  // Governance: charter, change control, project description
  let governanceScore = 0;
  const hasCharter = project.charter && Object.values(project.charter as Record<string, unknown>).some(v => v && String(v).trim().length > 10);
  if (hasCharter) governanceScore += 50;
  if (project.description && project.description.length > 20) governanceScore += 20;
  const handledCRs = changeRequests.filter(cr => ['approved', 'rejected', 'implemented'].includes(cr.status ?? ''));
  if (changeRequests.length === 0) governanceScore += 30;
  else if (handledCRs.length / changeRequests.length >= 0.5) governanceScore += 30;
  const govDetail = hasCharter
    ? `Charter complete · ${changeRequests.length} change request${changeRequests.length !== 1 ? 's' : ''}`
    : `Charter not yet drafted · ${changeRequests.length} change request${changeRequests.length !== 1 ? 's' : ''}`;

  // Scope: tasks with WBS codes, task coverage
  let scopeScore = 0;
  if (tasks.length > 0) {
    scopeScore += 30;
    const wbsTasks = tasks.filter(t => t.wbsCode && t.wbsCode.trim());
    if (wbsTasks.length > 0) scopeScore += Math.min(40, Math.round((wbsTasks.length / tasks.length) * 40));
    if (project.description && project.description.length > 50) scopeScore += 30;
  }
  const scopeDetail = tasks.length > 0
    ? `${tasks.length} task${tasks.length !== 1 ? 's' : ''} · ${tasks.filter(t => t.wbsCode).length} with WBS codes`
    : 'No tasks defined yet';

  // Schedule: tasks with due dates, overdue ratio
  let scheduleScore = 0;
  if (tasks.length > 0) {
    scheduleScore += 20;
    const tasksWithDue = tasks.filter(t => t.dueDate);
    if (tasksWithDue.length > 0) scheduleScore += Math.min(30, Math.round((tasksWithDue.length / tasks.length) * 30));
    const openTasks = tasks.filter(t => t.status !== 'done');
    const overdue = openTasks.filter(t => t.dueDate && new Date(t.dueDate) < now);
    const overdueRatio = openTasks.length > 0 ? overdue.length / openTasks.length : 0;
    scheduleScore += Math.round((1 - overdueRatio) * 50);
  }
  const overdueTasks = tasks.filter(t => t.status !== 'done' && t.dueDate && new Date(t.dueDate) < now);
  const scheduleDetail = overdueTasks.length > 0
    ? `${overdueTasks.length} overdue task${overdueTasks.length !== 1 ? 's' : ''}`
    : tasks.length > 0 ? 'Schedule on track' : 'No tasks defined';

  // Finance: budget set, cost estimates
  let financeScore = 0;
  if (project.budget && Number(project.budget) > 0) financeScore += 50;
  const tasksWithCost = tasks.filter(t => t.estimatedCost && Number(t.estimatedCost) > 0);
  if (tasks.length > 0 && tasksWithCost.length > 0) {
    financeScore += Math.min(50, Math.round((tasksWithCost.length / tasks.length) * 50));
  } else if (tasks.length === 0) {
    financeScore += project.budget ? 50 : 0;
  }
  const financeDetail = project.budget
    ? `Budget: $${Number(project.budget).toLocaleString()} · ${tasksWithCost.length}/${tasks.length} tasks costed`
    : 'No budget set';

  // Risk: risks documented, critical risks mitigated
  let riskScore = 0;
  if (risks.length === 0) {
    riskScore = 30; // neutral — may just mean no risks identified yet
  } else {
    riskScore += 40;
    const criticalUnmitigated = risks.filter(r => (r.riskScore ?? 0) >= 15 && !r.responseType && r.status !== 'closed');
    riskScore += criticalUnmitigated.length === 0 ? 40 : Math.max(0, 40 - criticalUnmitigated.length * 10);
    const withResponse = risks.filter(r => r.responseType);
    riskScore += Math.min(20, Math.round((withResponse.length / risks.length) * 20));
  }
  const criticalRisks = risks.filter(r => (r.riskScore ?? 0) >= 15);
  const riskDetail = risks.length === 0
    ? 'No risks identified yet'
    : `${risks.length} risk${risks.length !== 1 ? 's' : ''} · ${criticalRisks.length} critical`;

  // Resources: stakeholders as proxy for resource planning
  let resourcesScore = 0;
  if (stakeholders.length > 0) {
    resourcesScore += 50;
    const withStrategy = stakeholders.filter(s => s.engagementStrategy && s.engagementStrategy.length > 10);
    resourcesScore += Math.min(50, Math.round((withStrategy.length / stakeholders.length) * 50));
  }
  const resourcesDetail = stakeholders.length > 0
    ? `${stakeholders.length} stakeholder${stakeholders.length !== 1 ? 's' : ''} registered`
    : 'No stakeholders registered';

  // Stakeholders: engagement tracking
  let stakeholdersScore = 0;
  if (stakeholders.length > 0) {
    stakeholdersScore += 30;
    const withComm = stakeholders.filter(s => s.communicationPlan && s.communicationPlan.length > 10);
    stakeholdersScore += Math.min(30, Math.round((withComm.length / stakeholders.length) * 30));
    const atOrAboveDesired = stakeholders.filter(s => {
      if (!s.desiredEngagementLevel || !s.engagementLevel) return false;
      const levels = ['unaware', 'resistant', 'neutral', 'supportive', 'leading'];
      return levels.indexOf(s.engagementLevel) >= levels.indexOf(s.desiredEngagementLevel);
    });
    stakeholdersScore += Math.min(40, Math.round((atOrAboveDesired.length / stakeholders.length) * 40));
  }
  const stakeholdersDetail = stakeholders.length > 0
    ? `${stakeholders.length} stakeholder${stakeholders.length !== 1 ? 's' : ''} · engagement tracked`
    : 'No stakeholders registered';

  const domains: DomainScore[] = [
    { key: 'governance', name: 'Governance', score: Math.min(100, governanceScore), status: statusFromScore(governanceScore), detail: govDetail },
    { key: 'scope', name: 'Scope', score: Math.min(100, scopeScore), status: statusFromScore(scopeScore), detail: scopeDetail },
    { key: 'schedule', name: 'Schedule', score: Math.min(100, scheduleScore), status: statusFromScore(scheduleScore), detail: scheduleDetail },
    { key: 'finance', name: 'Finance', score: Math.min(100, financeScore), status: statusFromScore(financeScore), detail: financeDetail },
    { key: 'risk', name: 'Risk', score: Math.min(100, riskScore), status: statusFromScore(riskScore), detail: riskDetail },
    { key: 'resources', name: 'Resources', score: Math.min(100, resourcesScore), status: statusFromScore(resourcesScore), detail: resourcesDetail },
    { key: 'stakeholders', name: 'Stakeholders', score: Math.min(100, stakeholdersScore), status: statusFromScore(stakeholdersScore), detail: stakeholdersDetail },
  ];

  const overallScore = Math.round(domains.reduce((sum, d) => sum + d.score, 0) / domains.length);

  return {
    domains,
    overallScore,
    overallStatus: statusFromScore(overallScore),
  };
}
