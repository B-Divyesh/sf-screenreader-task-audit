import './style.css';
import { blankTask, loadAudit, resetAudit, saveAudit, priority, reportData, type Audit, type AuditTask, type Outcome, type Severity } from './model';
import { downloadHtml, downloadJson, escapeHtml } from './export';

const app = document.querySelector<HTMLDivElement>('#app')!;
let demoMode = location.pathname === '/demo' || new URLSearchParams(location.search).get('demo') === '1';
let audit: Audit = loadAudit(demoMode);
let activeTaskId = audit.tasks[0]?.id || '';
let traceOpen = false;
let message = '';
let licensed = false;

const PRODUCT = 'screenreader-task-audit';
const LICENSE_KEY = `sb_license:${PRODUCT}`;
const LICENSE_CACHE = `${LICENSE_KEY}:verified`;

function takeLicenseFromUrl(): void {
  const url = new URL(location.href);
  const token = url.searchParams.get('license');
  if (!token) return;
  localStorage.setItem(LICENSE_KEY, token);
  url.searchParams.delete('license');
  history.replaceState({}, '', url.pathname + url.search + url.hash);
  void verifyLicense(token, true);
}

async function verifyLicense(token = localStorage.getItem(LICENSE_KEY) || '', force = false): Promise<void> {
  if (!token || demoMode) return;
  try {
    const cached = JSON.parse(localStorage.getItem(LICENSE_CACHE) || '{}') as { valid?: boolean; checked?: number };
    if (!force && cached.valid && cached.checked && Date.now() - cached.checked < 86_400_000) { licensed = true; return; }
    const response = await fetch(`https://api.sociobot.in/api/v1/products/${PRODUCT}/verify?license=${encodeURIComponent(token)}`);
    const result = await response.json() as { valid: boolean };
    licensed = result.valid;
    localStorage.setItem(LICENSE_CACHE, JSON.stringify({ valid: licensed, checked: Date.now() }));
    if (!licensed) message = 'This license is no longer active. The free audit still works.';
    render(false);
  } catch {
    const cached = JSON.parse(localStorage.getItem(LICENSE_CACHE) || '{}') as { valid?: boolean };
    licensed = Boolean(cached.valid);
  }
}

function header(): string {
  return `<a class="skip-link" href="#main">Skip to main content</a>
    <div id="offline" class="offline" role="status">You are offline. Saved audits and the demo still work.</div>
    ${demoMode ? `<aside class="demo-banner" aria-label="Demo mode"><div class="demo-inner"><strong>Demo — sample data, nothing is saved</strong><button id="reset-demo" type="button">Reset demo</button><a href="/audit" data-link>Start for real</a></div></aside>` : ''}
    <header class="site-header"><div class="header-inner">
      <a class="wordmark" href="/" data-link>Screenreader<br>Task Audit <span class="registration" aria-hidden="true"><i></i><i></i></span></a>
      <nav aria-label="Main navigation"><ul><li><a href="/demo" data-link>Demo</a></li><li><a href="/audit" data-link>My audit</a></li><li><a href="/privacy" data-link>Privacy</a></li></ul></nav>
    </div></header>`;
}

function footer(): string {
  return `<footer class="site-footer"><div class="footer-inner"><div><strong>Screenreader Task Audit</strong><p>Record lived task evidence. Fix what blocks the work.</p><p class="footer-meta">Original generated collage · Version 1.0.0 · Build ${escapeHtml(import.meta.env.VITE_BUILD_SHA || 'dev')}</p></div><div class="footer-links"><a href="/privacy" data-link>Privacy</a><a href="/terms" data-link>Terms</a><a href="https://sociobot.in" rel="external">Built by Param Factory</a></div></div></footer>`;
}

function shell(content: string): string {
  return `${header()}${content}<div id="route-status" class="visually-hidden" aria-live="polite"></div>${footer()}`;
}

