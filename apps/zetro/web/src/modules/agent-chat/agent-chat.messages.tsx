import { useEffect, useRef } from 'react'
import { Bot, File, LoaderCircle, User } from 'lucide-react'
import { ScrollArea } from '@codexsun/ui/components/scroll-area'
import { TopologyRegion } from '@codexsun/ui/features/interface-topology'
import { useMdiTopology } from '@codexsun/ui/layouts/mdi-main'
import { useAgentChat } from './agent-chat.controller'
import { AgentChatMessageActions } from './agent-chat.message-actions'
import type { ChatMessage } from './agent-chat.types'

const starters = [
  'Review this repository and propose the next change',
  'Plan a feature with acceptance criteria and tests',
]

export function AgentChatMessages({ onStarter }: { onStarter(value: string): void }) {
  const chat = useAgentChat()
  const topology = useMdiTopology()
  const endRef = useRef<HTMLDivElement>(null)
  const turns = groupMessagesByTurn(chat.messages)

  useEffect(() => {
    endRef.current?.scrollIntoView({ block: 'end' })
  }, [chat.isBusy, chat.messages])

  return (
    <TopologyRegion
      aria-live="polite"
      as={ScrollArea}
      className="min-h-0 flex-1"
      id="15.1.1"
      topology={topology}
    >
      <div className="flex min-h-full flex-col gap-7 px-1 py-8">
        {chat.messages.length === 0 ? <EmptyConversation onStarter={onStarter} /> : null}
        {turns.map((turn) => (
          <section className="flex flex-col gap-7 border-b pb-3" key={turn[0]?.id}>
            {turn.map((message) => (
              <Message key={message.id} message={message} />
            ))}
          </section>
        ))}
        {chat.isBusy ? (
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <LoaderCircle className="size-4 animate-spin" />
            <span className="shimmer shimmer-color-orange-500 text-foreground/40">
              Zetro is working
            </span>
          </div>
        ) : null}
        <div ref={endRef} />
      </div>
    </TopologyRegion>
  )
}

function EmptyConversation({ onStarter }: { onStarter(value: string): void }) {
  return (
    <div className="flex flex-1 flex-col items-center justify-center gap-5 py-16 text-center">
      <span className="grid size-11 place-items-center rounded-xl bg-primary text-primary-foreground">
        <Bot className="size-5" />
      </span>
      <div className="space-y-2">
        <h1 className="text-2xl font-semibold tracking-tight">What are we building?</h1>
        <p className="text-sm text-muted-foreground">
          Ask Zetro to plan, review, document, or code.
        </p>
      </div>
      <div className="w-full max-w-xl divide-y rounded-xl border bg-background text-left">
        {starters.map((starter) => (
          <button
            className="flex w-full items-center px-4 py-3 text-sm transition-colors hover:bg-muted"
            key={starter}
            onClick={() => onStarter(starter)}
            type="button"
          >
            {starter}
          </button>
        ))}
      </div>
    </div>
  )
}

function Message({ message }: { message: ChatMessage }) {
  const user = message.role === 'user'
  return (
    <article
      className={`group/message flex w-full gap-3 ${user ? 'justify-end' : 'justify-start'}`}
    >
      {!user ? (
        <span className="mt-1 grid size-7 shrink-0 place-items-center rounded-lg bg-primary text-primary-foreground">
          <Bot className="size-3.5" />
        </span>
      ) : null}
      <div className={user ? 'max-w-[78%] min-w-0' : 'min-w-0 flex-1'}>
        <div className={user ? 'rounded-2xl bg-muted px-4 py-3' : 'py-1'}>
          <div className="whitespace-pre-wrap text-sm leading-6">
            {message.content || 'Shared attachments'}
          </div>
          {message.attachments.length ? (
            <div className="mt-3 flex flex-wrap gap-2">
              {message.attachments.map((attachment) =>
                attachment.mimeType.startsWith('image/') ? (
                  <img
                    alt={attachment.name}
                    className="max-h-48 rounded-lg border object-contain"
                    key={attachment.id}
                    src={attachment.dataUrl}
                  />
                ) : (
                  <span
                    className="inline-flex items-center gap-1.5 rounded-md border px-2 py-1 text-xs"
                    key={attachment.id}
                  >
                    <File className="size-3.5" />
                    {attachment.name}
                  </span>
                ),
              )}
            </div>
          ) : null}
        </div>
        <AgentChatMessageActions message={message} />
      </div>
      {user ? (
        <span className="mt-1 grid size-7 shrink-0 place-items-center rounded-lg border bg-background">
          <User className="size-3.5" />
        </span>
      ) : null}
    </article>
  )
}

function groupMessagesByTurn(messages: ChatMessage[]): ChatMessage[][] {
  return messages.reduce<ChatMessage[][]>((turns, message) => {
    if (message.role === 'user' || turns.length === 0) {
      turns.push([message])
      return turns
    }

    turns.at(-1)?.push(message)
    return turns
  }, [])
}
