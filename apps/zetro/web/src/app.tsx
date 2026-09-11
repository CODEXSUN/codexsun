import { useEffect, useRef, useState, type FormEvent, type KeyboardEvent } from 'react'
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
import { ArrowUp, Bot, Check, Copy, Square } from 'lucide-react'
import type { ChatStreamEvent, ChatTurnStatus, StoredChatTurn } from '@codexsun/zetro-contracts'
import {
  fetchChatHistory,
  getChatSessionId,
  startChatTurn,
  stopChatResponse,
  watchChatTurn,
} from './modules/shell/chat.services'
import { ChatTurnTimeline, type TurnEntry } from './modules/shell/chat-turn-timeline'

type ChatTurn = {
  completedAt?: number
  entries: TurnEntry[]
  id: string
  lastSequence: number
  prompt: string
  startedAt: number
  status: ChatTurnStatus
}

export function App() {
  const [turns, setTurns] = useState<ChatTurn[]>([])
  const [prompt, setPrompt] = useState('')
  const [error, setError] = useState('')
  const [isResponding, setIsResponding] = useState(false)
  const [isStopping, setIsStopping] = useState(false)
  const [sessionId] = useState(getChatSessionId)
  const watchControllers = useRef(new Map<string, AbortController>())
  const buildVersion = import.meta.env.VITE_ZETRO_BUILD_VERSION || '2.0.0'

  useEffect(() => {
    let active = true
    fetchChatHistory(sessionId)
      .then((history) => {
        if (!active) return
        setTurns(history.turns.map(turnFromStored))
        const working = history.turns.find((turn) => turn.status === 'working')
        if (working) void watchTurn(working.id, working.events.at(-1)?.sequence ?? 0)
      })
      .catch((reason: unknown) => {
        if (active)
          setError(reason instanceof Error ? reason.message : 'Could not load chat history.')
      })
    return () => {
      active = false
      for (const controller of watchControllers.current.values()) controller.abort()
      watchControllers.current.clear()
    }
  }, [sessionId])

  async function sendPrompt(event?: FormEvent) {
    event?.preventDefault()
    if (!prompt.trim() || isResponding) return

    const rawPrompt = prompt
    const turnId = crypto.randomUUID()
    setTurns((current) => [
      ...current,
      {
        entries: [],
        id: turnId,
        lastSequence: 0,
        prompt: rawPrompt,
        startedAt: Date.now(),
        status: 'working',
      },
    ])
    setPrompt('')
    setError('')
    setIsResponding(true)

    try {
      await startChatTurn(sessionId, turnId, rawPrompt)
      await watchTurn(turnId, 0)
    } catch (reason) {
      const message = reason instanceof Error ? reason.message : 'Could not connect to Codex.'
      setError(message)
      finishTurn(turnId, 'failed')
    } finally {
      setIsResponding(false)
      setIsStopping(false)
    }
  }

  async function watchTurn(turnId: string, afterSequence: number) {
    if (watchControllers.current.has(turnId)) return
    const controller = new AbortController()
    watchControllers.current.set(turnId, controller)
    setIsResponding(true)
    try {
      await watchChatTurn(
        sessionId,
        turnId,
        afterSequence,
        (stored) => {
          applyStreamEvent(turnId, stored.event)
          updateTurn(turnId, (turn) => ({ ...turn, lastSequence: stored.sequence }))
        },
        controller.signal,
      )
    } catch (reason) {
      if (!controller.signal.aborted) {
        setError(reason instanceof Error ? reason.message : 'Could not restore the Codex stream.')
      }
    } finally {
      watchControllers.current.delete(turnId)
      if (!controller.signal.aborted) {
        setIsResponding(false)
        setIsStopping(false)
      }
    }
  }

  async function stopResponse() {
    if (!isResponding || isStopping) return
    setIsStopping(true)
    try {
      await stopChatResponse(sessionId)
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : 'Codex could not be stopped.')
      setIsStopping(false)
    }
  }

  function applyStreamEvent(turnId: string, event: ChatStreamEvent) {
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
    if (event.type === 'stopped') {
      finishTurn(turnId, 'stopped')
      return
    }
    setError(event.message)
    finishTurn(turnId, 'failed')
  }

  function appendActivity(turnId: string, method: string, item: Record<string, unknown>) {
    updateTurn(turnId, (turn) => ({
      ...turn,
      entries: [
        ...turn.entries,
        { id: Date.now() + turn.entries.length, item, method, type: 'activity' },
      ],
    }))
  }

  function appendResponse(turnId: string, delta: string) {
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

  function finishTurn(turnId: string, status: ChatTurn['status']) {
    updateTurn(turnId, (turn) => ({ ...turn, completedAt: Date.now(), status }))
  }

  function updateTurn(turnId: string, updater: (turn: ChatTurn) => ChatTurn) {
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
              {isResponding ? (
                <Button
                  aria-label={isStopping ? 'Stopping response' : 'Stop response'}
                  className="zetro-stop-shimmer cursor-pointer"
                  disabled={isStopping}
                  onClick={() => void stopResponse()}
                  size="icon"
                  type="button"
                  variant="neutral"
                >
                  <Square className="size-3 fill-current" />
                </Button>
              ) : (
                <Button
                  aria-label="Send prompt"
                  className="cursor-pointer"
                  disabled={!prompt.trim()}
                  size="icon"
                  type="submit"
                >
                  <ArrowUp />
                </Button>
              )}
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
    turn.status === 'working'
      ? 'Working'
      : turn.status === 'complete'
        ? 'Worked'
        : turn.status === 'stopped'
          ? 'Stopped'
          : 'Failed'

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

function turnFromStored(turn: StoredChatTurn): ChatTurn {
  const entries: TurnEntry[] = []
  for (const [index, stored] of turn.events.entries()) {
    const { event } = stored
    if (event.type === 'activity') {
      entries.push({ id: index + 1, item: event.item, method: event.method, type: 'activity' })
    }
    if (event.type === 'request') {
      entries.push({
        id: index + 1,
        item: { prompt: event.content },
        method: 'request',
        type: 'activity',
      })
    }
    if (event.type === 'response') {
      const previous = entries.at(-1)
      if (previous?.type === 'response') previous.content += event.delta
      else entries.push({ content: event.delta, id: index + 1, type: 'response' })
    }
  }
  return { ...turn, entries, lastSequence: turn.events.at(-1)?.sequence ?? 0 }
}
