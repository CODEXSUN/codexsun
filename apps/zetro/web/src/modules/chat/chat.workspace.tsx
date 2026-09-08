import { useCallback, useRef, useState, type ChangeEvent, type KeyboardEvent } from 'react'
import {
  ArrowUp,
  Bot,
  File,
  Image as ImageIcon,
  Mic,
  Paperclip,
  PanelLeft,
  Plus,
  Square,
  Volume2,
  X,
} from 'lucide-react'
import { requestChatTurn } from './chat.services'
import { HistoryDrawer } from './chat.history-drawer'
import { useConversationHistory } from './chat.history.hooks'
import { speakReply, useVoiceInput } from './chat.hooks'
import type { ChatAttachment, ChatMessage, ChatWorkflow } from './chat.types'
import { WorkflowSelector } from './chat.workflow-selector'
import { DeliveryPipeline } from './chat.delivery-pipeline'
import { TopologyRegion } from '@codexsun/ui/features/interface-topology'
import { useMdiTopology } from '@codexsun/ui/layouts/mdi-main'

const starterPrompts: Record<ChatWorkflow, readonly string[]> = {
  deliver: [
    'Plan, implement, verify, and document this change',
    'Prepare this repository change for version, commit, and push',
  ],
  develop: ['Build this feature and verify it', 'Fix this bug with focused tests'],
  document: ['Document this module from the source', 'Update the README and changelog'],
  review: ['Review the current Git changes', 'Find correctness and security risks'],
  test: ['Reproduce this failure and report the cause', 'Run the checks for this module'],
}

interface ChatWorkspaceProps {
  autoSpeak: boolean
  onCreateTask(title: string): void
}