function landing(): string {
  return shell(`<main id="main">
    <section class="page hero" aria-labelledby="page-title"><div class="hero-copy">
      <p class="eyebrow">Evidence, not a score</p>
      <h1 id="page-title" tabindex="-1">Prove which screen-reader tasks work</h1>
      <p class="lede">For blind founders and small teams who need clear evidence before fixing an essential dashboard task.</p>
      <div class="hero-actions"><a class="button primary" href="/demo" data-link>Try it with sample data</a><span class="action-note">See five filled tasks and a prioritized report.</span></div>
      <ul class="plain-facts"><li>Your free audit stays in this browser.</li><li>The demo works offline after your first visit.</li><li>Free for five critical tasks.</li></ul>
    </div><figure class="hero-art"><img src="/assets/audit-collage.webp" width="1200" height="800" fetchpriority="high" alt="Five paper task slips connect a keyboard path to screen-reader sound waves."><figcaption>Five task slips keep the test small enough to repeat after a fix.</figcaption></figure></section>
    <section class="ruled-section" aria-labelledby="preview-title"><div class="section-inner"><p class="eyebrow">Live report preview</p><h2 id="preview-title">Turn observations into a fix list</h2><div class="preview-sheet"><div class="summary-strip"><span class="chip blocked">1 blocked</span><span class="chip">1 partial</span><span class="chip">2 completed</span></div><div class="preview-grid"><div><span class="stamp">01 · Critical</span><h3>Change the report date range</h3><p>Focus moves behind the calendar. Its days have no accessible names.</p></div><div><span class="stamp">02 · High</span><h3>Find the top product</h3><p>Revenue cells sound blank because the chart has no text alternative.</p></div><div><span class="stamp">03 · Passed</span><h3>Export the orders report</h3><p>The menu and download notice are both announced.</p></div></div></div></div></section>
    <section class="section-inner" aria-labelledby="works-title"><h2 id="works-title">How the audit works</h2><div class="steps"><article class="step"><p class="number" aria-hidden="true">1</p><h3>Name five tasks</h3><p>Choose the work that affects revenue, support, or daily operations.</p></article><article class="step"><p class="number" aria-hidden="true">2</p><h3>Record what happened</h3><p>Note announcements, focus movement, the result, and any blocker.</p></article><article class="step"><p class="number" aria-hidden="true">3</p><h3>Share a fix list</h3><p>Export an accessible report, ordered by task result and severity.</p></article></div></section>
    <section class="ruled-section" aria-labelledby="limits-title"><div class="section-inner"><h2 id="limits-title">What this audit does not do</h2><ul class="not-list"><li>It does not watch a tester or record page text.</li><li>It does not collect passwords or product analytics payloads.</li><li>It does not replace a WCAG review or provide legal advice.</li><li>It does not certify that a product is accessible.</li></ul></div></section>
    <section class="section-inner" aria-labelledby="price-title"><p class="eyebrow">Team handoff</p><h2 id="price-title">Share reports for a one-time $39</h2><div class="pricing-grid"><div class="price-sheet"><p class="price">$39 once</p><p>Create private report links that a teammate can open without an account. Links expire after 30 days.</p><a class="button primary" href="https://api.sociobot.in/api/v1/products/${PRODUCT}/checkout">Buy team sharing</a><p class="hint">Sociobot and Dodo handle payment and refunds.</p></div><div><h3>The free audit stays useful</h3><p>Record five tasks. Save them in this browser. Export JSON or accessible HTML at no cost.</p></div><div><h3>Already bought it?</h3><form id="license-form"><label for="license">Paste your license</label><input id="license" name="license" type="text" autocomplete="off"><button type="submit">Verify license</button></form></div></div></section>
  </main>`);
}

