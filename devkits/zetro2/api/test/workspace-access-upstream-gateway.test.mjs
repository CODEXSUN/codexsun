import assert from 'node:assert/strict';
import { once } from 'node:events';
import http from 'node:http';
import test from 'node:test';
import { createApp } from '../src/app.mjs';
import { createTestClock } from './fixtures/clock.mjs';
import {
  createAccessModule,
  createSecretsProvider,
  createWorkspaceAccessStore,
  createWorkspaceAccessService,
  createWorkspaceAuthorizationGuard,
  createUpstreamGateway,
} from '../src/modules/workspace-access/index.mjs';

// Helper to spin up a mock upstream HTTP server (simulating OpenVSCode / Zbrowser dev server)
function createMockUpstream() {
  const receivedRequests = [];
  const server = http.createServer((req, res) => {
    let body = '';
    req.on('data', (c) => (body += c));
    req.on('end', () => {
      receivedRequests.push({
        method: req.method,
        url: req.url,
        headers: req.headers,
        body,
      });

      res.writeHead(200, {
        'Content-Type': 'application/json',
        'X-Mock-Upstream': 'active',
      });
      res.end(
        JSON.stringify({
          status: 'ok',
          upstreamReceivedUrl: req.url,
          actorId: req.headers['x-zetro2-actor-id'],
          role: req.headers['x-zetro2-role'],
          readonly: req.headers['x-zetro2-readonly'],
        })
      );
    });
  });

  return { server, receivedRequests };
}

