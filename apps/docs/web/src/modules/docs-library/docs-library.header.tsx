import { Check, Copy, FilePenLine, FileText, Share2 } from 'lucide-react'
import { useEffect, useState } from 'react'
import { Button } from '@codexsun/ui/components/button'
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@codexsun/ui/components/tooltip'

type DocsHeaderDocument = {
  path: string
  title: string
}

export function DocsLibraryHeader({
  document,
  onEdit,
  title,
}: {
  document?: DocsHeaderDocument
  onEdit?: () => void
  title?: string
}) {
  const [actionState, setActionState] = useState<'failed' | 'idle' | 'path-copied' | 'shared'>(
    'idle',
  )

  useEffect(() => {
    if (actionState === 'idle') return
    const timeout = window.setTimeout(() => setActionState('idle'), 2000)
    return () => window.clearTimeout(timeout)
  }, [actionState])

  async function copyText(text: string, successState: 'path-copied' | 'shared') {
    try {
      await navigator.clipboard.writeText(text)
      setActionState(successState)
    } catch {
      setActionState('failed')
    }
  }

  async function copyPath() {
    if (!document) return
    await copyText(document.path, 'path-copied')
  }

  async function shareDocument() {
    if (!document) return
    const shareData = { title: document.title, url: window.location.href }
    if (navigator.share) {
      try {
        await navigator.share(shareData)
        setActionState('shared')
        return
      } catch (error) {
        if (error instanceof DOMException && error.name === 'AbortError') return
      }
    }
    await copyText(shareData.url, 'shared')
  }

  const copyLabel =
    actionState === 'path-copied'
      ? 'File path copied'
      : actionState === 'failed'
        ? 'Copy file path failed'
        : 'Copy file path'
  const shareLabel =
    actionState === 'shared'
      ? 'Document link shared'
      : actionState === 'failed'
        ? 'Share link failed'
        : 'Share document link'

  return (
    <header className="flex h-12 shrink-0 items-center justify-between gap-3 border-b bg-background/95 px-4 backdrop-blur lg:px-6">
      <div className="flex min-w-0 items-center gap-2">
        <FileText className="size-3.5 shrink-0 text-muted-foreground" />
        <p className="truncate text-sm font-semibold">
          {document?.title ?? title ?? 'Documentation index'}
        </p>
      </div>
      {document ? (
        <div className="flex min-w-0 items-center gap-1">
          <code className="hidden max-w-[min(42vw,42rem)] truncate rounded-md bg-muted px-2 py-1 text-sm sm:block">
            {document.path}
          </code>
          <TooltipProvider>
            {onEdit ? (
              <Tooltip>
                <TooltipTrigger
                  render={<Button aria-label="Edit document" size="icon-sm" variant="ghost" />}
                  onClick={onEdit}
                >
                  <FilePenLine />
                </TooltipTrigger>
                <TooltipContent>Edit document</TooltipContent>
              </Tooltip>
            ) : null}
            <Tooltip>
              <TooltipTrigger
                render={<Button aria-label={shareLabel} size="icon-sm" variant="ghost" />}
                onClick={shareDocument}
              >
                {actionState === 'shared' ? <Check /> : <Share2 />}
              </TooltipTrigger>
              <TooltipContent>{shareLabel}</TooltipContent>
            </Tooltip>
            <Tooltip>
              <TooltipTrigger
                render={<Button aria-label={copyLabel} size="icon-sm" variant="ghost" />}
                onClick={copyPath}
              >
                {actionState === 'path-copied' ? <Check /> : <Copy />}
              </TooltipTrigger>
              <TooltipContent>{copyLabel}</TooltipContent>
            </Tooltip>
          </TooltipProvider>
        </div>
      ) : null}
    </header>
  )
}
