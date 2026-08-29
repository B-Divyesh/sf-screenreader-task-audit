import { execFileSync } from 'node:child_process';
import { chmodSync, mkdtempSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { afterEach, describe, expect, it } from 'vitest';

const candidateSha = '0123456789abcdef0123456789abcdef01234567';
const candidateImage = 'sociobotregistry.azurecr.io/sf-screenreader-task-audit:0123456789ab';
const createdDirectories: string[] = [];

function executable(path: string, source: string): void {
  writeFileSync(path, source, { mode: 0o755 });
  chmodSync(path, 0o755);
}

function appFixture(maxReplicas: number, mounted = true): Record<string, unknown> {
  return {
    properties: {
      template: {
        scale: { minReplicas: 1, maxReplicas },
        volumes: mounted ? [{
          name: 'audit-data',
          storageName: 'screenreader-task-audit-data',
          storageType: 'AzureFile',
          mountOptions: 'uid=10001,gid=10001,file_mode=0770,dir_mode=0770'
        }] : [],
        containers: [{
          name: 'app', image: candidateImage,
          volumeMounts: mounted ? [{ volumeName: 'audit-data', mountPath: '/app/data' }] : []
        }]
      }
    }
  };
}

function revisionFixture(): Record<string, unknown>[] {
  return [{
    properties: {
      active: true,
      provisioningState: 'Provisioned',
      runningState: 'Running',
      healthState: 'Healthy',
      replicas: 1,
      trafficWeight: 100,
      template: { containers: [{ name: 'app', image: candidateImage }] }
    }
  }];
}

function verifyTopology(app: Record<string, unknown>, revisions = revisionFixture()): { status: number; output: string } {
  const dir = mkdtempSync(join(tmpdir(), 'screenreader-task-audit-topology-'));
  createdDirectories.push(dir);
  // The shell verifier reads the source contract from the checkout, so this
  // fixture supplies Azure responses while retaining that real contract.
  writeFileSync(join(dir, 'app.json'), JSON.stringify(app));
  writeFileSync(join(dir, 'revisions.json'), JSON.stringify(revisions));
  writeFileSync(join(dir, 'health.json'), JSON.stringify({ status: 'ok', build_sha: candidateSha }));
  executable(join(dir, 'az'), `#!/usr/bin/env sh\nset -eu\ncase "$*" in\n  *"revision list"*) cat "$TOPOLOGY_FIXTURES/revisions.json" ;;\n  *"containerapp show"*) cat "$TOPOLOGY_FIXTURES/app.json" ;;\n  *) exit 2 ;;\nesac\n`);
  executable(join(dir, 'curl'), '#!/usr/bin/env sh\nset -eu\ncat "$TOPOLOGY_FIXTURES/health.json"\n');
  // Keep fake commands in one directory; the real Python interpreter remains
  // on PATH so the production verifier logic is what is exercised.
  executable(join(dir, 'run'), '#!/usr/bin/env sh\nexec "$@"\n');
  const script = join(process.cwd(), 'scripts', 'verify-live-deployment.sh');
  try {
    const output = execFileSync('sh', [script], {
      cwd: process.cwd(),
      encoding: 'utf8',
      env: {
        ...process.env,
        PATH: `${dir}:${process.env.PATH}`,
        TOPOLOGY_FIXTURES: dir,
        EXPECTED_BUILD_SHA: candidateSha,
        LIVE_BASE_URL: 'https://example.test'
      },
      stdio: ['ignore', 'pipe', 'pipe']
    });
    return { status: 0, output };
  } catch (error) {
    const result = error as { status?: number; stdout?: Buffer; stderr?: Buffer };
    return { status: result.status ?? 1, output: `${result.stdout?.toString() ?? ''}${result.stderr?.toString() ?? ''}` };
  }
}

afterEach(() => {
  for (const dir of createdDirectories.splice(0)) rmSync(dir, { recursive: true, force: true });
});

describe('live SQLite deployment topology', () => {
  it('reproduces the release-blocking maxReplicas=3 failure', () => {
    const result = verifyTopology(appFixture(3));
    expect(result.status).not.toBe(0);
    expect(result.output).toContain('expected exactly one replica, got min=1 max=3');
  });

  it('accepts only one ready revision of the exact candidate image with the durable mount', () => {
    const result = verifyTopology(appFixture(1));
    expect(result.status).toBe(0);
    expect(result.output).toContain(`image=${candidateImage}`);
    expect(result.output).toContain('one active ready revision');
  });

  it('rejects a one-replica deployment when the durable SQLite mount is absent', () => {
    const result = verifyTopology(appFixture(1, false));
    expect(result.status).not.toBe(0);
    expect(result.output).toContain('expected durable volume');
  });
});
