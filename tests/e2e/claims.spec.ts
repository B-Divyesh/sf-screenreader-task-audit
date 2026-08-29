import { test, expect, type Browser, type Download, type Page } from '@playwright/test';
import AxeBuilder from '@axe-core/playwright';

async function createAudit(page: Page): Promise<void> {
  await page.goto('/audit');
  await page.getByLabel('Audit name').fill('September critical tasks');
  await page.getByLabel('Product or dashboard').fill('Example dashboard');
  await page.getByLabel('Screen reader and version').fill('NVDA 2026');
  await page.getByLabel('Browser and version').fill('Firefox 142');
  await agreeToConsent(page);
  await page.getByRole('button', { name: 'Create audit' }).click();
}
async function agreeToConsent(page: Page): Promise<void> {
  // The consent control is a real native checkbox. Exercise its keyboard
  // operation too, rather than bypassing the interaction with DOM state.
  const consent = page.getByLabel(/The tester agreed/);
  await consent.focus();
  await page.keyboard.press('Space');
  await expect(consent).toBeChecked();
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
  await page.getByRole('button', { name: 'Add trace event' }).click();
  await page.getByLabel('Time').fill('11:08');
  await page.getByLabel('Event type').selectOption('action');
  await page.getByLabel('Control or area').fill('Export menu');
  await page.getByLabel('What happened').fill('Pressed Enter and the hidden menu opened.');
  await page.getByRole('button', { name: 'Record event' }).click();
  await page.getByRole('link', { name: 'Review report' }).click();
  await expect(page.getByRole('heading', { name: 'Export invoices' })).toBeVisible();
  const report = page.locator('.report-task').first();
  for (const value of ['Billing', 'Open export and choose CSV.', 'Export button announced.', 'Focus moved to the hidden menu.', 'Menu has no accessible name.', 'Reproduced twice.', 'Export menu', 'Pressed Enter and the hidden menu opened.']) await expect(report).toContainText(value);
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
  await page.goto('/demo/report'); const download = page.waitForEvent('download'); await page.getByRole('button', { name: 'Export accessible HTML' }).click(); const stream = await (await download).createReadStream(); let html = ''; for await (const chunk of stream!) html += chunk.toString(); expect(html).toContain('<html lang="en">'); expect(html).toContain('<main>'); for (const value of ['Change the report date range', 'Overview dashboard', 'Sighted colleague had to change the range.', 'Date range button', 'Pressed Enter.', 'Focus returned to page navigation.']) expect(html).toContain(value);
});
test('@claim:json-export exports five tasks as JSON', async ({ page }) => { await page.goto('/demo/report'); const download = page.waitForEvent('download'); await page.getByRole('button', { name: 'Export JSON' }).click(); const stream = await (await download).createReadStream(); let json = ''; for await (const chunk of stream!) json += chunk.toString(); const exported = JSON.parse(json); expect(exported.schema).toBe('screenreader-task-audit/v1'); expect(exported.tasks).toHaveLength(5); });
test('@claim:anonymous-export removes product and environment names from JSON', async ({ page }) => { await page.goto('/demo/report'); await page.getByLabel('Remove product and environment names').check(); const download = page.waitForEvent('download'); await page.getByRole('button', { name: 'Export JSON' }).click(); const stream = await (await download).createReadStream(); let json = ''; for await (const chunk of stream!) json += chunk.toString(); expect(json).not.toContain('Northstar Metrics'); expect(JSON.parse(json)).toMatchObject({ product: 'Product withheld', environment: 'Withheld' }); });
test('@claim:team-sharing restores a Sociobot license and creates a private report link that opens without an account', async ({ page, browser }: { page: Page; browser: Browser }) => {
  const license = 'team-license-fixture';
  await page.route(`https://api.sociobot.in/api/v1/products/screenreader-task-audit/verify?license=${license}`, route => route.fulfill({ contentType: 'application/json', body: '{"valid":true}' }));
  await page.route('**/api/reports', async route => {
    expect(route.request().method()).toBe('POST');
    expect(route.request().headers().authorization).toBe(`Bearer ${license}`);
    expect(JSON.parse(route.request().postData() || '{}')).toMatchObject({ schema: 'screenreader-task-audit/v1', tasks: expect.any(Array) });
    await route.fulfill({ status: 201, contentType: 'application/json', body: '{"id":"0123456789abcdef0123456789abcdef","expires_at":"2026-09-28T09:00:00Z"}' });
  });
  await page.goto(`/report?license=${license}`);
  await expect(page).toHaveURL('/report');
  expect(await page.evaluate(() => localStorage.getItem('sb_license:screenreader-task-audit'))).toBe(license);
  await expect(page.getByRole('button', { name: 'Create private link' })).toBeVisible();
  await page.getByRole('button', { name: 'Create private link' }).click();
  const sharedLink = page.getByRole('link', { name: 'Open the private report' });
  await expect(sharedLink).toHaveAttribute('href', /\/share\/0123456789abcdef0123456789abcdef$/);
  const sharedUrl = await sharedLink.getAttribute('href');
  const readerContext = await browser.newContext();
  try {
    await readerContext.route('**/api/reports/0123456789abcdef0123456789abcdef', route => route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({
        audit: 'September critical tasks',
        product: 'Example dashboard',
        environment: 'NVDA 2026 · Firefox 142',
        tasks: [{ title: 'Export invoices', severity: 'critical', outcome: 'blocked', goal: 'Download invoices' }]
      })
    }));
    const reader = await readerContext.newPage();
    await reader.goto(sharedUrl!);
    expect(await reader.evaluate(() => localStorage.getItem('sb_license:screenreader-task-audit'))).toBeNull();
    await expect(reader.getByRole('heading', { name: 'September critical tasks' })).toBeVisible();
    await expect(reader.getByRole('heading', { name: 'Export invoices' })).toBeVisible();
  } finally {
    await readerContext.close();
  }
  await page.goto('/');
  await expect(page.getByText('$39 once')).toBeVisible();
  await expect(page.getByRole('link', { name: 'Buy team sharing (external)' })).toHaveAttribute('href', 'https://api.sociobot.in/api/v1/products/screenreader-task-audit/checkout');
  await page.goto('/privacy');
  await expect(page.getByText('Creating a private link sends the reviewed report to this service.')).toBeVisible();
  await page.goto('/terms');
  await expect(page.getByText('Team sharing is a one-time $39 purchase.')).toBeVisible();
  const catalog = await page.request.get('https://api.sociobot.in/api/v1/products');
  expect(catalog.ok()).toBe(true);
  const products = await catalog.json() as { data: { slug: string; price_minor: number; currency: string; checkout_url: string }[] };
  expect(products.data).toContainEqual(expect.objectContaining({
    slug: 'screenreader-task-audit',
    price_minor: 3900,
    currency: 'USD',
    checkout_url: 'https://api.sociobot.in/api/v1/products/screenreader-task-audit/checkout'
  }));
  const checkout = await page.request.get('https://api.sociobot.in/api/v1/products/screenreader-task-audit/checkout', { maxRedirects: 0 });
  expect(checkout.status()).toBe(303);
  expect(checkout.headers().location).toMatch(/^https:\/\/checkout\.dodopayments\.com\/session\/cks_[A-Za-z0-9]+$/);
});

