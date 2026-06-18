export type ReportType =
  | 'status_report'
  | 'risk_report'
  | 'stakeholder_report'
  | 'change_request_report'
  | 'lessons_learned_report'
  | 'executive_summary'
  | 'performance_report'
  | 'forecast_report'
  | 'issue_log_report'
  | 'quality_report'
  | 'project_management_plan'
  | 'scope_management_plan'
  | 'communications_management_plan'
  | 'risk_management_plan'
  | 'stakeholder_engagement_plan';

export interface ReportDefinition {
  type: ReportType;
  title: string;
  description: string;
  pmbok8Domain: string;
  category: 'report' | 'document';
}

export const REPORT_DEFINITIONS: ReportDefinition[] = [
  // ── Documents ────────────────────────────────────────────────────────────────
  {
    type: 'project_management_plan',
    title: 'Project Management Plan',
    description: 'Master PM plan integrating all subsidiary plans: scope, schedule, budget, risk, communications, and stakeholder engagement.',
    pmbok8Domain: 'Governance',
    category: 'document',
  },
  {
    type: 'scope_management_plan',
    title: 'Scope Management Plan',
    description: 'Defines how scope will be defined, validated, and controlled throughout the project lifecycle.',
    pmbok8Domain: 'Scope',
    category: 'document',
  },
  {
    type: 'communications_management_plan',
    title: 'Communications Management Plan',
    description: 'Communication requirements, stakeholder channels, frequency, format, and responsibilities.',
    pmbok8Domain: 'Stakeholders',
    category: 'document',
  },
  {
    type: 'risk_management_plan',
    title: 'Risk Management Plan',
    description: 'Risk methodology, risk register, response strategies, and monitoring approach.',
    pmbok8Domain: 'Risk',
    category: 'document',
  },
  {
    type: 'stakeholder_engagement_plan',
    title: 'Stakeholder Engagement Plan',
    description: 'Strategies to maintain appropriate stakeholder involvement throughout the project.',
    pmbok8Domain: 'Stakeholders',
    category: 'document',
  },

  // ── Reports ──────────────────────────────────────────────────────────────────
  {
    type: 'status_report',
    title: 'Status Report',
    description: 'Current health, progress, and key updates across all project domains.',
    pmbok8Domain: 'Measurement',
    category: 'report',
  },
  {
    type: 'risk_report',
    title: 'Risk Report',
    description: 'Risk register summary, top threats, response status, and residual exposure.',
    pmbok8Domain: 'Uncertainty',
    category: 'report',
  },
  {
    type: 'stakeholder_report',
    title: 'Stakeholder Engagement Report',
    description: 'Engagement levels, power-interest analysis, and communication effectiveness.',
    pmbok8Domain: 'Stakeholders',
    category: 'report',
  },
  {
    type: 'change_request_report',
    title: 'Change Request Report',
    description: 'Log of all change requests, approval status, and impact on scope, schedule, and cost.',
    pmbok8Domain: 'Governance',
    category: 'report',
  },
  {
    type: 'lessons_learned_report',
    title: 'Lessons Learned Report',
    description: 'Knowledge captured throughout the project for future improvement.',
    pmbok8Domain: 'Governance',
    category: 'report',
  },
  {
    type: 'executive_summary',
    title: 'Executive Summary',
    description: 'One-page sponsor-level overview of overall project health and key decisions needed.',
    pmbok8Domain: 'Stakeholders',
    category: 'report',
  },
  {
    type: 'performance_report',
    title: 'Performance Report',
    description: 'Schedule and cost performance using Earned Value metrics (SPI, CPI, EAC, ETC).',
    pmbok8Domain: 'Measurement',
    category: 'report',
  },
  {
    type: 'forecast_report',
    title: 'Forecast Report',
    description: 'Projected completion date, cost-at-completion, and schedule variance trend.',
    pmbok8Domain: 'Measurement',
    category: 'report',
  },
  {
    type: 'issue_log_report',
    title: 'Issue Log Report',
    description: 'All open and resolved issues, owners, impact ratings, and resolution status.',
    pmbok8Domain: 'Delivery',
    category: 'report',
  },
  {
    type: 'quality_report',
    title: 'Quality Report',
    description: 'Defects, test coverage, inspection results, and quality score against acceptance criteria.',
    pmbok8Domain: 'Delivery',
    category: 'report',
  },
];

export type ReadinessTier = 'basic' | 'standard' | 'rich';

export interface ReportReadiness {
  score: number; // 0-100
  tier: ReadinessTier;
  missingItems: string[];
}
