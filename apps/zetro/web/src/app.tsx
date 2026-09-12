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
import type { AgentWorkspaceRail } from '@codexsun/ui/layouts/agent-workspace'
import { MdiMain } from '@codexsun/ui/layouts/mdi-main'
import {
  Archive,
  ArrowUp,
  Bot,
  ClipboardList,
  GitBranch,
  CalendarClock,
  MessageCircle,
  Settings,
  Square,
} from 'lucide-react'
import type {
  AgentTaskDraft,
  AgentTaskPlan,
  AgentTaskSummary,
  ChatConversationProvider,
  ChatConversationSummary,
  ChatHandoffItem,
  Runbook,
  RunbookCreateRequest,
  RunbookRun,
  ProviderSettingsResponse,
} from '@codexsun/zetro-contracts'
import {
  AgentTaskRegistry,
  AgentTaskWorkspace,
  archiveAgentTask,
  confirmAgentTaskReview,
  createAgentTaskFromHandoffTray,
  fetchAgentTask,
  fetchAgentTasks,
  saveAgentTaskPlan,
} from './modules/agent-tasks'
import {
  CodingWorkerRegistry,
  CodingWorkerWorkspace,
  useCodingWorkers,
} from './modules/coding-workers'
import {
  RunbookWorkspace,
  RunbookRegistry,
  createRunbook,
  fetchRunbookRuns,
  fetchRunbooks,
  setRunbookEnabled,
  startRunbook,
  stopRunbookRun,
} from './modules/runbooks'
import { ProviderHeaderSwitcher } from './modules/providers/provider-header-switcher'
import { ProviderSettings } from './modules/providers/provider-settings'
import { fetchProviderSettings } from './modules/providers/provider.services'
import {
  createChatConversation,
  fetchConversationRegistry,
  fetchHandoffTray,
  getChatConversationId,
  setChatConversationId,
  setHandoffSelection,
  updateChatConversation,
} from './modules/shell/chat.services'
import { ChatTurnView, EmptyChat } from './modules/shell/chat-turn-view'
import { ConversationRegistry } from './modules/shell/conversation-registry'
import { HandoffTray, HandoffTrayButton } from './modules/shell/handoff-tray'
import { isRuntimeWorking, useConcurrentChat } from './modules/shell/use-concurrent-chat'

type WorkspaceView = 'chat' | 'settings' | 'tasks' | 'workers' | 'runbooks'

