import { useEffect, useRef, useState } from 'react'
import type { ChatStreamEvent } from '@codexsun/zetro-contracts'
import { fetchChatHistory, startChatTurn, stopChatResponse, watchChatTurn } from './chat.services'
import { turnFromStored, type ChatTurn, type ConnectionState } from './chat-turn-view'

export type ConversationRuntime = {
  connectionState: ConnectionState
  error: string
  isStopping: boolean
  loaded: boolean
  turns: ChatTurn[]
}

const emptyRuntime: ConversationRuntime = {
  connectionState: 'connected',
  error: '',
  isStopping: false,
  loaded: false,
  turns: [],
}

export function useConcurrentChat(onRegistryRefresh: () => void) {
  const [runtimes, setRuntimes] = useState<Record<string, ConversationRuntime>>({})
  const runtimesRef = useRef(runtimes)
  const watchControllers = useRef(new Map<string, AbortController>())
  const historyLoads = useRef(new Map<string, number>())

  useEffect(() => {
    runtimesRef.current = runtimes
  }, [runtimes])

  useEffect(
    () => () => {
      for (const controller of watchControllers.current.values()) controller.abort()
      watchControllers.current.clear()
    },
    [],
  )

  async function loadConversation(conversationId: string) {
    if (runtimesRef.current[conversationId]?.loaded) return
    const sequence = (historyLoads.current.get(conversationId) ?? 0) + 1
    historyLoads.current.set(conversationId, sequence)
    try {
      const history = await fetchChatHistory(conversationId)
      if (historyLoads.current.get(conversationId) !== sequence) return
      const turns = history.turns.map(turnFromStored)
      updateRuntime(conversationId, (runtime) => ({
        ...runtime,
        error: '',
        loaded: true,
        turns,
      }))
      const working = turns.find((turn) => turn.status === 'working')
      if (working) void watchTurn(conversationId, working.id, working.lastSequence)
    } catch (reason) {
      updateRuntime(conversationId, (runtime) => ({
        ...runtime,
        error: errorMessage(reason, 'Could not load chat history.'),
        loaded: true,
      }))
    }
  }

  async function startPrompt(conversationId: string, rawPrompt: string, imageIds: string[] = []) {
    const runtime = runtimeFor(conversationId)
    if (!rawPrompt.trim() || isRuntimeWorking(runtime)) return false
    const turnId = crypto.randomUUID()
    updateRuntime(conversationId, (current) => ({
      ...current,
      error: '',
      loaded: true,
      turns: [
        ...current.turns,
        {
          entries: [],
          id: turnId,
          lastSequence: 0,
          prompt: rawPrompt,
          startedAt: Date.now(),
          status: 'working',
        },
      ],
    }))
    try {
      await startChatTurn(conversationId, turnId, rawPrompt, imageIds)
      onRegistryRefresh()
      await watchTurn(conversationId, turnId, 0)
    } catch (reason) {
      updateRuntime(conversationId, (current) => ({
        ...finishRuntimeTurn(current, turnId, 'failed'),
        error: errorMessage(reason, 'Could not connect to Codex.'),
      }))
    } finally {
      onRegistryRefresh()
    }
    return true
  }

  async function stopResponse(conversationId: string) {
    const runtime = runtimeFor(conversationId)
    if (runtime.isStopping) return
    const activeTurn = runtime.turns.find((turn) => turn.status === 'working')
    if (!activeTurn) return
    updateRuntime(conversationId, (current) => ({ ...current, isStopping: true }))
    try {
      await stopChatResponse(conversationId, activeTurn.id)
    } catch (reason) {
      updateRuntime(conversationId, (current) => ({
        ...current,
        error: errorMessage(reason, 'Codex could not be stopped.'),
        isStopping: false,
      }))
    }
  }

  function clearError(conversationId: string) {
    updateRuntime(conversationId, (runtime) => ({ ...runtime, error: '' }))
  }

  function runtimeFor(conversationId?: string): ConversationRuntime {
    return conversationId ? (runtimesRef.current[conversationId] ?? emptyRuntime) : emptyRuntime
  }

  async function watchTurn(conversationId: string, turnId: string, afterSequence: number) {
    if (watchControllers.current.has(turnId)) return
    const controller = new AbortController()
    watchControllers.current.set(turnId, controller)
    try {
      await watchChatTurn(
        conversationId,
        turnId,
        afterSequence,
        (stored) => {
          applyStreamEvent(conversationId, turnId, stored.event)
          updateTurn(conversationId, turnId, (turn) => ({
            ...turn,
            lastSequence: stored.sequence,
          }))
        },
        (connectionState) =>
          updateRuntime(conversationId, (runtime) => ({ ...runtime, connectionState })),
        controller.signal,
      )
    } catch (reason) {
      if (!controller.signal.aborted) {
        updateRuntime(conversationId, (runtime) => ({
          ...finishRuntimeTurn(runtime, turnId, 'failed'),
          error: errorMessage(reason, 'Could not restore the Codex stream.'),
        }))
      }
    } finally {
      watchControllers.current.delete(turnId)
      updateRuntime(conversationId, (runtime) => ({ ...runtime, isStopping: false }))
      onRegistryRefresh()
    }
  }

  function applyStreamEvent(conversationId: string, turnId: string, event: ChatStreamEvent) {
    if (event.type === 'request')
      return appendActivity(conversationId, turnId, 'request', { prompt: event.content })
    if (event.type === 'activity')
      return appendActivity(conversationId, turnId, event.method, event.item)
    if (event.type === 'response') return appendResponse(conversationId, turnId, event.delta)
    if (event.type === 'complete') return finishTurn(conversationId, turnId, 'complete')
    if (event.type === 'stopped') return finishTurn(conversationId, turnId, 'stopped')
    updateRuntime(conversationId, (runtime) => ({
      ...finishRuntimeTurn(runtime, turnId, 'failed'),
      error: event.message,
    }))
  }

  function appendActivity(
    conversationId: string,
    turnId: string,
    method: string,
    item: Record<string, unknown>,
  ) {
    updateTurn(conversationId, turnId, (turn) => ({
      ...turn,
      entries: [
        ...turn.entries,
        { id: Date.now() + turn.entries.length, item, method, type: 'activity' },
      ],
    }))
  }

  function appendResponse(conversationId: string, turnId: string, delta: string) {
    updateTurn(conversationId, turnId, (turn) => {
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

  function finishTurn(conversationId: string, turnId: string, status: ChatTurn['status']) {
    updateRuntime(conversationId, (runtime) => finishRuntimeTurn(runtime, turnId, status))
  }

  function updateTurn(
    conversationId: string,
    turnId: string,
    updater: (turn: ChatTurn) => ChatTurn,
  ) {
    updateRuntime(conversationId, (runtime) => ({
      ...runtime,
      turns: runtime.turns.map((turn) => (turn.id === turnId ? updater(turn) : turn)),
    }))
  }

  function updateRuntime(
    conversationId: string,
    updater: (runtime: ConversationRuntime) => ConversationRuntime,
  ) {
    setRuntimes((current) => {
      const next = {
        ...current,
        [conversationId]: updater(current[conversationId] ?? emptyRuntime),
      }
      runtimesRef.current = next
      return next
    })
  }

  return { clearError, loadConversation, runtimeFor, runtimes, startPrompt, stopResponse }
}

export function isRuntimeWorking(runtime: ConversationRuntime) {
  return runtime.turns.some((turn) => turn.status === 'working')
}

function finishRuntimeTurn(
  runtime: ConversationRuntime,
  turnId: string,
  status: ChatTurn['status'],
): ConversationRuntime {
  return {
    ...runtime,
    turns: runtime.turns.map((turn) =>
      turn.id === turnId ? { ...turn, completedAt: Date.now(), status } : turn,
    ),
  }
}

function errorMessage(reason: unknown, fallback: string) {
  return reason instanceof Error ? reason.message : fallback
}
