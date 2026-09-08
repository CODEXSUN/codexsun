export const projectTasksModuleManifest = {
  capabilities: [
    'project-task-list',
    'project-task-create',
    'project-task-status',
    'project-task-actions',
    'project-task-archive',
  ],
  dependencies: { 'zetro.projects.web': '^0.1.0', 'zetro.tasks.api': '^0.3.0' },
  id: 'zetro.project-tasks.web',
  lifecycle: {
    activate: 'Load selected-project tasks and mount the task workspace.',
    deactivate: 'Unmount task controls and discard transient form state.',
    install: 'No browser business data is created.',
    uninstall: 'No API task records are removed.',
    upgrade: 'Version 0.3.0 adds hover actions and archived task restore.',
  },
  publicContracts: [
    'ProjectTasksProvider',
    'ProjectTaskList',
    'ProjectTasksWorkspace',
    'useProjectTasks',
  ],
  scope: 'zetro-web',
  version: '0.3.0',
} as const