test('Task 1.7: Upstream gateway routes editor and preview entry points with server-verified headers', async (t) => {
  // 1. Start mock private upstreams
  const mockEditor = createMockUpstream();
  const mockPreview = createMockUpstream();

  mockEditor.server.listen(0, '127.0.0.1');
  mockPreview.server.listen(0, '127.0.0.1');

  t.after(() => new Promise((resolve) => mockEditor.server.close(resolve)));
  t.after(() => new Promise((resolve) => mockPreview.server.close(resolve)));

  await Promise.all([
    once(mockEditor.server, 'listening'),
    once(mockPreview.server, 'listening'),
  ]);

  const editorUpstreamUrl = `http://127.0.0.1:${mockEditor.server.address().port}`;
  const previewUpstreamUrl = `http://127.0.0.1:${mockPreview.server.address().port}`;

  // 2. Initialize Zetro2 environment
  const clock = createTestClock(new Date('2026-09-24T12:00:00Z'));
  const secrets = createSecretsProvider({
    ZETRO2_JWT_SECRET: 'test-upstream-gateway-secret-key-12345',
  });
  const accessModule = createAccessModule({
    env: { ZETRO2_JWT_SECRET: 'test-upstream-gateway-secret-key-12345' },
    clock,
  });
  const store = await createWorkspaceAccessStore({
    sqliteFilename: ':memory:',
    secretsProvider: secrets,
  });
  t.after(() => store.close());

  const service = createWorkspaceAccessService({
    store,
    accessModule,
    clock,
  });
  const guard = createWorkspaceAuthorizationGuard({ service, store, accessModule });
  const gateway = createUpstreamGateway({
    guard,
    service,
    editorUpstreamUrl,
    previewUpstreamUrl,
  });

  // 3. Start Zetro2 Gateway App
  const appServer = createApp({
    accessService: service,
    guard,
    gateway,
    editorUpstreamUrl,
    previewUpstreamUrl,
  }).listen(0, '127.0.0.1');
  t.after(() => new Promise((resolve) => appServer.close(resolve)));
  await once(appServer, 'listening');

  const origin = `http://127.0.0.1:${appServer.address().port}`;

  // 4. Setup memberships: Admin creates workspace; Developer Dev; Viewer View
  const adminLogin = await service.login({ userId: 'usr-admin' });
  const { workspace: testWs } = await service.createWorkspace({
    actorId: 'usr-admin',
    slug: 'gateway-ws',
    name: 'Gateway Workspace',
    rootPath: 'storage/apps/private/zetro2/workspaces/gateway-ws',
  });

  await service.addMember({
    actorId: 'usr-admin',
    workspaceId: testWs.id,
    targetUserId: 'usr-dev',
    role: 'Developer',
  });

  await service.addMember({
    actorId: 'usr-admin',
    workspaceId: testWs.id,
    targetUserId: 'usr-viewer',
    role: 'Viewer',
  });

  const devLogin = await service.login({ userId: 'usr-dev', workspaceId: testWs.id });
  const viewerLogin = await service.login({ userId: 'usr-viewer', workspaceId: testWs.id });
  const outsiderLogin = await service.login({ userId: 'usr-outsider' });

  // 5. Test unauthenticated request to editor gateway -> 401
  const unauthRes = await fetch(`${origin}/api/v1/zetro2/gateways/editor/${testWs.id}/workbench`);
  assert.equal(unauthRes.status, 401);
  assert.equal(mockEditor.receivedRequests.length, 0);

  // 6. Test outsider (non-member) request -> 403 Forbidden
  const outsiderRes = await fetch(
    `${origin}/api/v1/zetro2/gateways/editor/${testWs.id}/workbench`,
    {
      headers: { Authorization: `Bearer ${outsiderLogin.token}` },
    }
  );
  assert.equal(outsiderRes.status, 403);
  assert.equal(mockEditor.receivedRequests.length, 0);

  // 7. Developer accesses editor gateway -> 200 forwarded with verified headers & readonly=false
  // Also pass forged client header to verify it gets stripped
  const devRes = await fetch(`${origin}/api/v1/zetro2/gateways/editor/${testWs.id}/workbench`, {
    headers: {
      Authorization: `Bearer ${devLogin.token}`,
      'x-zetro2-role': 'Owner', // Forgery attempt
    },
  });
  assert.equal(devRes.status, 200);
  const devData = await devRes.json();
  assert.equal(devData.actorId, 'usr-dev');
  assert.equal(devData.role, 'Developer'); // Server enforced, forgery discarded
  assert.equal(devData.readonly, 'false');
  assert.equal(mockEditor.receivedRequests.length, 1);

  // 8. Viewer accesses editor gateway -> 200 forwarded with readonly=true
  const viewerRes = await fetch(`${origin}/api/v1/zetro2/gateways/editor/${testWs.id}/workbench`, {
    headers: { Authorization: `Bearer ${viewerLogin.token}` },
  });
  assert.equal(viewerRes.status, 200);
  const viewerData = await viewerRes.json();
  assert.equal(viewerData.actorId, 'usr-viewer');
  assert.equal(viewerData.role, 'Viewer');
  assert.equal(viewerData.readonly, 'true'); // Read-only mount flag enforced
  assert.equal(mockEditor.receivedRequests.length, 2);

  // 9. Query param token (?token=...) works for iframe/browser loads
  const queryTokenRes = await fetch(
    `${origin}/api/v1/zetro2/gateways/editor/${testWs.id}/workbench?token=${encodeURIComponent(
      devLogin.token
    )}`
  );
  assert.equal(queryTokenRes.status, 200);
  const queryData = await queryTokenRes.json();
  assert.equal(queryData.actorId, 'usr-dev');

  // 10. Preview gateway route: Developer accesses preview
  const previewRes = await fetch(
    `${origin}/api/v1/zetro2/gateways/preview/${testWs.id}/dist/index.html`,
    {
      headers: { Authorization: `Bearer ${devLogin.token}` },
    }
  );
  assert.equal(previewRes.status, 200);
  const previewData = await previewRes.json();
  assert.equal(previewData.actorId, 'usr-dev');
  assert.equal(previewData.role, 'Developer');
  assert.equal(mockPreview.receivedRequests.length, 1);

  // 11. Upstream offline returns 502 Bad Gateway
  await new Promise((resolve) => mockEditor.server.close(resolve));
  const offlineRes = await fetch(
    `${origin}/api/v1/zetro2/gateways/editor/${testWs.id}/workbench`,
    {
      headers: { Authorization: `Bearer ${devLogin.token}` },
    }
  );
  assert.equal(offlineRes.status, 502);
});
