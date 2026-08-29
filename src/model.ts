export type Outcome = 'not-tested' | 'completed' | 'partial' | 'blocked';
export type Severity = 'low' | 'medium' | 'high' | 'critical';

export interface TraceEvent {
  id: string;
  time: string;
  kind: 'focus' | 'announcement' | 'action' | 'unexpected-change';
  target: string;
  observed: string;
}

export interface AuditTask {
  id: string;
  title: string;
  goal: string;
  start: string;
  outcome: Outcome;
  severity: Severity;
  expected: string;
  announced: string;
  focus: string;
  blocker: string;
  notes: string;
  trace: TraceEvent[];
}

export interface Audit {
  id: string;
  name: string;
  product: string;
  assistiveTech: string;
  browser: string;
  consent: boolean;
  created: string;
  updated: string;
  tasks: AuditTask[];
}

export const blankTask = (title = ''): AuditTask => ({
  id: crypto.randomUUID(), title, goal: '', start: '', outcome: 'not-tested', severity: 'medium',
  expected: '', announced: '', focus: '', blocker: '', notes: '', trace: []
});

export const blankAudit = (): Audit => ({
  id: crypto.randomUUID(), name: '', product: '', assistiveTech: '', browser: '', consent: false,
  created: new Date().toISOString(), updated: new Date().toISOString(), tasks: []
});

export const demoAudit = (): Audit => ({
  id: 'demo-audit', name: 'August analytics check', product: 'Northstar Metrics',
  assistiveTech: 'NVDA 2026.1', browser: 'Firefox 142', consent: true,
  created: '2026-08-18T09:00:00.000Z', updated: '2026-08-18T09:32:00.000Z',
  tasks: [
    {
      id: 'demo-1', title: 'Change the report date range', goal: 'Show orders from the last 30 days', start: 'Overview dashboard',
      outcome: 'blocked', severity: 'critical', expected: 'Open the date picker, choose 30 days, and apply it.',
      announced: '“Button, date range.” The opened calendar had no name.', focus: 'Focus moved behind the calendar after pressing Enter.',
      blocker: 'Calendar days had no accessible names. Escape did not close it.', notes: 'Sighted colleague had to change the range.',
      trace: [
        { id: 'tr-1', time: '09:14', kind: 'focus', target: 'Date range button', observed: 'Button announced with its name.' },
        { id: 'tr-2', time: '09:15', kind: 'action', target: 'Date range button', observed: 'Pressed Enter.' },
        { id: 'tr-3', time: '09:15', kind: 'unexpected-change', target: 'Calendar dialog', observed: 'Focus returned to page navigation.' }
      ]
    },
    {
      id: 'demo-2', title: 'Find the top-selling product', goal: 'Read the leading product and its revenue', start: 'Products dashboard',
      outcome: 'partial', severity: 'high', expected: 'Read the first row in the products table.',
      announced: 'Product names were read. Revenue cells were announced as “blank”.', focus: 'Table cells followed a useful row order.',
      blocker: 'Revenue values were drawn on a canvas with no text alternative.', notes: 'The product could be identified, but not its revenue.', trace: []
    },
    {
      id: 'demo-3', title: 'Export the orders report', goal: 'Download the current orders as CSV', start: 'Orders report',
      outcome: 'completed', severity: 'medium', expected: 'Open Export and choose CSV.',
      announced: 'Export menu and completion notice were announced.', focus: 'Focus returned to the Export button after download.',
      blocker: '', notes: 'Completed without sighted help in 48 seconds.', trace: []
    },
    {
      id: 'demo-4', title: 'Invite a team member', goal: 'Send an analyst invitation', start: 'Team settings',
      outcome: 'completed', severity: 'low', expected: 'Enter an email, select Analyst, and send.',
      announced: 'Form labels, role choice, and success message were announced.', focus: 'Focus stayed in a clear form order.', blocker: '', notes: '', trace: []
    },
    {
      id: 'demo-5', title: 'Create a weekly alert', goal: 'Send a weekly email when orders fall', start: 'Alerts',
      outcome: 'not-tested', severity: 'medium', expected: '', announced: '', focus: '', blocker: '', notes: '', trace: []
    }
  ]
});

const REAL_KEY = 'sra:audit:v1';
const DEMO_KEY = 'demo:sra:audit:v1';

export function loadAudit(demo: boolean): Audit {
  const key = demo ? DEMO_KEY : REAL_KEY;
  try {
    const raw = localStorage.getItem(key);
    if (raw) return JSON.parse(raw) as Audit;
  } catch { /* The empty state is safer than broken storage. */ }
  const audit = demo ? demoAudit() : blankAudit();
  saveAudit(audit, demo);
  return audit;
}

export function saveAudit(audit: Audit, demo: boolean): void {
  audit.updated = new Date().toISOString();
  localStorage.setItem(demo ? DEMO_KEY : REAL_KEY, JSON.stringify(audit));
}

export function resetAudit(demo: boolean): Audit {
  const audit = demo ? demoAudit() : blankAudit();
  saveAudit(audit, demo);
  return audit;
}