function setupPage(): string {
  return shell(`<main id="main" class="app-page"><p class="eyebrow">New audit</p><h1 id="page-title" tabindex="-1">Set up a screen-reader task audit</h1><div class="setup"><p>Record the test environment. Do not enter a tester’s real name.</p><form id="setup-form" novalidate>
    <div class="field"><label for="audit-name">Audit name</label><input id="audit-name" name="name" type="text" required maxlength="80" value="${escapeHtml(audit.name)}"><p class="hint">Example: August analytics check</p></div>
    <div class="field"><label for="product">Product or dashboard</label><input id="product" name="product" type="text" required maxlength="80" value="${escapeHtml(audit.product)}"></div>
    <div class="form-grid"><div class="field"><label for="at">Screen reader and version</label><input id="at" name="assistiveTech" type="text" required maxlength="80" value="${escapeHtml(audit.assistiveTech)}"></div><div class="field"><label for="browser">Browser and version</label><input id="browser" name="browser" type="text" required maxlength="80" value="${escapeHtml(audit.browser)}"></div></div>
    <div class="field check"><input id="consent" name="consent" type="checkbox" required ${audit.consent ? 'checked' : ''}><label for="consent">The tester agreed to record these observations. I will not enter passwords, private page text, or analytics payloads.</label></div>
    <p id="setup-error" class="error" role="alert"></p><button class="primary" type="submit">Create audit</button>
  </form></div></main>`);
}

function outcomeChoice(task: AuditTask, value: Outcome, label: string): string {
  return `<span class="radio-choice outcome-${value}"><input id="outcome-${value}" name="outcome" type="radio" value="${value}" ${task.outcome === value ? 'checked' : ''}><label for="outcome-${value}">${label}</label></span>`;
}

function severityChoice(task: AuditTask, value: Severity): string {
  return `<span class="radio-choice"><input id="severity-${value}" name="severity" type="radio" value="${value}" ${task.severity === value ? 'checked' : ''}><label for="severity-${value}">${value[0].toUpperCase() + value.slice(1)}</label></span>`;
}

function workspace(): string {
  const task = audit.tasks.find(item => item.id === activeTaskId) || audit.tasks[0];
  const tabs = audit.tasks.map((item, index) => `<li><button class="task-tab" data-task="${item.id}" aria-current="${item.id === task?.id}"><span class="task-num">${String(index + 1).padStart(2, '0')}</span>${escapeHtml(item.title || 'Untitled task')}</button></li>`).join('');
  const sheet = task ? taskSheet(task) : `<section class="sheet"><h2>No tasks yet</h2><p>Add the first essential task. Its observations will appear here.</p><button class="primary" id="add-task-empty">Add first task</button></section>`;
  return shell(`<main id="main" class="app-page"><p class="eyebrow">${demoMode ? 'Sample audit' : 'Saved in this browser'}</p><h1 id="page-title" tabindex="-1">${escapeHtml(audit.name || 'Screen-reader task audit')}</h1><p class="lede">${escapeHtml(audit.product)} · ${escapeHtml(audit.assistiveTech)} · ${escapeHtml(audit.browser)}</p>
    <div class="toolbar"><a class="button" href="${demoMode ? '/demo/report' : '/report'}" data-link>Review report</a>${demoMode ? '' : '<button class="quiet" id="edit-setup" type="button">Edit audit details</button>'}</div>
    <p id="save-status" class="status" aria-live="polite">${escapeHtml(message)}</p>
    <div class="audit-layout"><aside class="task-rail" aria-label="Audit tasks"><h2>Critical tasks</h2><p class="count">${audit.tasks.length} of 5 tasks</p><ol>${tabs}</ol><button id="add-task" type="button" ${audit.tasks.length >= 5 ? 'disabled' : ''}>Add task</button></aside>${sheet}</div>
  </main>`);
}

