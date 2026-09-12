import { useRef, useState, type ChangeEvent, type ClipboardEvent, type DragEvent, type FormEvent, type KeyboardEvent } from 'react'
import { MermaidPreview } from '@codexsun/ui/blocks/mermaid-preview'
import { Button } from '@codexsun/ui/components/button'
import { Textarea } from '@codexsun/ui/components/textarea'
import type { ChatImageArtifact } from '@codexsun/zetro-contracts'
import { ArrowUp, Paperclip, Square, Workflow, X } from 'lucide-react'
import { uploadChatImage } from './chat.services'

type PendingImage = ChatImageArtifact & { previewUrl: string }

export function ChatComposer({
  conversationId,
  disabled,
  isResponding,
  isStopping,
  onError,
  onStartPrompt,
  onStop,
  prompt,
  setPrompt,
  statusMessage,
}: {
  conversationId: string | undefined
  disabled: boolean
  isResponding: boolean
  isStopping: boolean
  onError(message: string): void
  onStartPrompt(prompt: string, imageIds: string[]): Promise<boolean>
  onStop(): void
  prompt: string
  setPrompt(value: string): void
  statusMessage?: string
}) {
  const [mermaidOpen, setMermaidOpen] = useState(false)
  const [mermaidSource, setMermaidSource] = useState('')
  const [pendingImages, setPendingImages] = useState<PendingImage[]>([])
  const [uploadingImages, setUploadingImages] = useState(false)
  const imageInput = useRef<HTMLInputElement>(null)

  async function addImages(files: File[]) {
    if (!conversationId || !files.length) return
    const supported = files.filter((file) => ['image/jpeg', 'image/png', 'image/webp'].includes(file.type)).slice(0, 4)
    if (!supported.length) return onError('Use PNG, JPEG, or WebP images.')
    setUploadingImages(true)
    try {
      const uploaded = await Promise.all(supported.map(async (file) => ({ ...await uploadChatImage(conversationId, file), previewUrl: URL.createObjectURL(file) })))
      setPendingImages((current) => [...current, ...uploaded].slice(0, 4))
    } catch (reason) {
      onError(reason instanceof Error ? reason.message : 'Could not upload the image.')
    } finally {
      setUploadingImages(false)
    }
  }

  async function sendPrompt(event?: FormEvent) {
    event?.preventDefault()
    const promptText = prompt.trim() || (pendingImages.length ? 'Analyze the attached image.' : '')
    const rawPrompt = mermaidSource.trim() ? `${promptText}\n\n\`\`\`mermaid\n${mermaidSource}\n\`\`\`` : promptText
    setPrompt('')
    setMermaidSource('')
    const images = pendingImages
    setPendingImages([])
    if (!(await onStartPrompt(rawPrompt, images.map(({ id }) => id)))) {
      setPrompt(rawPrompt)
      setPendingImages(images)
    }
  }

  function onImageInput(event: ChangeEvent<HTMLInputElement>) {
    void addImages(Array.from(event.target.files ?? []))
    event.target.value = ''
  }

  function onImagePaste(event: ClipboardEvent<HTMLTextAreaElement>) {
    const images = Array.from(event.clipboardData.files).filter((file) => file.type.startsWith('image/'))
    if (!images.length) return
    event.preventDefault()
    void addImages(images)
  }

  function onImageDrop(event: DragEvent<HTMLFormElement>) {
    event.preventDefault()
    void addImages(Array.from(event.dataTransfer.files))
  }

  function handleKeyDown(event: KeyboardEvent<HTMLTextAreaElement>) {
    if (event.key !== 'Enter' || event.shiftKey) return
    event.preventDefault()
    void sendPrompt()
  }

  return (
    <form className="shrink-0 px-3 pb-3 pt-2 sm:px-5 sm:pb-5 lg:px-10 2xl:px-16" onDragOver={(event) => event.preventDefault()} onDrop={onImageDrop} onSubmit={(event) => void sendPrompt(event)}>
      <div className="rounded-2xl border bg-background p-2 shadow-sm">
        <input accept="image/jpeg,image/png,image/webp" className="sr-only" multiple onChange={onImageInput} ref={imageInput} type="file" />
        {pendingImages.length ? <div className="flex flex-wrap gap-2 px-2 pb-2">{pendingImages.map((image) => <div className="group relative" key={image.id}><img alt={image.name} className="size-14 rounded-lg border object-cover" src={image.previewUrl} /><Button aria-label={`Remove ${image.name}`} className="absolute -right-1 -top-1 opacity-0 group-hover:opacity-100" onClick={() => setPendingImages((current) => current.filter(({ id }) => id !== image.id))} size="icon-xs" type="button" variant="neutral"><X /></Button></div>)}</div> : null}
        {mermaidOpen ? <div className="grid gap-3 px-2 pb-3"><Textarea aria-label="Mermaid diagram source" className="min-h-28 font-mono text-sm" onChange={(event) => setMermaidSource(event.target.value)} placeholder={'flowchart LR\n  Idea --> Review\n  Review --> Task'} value={mermaidSource} /><MermaidPreview source={mermaidSource} /></div> : null}
        <Textarea aria-label="Prompt Codex" autoFocus className="scrollbar-none min-h-32 max-h-36 resize-none overflow-y-auto border-0 bg-transparent shadow-none focus-visible:border-transparent focus-visible:ring-0" disabled={disabled} onChange={(event) => setPrompt(event.target.value)} onKeyDown={handleKeyDown} onPaste={onImagePaste} placeholder="Message Codex…" value={prompt} />
        <div className="flex justify-end"><Button aria-label="Attach image" className="mr-auto cursor-pointer" disabled={uploadingImages || disabled} onClick={() => imageInput.current?.click()} size="icon" type="button" variant="ghost"><Paperclip /></Button><Button aria-label="Toggle Mermaid diagram" className="cursor-pointer" disabled={disabled} onClick={() => setMermaidOpen((current) => !current)} size="icon" type="button" variant="ghost"><Workflow /></Button>{isResponding ? <Button aria-label={isStopping ? 'Stopping response' : 'Stop response'} className="zetro-stop-shimmer cursor-pointer" disabled={isStopping} onClick={onStop} size="icon" type="button" variant="neutral"><Square className="size-3 fill-current" /></Button> : <Button aria-label="Send prompt" className="cursor-pointer" disabled={disabled || (!prompt.trim() && !mermaidSource.trim() && !pendingImages.length)} size="icon" type="submit"><ArrowUp /></Button>}</div>
      </div>
      {statusMessage ? <p className="pt-2 text-sm text-muted-foreground">{statusMessage}</p> : null}
    </form>
  )
}
