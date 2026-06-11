import type { ReportType } from './types';

function sanitizeForPrompt(value: unknown, maxLen = 500): string {
  if (value == null) return 'N/A';
  return String(value)
    .replace(/[\r\n\t]+/g, ' ')
    .replace(/\0/g, '')
    .trim()
    .slice(0, maxLen);
}

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
    `Name: ${sanitizeForPrompt(p.name)}`,
    `Status: ${sanitizeForPrompt(p.status)}`,
    `Focus Area: ${sanitizeForPrompt(p.currentFocusArea)}`,
    `Category: ${sanitizeForPrompt(p.category)}`,
    `Start Date: ${sanitizeForPrompt(p.startDate)}`,
    `Target End Date: ${sanitizeForPrompt(p.targetEndDate)}`,
    `Budget (Planned): ${sanitizeForPrompt(p.budget)}`,
    `Budget Spent: ${sanitizeForPrompt(p.budgetSpent)}`,
    `Progress: ${sanitizeForPrompt(p.progressPercent)}%`,
    `Description: ${sanitizeForPrompt(p.description, 1000)}`,
    '',
  ];

  // Charter
  const charter = p.charter as Record<string, string> | null;
  if (charter && Object.values(charter).some((v) => v)) {
    lines.push('--- CHARTER ---');
    for (const [key, val] of Object.entries(charter)) {
      if (val) lines.push(`${sanitizeForPrompt(key, 100)}: ${sanitizeForPrompt(val, 1000)}`);
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
      lines.push(
        `- [${sanitizeForPrompt(t.status, 50)}] ${sanitizeForPrompt(t.title)} | Priority: ${sanitizeForPrompt(t.priority, 50)} | Due: ${sanitizeForPrompt(t.dueDate, 50)} | Est: ${sanitizeForPrompt(t.estimatedHours, 20)}h | Actual: ${sanitizeForPrompt(t.actualHours, 20)}h`
      );
    });
    lines.push('');
  }

  // Risks
  if (data.risks.length > 0) {
    lines.push(`--- RISKS (${data.risks.length} total) ---`);
    data.risks.forEach((r) => {
      lines.push(
        `- [${sanitizeForPrompt(r.status, 50)}] ${sanitizeForPrompt(r.title)} | Score: ${sanitizeForPrompt(r.riskScore ?? (Number(r.probability ?? 0) * Number(r.impact ?? 0)), 20)} | Response: ${sanitizeForPrompt(r.responseType, 50)} | Owner: ${sanitizeForPrompt(r.owner, 100)}`
      );
    });
    lines.push('');
  }

  // Stakeholders
  if (data.stakeholders.length > 0) {
    lines.push(`--- STAKEHOLDERS (${data.stakeholders.length} total) ---`);
    data.stakeholders.forEach((s) => {
      lines.push(
        `- ${sanitizeForPrompt(s.name, 100)} | Role: ${sanitizeForPrompt(s.role, 100)} | Engagement: ${sanitizeForPrompt(s.engagementLevel, 50)} → ${sanitizeForPrompt(s.desiredEngagementLevel, 50)}`
      );
    });
    lines.push('');
  }

  // Change Requests
  if (data.changeRequests.length > 0) {
    lines.push(`--- CHANGE REQUESTS (${data.changeRequests.length} total) ---`);
    data.changeRequests.forEach((c) => {
      lines.push(
        `- [${sanitizeForPrompt(c.status, 50)}] ${sanitizeForPrompt(c.title)} | Type: ${sanitizeForPrompt(c.changeType, 50)} | Priority: ${sanitizeForPrompt(c.priority, 50)}`
      );
    });
    lines.push('');
  }

  // Lessons Learned
  if (data.lessonsLearned.length > 0) {
    lines.push(`--- LESSONS LEARNED (${data.lessonsLearned.length} total) ---`);
    data.lessonsLearned.forEach((l) => {
      lines.push(`- [${sanitizeForPrompt(l.impact, 50)}] ${sanitizeForPrompt(l.title)}: ${sanitizeForPrompt(l.description, 500)}`);
      if (l.recommendation) lines.push(`  Recommendation: ${sanitizeForPrompt(l.recommendation, 500)}`);
    });
    lines.push('');
  }

  // Issues
  if (data.issues.length > 0) {
    lines.push(`--- ISSUES (${data.issues.length} total) ---`);
    data.issues.forEach((i) => {
      lines.push(
        `- [${sanitizeForPrompt(i.status, 50)}] ${sanitizeForPrompt(i.title)} | Impact: ${sanitizeForPrompt(i.impact, 50)} | Owner: ${sanitizeForPrompt(i.owner, 100)}`
      );
    });
    lines.push('');
  }

  // Quality metrics
  const qm = p.qualityMetrics as Record<string, unknown> | null;
  if (qm && Object.keys(qm).length > 0) {
    lines.push('--- QUALITY METRICS ---');
    for (const [key, val] of Object.entries(qm)) {
      if (val !== undefined) lines.push(`${sanitizeForPrompt(key, 100)}: ${sanitizeForPrompt(val, 200)}`);
    }
    lines.push('');
  }

  return lines.join('\n');
}
