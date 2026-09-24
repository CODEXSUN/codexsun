import assert from 'node:assert/strict';
import { mkdirSync, mkdtempSync, rmSync, writeFileSync } from 'node:fs';
import { resolve, join } from 'node:path';
import test from 'node:test';
import { configuredPort } from './runtime-ports.mjs';

test('port badges use app overrides, shared config and registry defaults without exposing other values', (t) => {
  const temporary = resolve(import.meta.dirname, '../../../../storage/runtime');
  mkdirSync(temporary, { recursive: true });
  const root = mkdtempSync(join(temporary, 'port-badges-'));
  t.after(() => rmSync(root, { recursive: true, force: true }));
  mkdirSync(join(root, 'apps/sample/api'), { recursive: true });
  const host = { environmentDirectory: 'api', envKey: 'SAMPLE_API_PORT', defaultPort: 6300 };
  assert.equal(configuredPort(root, 'apps/sample', host), 6300);
  writeFileSync(join(root, '.env'), 'SAMPLE_API_PORT=6301\nSECRET=hidden\n');
  assert.equal(configuredPort(root, 'apps/sample', host), 6301);
  writeFileSync(join(root, 'apps/sample/api/.app.env'), 'SAMPLE_API_PORT="6302"\n');
  assert.equal(configuredPort(root, 'apps/sample', host), 6302);
  writeFileSync(join(root, 'apps/sample/api/.app.env'), 'SAMPLE_API_PORT=invalid\n');
  assert.equal(configuredPort(root, 'apps/sample', host), null);
  assert.equal(configuredPort(root, 'apps/sample', undefined), null);
});
