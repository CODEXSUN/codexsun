import { useEffect, useState } from 'react'
import { Check, Copy } from 'lucide-react'
import { Badge } from '../../components/badge'
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from '../../components/breadcrumb'
import { Button } from '../../components/button'
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '../../components/tooltip'
import { cn } from '../../lib/utils'

export type UiTemplateKind = 'Block' | 'Component'

export function UiTemplateHeader({
  importPath,
  kind,
  name,
  topologyLabelsVisible = false,
}: {
  importPath: string
  kind: UiTemplateKind
  name: string
  topologyLabelsVisible?: boolean
}) {
  const [copyState, setCopyState] = useState<'copied' | 'failed' | 'idle'>('idle')

  useEffect(() => {
    if (copyState === 'idle') return
    const timeout = window.setTimeout(() => setCopyState('idle'), 2000)
    return () => window.clearTimeout(timeout)
  }, [copyState])

  async function copyImportPath() {
    try {
      await navigator.clipboard.writeText(importPath)
      setCopyState('copied')
    } catch {
      setCopyState('failed')
    }
  }

  const copyLabel =
    copyState === 'copied'
      ? 'Import path copied'
      : copyState === 'failed'
        ? 'Copy import path failed'
        : 'Copy import path'

  return (
    <header
      className={cn(
        'sticky top-0 z-20 flex min-h-14 items-center justify-between gap-4 border-b bg-background/95 pr-6 backdrop-blur lg:pr-10',
        topologyLabelsVisible ? 'pl-52' : 'pl-6 lg:pl-10',
      )}
    >
      <Breadcrumb>
        <BreadcrumbList>
          <BreadcrumbItem>
            <Badge variant="secondary">{kind}</Badge>
          </BreadcrumbItem>
          <BreadcrumbSeparator />
          <BreadcrumbItem>
            <BreadcrumbPage className="font-semibold">{name}</BreadcrumbPage>
          </BreadcrumbItem>
        </BreadcrumbList>
      </Breadcrumb>

      <div className="flex min-w-0 items-center gap-1.5">
        <code className="truncate rounded-md bg-muted px-2.5 py-1.5 text-sm">{importPath}</code>
        <TooltipProvider>
          <Tooltip>
            <TooltipTrigger
              render={<Button aria-label={copyLabel} size="icon-sm" variant="ghost" />}
              onClick={copyImportPath}
            >
              {copyState === 'copied' ? <Check /> : <Copy />}
            </TooltipTrigger>
            <TooltipContent>{copyLabel}</TooltipContent>
          </Tooltip>
        </TooltipProvider>
      </div>
    </header>
  )
}