export function ChatWorkspace({ autoSpeak, onCreateTask }: ChatWorkspaceProps) {
  const topology = useMdiTopology()
  const fileInputRef = useRef<HTMLInputElement>(null)
  const [attachments, setAttachments] = useState<ChatAttachment[]>([])
  const [draft, setDraft] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [isSending, setIsSending] = useState(false)
  const [isHistoryOpen, setIsHistoryOpen] = useState(false)
  const [isHistoryCollapsed, setIsHistoryCollapsed] = useState(false)
  const [messages, setMessages] = useState<ChatMessage[]>([])
  const [workflow, setWorkflow] = useState<ChatWorkflow>(readStoredWorkflow)
  const history = useConversationHistory()
  const addTranscript = useCallback((value: string) => {
    setDraft((current) => [current, value].filter(Boolean).join(' '))
  }, [])
  const voice = useVoiceInput(addTranscript)

  async function sendMessage(): Promise<void> {
    if (isSending || (!draft.trim() && attachments.length === 0)) return

    const userMessage: ChatMessage = {
      attachments,
      content: draft.trim(),
      id: crypto.randomUUID(),
      role: 'user',
    }
    const nextMessages = [...messages, userMessage]
    setMessages(nextMessages)
    setDraft('')
    setAttachments([])
    setError(null)
    setIsSending(true)
    const conversationId = await history.saveMessages(nextMessages)

    try {
      if (!conversationId) throw new Error('Zetro could not create an isolated task workspace.')
      const response = await requestChatTurn(conversationId, nextMessages, workflow)
      const assistantMessage: ChatMessage = {
        attachments: [],
        content: response.message.content,
        execution: response.execution,
        id: response.responseId,
        role: 'assistant',
      }
      const completedMessages = [...nextMessages, assistantMessage]
      setMessages(completedMessages)
      await history.saveMessages(completedMessages, conversationId)
      if (autoSpeak) speakReply(assistantMessage.content)
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : 'Zetro could not complete this turn.')
    } finally {
      setIsSending(false)
    }
  }

  function startNewConversation(): void {
    history.newConversation()
    setMessages([])
    setAttachments([])
    setDraft('')
    setError(null)
    setIsHistoryOpen(false)
  }

  async function openConversation(conversationId: string): Promise<void> {
    const storedMessages = await history.open(conversationId)
    if (storedMessages) {
      setMessages(storedMessages)
      setError(null)
      setIsHistoryOpen(false)
    }
  }

  function handleComposerKeyDown(event: KeyboardEvent<HTMLTextAreaElement>): void {
    if (event.key === 'Enter' && !event.shiftKey) {
      event.preventDefault()
      void sendMessage()
    }
  }

  async function handleFiles(event: ChangeEvent<HTMLInputElement>): Promise<void> {
    const files = Array.from(event.target.files ?? []).slice(0, 4 - attachments.length)
    setError(null)

    try {
      const encoded = await Promise.all(files.map(readAttachment))
      setAttachments((current) => [...current, ...encoded].slice(0, 4))
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : 'The attachment could not be read.')
    } finally {
      event.target.value = ''
    }
  }

  return (
    <TopologyRegion
      as="section"
      className={`chat-workspace ${isHistoryCollapsed ? 'history-collapsed' : ''}`}
      aria-label="Zetro conversation"
      id="11"
      topology={topology}
    >
      <HistoryDrawer
        activeId={history.activeId}
        collapsed={isHistoryCollapsed}
        disabled={isSending}
        error={history.error}
        isLoading={history.isLoading}
        isOpen={isHistoryOpen}
        onClose={() => setIsHistoryOpen(false)}
        onNew={startNewConversation}
        onOpen={(conversationId) => void openConversation(conversationId)}
        onPin={(summary) => void history.togglePin(summary)}
        onRename={(conversationId, title) => void history.rename(conversationId, title)}
        onToggle={() => setIsHistoryCollapsed((current) => !current)}
        summaries={history.summaries}
      />
      <TopologyRegion as="div" className="chat-stage" id="11.2" topology={topology}>
        <button
          aria-label="Open chat history"
          className="history-mobile-toggle"
          onClick={() => setIsHistoryOpen(true)}
          title="Open history"
          type="button"
        >
          <PanelLeft />
        </button>
        <div className="conversation" aria-live="polite">
          {messages.length === 0 ? (
            <EmptyConversation onSelect={setDraft} workflow={workflow} />
          ) : (
            <TopologyRegion as="div" className="message-list" id="11.2.2" topology={topology}>
              {messages.map((message) => (
                <Message key={message.id} message={message} onCreateTask={onCreateTask} />
              ))}
              {isSending && (
                <div className="thinking-row">
                  <span className="thinking-dot" />
                  <span className="thinking-dot" />
                  <span className="thinking-dot" />
                  <span>Zetro is working</span>
                </div>
              )}
            </TopologyRegion>
          )}
        </div>

        <TopologyRegion as="div" className="composer-wrap" id="11.3" topology={topology}>
          {(error ?? voice.voiceError) && (
            <div className="composer-error" role="alert">
              {error ?? voice.voiceError}
            </div>
          )}
          {attachments.length > 0 && (
            <div className="attachment-tray">
              {attachments.map((attachment) => (
                <div className="attachment-chip" key={attachment.id}>
                  {attachment.mimeType.startsWith('image/') ? <ImageIcon /> : <File />}
                  <span>{attachment.name}</span>
                  <button
                    aria-label={`Remove ${attachment.name}`}
                    onClick={() =>
                      setAttachments((current) =>
                        current.filter((item) => item.id !== attachment.id),
                      )
                    }
                    type="button"
                  >
                    <X />
                  </button>
                </div>
              ))}
            </div>
          )}
          <div className="composer">
            <WorkflowSelector
              disabled={isSending}
              onChange={(value) => {
                setWorkflow(value)
                window.localStorage.setItem('zetro.chat.workflow', value)
              }}
              value={workflow}
            />
            {workflow === 'deliver' && <DeliveryPipeline />}
            <TopologyRegion as="div" id="11.3.2" topology={topology}>
              <textarea
                aria-label="Message Zetro"
                onChange={(event) => setDraft(event.target.value)}
                onKeyDown={handleComposerKeyDown}
                placeholder="Ask Zetro to plan, create, analyze, or build…"
                rows={2}
                value={draft}
              />
            </TopologyRegion>
            <div className="composer-actions">
              <div className="composer-tools">
                <TopologyRegion as="div" id="11.3.3" topology={topology}>
                  <button
                    aria-label="Attach images, audio, or files"
                    className="icon-button"
                    onClick={() => fileInputRef.current?.click()}
                    type="button"
                  >
                    <Paperclip />
                  </button>
                </TopologyRegion>
                <input
                  hidden
                  multiple
                  onChange={(event) => void handleFiles(event)}
                  ref={fileInputRef}
                  type="file"
                />
                <TopologyRegion as="div" id="11.3.4" topology={topology}>
                  <button
                    aria-label={voice.isListening ? 'Stop voice input' : 'Start voice input'}
                    className={`icon-button ${voice.isListening ? 'is-active' : ''}`}
                    onClick={voice.isListening ? voice.stop : voice.start}
                    type="button"
                  >
                    {voice.isListening ? <Square /> : <Mic />}
                  </button>
                </TopologyRegion>
              </div>
              <TopologyRegion as="div" id="11.3.5" topology={topology}>
                <button
                  aria-label="Send message"
                  className="send-button"
                  disabled={isSending || (!draft.trim() && attachments.length === 0)}
                  onClick={() => void sendMessage()}
                  type="button"
                >
                  <ArrowUp />
                </button>
              </TopologyRegion>
            </div>
          </div>
          <p className="composer-note">
            Enter to send · Shift + Enter for a new line · Up to 4 files
          </p>
        </TopologyRegion>
      </TopologyRegion>
    </TopologyRegion>
  )
}