function taskSheet(task: AuditTask): string {
  const trace = task.trace.map(event => `<li><strong>${escapeHtml(event.kind.replace('-', ' '))}</strong> at ${escapeHtml(event.time || 'time not set')} — ${escapeHtml(event.target || 'target not named')}: ${escapeHtml(event.observed || 'no detail')}</li>`).join('');
  return `<section class="sheet" aria-labelledby="task-heading"><p class="stamp">Observation sheet</p><h2 id="task-heading">${escapeHtml(task.title || 'Untitled task')}</h2><form id="task-form">
    <div class="field"><label for="title">Task name</label><input id="title" name="title" type="text" maxlength="100" required value="${escapeHtml(task.title)}"></div>
    <div class="form-grid"><div class="field"><label for="goal">Tester’s goal</label><input id="goal" name="goal" type="text" maxlength="180" value="${escapeHtml(task.goal)}"></div><div class="field"><label for="start">Starting place</label><input id="start" name="start" type="text" maxlength="120" value="${escapeHtml(task.start)}"></div></div>
    <fieldset><legend>Task result</legend><div class="radio-row">${outcomeChoice(task,'not-tested','Not tested')}${outcomeChoice(task,'completed','Completed')}${outcomeChoice(task,'partial','Partial')}${outcomeChoice(task,'blocked','Blocked')}</div></fieldset>
    <fieldset><legend>Impact if this fails</legend><div class="radio-row">${severityChoice(task,'low')}${severityChoice(task,'medium')}${severityChoice(task,'high')}${severityChoice(task,'critical')}</div></fieldset>
    <div class="field"><label for="expected">Expected steps</label><textarea id="expected" name="expected" maxlength="1000">${escapeHtml(task.expected)}</textarea></div>
    <div class="field"><label for="announced">Announcements heard</label><textarea id="announced" name="announced" maxlength="1000">${escapeHtml(task.announced)}</textarea><p class="hint">Describe only what matters to this task. Do not paste page text.</p></div>
    <div class="field"><label for="focus">Focus movement</label><textarea id="focus" name="focus" maxlength="1000">${escapeHtml(task.focus)}</textarea></div>
    <div class="field"><label for="blocker">Blocker</label><textarea id="blocker" name="blocker" maxlength="1000">${escapeHtml(task.blocker)}</textarea></div>
    <div class="field"><label for="notes">Other notes</label><textarea id="notes" name="notes" maxlength="1000">${escapeHtml(task.notes)}</textarea></div>
  </form><section class="trace"><h3>Optional event trace</h3><p>Record only actions, focus, and announcements needed to reproduce the task.</p>${trace ? `<ol class="trace-list">${trace}</ol>` : '<p>No trace events recorded. Add one only when sequence matters.</p>'}<button id="toggle-trace" type="button">${traceOpen ? 'Close trace form' : 'Add trace event'}</button>${traceOpen ? traceForm() : ''}</section>
  <div class="toolbar"><button class="quiet" id="delete-task" type="button">Delete this task</button></div></section>`;
}

function traceForm(): string {
  return `<form id="trace-form" class="license-box"><div class="form-grid"><div class="field"><label for="trace-time">Time</label><input id="trace-time" name="time" type="text" maxlength="20" placeholder="09:14"></div><div class="field"><label for="trace-kind">Event type</label><select id="trace-kind" name="kind"><option value="focus">Focus</option><option value="announcement">Announcement</option><option value="action">Action</option><option value="unexpected-change">Unexpected change</option></select></div></div><div class="field"><label for="trace-target">Control or area</label><input id="trace-target" name="target" type="text" maxlength="100"></div><div class="field"><label for="trace-observed">What happened</label><input id="trace-observed" name="observed" type="text" maxlength="240" required></div><button type="submit">Record event</button></form>`;
}

