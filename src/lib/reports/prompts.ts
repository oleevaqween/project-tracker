import type { ReportType } from './types';

export const REPORT_SYSTEM_PROMPT = `You are a certified PMBOK 8th Edition PMO analyst generating a formal project report.
Write in clear, professional prose. Use markdown formatting:
- ## for section headers
- **bold** for key terms and metrics
- - for bullet lists
- --- for section dividers
Always include a RAG status (🟢 Green / 🟡 Amber / 🔴 Red) where relevant.
If data is missing for a section, note it briefly and move on — do not fabricate numbers.
Be concise but thorough. Focus on insight, not just data regurgitation.`;

export function buildReportPrompt(type: ReportType, context: string): string {
  const prompts: Record<ReportType, string> = {
    status_report: `Generate a PMBOK 8 Project Status Report using the project data below.

Structure:
## Executive Summary
## Overall Project Health (RAG status + one-line justification)
## Schedule Status
## Scope Status
## Budget / Cost Status
## Risk Summary
## Stakeholder Summary
## Key Accomplishments This Period
## Issues and Blockers
## Next Steps

${context}`,

    risk_report: `Generate a PMBOK 8 Risk Report using the project data below.

Structure:
## Risk Report Overview
## Risk Summary Statistics (total, open, closed, by severity)
## Top 5 Risks (title, score, response strategy, owner)
## Risk Heat Map Analysis (narrative description of the risk landscape)
## Opportunities (if any positive risks identified)
## Recommended Actions
## Residual Risk Assessment

${context}`,

    stakeholder_report: `Generate a PMBOK 8 Stakeholder Engagement Report using the project data below.

Structure:
## Stakeholder Landscape Overview
## Power-Interest Grid Analysis
## Engagement Level Summary (table: name, current level, desired level, gap)
## High-Priority Stakeholders (manage closely)
## Communication Effectiveness Assessment
## Recommended Engagement Actions
## Risks from Stakeholder Disengagement

${context}`,

    change_request_report: `Generate a PMBOK 8 Change Request Report using the project data below.

Structure:
## Change Control Summary
## Change Request Statistics (total, approved, rejected, pending, deferred)
## Change Request Log (list each with title, type, status, impact)
## Impact Analysis (cumulative effect on scope, schedule, and budget)
## Pending Decisions Required
## Recommendations

${context}`,

    lessons_learned_report: `Generate a PMBOK 8 Lessons Learned Report using the project data below.

Structure:
## Lessons Learned Summary
## Key Positive Lessons (what worked well)
## Key Negative Lessons (what to avoid or improve)
## Lessons by Category
## Top Recommendations for Future Projects
## Knowledge Transfer Actions

${context}`,

    executive_summary: `Generate a PMBOK 8 Executive Summary for a sponsor or steering committee audience.
This should be concise — no more than one page equivalent.

Structure:
## Project at a Glance
## Overall Health (RAG + brief narrative)
## Key Milestones: Achieved vs. Planned
## Budget Status
## Top Risks Requiring Sponsor Attention
## Decisions Needed from Sponsors
## Outlook

${context}`,

    performance_report: `Generate a PMBOK 8 Performance Report using Earned Value Management (EVM) principles.
Use the actual and estimated hours/cost data to compute or estimate EVM metrics where possible.
If actual data is partial, clearly state what was estimated vs. measured.

Structure:
## Performance Report Overview
## Schedule Performance
- Planned vs. Actual Progress
- Schedule Performance Index (SPI) — compute if data available, else estimate qualitatively
- Schedule Variance (SV)
## Cost Performance
- Budget vs. Actual Spend
- Cost Performance Index (CPI) — compute if data available
- Cost Variance (CV)
## Estimate at Completion (EAC) Analysis
## Performance Trend
## Recommendations

${context}`,

    forecast_report: `Generate a PMBOK 8 Forecast Report using the project data below.

Structure:
## Forecast Overview
## Schedule Forecast
- Projected completion date
- Current vs. baseline schedule variance
- Critical path risk assessment
## Budget Forecast
- Estimate at Completion (EAC)
- Estimate to Complete (ETC)
- Variance at Completion (VAC)
## Assumptions and Constraints
## Scenarios (optimistic / realistic / pessimistic)
## Recommended Corrective Actions

${context}`,

    issue_log_report: `Generate a PMBOK 8 Issue Log Report using the project data below.

Structure:
## Issue Log Summary
## Issue Statistics (total, open, in progress, resolved, closed, by impact level)
## Open Issues Requiring Immediate Attention (critical + high impact)
## Issue Log Table (title, impact, owner, status, resolution date if applicable)
## Trends and Patterns
## Recommended Actions

${context}`,

    quality_report: `Generate a PMBOK 8 Quality Report using the project data below.

Structure:
## Quality Report Overview
## Quality Metrics Summary
## Defect Analysis (found vs. resolved, defect density, trend)
## Test Coverage and Inspection Results
## Quality Score Assessment
## Compliance with Acceptance Criteria
## Quality Risks and Issues
## Recommended Quality Improvement Actions

${context}`,
  };

  return prompts[type];
}

