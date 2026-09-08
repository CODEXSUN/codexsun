export const deskModuleManifest = {
  capabilities: [
    'composable-desk-workspace',
    'dynamic-sidebar-content',
    'grouped-interface-topology',
  ],
  dependencies: { 'zetro.settings.web': '^0.1.0' },
  id: 'zetro.desk.web',
  lifecycle: {
    activate: 'Mount the Zetro Desk workspace.',
    deactivate: 'Unmount the Zetro Desk workspace.',
    install: 'No persistent business data is created.',
    uninstall: 'No business data is removed.',
    upgrade: 'Version 0.6.0 adds the shared workspace context bar.',
  },
  publicContracts: ['ZetroDeskSidebar', 'ZetroDeskWorkspace'],
  scope: 'zetro-web',
  version: '0.6.0',
} as const
