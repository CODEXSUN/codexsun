export const operationsModuleManifest = {
  capabilities: [
    'floating-runtime-metrics',
    'connected-app-status',
    'worktree-management',
    'diagnostics-download',
    'retention-settings',
  ],
  dependencies: {
    'zetro.operations.api': '^1.0.0',
    'zetro.worktrees.api': '^1.0.0',
  },
  id: 'zetro.operations.web',
  lifecycle: {
    activate: 'Poll local metrics while visible and mount operations controls.',
    deactivate: 'Stop metric polling and unmount operations controls.',
    install: 'Load API-owned operations settings.',
    uninstall: 'Leave metrics, diagnostics, and worktrees unchanged.',
    upgrade: 'Version 1.0.0 adds metrics, diagnostics, and safe worktree cleanup.',
  },
  publicContracts: ['OperationsMonitor', 'OperationsSettingsView'],
  scope: 'zetro-web',
  version: '1.0.0',
} as const
