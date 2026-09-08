export const agentChatModuleManifest = {
  capabilities: [
    'agent-chat',
    'conversation-history',
    'conversation-archive',
    'message-actions',
    'multimodal-prompt',
  ],
  dependencies: {
    'zetro.chat.api': '^0.7.0',
    'zetro.desk.web': '^0.5.0',
    'zetro.projects.web': '^0.1.0',
  },
  id: 'zetro.agent-chat.web',
  lifecycle: {
    activate: 'Mount agent chat inside the Zetro Desk surfaces.',
    deactivate: 'Unmount agent chat and stop active browser voice input.',
    install: 'No browser business data is created.',
    uninstall: 'No API conversation history is removed.',
    upgrade: 'Version 0.4.4 promotes New chat above the archive action.',
  },
  publicContracts: ['AgentChatProvider', 'AgentChatHistory', 'AgentChatWorkspace'],
  scope: 'zetro-web',
  version: '0.4.4',
} as const
