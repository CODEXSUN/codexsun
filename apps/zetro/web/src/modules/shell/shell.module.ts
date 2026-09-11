export const shellModuleManifest = {
  capabilities: ['codex-chat'],
  dependencies: {},
  id: 'zetro.shell.web',
  lifecycle: {
    activate: 'Mount the Zetro 2.0 Codex chat.',
    deactivate: 'Unmount the Codex chat.',
    install: 'No persistent data is created.',
    uninstall: 'No persistent data is removed.',
    upgrade: 'Version 2.0.0 exposes one prompt-to-Codex flow.',
  },
  publicContracts: ['ChatStreamEvent', 'ZetroChat'],
  scope: 'zetro-web',
  version: '2.0.0',
} as const