function reportPage(): string {
  const report = reportData(audit, false);
  const tasks = [...audit.tasks].sort((a,b) => priority(b)-priority(a)).map((task,index) => `<article class="report-task"><p class="stamp">Priority ${index + 1} · ${escapeHtml(task.severity)}</p><h2>${escapeHtml(task.title || 'Untitled task')}</h2><p><strong>Result:</strong> ${escapeHtml(task.outcome.replace('-', ' '))}</p><dl><dt>Tester’s goal</dt><dd>${escapeHtml(task.goal || 'Not recorded')}</dd><dt>Expected steps</dt><dd>${escapeHtml(task.expected || 'Not recorded')}</dd><dt>Announcements heard</dt><dd>${escapeHtml(task.announced || 'Not recorded')}</dd><dt>Focus movement</dt><dd>${escapeHtml(task.focus || 'Not recorded')}</dd><dt>Blocker</dt><dd>${escapeHtml(task.blocker || 'None recorded')}</dd><dt>Other notes</dt><dd>${escapeHtml(task.notes || 'None recorded')}</dd></dl></article>`).join('');
  return shell(`<main id="main" class="app-page"><p class="eyebrow">Prioritized evidence</p><h1 id="page-title" tabindex="-1">Report: ${escapeHtml(audit.name || 'Untitled audit')}</h1><p class="lede">${escapeHtml(audit.product || 'Product not named')} · ${escapeHtml(audit.assistiveTech)} · ${escapeHtml(audit.browser)}</p><div class="summary-strip"><span class="chip">${report.summary.completed} completed</span><span class="chip">${report.summary.partial} partial</span><span class="chip blocked">${report.summary.blocked} blocked</span><span class="chip">${report.summary.notTested} not tested</span></div>
    <div class="notice"><strong>This is observed task evidence.</strong> It is not an accessibility certification or legal advice.</div>
    <div class="toolbar"><button id="export-html" type="button">Export accessible HTML</button><button id="export-json" type="button">Export JSON</button><span class="check"><input id="anonymous" type="checkbox"><label for="anonymous">Remove product and environment names</label></span><a href="${demoMode ? '/demo' : '/audit'}" data-link>Back to audit</a></div>
    <p id="report-status" class="status" aria-live="polite">${escapeHtml(message)}</p>${tasks || '<section class="sheet"><h2>No report items yet</h2><p>Add a task to create the report.</p></section>'}
    <section class="price-sheet" aria-labelledby="share-title"><h2 id="share-title">Share with your team</h2>${licensed ? '<p>Create a private link. The shared copy expires after 30 days.</p><button id="share-report" class="primary" type="button">Create private link</button>' : `<p>Team sharing costs $39 once. Free HTML and JSON exports stay available.</p><a class="button primary" href="https://api.sociobot.in/api/v1/products/${PRODUCT}/checkout">Buy team sharing</a><form id="report-license-form" class="license-box"><label for="report-license">Have a license? Paste it</label><input id="report-license" name="license" type="text"><button type="submit">Verify license</button></form>`}</section>
  </main>`);
}

function legalPage(kind: 'privacy'|'terms'): string {
  const privacy = `<p class="lede">Your audit stays under your control.</p><h2>Data saved in your browser</h2><p>The free audit stores task names, observations, and settings in local storage. Demo data uses a separate demo key.</p><h2>Data sent to the server</h2><p>No audit content leaves your browser until a licensed user creates a private report link. That action sends the report you reviewed.</p><h2>Shared reports</h2><p>Shared reports use a random link and expire after 30 days. The server stores the report until it expires. Do not enter passwords, private page text, or analytics payloads.</p><h2>Payments</h2><p>Sociobot and Dodo handle checkout, payment details, license checks, and refunds. This product does not receive card details.</p><h2>Your choices</h2><p>Clear this site’s browser storage to remove a local audit. A shared report expires automatically.</p>`;
  const terms = `<p class="lede">Use this tool to record honest task observations.</p><h2>What the tool provides</h2><p>The tool structures screen-reader task evidence and creates reports. It does not certify accessibility or provide legal advice.</p><h2>Your responsibilities</h2><p>Get the tester’s consent. Do not record passwords, secret data, private page text, or analytics payloads.</p><h2>Paid license</h2><p>Team sharing is a one-time $39 purchase. Sociobot and Dodo are the merchant of record. Their checkout handles refunds. A refund revokes the license.</p><h2>Availability</h2><p>The free local audit works without an account. Shared links may be removed for abuse or security needs.</p><h2>Warranty</h2><p>The software is provided as is under the MIT License.</p>`;
  const title = kind === 'privacy' ? 'Privacy for your task evidence' : 'Terms for using this audit';
  return shell(`<main id="main" class="page narrow"><p class="eyebrow">${kind === 'privacy' ? 'Privacy' : 'Terms'}</p><h1 id="page-title" tabindex="-1">${title}</h1>${kind === 'privacy' ? privacy : terms}<p>Last updated: 28 August 2026.</p></main>`);
}

