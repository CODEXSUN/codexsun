import { CheckCircle2Icon, CircleAlertIcon, CircleOffIcon, type LucideIcon } from 'lucide-react'
import type { ReactNode } from 'react'

import { Badge } from '../../components/badge'
import { cn } from '../../lib/utils'

export type WorkspaceRuntimeState = 'degraded' | 'live' | 'starting' | 'stopped'

export type WorkspaceRuntimeStatusProps = {
  action?: ReactNode
  checkedAt?: string
  className?: string
  httpStatus?: number | null
  port?: number
  responseTimeMs?: number | null
  state: WorkspaceRuntimeState
}

const stateConfig: Record<WorkspaceRuntimeState, { icon: LucideIcon; label: string; variant: 'secondary' | 'studio-success' | 'studio-warning' }> = {
  degraded: { icon: CircleAlertIcon, label: 'Degraded', variant: 'studio-warning' },
  live: { icon: CheckCircle2Icon, label: 'Live', variant: 'studio-success' },
  starting: { icon: CircleAlertIcon, label: 'Starting', variant: 'studio-warning' },
  stopped: { icon: CircleOffIcon, label: 'Not running', variant: 'secondary' },
}

export function WorkspaceRuntimeStatus({ action, checkedAt, className, httpStatus, port, responseTimeMs, state }: WorkspaceRuntimeStatusProps) {
  const config = stateConfig[state]
  const Icon = config.icon
  const detail = state === 'live'
    ? [port ? `:${port}` : null, responseTimeMs == null ? null : `${responseTimeMs}ms`].filter(Boolean).join(' · ')
    : state === 'degraded' && httpStatus
      ? `HTTP ${httpStatus}`
      : null

  return (
    <div aria-live="polite" className={cn('flex min-w-0 items-center justify-between gap-3', className)}>
      <div className="flex min-w-0 items-center gap-2">
        <Badge aria-label={`Runtime status: ${config.label}`} variant={config.variant}>
          <Icon aria-hidden="true" />
          {config.label}
        </Badge>
        {detail ? <span className="truncate text-xs text-muted-foreground">{detail}</span> : null}
        {checkedAt ? <span className="sr-only">Last checked {checkedAt}</span> : null}
      </div>
      {action}
    </div>
  )
}
