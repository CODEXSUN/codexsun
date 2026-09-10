import {
  useCallback,
  useRef,
  useState,
  type ChangeEvent,
  type ClipboardEvent,
  type DragEvent,
  type KeyboardEvent,
} from 'react'
import { ArrowUp, File, LoaderCircle, Mic, Paperclip, Square, X } from 'lucide-react'
import { Button } from '@codexsun/ui/components/button'
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@codexsun/ui/components/select'
import { Textarea } from '@codexsun/ui/components/textarea'
import { TopologyRegion } from '@codexsun/ui/features/interface-topology'
import { useMdiTopology } from '@codexsun/ui/layouts/mdi-main'
import { useAgentChat } from './agent-chat.controller'
import {
  createPastedTextAttachment,
  maxChatAttachments,
  readChatAttachment,
  shouldAttachPastedText,
} from './agent-chat.attachments'
import type { ChatAttachment, ChatWorkflow } from './agent-chat.types'
import { useVoiceInput } from './agent-chat.voice'
import { useZetroPreferences } from '../settings'

const workflows: Array<{ label: string; value: ChatWorkflow }> = [
  { label: 'Develop', value: 'develop' },
  { label: 'Deliver', value: 'deliver' },
  { label: 'Review', value: 'review' },
  { label: 'Test', value: 'test' },
  { label: 'Document', value: 'document' },
]