function notFound(): string {
  return shell(`<main id="main" class="page narrow"><p class="eyebrow">404 · Missing slip</p><h1 id="page-title" tabindex="-1">This audit page is not here</h1><p>The link may be incomplete or expired.</p><a class="button primary" href="/" data-link>Return home</a></main>`);
}

async function sharedReport(id: string): Promise<string> {
  try {
    const response = await fetch(`/api/reports/${encodeURIComponent(id)}`);
    if (!response.ok) return notFound();
    const data = await response.json() as ReturnType<typeof reportData>;
    const tasks = data.tasks.map((task,index) => `<article class="report-task"><p class="stamp">Priority ${index+1} · ${escapeHtml(task.severity)}</p><h2>${escapeHtml(task.title)}</h2><p><strong>Result:</strong> ${escapeHtml(task.outcome)}</p><dl><dt>Goal</dt><dd>${escapeHtml(task.goal||'Not recorded')}</dd><dt>Announcements</dt><dd>${escapeHtml(task.announced||'Not recorded')}</dd><dt>Focus</dt><dd>${escapeHtml(task.focus||'Not recorded')}</dd><dt>Blocker</dt><dd>${escapeHtml(task.blocker||'None recorded')}</dd></dl></article>`).join('');
    return shell(`<main id="main" class="page shared-report"><p class="eyebrow">Shared task evidence</p><h1 id="page-title" tabindex="-1">${escapeHtml(data.audit)}</h1><p class="lede">${escapeHtml(data.product)} · ${escapeHtml(data.environment)}</p><div class="notice">This private report expires 30 days after it was shared.</div>${tasks}</main>`);
  } catch { return shell(`<main id="main" class="page narrow"><p class="eyebrow">Connection error</p><h1 id="page-title" tabindex="-1">The shared report did not load</h1><p>Check your connection, then reload this page.</p></main>`); }
}

function titleFor(path: string): string {
  if (path === '/') return 'Screenreader Task Audit — record task blockers';
  if (path === '/privacy') return 'Privacy — Screenreader Task Audit';
  if (path === '/terms') return 'Terms — Screenreader Task Audit';
  if (path.includes('report')) return 'Report — Screenreader Task Audit';
  if (path === '/demo') return 'Demo — Screenreader Task Audit';
  if (path === '/audit') return 'My audit — Screenreader Task Audit';
  return 'Page not found — Screenreader Task Audit';
}

