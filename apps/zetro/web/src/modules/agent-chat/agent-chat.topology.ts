import type { InterfaceTopologySection } from '@codexsun/ui/features/interface-topology'

export const agentChatTopologySections: readonly InterfaceTopologySection[] = [
  {
    id: '15.1.3',
    technicalName: 'zetro.archive.workspace',
    name: 'Archived chats',
    scope: 'Zetro workspace',
    description: 'Lists archived conversations with restore and permanent delete actions.',
  },
  {
    id: '15.1.1',
    technicalName: 'zetro.conversation.stream',
    name: 'Conversation stream',
    scope: 'Zetro workspace',
    description: 'Shows the current agent conversation and response state.',
  },
  {
    id: '15.1.2',
    technicalName: 'zetro.prompt.composer',
    name: 'Prompt composer',
    scope: 'Zetro workspace',
    description: 'Collects text, attachments, voice input, and workflow selection.',
  },
  {
    id: '15.2.1',
    technicalName: 'zetro.history.conversations',
    name: 'Conversation history',
    scope: 'Zetro Desk sidebar',
    description: 'Shows pinned and recent conversations.',
  },
  {
    id: '15.2.2',
    technicalName: 'zetro.history.newChat',
    name: 'New chat',
    scope: 'Zetro Desk sidebar',
    description: 'Starts an empty agent conversation.',
  },
  {
    id: '15.2.3',
    technicalName: 'zetro.history.archive',
    name: 'Archived chats action',
    scope: 'Zetro Desk sidebar',
    description: 'Opens the archived conversation workspace.',
  },
]
