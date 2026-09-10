import assert from 'node:assert/strict'
import test from 'node:test'
import { taskInputFromPlan } from '../src/modules/agent-chat/agent-chat.task-draft'

const scope = {
  application: 'zetro',
  documentationPaths: ['assist/records/zetro'],
  folderPath: 'apps/zetro',
  module: 'agent-chat',
}

test('creates an executable task plan from the required planning headings', () => {
  const input = taskInputFromPlan(
    [
      'Title: Improve task handoff',
      'Task:',
      'Show the reviewed plan before a user starts the system task.',
      'Acceptance criteria:',
      '- The task shows its criteria.',
      '- A task can start only once.',
      'Checks:',
      '- npm.cmd run typecheck --workspace @codexsun/zetro-web',
      '- npm.cmd run test --workspace @codexsun/zetro-web',
      'Open questions:',
      '- None.',
    ].join('\n'),
    scope,
    '00000000-0000-4000-8000-000000000001',
  )

  assert.equal(input.title, 'Improve task handoff')
  assert.deepEqual(input.plan?.acceptanceCriteria, [
    'The task shows its criteria.',
    'A task can start only once.',
  ])
  assert.deepEqual(input.plan?.checks, [
    'npm.cmd run typecheck --workspace @codexsun/zetro-web',
    'npm.cmd run test --workspace @codexsun/zetro-web',
  ])
  assert.equal(input.plan?.scope.folderPath, 'apps/zetro')
})

test('keeps an incomplete planning reply as a non-executable task draft', () => {
  const input = taskInputFromPlan('Title: Inspect Zetro\nTask: Read the relevant module.', scope, 'x')

  assert.equal(input.plan, undefined)
})