async function render(focus = false): Promise<void> {
  const path = location.pathname.replace(/\/$/, '') || '/';
  document.title = titleFor(path);
  document.querySelector<HTMLLinkElement>('link[rel=canonical]')!.href = `https://screenreader-task-audit.sociobot.in${path}`;
  if (path === '/') app.innerHTML = landing();
  else if (path === '/privacy') app.innerHTML = legalPage('privacy');
  else if (path === '/terms') app.innerHTML = legalPage('terms');
  else if (path === '/audit') { demoMode = false; audit = loadAudit(false); app.innerHTML = audit.consent ? workspace() : setupPage(); }
  else if (path === '/demo') { demoMode = true; audit = loadAudit(true); activeTaskId ||= audit.tasks[0]?.id || ''; app.innerHTML = workspace(); }
  else if (path === '/report') { demoMode = false; audit = loadAudit(false); app.innerHTML = reportPage(); }
  else if (path === '/demo/report') { demoMode = true; audit = loadAudit(true); app.innerHTML = reportPage(); }
  else if (path.startsWith('/share/')) app.innerHTML = await sharedReport(path.slice(7));
  else app.innerHTML = notFound();
  bindEvents(); updateNetworkState();
  if (focus) { const heading = document.querySelector<HTMLElement>('h1'); heading?.focus(); document.querySelector('#route-status')!.textContent = heading?.textContent || ''; window.scrollTo(0,0); }
}

function navigate(path: string): void { history.pushState({}, '', path); void render(true); }

function bindEvents(): void {
  app.querySelectorAll<HTMLAnchorElement>('a[data-link]').forEach(link => link.addEventListener('click', event => {
    if (event.ctrlKey || event.metaKey || event.shiftKey || event.altKey) return;
    event.preventDefault(); navigate(link.pathname);
  }));
  document.querySelector('#reset-demo')?.addEventListener('click', () => { audit = resetAudit(true); activeTaskId = audit.tasks[0].id; message = 'Demo reset to its original sample.'; void render(); });
  document.querySelector('#license-form')?.addEventListener('submit', licenseSubmit);
  document.querySelector('#report-license-form')?.addEventListener('submit', licenseSubmit);
  const setup = document.querySelector<HTMLFormElement>('#setup-form');
  setup?.addEventListener('submit', event => {
    event.preventDefault();
    if (!setup.checkValidity()) { document.querySelector('#setup-error')!.textContent = 'Fill every field and confirm the tester’s consent.'; setup.reportValidity(); return; }
    const data = new FormData(setup); audit.name=String(data.get('name'));audit.product=String(data.get('product'));audit.assistiveTech=String(data.get('assistiveTech'));audit.browser=String(data.get('browser'));audit.consent=true;
    if (!audit.tasks.length) { const task=blankTask('First critical task');audit.tasks.push(task);activeTaskId=task.id; }
    saveAudit(audit,false);message='Audit created. Add observations for the first task.';void render(true);
  });
  document.querySelector('#edit-setup')?.addEventListener('click', () => { audit.consent=false;saveAudit(audit,demoMode);void render(true); });
  document.querySelectorAll<HTMLButtonElement>('[data-task]').forEach(button => button.addEventListener('click', () => { activeTaskId=button.dataset.task!;traceOpen=false;void render(); }));
  document.querySelector('#add-task')?.addEventListener('click', addTask);
  document.querySelector('#add-task-empty')?.addEventListener('click', addTask);
  const taskForm=document.querySelector<HTMLFormElement>('#task-form');
  taskForm?.addEventListener('input', () => saveTaskForm(taskForm));
  taskForm?.addEventListener('change', () => saveTaskForm(taskForm));
  document.querySelector('#toggle-trace')?.addEventListener('click', () => { traceOpen=!traceOpen;void render(); });
  document.querySelector<HTMLFormElement>('#trace-form')?.addEventListener('submit', event => {
    event.preventDefault();const form=event.currentTarget as HTMLFormElement; if(!form.checkValidity()){form.reportValidity();return;}const data=new FormData(form);const task=audit.tasks.find(item=>item.id===activeTaskId)!;task.trace.push({id:crypto.randomUUID(),time:String(data.get('time')),kind:String(data.get('kind')) as 'focus',target:String(data.get('target')),observed:String(data.get('observed'))});saveAudit(audit,demoMode);traceOpen=false;message='Trace event recorded.';void render();
  });
  document.querySelector('#delete-task')?.addEventListener('click', () => { const task=audit.tasks.find(item=>item.id===activeTaskId);if(!task||!confirm(`Delete “${task.title||'Untitled task'}”?`))return;audit.tasks=audit.tasks.filter(item=>item.id!==activeTaskId);activeTaskId=audit.tasks[0]?.id||'';saveAudit(audit,demoMode);message='Task deleted.';void render(); });
  document.querySelector('#export-json')?.addEventListener('click', () => { downloadJson(audit, Boolean(document.querySelector<HTMLInputElement>('#anonymous')?.checked)); setReportMessage('JSON report exported.'); });
  document.querySelector('#export-html')?.addEventListener('click', () => { downloadHtml(audit, Boolean(document.querySelector<HTMLInputElement>('#anonymous')?.checked)); setReportMessage('Accessible HTML report exported.'); });
  document.querySelector('#share-report')?.addEventListener('click', () => void shareReport());
}

