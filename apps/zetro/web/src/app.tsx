import { useEffect, useState, type FormEvent, type KeyboardEvent } from 'react'
import { Button } from '@codexsun/ui/components/button'
import {
  MessageScroller,
  MessageScrollerButton,
  MessageScrollerContent,
  MessageScrollerItem,
  MessageScrollerProvider,
  MessageScrollerViewport,
} from '@codexsun/ui/components/message-scroller'
import { Textarea } from '@codexsun/ui/components/textarea'
import { ArrowUp, Bot, Check, Copy } from 'lucide-react'
import { ChatTurnTimeline, type TurnEntry } from './modules/shell/chat-turn-timeline'
import { parseChatStreamEvent, type ChatStreamEvent } from './modules/shell/chat-stream.contract'

type ChatTurn = {
  completedAt?: number
  entries: TurnEntry[]
  id: number
  prompt: string
  startedAt: number
  status: 'failed' | 'working' | 'complete'
}

export function App() {
  const [turns, setTurns] = useState<ChatTurn[]>([])
  const [prompt, setPrompt] = useState('')
  const [error, setError] = useState('')
  const [isResponding, setIsResponding] = useState(false)
  const buildVersion = import.meta.env.VITE_ZETRO_BUILD_VERSION || '2.0.0'

  async function sendPrompt(event?: FormEvent) {
    event?.preventDefault()
    if (!prompt.trim() || isResponding) return

    const rawPrompt = prompt
    const turnId = Date.now()
    setTurns((current) => [
      ...current,
      {
        entries: [],
        id: turnId,
        prompt: rawPrompt,
        startedAt: Date.now(),
        status: 'working',
      },
    ])
    setPrompt('')
    setError('')
    setIsResponding(true)

    try {
      const response = await fetch('/api/chat', {
        body: JSON.stringify({ prompt: rawPrompt }),
        headers: { 'content-type': 'application/json' },
        method: 'POST',
      })
      if (!response.ok) throw new Error((await response.text()) || 'Codex did not respond.')
      if (!response.body) throw new Error('Codex returned an empty response stream.')
      await readChatStream(response.body, (streamEvent) => applyStreamEvent(turnId, streamEvent))
    } catch (reason) {
      const message = reason instanceof Error ? reason.message : 'Could not connect to Codex.'
      setError(message)
      finishTurn(turnId, 'failed')
    } finally {
      setIsResponding(false)
    }
  }

  function applyStreamEvent(turnId: number, event: ChatStreamEvent) {
    if (event.type === 'request') {
      appendActivity(turnId, 'request', { prompt: event.content })
      return
    }
    if (event.type === 'activity') {
      appendActivity(turnId, event.method, event.item)
      return
    }
    if (event.type === 'response') {
      appendResponse(turnId, event.delta)
      return
    }
    if (event.type === 'complete') {
      finishTurn(turnId, 'complete')
      return
    }
    setError(event.message)
    finishTurn(turnId, 'failed')
  }

  function appendActivity(turnId: number, method: string, item: Record<string, unknown>) {
    updateTurn(turnId, (turn) => ({
      ...turn,
      entries: [
        ...turn.entries,
        { id: Date.now() + turn.entries.length, item, method, type: 'activity' },
      ],
    }))
  }

  function appendResponse(turnId: number, delta: string) {
    updateTurn(turnId, (turn) => {
      const lastEntry = turn.entries.at(-1)
      if (lastEntry?.type === 'response') {
        return {
          ...turn,
          entries: [
            ...turn.entries.slice(0, -1),
            { ...lastEntry, content: lastEntry.content + delta },
          ],
        }
      }
      return {
        ...turn,
        entries: [...turn.entries, { content: delta, id: Date.now(), type: 'response' }],
      }
    })
  }

  function finishTurn(turnId: number, status: ChatTurn['status']) {
    updateTurn(turnId, (turn) => ({ ...turn, completedAt: Date.now(), status }))
  }

  function updateTurn(turnId: number, updater: (turn: ChatTurn) => ChatTurn) {
    setTurns((current) => current.map((turn) => (turn.id === turnId ? updater(turn) : turn)))
  }

  function handleComposerKeyDown(event: KeyboardEvent<HTMLTextAreaElement>) {
    if (event.key !== 'Enter' || event.shiftKey) return
    event.preventDefault()
    void sendPrompt()
  }

  return (
    <main className="flex h-svh min-h-0 flex-col bg-background text-foreground">
      <header className="flex h-12 shrink-0 items-center gap-2 border-b px-4">
        <span className="grid size-7 place-items-center rounded-lg bg-black text-white">
          <Bot className="size-4" />
        </span>
        <span className="text-sm font-semibold">Zetro</span>
        <span className="ml-auto text-xs text-gray-600">v{buildVersion}</span>
      </header>

      <section className="flex min-h-0 w-full flex-1 flex-col">
        <MessageScrollerProvider autoScroll defaultScrollPosition="end">
          <MessageScroller className="flex-1">
            <MessageScrollerViewport aria-label="Conversation">
              <MessageScrollerContent
                className="gap-10 px-4 py-6 sm:px-6 md:py-8 lg:px-10 2xl:px-16"
                aria-live="polite"
              >
                {turns.length === 0 ? <EmptyChat /> : null}
                {turns.map((turn, index) => (
                  <MessageScrollerItem
                    key={turn.id}
                    messageId={String(turn.id)}
                    scrollAnchor={index === turns.length - 1}
                  >
                    <ChatTurnView turn={turn} />
                  </MessageScrollerItem>
                ))}
              </MessageScrollerContent>
            </MessageScrollerViewport>
            <MessageScrollerButton
              aria-label="Scroll to present"
              className="cursor-pointer rounded-full border shadow-sm"
              direction="end"
            />
          </MessageScroller>
        </MessageScrollerProvider>

        <form
          className="shrink-0 px-3 pb-3 pt-2 sm:px-5 sm:pb-5 lg:px-10 2xl:px-16"
          onSubmit={(event) => void sendPrompt(event)}
        >
          <div className="rounded-2xl border bg-background p-2 shadow-sm">
            <Textarea
              aria-label="Prompt Codex"
              autoFocus
              className="scrollbar-none min-h-32 max-h-36 resize-none overflow-y-auto border-0 bg-transparent shadow-none focus-visible:border-transparent focus-visible:ring-0"
              disabled={isResponding}
              onChange={(event) => setPrompt(event.target.value)}
              onKeyDown={handleComposerKeyDown}
              placeholder="Message Codex…"
              value={prompt}
            />
            <div className="flex justify-end">
              <Button
                aria-label="Send prompt"
                className="cursor-pointer"
                disabled={!prompt.trim() || isResponding}
                size="icon"
                type="submit"
              >
                <ArrowUp />
              </Button>
            </div>
          </div>
          {error ? <p className="pt-2 text-sm text-destructive">{error}</p> : null}
        </form>
      </section>
    </main>
  )
}

