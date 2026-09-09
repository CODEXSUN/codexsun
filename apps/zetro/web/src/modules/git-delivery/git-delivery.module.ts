export const gitDeliveryModuleManifest = {
  capabilities: [
    'interactive-flow-builder',
    'release-preview',
    'reviewed-system-task',
    'delivery-history',
    'global-settings',
    'project-settings',
  ],
  dependencies: { 'zetro.git-delivery.api': '^1.0.0' },
  id: 'zetro.git-delivery.web',
  lifecycle: {
    activate: 'Mount the Git delivery flow builder and settings.',
    deactivate: 'Unmount Git delivery controls.',
    install: 'Load API-owned delivery settings and history.',
    uninstall: 'Leave Git history and delivery records unchanged.',
    upgrade: 'Add the reviewed GitHub delivery system task.',
  },
  publicContracts: [
    'GitDeliveryProvider',
    'GitDeliveryFlowBuilder',
    'GlobalGitDeliverySettings',
    'ProjectGitDeliverySettings',
    'useGitDelivery',
  ],
  scope: 'zetro-web',
  version: '0.1.0',
} as const