function addTask(): void {
  if(audit.tasks.length>=5){message='This audit already has five tasks.';void render();return;}
  const task=blankTask(`Task ${audit.tasks.length+1}`);audit.tasks.push(task);activeTaskId=task.id;saveAudit(audit,demoMode);message='Task added. Changes save as you type.';void render();
}

function saveTaskForm(form: HTMLFormElement): void {
  const task=audit.tasks.find(item=>item.id===activeTaskId);if(!task)return;const data=new FormData(form);
  task.title=String(data.get('title')||'');task.goal=String(data.get('goal')||'');task.start=String(data.get('start')||'');task.outcome=String(data.get('outcome')||'not-tested') as Outcome;task.severity=String(data.get('severity')||'medium') as Severity;task.expected=String(data.get('expected')||'');task.announced=String(data.get('announced')||'');task.focus=String(data.get('focus')||'');task.blocker=String(data.get('blocker')||'');task.notes=String(data.get('notes')||'');saveAudit(audit,demoMode);
  const status=document.querySelector('#save-status');if(status)status.textContent='Saved in this browser.';
}

async function licenseSubmit(event: Event): Promise<void> {
  event.preventDefault();const form=event.currentTarget as HTMLFormElement;const token=String(new FormData(form).get('license')||'').trim();if(!token){message='Paste a license before verifying it.';void render();return;}localStorage.setItem(LICENSE_KEY,token);message='Checking the license…';void render();await verifyLicense(token,true);
}

function setReportMessage(value:string):void { const status=document.querySelector('#report-status');if(status)status.textContent=value; }

async function shareReport():Promise<void> {
  setReportMessage('Creating the private link…');
  try { const anonymous=Boolean(document.querySelector<HTMLInputElement>('#anonymous')?.checked);const token=localStorage.getItem(LICENSE_KEY)||'';const response=await fetch('/api/reports',{method:'POST',headers:{'content-type':'application/json','authorization':`Bearer ${token}`},body:JSON.stringify(reportData(audit,anonymous))});if(!response.ok){const problem=await response.json().catch(()=>({error:''})) as {error?:string};throw new Error(problem.error||'The private link could not be created.');}const result=await response.json() as {id:string};const url=`${location.origin}/share/${result.id}`;try { await navigator.clipboard?.writeText(url); setReportMessage(`Private link created and copied: ${url}`); } catch { setReportMessage(`Private link created: ${url}`); } }
  catch (error) { setReportMessage(`${error instanceof Error ? error.message : 'The private link could not be created.'} Check your connection or license, then try again.`); }
}

function updateNetworkState():void { document.querySelector('#offline')?.classList.toggle('visible',!navigator.onLine); }

window.addEventListener('popstate',()=>void render(true));
window.addEventListener('online',updateNetworkState);window.addEventListener('offline',updateNetworkState);
if('serviceWorker' in navigator) window.addEventListener('load',()=>navigator.serviceWorker.register('/service-worker.js').catch(()=>undefined));
takeLicenseFromUrl();void verifyLicense();void render();
