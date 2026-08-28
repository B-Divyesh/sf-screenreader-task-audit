import { describe, expect, it } from 'vitest';
import { demoAudit, priority, reportData } from '../src/model';
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
  });
  it('escapes user text in HTML reports', () => {
    const audit = demoAudit();
    audit.tasks[0].title = '<img src=x onerror=alert(1)>';
    expect(escapeHtml('<script>')).toBe('&lt;script&gt;');
    expect(reportHtml(audit, false)).not.toContain('<img src=x');
  });
});
