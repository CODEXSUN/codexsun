import { useState } from 'react'
import { AgentChatArchive } from './agent-chat.archive'
import { AgentChatComposer } from './agent-chat.composer'
import { useAgentChat } from './agent-chat.controller'
import { AgentChatMessages } from './agent-chat.messages'

export function AgentChatWorkspace() {
  const chat = useAgentChat()
  const [draft, setDraft] = useState('')

  if (chat.view === 'archive') return <AgentChatArchive />

  return (
    <section aria-label="Agent chat" className="relative size-full overflow-hidden bg-background">
      <div className="mx-auto flex size-full w-4/5 min-w-0 flex-col">
        <AgentChatMessages onStarter={setDraft} />
        <AgentChatComposer draft={draft} onDraftChange={setDraft} />
      </div>
    </section>
  )
}
