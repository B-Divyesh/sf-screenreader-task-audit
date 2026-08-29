import { test, expect, type Browser, type Download, type Page } from '@playwright/test';
import AxeBuilder from '@axe-core/playwright';

async function createAudit(page: Page): Promise<void> {
  await page.goto('/audit');
  await page.getByLabel('Audit name').fill('September critical tasks');
  await page.getByLabel('Product or dashboard').fill('Example dashboard');
  await page.getByLabel('Screen reader and version').fill('NVDA 2026');
  await page.getByLabel('Browser and version').fill('Firefox 142');
  await page.getByLabel(/The tester agreed/).check();
  await page.getByRole('button', { name: 'Create audit' }).click();
}
async function readDownload(download: Download): Promise<string> {
  const stream = await download.createReadStream(); let contents = '';
  for await (const chunk of stream!) contents += chunk.toString();
  return contents;
}

test('@claim:demo-sandbox direct demo access is isolated, resets, and discards sample data', async ({ page }) => {
  await page.addInitScript(() => {
    type StorageOperation = { kind: string; key: string | null };
    const operations: StorageOperation[] = [];
    const storage = Storage.prototype;
    for (const kind of ['getItem', 'setItem', 'removeItem'] as const) {
      const original = storage[kind];
      Object.defineProperty(storage, kind, {
        configurable: true,
        value(this: Storage, key: string, ...rest: unknown[]) {
          operations.push({ kind, key });
          return (original as (...args: unknown[]) => unknown).call(this, key, ...rest);
        }
      });
    }
    (window as unknown as { demoStorageOperations: StorageOperation[] }).demoStorageOperations = operations;
  });
  await page.goto('/demo');
  await expect(page.getByText('Demo — sample data, nothing is saved')).toBeVisible();
  const directDemoOperations = await page.evaluate(() => (window as unknown as { demoStorageOperations: { kind: string; key: string | null }[] }).demoStorageOperations);
  expect(directDemoOperations.some(operation => operation.key === 'sra:audit:v1')).toBe(false);
  expect(directDemoOperations.some(operation => operation.key === 'demo:sra:audit:v1')).toBe(true);
  expect(await page.evaluate(() => localStorage.getItem('sra:audit:v1'))).toBeNull();
  await page.getByLabel('Task name').fill('Changed only in demo');
  expect(await page.evaluate(() => localStorage.getItem('demo:sra:audit:v1'))).toContain('Changed only in demo');
  expect(await page.evaluate(() => localStorage.getItem('sra:audit:v1'))).toBeNull();
  await page.getByRole('button', { name: 'Reset demo' }).click();
  await expect(page.getByLabel('Task name')).toHaveValue('Change the report date range');
  await page.getByRole('link', { name: 'Start for real' }).click();
  await expect(page.getByRole('heading', { name: 'Set up a screen-reader task audit' })).toBeVisible();
  expect(await page.evaluate(() => localStorage.getItem('demo:sra:audit:v1'))).toBeNull();
  await page.goto('/demo');
  await expect(page.getByLabel('Task name')).toHaveValue('Change the report date range');
});

test('@claim:core-workflow records evidence, persists it, and shows it in the report', async ({ page }) => {
  await createAudit(page);
  await page.getByLabel('Task name').fill('Export invoices');
  await page.getByLabel('Tester’s goal').fill('Download the invoice list');
  await page.getByLabel('Starting place').fill('Billing');
  await page.getByLabel('Blocked').check();
  await page.getByRole('radio', { name: 'Critical' }).check();
  await page.getByLabel('Expected steps').fill('Open export and choose CSV.');
  await page.getByLabel('Announcements heard').fill('Export button announced.');
  await page.getByLabel('Focus movement').fill('Focus moved to the hidden menu.');
  await page.getByLabel('Blocker').fill('Menu has no accessible name.');
  await page.getByLabel('Other notes').fill('Reproduced twice.');
  await page.getByRole('link', { name: 'Review report' }).click();
  await expect(page.getByRole('heading', { name: 'Export invoices' })).toBeVisible();
  await expect(page.getByText('Menu has no accessible name.')).toBeVisible();
  await page.reload();
  await expect(page.getByRole('heading', { name: 'Export invoices' })).toBeVisible();
});

