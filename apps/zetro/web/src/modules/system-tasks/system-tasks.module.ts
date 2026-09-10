export const systemTasksWebModuleManifest = {
  capabilities: [
    'system-task-status',
    'task-stop',
    'task-retry',
    'execution-history',
    'notifications',
  ],
  dependencies: {
    'zetro.developer-tools.web': '^1.0.0',
    'zetro.system-tasks.api': '^1.0.0',
  },
  id: 'zetro.system-tasks.web',
  lifecycle: {
    activate: 'Poll task status while Zetro is visible.',
    deactivate: 'Stop task polling.',
    install: 'No browser-owned system task data is created.',
    uninstall: 'Leave API-owned task history unchanged.',
    upgrade: 'Add durable task status and recovery controls.',
  },
  publicContracts: ['SystemTasksProvider', 'SystemTasksPanel'],
  scope: 'zetro-web',
  version: '1.1.0',
} as const
