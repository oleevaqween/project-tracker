import type { NotificationData } from './checks';
import { PHASE_LABELS, PHASE_CHECKLISTS } from './checks';

const STATUS_LABELS: Record<string, string> = {
  planning: 'Planning',
  in_progress: 'In Progress',
  on_hold: 'On Hold',
  completed: 'Completed',
  archived: 'Archived',
};

const PRIORITY_COLORS: Record<string, string> = {
  critical: '#dc2626',
  high: '#ea580c',
  medium: '#d97706',
  low: '#65a30d',
};

function esc(str: string): string {
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

function fmtDate(date: Date): string {
  return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
}

function priorityPill(priority: string | null): string {
  if (!priority) return '';
  const bg = PRIORITY_COLORS[priority] ?? '#64748b';
  const label = priority.charAt(0).toUpperCase() + priority.slice(1);
  return `<span style="display:inline-block;padding:1px 7px;border-radius:10px;background:${bg};color:#fff;font-size:11px;font-weight:700;letter-spacing:.3px;">${label}</span>`;
}

export function buildEmailHtml(data: NotificationData, now: Date): string {
  const { projects, overdueTasks, escalatedRisks, stuckPhases, dueSoon } = data;

  const nonArchived = projects.filter((p) => p.status !== 'archived');
  const active = nonArchived.filter((p) => p.status !== 'completed');
  const completed = nonArchived.filter((p) => p.status === 'completed');

  const alertCount = overdueTasks.length + escalatedRisks.length + stuckPhases.length;
  const hasAlerts = alertCount > 0;

  const dateStr = now.toLocaleDateString('en-US', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });

  const parts: string[] = [];

  // ── HEADER ──
  parts.push(`<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width,initial-scale=1">
<title>Daily Project Digest</title>
</head>
<body style="margin:0;padding:0;background:#f1f5f9;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Helvetica,Arial,sans-serif;">
<table width="100%" cellpadding="0" cellspacing="0" style="background:#f1f5f9;">
<tr><td style="padding:24px 12px;">
<table width="600" cellpadding="0" cellspacing="0" align="center"
  style="max-width:600px;margin:0 auto;border-radius:10px;overflow:hidden;box-shadow:0 2px 8px rgba(0,0,0,.12);">

<!-- HEADER -->
<tr>
  <td style="background:#0f172a;padding:28px 32px;">
    <table width="100%" cellpadding="0" cellspacing="0"><tr>
      <td>
        <div style="color:#60a5fa;font-size:12px;font-weight:700;letter-spacing:2.5px;text-transform:uppercase;margin-bottom:5px;">aboveone</div>
        <div style="color:#ffffff;font-size:22px;font-weight:700;line-height:1.2;">Daily Project Digest</div>
        <div style="color:#94a3b8;font-size:13px;margin-top:5px;">${dateStr}</div>
      </td>
      <td style="text-align:right;vertical-align:middle;">
        ${hasAlerts
          ? `<span style="display:inline-block;background:#dc2626;color:#fff;font-size:12px;font-weight:700;padding:5px 12px;border-radius:14px;">${alertCount} Alert${alertCount !== 1 ? 's' : ''}</span>`
          : `<span style="display:inline-block;background:#16a34a;color:#fff;font-size:12px;font-weight:700;padding:5px 12px;border-radius:14px;">All Clear ✓</span>`}
      </td>
    </tr></table>
  </td>
</tr>

<!-- STATS BAR -->
<tr>
  <td style="background:#1e293b;padding:0;">
    <table width="100%" cellpadding="0" cellspacing="0"><tr>
      <td style="text-align:center;padding:14px 0;border-right:1px solid #334155;width:33%;">
        <div style="color:#ffffff;font-size:22px;font-weight:700;">${active.length}</div>
        <div style="color:#94a3b8;font-size:10px;text-transform:uppercase;letter-spacing:1px;margin-top:2px;">Active Projects</div>
      </td>
      <td style="text-align:center;padding:14px 0;border-right:1px solid #334155;width:33%;">
        <div style="color:${overdueTasks.length > 0 ? '#fbbf24' : '#ffffff'};font-size:22px;font-weight:700;">${overdueTasks.length}</div>
        <div style="color:#94a3b8;font-size:10px;text-transform:uppercase;letter-spacing:1px;margin-top:2px;">Overdue Tasks</div>
      </td>
      <td style="text-align:center;padding:14px 0;width:33%;">
        <div style="color:${escalatedRisks.length > 0 ? '#f87171' : '#ffffff'};font-size:22px;font-weight:700;">${escalatedRisks.length}</div>
        <div style="color:#94a3b8;font-size:10px;text-transform:uppercase;letter-spacing:1px;margin-top:2px;">Risk Alerts</div>
      </td>
    </tr></table>
  </td>
</tr>`);

  // ── DUE SOON ──
  if (dueSoon.length > 0) {
    parts.push(`
<!-- DUE SOON -->
<tr>
  <td style="background:#ffffff;padding:22px 32px;border-bottom:1px solid #e2e8f0;">
    <div style="font-size:12px;font-weight:700;color:#b45309;text-transform:uppercase;letter-spacing:1px;margin-bottom:14px;">⏰&nbsp; Due in the Next 48 Hours</div>
    <table width="100%" cellpadding="0" cellspacing="0">`);

    for (const t of dueSoon) {
      const isToday = t.dueDate.toDateString() === now.toDateString();
      parts.push(`
      <tr>
        <td style="padding:8px 0;border-bottom:1px solid #f8fafc;">
          <table width="100%" cellpadding="0" cellspacing="0"><tr>
            <td>
              <div style="color:#1e293b;font-size:14px;font-weight:500;">${esc(t.title)}</div>
              <div style="color:#94a3b8;font-size:12px;margin-top:2px;">${esc(t.projectName)}</div>
            </td>
            <td style="text-align:right;vertical-align:top;white-space:nowrap;padding-left:12px;">
              ${priorityPill(t.priority)}
              <div style="color:${isToday ? '#ea580c' : '#64748b'};font-size:12px;font-weight:${isToday ? '700' : '400'};margin-top:3px;">${isToday ? 'Today' : fmtDate(t.dueDate)}</div>
            </td>
          </tr></table>
        </td>
      </tr>`);
    }

    parts.push(`
    </table>
  </td>
</tr>`);
  }

  // ── OVERDUE TASKS ──
  if (overdueTasks.length > 0) {
    parts.push(`
<!-- OVERDUE TASKS -->
<tr>
  <td style="background:#fff7ed;padding:22px 32px;border-bottom:2px solid #fed7aa;border-left:4px solid #ea580c;">
    <div style="font-size:12px;font-weight:700;color:#c2410c;text-transform:uppercase;letter-spacing:1px;margin-bottom:14px;">⚠️&nbsp; Overdue Tasks (${overdueTasks.length})</div>
    <table width="100%" cellpadding="0" cellspacing="0">`);

    for (const t of overdueTasks) {
      parts.push(`
      <tr>
        <td style="padding:8px 0;border-bottom:1px solid #fed7aa;">
          <table width="100%" cellpadding="0" cellspacing="0"><tr>
            <td>
              <div style="color:#1e293b;font-size:14px;font-weight:500;">${esc(t.title)}</div>
              <div style="color:#92400e;font-size:12px;margin-top:2px;">${esc(t.projectName)}</div>
            </td>
            <td style="text-align:right;vertical-align:top;white-space:nowrap;padding-left:12px;">
              ${priorityPill(t.priority)}
              <div style="color:#dc2626;font-size:12px;font-weight:700;margin-top:3px;">${t.daysOverdue}d overdue</div>
            </td>
          </tr></table>
        </td>
      </tr>`);
    }

    parts.push(`
    </table>
  </td>
</tr>`);
  }

  // ── RISK ESCALATIONS ──
  if (escalatedRisks.length > 0) {
    parts.push(`
<!-- RISK ESCALATIONS -->
<tr>
  <td style="background:#fff1f2;padding:22px 32px;border-bottom:2px solid #fecdd3;border-left:4px solid #dc2626;">
    <div style="font-size:12px;font-weight:700;color:#be123c;text-transform:uppercase;letter-spacing:1px;margin-bottom:14px;">🔴&nbsp; Unaddressed High Risks (${escalatedRisks.length})</div>
    <table width="100%" cellpadding="0" cellspacing="0">`);

    for (const r of escalatedRisks) {
      const score = r.riskScore ?? 0;
      const level = score >= 20 ? 'Critical' : 'High';
      const levelBg = score >= 20 ? '#7f1d1d' : '#991b1b';
      parts.push(`
      <tr>
        <td style="padding:8px 0;border-bottom:1px solid #fecdd3;">
          <table width="100%" cellpadding="0" cellspacing="0"><tr>
            <td>
              <div style="color:#1e293b;font-size:14px;font-weight:500;">${esc(r.title)}</div>
              <div style="color:#9f1239;font-size:12px;margin-top:2px;">${esc(r.projectName)} · Status: ${r.status ?? 'identified'}</div>
            </td>
            <td style="text-align:right;vertical-align:top;white-space:nowrap;padding-left:12px;">
              <span style="display:inline-block;padding:1px 7px;border-radius:10px;background:${levelBg};color:#fff;font-size:11px;font-weight:700;">${level} (${score})</span>
              <div style="color:#dc2626;font-size:12px;font-weight:700;margin-top:3px;">${r.daysStale}d unactioned</div>
            </td>
          </tr></table>
        </td>
      </tr>`);
    }

    parts.push(`
    </table>
  </td>
</tr>`);
  }

  // ── STUCK PHASES ──
  for (const stuck of stuckPhases) {
    const phaseLabel = PHASE_LABELS[stuck.phase] ?? stuck.phase;
    const checklist = PHASE_CHECKLISTS[stuck.phase] ?? [];
    parts.push(`
<!-- PHASE REMINDER: ${esc(stuck.projectName)} -->
<tr>
  <td style="background:#eff6ff;padding:22px 32px;border-bottom:2px solid #bfdbfe;border-left:4px solid #2563eb;">
    <div style="font-size:12px;font-weight:700;color:#1d4ed8;text-transform:uppercase;letter-spacing:1px;margin-bottom:6px;">⏳&nbsp; Phase Reminder</div>
    <div style="color:#1e293b;font-size:15px;font-weight:700;margin-bottom:2px;">${esc(stuck.projectName)}</div>
    <div style="color:#3b82f6;font-size:13px;margin-bottom:14px;">
      In <strong>${phaseLabel}</strong> phase for <strong>${stuck.daysUnchanged} days</strong>
      <span style="color:#64748b;"> (threshold: ${stuck.threshold} days)</span>
    </div>
    <div style="color:#1e293b;font-size:13px;font-weight:600;margin-bottom:8px;">PMBOK ${phaseLabel} Checklist:</div>
    <table width="100%" cellpadding="0" cellspacing="0">`);

    for (const item of checklist) {
      parts.push(`
      <tr>
        <td style="padding:4px 0;color:#334155;font-size:13px;line-height:1.5;">
          <span style="color:#3b82f6;margin-right:7px;">□</span>${esc(item)}
        </td>
      </tr>`);
    }

    parts.push(`
    </table>
  </td>
</tr>`);
  }

  // ── PROJECT OVERVIEW ──
  parts.push(`
<!-- PROJECT OVERVIEW -->
<tr>
  <td style="background:#ffffff;padding:22px 32px;border-bottom:1px solid #e2e8f0;">
    <div style="font-size:12px;font-weight:700;color:#475569;text-transform:uppercase;letter-spacing:1px;margin-bottom:16px;">📊&nbsp; Project Overview</div>
    <table width="100%" cellpadding="0" cellspacing="0">`);

  for (const p of nonArchived) {
    const phaseLabel = p.phase ? (PHASE_LABELS[p.phase] ?? p.phase) : 'No phase';
    const statusLabel = STATUS_LABELS[p.status] ?? p.status;
    const pct = p.progressPercent ?? 0;
    const barColor = pct >= 75 ? '#16a34a' : pct >= 40 ? '#d97706' : '#3b82f6';

    parts.push(`
      <tr>
        <td style="padding:10px 0;border-bottom:1px solid #f1f5f9;">
          <table width="100%" cellpadding="0" cellspacing="0">
            <tr>
              <td>
                <div style="color:#1e293b;font-size:14px;font-weight:600;">${esc(p.name)}</div>
                <div style="color:#94a3b8;font-size:12px;margin-top:2px;">${statusLabel} · ${phaseLabel}</div>
              </td>
              <td style="text-align:right;vertical-align:top;width:56px;">
                <div style="color:#1e293b;font-size:13px;font-weight:700;">${pct}%</div>
              </td>
            </tr>
            <tr>
              <td colspan="2" style="padding-top:6px;">
                <div style="background:#e2e8f0;border-radius:4px;height:5px;">
                  <div style="background:${barColor};border-radius:4px;height:5px;width:${Math.min(pct, 100)}%;"></div>
                </div>
              </td>
            </tr>
          </table>
        </td>
      </tr>`);
  }

  if (completed.length > 0) {
    parts.push(`
      <tr>
        <td style="padding-top:10px;">
          <div style="color:#94a3b8;font-size:12px;">+ ${completed.length} completed project${completed.length !== 1 ? 's' : ''}</div>
        </td>
      </tr>`);
  }

  parts.push(`
    </table>
  </td>
</tr>`);

  // ── FOOTER ──
  parts.push(`
<!-- FOOTER -->
<tr>
  <td style="background:#0f172a;padding:20px 32px;border-radius:0 0 10px 10px;">
    <table width="100%" cellpadding="0" cellspacing="0"><tr>
      <td>
        <div style="color:#64748b;font-size:12px;line-height:1.5;">
          You're receiving this because you have active projects on aboveone.<br>
          Sent daily at 8:00 AM UTC.
        </div>
      </td>
      <td style="text-align:right;vertical-align:middle;">
        <div style="color:#60a5fa;font-size:13px;font-weight:700;">aboveone.com</div>
      </td>
    </tr></table>
  </td>
</tr>

</table>
</td></tr>
</table>
</body>
</html>`);

  return parts.join('');
}

export function buildSubject(data: NotificationData, now: Date): string {
  const alerts = data.overdueTasks.length + data.escalatedRisks.length + data.stuckPhases.length;
  const d = now.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' });

  if (alerts === 0) return `✅ ${d} — All projects on track`;

  const parts: string[] = [];
  if (data.overdueTasks.length > 0) parts.push(`${data.overdueTasks.length} overdue task${data.overdueTasks.length !== 1 ? 's' : ''}`);
  if (data.escalatedRisks.length > 0) parts.push(`${data.escalatedRisks.length} risk alert${data.escalatedRisks.length !== 1 ? 's' : ''}`);
  if (data.stuckPhases.length > 0) parts.push(`${data.stuckPhases.length} phase reminder${data.stuckPhases.length !== 1 ? 's' : ''}`);

  return `⚠️ ${d} — ${parts.join(' · ')}`;
}
