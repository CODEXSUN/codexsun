import { useEffect, useState } from 'react'
import { Button } from '@codexsun/ui/components/button'
import { Bot, Check, Copy, Layers3, RefreshCw, RotateCcw } from 'lucide-react'
import type { ChatTurnStatus, ChatWorkingSetSourceKind, StoredChatTurn } from '@codexsun/zetro-contracts'
import { ChatTurnTimeline, type TurnEntry } from './chat-turn-timeline'
import { OpenDecisions } from './open-decisions'

export type ChatTurn = {
  completedAt?: number
  entries: TurnEntry[]
  id: string
  lastSequence: number
  prompt: string
  startedAt: number
  status: ChatTurnStatus
}

export type ConnectionState = 'connected' | 'reconnecting'

export function EmptyChat() {
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

export function ChatTurnView({
  actionsDisabled,
  conversationId,
  connectionState,
  onDecisionConfirm,
  onRegenerate,
  onRetry,
  onWorkingSetSelection,
  selectedForPrompt,
  selectedForResponse,
  turn,
}: {
  actionsDisabled: boolean
  conversationId: string
  connectionState: ConnectionState
  onDecisionConfirm: (summary: string) => void
  onRegenerate: () => void
  onRetry: () => void
  onWorkingSetSelection: (sourceKind: ChatWorkingSetSourceKind) => void
  selectedForPrompt: boolean
  selectedForResponse: boolean
  turn: ChatTurn
}) {
  const [copiedPrompt, setCopiedPrompt] = useState(false)
  const [copiedResult, setCopiedResult] = useState(false)
  const result = turn.entries
    .filter((entry) => entry.type === 'response')
    .map((entry) => entry.content)
    .join('\n\n')
  async function copyText(content: string, target: 'prompt' | 'result') {
    if (!content) return
    try {
      await navigator.clipboard.writeText(content)
      const setCopied = target === 'prompt' ? setCopiedPrompt : setCopiedResult
      setCopied(true)
      window.setTimeout(() => setCopied(false), 1_500)
    } catch {
      if (target === 'prompt') setCopiedPrompt(false)
      else setCopiedResult(false)
    }
  }
  return (
    <article className="group/turn space-y-5">
      <div className="group/prompt flex flex-col items-end gap-1">
        <pre className="max-w-[75%] whitespace-pre-wrap rounded-2xl bg-muted px-4 py-3 font-sans text-sm">
          {turn.prompt}
        </pre>
        <div className="flex items-center gap-1 opacity-0 transition-opacity group-focus-within/prompt:opacity-100 group-hover/prompt:opacity-100">
          <Button
            aria-label={copiedPrompt ? 'Prompt copied' : 'Copy prompt'}
            className="text-muted-foreground"
            onClick={() => void copyText(turn.prompt, 'prompt')}
            size="icon-xs"
            type="button"
            variant="ghost"
          >
            {copiedPrompt ? <Check /> : <Copy />}
          </Button>
          <Button
            aria-label="Retry prompt"
            className="text-muted-foreground"
            disabled={actionsDisabled}
            onClick={onRetry}
            size="icon-xs"
            type="button"
            variant="ghost"
          >
            <RotateCcw />
          </Button>
          {turn.status === 'complete' ? (
            <Button
              aria-label={selectedForPrompt ? 'Remove prompt from Working Set' : 'Add prompt to Working Set'}
              className="text-muted-foreground"
              disabled={actionsDisabled}
              onClick={() => onWorkingSetSelection('prompt')}
              size="icon-xs"
              type="button"
              variant="ghost"
            >
              <Layers3 className={selectedForPrompt ? 'fill-current' : undefined} />
            </Button>
          ) : null}
        </div>
      </div>
      <WorkingSeparator connectionState={connectionState} turn={turn} />
      <ChatTurnTimeline entries={turn.entries} isWorking={turn.status === 'working'} />
      {result && turn.status === 'complete' ? <OpenDecisions conversationId={conversationId} disabled={actionsDisabled} onConfirm={onDecisionConfirm} result={result} turnId={turn.id} /> : null}
      {result && turn.status !== 'working' ? (
        <div className="flex items-center gap-1 opacity-0 transition-opacity group-focus-within/turn:opacity-100 group-hover/turn:opacity-100">
          <Button
            aria-label={copiedResult ? 'Result copied' : 'Copy result'}
            className="text-muted-foreground"
            onClick={() => void copyText(result, 'result')}
            size="icon-xs"
            type="button"
            variant="ghost"
          >
            {copiedResult ? <Check /> : <Copy />}
          </Button>
          <Button
            aria-label="Regenerate response"
            className="text-muted-foreground"
            disabled={actionsDisabled}
            onClick={onRegenerate}
            size="icon-xs"
            type="button"
            variant="ghost"
          >
            <RefreshCw />
          </Button>
          {turn.status === 'complete' ? (
            <Button
            aria-label={selectedForResponse ? 'Remove response from Working Set' : 'Add response to Working Set'}
              className="text-muted-foreground"
              disabled={actionsDisabled}
            onClick={() => onWorkingSetSelection('response')}
              size="icon-xs"
              type="button"
              variant="ghost"
            >
              <Layers3 className={selectedForResponse ? 'fill-current' : undefined} />
            </Button>
          ) : null}
        </div>
      ) : null}
    </article>
  )
}

function WorkingSeparator({
  connectionState,
  turn,
}: {
  connectionState: ConnectionState
  turn: ChatTurn
}) {
  const seconds = useElapsedSeconds(turn)
  const label =
    turn.status === 'working'
      ? connectionState === 'reconnecting'
        ? 'Reconnecting'
        : 'Working'
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

export function turnFromStored(turn: StoredChatTurn): ChatTurn {
  const entries: TurnEntry[] = []
  for (const [index, stored] of turn.events.entries()) {
    const { event } = stored
    if (event.type === 'activity')
      entries.push({ id: index + 1, item: event.item, method: event.method, type: 'activity' })
    if (event.type === 'request')
      entries.push({
        id: index + 1,
        item: { prompt: event.content },
        method: 'request',
        type: 'activity',
      })
    if (event.type === 'response') {
      const previous = entries.at(-1)
      if (previous?.type === 'response') previous.content += event.delta
      else entries.push({ content: event.delta, id: index + 1, type: 'response' })
    }
  }
  return { ...turn, entries, lastSequence: turn.events.at(-1)?.sequence ?? 0 }
}
