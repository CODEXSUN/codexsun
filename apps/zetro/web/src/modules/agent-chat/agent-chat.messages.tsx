import { lazy, Suspense, useEffect, useState } from 'react'
import { useScrollFollow } from '@codexsun/ui/hooks/use-scroll-follow'
import { Bot, File, LoaderCircle, Square, User } from 'lucide-react'
import { Button } from '@codexsun/ui/components/button'
import { ScrollArea } from '@codexsun/ui/components/scroll-area'
import { TopologyRegion } from '@codexsun/ui/features/interface-topology'
import { useMdiTopology } from '@codexsun/ui/layouts/mdi-main'
import { useAgentChat } from './agent-chat.controller'
import { AgentChatMessageActions } from './agent-chat.message-actions'
import type { ChatMessage } from './agent-chat.types'

const AgentChatMarkdown = lazy(() =>
  import('./agent-chat.markdown').then((module) => ({ default: module.AgentChatMarkdown })),
)

const starters = [
  'Review this repository and propose the next change',
  'Plan a feature with acceptance criteria and tests',
]

export function AgentChatMessages({ onStarter }: { onStarter(value: string): void }) {
  const chat = useAgentChat()
  const topology = useMdiTopology()
  const endRef = useScrollFollow([chat.messages, chat.liveItems, chat.workingSince], chat.activeId)
  const turns = groupMessagesByTurn(chat.messages)
  const workingSince = chat.workingSince

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
        {turns.map((turn, index) => {
          const isActiveTurn = index === turns.length - 1 && workingSince !== null
          const closesDay = turnClosesDay(turns, index)
          return (
            <section className="flex flex-col gap-7" key={turn[0]?.id}>
              {showDateSection(turns, index) ? <DateSection message={turn[0]} /> : null}
              <div className={`flex flex-col gap-7 pb-3 ${closesDay ? '' : 'border-b'}`}>
                {turn.map((message) => (
                  <Message key={message.id} message={message} />
                ))}
                {isActiveTurn ? (
                  <>
                    <WorkingElapsed onStop={chat.stopWorking} startedAt={workingSince} />
                    {chat.liveItems.map((item) => (
                      <p
                        key={`${item.kind}:${item.id}`}
                        className={
                          item.kind === 'tool'
                            ? 'whitespace-pre-wrap break-words text-sm text-muted-foreground'
                            : 'whitespace-pre-wrap break-words text-sm text-foreground'
                        }
                      >
                        {item.text}
                      </p>
                    ))}
                  </>
                ) : null}
              </div>
            </section>
          )
        })}
        <div ref={endRef} />
      </div>
    </TopologyRegion>
  )
}

function DateSection({ message }: { message: ChatMessage | undefined }) {
  if (!message) return null
  return (
    <div
      aria-label={formatFullDate(message.createdAt)}
      className="flex items-center gap-3 text-xs font-medium text-muted-foreground"
      role="separator"
    >
      <span className="h-px flex-1 bg-border" />
      <span>{formatDateSection(message.createdAt)}</span>
      <span className="h-px flex-1 bg-border" />
    </div>
  )
}

function WorkingElapsed({ onStop, startedAt }: { onStop(): Promise<void>; startedAt: number }) {
  const [seconds, setSeconds] = useState(() => elapsedSeconds(startedAt))

  useEffect(() => {
    setSeconds(elapsedSeconds(startedAt))
    const timer = window.setInterval(() => setSeconds(elapsedSeconds(startedAt)), 1_000)
    return () => window.clearInterval(timer)
  }, [startedAt])

  return (
    <Button
      variant="ghost"
      aria-label="Stop response"
      aria-live="off"
      className="group/stop flex w-fit cursor-pointer items-center gap-2 rounded-md px-1 py-1 text-sm text-muted-foreground transition-colors hover:bg-orange-50 hover:text-orange-600 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-orange-500/50 dark:hover:bg-orange-950/30"
      onClick={() => void onStop()}
      title="Stop response"
      type="button"
    >
      <LoaderCircle className="size-4 animate-spin group-hover/stop:hidden group-focus-visible/stop:hidden" />
      <Square className="hidden size-4 fill-orange-500 text-orange-500 group-hover/stop:block group-focus-visible/stop:block" />
      <span className="shimmer shimmer-color-orange-500 text-foreground/40 group-hover/stop:text-orange-600 group-focus-visible/stop:text-orange-600">
        Working for {formatElapsed(seconds)}
      </span>
    </Button>
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
          Discuss an idea, then create a reviewed task draft.
        </p>
      </div>
      <div className="w-full max-w-xl divide-y rounded-xl border bg-background text-left">
        {starters.map((starter) => (
          <Button
            variant="ghost"
            className="flex w-full items-center px-4 py-3 text-sm transition-colors hover:bg-muted"
            key={starter}
            onClick={() => onStarter(starter)}
            type="button"
          >
            {starter}
          </Button>
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
          {user ? (
            <div className="whitespace-pre-wrap text-sm leading-6">
              {message.content || 'Shared attachments'}
            </div>
          ) : (
            <Suspense
              fallback={
                <div className="whitespace-pre-wrap text-sm leading-6">
                  {message.content || 'Shared attachments'}
                </div>
              }
            >
              <AgentChatMarkdown content={message.content || 'Shared attachments'} />
            </Suspense>
          )}
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

function showDateSection(turns: ChatMessage[][], index: number): boolean {
  if (index === 0) return true
  const current = turns[index]?.[0]
  const previous = turns[index - 1]?.[0]
  return Boolean(current && previous && dateKey(current.createdAt) !== dateKey(previous.createdAt))
}

function turnClosesDay(turns: ChatMessage[][], index: number): boolean {
  const current = turns[index]?.[0]
  const next = turns[index + 1]?.[0]
  return Boolean(current && next && dateKey(current.createdAt) !== dateKey(next.createdAt))
}

function formatDateSection(value: string): string {
  const date = new Date(value)
  const day = relativeDay(date)
  const label =
    day ??
    new Intl.DateTimeFormat(undefined, {
      day: 'numeric',
      month: 'short',
      year: date.getFullYear() === new Date().getFullYear() ? undefined : 'numeric',
    }).format(date)
  return `${label} · ${new Intl.DateTimeFormat(undefined, {
    hour: 'numeric',
    minute: '2-digit',
  }).format(date)}`
}

function formatFullDate(value: string): string {
  return new Intl.DateTimeFormat(undefined, { dateStyle: 'full', timeStyle: 'short' }).format(
    new Date(value),
  )
}

function relativeDay(date: Date): 'Today' | 'Yesterday' | null {
  const today = new Date()
  const yesterday = new Date(today)
  yesterday.setDate(today.getDate() - 1)
  if (dateKey(date.toISOString()) === dateKey(today.toISOString())) return 'Today'
  if (dateKey(date.toISOString()) === dateKey(yesterday.toISOString())) return 'Yesterday'
  return null
}

function dateKey(value: string): string {
  const date = new Date(value)
  return `${date.getFullYear()}-${date.getMonth()}-${date.getDate()}`
}

function elapsedSeconds(startedAt: number): number {
  return Math.max(0, Math.floor((Date.now() - startedAt) / 1_000))
}

function formatElapsed(seconds: number): string {
  if (seconds < 60) return `${seconds}s`
  const minutes = Math.floor(seconds / 60)
  return `${minutes}m ${seconds % 60}s`
}
