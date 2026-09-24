import assert from 'node:assert/strict';
import test from 'node:test';
import {
  createTestClock,
  createTestIdentityFixture,
  createTestBackendFixture,
  createPlaywrightArtifactManager,
  createTestApiFixture,
} from './fixtures/index.mjs';

test('Clock fixture provides deterministic time progression', () => {
  const clock = createTestClock(new Date('2026-09-24T12:00:00Z'));
  assert.equal(clock.iso(), '2026-09-24T12:00:00.000Z');

  clock.advanceMinutes(5);
  assert.equal(clock.iso(), '2026-09-24T12:05:00.000Z');

  clock.advanceHours(24);
  assert.equal(clock.iso(), '2026-09-25T12:05:00.000Z');
});

test('Identity fixture correctly models role capabilities and generates valid tokens', () => {
  const identity = createTestIdentityFixture();

  assert.equal(identity.hasCapability('owner', 'workspace.admin'), true);
  assert.equal(identity.hasCapability('developer', 'agent.run'), true);
  assert.equal(identity.hasCapability('developer', 'workspace.admin'), false);
  assert.equal(identity.hasCapability('viewer', 'process.execute'), false);
  assert.equal(identity.hasCapability('viewer', 'workspace.read'), true);

  const token = identity.generateToken('developer');
  assert.ok(typeof token === 'string');
  const parts = token.split('.');
  assert.equal(parts.length, 3);

  const payload = JSON.parse(Buffer.from(parts[1], 'base64url').toString('utf8'));
  assert.equal(payload.role, 'Developer');
  assert.equal(payload.sub, 'usr-developer-001');
  assert.ok(payload.capabilities.includes('agent.run'));
});

test('Backend fixture deterministically simulates agent run and diff proposal', () => {
  const backend = createTestBackendFixture();
  const events = [];
  const unsubscribe = backend.onEvent((e) => events.push(e.type));

  const run = backend.startRun({
    runId: 'run-001',
    taskId: 'TASK-1024',
    workspaceId: 'ws-fixture-main',
    actorId: 'usr-dev-001',
    prompt: 'Fix login button click handler',
  });
  assert.equal(run.status, 'running');

  backend.proposeToolCall('run-001', { toolName: 'readFile', args: { path: 'src/login.ts' } });
  backend.proposeDiff('run-001', {
    filePath: 'src/login.ts',
    originalContent: 'old code',
    proposedContent: 'new code',
    conflictDetected: false,
  });

  const completed = backend.completeRun('run-001', { status: 'succeeded' });
  assert.equal(completed.status, 'succeeded');
  assert.deepEqual(events, ['run.started', 'tool.proposed', 'diff.proposed', 'run.completed']);
  unsubscribe();
});

test('Playwright fixture enforces artifacts strictly inside root dist/ directory', () => {
  const manager = createPlaywrightArtifactManager(process.cwd());
  const path = manager.getArtifactPath('login-test', 'screenshot.png');

  assert.ok(path.includes('dist'), 'Artifact path must be within dist/');
  assert.ok(path.endsWith('login-test_screenshot.png'));

  const options = manager.getBrowserOptions();
  assert.equal(options.headless, true);
  assert.ok(options.args.includes('--no-sandbox'));
});

test('API fixture spins up an ephemeral HTTP server and handles requests', async (t) => {
  const api = await createTestApiFixture();
  t.after(async () => {
    await api.close();
  });

  const response = await api.get('/api/v1/zetro2/health');
  assert.equal(response.status, 200);
  assert.equal(response.body.application, 'zetro2');
  assert.equal(response.body.status, 'ok');
});