export function AgentChatComposer({
  draft,
  onDraftChange,
}: {
  draft: string
  onDraftChange(value: string): void
}) {
  const chat = useAgentChat()
  const topology = useMdiTopology()
  const { preferences, setPreference } = useZetroPreferences()
  const fileInputRef = useRef<HTMLInputElement>(null)
  const [attachments, setAttachments] = useState<ChatAttachment[]>([])
  const [isDragging, setIsDragging] = useState(false)
  const [localError, setLocalError] = useState<string | null>(null)
  const workflow = preferences.defaultWorkflow as ChatWorkflow
  const isWorking = chat.workingSince !== null
  const addTranscript = useCallback(
    (value: string) => onDraftChange([draft, value].filter(Boolean).join(' ')),
    [draft, onDraftChange],
  )
  const voice = useVoiceInput(addTranscript)

  async function send() {
    if (chat.isBusy || (!draft.trim() && attachments.length === 0)) return
    const submittedAttachments = attachments
    const submittedDraft = draft
    onDraftChange('')
    setAttachments([])
    await chat.sendMessage(submittedDraft, submittedAttachments, workflow)
  }

  function handleKeyDown(event: KeyboardEvent<HTMLTextAreaElement>) {
    if (event.key === 'Enter' && !event.shiftKey && !event.nativeEvent.isComposing) {
      event.preventDefault()
      void send()
    }
  }

  async function addFiles(files: readonly File[]) {
    const capacity = maxChatAttachments - attachments.length
    if (capacity <= 0) {
      setLocalError(`You can attach up to ${maxChatAttachments} files.`)
      return
    }

    const selected = files.slice(0, capacity)
    setLocalError(null)
    try {
      const encoded = await Promise.all(selected.map(readChatAttachment))
      setAttachments((current) => [...current, ...encoded].slice(0, maxChatAttachments))
      if (files.length > capacity) {
        setLocalError(`Only the first ${capacity} files were attached.`)
      }
    } catch (reason) {
      setLocalError(reason instanceof Error ? reason.message : 'The attachment could not be read.')
    }
  }

  async function handleFiles(event: ChangeEvent<HTMLInputElement>) {
    await addFiles(Array.from(event.target.files ?? []))
    event.target.value = ''
  }

  function handlePaste(event: ClipboardEvent<HTMLTextAreaElement>) {
    const files = clipboardFiles(event.clipboardData)
    if (files.length) void addFiles(files)

    const text = event.clipboardData.getData('text/plain')
    if (!shouldAttachPastedText(text)) return

    event.preventDefault()
    if (attachments.length >= maxChatAttachments) {
      setLocalError(`You can attach up to ${maxChatAttachments} files.`)
      return
    }
    try {
      const attachment = createPastedTextAttachment(text)
      setAttachments((current) => [...current, attachment].slice(0, maxChatAttachments))
      setLocalError(null)
    } catch (reason) {
      setLocalError(reason instanceof Error ? reason.message : 'The pasted text could not be read.')
    }
  }

  function handleDrop(event: DragEvent<HTMLDivElement>) {
    event.preventDefault()
    setIsDragging(false)
    const files = Array.from(event.dataTransfer.files)
    if (files.length) void addFiles(files)
  }

  const error = localError ?? voice.error ?? chat.error

  return (
    <TopologyRegion
      as="div"
      className="shrink-0 pb-5 [&>[data-ito-marker]]:top-auto [&>[data-ito-marker]]:bottom-2"
      id="15.1.2"
      topology={topology}
    >
      {error ? (
        <p className="pb-2 text-sm text-destructive" role="alert">
          {error}
        </p>
      ) : null}
      {attachments.length ? (
        <div className="flex flex-wrap gap-2 pb-2">
          {attachments.map((attachment) => (
            <span
              className="inline-flex items-center gap-1.5 rounded-md border bg-background px-2 py-1 text-xs"
              key={attachment.id}
            >
              {attachment.mimeType.startsWith('image/') ? (
                <img alt="" className="size-6 rounded object-cover" src={attachment.dataUrl} />
              ) : (
                <File />
              )}
              <span className="max-w-36 truncate">{attachment.name}</span>
              <Button
                variant="ghost"
                aria-label={`Remove ${attachment.name}`}
                onClick={() =>
                  setAttachments((current) => current.filter(({ id }) => id !== attachment.id))
                }
                type="button"
              >
                <X className="size-3" />
              </Button>
            </span>
          ))}
        </div>
      ) : null}
      <div
        className={`relative rounded-2xl border bg-background p-2 shadow-sm focus-within:ring-2 focus-within:ring-ring/40 ${
          isDragging ? 'border-primary ring-2 ring-primary/20' : ''
        }`}
        onDragEnter={(event) => {
          event.preventDefault()
          setIsDragging(true)
        }}
        onDragLeave={(event) => {
          if (!event.currentTarget.contains(event.relatedTarget as Node | null))
            setIsDragging(false)
        }}
        onDragOver={(event) => event.preventDefault()}
        onDrop={handleDrop}
      >
        {isDragging ? (
          <div className="pointer-events-none absolute inset-1 z-10 grid place-items-center rounded-xl border border-dashed border-primary bg-background/95 text-sm font-medium text-primary">
            Drop images or files here
          </div>
        ) : null}
        <Textarea
          aria-label="Message Zetro"
          className="max-h-48 min-h-20 resize-none border-0 bg-transparent px-2 py-2 shadow-none focus-visible:ring-0"
          disabled={chat.isBusy}
          maxLength={20_000}
          onChange={(event) => onDraftChange(event.target.value)}
          onKeyDown={handleKeyDown}
          onPaste={handlePaste}
          placeholder="Ask Zetro to plan, review, document, or build..."
          value={draft}
        />
        <div className="flex items-center gap-1 pt-1">
          <input
            hidden
            multiple
            onChange={(event) => void handleFiles(event)}
            ref={fileInputRef}
            type="file"
          />
          <Button
            aria-label="Attach files"
            disabled={chat.isBusy || attachments.length >= maxChatAttachments}
            onClick={() => fileInputRef.current?.click()}
            size="icon"
            title="Attach images or files"
            variant="ghost"
          >
            <Paperclip />
          </Button>
          <Select
            items={workflows}
            onValueChange={(value) =>
              value && setPreference('defaultWorkflow', value as ChatWorkflow)
            }
            value={workflow}
          >
            <SelectTrigger aria-label="Select workflow" className="border-0" size="sm">
              <SelectValue />
            </SelectTrigger>
            <SelectContent align="start">
              <SelectGroup>
                {workflows.map((item) => (
                  <SelectItem key={item.value} value={item.value}>
                    {item.label}
                  </SelectItem>
                ))}
              </SelectGroup>
            </SelectContent>
          </Select>
          <span className="ml-auto" />
          <Button
            aria-label={voice.isListening ? 'Stop voice input' : 'Start voice input'}
            disabled={chat.isBusy}
            onClick={voice.isListening ? voice.stop : voice.start}
            size="icon"
            variant={voice.isListening ? 'secondary' : 'ghost'}
          >
            {voice.isListening ? <Square /> : <Mic />}
          </Button>
          <Button
            aria-label={isWorking ? 'Stop response' : 'Send message'}
            aria-live={isWorking ? 'off' : undefined}
            className={
              isWorking
                ? 'group/stop cursor-pointer hover:bg-orange-50 focus-visible:ring-orange-500/50 dark:hover:bg-orange-950/30'
                : undefined
            }
            disabled={!isWorking && (chat.isBusy || (!draft.trim() && attachments.length === 0))}
            onClick={isWorking ? () => void chat.stopWorking() : () => void send()}
            size="icon"
            title={isWorking ? 'Stop response' : undefined}
          >
            {isWorking ? (
              <>
                <LoaderCircle className="animate-spin group-hover/stop:hidden group-focus-visible/stop:hidden" />
                <Square className="hidden fill-orange-500 text-orange-500 group-hover/stop:block group-focus-visible/stop:block" />
              </>
            ) : chat.isBusy ? (
              <LoaderCircle className="animate-spin" />
            ) : (
              <ArrowUp />
            )}
          </Button>
        </div>
      </div>
    </TopologyRegion>
  )
}

function clipboardFiles(clipboard: DataTransfer): File[] {
  const itemFiles = Array.from(clipboard.items)
    .filter(({ kind }) => kind === 'file')
    .map((item) => item.getAsFile())
    .filter((file): file is File => file !== null)
  return itemFiles.length ? itemFiles : Array.from(clipboard.files)
}
