import { Check, Code2, Copy } from 'lucide-react'
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
import { createComponentCode } from './component-code'
import { ComponentSpecimen } from './component-specimen'
import type { UiComponentVariant, UiComponentVariantId } from './component-variants'
import type { UiComponentDoc } from './ui-components'

type ComponentVariantGalleryProps = {
  component: UiComponentDoc
  defaultVariantId: UiComponentVariantId
  onDefaultVariantChange: (variant: UiComponentVariantId) => void
  variants: readonly UiComponentVariant[]
}

export function ComponentVariantGallery({
  component,
  defaultVariantId,
  onDefaultVariantChange,
  variants,
}: ComponentVariantGalleryProps) {
  return (
    <TooltipProvider>
      <div className="grid gap-5">
        {variants.map((variant, index) => (
          <ComponentVariantCard
            component={component}
            index={index}
            isDefault={variant.id === defaultVariantId}
            key={variant.id}
            onSetDefault={() => onDefaultVariantChange(variant.id)}
            variant={variant}
          />
        ))}
      </div>
    </TooltipProvider>
  )
}

function ComponentVariantCard({
  component,
  index,
  isDefault,
  onSetDefault,
  variant,
}: {
  component: UiComponentDoc
  index: number
  isDefault: boolean
  onSetDefault: () => void
  variant: UiComponentVariant
}) {
  const code = createComponentCode(component, variant.id)
  const [copyState, setCopyState] = useState<'copied' | 'failed' | 'idle'>('idle')

  useEffect(() => {
    if (copyState === 'idle') return
    const timeout = window.setTimeout(() => setCopyState('idle'), 3000)
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

  return (
    <article className="overflow-hidden rounded-xl border bg-card">
      <header className="flex min-h-12 items-center justify-between gap-3 border-b px-4 py-1.5">
        <div className="flex min-w-0 items-center gap-2">
          <span className="shrink-0 font-mono text-sm text-muted-foreground">
            {String(index + 1).padStart(2, '0')}.
          </span>
          <h3 className="truncate text-sm font-semibold">{variant.name}</h3>
          {isDefault ? <DefaultBadge /> : null}
        </div>
        <div className="flex shrink-0 items-center gap-1">
          {!isDefault ? (
            <Button onClick={onSetDefault} size="sm" variant="ghost">
              Set default
            </Button>
          ) : null}
          <VariantCopyButton copyCode={copyCode} copyState={copyState} />
          <VariantCodeDialog code={code} componentName={component.name} variant={variant} />
        </div>
      </header>
      <div className="px-6 py-8 sm:px-10">
        <ComponentSpecimen compact component={component} variant={variant.id} />
      </div>
    </article>
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

function VariantCopyButton({
  copyCode,
  copyState,
}: {
  copyCode: () => void
  copyState: 'copied' | 'failed' | 'idle'
}) {
  const label =
    copyState === 'copied'
      ? 'Variant copied'
      : copyState === 'failed'
        ? 'Copy failed'
        : 'Copy variant'

  return (
    <Tooltip>
      <TooltipTrigger
        render={<Button aria-label={label} onClick={copyCode} size="icon-sm" variant="ghost" />}
      >
        {copyState === 'copied' ? <Check /> : <Copy />}
      </TooltipTrigger>
      <TooltipContent>{label}</TooltipContent>
    </Tooltip>
  )
}

function VariantCodeDialog({
  code,
  componentName,
  variant,
}: {
  code: string
  componentName: string
  variant: UiComponentVariant
}) {
  return (
    <Dialog>
      <Tooltip>
        <TooltipTrigger
          render={
            <DialogTrigger
              aria-label={`Show ${variant.name} code`}
              render={<Button size="icon-sm" variant="ghost" />}
            />
          }
        >
          <Code2 />
        </TooltipTrigger>
        <TooltipContent>Show code</TooltipContent>
      </Tooltip>
      <DialogContent className="max-h-[85vh] gap-0 overflow-hidden p-0 sm:max-w-3xl">
        <DialogHeader className="border-b p-4 pr-12">
          <DialogTitle>
            {componentName} · {variant.name}
          </DialogTitle>
          <DialogDescription>{variant.description}</DialogDescription>
        </DialogHeader>
        <div className="min-h-0 overflow-auto p-4">
          <UiTemplateCode code={code} copyLabel="Copy variant" />
        </div>
      </DialogContent>
    </Dialog>
  )
}