export function App() {
  const [prompt, setPrompt] = useState('')
  const [handoffItems, setHandoffItems] = useState<ChatHandoffItem[]>([])
  const [handoffOpen, setHandoffOpen] = useState(false)
  const [shellError, setShellError] = useState('')
  const [conversationId, setConversationId] = useState<string>()
  const [conversations, setConversations] = useState<ChatConversationSummary[]>([])
  const [registryScope, setRegistryScope] = useState<'active' | 'archived'>('active')
  const [registryBusy, setRegistryBusy] = useState(true)
  const [search, setSearch] = useState('')
  const [view, setView] = useState<WorkspaceView>('chat')
  const [providerSettings, setProviderSettings] = useState<ProviderSettingsResponse>()
  const [tasks, setTasks] = useState<AgentTaskSummary[]>([])
  const [selectedTask, setSelectedTask] = useState<AgentTaskDraft>()
  const [tasksBusy, setTasksBusy] = useState(false)
  const [runbooks, setRunbooks] = useState<Runbook[]>([])
  const [runbookRuns, setRunbookRuns] = useState<RunbookRun[]>([])
  const [selectedRunbookId, setSelectedRunbookId] = useState<string>()
  const [runbooksBusy, setRunbooksBusy] = useState(false)
  const [providerSwitching, setProviderSwitching] = useState(false)
  const workers = useCodingWorkers(view === 'workers', setShellError)
  const registryLoadSequence = useRef(0)
  const buildVersion = import.meta.env.VITE_ZETRO_BUILD_VERSION || '2.0.0'
  const chat = useConcurrentChat(() => void refreshRegistry())
  const runtime = chat.runtimeFor(conversationId)
  const isResponding = isRuntimeWorking(runtime)

  useEffect(() => {
    const loadSequence = ++registryLoadSequence.current
    async function loadRegistry() {
      try {
        let items = await fetchConversationRegistry('all')
        if (registryLoadSequence.current !== loadSequence) return
        const storedId = getChatConversationId()
        const stored = items.find(({ id }) => id === storedId)
        let selected = stored && !stored.archivedAt ? stored : undefined
        selected ??= items.find(({ archivedAt }) => !archivedAt)
        if (!selected) {
          selected = await createChatConversation()
          if (registryLoadSequence.current !== loadSequence) return
          items = [selected, ...items]
        }
        setConversations(items)
        selectConversation(selected.id)
      } catch (reason) {
        if (registryLoadSequence.current === loadSequence) {
          setShellError(errorMessage(reason, 'Could not load conversation history.'))
        }
      } finally {
        if (registryLoadSequence.current === loadSequence) setRegistryBusy(false)
      }
    }
    void loadRegistry()
    return () => {
      if (registryLoadSequence.current === loadSequence) registryLoadSequence.current += 1
    }
  }, [])

  useEffect(() => {
    fetchProviderSettings()
      .then(setProviderSettings)
      .catch((reason: unknown) => {
        setShellError(errorMessage(reason, 'Could not load provider settings.'))
      })
  }, [])

  useEffect(() => {
    fetchHandoffTray().then(setHandoffItems).catch((reason: unknown) => {
      setShellError(errorMessage(reason, 'Could not load the Handoff Tray.'))
    })
  }, [])

  async function sendPrompt(event?: FormEvent) {
    event?.preventDefault()
    if (!conversationId) return
    const rawPrompt = prompt
    setPrompt('')
    const started = await chat.startPrompt(conversationId, rawPrompt)
    if (!started) setPrompt(rawPrompt)
  }

  async function repeatPrompt(rawPrompt: string) {
    if (conversationId) await chat.startPrompt(conversationId, rawPrompt)
  }

  async function refreshRegistry() {
    try {
      setConversations(await fetchConversationRegistry('all'))
    } catch (reason) {
      setShellError(errorMessage(reason, 'Could not refresh conversation history.'))
    }
  }

  async function createConversation() {
    setRegistryBusy(true)
    try {
      const conversation = await createChatConversation()
      setConversations((current) => [conversation, ...current])
      setRegistryScope('active')
      selectConversation(conversation.id)
    } catch (reason) {
      setShellError(errorMessage(reason, 'Could not create the conversation.'))
    } finally {
      setRegistryBusy(false)
    }
  }

  async function renameConversation(targetId: string, title: string) {
    await updateConversation(targetId, { title }, 'Could not rename the conversation.')
  }

  async function archiveConversation(targetId: string) {
    setRegistryBusy(true)
    try {
      const updated = await updateChatConversation(targetId, { archived: true })
      const nextConversations = conversations.map((item) => (item.id === targetId ? updated : item))
      setConversations(nextConversations)
      if (targetId === conversationId) {
        const next = nextConversations.find(({ archivedAt }) => !archivedAt)
        if (next) selectConversation(next.id)
        else await createConversation()
      }
    } catch (reason) {
      setShellError(errorMessage(reason, 'Could not archive the conversation.'))
    } finally {
      setRegistryBusy(false)
    }
  }

  async function restoreConversation(targetId: string) {
    const updated = await updateConversation(
      targetId,
      { archived: false },
      'Could not restore the conversation.',
    )
    if (!updated) return
    setRegistryScope('active')
    selectConversation(targetId)
  }

  async function updateConversation(
    targetId: string,
    update: { archived?: boolean; title?: string },
    fallback: string,
  ) {
    setRegistryBusy(true)
    try {
      const updated = await updateChatConversation(targetId, update)
      setConversations((current) => current.map((item) => (item.id === targetId ? updated : item)))
      return updated
    } catch (reason) {
      setShellError(errorMessage(reason, fallback))
      return undefined
    } finally {
      setRegistryBusy(false)
    }
  }

  function selectConversation(targetId: string) {
    setChatConversationId(targetId)
    setConversationId(targetId)
    setView('chat')
    setShellError('')
    chat.clearError(targetId)
    void chat.loadConversation(targetId)
  }

  function updateConversationProvider(targetId: string, provider: ChatConversationProvider) {
    setConversations((current) =>
      current.map((conversation) =>
        conversation.id === targetId
          ? { ...conversation, provider, updatedAt: provider.verifiedAt ?? Date.now() }
          : conversation,
      ),
    )
  }

  async function openTasks(taskId?: string) {
    setView('tasks')
    setTasksBusy(true)
    setShellError('')
    try {
      const nextTasks = await fetchAgentTasks()
      setTasks(nextTasks)
      const nextTaskId = taskId ?? selectedTask?.id ?? nextTasks[0]?.id
      setSelectedTask(nextTaskId ? await fetchAgentTask(nextTaskId) : undefined)
    } catch (reason) {
      setShellError(errorMessage(reason, 'Could not load Agent Tasks.'))
    } finally {
      setTasksBusy(false)
    }
  }

  async function selectTask(taskId: string) {
    setTasksBusy(true)
    try {
      setSelectedTask(await fetchAgentTask(taskId))
    } catch (reason) {
      setShellError(errorMessage(reason, 'Could not load the task draft.'))
    } finally {
      setTasksBusy(false)
    }
  }

  async function openWorkers() {
    setView('workers')
    setShellError('')
    try {
      await workers.refresh()
      if (!selectedTask) {
        const nextTasks = await fetchAgentTasks()
        setTasks(nextTasks)
        setSelectedTask(nextTasks[0] ? await fetchAgentTask(nextTasks[0].id) : undefined)
      }
    } catch (reason) {
      setShellError(errorMessage(reason, 'Could not load coding workers.'))
    }
  }

  async function openRunbooks() {
    setView('runbooks')
    setRunbooksBusy(true)
    setShellError('')
    try {
      const [nextRunbooks, nextRuns] = await Promise.all([fetchRunbooks(), fetchRunbookRuns()])
      setRunbooks(nextRunbooks)
      setRunbookRuns(nextRuns)
      setSelectedRunbookId((current) =>
        current && nextRunbooks.some((runbook) => runbook.id === current)
          ? current
          : nextRunbooks[0]?.id,
      )
    } catch (reason) {
      setShellError(errorMessage(reason, 'Could not load runbooks.'))
    } finally { setRunbooksBusy(false) }
  }

  async function saveRunbook(input: RunbookCreateRequest) {
    setRunbooksBusy(true)
    try { const runbook = await createRunbook(input); setRunbooks((current) => [runbook, ...current]); setSelectedRunbookId(runbook.id) }
    catch (reason) { setShellError(errorMessage(reason, 'Could not create the runbook.')) }
    finally { setRunbooksBusy(false) }
  }

  async function updateRunbookEnabled(id: string, enabled: boolean) {
    setRunbooksBusy(true)
    try { const runbook = await setRunbookEnabled(id, enabled); setRunbooks((current) => current.map((item) => item.id === id ? runbook : item)) }
    catch (reason) { setShellError(errorMessage(reason, 'Could not update the runbook.')) }
    finally { setRunbooksBusy(false) }
  }

  async function runRunbook(id: string) {
    setRunbooksBusy(true)
    try { const run = await startRunbook(id); setRunbookRuns((current) => [run, ...current]) }
    catch (reason) { setShellError(errorMessage(reason, 'Could not start the runbook.')) }
    finally { setRunbooksBusy(false) }
  }

  async function stopRunbook(id: string) {
    setRunbooksBusy(true)
    try { const run = await stopRunbookRun(id); setRunbookRuns((current) => current.map((item) => item.id === run.id ? run : item)) }
    catch (reason) { setShellError(errorMessage(reason, 'Could not stop the runbook.')) }
    finally { setRunbooksBusy(false) }
  }
  async function saveTaskPlan(taskId: string, plan: AgentTaskPlan) {
    setTasksBusy(true)
    setShellError('')
    try {
      const task = await saveAgentTaskPlan(taskId, plan)
      setSelectedTask(task)
      setTasks((current) =>
        current.map((item) =>
          item.id === task.id ? { ...item, updatedAt: task.updatedAt } : item,
        ),
      )
    } catch (reason) {
      setShellError(errorMessage(reason, 'Could not save the task plan.'))
    } finally {
      setTasksBusy(false)
    }
  }
  async function confirmTaskReview(taskId: string) {
    setTasksBusy(true)
    setShellError('')
    try {
      const task = await confirmAgentTaskReview(taskId)
      setSelectedTask(task)
      setTasks((current) =>
        current.map((item) =>
          item.id === task.id ? { ...item, updatedAt: task.updatedAt } : item,
        ),
      )
    } catch (reason) {
      setShellError(errorMessage(reason, 'Could not confirm the task review.'))
    } finally {
      setTasksBusy(false)
    }
  }
  async function archiveTask(taskId: string) {
    setTasksBusy(true)
    try {
      await archiveAgentTask(taskId)
      const remaining = tasks.filter((task) => task.id !== taskId)
      setTasks(remaining)
      setSelectedTask(remaining[0] ? await fetchAgentTask(remaining[0].id) : undefined)
    } catch (reason) {
      setShellError(errorMessage(reason, 'Could not archive the task.'))
    } finally {
      setTasksBusy(false)
    }
  }
  async function setTurnHandoff(turnId: string, selected: boolean) {
    if (!conversationId) return
    try {
      setHandoffItems(await setHandoffSelection(conversationId, turnId, selected))
    } catch (reason) {
      setShellError(errorMessage(reason, 'Could not update the Handoff Tray.'))
    }
  }
  function reviewHandoffTray() {
    setPrompt([
      'Consolidate the selected Handoff Tray responses into one refined task proposal.',
      'Return goal, scope, exclusions, acceptance criteria, verification checks, and open decisions.',
      'Do not write code or create a task.',
      '',
      ...handoffItems.map((item, index) => `## Selected response ${index + 1} · ${item.conversationTitle}\n${item.response}`),
    ].join('\n'))
    setHandoffOpen(false)
  }
  async function handoffTrayToTask() {
    setTasksBusy(true)
    try {
      const task = await createAgentTaskFromHandoffTray()
      setSelectedTask(task)
      await openTasks(task.id)
    } catch (reason) {
      setShellError(errorMessage(reason, 'Could not create a task draft from the Handoff Tray.'))
    } finally {
      setTasksBusy(false)
    }
  }
  function handleComposerKeyDown(event: KeyboardEvent<HTMLTextAreaElement>) {
    if (event.key !== 'Enter' || event.shiftKey) return
    event.preventDefault()
    void sendPrompt()
  }

  const selectedConversation = conversations.find(({ id }) => id === conversationId)
  const activeCount = conversations.filter(({ archivedAt }) => !archivedAt).length
  const archivedCount = conversations.length - activeCount
  const workingIds = new Set(
    Object.entries(chat.runtimes)
      .filter(([, conversationRuntime]) => isRuntimeWorking(conversationRuntime))
      .map(([id]) => id),
  )
  const primaryRail: AgentWorkspaceRail = {
    items: [
      {
        active: view === 'chat' && registryScope === 'active',
        badge: activeCount,
        icon: MessageCircle,
        id: 'conversations',
        label: 'Conversations',
        onSelect: () => {
          setRegistryScope('active')
          setView('chat')
        },
      },
      {
        active: view === 'chat' && registryScope === 'archived',
        badge: archivedCount,
        icon: Archive,
        id: 'archived-conversations',
        label: 'Archived conversations',
        onSelect: () => {
          setRegistryScope('archived')
          setView('chat')
        },
      },
      {
        active: view === 'tasks',
        badge: tasks.length,
        icon: ClipboardList,
        id: 'agent-tasks',
        label: 'Task queue',
        onSelect: () => void openTasks(),
      },
      {
        active: view === 'workers',
        badge: workers.attempts.length,
        icon: GitBranch,
        id: 'coding-workers',
        label: 'Worker queue',
        onSelect: () => void openWorkers(),
      },
      {
        active: view === 'runbooks',
        badge: runbooks.length,
        icon: CalendarClock,
        id: 'runbooks',
        label: 'Runbooks',
        onSelect: () => void openRunbooks(),
      },
    ],
    label: 'Zetro activities',
  }
  const secondaryRail: AgentWorkspaceRail = {
    items: [
      {
        active: view === 'settings',
        icon: Settings,
        id: 'provider-settings',
        label: 'Settings',
        onSelect: () => setView((current) => (current === 'settings' ? 'chat' : 'settings')),
      },
    ],
    label: 'Conversation utilities',
  }
  const statusLabel = workingIds.size
    ? `${workingIds.size} ${workingIds.size === 1 ? 'chat' : 'chats'} working`
    : 'Ready'

  return (
    <MdiMain
      agentWorkspace={{ primaryRail, secondaryRail }}
      applicationIcon={Bot}
      applicationId="zetro"
      applicationName="Zetro"
      defaultFeatures={{
        appSwitcher: false,
        notifications: false,
        profileMenu: false,
        secondaryUtilityRail: true,
      }}
      navigation={[]}
      primaryAction={null}
      searchPlaceholder={view === 'chat' ? 'Search conversations' : 'Search task or worker records'}
      searchValue={search}
      showTopologyTools={false}
      sidebarContent={
        view === 'runbooks' ? (
          <RunbookRegistry
            query={search}
            runbooks={runbooks}
            selectedId={selectedRunbookId}
            onCreate={() => setSelectedRunbookId(undefined)}
            onSelect={setSelectedRunbookId}
          />
        ) : view === 'workers' ? (
          <CodingWorkerRegistry attempts={workers.attempts} />
        ) : view === 'tasks' ? (
          <AgentTaskRegistry
            busy={tasksBusy}
            query={search}
            selectedId={selectedTask?.id}
            tasks={tasks}
            onSelect={(id) => void selectTask(id)}
          />
        ) : (
          <ConversationRegistry
            busy={registryBusy}
            conversations={conversations}
            query={search}
            scope={registryScope}
            selectedId={conversationId}
            workingIds={workingIds}
            onArchive={(id) => void archiveConversation(id)}
            onCreate={() => void createConversation()}
            onRename={(id, title) => void renameConversation(id, title)}
            onRestore={(id) => void restoreConversation(id)}
            onSelect={selectConversation}
          />
        )
      }
      sidebarContentClassName="p-0"
      sidebarFooter={null}
      sidebarStateKey="zetro-conversations"
      statusEnd={<span className="text-xs text-gray-600">v{buildVersion}</span>}
      statusLabel={statusLabel}
      workspaceTitle={
        view === 'runbooks'
          ? (runbooks.find((runbook) => runbook.id === selectedRunbookId)?.title ?? 'New runbook')
          : view === 'workers'
          ? (selectedTask?.title ?? 'Worker queue')
          : view === 'tasks'
            ? (selectedTask?.title ?? 'Task queue')
            : (selectedConversation?.title ?? 'Conversation')
      }
      onSearchChange={setSearch}
    >
      {view === 'settings' && providerSettings ? (
        <ProviderSettings settings={providerSettings} onChange={setProviderSettings} />
      ) : view === 'runbooks' ? (
        <RunbookWorkspace busy={runbooksBusy} runbook={runbooks.find((runbook) => runbook.id === selectedRunbookId)} runs={runbookRuns} onCreate={saveRunbook} onEnabled={updateRunbookEnabled} onStart={runRunbook} onStop={stopRunbook} />
      ) : view === 'workers' ? (
        <CodingWorkerWorkspace
          attempts={workers.attempts}
          busy={workers.busy}
          onUpdate={workers.update}
          task={selectedTask}
          onPrepare={workers.prepare}
        />
      ) : view === 'tasks' ? (
        <AgentTaskWorkspace
          busy={tasksBusy}
          onArchive={archiveTask}
          onConfirm={confirmTaskReview}
          task={selectedTask}
          onOpenConversation={selectConversation}
          onSave={saveTaskPlan}
          workerAttempts={workers.attempts.filter((attempt) => attempt.taskId === selectedTask?.id)}
        />
      ) : (
        <section className="flex size-full min-h-0 flex-col bg-background text-foreground">
          <header className="flex h-14 shrink-0 items-center gap-3 border-b px-5">
            <span className="grid size-8 place-items-center rounded-lg bg-black text-white">
              <Bot className="size-4" />
            </span>
            <span className="min-w-0">
              <span className="block truncate text-sm font-semibold">
                {selectedConversation?.title ?? 'Conversation'}
              </span>
              <span className="block text-xs text-muted-foreground">
                {selectedConversation?.archivedAt ? 'Archived conversation' : 'Conversation'}
              </span>
            </span>
            {providerSettings && selectedConversation ? (
              <HandoffTrayButton count={handoffItems.length} onClick={() => setHandoffOpen(true)} />
            ) : null}
            {providerSettings && selectedConversation ? (
              <ProviderHeaderSwitcher
                conversationId={selectedConversation.id}
                disabled={isResponding}
                provider={selectedConversation.provider}
                settings={providerSettings}
                onError={setShellError}
                onSwitchingChange={setProviderSwitching}
                onProviderChange={(provider) =>
                  updateConversationProvider(selectedConversation.id, provider)
                }
              />
            ) : null}
          </header>
          <MessageScrollerProvider autoScroll defaultScrollPosition="end">
            <MessageScroller className="flex-1">
              <MessageScrollerViewport aria-label="Conversation">
                <MessageScrollerContent
                  aria-live="polite"
                  className="gap-10 px-4 py-6 sm:px-6 md:py-8 lg:px-10 2xl:px-16"
                >
                  {runtime.turns.length === 0 ? <EmptyChat /> : null}
                  {runtime.turns.map((turn, index) => (
                    <MessageScrollerItem
                      key={turn.id}
                      messageId={String(turn.id)}
                      scrollAnchor={index === runtime.turns.length - 1}
                    >
                      <ChatTurnView
                        actionsDisabled={isResponding || Boolean(selectedConversation?.archivedAt)}
                        connectionState={runtime.connectionState}
                        turn={turn}
                        onRegenerate={() => void repeatPrompt(turn.prompt)}
                        onRetry={() => void repeatPrompt(turn.prompt)}
                        onHandoffSelection={() => void setTurnHandoff(turn.id, !handoffItems.some((item) => item.turnId === turn.id))}
                        selectedForHandoff={handoffItems.some((item) => item.turnId === turn.id)}
                      />
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
                disabled={
                  isResponding ||
                  providerSwitching ||
                  registryBusy ||
                  Boolean(selectedConversation?.archivedAt) ||
                  selectedConversation?.provider.status !== 'verified'
                }
                onChange={(event) => setPrompt(event.target.value)}
                onKeyDown={handleComposerKeyDown}
                placeholder="Message Codex…"
                value={prompt}
              />
              <div className="flex justify-end">
                {isResponding ? (
                  <Button
                    aria-label={runtime.isStopping ? 'Stopping response' : 'Stop response'}
                    className="zetro-stop-shimmer cursor-pointer"
                    disabled={runtime.isStopping}
                    onClick={() => conversationId && void chat.stopResponse(conversationId)}
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
                    disabled={
                      !conversationId ||
                      !prompt.trim() ||
                      providerSwitching ||
                      Boolean(selectedConversation?.archivedAt) ||
                      selectedConversation?.provider.status !== 'verified'
                    }
                    size="icon"
                    type="submit"
                  >
                    <ArrowUp />
                  </Button>
                )}
              </div>
            </div>
            {runtime.error || shellError ? (
              <p className="pt-2 text-sm text-destructive">{runtime.error || shellError}</p>
            ) : providerSwitching ? (
              <p className="pt-2 text-sm text-muted-foreground">Verifying this connection…</p>
            ) : selectedConversation?.provider.status !== 'verified' ? (
              <p className="pt-2 text-sm text-muted-foreground">
                Verify the connection in the header before sending a prompt.
              </p>
            ) : null}
          </form>
        </section>
      )}
      <HandoffTray
        items={handoffItems}
        onClose={() => setHandoffOpen(false)}
        onHandOff={() => void handoffTrayToTask()}
        onRemove={(item) => void setTurnHandoff(item.turnId, false)}
        onReview={reviewHandoffTray}
        open={handoffOpen}
      />
    </MdiMain>
  )
}

function errorMessage(reason: unknown, fallback: string) {
  return reason instanceof Error ? reason.message : fallback
}
