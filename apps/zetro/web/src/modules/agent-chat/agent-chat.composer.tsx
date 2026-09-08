import { useCallback, useRef, useState, type ChangeEvent, type KeyboardEvent } from 'react'
import { ArrowUp, File, Image, LoaderCircle, Mic, Paperclip, Square, X } from 'lucide-react'
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
import type { ChatAttachment, ChatWorkflow } from './agent-chat.types'
import { useVoiceInput } from './agent-chat.voice'

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
  const fileInputRef = useRef<HTMLInputElement>(null)
  const [attachments, setAttachments] = useState<ChatAttachment[]>([])
  const [localError, setLocalError] = useState<string | null>(null)
  const [workflow, setWorkflow] = useState<ChatWorkflow>(readWorkflow)
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

  async function handleFiles(event: ChangeEvent<HTMLInputElement>) {
    const files = Array.from(event.target.files ?? []).slice(0, 4 - attachments.length)
    setLocalError(null)
    try {
      const encoded = await Promise.all(files.map(readAttachment))
      setAttachments((current) => [...current, ...encoded].slice(0, 4))
    } catch (reason) {
      setLocalError(reason instanceof Error ? reason.message : 'The attachment could not be read.')
    } finally {
      event.target.value = ''
    }
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
              {attachment.mimeType.startsWith('image/') ? <Image /> : <File />}
              <span className="max-w-36 truncate">{attachment.name}</span>
              <button
                aria-label={`Remove ${attachment.name}`}
                onClick={() =>
                  setAttachments((current) => current.filter(({ id }) => id !== attachment.id))
                }
                type="button"
              >
                <X className="size-3" />
              </button>
            </span>
          ))}
        </div>
      ) : null}
      <div className="rounded-2xl border bg-background p-2 shadow-sm focus-within:ring-2 focus-within:ring-ring/40">
        <Textarea
          aria-label="Message Zetro"
          className="max-h-48 min-h-20 resize-none border-0 bg-transparent px-2 py-2 shadow-none focus-visible:ring-0"
          disabled={chat.isBusy}
          maxLength={20_000}
          onChange={(event) => onDraftChange(event.target.value)}
          onKeyDown={handleKeyDown}
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
            disabled={chat.isBusy || attachments.length >= 4}
            onClick={() => fileInputRef.current?.click()}
            size="icon"
            variant="ghost"
          >
            <Paperclip />
          </Button>
          <Select
            items={workflows}
            onValueChange={(value) => value && changeWorkflow(value as ChatWorkflow, setWorkflow)}
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
            aria-label="Send message"
            disabled={chat.isBusy || (!draft.trim() && attachments.length === 0)}
            onClick={() => void send()}
            size="icon"
          >
            {chat.isBusy ? <LoaderCircle className="animate-spin" /> : <ArrowUp />}
          </Button>
        </div>
      </div>
    </TopologyRegion>
  )
}

function changeWorkflow(value: ChatWorkflow, setWorkflow: (value: ChatWorkflow) => void) {
  setWorkflow(value)
  window.localStorage.setItem('zetro.agent-chat.workflow', value)
}

function readWorkflow(): ChatWorkflow {
  const value = window.localStorage.getItem('zetro.agent-chat.workflow')
  return workflows.some((workflow) => workflow.value === value)
    ? (value as ChatWorkflow)
    : 'develop'
}

async function readAttachment(file: File): Promise<ChatAttachment> {
  if (file.size > 4_000_000) throw new Error(`${file.name} is larger than 4 MB.`)
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
