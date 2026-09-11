export const shellModuleManifest = {
  capabilities: [
    'codex-chat',
    'durable-conversation-identity',
    'reconnectable-chat-stream',
    'stored-chat-history',
  ],
  dependencies: { 'zetro.chat.api': '^2.0.0' },
  id: 'zetro.shell.web',
  lifecycle: {
    activate: 'Mount the Zetro 2.0 Codex chat.',
    deactivate: 'Unmount the Codex chat.',
    install: 'Creates one durable browser conversation identity.',
    uninstall: 'Does not remove API-owned history.',
    upgrade: 'Version 2.3.0 migrates the tab session into durable browser storage.',
  },
  publicContracts: ['ChatStreamEvent', 'ZetroChat'],
  scope: 'zetro-web',
  version: '2.3.0',
} as const
