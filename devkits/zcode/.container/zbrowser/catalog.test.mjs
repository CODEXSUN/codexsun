import assert from 'node:assert/strict';
import { resolve } from 'node:path';
import test from 'node:test';
import { loadPreviewCatalog } from './catalog.mjs';
import { PreviewError, PreviewRunner } from './runner.mjs';

const root = resolve(import.meta.dirname, '../../../..');

test('registry previews are grouped by owner and have unique ports', async () => {
  const targets = await loadPreviewCatalog(root);
  assert.deepEqual(
    targets.filter((target) => target.group === 'apps').map((target) => target.id),
    ['crm', 'himsx', 'lms', 'qcafe', 'sites'],
  );
  assert.deepEqual(
    targets.filter((target) => target.group === 'devkits').map((target) => target.id),
    ['cxforge', 'docx', 'orship', 'uiux', 'zetro', 'zuno'],
  );
  assert.equal(targets.find((target) => target.id === 'uiux').port, 6133);
  assert.equal(targets.find((target) => target.id === 'cxforge').port, null);
  const ports = targets.map((target) => target.port).filter(Boolean);
  assert.equal(new Set(ports).size, ports.length);
});

test('preview runner rejects unknown and API-only applications', async () => {
  const targets = await loadPreviewCatalog(root);
  const runner = new PreviewRunner(root, targets);
  assert.throws(() => runner.start('unknown'), (error) => error instanceof PreviewError && error.status === 404);
  assert.throws(() => runner.start('cxforge'), (error) => error instanceof PreviewError && error.status === 409);
  assert.throws(() => runner.stop('../crm'), (error) => error instanceof PreviewError && error.status === 404);
});
