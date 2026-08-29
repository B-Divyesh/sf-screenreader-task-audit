import { describe, expect, it } from 'vitest';
import { auditFromImport, demoAudit, priority, reportData } from '../src/model';
import { escapeHtml, reportHtml } from '../src/export';

describe('audit report logic', () => {
  it('orders blockers before completed tasks', () => {
    const audit = demoAudit();
    const ordered = [...audit.tasks].sort((a,b) => priority(b)-priority(a));
    expect(ordered[0].outcome).toBe('blocked');
    expect(ordered.at(-1)?.outcome).toBe('completed');
  });
  it('removes identity fields from anonymous reports', () => {
    const report = reportData(demoAudit(), true);
    expect(report.product).toBe('Product withheld');
    expect(report.environment).toBe('Withheld');
    expect(report.assistiveTech).toBe('Withheld');
    expect(report.browser).toBe('Withheld');
  });
  it('restores setup context and creation time from JSON reports', () => {
    const source = demoAudit();
    const restored = auditFromImport(reportData(source, false));
    expect(restored).toMatchObject({
      name: source.name,
      product: source.product,
      assistiveTech: source.assistiveTech,
      browser: source.browser,
      consent: true,
      created: source.created
    });
    expect(restored.tasks[0]).toMatchObject({
      title: source.tasks[0].title,
      goal: source.tasks[0].goal,
      start: source.tasks[0].start,
      outcome: source.tasks[0].outcome,
      severity: source.tasks[0].severity,
      expected: source.tasks[0].expected,
      announced: source.tasks[0].announced,
      focus: source.tasks[0].focus,
      blocker: source.tasks[0].blocker,
      notes: source.tasks[0].notes
    });
    expect(restored.tasks[0].trace[0]).toMatchObject({
      time: source.tasks[0].trace[0].time,
      kind: source.tasks[0].trace[0].kind,
      target: source.tasks[0].trace[0].target,
      observed: source.tasks[0].trace[0].observed
    });
  });
  it('escapes user text in HTML reports', () => {
    const audit = demoAudit();
    audit.tasks[0].title = '<img src=x onerror=alert(1)>';
    expect(escapeHtml('<script>')).toBe('&lt;script&gt;');
    expect(reportHtml(audit, false)).not.toContain('<img src=x');
  });
  it('keeps every reproduction field in the standalone HTML report', () => {
    const html = reportHtml(demoAudit(), false);
    for (const value of ['Overview dashboard', 'Sighted colleague had to change the range.', 'Date range button', 'Pressed Enter.', 'Focus returned to page navigation.']) expect(html).toContain(value);
  });
});
