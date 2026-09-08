export const settingsModuleManifest = {
  capabilities: ['codex-account-status', 'codex-device-activation', 'codex-disconnect'],
  dependencies: { 'zetro.codex-connection.api': '^0.1.0' },
  id: 'zetro.settings.web',
  lifecycle: {
    activate: 'Mount Settings and read the local Codex connection.',
    deactivate: 'Unmount Settings and clear the in-memory device code.',
    install: 'No browser credentials or business data are created.',
    uninstall: 'Leave Codex-managed credentials untouched.',
    upgrade: 'No migration is required for version 0.1.0.',
  },
  publicContracts: ['SettingsWorkspace'],
  scope: 'zetro-web',
  version: '0.1.0',
} as const
