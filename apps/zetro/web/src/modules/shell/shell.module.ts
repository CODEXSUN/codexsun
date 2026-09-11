export const shellModuleManifest = {
  capabilities: [
    'codex-chat',
    'conversation-registry',
    'concurrent-conversation-streams',
    'durable-conversation-identity',
    'reconnectable-chat-stream',
    'stored-chat-history',
  ],
  dependencies: { 'zetro.chat.api': '^2.4.0', 'zetro.providers.web': '^1.4.0' },
  id: 'zetro.shell.web',
  lifecycle: {
    activate: 'Mount the Zetro conversation registry and Codex chat.',
    deactivate: 'Unmount the Codex chat.',
    install: 'Creates or restores one durable browser conversation identity.',
    uninstall: 'Does not remove API-owned history.',
    upgrade:
      'Version 2.7.0 persists a verified provider, model, and reasoning selection on every conversation.',
  },
  publicContracts: ['ChatStreamEvent', 'ZetroChat'],
  scope: 'zetro-web',
  version: '2.7.0',
} as const
