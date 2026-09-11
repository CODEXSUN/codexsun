export const shellModuleManifest = {
  capabilities: ['codex-chat', 'reconnectable-chat-stream', 'stored-chat-history'],
  dependencies: { 'zetro.chat.api': '^1.1.0' },
  id: 'zetro.shell.web',
  lifecycle: {
    activate: 'Mount the Zetro 2.0 Codex chat.',
    deactivate: 'Unmount the Codex chat.',
    install: 'Creates one browser session identity.',
    uninstall: 'Does not remove API-owned history.',
    upgrade: 'Version 2.2.0 reconnects active API-owned turns by event sequence.',
  },
  publicContracts: ['ChatStreamEvent', 'ZetroChat'],
  scope: 'zetro-web',
  version: '2.2.0',
} as const