test('@claim:structured-capture requires consent and saves every event type', async ({ page }) => {
  await page.goto('/audit');
  await page.getByRole('button', { name: 'Create audit' }).click();
  await expect(page.locator('#setup-error')).toContainText('Fill every field');
  await createAudit(page);
  for (const [kind, observed] of [['Focus', 'Focus reached search'], ['Announcement', 'Search announced'], ['Action', 'Pressed Enter']] as const) {
    await page.getByRole('button', { name: 'Add trace event' }).click();
    await page.getByLabel('Event type').selectOption({ label: kind });
    await page.getByLabel('Control or area').fill('Search');
    await page.getByLabel('What happened').fill(observed);
    await page.getByRole('button', { name: 'Record event' }).click();
  }
  const stored = await page.evaluate(() => localStorage.getItem('sra:audit:v1'));
  expect(stored).toContain('focus'); expect(stored).toContain('announcement'); expect(stored).toContain('action');
});

test('@claim:five-tasks free audits support five critical tasks', async ({ page }) => {
  await page.goto('/?demo=1');
  await expect(page.locator('.task-rail li')).toHaveCount(5);
  await expect(page.getByRole('button', { name: 'Add task' })).toBeDisabled();
});

test('@claim:report-priority orders tasks by result and impact everywhere', async ({ page }) => {
  await page.goto('/demo/report');
  await expect(page.locator('.report-task h2')).toHaveText(['Change the report date range', 'Find the top-selling product', 'Create a weekly alert', 'Export the orders report', 'Invite a team member']);
  const download = page.waitForEvent('download'); await page.getByRole('button', { name: 'Export JSON' }).click();
  const data = JSON.parse(await readDownload(await download)) as { tasks: { title: string }[] };
  expect(data.tasks.map(task => task.title)).toEqual(['Change the report date range', 'Find the top-selling product', 'Create a weekly alert', 'Export the orders report', 'Invite a team member']);
});

test('@claim:html-export exports an accessible standalone report', async ({ page }) => {
  await page.goto('/demo/report'); const download = page.waitForEvent('download'); await page.getByRole('button', { name: 'Export accessible HTML' }).click(); const stream = await (await download).createReadStream(); let html = ''; for await (const chunk of stream!) html += chunk.toString(); expect(html).toContain('<html lang="en">'); expect(html).toContain('Change the report date range');
});
test('@claim:json-export exports five tasks as JSON', async ({ page }) => { await page.goto('/demo/report'); const download = page.waitForEvent('download'); await page.getByRole('button', { name: 'Export JSON' }).click(); const stream = await (await download).createReadStream(); let json = ''; for await (const chunk of stream!) json += chunk.toString(); const exported = JSON.parse(json); expect(exported.schema).toBe('screenreader-task-audit/v1'); expect(exported.tasks).toHaveLength(5); });
test('@claim:anonymous-export removes product and environment names from JSON', async ({ page }) => { await page.goto('/demo/report'); await page.getByLabel('Remove product and environment names').check(); const download = page.waitForEvent('download'); await page.getByRole('button', { name: 'Export JSON' }).click(); const stream = await (await download).createReadStream(); let json = ''; for await (const chunk of stream!) json += chunk.toString(); expect(json).not.toContain('Northstar Metrics'); expect(JSON.parse(json)).toMatchObject({ product: 'Product withheld', environment: 'Withheld' }); });

