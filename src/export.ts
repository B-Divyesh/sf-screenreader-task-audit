import type { Audit } from './model';
import { reportData } from './model';

export function downloadJson(audit: Audit, anonymous: boolean): void {
  const blob = new Blob([JSON.stringify(reportData(audit, anonymous), null, 2)], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = anonymous ? 'anonymous-task-audit.json' : 'screenreader-task-audit.json';
  link.click();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}

export function escapeHtml(value: string): string {
  return value.replace(/[&<>'"]/g, character => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', "'": '&#39;', '"': '&quot;' })[character]!);
}

export function reportHtml(audit: Audit, anonymous: boolean): string {
  const report = reportData(audit, anonymous);
  const tasks = report.tasks.map((task, index) => {
    const trace = task.trace.length
      ? `<h3>Event trace</h3><ol>${task.trace.map(event => `<li><strong>${escapeHtml(event.kind.replace('-', ' '))}</strong> at ${escapeHtml(event.time || 'time not set')} — ${escapeHtml(event.target || 'target not named')}: ${escapeHtml(event.observed || 'no detail')}</li>`).join('')}</ol>`
      : '<h3>Event trace</h3><p>No trace events recorded.</p>';
    return `<section><h2>${index + 1}. ${escapeHtml(task.title || 'Untitled task')}</h2><p><strong>Result:</strong> ${escapeHtml(task.outcome)} · <strong>Priority:</strong> ${escapeHtml(task.severity)}</p><dl><dt>Goal</dt><dd>${escapeHtml(task.goal || 'Not recorded')}</dd><dt>Starting place</dt><dd>${escapeHtml(task.start || 'Not recorded')}</dd><dt>Expected steps</dt><dd>${escapeHtml(task.expected || 'Not recorded')}</dd><dt>Announcements heard</dt><dd>${escapeHtml(task.announced || 'Not recorded')}</dd><dt>Focus movement</dt><dd>${escapeHtml(task.focus || 'Not recorded')}</dd><dt>Blocker</dt><dd>${escapeHtml(task.blocker || 'None recorded')}</dd><dt>Other notes</dt><dd>${escapeHtml(task.notes || 'None recorded')}</dd></dl>${trace}</section>`;
  }).join('');
  return `<!doctype html><html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width"><title>${escapeHtml(report.audit)}</title><style>body{font:18px/1.55 system-ui,sans-serif;max-width:52rem;margin:2rem auto;padding:1rem;color:#18243a;background:#fff9eb}h1,h2{font-family:Georgia,serif}section{border-top:3px solid #18243a;margin-top:2rem}dt{font-weight:700;margin-top:1rem}dd{margin-left:0}</style></head><body><main><h1>${escapeHtml(report.audit)}</h1><p>${escapeHtml(report.product)} · ${escapeHtml(report.environment)}</p><p>${report.summary.completed} completed, ${report.summary.partial} partial, ${report.summary.blocked} blocked, ${report.summary.notTested} not tested.</p>${tasks}<p><small>${report.notice}</small></p></main></body></html>`;
}

export function downloadHtml(audit: Audit, anonymous: boolean): void {
  const blob = new Blob([reportHtml(audit, anonymous)], { type: 'text/html' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = anonymous ? 'anonymous-task-audit.html' : 'screenreader-task-audit.html';
  link.click();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}
