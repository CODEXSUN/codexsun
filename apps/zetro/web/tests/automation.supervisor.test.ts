import assert from 'node:assert/strict'
import test from 'node:test'
import { createAutomationSupervisorPrompt } from '../src/modules/automation/automation.supervisor.js'
import { groupAutomationScripts } from '../src/modules/automation/automation.scripts.js'
import {
  isLiveRun,
  runDuration,
  runEvidence,
  runActivityState,
  runTitle,
  runTimeline,
  runReport,
  runSummary,
} from '../src/modules/automation/automation.run-model.js'
import { taskResponseSchema } from '../src/modules/system-tasks/system-tasks.schema.js'

test('timeline projects observed tool changes, skips unchanged snapshots, and keeps response separate', () => {
  const tool = { itemId: 'tool-1', kind: 'command', label: 'npm run typecheck', status: 'running' }
  const step = (id: string, activities: unknown[], response = '') => ({
    id,
    taskId: 'run',
    completedAt: '2026-09-10T00:00:10Z',
    status: 'info' as const,
    message: `zetro.progress.v1:${JSON.stringify({ activities, response })}`,
  })
  const timeline = runTimeline([
    step('a', [tool]),
    step('b', [tool]),
    step('c', [{ ...tool, status: 'completed' }], 'Actual answer'),
    step('d', [{ ...tool, status: 'completed' }], 'Actual answer'),
  ])
  assert.equal(timeline.length, 3)
  assert.equal(timeline[0]?.status, 'running')
  assert.equal(timeline[1]?.status, 'completed')
  assert.match(timeline[0]!.message, /npm run typecheck/)
  assert.match(timeline[2]!.message, /13 characters/)
  assert.doesNotMatch(JSON.stringify(timeline), /Actual answer|zetro.progress.v1/)
})

test('run identity and execution report distinguish repeated prompts without claiming release approval', () => {
  const task = taskResponseSchema.parse({
    task: {
      id: '12345678-run',
      title: 'Supervisor: repeated instructions',
      type: 'supervisor.agent-turn',
      attempts: 1,
      maxAttempts: 1,
      recoveryCount: 0,
      projectId: 'project',
      status: 'completed',
      error: null,
      createdAt: '2026-09-10T00:00:00Z',
      updatedAt: '2026-09-10T00:01:00Z',
      startedAt: '2026-09-10T00:00:00Z',
      completedAt: '2026-09-10T00:01:00Z',
      input: {
        prompt: 'Instruction only',
        workflow: 'review',
        scope: { application: 'platform', module: 'identity' },
      },
      result: { message: { content: 'Actual answer' } },
    },
  }).task
  assert.equal(runTitle(task), 'review · platform / identity · 12345678')
  assert.notEqual(runTitle(task), runTitle({ ...task, id: '87654321-run' }))
  assert.match(runSummary(task), /not release approval/)
  assert.doesNotMatch(runSummary(task), /Actual answer/)
  assert.equal(runReport({ ...task, steps: [] }).split('Actual answer').length, 2)
  assert.match(runReport({ ...task, steps: [] }), /Tool telemetry is unavailable/)
})

test('animates only observed active execution, not queued, stale, or terminal runs', () => {
  assert.deepEqual(runActivityState({ status: 'running' }, true), {
    active: true,
    label: 'Execution in progress',
  })
  assert.equal(runActivityState({ status: 'running' }, false).active, false)
  assert.equal(runActivityState({ status: 'pending' }, true).active, false)
  assert.equal(runActivityState({ status: 'stopping' }, true).active, true)
  for (const status of ['completed', 'failed', 'blocked', 'stopped'] as const)
    assert.equal(runActivityState({ status }, true).active, false)
})

test('classifies stopping as live and terminal states as history', () => {
  for (const status of ['pending', 'running', 'stopping'] as const)
    assert.equal(isLiveRun({ status }), true)
  for (const status of ['completed', 'failed', 'blocked', 'stopped'] as const)
    assert.equal(isLiveRun({ status }), false)
})

