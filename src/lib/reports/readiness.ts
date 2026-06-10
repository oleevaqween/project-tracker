import type { ReportType, ReportReadiness, ReadinessTier } from './types';

type ProjectSnap = {
  description?: string | null;
  charter?: Record<string, unknown> | null;
  startDate?: Date | null;
  targetEndDate?: Date | null;
  budget?: string | null;
  budgetSpent?: string | null;
  baselineStartDate?: Date | null;
  baselineEndDate?: Date | null;
  qualityMetrics?: Record<string, unknown> | null;
};

type DataSnap = {
  tasks: { estimatedHours?: string | null; actualHours?: string | null; dueDate?: Date | null }[];
  risks: { probability?: number | null; impact?: number | null; responseAction?: string | null; owner?: string | null }[];
  stakeholders: { influence?: number | null; interest?: number | null; engagementStrategy?: string | null; communicationPlan?: string | null }[];
  changeRequests: { impactDescription?: string | null }[];
  lessonsLearned: { recommendation?: string | null }[];
  issues: { impact?: string | null; owner?: string | null }[];
};

function tier(score: number): ReadinessTier {
  if (score >= 67) return 'rich';
  if (score >= 34) return 'standard';
  return 'basic';
}

function clamp(v: number) {
  return Math.min(100, Math.round(v));
}

function hasCharter(p: ProjectSnap) {
  if (!p.charter) return false;
  return Object.values(p.charter).some((v) => v && String(v).trim().length > 0);
}

export function computeReadiness(
  type: ReportType,
  project: ProjectSnap,
  data: DataSnap,
): ReportReadiness {
  const missing: string[] = [];
  let score = 0;

  switch (type) {
    case 'status_report': {
      if (project.description) score += 10; else missing.push('Project description');
      if (hasCharter(project)) score += 25; else missing.push('Project charter');
      if (data.tasks.length > 0) score += 25; else missing.push('Tasks');
      if (data.risks.length > 0) score += 20; else missing.push('Risk register');
      if (data.stakeholders.length > 0) score += 10; else missing.push('Stakeholders');
      if (project.startDate && project.targetEndDate) score += 10; else missing.push('Start and end dates');
      break;
    }
    case 'risk_report': {
      if (data.risks.length > 0) score += 40; else missing.push('Risk register entries');
      const withScores = data.risks.filter((r) => r.probability && r.impact).length;
      if (withScores > 0) score += clamp((withScores / Math.max(data.risks.length, 1)) * 30);
      else missing.push('Probability and impact ratings on risks');
      const withResponse = data.risks.filter((r) => r.responseAction).length;
      if (withResponse > 0) score += clamp((withResponse / Math.max(data.risks.length, 1)) * 20);
      else missing.push('Response actions on risks');
      const withOwner = data.risks.filter((r) => r.owner).length;
      if (withOwner > 0) score += clamp((withOwner / Math.max(data.risks.length, 1)) * 10);
      else missing.push('Risk owners');
      break;
    }
    case 'stakeholder_report': {
      if (data.stakeholders.length > 0) score += 40; else missing.push('Stakeholder register entries');
      const withGrid = data.stakeholders.filter((s) => s.influence && s.interest).length;
      if (withGrid > 0) score += clamp((withGrid / Math.max(data.stakeholders.length, 1)) * 30);
      else missing.push('Influence and interest ratings on stakeholders');
      const withStrategy = data.stakeholders.filter((s) => s.engagementStrategy).length;
      if (withStrategy > 0) score += clamp((withStrategy / Math.max(data.stakeholders.length, 1)) * 20);
      else missing.push('Engagement strategies on stakeholders');
      const withComms = data.stakeholders.filter((s) => s.communicationPlan).length;
      if (withComms > 0) score += clamp((withComms / Math.max(data.stakeholders.length, 1)) * 10);
      else missing.push('Communication plans on stakeholders');
      break;
    }
    case 'change_request_report': {
      if (data.changeRequests.length > 0) score += 60; else missing.push('Change requests');
      const withImpact = data.changeRequests.filter((c) => c.impactDescription).length;
      if (withImpact > 0) score += clamp((withImpact / Math.max(data.changeRequests.length, 1)) * 40);
      else missing.push('Impact descriptions on change requests');
      break;
    }
    case 'lessons_learned_report': {
      if (data.lessonsLearned.length > 0) score += 60; else missing.push('Lessons learned entries');
      const withRec = data.lessonsLearned.filter((l) => l.recommendation).length;
      if (withRec > 0) score += clamp((withRec / Math.max(data.lessonsLearned.length, 1)) * 40);
      else missing.push('Recommendations on lessons learned');
      break;
    }
    case 'executive_summary': {
      if (hasCharter(project)) score += 25; else missing.push('Project charter');
      if (data.tasks.length > 0) score += 20; else missing.push('Tasks');
      if (data.risks.length > 0) score += 20; else missing.push('Risk register');
      if (data.stakeholders.length > 0) score += 15; else missing.push('Stakeholders');
      if (project.startDate && project.targetEndDate) score += 20; else missing.push('Project dates');
      break;
    }
    case 'performance_report': {
      const withEstHours = data.tasks.filter((t) => t.estimatedHours).length;
      if (withEstHours > 0) score += clamp((withEstHours / Math.max(data.tasks.length, 1)) * 25);
      else missing.push('Estimated hours on tasks');
      const withActHours = data.tasks.filter((t) => t.actualHours).length;
      if (withActHours > 0) score += clamp((withActHours / Math.max(data.tasks.length, 1)) * 35);
      else missing.push('Actual hours logged on tasks');
      if (project.budget) score += 20; else missing.push('Planned budget');
      if (project.budgetSpent) score += 20; else missing.push('Budget spent (actual cost)');
      break;
    }
    case 'forecast_report': {
      if (project.startDate && project.targetEndDate) score += 25; else missing.push('Project start and end dates');
      if (data.tasks.length > 0) score += 25; else missing.push('Tasks');
      const withDue = data.tasks.filter((t) => t.dueDate).length;
      if (withDue > 0) score += clamp((withDue / Math.max(data.tasks.length, 1)) * 25);
      else missing.push('Due dates on tasks');
      if (project.budget) score += 12; else missing.push('Planned budget');
      if (project.budgetSpent) score += 13; else missing.push('Budget spent');
      break;
    }
    case 'issue_log_report': {
      if (data.issues.length > 0) score += 70; else missing.push('Issue log entries');
      const withDetail = data.issues.filter((i) => i.impact && i.owner).length;
      if (withDetail > 0) score += clamp((withDetail / Math.max(data.issues.length, 1)) * 30);
      else missing.push('Impact and owner on issues');
      break;
    }
    case 'quality_report': {
      const qm = project.qualityMetrics;
      if (qm && Object.keys(qm).length > 0) score += 50; else missing.push('Quality metrics');
      if (qm?.defectsFound !== undefined || qm?.defectsResolved !== undefined) score += 25;
      else missing.push('Defect data (found / resolved)');
      if (qm?.testCoverage !== undefined || qm?.qualityScore !== undefined) score += 25;
      else missing.push('Test coverage or quality score');
      break;
    }
  }

  return { score: clamp(score), tier: tier(score), missingItems: missing };
}
