import assert from 'node:assert/strict';
import { once } from 'node:events';
import test from 'node:test';
import { createApp } from '../src/app.mjs';

test('bootstrap exposes health without enabling unfinished application routes', async (t) => {
  const server = createApp().listen(0, '127.0.0.1');
  t.after(() => new Promise((resolve) => server.close(resolve)));
  await once(server, 'listening');
  const origin = `http://127.0.0.1:${server.address().port}`;
  const response = await fetch(`${origin}/api/v1/zetro2/health`);
  assert.equal(response.status, 200);
  assert.equal((await response.json()).application, 'zetro2');
  assert.equal((await fetch(`${origin}/api/v1/zetro2/tasks`)).status, 404);
});
