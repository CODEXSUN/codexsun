import { useEffect, useRef, useState } from 'react'
import { Bot, FileText, Layers3, MessageSquareShare } from 'lucide-react'

import { ChatComposer, type ChatComposerAttachment } from '../chat-composer'
import { ChatResponseProgress, ChatTurnDivider } from '../chat-response-progress'
import { ChatRuntimeControls } from '../chat-runtime-controls'
import { ChatRuntimeTrace, type ChatRuntimeTraceEvent } from '../chat-runtime-trace'
import { Button } from '../../components/button'
import { MessageScroller, MessageScrollerButton, MessageScrollerViewport } from '../../components/message-scroller'

export type AgentChatMessage = {
  content: string
  id: string
  role: 'assistant' | 'error' | 'user'
  trace?: readonly ChatRuntimeTraceEvent[]
}

export type AgentChatRuntime = {
  connected: boolean
  message: string
  model: string
  models: readonly string[]
  provider: string
  providers: readonly string[]
  reasoning: string
  reasoningLevels: readonly string[]
}

export type AgentChatWorkspaceProps = {
  attachments?: readonly ChatComposerAttachment[]
  draft: string
  elapsedSeconds?: number
  isRecording?: boolean
  isWorking?: boolean
  messages: readonly AgentChatMessage[]
  onAddAttachments?: (files: File[]) => void
  onDraftChange: (value: string) => void
  onLongTextPaste?: (file: File) => void
  onReconnect: () => void
  onRemoveAttachment?: (id: string) => void
  onRuntimeChange: (runtime: AgentChatRuntime) => void
  onStop?: () => void
  onSubmit: () => void
  onVoiceToggle?: () => void
  placeholder?: string
  queuedSteerCount?: number
  runtime: AgentChatRuntime
  title?: string
}

export function AgentChatWorkspace({
  attachments = [],
  draft,
  elapsedSeconds = 0,
  isRecording = false,
  isWorking = false,
  messages,
  onAddAttachments,
  onDraftChange,
  onLongTextPaste,
  onReconnect,
  onRemoveAttachment,
  onRuntimeChange,
  onStop,
  onSubmit,
  onVoiceToggle,
  placeholder = 'Ask about a focused coding task…',
  queuedSteerCount = 0,
  runtime,
  title = 'Start with an agent task',
}: AgentChatWorkspaceProps) {
  const [canScrollToLatest, setCanScrollToLatest] = useState(false)
  const messageViewportRef = useRef<HTMLDivElement>(null)
  const composerRef = useRef<HTMLTextAreaElement>(null)

  useEffect(() => {
    composerRef.current?.focus({ preventScroll: true })
  }, [])

  function updateScrollPosition(): void {
    const viewport = messageViewportRef.current
    if (!viewport) return
    setCanScrollToLatest(viewport.scrollHeight - viewport.clientHeight - viewport.scrollTop > 8)
  }

  function scrollToLatest(): void {
    messageViewportRef.current?.scrollTo({ top: messageViewportRef.current.scrollHeight, behavior: 'smooth' })
    setCanScrollToLatest(false)
  }

  return (
    <section aria-label="Agent chat" className="flex size-full min-h-0 flex-col bg-background">
      <header className="grid shrink-0 gap-3 border-b border-border px-4 py-3 sm:px-6 lg:grid-cols-[minmax(0,1fr)_auto] lg:items-center">
        <div className="min-w-0">
          <h1 className="truncate text-sm font-semibold tracking-tight">{title}</h1>
          <div className="mt-2 flex flex-wrap gap-1">
            <Button className="h-7 px-2 text-xs" size="sm" variant="secondary">Explore</Button>
            <Button className="h-7 px-2 text-xs" size="sm" variant="ghost">Plan</Button>
            <Button className="h-7 px-2 text-xs" size="sm" variant="ghost">Execute</Button>
          </div>
        </div>
        <div className="flex items-center justify-end gap-1">
          <Button aria-label="Open chat context" size="icon-sm" variant="ghost"><Layers3 /></Button>
          <Button aria-label="Open task brief" size="sm" variant="outline"><FileText /> Brief</Button>
          <Button aria-label="Share chat" size="icon-sm" variant="ghost"><MessageSquareShare /></Button>
          <ChatRuntimeControls
            connected={runtime.connected}
            message={runtime.message}
            model={runtime.model}
            models={runtime.models}
            onModelChange={(model) => onRuntimeChange({ ...runtime, model })}
            onProviderChange={(provider) => onRuntimeChange({ ...runtime, provider })}
            onReasoningChange={(reasoning) => onRuntimeChange({ ...runtime, reasoning })}
            onReconnect={onReconnect}
            provider={runtime.provider}
            providers={runtime.providers}
            reasoning={runtime.reasoning}
            reasoningLevels={runtime.reasoningLevels}
          />
        </div>
      </header>

      <MessageScroller>
        <MessageScrollerViewport ref={messageViewportRef} className="px-6 py-7 [scrollbar-color:var(--border)_transparent] [scrollbar-width:thin] [&::-webkit-scrollbar-thumb]:rounded-full [&::-webkit-scrollbar-track]:bg-transparent [&::-webkit-scrollbar]:w-1" onScroll={updateScrollPosition}>
          <div className="mx-auto flex w-4/5 flex-col gap-3">
            {messages.map((message) => (
              <div key={message.id} className={`group flex flex-col ${message.role === 'user' ? 'w-fit max-w-[80%] self-end' : 'w-full self-start'}`}>
                <article className={message.role === 'user' ? 'rounded-sm bg-muted/60 px-4 py-3 text-foreground shadow-sm' : 'px-4 py-3'}>
                  <p className="flex items-center gap-1.5 text-xs font-medium text-muted-foreground">{message.role === 'assistant' ? <Bot aria-hidden="true" className="size-3.5" /> : null}{message.role === 'user' ? 'You' : message.role === 'error' ? 'Connection' : 'CodeLoop'}</p>
                  {message.content ? <p className="mt-1 whitespace-pre-wrap text-sm leading-6">{message.content}</p> : null}
                  {message.trace?.length ? <ChatRuntimeTrace className="mt-2" elapsedSeconds={elapsedSeconds} events={message.trace} isWorking={isWorking} /> : null}
                </article>
                {message.role === 'assistant' ? <ChatTurnDivider /> : null}
              </div>
            ))}
            {isWorking ? <div className="px-4"><ChatResponseProgress elapsedSeconds={elapsedSeconds} label="Working" tone="orange" /></div> : null}
          </div>
        </MessageScrollerViewport>
        {canScrollToLatest ? <MessageScrollerButton aria-label="Scroll to latest message" className="border-border shadow-sm" onClick={scrollToLatest} /> : null}
      </MessageScroller>

      <footer className="sticky bottom-0 z-10 shrink-0 bg-background px-6 py-4">
        <ChatComposer
          attachments={attachments}
          isRecording={isRecording}
          isWorking={isWorking}
          onAddFiles={onAddAttachments}
          onLongTextPaste={onLongTextPaste}
          onRemoveAttachment={onRemoveAttachment}
          onStop={onStop}
          onSubmit={onSubmit}
          onValueChange={onDraftChange}
          onVoiceToggle={onVoiceToggle}
          placeholder={placeholder}
          queuedSteerCount={queuedSteerCount}
          textareaRef={composerRef}
          value={draft}
        />
      </footer>
    </section>
  )
}