test('retains instructions and reads recorded reports without inventing metrics', () => {
  const task = taskResponseSchema.parse({
    task: {
      attempts: 1,
      completedAt: '2026-09-10T00:01:10Z',
      createdAt: '2026-09-10T00:00:00Z',
      error: null,
      id: 'test-run',
      maxAttempts: 1,
      projectId: 'project',
      recoveryCount: 0,
      input: { prompt: 'Review only', secret: 'must not appear in the projection' },
      result: {
        message: { content: 'Review report' },
        execution: {
          activities: [{ kind: 'command', label: 'npm run test', status: 'completed' }],
        },
      },
      startedAt: '2026-09-10T00:00:00Z',
      status: 'completed',
      title: 'Review',
      type: 'supervisor.agent-turn',
      updatedAt: '2026-09-10T00:01:10Z',
    },
  }).task
  assert.equal(runDuration(task), '1m 10s')
  assert.equal(runEvidence(task).instruction, 'Review only')
  assert.equal(runEvidence(task).response, 'Review report')
  assert.equal(runEvidence(task).activities.length, 1)
  assert.equal(runEvidence(task).model, undefined)
  assert.doesNotMatch(JSON.stringify(runEvidence(task)), /must not appear/)
  assert.deepEqual(runEvidence({ ...task, result: null }).activities, [])
  assert.equal(
    runEvidence({ ...task, result: { output: 'script output', exitCode: 0 } }).response,
    'script output',
  )
})

test('groups scripts by deterministic operational nature', () => {
  assert.deepEqual(
    groupAutomationScripts(['test:zetro', 'build', 'check:ui-system', 'clean', 'typecheck']),
    [
      { label: 'Shared UI', scripts: ['check:ui-system'] },
      { label: 'Build', scripts: ['build'] },
      { label: 'Verify', scripts: ['typecheck'] },
      { label: 'Test', scripts: ['test:zetro'] },
      { label: 'Maintenance', scripts: ['clean'] },
    ],
  )
})

test('creates a diagnostic-only supervisor handoff', () => {
  const prompt = createAutomationSupervisorPrompt({
    attempts: 1,
    completedAt: null,
    createdAt: '2026-09-09T00:00:00.000Z',
    error: 'build failed',
    id: 'run-1',
    maxAttempts: 2,
    projectId: 'project-1',
    recoveryCount: 0,
    result: null,
    startedAt: '2026-09-09T00:00:00.000Z',
    status: 'failed',
    steps: [
      {
        completedAt: '2026-09-09T00:01:00.000Z',
        id: 'step-1',
        message: 'TypeScript failed.',
        status: 'failed',
        taskId: 'run-1',
      },
    ],
    title: 'Build repository',
    type: 'repository-script',
    updatedAt: '2026-09-09T00:01:00.000Z',
  })

  assert.match(prompt, /build failed/)
  assert.match(prompt, /Do not rerun the workflow/)
  assert.match(prompt, /Wait for review before making changes/)
})

test('adds shared UI ownership guidance to an audit failure', () => {
  const prompt = createAutomationSupervisorPrompt({
    attempts: 1,
    completedAt: null,
    createdAt: '2026-09-10T00:00:00.000Z',
    error: 'apps/sample/web/src/page.tsx uses a native button',
    id: 'run-ui-1',
    maxAttempts: 1,
    projectId: 'project-1',
    recoveryCount: 0,
    result: null,
    startedAt: '2026-09-10T00:00:00.000Z',
    status: 'failed',
    steps: [],
    title: 'npm run check:ui-system',
    type: 'developer-tools.repository-script',
    updatedAt: '2026-09-10T00:01:00.000Z',
  })

  assert.match(prompt, /shared UI ownership audit/)
  assert.match(prompt, /public @codexsun\/ui exports/)
  assert.match(prompt, /Move only reusable UI implementations to packages\/ui/)
})
