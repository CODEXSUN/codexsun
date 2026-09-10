export const automationModuleManifest = {
  capabilities: [
    'deterministic-repository-automation',
    'durable-run-observation',
    'diagnostic-supervisor-handoff',
    'explicit-destructive-confirmation',
    'shared-ui-ownership-audit',
  ],
  dependencies: {
    'zetro.agent-chat.web': '^0.12.0',
    'zetro.developer-tools.web': '^1.0.0',
    'zetro.git-delivery.web': '^0.1.0',
    'zetro.operations.web': '^1.0.0',
    'zetro.projects.web': '^0.5.0',
    'zetro.system-tasks.web': '^1.0.0',
  },
  id: 'zetro.automation.web',
  lifecycle: {
    activate: 'Mount deterministic repository automation and durable run history.',
    deactivate: 'Unmount automation controls without stopping durable runs.',
    install: 'No browser business data is created.',
    uninstall: 'No API execution history is removed.',
    upgrade: 'Version 0.4.0 binds shared execution signals to observed task state.',
  },
  publicContracts: ['AutomationSidebar', 'AutomationWorkspace'],
  scope: 'zetro-web',
  version: '0.4.0',
} as const
