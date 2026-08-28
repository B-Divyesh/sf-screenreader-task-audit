import { test, expect } from '@playwright/test';
import AxeBuilder from '@axe-core/playwright';

test('@claim:demo-sandbox sample data is isolated and resettable', async ({ page }) => {
  await page.goto('/demo');
  await expect(page.getByText('Demo — sample data, nothing is saved')).toBeVisible();
  await expect(page.getByRole('heading', { name: 'August analytics check' })).toBeVisible();
  await page.getByLabel('Task name').fill('Changed only in the demo');
  expect(await page.evaluate(() => localStorage.getItem('demo:sra:audit:v1'))).toContain('Changed only in the demo');
  expect(await page.evaluate(() => localStorage.getItem('sra:audit:v1'))).toBeNull();
  await page.getByRole('button', { name: 'Reset demo' }).click();
  await expect(page.getByLabel('Task name')).toHaveValue('Change the report date range');
});

test('@claim:five-tasks free audits support five critical tasks', async ({ page }) => {
  await page.goto('/demo');
  await expect(page.locator('.task-rail li')).toHaveCount(5);
  await expect(page.getByRole('button', { name: 'Add task' })).toBeDisabled();
});

test('@claim:license-unlock a valid license creates a link a clean browser can open', async ({ page, browser }) => {
  const sharedId = '0123456789abcdef0123456789abcdef';
  let createdReport: Record<string, unknown> | undefined;
  await page.route('https://api.sociobot.in/**/verify?*', route => route.fulfill({ json: { valid: true, reason: 'ok', expires_at: null } }));
  await page.route('**/api/reports', route => {
    expect(route.request().method()).toBe('POST');
    createdReport = route.request().postDataJSON() as Record<string, unknown>;
    return route.fulfill({ status: 201, json: { id: sharedId, expires_at: '2026-09-27T00:00:00Z' } });
  });
  await page.goto('/demo');
  await page.evaluate(() => localStorage.setItem('sra:audit:v1', localStorage.getItem('demo:sra:audit:v1')!.replace('demo-audit', 'real-audit')));
  await page.goto('/report?license=test-license');
  await page.getByRole('button', { name: 'Create private link' }).click();
  await expect(page.locator('#report-status')).toContainText(`/share/${sharedId}`);
  expect(createdReport).toMatchObject({ schema: 'screenreader-task-audit/v1', audit: 'August analytics check' });

  const cleanContext = await browser.newContext();
  try {
    const sharedPage = await cleanContext.newPage();
    await sharedPage.route(`**/api/reports/${sharedId}`, route => {
      expect(route.request().headers().authorization).toBeUndefined();
      return route.fulfill({ json: createdReport });
    });
    await sharedPage.goto(`/share/${sharedId}`);
    await expect(sharedPage.getByRole('heading', { name: 'August analytics check' })).toBeVisible();
    await expect(sharedPage.getByText('Change the report date range')).toBeVisible();
  } finally {
    await cleanContext.close();
  }
});

test('@claim:html-export exports an accessible standalone report', async ({ page }) => {
  await page.goto('/demo/report');
  const downloadPromise = page.waitForEvent('download');
  await page.getByRole('button', { name: 'Export accessible HTML' }).click();
  const download = await downloadPromise;
  const stream = await download.createReadStream();
  let contents = '';
  for await (const chunk of stream) contents += chunk.toString();
  expect(contents).toContain('<html lang="en">');
  expect(contents).toContain('Change the report date range');
  expect(contents).toContain('Not an accessibility certification');
});

test('@claim:json-export exports the complete report as JSON', async ({ page }) => {
  await page.goto('/demo/report');
  const downloadPromise = page.waitForEvent('download');
  await page.getByRole('button', { name: 'Export JSON' }).click();
  const download = await downloadPromise;
  const stream = await download.createReadStream();
  let contents = '';
  for await (const chunk of stream) contents += chunk.toString();
  const exported = JSON.parse(contents) as { schema: string; product: string; tasks: unknown[] };
  expect(exported.schema).toBe('screenreader-task-audit/v1');
  expect(exported.product).toBe('Northstar Metrics');
  expect(exported.tasks).toHaveLength(5);
});