test('@claim:import-json restores every editable audit field only after confirmation', async ({ page, browser }: { page: Page; browser: Browser }) => {
  await page.goto('/audit');
  await page.getByLabel('Audit name').fill('October checkout audit');
  await page.getByLabel('Product or dashboard').fill('Northstar Billing');
  await page.getByLabel('Screen reader and version').fill('NVDA 2026.1');
  await page.getByLabel('Browser and version').fill('Firefox 142');
  await page.getByLabel(/The tester agreed/).check();
  await page.getByRole('button', { name: 'Create audit' }).click();
  await page.getByLabel('Task name').fill('Download an invoice');
  await page.getByLabel('Tester’s goal').fill('Save invoice 1842 as PDF');
  await page.getByLabel('Starting place').fill('Invoice detail');
  await page.getByLabel('Partial').check();
  await page.getByRole('radio', { name: 'High' }).check();
  await page.getByLabel('Expected steps').fill('Open Actions, then choose Download PDF.');
  await page.getByLabel('Announcements heard').fill('Actions menu announced as expanded.');
  await page.getByLabel('Focus movement').fill('Focus moved to the second menu item.');
  await page.getByLabel('Blocker').fill('Download completion was not announced.');
  await page.getByLabel('Other notes').fill('The file still downloaded.');
  await page.getByRole('button', { name: 'Add trace event' }).click();
  await page.getByLabel('Time').fill('10:42');
  await page.getByLabel('Event type').selectOption('announcement');
  await page.getByLabel('Control or area').fill('Download notice');
  await page.getByLabel('What happened').fill('No completion message was heard.');
  await page.getByRole('button', { name: 'Record event' }).click();
  const original = await page.evaluate(() => JSON.parse(localStorage.getItem('sra:audit:v1')!));
  await page.getByRole('link', { name: 'Review report' }).click();
  const download = page.waitForEvent('download');
  await page.getByRole('button', { name: 'Export JSON' }).click();
  const contents = await readDownload(await download);
  const exported = JSON.parse(contents);
  expect(exported).toMatchObject({
    audit: 'October checkout audit', product: 'Northstar Billing',
    assistiveTech: 'NVDA 2026.1', browser: 'Firefox 142', created: original.created
  });

  const restoreContext = await browser.newContext();
  try {
    const restorePage = await restoreContext.newPage();
    const origin = new URL(page.url()).origin;
    await restorePage.goto(`${origin}/audit`);
    await restorePage.getByLabel('Import audit JSON').setInputFiles({ name: 'audit.json', mimeType: 'application/json', buffer: Buffer.from(contents) });
    await expect(restorePage.getByRole('heading', { name: 'Ready to restore this audit' })).toBeVisible();
    await expect(restorePage.locator('.import-preview')).toContainText('Northstar Billing');
    await expect(restorePage.locator('.import-preview')).toContainText('NVDA 2026.1');
    await expect(restorePage.locator('.import-preview')).toContainText('Firefox 142');
    expect(await restorePage.evaluate(() => localStorage.getItem('sra:audit:v1'))).not.toContain('October checkout audit');
    await restorePage.getByRole('button', { name: 'Restore imported audit' }).click();
    await expect(restorePage.getByRole('heading', { name: 'October checkout audit' })).toBeVisible();
    await restorePage.reload();

    const restored = await restorePage.evaluate(() => JSON.parse(localStorage.getItem('sra:audit:v1')!));
    expect(restored).toMatchObject({
      name: original.name,
      product: original.product,
      assistiveTech: original.assistiveTech,
      browser: original.browser,
      consent: original.consent,
      created: original.created,
      tasks: [{
        title: original.tasks[0].title,
        goal: original.tasks[0].goal,
        start: original.tasks[0].start,
        outcome: original.tasks[0].outcome,
        severity: original.tasks[0].severity,
        expected: original.tasks[0].expected,
        announced: original.tasks[0].announced,
        focus: original.tasks[0].focus,
        blocker: original.tasks[0].blocker,
        notes: original.tasks[0].notes,
        trace: [{
          time: original.tasks[0].trace[0].time,
          kind: original.tasks[0].trace[0].kind,
          target: original.tasks[0].trace[0].target,
          observed: original.tasks[0].trace[0].observed
        }]
      }]
    });
    await restorePage.getByRole('button', { name: 'Edit audit details' }).click();
    await expect(restorePage.getByLabel('Audit name')).toHaveValue('October checkout audit');
    await expect(restorePage.getByLabel('Product or dashboard')).toHaveValue('Northstar Billing');
    await expect(restorePage.getByLabel('Screen reader and version')).toHaveValue('NVDA 2026.1');
    await expect(restorePage.getByLabel('Browser and version')).toHaveValue('Firefox 142');
    await restorePage.goto(`${origin}/report`);
    await expect(restorePage.getByText('Northstar Billing · NVDA 2026.1 · Firefox 142')).toBeVisible();
    await expect(restorePage.getByText('Download completion was not announced.')).toBeVisible();

    await restorePage.goto(`${origin}/audit`);
    await restorePage.getByLabel('Import audit JSON').setInputFiles({ name: 'bad.json', mimeType: 'application/json', buffer: Buffer.from('{"tasks":[]}') });
    await expect(restorePage.locator('#import-error')).toContainText('not a Screenreader Task Audit');
  } finally {
    await restoreContext.close();
  }
});