function EmptyConversation({
  onSelect,
  workflow,
}: {
  onSelect(value: string): void
  workflow: ChatWorkflow
}) {
  const topology = useMdiTopology()
  return (
    <TopologyRegion as="div" className="empty-conversation" id="11.2.1" topology={topology}>
      <div className="agent-mark" aria-hidden="true">
        <Bot />
      </div>
      <p className="eyebrow">Agentic workspace</p>
      <h1>What shall we move forward?</h1>
      <p className="empty-copy">
        Bring a question, a file, an image, or a rough idea. Zetro uses Codex to turn it into a
        useful next step.
      </p>
      <div className="starter-prompts">
        {starterPrompts[workflow].map((prompt) => (
          <button key={prompt} onClick={() => onSelect(prompt)} type="button">
            <Plus />
            <span>{prompt}</span>
          </button>
        ))}
      </div>
    </TopologyRegion>
  )
}

function Message({
  message,
  onCreateTask,
}: {
  message: ChatMessage
  onCreateTask(title: string): void
}) {
  return (
    <article className={`message message-${message.role}`}>
      <div className="message-meta">{message.role === 'user' ? 'You' : 'Zetro'}</div>
      <div className="message-content">{message.content || 'Shared attachments'}</div>
      {message.attachments.length > 0 && (
        <div className="message-attachments">
          {message.attachments.map((attachment) =>
            attachment.mimeType.startsWith('image/') ? (
              <img alt={attachment.name} key={attachment.id} src={attachment.dataUrl} />
            ) : (
              <span key={attachment.id}>
                <File /> {attachment.name}
              </span>
            ),
          )}
        </div>
      )}
      {message.execution && <ExecutionSummary execution={message.execution} />}
      {message.role === 'assistant' && (
        <div className="message-actions">
          <button onClick={() => speakReply(message.content)} type="button">
            <Volume2 /> Speak
          </button>
          <button onClick={() => onCreateTask(message.content.slice(0, 120))} type="button">
            <Plus /> Assign task
          </button>
        </div>
      )}
    </article>
  )
}

function ExecutionSummary({ execution }: { execution: NonNullable<ChatMessage['execution']> }) {
  return (
    <details className="execution-summary">
      <summary>
        <span>{capitalize(execution.workflow)} · isolated task worktree</span>
        <code>{execution.worktreePath}</code>
      </summary>
      <div className="execution-body">
        {execution.delivery && <DeliveryPipeline delivery={execution.delivery} />}
        <div className="execution-tools" aria-label="Available coding tools">
          {execution.tools.map((tool) => (
            <span key={tool}>{tool}</span>
          ))}
        </div>
        {execution.activities.length > 0 ? (
          <ul>
            {execution.activities.map((activity, index) => (
              <li key={`${activity.kind}-${index}`}>
                <strong>{activity.kind.replace('_', ' ')}</strong>
                <span>{activity.label}</span>
                <small>{activity.status}</small>
              </li>
            ))}
          </ul>
        ) : (
          <p>No command or file-change tools were needed for this reply.</p>
        )}
      </div>
    </details>
  )
}

function readStoredWorkflow(): ChatWorkflow {
  const stored = window.localStorage.getItem('zetro.chat.workflow')
  return stored === 'deliver' || stored === 'document' || stored === 'review' || stored === 'test'
    ? stored
    : 'develop'
}

function capitalize(value: string): string {
  return `${value.charAt(0).toUpperCase()}${value.slice(1)}`
}

async function readAttachment(file: File): Promise<ChatAttachment> {
  if (file.size > 4_000_000) {
    throw new Error(`${file.name} is larger than the 4 MB attachment limit.`)
  }

  return {
    dataUrl: await readDataUrl(file),
    id: crypto.randomUUID(),
    mimeType: file.type || 'application/octet-stream',
    name: file.name,
  }
}

function readDataUrl(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onerror = () => reject(new Error(`Could not read ${file.name}.`))
    reader.onload = () => resolve(String(reader.result))
    reader.readAsDataURL(file)
  })
}
