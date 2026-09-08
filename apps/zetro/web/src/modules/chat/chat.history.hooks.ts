import { useCallback, useEffect, useRef, useState } from 'react'
import {
  createConversation,
  getConversation,
  listConversations,
  updateConversation,
} from './chat.services'
import type { ChatConversationSummary, ChatMessage } from './chat.types'

export function useConversationHistory() {
  const activeIdRef = useRef<string | null>(null)
  const [activeId, setActiveId] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [summaries, setSummaries] = useState<ChatConversationSummary[]>([])

  const refresh = useCallback(async () => {
    try {
      setSummaries(await listConversations())
      setError(null)
    } catch (reason) {
      setError(toMessage(reason))
    } finally {
      setIsLoading(false)
    }
  }, [])

  useEffect(() => {
    void refresh()
  }, [refresh])

  const open = useCallback(async (conversationId: string) => {
    try {
      const conversation = await getConversation(conversationId)
      setActive(conversationId)
      setError(null)
      return conversation.messages
    } catch (reason) {
      setError(toMessage(reason))
      return null
    }
  }, [])

  const saveMessages = useCallback(
    async (messages: readonly ChatMessage[], conversationId?: string | null) => {
      try {
        const targetId = conversationId ?? activeIdRef.current
        const conversation = targetId
          ? await updateConversation(targetId, { messages })
          : await createConversation(messages)
        setActive(conversation.id)
        updateSummary(conversation)
        setError(null)
        return conversation.id
      } catch (reason) {
        setError(toMessage(reason))
        return null
      }
    },
    [],
  )

  const rename = useCallback(async (conversationId: string, title: string) => {
    await updateMetadata(conversationId, { title: title.trim() })
  }, [])

  const togglePin = useCallback(async (summary: ChatConversationSummary) => {
    await updateMetadata(summary.id, { pinned: !summary.pinned })
  }, [])

  function updateSummary(summary: ChatConversationSummary): void {
    setSummaries((current) =>
      sortSummaries([summary, ...current.filter(({ id }) => id !== summary.id)]),
    )
  }

  async function updateMetadata(
    conversationId: string,
    update: { pinned?: boolean; title?: string },
  ): Promise<void> {
    try {
      updateSummary(await updateConversation(conversationId, update))
      setError(null)
    } catch (reason) {
      setError(toMessage(reason))
    }
  }

  function setActive(conversationId: string | null): void {
    activeIdRef.current = conversationId
    setActiveId(conversationId)
  }

  return {
    activeId,
    error,
    isLoading,
    newConversation: () => setActive(null),
    open,
    refresh,
    rename,
    saveMessages,
    summaries,
    togglePin,
  }
}

function sortSummaries(summaries: ChatConversationSummary[]): ChatConversationSummary[] {
  return summaries.sort((left, right) => {
    if (left.pinned !== right.pinned) return left.pinned ? -1 : 1
    return right.updatedAt.localeCompare(left.updatedAt)
  })
}

function toMessage(reason: unknown): string {
  return reason instanceof Error ? reason.message : 'Zetro could not load conversation history.'
}
