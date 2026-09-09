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
  stopChatTurn,
  updateConversation,
} from './agent-chat.services'
import type {
  ChatAttachment,
  ChatConversation,
  ChatConversationSummary,
  ChatMessage,
  ChatWorkspaceScope,
  ChatWorkflow,
} from './agent-chat.types'
import { useProjects } from '../projects'

export function AgentChatProvider({ children }: { children: ReactNode }) {
  const { activeProject } = useProjects()
  const activeIdRef = useRef<string | null>(null)
  const historyRequestRef = useRef(0)
  const responseAbortRef = useRef<AbortController | null>(null)
  const stopRequestedRef = useRef(false)
  const [activeId, setActiveId] = useState<string | null>(null)
  const [archivedSummaries, setArchivedSummaries] = useState<ChatConversationSummary[]>([])
  const [error, setError] = useState<string | null>(null)
  const [isBusy, setIsBusy] = useState(false)
  const [isLoadingArchive, setIsLoadingArchive] = useState(false)
  const [isLoadingHistory, setIsLoadingHistory] = useState(true)
  const [messages, setMessages] = useState<ChatMessage[]>([])
  const [model, setModel] = useState('Codex')
  const [scope, setScope] = useState<ChatWorkspaceScope | null>(null)
  const [scopeOpen, setScopeOpen] = useState(false)
  const [summaries, setSummaries] = useState<ChatConversationSummary[]>([])
  const [view, setView] = useState<'archive' | 'chat'>('chat')
  const [workingSince, setWorkingSince] = useState<number | null>(null)

  useEffect(() => {
    if (!activeProject) return
    const requestId = ++historyRequestRef.current
    setActive(null)
    setMessages([])
    setScope(null)
    setScopeOpen(false)
    setWorkingSince(null)
    responseAbortRef.current?.abort()
    responseAbortRef.current = null
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
      setScope(conversation.scope ?? null)
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
        setScope(null)
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
    if (!scope) {
      setError('Connect this chat to an application folder before sending a message.')
      setScopeOpen(true)
      return
    }

    const userMessage: ChatMessage = {
      attachments,
      content: content.trim(),
      createdAt: new Date().toISOString(),
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
        : await createConversation(activeProject.id, pendingMessages, scope)
      setActive(conversation.id)
      updateSummary(conversation)

      const responseAbort = new AbortController()
      responseAbortRef.current = responseAbort
      stopRequestedRef.current = false
      setWorkingSince(Date.now())
      const response = await requestChatTurn(
        conversation.id,
        activeProject.id,
        pendingMessages,
        workflow,
        responseAbort.signal,
      )
      const completedMessages: ChatMessage[] = [
        ...pendingMessages,
        {
          attachments: [],
          content: response.message.content,
          createdAt: new Date().toISOString(),
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
      if (!stopRequestedRef.current) {
        setError(toMessage(reason, 'Zetro could not complete this turn.'))
      }
    } finally {
      responseAbortRef.current = null
      stopRequestedRef.current = false
      setWorkingSince(null)
      setIsBusy(false)
    }
  }

  async function stopWorking() {
    const conversationId = activeIdRef.current
    const responseAbort = responseAbortRef.current
    if (!conversationId || !activeProject || !responseAbort) return

    stopRequestedRef.current = true
    setWorkingSince(null)
    setError(null)
    try {
      await stopChatTurn(conversationId, activeProject.id)
    } catch {
      // The local request still stops even if the provider already completed.
    } finally {
      responseAbort.abort()
    }
  }

  async function openScope(conversationId?: string) {
    if (conversationId && conversationId !== activeIdRef.current) {
      await openConversation(conversationId)
    }
    setScopeOpen(true)
  }

  async function saveScope(nextScope: ChatWorkspaceScope) {
    if (isBusy || !activeProject) return
    setIsBusy(true)
    try {
      if (activeIdRef.current) {
        const conversation = await updateConversation(activeProject.id, activeIdRef.current, {
          scope: nextScope,
        })
        updateSummary(conversation)
        setScope(conversation.scope ?? nextScope)
      } else {
        setScope(nextScope)
      }
      setScopeOpen(false)
      setError(null)
    } catch (reason) {
      setError(toMessage(reason, 'Zetro could not connect this chat folder.'))
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
        scope,
        scopeOpen,
        summaries,
        view,
        workingSince,
        newConversation: () => {
          setView('chat')
          setActive(null)
          setMessages([])
          setScope(null)
          setScopeOpen(false)
          setWorkingSince(null)
          setError(null)
        },
        openArchive,
        openConversation,
        openScope,
        renameConversation: (conversationId, title) =>
          changeConversation(conversationId, { title: title.trim() }),
        sendMessage,
        saveScope,
        setScopeOpen,
        restoreConversation,
        showChat: () => setView('chat'),
        stopWorking,
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
