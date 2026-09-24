import assert from 'node:assert/strict';
import { resolve } from 'node:path';
import test from 'node:test';
import { loadPreviewCatalog, reservedPreviewPort } from './catalog.mjs';
import { PreviewError, PreviewRunner } from './runner.mjs';

const root = resolve(import.meta.dirname, '../../../..');

test('preview reservations remain stable regardless of lookup order and reject unreserved apps', () => {
  const expected = { crm: 6140, himsx: 6141, lms: 6142, qcafe: 6143, sites: 6144, docx: 6145, orship: 6146, zetro: 6147, zuno: 6148, uiux: 6133 };
  for (const [id, port] of Object.entries(expected).reverse()) assert.equal(reservedPreviewPort(id), port);
  assert.throws(() => reservedPreviewPort('aaa-new-app'), /Reserve a Zbrowser port/u);
  assert.equal(reservedPreviewPort('crm'), 6140);
});

test('registry previews are grouped by owner and have unique ports', async () => {
  const targets = await loadPreviewCatalog(root);
  assert.deepEqual(
    targets.filter((target) => target.group === 'apps').map((target) => target.id),
    ['crm', 'himsx', 'lms', 'qcafe', 'sites'],
  );
  assert.deepEqual(
    targets.filter((target) => target.group === 'devkits').map((target) => target.id),
    ['cxforge', 'docx', 'orship', 'uiux', 'zetro', 'zetro2', 'zuno'],
  );
  assert.equal(targets.find((target) => target.id === 'uiux').port, 6133);
  assert.equal(targets.find((target) => target.id === 'zetro2').port, 6155);
  assert.equal(targets.find((target) => target.id === 'zetro2').workspace, '@codexsun/zetro2-web');
  assert.equal(targets.find((target) => target.id === 'cxforge').port, null);
  const ports = targets.map((target) => target.port).filter(Boolean);
  assert.equal(new Set(ports).size, ports.length);
});

test('Zetro2 has an independent public port and cannot collide with other previews', async () => {
  const publicPorts = Array.from({ length: 9 }, (_, index) => 6240 + index);
  const targets = await loadPreviewCatalog(root, 6233, publicPorts, 6255);
  const target = targets.find((item) => item.id === 'zetro2');
  assert.equal(target.port, 6155);
  assert.equal(target.publicPort, 6255);
  await assert.rejects(loadPreviewCatalog(root, 6233, publicPorts, 6240), /unique/);
  await assert.rejects(loadPreviewCatalog(root, 6155), /reserved/);
});

test('profile preview ports are exposed without changing internal Vite ports', async () => {
  const publicPorts = Array.from({ length: 9 }, (_, index) => 6240 + index);
  const targets = await loadPreviewCatalog(root, 6233, publicPorts);
  const crm = targets.find((target) => target.id === 'crm');
  const uiux = targets.find((target) => target.id === 'uiux');
  assert.equal(crm.port, 6140);
  assert.equal(crm.publicPort, 6240);
  assert.equal(uiux.port, 6233);
  assert.equal(uiux.publicPort, 6233);
  const runner = new PreviewRunner(root, targets);
  const statuses = await runner.statuses();
  assert.equal(statuses.find((target) => target.id === 'crm').port, 6240);
  const crmStatus = statuses.find((target) => target.id === 'crm');
  assert.equal(crmStatus.zbrowserPort, 6240);
  assert.equal(crmStatus.apiPort, crm.apiPort);
  assert.equal(crmStatus.webPort, crm.webPort);
  assert.ok(crmStatus.apiPort > 0);
  assert.ok(crmStatus.webPort > 0);
  await assert.rejects(loadPreviewCatalog(root, 6233, publicPorts.map(() => 6240)), /unique/u);
});

test('preview runner rejects unknown and API-only applications', async () => {
  const targets = await loadPreviewCatalog(root);
  const runner = new PreviewRunner(root, targets);
  assert.throws(() => runner.start('unknown'), (error) => error instanceof PreviewError && error.status === 404);
  assert.throws(() => runner.start('cxforge'), (error) => error instanceof PreviewError && error.status === 409);
  assert.throws(() => runner.stop('../crm'), (error) => error instanceof PreviewError && error.status === 404);
});
