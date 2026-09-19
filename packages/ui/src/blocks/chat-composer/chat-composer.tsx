import { FileImageIcon, MicIcon, PaperclipIcon, SquareIcon, XIcon } from 'lucide-react'
import { useRef, useState, type ChangeEvent, type ClipboardEvent, type DragEvent, type KeyboardEvent } from 'react'

import { Button } from '../../components/button'
import { Textarea } from '../../components/textarea'
import { cn } from '../../lib/utils'

export type ChatComposerAttachment = {
  file: File
  id: string
  name: string
  previewUrl?: string
  type: string
}

export type ChatComposerProps = {
  attachments?: readonly ChatComposerAttachment[]
  className?: string
  disabled?: boolean
  isRecording?: boolean
  isWorking?: boolean
  onAddFiles?: (files: File[]) => void
  onRemoveAttachment?: (id: string) => void
  onSteer?: () => void
  onStop?: () => void
  onSubmit: () => void
  onValueChange: (value: string) => void
  onVoiceToggle?: () => void
  placeholder?: string
  queuedSteerCount?: number
  value: string
}

export function ChatComposer({
  attachments = [],
  className,
  disabled = false,
  isRecording = false,
  isWorking = false,
  onAddFiles,
  onRemoveAttachment,
  onSteer,
  onStop,
  onSubmit,
  onValueChange,
  onVoiceToggle,
  placeholder = 'Share an idea, question, or draft…',
  queuedSteerCount = 0,
  value,
}: ChatComposerProps) {
  const fileInputRef = useRef<HTMLInputElement>(null)
  const [isDragging, setIsDragging] = useState(false)

  function addFiles(files: FileList | null): void {
    if (!files?.length) return
    onAddFiles?.(Array.from(files))
  }

  function handleInputChange(event: ChangeEvent<HTMLInputElement>): void {
    addFiles(event.target.files)
    event.target.value = ''
  }

  function handleDrop(event: DragEvent<HTMLDivElement>): void {
    event.preventDefault()
    setIsDragging(false)
    addFiles(event.dataTransfer.files)
  }

  function handleKeyDown(event: KeyboardEvent<HTMLTextAreaElement>): void {
    if (event.key !== 'Enter' || event.shiftKey) return
    event.preventDefault()
    if (isWorking) onSteer?.()
    else onSubmit()
  }

  function handlePaste(event: ClipboardEvent<HTMLTextAreaElement>): void {
    if (!event.clipboardData.files.length) return
    addFiles(event.clipboardData.files)
  }

  return (
    <div
      className={cn('relative mx-auto w-4/5 rounded-md transition-colors', isDragging && 'ring-2 ring-primary/50', className)}
      onDragEnter={() => setIsDragging(true)}
      onDragLeave={(event) => {
        if (event.currentTarget === event.target) setIsDragging(false)
      }}
      onDragOver={(event) => event.preventDefault()}
      onDrop={handleDrop}
    >
      <input ref={fileInputRef} className="sr-only" multiple type="file" onChange={handleInputChange} />
      {attachments.length ? (
        <div className="absolute inset-x-3 top-3 z-10 flex flex-wrap gap-1.5">
          {attachments.map((attachment) => (
            <div key={attachment.id} className="flex h-8 max-w-48 items-center gap-1.5 rounded-sm border bg-background px-1.5 text-xs shadow-sm">
              {attachment.previewUrl ? <img alt="" className="size-5 rounded-sm object-cover" src={attachment.previewUrl} /> : <FileImageIcon className="size-3.5 text-muted-foreground" />}
              <span className="truncate">{attachment.name}</span>
              <Button aria-label={`Remove ${attachment.name}`} className="size-5" size="icon-xs" variant="ghost" onClick={() => onRemoveAttachment?.(attachment.id)}><XIcon /></Button>
            </div>
          ))}
        </div>
      ) : null}
      <Textarea
        aria-label="Message"
        className={cn(
          'h-[7.25rem] min-h-0 max-h-[7.25rem] w-full resize-none border-foreground/20 pb-10 pr-28 leading-5 [field-sizing:fixed] [scrollbar-color:var(--border)_transparent] [scrollbar-width:thin] [&::-webkit-scrollbar-thumb]:rounded-full [&::-webkit-scrollbar-thumb]:bg-border/70 [&::-webkit-scrollbar-track]:bg-transparent [&::-webkit-scrollbar]:w-1',
          attachments.length && 'pt-12',
        )}
        disabled={disabled}
        placeholder={isDragging ? 'Drop files to attach' : placeholder}
        rows={5}
        value={value}
        onChange={(event) => onValueChange(event.target.value)}
        onKeyDown={handleKeyDown}
        onPaste={handlePaste}
      />
      <div className="absolute bottom-3 left-3 flex items-center gap-1">
        <Button aria-label="Attach files" disabled={disabled} size="icon-xs" variant="ghost" onClick={() => fileInputRef.current?.click()}><PaperclipIcon /></Button>
        <Button aria-label="Attach image" disabled={disabled} size="icon-xs" variant="ghost" onClick={() => fileInputRef.current?.click()}><FileImageIcon /></Button>
        <Button aria-label={isRecording ? 'Stop voice input' : 'Start voice input'} className={isRecording ? 'bg-destructive/10 text-destructive hover:bg-destructive/15' : undefined} disabled={disabled} size="icon-xs" variant="ghost" onClick={onVoiceToggle}><MicIcon /></Button>
      </div>
      <div className="absolute right-3 bottom-3 flex items-center gap-1">
        {isWorking ? <Button aria-label="Steer response" disabled={!value.trim()} size="sm" variant="ghost" onClick={onSteer}>Steer{queuedSteerCount ? ` (${queuedSteerCount})` : ''}</Button> : null}
        <Button aria-label={isWorking ? 'Stop response' : 'Send message'} className={isWorking ? 'shimmer-surface shimmer-surface-orange' : undefined} disabled={!isWorking && !value.trim() && !attachments.length} size="icon-sm" onClick={isWorking ? onStop : onSubmit}>{isWorking ? <SquareIcon /> : <span aria-hidden="true">↑</span>}</Button>
      </div>
    </div>
  )
}
