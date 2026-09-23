import assert from 'node:assert/strict';
import { mkdirSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import test from 'node:test';
import { bootstrapFiles } from './zcode-bootstrap.mjs';

function fixture() {
  const root = mkdtempSync(join(import.meta.dirname, '.bootstrap-test-'));
  const api = join(root, 'apps', 'crm', 'api');
  mkdirSync(api, { recursive: true });
  const rootTemplate = join(root, '.env.example');
  const appTemplate = join(api, '.app.env.example');
  writeFileSync(rootTemplate, 'DB_DRIVER=mariadb\nDB_PASSWORD=replace-with-a-local-password\nPLATFORM_JWT_SECRET=replace-with-a-32-character-minimum-secret\n');
  writeFileSync(appTemplate, 'PLATFORM_JWT_SECRET=change-this-to-a-32-character-minimum-secret\nCRM_API_REFERENCE_TOKEN=change-this-local-token\nADMIN_PASSWORD=change_pass\n');
  return { root, rootTemplate, appTemplate };
}

test('bootstrap creates local env files once with development secrets', (t) => {
  const { root, rootTemplate, appTemplate } = fixture();
  t.after(() => rmSync(root, { recursive: true, force: true }));
  const first = bootstrapFiles(root, [appTemplate, rootTemplate]);
  assert.deepEqual(first.created, ['.env', join('apps', 'crm', 'api', '.app.env')]);
  const rootEnv = readFileSync(join(root, '.env'), 'utf8');
  const appEnv = readFileSync(join(root, 'apps', 'crm', 'api', '.app.env'), 'utf8');
  assert.match(rootEnv, /DB_DRIVER=sqlite/u);
  assert.match(rootEnv, /DB_PASSWORD=\n/u);
  const secret = /^PLATFORM_JWT_SECRET=([a-f0-9]{64})$/mu.exec(rootEnv)?.[1];
  assert.ok(secret);
  assert.match(appEnv, new RegExp(`^PLATFORM_JWT_SECRET=${secret}$`, 'mu'));
  assert.match(appEnv, /^ADMIN_PASSWORD=[a-f0-9]{64}$/mu);
  assert.match(appEnv, /^CRM_API_REFERENCE_TOKEN=[a-f0-9]{64}$/mu);

  const second = bootstrapFiles(root, [rootTemplate, appTemplate]);
  assert.deepEqual(second.created, []);
  assert.equal(second.skipped.length, 2);
  assert.equal(readFileSync(join(root, '.env'), 'utf8'), rootEnv);
  assert.equal(readFileSync(join(root, 'apps', 'crm', 'api', '.app.env'), 'utf8'), appEnv);
});

test('bootstrap preserves an existing env file and rejects paths outside its workspace', (t) => {
  const { root, rootTemplate, appTemplate } = fixture();
  t.after(() => rmSync(root, { recursive: true, force: true }));
  const existing = join(root, '.env');
  writeFileSync(existing, 'DB_DRIVER=mariadb\nPLATFORM_JWT_SECRET=provided-secret\n');
  bootstrapFiles(root, [rootTemplate, appTemplate]);
  assert.equal(readFileSync(existing, 'utf8'), 'DB_DRIVER=mariadb\nPLATFORM_JWT_SECRET=provided-secret\n');
  assert.match(readFileSync(join(root, 'apps', 'crm', 'api', '.app.env'), 'utf8'), /^PLATFORM_JWT_SECRET=provided-secret$/mu);
  assert.throws(() => bootstrapFiles(join(root, 'apps'), [rootTemplate]), /outside the workspace/u);
});

test('paired service keys match across generated env files', (t) => {
  const { root, rootTemplate, appTemplate } = fixture();
  t.after(() => rmSync(root, { recursive: true, force: true }));
  const peer = join(root, 'devkits', 'zetro', 'api');
  mkdirSync(peer, { recursive: true });
  const peerTemplate = join(peer, '.app.env.example');
  writeFileSync(appTemplate, 'ZUNO_ZETRO_CLIENT_KEY=change-this-zetro-client-key-with-32-characters\n');
  writeFileSync(peerTemplate, 'ZETRO_ZUNO_CLIENT_KEY=change-this-zetro-client-key-with-32-characters\n');
  bootstrapFiles(root, [rootTemplate, appTemplate]);
  bootstrapFiles(root, [rootTemplate, appTemplate, peerTemplate]);
  const one = readFileSync(join(root, 'apps', 'crm', 'api', '.app.env'), 'utf8').trim().split('=')[1];
  const two = readFileSync(join(peer, '.app.env'), 'utf8').trim().split('=')[1];
  assert.match(one, /^[a-f0-9]{64}$/u);
  assert.equal(one, two);
});
