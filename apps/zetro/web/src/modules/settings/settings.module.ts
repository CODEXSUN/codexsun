export const settingsModuleManifest = {
  capabilities: [
    'centralized-application-preferences',
    'codex-account-status',
    'codex-device-activation',
    'codex-disconnect',
    'codex-model-preference',
    'default-chat-workflow',
    'interface-topology-visibility',
    'workspace-appearance',
  ],
  dependencies: {
    'zetro.codex-connection.api': '^0.8.0',
    'zetro.developer-tools.web': '^1.0.0',
    'zetro.operations.web': '^1.0.0',
    'zetro.git-delivery.web': '^0.1.0',
  },
  id: 'zetro.settings.web',
  lifecycle: {
    activate: 'Mount Settings and read application preferences and the local Codex connection.',
    deactivate: 'Unmount Settings and clear the in-memory device code.',
    install: 'No browser credentials or business data are created.',
    uninstall: 'Leave Codex-managed credentials untouched.',
    upgrade: 'Version 0.4.0 adds global Codex model and reasoning preferences.',
  },
  publicContracts: ['SettingsWorkspace', 'ZetroSettingsProvider', 'useZetroPreferences'],
  scope: 'zetro-web',
  version: '0.4.0',
} as const
