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
  | 'quality_report';

export interface ReportDefinition {
  type: ReportType;
  title: string;
  description: string;
  pmbok8Domain: string;
}

export const REPORT_DEFINITIONS: ReportDefinition[] = [
  {
    type: 'status_report',
    title: 'Status Report',
    description: 'Current health, progress, and key updates across all project domains.',
    pmbok8Domain: 'Measurement',
  },
  {
    type: 'risk_report',
    title: 'Risk Report',
    description: 'Risk register summary, top threats, response status, and residual exposure.',
    pmbok8Domain: 'Uncertainty',
  },
  {
    type: 'stakeholder_report',
    title: 'Stakeholder Engagement Report',
    description: 'Engagement levels, power-interest analysis, and communication effectiveness.',
    pmbok8Domain: 'Stakeholders',
  },
  {
    type: 'change_request_report',
    title: 'Change Request Report',
    description: 'Log of all change requests, approval status, and impact on scope, schedule, and cost.',
    pmbok8Domain: 'Governance',
  },
  {
    type: 'lessons_learned_report',
    title: 'Lessons Learned Report',
    description: 'Knowledge captured throughout the project for future improvement.',
    pmbok8Domain: 'Governance',
  },
  {
    type: 'executive_summary',
    title: 'Executive Summary',
    description: 'One-page sponsor-level overview of overall project health and key decisions needed.',
    pmbok8Domain: 'Stakeholders',
  },
  {
    type: 'performance_report',
    title: 'Performance Report',
    description: 'Schedule and cost performance using Earned Value metrics (SPI, CPI, EAC, ETC).',
    pmbok8Domain: 'Measurement',
  },
  {
    type: 'forecast_report',
    title: 'Forecast Report',
    description: 'Projected completion date, cost-at-completion, and schedule variance trend.',
    pmbok8Domain: 'Measurement',
  },
  {
    type: 'issue_log_report',
    title: 'Issue Log Report',
    description: 'All open and resolved issues, owners, impact ratings, and resolution status.',
    pmbok8Domain: 'Delivery',
  },
  {
    type: 'quality_report',
    title: 'Quality Report',
    description: 'Defects, test coverage, inspection results, and quality score against acceptance criteria.',
    pmbok8Domain: 'Delivery',
  },
];

export type ReadinessTier = 'basic' | 'standard' | 'rich';

export interface ReportReadiness {
  score: number; // 0-100
  tier: ReadinessTier;
  missingItems: string[];
}