export function priority(task: AuditTask): number {
  const outcome = { blocked: 4, partial: 3, 'not-tested': 1, completed: 0 }[task.outcome];
  const severity = { critical: 4, high: 3, medium: 2, low: 1 }[task.severity];
  return outcome * 10 + severity;
}

export function reportData(audit: Audit, anonymous: boolean) {
  return {
    schema: 'screenreader-task-audit/v1',
    audit: anonymous ? 'Anonymous screen-reader task audit' : audit.name || 'Untitled audit',
    product: anonymous ? 'Product withheld' : audit.product || 'Product not named',
    environment: anonymous ? 'Withheld' : [audit.assistiveTech, audit.browser].filter(Boolean).join(' · '),
    assistiveTech: anonymous ? 'Withheld' : audit.assistiveTech,
    browser: anonymous ? 'Withheld' : audit.browser,
    created: audit.created,
    summary: {
      total: audit.tasks.length,
      completed: audit.tasks.filter(t => t.outcome === 'completed').length,
      partial: audit.tasks.filter(t => t.outcome === 'partial').length,
      blocked: audit.tasks.filter(t => t.outcome === 'blocked').length,
      notTested: audit.tasks.filter(t => t.outcome === 'not-tested').length
    },
    tasks: [...audit.tasks].sort((a, b) => priority(b) - priority(a)).map(({ id: _id, ...task }) => ({
      ...task, trace: task.trace.map(({ id: _traceId, ...event }) => event)
    })),
    notice: 'Observed task evidence. Not an accessibility certification or legal advice.'
  };
}

const outcomes: Outcome[] = ['not-tested', 'completed', 'partial', 'blocked'];
const severities: Severity[] = ['low', 'medium', 'high', 'critical'];

function text(value: unknown, limit: number): string {
  return typeof value === 'string' ? value.slice(0, limit) : '';
}

function importedEnvironment(report: Record<string, unknown>): { assistiveTech: string; browser: string } {
  const assistiveTech = text(report.assistiveTech, 80);
  const browser = text(report.browser, 80);
  if (assistiveTech || browser) return { assistiveTech, browser };

  // Exports made before separate setup fields were added stored both values in
  // one display string. Keep those local backups useful without guessing when
  // the separator is absent or the export was anonymized.
  const environment = text(report.environment, 163);
  if (!environment || environment === 'Withheld') return { assistiveTech: '', browser: '' };
  const separator = environment.indexOf(' · ');
  if (separator === -1) return { assistiveTech: environment.slice(0, 80), browser: '' };
  return {
    assistiveTech: environment.slice(0, separator).slice(0, 80),
    browser: environment.slice(separator + 3).slice(0, 80)
  };
}

function importedCreated(value: unknown): string {
  const created = text(value, 40);
  return created && !Number.isNaN(Date.parse(created)) ? created : new Date().toISOString();
}

/** Turns this product's JSON export back into an editable local audit. */
export function auditFromImport(value: unknown): Audit {
  if (!value || typeof value !== 'object') throw new Error('Choose a JSON report exported by Screenreader Task Audit.');
  const report = value as Record<string, unknown>;
  if (report.schema !== 'screenreader-task-audit/v1' || !Array.isArray(report.tasks)) throw new Error('This file is not a Screenreader Task Audit JSON report.');
  if (report.tasks.length > 5) throw new Error('This report has more than five tasks and cannot be imported.');
  const tasks = report.tasks.map((raw, index): AuditTask => {
    if (!raw || typeof raw !== 'object') throw new Error(`Task ${index + 1} is not valid.`);
    const task = raw as Record<string, unknown>;
    const trace = Array.isArray(task.trace) ? task.trace.map((rawEvent, eventIndex): TraceEvent => {
      if (!rawEvent || typeof rawEvent !== 'object') throw new Error(`Trace event ${eventIndex + 1} is not valid.`);
      const event = rawEvent as Record<string, unknown>;
      const kind = text(event.kind, 30) as TraceEvent['kind'];
      if (!['focus', 'announcement', 'action', 'unexpected-change'].includes(kind)) throw new Error(`Trace event ${eventIndex + 1} has an unknown type.`);
      return { id: crypto.randomUUID(), kind, time: text(event.time, 20), target: text(event.target, 100), observed: text(event.observed, 240) };
    }) : [];
    const outcome = text(task.outcome, 20) as Outcome;
    const severity = text(task.severity, 20) as Severity;
    if (!outcomes.includes(outcome) || !severities.includes(severity)) throw new Error(`Task ${index + 1} has an unknown result or impact.`);
    return { id: crypto.randomUUID(), title: text(task.title, 100), goal: text(task.goal, 180), start: text(task.start, 120), outcome, severity, expected: text(task.expected, 1000), announced: text(task.announced, 1000), focus: text(task.focus, 1000), blocker: text(task.blocker, 1000), notes: text(task.notes, 1000), trace };
  });
  const environment = importedEnvironment(report);
  return {
    id: crypto.randomUUID(), name: text(report.audit, 80) || 'Imported audit', product: text(report.product, 80),
    assistiveTech: environment.assistiveTech, browser: environment.browser, consent: true,
    created: importedCreated(report.created), updated: new Date().toISOString(), tasks
  };
}
