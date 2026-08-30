import { execFileSync } from 'node:child_process';
import { mkdtempSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { afterEach, describe, expect, it } from 'vitest';

const templateScript = join(process.cwd(), 'scripts', 'container-app-template.py');
const image = 'sociobotregistry.azurecr.io/sf-screenreader-task-audit:0123456789ab';
const createdDirectories: string[] = [];

function generate(contract = join(process.cwd(), '.factory', 'container-scale.json')): Record<string, unknown> {
  return JSON.parse(execFileSync('python3', [
    templateScript,
    '--contract', contract,
    '--image', image,
    '--port', '8080'
  ], { encoding: 'utf8', stdio: ['ignore', 'pipe', 'pipe'] })) as Record<string, unknown>;
}

afterEach(() => {
  for (const dir of createdDirectories.splice(0)) rmSync(dir, { recursive: true, force: true });
});

describe('container deployment template', () => {
  it('turns the checked-in SQLite contract into the exact one-replica durable mount template', () => {
    expect(generate()).toEqual({
      containers: [{
        name: 'app',
        image,
        resources: { cpu: 0.5, memory: '1Gi' },
        env: [{ name: 'PORT', value: '8080' }],
        volumeMounts: [{ volumeName: 'audit-data', mountPath: '/app/data' }]
      }],
      scale: { minReplicas: 1, maxReplicas: 1 },
      volumes: [{
        name: 'audit-data',
        storageName: 'screenreader-task-audit-data',
        storageType: 'AzureFile',
        mountOptions: 'uid=10001,gid=10001,file_mode=0770,dir_mode=0770'
      }]
    });
  });

  it('rejects the release-blocking missing durable-volume shape', () => {
    const dir = mkdtempSync(join(tmpdir(), 'screenreader-task-audit-contract-'));
    createdDirectories.push(dir);
    const contract = join(dir, 'container-scale.json');
    writeFileSync(contract, JSON.stringify({ minReplicas: 1, maxReplicas: 3 }));
    expect(() => generate(contract)).toThrow(/persistentVolume must be an object/);
  });
});