test('@claim:privacy-boundaries keep local audit data local and avoid capture or analytics', async ({ page, baseURL }) => {
  const external: string[] = []; const api: string[] = []; const origin = new URL(baseURL!).origin;
  await page.addInitScript(() => { (window as unknown as { captureCalls: string[] }).captureCalls = []; const media = navigator.mediaDevices as MediaDevices & Record<string, unknown>; for (const name of ['getDisplayMedia', 'getUserMedia']) { const original = media[name] as ((...args: unknown[]) => unknown) | undefined; if (original) Object.defineProperty(media, name, { configurable: true, value: (...args: unknown[]) => { (window as unknown as { captureCalls: string[] }).captureCalls.push(name); return original.apply(media, args); } }); } });
  page.on('request', request => { const url = new URL(request.url()); if (url.origin !== origin) external.push(url.href); if (url.pathname.startsWith('/api/')) api.push(url.href); });
  for (const route of ['/', '/?demo=1', '/audit', '/report', '/privacy', '/terms']) await page.goto(route);
  expect(await page.evaluate(() => (window as unknown as { captureCalls: string[] }).captureCalls)).toEqual([]);
  expect(external).toEqual([]); expect(api).toEqual([]);
});
test('@claim:offline-reload demo reloads offline after its first visit', async ({ page, context }) => { await page.goto('/?demo=1'); await page.evaluate(async () => { await navigator.serviceWorker.ready; }); await page.reload(); await context.setOffline(true); await page.reload(); await expect(page.getByText('You are offline. Saved audits and the demo still work.')).toBeVisible(); await expect(page.getByRole('heading', { name: 'August analytics check' })).toBeVisible(); });
test('@claim:manual-evidence-not-certification records observations without scans or scores', async ({ page }) => { await page.goto('/'); await expect(page.getByText('It records manual observations. It does not scan a product.')).toBeVisible(); await expect(page.getByText('It does not certify accessibility or provide legal advice.')).toBeVisible(); await expect(page.getByText(/score/i)).toHaveCount(0); });

test('routes have unique metadata, real 404, accessible structure, and 44px targets', async ({ page }) => {
  const checks: [string, string][] = [['/', 'Screenreader Task Audit — record task evidence'], ['/?demo=1', 'Demo — Screenreader Task Audit'], ['/audit', 'My audit — Screenreader Task Audit'], ['/report', 'Report — Screenreader Task Audit'], ['/demo/report', 'Demo report — Screenreader Task Audit'], ['/privacy', 'Privacy — Screenreader Task Audit'], ['/terms', 'Terms — Screenreader Task Audit'], ['/missing', 'Page not found — Screenreader Task Audit']];
  for (const [path, title] of checks) { await page.goto(path); await expect(page).toHaveTitle(title); await expect(page.locator('main')).toHaveCount(1); await expect(page.locator('h1')).toHaveCount(1); }
  await page.setViewportSize({ width: 390, height: 844 }); await page.goto('/?demo=1'); expect(await page.evaluate(() => document.documentElement.scrollWidth)).toBeLessThanOrEqual(390); for (const box of await page.locator('a,button').evaluateAll(elements => elements.map(element => { const box = element.getBoundingClientRect(); return { width: box.width, height: box.height }; }))) expect(Math.min(box.width, box.height)).toBeGreaterThanOrEqual(44);
});
test('all public routes have no serious accessibility findings or console errors', async ({ page }) => { const errors: string[] = []; page.on('console', message => { if (message.type() === 'error') errors.push(message.text()); }); for (const path of ['/', '/?demo=1', '/demo/report', '/privacy', '/terms']) { await page.goto(path); const result = await new AxeBuilder({ page }).analyze(); expect(result.violations.filter(issue => ['serious', 'critical'].includes(issue.impact || ''))).toEqual([]); } expect(errors).toEqual([]); await page.goto('/missing'); const result = await new AxeBuilder({ page }).analyze(); expect(result.violations.filter(issue => ['serious', 'critical'].includes(issue.impact || ''))).toEqual([]); });
test('keyboard navigation moves focus to each new heading', async ({ page }) => { await page.goto('/'); await page.keyboard.press('Tab'); await expect(page.getByRole('link', { name: 'Skip to main content' })).toBeFocused(); await page.keyboard.press('Enter'); await expect(page.locator('main')).toBeFocused(); await page.getByRole('link', { name: 'Demo', exact: true }).press('Enter'); await expect(page.locator('h1')).toBeFocused(); });
