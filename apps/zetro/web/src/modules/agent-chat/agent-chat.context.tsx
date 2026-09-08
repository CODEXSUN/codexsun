import { useEffect, useRef, useState, type ReactNode } from 'react'
import { AgentChatContext } from './agent-chat.controller'
import {
  createConversation,
  deleteArchivedConversations,
  deleteConversation,
  getConversation,
  listArchivedConversations,
  listConversations,
  requestChatTurn,
  updateConversation,
} from './agent-chat.services'
import type {
  ChatAttachment,
  ChatConversation,
  ChatConversationSummary,
  ChatMessage,
  ChatWorkflow,
} from './agent-chat.types'
import { useProjects } from '../projects'

export function AgentChatProvider({ children }: { children: ReactNode }) {
  const { activeProject } = useProjects()
  const activeIdRef = useRef<string | null>(null)
  const historyRequestRef = useRef(0)
  const [activeId, setActiveId] = useState<string | null>(null)
  const [archivedSummaries, setArchivedSummaries] = useState<ChatConversationSummary[]>([])
  const [error, setError] = useState<string | null>(null)
  const [isBusy, setIsBusy] = useState(false)
  const [isLoadingArchive, setIsLoadingArchive] = useState(false)
  const [isLoadingHistory, setIsLoadingHistory] = useState(true)
  const [messages, setMessages] = useState<ChatMessage[]>([])
  const [model, setModel] = useState('Codex')
  const [summaries, setSummaries] = useState<ChatConversationSummary[]>([])
  const [view, setView] = useState<'archive' | 'chat'>('chat')

  useEffect(() => {
    if (!activeProject) return
    const requestId = ++historyRequestRef.current
    setActive(null)
    setMessages([])
    setArchivedSummaries([])
    setView('chat')
    setIsLoadingHistory(true)
    void loadHistory(activeProject.id, requestId)
  }, [activeProject])

  async function loadHistory(projectId: string, requestId: number) {
    try {
      const loaded = sortSummaries(await listConversations(projectId))
      if (requestId !== historyRequestRef.current) return
      setSummaries(loaded)
      setError(null)
    } catch (reason) {
      if (requestId !== historyRequestRef.current) return
      setError(toMessage(reason, 'Zetro could not load conversation history.'))
    } finally {
      if (requestId === historyRequestRef.current) setIsLoadingHistory(false)
    }
  }

  function setActive(conversationId: string | null) {
    activeIdRef.current = conversationId
    setActiveId(conversationId)
  }

  function updateSummary(conversation: ChatConversation) {
    setSummaries((current) =>
      sortSummaries([conversation, ...current.filter(({ id }) => id !== conversation.id)]),
    )
  }

  async function openConversation(conversationId: string) {
    if (isBusy || !activeProject) return
    setIsBusy(true)
    try {
      const conversation = await getConversation(activeProject.id, conversationId)
      setView('chat')
      setActive(conversation.id)
      setMessages(conversation.messages)
      setError(null)
    } catch (reason) {
      setError(toMessage(reason, 'Zetro could not open this conversation.'))
    } finally {
      setIsBusy(false)
    }
  }

  async function changeConversation(
    conversationId: string,
    update: { pinned?: boolean; title?: string },
  ) {
    if (isBusy || !activeProject) return
    setIsBusy(true)
    try {
      updateSummary(await updateConversation(activeProject.id, conversationId, update))
      setError(null)
    } catch (reason) {
      setError(toMessage(reason, 'Zetro could not update this conversation.'))
    } finally {
      setIsBusy(false)
    }
  }

  async function openArchive() {
    if (isBusy || !activeProject) return
    setView('archive')
    setIsLoadingArchive(true)
    try {
      setArchivedSummaries(sortSummaries(await listArchivedConversations(activeProject.id)))
      setError(null)
    } catch (reason) {
      setError(toMessage(reason, 'Zetro could not load archived chats.'))
    } finally {
      setIsLoadingArchive(false)
    }
  }

  async function archiveConversation(summary: ChatConversationSummary) {
    if (isBusy || !activeProject) return
    setIsBusy(true)
    try {
      const archived = await updateConversation(activeProject.id, summary.id, { archived: true })
      setSummaries((current) => current.filter(({ id }) => id !== summary.id))
      setArchivedSummaries((current) => sortSummaries([archived, ...current]))
      if (activeIdRef.current === summary.id) {
        setActive(null)
        setMessages([])
      }
      setError(null)
    } catch (reason) {
      setError(toMessage(reason, 'Zetro could not archive this conversation.'))
    } finally {
      setIsBusy(false)
    }
  }

  async function restoreConversation(summary: ChatConversationSummary) {
    if (isBusy || !activeProject) return
    setIsBusy(true)
    try {
      const restored = await updateConversation(activeProject.id, summary.id, { archived: false })
      setArchivedSummaries((current) => current.filter(({ id }) => id !== summary.id))
      updateSummary(restored)
      setError(null)
    } catch (reason) {
      setError(toMessage(reason, 'Zetro could not restore this conversation.'))
    } finally {
      setIsBusy(false)
    }
  }

  async function deleteArchivedConversation(conversationId: string) {
    if (isBusy || !activeProject) return
    setIsBusy(true)
    try {
      await deleteConversation(activeProject.id, conversationId)
      setArchivedSummaries((current) => current.filter(({ id }) => id !== conversationId))
      setError(null)
    } catch (reason) {
      setError(toMessage(reason, 'Zetro could not permanently delete this conversation.'))
    } finally {
      setIsBusy(false)
    }
  }

  async function deleteAllArchived() {
    if (isBusy || !activeProject) return
    setIsBusy(true)
    try {
      await deleteArchivedConversations(activeProject.id)
      setArchivedSummaries([])
      setError(null)
    } catch (reason) {
      setError(toMessage(reason, 'Zetro could not permanently delete archived chats.'))
    } finally {
      setIsBusy(false)
    }
  }

  async function sendMessage(
    content: string,
    attachments: ChatAttachment[],
    workflow: ChatWorkflow,
  ) {
    if (isBusy || !activeProject || (!content.trim() && attachments.length === 0)) return

    const userMessage: ChatMessage = {
      attachments,
      content: content.trim(),
      id: crypto.randomUUID(),
      role: 'user',
    }
    const pendingMessages = [...messages, userMessage]
    setMessages(pendingMessages)
    setError(null)
    setIsBusy(true)

    try {
      const conversation = activeIdRef.current
        ? await updateConversation(activeProject.id, activeIdRef.current, {
            messages: pendingMessages,
          })
        : await createConversation(activeProject.id, pendingMessages)
      setActive(conversation.id)
      updateSummary(conversation)

      const response = await requestChatTurn(
        conversation.id,
        activeProject.id,
        pendingMessages,
        workflow,
      )
      const completedMessages: ChatMessage[] = [
        ...pendingMessages,
        {
          attachments: [],
          content: response.message.content,
          execution: response.execution,
          id: response.responseId,
          role: 'assistant',
        },
      ]
      const saved = await updateConversation(activeProject.id, conversation.id, {
        messages: completedMessages,
      })
      setMessages(completedMessages)
      setModel(response.model)
      updateSummary(saved)
    } catch (reason) {
      setError(toMessage(reason, 'Zetro could not complete this turn.'))
    } finally {
      setIsBusy(false)
    }
  }

  return (
    <AgentChatContext.Provider
      value={{
        activeId,
        archivedSummaries,
        archiveConversation,
        deleteAllArchived,
        deleteArchivedConversation,
        error,
        isBusy,
        isLoadingArchive,
        isLoadingHistory,
        messages,
        model,
        summaries,
        view,
        newConversation: () => {
          setView('chat')
          setActive(null)
          setMessages([])
          setError(null)
        },
        openArchive,
        openConversation,
        renameConversation: (conversationId, title) =>
          changeConversation(conversationId, { title: title.trim() }),
        sendMessage,
        restoreConversation,
        showChat: () => setView('chat'),
        togglePin: (summary) => changeConversation(summary.id, { pinned: !summary.pinned }),
      }}
    >
      {children}
    </AgentChatContext.Provider>
  )
}

function sortSummaries(summaries: ChatConversationSummary[]) {
  return [...summaries].sort((left, right) => {
    if (left.pinned !== right.pinned) return left.pinned ? -1 : 1
    return right.updatedAt.localeCompare(left.updatedAt)
  })
}

function toMessage(reason: unknown, fallback: string) {
  return reason instanceof Error ? reason.message : fallback
}
