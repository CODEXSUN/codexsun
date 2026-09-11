export const agentTaskWebModuleManifest = {
  capabilities: [
    'chat-handoff',
    'task-draft-registry',
    'task-draft-workspace',
    'task-queue-page',
    'task-review-readiness',
  ],
  dependencies: { 'zetro.agent-tasks.api': '^1.0.0', 'zetro.shell.web': '^2.7.0' },
  id: 'zetro.agent-tasks.web',
  scope: 'zetro-web',
  version: '1.2.0',
} as const
