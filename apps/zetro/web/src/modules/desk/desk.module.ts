export const deskModuleManifest = {
  capabilities: [
    'composable-desk-workspace',
    'dynamic-sidebar-content',
    'grouped-interface-topology',
    'chat-workspace-context',
  ],
  dependencies: {
    'zetro.developer-tools.web': '^1.0.0',
    'zetro.git-delivery.web': '^0.1.0',
    'zetro.settings.web': '^0.3.0',
  },
  id: 'zetro.desk.web',
  lifecycle: {
    activate: 'Mount the Zetro Desk workspace.',
    deactivate: 'Unmount the Zetro Desk workspace.',
    install: 'No persistent business data is created.',
    uninstall: 'No business data is removed.',
    upgrade: 'Compose the Git delivery flow inside repository tools.',
  },
  publicContracts: ['ZetroDeskSidebar', 'ZetroDeskWorkspace'],
  scope: 'zetro-web',
  version: '0.7.0',
} as const