function EmptyChat() {
  return (
    <div className="grid h-full place-items-center text-center">
      <div>
        <span className="mx-auto grid size-11 place-items-center rounded-xl bg-black text-white">
          <Bot className="size-5" />
        </span>
        <h1 className="mt-5 text-2xl font-semibold tracking-tight">Chat with Codex</h1>
        <p className="mt-2 text-sm text-muted-foreground">
          Send raw text and watch the live response.
        </p>
      </div>
    </div>
  )
}

function ChatTurnView({ turn }: { turn: ChatTurn }) {
  const [copied, setCopied] = useState(false)
  const result = assistantResult(turn.entries)

  async function copyResult() {
    if (!result) return
    try {
      await navigator.clipboard.writeText(result)
      setCopied(true)
      window.setTimeout(() => setCopied(false), 1_500)
    } catch {
      setCopied(false)
    }
  }

  return (
    <article className="group/turn space-y-5">
      <div className="flex justify-end">
        <pre className="max-w-[75%] whitespace-pre-wrap rounded-2xl bg-muted px-4 py-3 font-sans text-sm">
          {turn.prompt}
        </pre>
      </div>
      <WorkingSeparator turn={turn} />
      <ChatTurnTimeline entries={turn.entries} isWorking={turn.status === 'working'} />
      {result && turn.status !== 'working' ? (
        <div className="flex items-center gap-1 opacity-0 transition-opacity group-focus-within/turn:opacity-100 group-hover/turn:opacity-100">
          <Button
            aria-label={copied ? 'Result copied' : 'Copy result'}
            className="text-muted-foreground"
            onClick={() => void copyResult()}
            size="icon-xs"
            type="button"
            variant="ghost"
          >
            {copied ? <Check /> : <Copy />}
          </Button>
        </div>
      ) : null}
    </article>
  )
}

function assistantResult(entries: TurnEntry[]) {
  return entries
    .filter((entry) => entry.type === 'response')
    .map((entry) => entry.content)
    .join('\n\n')
}

function WorkingSeparator({ turn }: { turn: ChatTurn }) {
  const seconds = useElapsedSeconds(turn)
  const label =
    turn.status === 'working' ? 'Working' : turn.status === 'complete' ? 'Worked' : 'Stopped'

  return (
    <div className="flex items-center gap-3 text-sm" role="status">
      <span className={turn.status === 'working' ? 'zetro-shimmer-text' : 'text-muted-foreground'}>
        {label} for {seconds}s
      </span>
      <span className="h-px flex-1 bg-border" />
    </div>
  )
}

function useElapsedSeconds(turn: ChatTurn) {
  const [now, setNow] = useState(Date.now())

  useEffect(() => {
    if (turn.status !== 'working') return
    const timer = window.setInterval(() => setNow(Date.now()), 250)
    return () => window.clearInterval(timer)
  }, [turn.status])

  return Math.max(0, Math.floor(((turn.completedAt ?? now) - turn.startedAt) / 1000))
}

async function readChatStream(
  stream: ReadableStream<Uint8Array>,
  onEvent: (event: ChatStreamEvent) => void,
) {
  const reader = stream.getReader()
  const decoder = new TextDecoder()
  let buffer = ''

  while (true) {
    const result = await reader.read()
    buffer += decoder.decode(result.value, { stream: !result.done })
    const lines = buffer.split('\n')
    buffer = lines.pop() ?? ''
    for (const line of lines) if (line) onEvent(parseChatStreamEvent(line))
    if (result.done) break
  }
  if (buffer) onEvent(parseChatStreamEvent(buffer))
}
