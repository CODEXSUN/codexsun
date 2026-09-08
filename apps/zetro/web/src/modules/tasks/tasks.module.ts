export const tasksModuleManifest = {
  capabilities: ['task-create', 'task-list', 'task-status'],
  dependencies: { 'zetro.tasks.api': '^0.1.0' },
  id: 'zetro.tasks.web',
  lifecycle: {
    activate: 'Mount the task workspace and load tasks.',
    deactivate: 'Unmount the task workspace.',
    install: 'No client business data is created.',
    uninstall: 'No client business data is removed.',
    upgrade: 'No migration is required for version 0.1.0.',
  },
  publicContracts: ['TaskWorkspace'],
  scope: 'zetro-web',
  version: '0.1.0',
} as const