export function buildContext(data: {
  project: Record<string, unknown>;
  tasks: Record<string, unknown>[];
  risks: Record<string, unknown>[];
  stakeholders: Record<string, unknown>[];
  changeRequests: Record<string, unknown>[];
  lessonsLearned: Record<string, unknown>[];
  issues: Record<string, unknown>[];
}): string {
  const p = data.project;

  const lines: string[] = [
    '--- PROJECT DATA ---',
    `Name: ${p.name}`,
    `Status: ${p.status}`,
    `Focus Area: ${p.currentFocusArea ?? 'N/A'}`,
    `Category: ${p.category ?? 'N/A'}`,
    `Start Date: ${p.startDate ?? 'Not set'}`,
    `Target End Date: ${p.targetEndDate ?? 'Not set'}`,
    `Budget (Planned): ${p.budget ?? 'Not set'}`,
    `Budget Spent: ${p.budgetSpent ?? 'Not set'}`,
    `Progress: ${p.progressPercent ?? 0}%`,
    `Description: ${p.description ?? 'None'}`,
    '',
  ];

  // Charter
  const charter = p.charter as Record<string, string> | null;
  if (charter && Object.values(charter).some((v) => v)) {
    lines.push('--- CHARTER ---');
    for (const [key, val] of Object.entries(charter)) {
      if (val) lines.push(`${key}: ${val}`);
    }
    lines.push('');
  }

  // Tasks
  if (data.tasks.length > 0) {
    const done = data.tasks.filter((t) => t.status === 'done').length;
    const totalEstHours = data.tasks.reduce((s, t) => s + Number(t.estimatedHours ?? 0), 0);
    const totalActHours = data.tasks.reduce((s, t) => s + Number(t.actualHours ?? 0), 0);
    lines.push(`--- TASKS (${data.tasks.length} total, ${done} done) ---`);
    lines.push(`Total Estimated Hours: ${totalEstHours}`);
    lines.push(`Total Actual Hours: ${totalActHours}`);
    data.tasks.forEach((t) => {
      lines.push(`- [${t.status}] ${t.title} | Priority: ${t.priority} | Due: ${t.dueDate ?? 'N/A'} | Est: ${t.estimatedHours ?? '-'}h | Actual: ${t.actualHours ?? '-'}h`);
    });
    lines.push('');
  }

  // Risks
  if (data.risks.length > 0) {
    lines.push(`--- RISKS (${data.risks.length} total) ---`);
    data.risks.forEach((r) => {
      lines.push(`- [${r.status}] ${r.title} | Score: ${r.riskScore ?? (Number(r.probability ?? 0) * Number(r.impact ?? 0))} | Response: ${r.responseType ?? 'N/A'} | Owner: ${r.owner ?? 'N/A'}`);
    });
    lines.push('');
  }

  // Stakeholders
  if (data.stakeholders.length > 0) {
    lines.push(`--- STAKEHOLDERS (${data.stakeholders.length} total) ---`);
    data.stakeholders.forEach((s) => {
      lines.push(`- ${s.name} | Role: ${s.role ?? 'N/A'} | Engagement: ${s.engagementLevel} → ${s.desiredEngagementLevel ?? 'N/A'}`);
    });
    lines.push('');
  }

  // Change Requests
  if (data.changeRequests.length > 0) {
    lines.push(`--- CHANGE REQUESTS (${data.changeRequests.length} total) ---`);
    data.changeRequests.forEach((c) => {
      lines.push(`- [${c.status}] ${c.title} | Type: ${c.changeType} | Priority: ${c.priority}`);
    });
    lines.push('');
  }

  // Lessons Learned
  if (data.lessonsLearned.length > 0) {
    lines.push(`--- LESSONS LEARNED (${data.lessonsLearned.length} total) ---`);
    data.lessonsLearned.forEach((l) => {
      lines.push(`- [${l.impact}] ${l.title}: ${l.description}`);
      if (l.recommendation) lines.push(`  Recommendation: ${l.recommendation}`);
    });
    lines.push('');
  }

  // Issues
  if (data.issues.length > 0) {
    lines.push(`--- ISSUES (${data.issues.length} total) ---`);
    data.issues.forEach((i) => {
      lines.push(`- [${i.status}] ${i.title} | Impact: ${i.impact} | Owner: ${i.owner ?? 'N/A'}`);
    });
    lines.push('');
  }

  // Quality metrics
  const qm = p.qualityMetrics as Record<string, unknown> | null;
  if (qm && Object.keys(qm).length > 0) {
    lines.push('--- QUALITY METRICS ---');
    for (const [key, val] of Object.entries(qm)) {
      if (val !== undefined) lines.push(`${key}: ${val}`);
    }
    lines.push('');
  }

  return lines.join('\n');
}
