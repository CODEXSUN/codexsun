import assert from 'node:assert/strict'
import test from 'node:test'
import { createAutomationSupervisorPrompt } from '../src/modules/automation/automation.supervisor.js'
import { groupAutomationScripts } from '../src/modules/automation/automation.scripts.js'

test('groups scripts by deterministic operational nature', () => {
  assert.deepEqual(groupAutomationScripts(['test:zetro', 'build', 'clean', 'typecheck']), [
    { label: 'Build', scripts: ['build'] },
    { label: 'Verify', scripts: ['typecheck'] },
    { label: 'Test', scripts: ['test:zetro'] },
    { label: 'Maintenance', scripts: ['clean'] },
  ])
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
