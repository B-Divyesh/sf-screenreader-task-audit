import { spawn } from 'node:child_process';
import { createServer } from 'node:http';

const fixturePort = 19090;
const validLicenses = new Set(['team-license-fixture', 'durable-license-fixture']);
const billingFixture = createServer((request, response) => {
  const url = new URL(request.url || '/', `http://127.0.0.1:${fixturePort}`);
  if (request.method !== 'GET' || url.pathname !== '/products/screenreader-task-audit/verify') {
    response.writeHead(404, { 'content-type': 'application/json' });
    response.end('{"error":"not found"}');
    return;
  }
  const valid = validLicenses.has(url.searchParams.get('license') || '');
  response.writeHead(200, { 'content-type': 'application/json' });
  response.end(JSON.stringify({ valid, reason: valid ? 'ok' : 'invalid' }));
});

await new Promise((resolve, reject) => {
  billingFixture.once('error', reject);
  billingFixture.listen(fixturePort, '127.0.0.1', resolve);
});

const backend = spawn('cargo', ['run'], {
  cwd: process.cwd(),
  env: {
    ...process.env,
    SOCIOBOT_API_BASE: `http://127.0.0.1:${fixturePort}`
  },
  stdio: 'inherit'
});

const stop = (signal) => {
  if (!backend.killed) backend.kill(signal);
  billingFixture.close(() => process.exit(0));
};

process.on('SIGINT', () => stop('SIGINT'));
process.on('SIGTERM', () => stop('SIGTERM'));
backend.once('exit', (code, signal) => {
  billingFixture.close(() => process.exit(code ?? (signal ? 1 : 0)));
});