test('@claim:anonymous-export removes product and environment names from a JSON export', async ({ page }) => {
  await page.goto('/demo/report');
  await page.getByLabel('Remove product and environment names').check();
  const downloadPromise = page.waitForEvent('download');
  await page.getByRole('button', { name: 'Export JSON' }).click();
  const download = await downloadPromise;
  const stream = await download.createReadStream();
  let contents = '';
  for await (const chunk of stream) contents += chunk.toString();
  const exported = JSON.parse(contents) as { product: string; environment: string };
  expect(exported).toMatchObject({ product: 'Product withheld', environment: 'Withheld' });
  expect(contents).not.toContain('Northstar Metrics');
  expect(contents).not.toContain('NVDA 2026.1');
});

test('@claim:free-local-storage saves a free audit locally without an API request', async ({ page }) => {
  const apiRequests: string[] = [];
  const externalRequests: string[] = [];
  page.on('request', request => {
    if (new URL(request.url()).pathname.startsWith('/api/')) apiRequests.push(request.url());
    if (new URL(request.url()).origin !== 'http://127.0.0.1:4173') externalRequests.push(request.url());
  });
  await page.goto('/audit');
  await page.getByLabel('Audit name').fill('Local-only audit');
  await page.getByLabel('Product or dashboard').fill('Private dashboard');
  await page.getByLabel('Screen reader and version').fill('NVDA');
  await page.getByLabel('Browser and version').fill('Firefox');
  await page.getByLabel(/The tester agreed to record these observations/).check();
  await page.getByRole('button', { name: 'Create audit' }).click();
  await page.getByLabel('Other notes').fill('Keep this evidence in the browser.');
  await expect(page.locator('#save-status')).toContainText('Saved in this browser.');
  expect(await page.evaluate(() => localStorage.getItem('sra:audit:v1'))).toContain('Keep this evidence in the browser.');
  expect(apiRequests).toEqual([]);
  expect(externalRequests).toEqual([]);
});

test('@claim:hosted-checkout shows the $39 one-time hosted-payment terms', async ({ page }) => {
  await page.goto('/');
  await expect(page.getByText('$39 once')).toBeVisible();
  await expect(page.getByRole('link', { name: 'Buy team sharing' }).first()).toHaveAttribute(
    'href',
    'https://api.sociobot.in/api/v1/products/screenreader-task-audit/checkout'
  );
  await expect(page.getByText('Sociobot and Dodo handle payment and refunds.')).toBeVisible();
});

test('@claim:offline-reload demo reloads offline after first visit', async ({ page, context }) => {
  await page.goto('/demo');
  await page.evaluate(async () => { const registration = await navigator.serviceWorker.ready; await registration.update(); });
  await page.reload();
  await expect(page.getByRole('heading', { name: 'August analytics check' })).toBeVisible();
  await context.setOffline(true);
  await page.reload();
  await expect(page.getByText('You are offline. Saved audits and the demo still work.')).toBeVisible();
  await expect(page.getByRole('heading', { name: 'August analytics check' })).toBeVisible();
});

test('landing and audit pages have no serious accessibility findings', async ({ page }) => {
  const errors: string[] = [];
  page.on('console', message => { if (message.type() === 'error') errors.push(message.text()); });
  page.on('pageerror', error => errors.push(error.message));
  for (const path of ['/', '/demo', '/demo/report', '/privacy', '/terms']) {
    await page.goto(path);
    await expect(page.locator('main')).toHaveCount(1);
    await expect(page.locator('h1')).toHaveCount(1);
    const results = await new AxeBuilder({ page }).analyze();
    expect(results.violations.filter(issue => ['serious','critical'].includes(issue.impact || ''))).toEqual([]);
  }
  await page.emulateMedia({ colorScheme: 'dark' });
  for (const path of ['/', '/demo']) {
    await page.goto(path);
    const results = await new AxeBuilder({ page }).analyze();
    expect(results.violations.filter(issue => ['serious','critical'].includes(issue.impact || ''))).toEqual([]);
  }
  expect(errors).toEqual([]);
});

test('keyboard route changes focus the page heading', async ({ page }) => {
  await page.goto('/');
  await page.keyboard.press('Tab');
  await page.keyboard.press('Tab');
  await page.getByRole('link', { name: 'Demo', exact: true }).press('Enter');
  await expect(page.locator('h1')).toBeFocused();
});
