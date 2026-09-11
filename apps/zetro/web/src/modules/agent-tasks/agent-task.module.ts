export const agentTaskWebModuleManifest = {
  capabilities: ['chat-handoff', 'task-draft-registry', 'task-draft-workspace'],
  dependencies: { 'zetro.agent-tasks.api': '^1.0.0', 'zetro.shell.web': '^2.3.0' },
  id: 'zetro.agent-tasks.web',
  scope: 'zetro-web',
  version: '1.0.0',
} as const
