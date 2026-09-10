import { CheckIcon, Code2Icon, CopyIcon } from 'lucide-react'
import { useEffect, useState } from 'react'
import { Badge } from '@codexsun/ui/components/badge'
import { Button } from '@codexsun/ui/components/button'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@codexsun/ui/components/dialog'
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@codexsun/ui/components/tooltip'
import { UiTemplateCode } from '@codexsun/ui/templates/ui-page'
import { createUiPageCode } from './ui-page-code'
import { UiPagePreview } from './ui-page-preview'
import type { UiPageDoc } from './ui-pages'

export function UiPageVariantCard({
  isDefault,
  onSetDefault,
  page,
}: {
  isDefault: boolean
  onSetDefault: () => void
  page: UiPageDoc
}) {
  const code = createUiPageCode(page)
  const [copyState, setCopyState] = useState<'copied' | 'failed' | 'idle'>('idle')

  useEffect(() => {
    if (copyState === 'idle') return
    const timeout = window.setTimeout(() => setCopyState('idle'), 2500)
    return () => window.clearTimeout(timeout)
  }, [copyState])

  async function copyCode() {
    try {
      await navigator.clipboard.writeText(code)
      setCopyState('copied')
    } catch {
      setCopyState('failed')
    }
  }

  const copyLabel =
    copyState === 'copied'
      ? 'Page code copied'
      : copyState === 'failed'
        ? 'Copy failed'
        : 'Copy page code'

  return (
    <TooltipProvider>
      <article className="overflow-hidden rounded-xl border bg-card">
        <header className="flex min-h-12 items-center justify-between gap-3 border-b px-4 py-1.5">
          <div className="flex min-w-0 items-center gap-2">
            <span className="font-mono text-sm text-muted-foreground">01.</span>
            <h2 className="truncate text-sm font-semibold">{page.name}</h2>
            {isDefault ? <DefaultBadge /> : null}
          </div>
          <div className="flex shrink-0 items-center gap-1">
            {!isDefault ? (
              <Button onClick={onSetDefault} size="sm" variant="ghost">
                Set default
              </Button>
            ) : null}
            <Tooltip>
              <TooltipTrigger
                render={
                  <Button
                    aria-label={copyLabel}
                    onClick={copyCode}
                    size="icon-sm"
                    variant="ghost"
                  />
                }
              >
                {copyState === 'copied' ? <CheckIcon /> : <CopyIcon />}
              </TooltipTrigger>
              <TooltipContent>{copyLabel}</TooltipContent>
            </Tooltip>
            <PageCodeDialog code={code} page={page} />
          </div>
        </header>
        <div className="min-w-0 overflow-hidden">
          <UiPagePreview page={page} />
        </div>
      </article>
    </TooltipProvider>
  )
}

function DefaultBadge() {
  return (
    <Badge
      className="border-emerald-200 bg-emerald-50 text-emerald-700 dark:border-emerald-800 dark:bg-emerald-950 dark:text-emerald-300"
      variant="outline"
    >
      Default
    </Badge>
  )
}

function PageCodeDialog({ code, page }: { code: string; page: UiPageDoc }) {
  const variant = page.family.variants.find(({ id }) => id === page.variantId)
  return (
    <Dialog>
      <Tooltip>
        <TooltipTrigger
          render={
            <DialogTrigger
              aria-label={`Show ${page.name} code`}
              render={<Button size="icon-sm" variant="ghost" />}
            />
          }
        >
          <Code2Icon />
        </TooltipTrigger>
        <TooltipContent>Show code</TooltipContent>
      </Tooltip>
      <DialogContent className="max-h-[85vh] gap-0 overflow-hidden p-0 sm:max-w-3xl">
        <DialogHeader className="border-b p-4 pr-12">
          <DialogTitle>{page.name}</DialogTitle>
          <DialogDescription>{variant?.description}</DialogDescription>
        </DialogHeader>
        <div className="min-h-0 overflow-auto p-4">
          <UiTemplateCode code={code} copyLabel="Copy page" />
        </div>
      </DialogContent>
    </Dialog>
  )
}