test('@claim:license-restore-feedback announces invalid and valid landing license results without retaining an invalid token', async ({ page }) => {
  await page.route('https://api.sociobot.in/api/v1/products/screenreader-task-audit/verify?license=qa-invalid-token', route => route.fulfill({ contentType: 'application/json', body: '{"valid":false,"reason":"invalid"}' }));
  await page.route('https://api.sociobot.in/api/v1/products/screenreader-task-audit/verify?license=qa-valid-token', route => route.fulfill({ contentType: 'application/json', body: '{"valid":true,"reason":"ok"}' }));
  await page.goto('/');
  const input = page.getByLabel('Paste your team-sharing license');
  await input.fill('qa-invalid-token');
  await page.getByRole('button', { name: 'Verify license' }).click();
  const feedback = page.locator('#license-status');
  await expect(feedback).toHaveAttribute('role', 'status');
  await expect(feedback).toHaveAttribute('aria-live', 'polite');
  await expect(feedback).toHaveText('This team-sharing license is not active. Check the token or choose Buy team sharing. Free exports still work.');
  await expect(input).toBeFocused();
  expect(await page.evaluate(() => localStorage.getItem('sb_license:screenreader-task-audit'))).toBeNull();
  await input.fill('qa-valid-token');
  await page.getByRole('button', { name: 'Verify license' }).click();
  await expect(feedback).toHaveText('Team-sharing license verified. You can create a private link.');
  expect(await page.evaluate(() => localStorage.getItem('sb_license:screenreader-task-audit'))).toBe('qa-valid-token');
});

