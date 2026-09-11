export const providerWebModuleManifest = {
  capabilities: [
    'codex-device-login',
    'dynamic-model-selection',
    'provider-settings',
    'selection-confirmation',
    'top-bar-switcher',
  ],
  dependencies: { 'zetro.providers.api': '^1.2.0' },
  id: 'zetro.providers.web',
  lifecycle: {
    activate: 'Shows persisted provider, model, reasoning, account, and connection controls.',
    deactivate: 'Removes provider settings from the workspace.',
    install: 'Uses API-owned provider settings.',
    uninstall: 'Does not remove provider settings or credentials.',
    upgrade: 'Version 1.3.0 adds compact model and reasoning switching to the chat header.',
  },
  publicContracts: ['ProviderHeaderSwitcher', 'ProviderSettings'],
  scope: 'zetro-web',
  version: '1.3.0',
} as const
