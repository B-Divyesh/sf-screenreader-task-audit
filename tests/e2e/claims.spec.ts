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

test('@claim:license-unlock a valid license enables team sharing', async ({ page }) => {
  await page.route('https://api.sociobot.in/**/verify?*', route => route.fulfill({ json: { valid: true, reason: 'ok', expires_at: null } }));
  await page.goto('/demo');
  await page.evaluate(() => localStorage.setItem('sra:audit:v1', localStorage.getItem('demo:sra:audit:v1')!.replace('demo-audit', 'real-audit')));
  await page.goto('/report?license=test-license');
  await expect(page.getByRole('button', { name: 'Create private link' })).toBeVisible();
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

test('@claim:local-privacy demo flow sends no data off-site', async ({ page }) => {
  const external: string[] = [];
  page.on('request', request => { if (new URL(request.url()).origin !== 'http://127.0.0.1:4173') external.push(request.url()); });
  await page.goto('/demo');
  await page.getByRole('button', { name: /01 Change the report date range/ }).click();
  await page.getByLabel('Other notes').fill('A local observation');
  await page.getByRole('link', { name: 'Review report' }).click();
  await expect(page.getByRole('heading', { name: /Report:/ })).toBeVisible();
  expect(external).toEqual([]);
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
  expect(errors).toEqual([]);
});

test('keyboard route changes focus the page heading', async ({ page }) => {
  await page.goto('/');
  await page.keyboard.press('Tab');
  await page.keyboard.press('Tab');
  await page.getByRole('link', { name: 'Demo', exact: true }).press('Enter');
  await expect(page.locator('h1')).toBeFocused();
});