test('@claim:import-json restores every editable audit field only after confirmation', async ({ page, browser }: { page: Page; browser: Browser }) => {
  await page.goto('/audit');
  await page.getByLabel('Audit name').fill('October checkout audit');
  await page.getByLabel('Product or dashboard').fill('Northstar Billing');
  await page.getByLabel('Screen reader and version').fill('NVDA 2026.1');
  await page.getByLabel('Browser and version').fill('Firefox 142');
  await agreeToConsent(page);
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

test('@claim:privacy-boundaries keep recorded local audit data local and avoid capture or analytics', async ({ page, baseURL }) => {
  const external: string[] = []; const api: string[] = []; const origin = new URL(baseURL!).origin;
  await page.addInitScript(() => { (window as unknown as { captureCalls: string[] }).captureCalls = []; const media = navigator.mediaDevices as MediaDevices & Record<string, unknown>; for (const name of ['getDisplayMedia', 'getUserMedia']) { const original = media[name] as ((...args: unknown[]) => unknown) | undefined; if (original) Object.defineProperty(media, name, { configurable: true, value: (...args: unknown[]) => { (window as unknown as { captureCalls: string[] }).captureCalls.push(name); return original.apply(media, args); } }); } });
  page.on('request', request => { const url = new URL(request.url()); if (url.origin !== origin) external.push(url.href); if (url.pathname.startsWith('/api/')) api.push(url.href); });
  await createAudit(page);
  await page.getByLabel('Task name').fill('Private task marker 6b0a');
  await page.getByLabel('Other notes').fill('Private notes marker 9e4d');
  await page.getByRole('link', { name: 'Review report' }).click();
  for (const route of ['/', '/?demo=1', '/audit', '/report', '/privacy', '/terms']) await page.goto(route);
  expect(await page.evaluate(() => (window as unknown as { captureCalls: string[] }).captureCalls)).toEqual([]);
  expect(external).toEqual([]); expect(api).toEqual([]);
});
test('@claim:offline-reload demo reloads offline after its first visit', async ({ page, context }) => { await page.goto('/?demo=1'); await page.evaluate(async () => { await navigator.serviceWorker.ready; }); await page.reload(); await context.setOffline(true); await page.reload(); await expect(page.getByText('You are offline. Saved audits and the demo still work.')).toBeVisible(); await expect(page.getByRole('heading', { name: 'August analytics check' })).toBeVisible(); });
test('@claim:saved-audit-offline a saved local audit reloads offline after its first visit', async ({ page, context }) => {
  await createAudit(page);
  await page.getByLabel('Task name').fill('Saved offline audit');
  await page.getByLabel('Other notes').fill('This stays in browser storage.');
  await page.evaluate(async () => { await navigator.serviceWorker.ready; });
  await page.reload();
  await context.setOffline(true);
  await page.reload();
  await expect(page.getByText('You are offline. Saved audits and the demo still work.')).toBeVisible();
  await expect(page.getByRole('heading', { name: 'September critical tasks' })).toBeVisible();
  await expect(page.getByLabel('Task name')).toHaveValue('Saved offline audit');
  await expect(page.getByLabel('Other notes')).toHaveValue('This stays in browser storage.');
});
test('@claim:free-audit-features an unlicensed local audit can export HTML and JSON without an account', async ({ page }) => {
  await createAudit(page);
  await page.getByLabel('Task name').fill('Free export task');
  await page.getByRole('link', { name: 'Review report' }).click();
  expect(await page.evaluate(() => localStorage.getItem('sb_license:screenreader-task-audit'))).toBeNull();
  await expect(page.getByRole('button', { name: 'Create private link' })).toHaveCount(0);
  const htmlDownload = page.waitForEvent('download');
  await page.getByRole('button', { name: 'Export accessible HTML' }).click();
  expect(await readDownload(await htmlDownload)).toContain('<main>');
  const jsonDownload = page.waitForEvent('download');
  await page.getByRole('button', { name: 'Export JSON' }).click();
  expect(JSON.parse(await readDownload(await jsonDownload))).toMatchObject({ schema: 'screenreader-task-audit/v1' });
});
test('@claim:license-revocation a revoked team-sharing license removes private-link access', async ({ page }) => {
  const license = 'team-license-revoked-fixture';
  await page.addInitScript(token => {
    localStorage.setItem('sb_license:screenreader-task-audit', token);
    localStorage.setItem('sb_license:screenreader-task-audit:verified', JSON.stringify({ valid: true, checked: 0, token }));
  }, license);
  await page.route(`https://api.sociobot.in/api/v1/products/screenreader-task-audit/verify?license=${license}`, route => route.fulfill({ contentType: 'application/json', body: '{"valid":false,"reason":"revoked"}' }));
  await page.goto('/report');
  await expect(page.getByText('This team-sharing license is not active. Check the token or choose Buy team sharing. Free exports still work.')).toBeVisible();
  await expect(page.getByRole('button', { name: 'Create private link' })).toHaveCount(0);
  expect(await page.evaluate(() => localStorage.getItem('sb_license:screenreader-task-audit'))).toBeNull();
  expect(await page.evaluate(() => localStorage.getItem('sb_license:screenreader-task-audit:verified'))).toBeNull();
});
test('@claim:manual-evidence-not-certification records observations without scans or scores', async ({ page }) => { await page.goto('/'); await expect(page.getByText('It records manual observations. It does not scan a product.')).toBeVisible(); await expect(page.getByText('It does not certify accessibility or provide legal advice.')).toBeVisible(); await expect(page.getByText(/score/i)).toHaveCount(0); });

test('routes have unique metadata, real 404, accessible structure, and 44px targets', async ({ page }) => {
  const checks: [string, string, string, string][] = [
    ['/', 'Screenreader Task Audit — record task evidence', 'Record screen-reader task evidence and turn blockers into a clear, prioritized report.', '/'],
    ['/?demo=1', 'Demo — Screenreader Task Audit', 'Try five sample screen-reader tasks in an isolated browser-only demo.', '/demo'],
    ['/audit', 'My audit — Screenreader Task Audit', 'Set up and record a local screen-reader task audit.', '/audit'],
    ['/report', 'Report — Screenreader Task Audit', 'Review and export a prioritized screen-reader task report.', '/report'],
    ['/demo/report', 'Demo report — Screenreader Task Audit', 'Review the sample screen-reader task report.', '/demo/report'],
    ['/privacy', 'Privacy — Screenreader Task Audit', 'Learn where Screenreader Task Audit stores task observations.', '/privacy'],
    ['/terms', 'Terms — Screenreader Task Audit', 'Read the terms for using Screenreader Task Audit.', '/terms'],
    ['/missing', 'Page not found — Screenreader Task Audit', 'This Screenreader Task Audit page was not found.', '/404']
  ];
  const canonicalOrigin = 'https://screenreader-task-audit.sociobot.in';
  for (const [path, title, description, canonical] of checks) {
    const response = await page.goto(path);
    expect(response?.status()).toBe(path === '/missing' ? 404 : 200);
    await expect(page).toHaveTitle(title);
    await expect(page.locator('meta[name="description"]')).toHaveAttribute('content', description);
    await expect(page.locator('meta[property="og:title"]')).toHaveAttribute('content', title);
    await expect(page.locator('meta[property="og:description"]')).toHaveAttribute('content', description);
    await expect(page.locator('meta[name="twitter:title"]')).toHaveAttribute('content', title);
    await expect(page.locator('meta[name="twitter:description"]')).toHaveAttribute('content', description);
    await expect(page.locator('link[rel="canonical"]')).toHaveAttribute('href', `${canonicalOrigin}${canonical}`);
    await expect(page.locator('main')).toHaveCount(1);
    await expect(page.locator('h1')).toHaveCount(1);
    await expect(page.getByRole('link', { name: 'Privacy', exact: true }).first()).toHaveAttribute('href', '/privacy');
    await expect(page.getByRole('link', { name: 'Terms', exact: true })).toHaveAttribute('href', '/terms');
  }
  await page.setViewportSize({ width: 390, height: 844 }); await page.goto('/?demo=1'); expect(await page.evaluate(() => document.documentElement.scrollWidth)).toBeLessThanOrEqual(390); for (const box of await page.locator('a,button').evaluateAll(elements => elements.map(element => { const box = element.getBoundingClientRect(); return { width: box.width, height: box.height }; }))) expect(Math.min(box.width, box.height)).toBeGreaterThanOrEqual(44);
});
test('static 404 keeps links and focus indicators accessible in dark mode', async ({ page }) => {
  await page.emulateMedia({ colorScheme: 'dark' });
  const response = await page.goto('/missing');
  expect(response?.status()).toBe(404);
  await expect(page.locator('nav a').first()).toHaveCSS('color', 'rgb(117, 167, 255)');
  await page.keyboard.press('Tab');
  await expect(page.getByRole('link', { name: 'Skip to main content' })).toHaveCSS('outline-color', 'rgb(117, 167, 255)');
  const result = await new AxeBuilder({ page }).analyze();
  expect(result.violations.filter(issue => ['serious', 'critical'].includes(issue.impact || ''))).toEqual([]);
});
test('shared report metadata distinguishes loaded and missing reports', async ({ page }) => {
  const loadedId = '0123456789abcdef0123456789abcdef';
  await page.route(`**/api/reports/${loadedId}`, route => route.fulfill({
    status: 200,
    contentType: 'application/json',
    body: JSON.stringify({
      audit: 'Shared October audit', product: 'Northstar Billing', environment: 'NVDA 2026.1 · Firefox 142',
      tasks: [{ title: 'Download an invoice', severity: 'high', outcome: 'partial', goal: 'Save a PDF', announced: 'Menu announced', focus: 'Focus moved', blocker: 'Completion was silent' }]
    })
  }));
  await page.goto(`/share/${loadedId}`);
  await expect(page).toHaveTitle('Shared report — Screenreader Task Audit');
  await expect(page.locator('meta[property="og:title"]')).toHaveAttribute('content', 'Shared report — Screenreader Task Audit');
  await expect(page.locator('meta[name="description"]')).toHaveAttribute('content', 'Read a shared screen-reader task report.');
  await expect(page.getByRole('heading', { name: 'Shared October audit' })).toBeVisible();

  const missingId = 'fedcba9876543210fedcba9876543210';
  await page.route(`**/api/reports/${missingId}`, route => route.fulfill({ status: 404, contentType: 'application/json', body: '{"error":"missing"}' }));
  await page.goto(`/share/${missingId}`);
  await expect(page).toHaveTitle('Page not found — Screenreader Task Audit');
  await expect(page.locator('meta[property="og:title"]')).toHaveAttribute('content', 'Page not found — Screenreader Task Audit');
  await expect(page.getByRole('heading', { name: 'This page was not found' })).toBeVisible();
});
test('all public routes have no serious accessibility findings or console errors', async ({ page }) => { const errors: string[] = []; page.on('console', message => { if (message.type() === 'error') errors.push(message.text()); }); for (const path of ['/', '/?demo=1', '/demo/report', '/privacy', '/terms']) { await page.goto(path); const result = await new AxeBuilder({ page }).analyze(); expect(result.violations.filter(issue => ['serious', 'critical'].includes(issue.impact || ''))).toEqual([]); } expect(errors).toEqual([]); await page.goto('/missing'); const result = await new AxeBuilder({ page }).analyze(); expect(result.violations.filter(issue => ['serious', 'critical'].includes(issue.impact || ''))).toEqual([]); });
test('blocked task controls meet AA contrast at 390px', async ({ page }) => { await page.setViewportSize({ width: 390, height: 844 }); await page.goto('/demo'); const result = await new AxeBuilder({ page }).include('fieldset').analyze(); expect(result.violations.filter(issue => issue.id === 'color-contrast' && ['serious', 'critical'].includes(issue.impact || ''))).toEqual([]); });
test('keyboard navigation moves focus to each new heading', async ({ page }) => { await page.goto('/'); await page.keyboard.press('Tab'); await expect(page.getByRole('link', { name: 'Skip to main content' })).toBeFocused(); await page.keyboard.press('Enter'); await expect(page.locator('main')).toBeFocused(); await page.getByRole('link', { name: 'Demo', exact: true }).press('Enter'); await expect(page.locator('h1')).toBeFocused(); });
test('keyboard task changes and trace actions retain focus and announce the new state', async ({ page }) => {
  await page.goto('/demo');
  const secondTask = page.locator('[data-task]').nth(1);
  await secondTask.focus();
  await page.keyboard.press('Enter');
  await expect(page.locator('#task-heading')).toBeFocused();
  await expect(page.locator('#save-status')).toContainText('Editing task Find the top-selling product.');
  const traceButton = page.getByRole('button', { name: 'Add trace event' });
  await traceButton.focus();
  await page.keyboard.press('Space');
  await expect(page.getByLabel('Time')).toBeFocused();
  await expect(page.locator('#save-status')).toContainText('Trace event form opened.');
});
test('all public pages reflow at 200% text size on a 390px screen', async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  for (const path of ['/', '/demo', '/demo/report', '/privacy', '/terms']) {
    await page.goto(path);
    await page.evaluate(() => { document.documentElement.style.fontSize = '32px'; });
    expect(await page.evaluate(() => document.documentElement.scrollWidth)).toBeLessThanOrEqual(390);
  }
});
test('public routes do not raise page errors', async ({ page }) => {
  const errors: string[] = [];
  page.on('pageerror', error => errors.push(error.message));
  for (const path of ['/', '/demo', '/demo/report', '/privacy', '/terms']) await page.goto(path);
  expect(errors).toEqual([]);
});
test('the demo has no serious accessibility findings in dark mode', async ({ page }) => {
  await page.emulateMedia({ colorScheme: 'dark' });
  await page.goto('/demo');
  const result = await new AxeBuilder({ page }).analyze();
  expect(result.violations.filter(issue => ['serious', 'critical'].includes(issue.impact || ''))).toEqual([]);
});
