import { Badge } from '@codexsun/ui/components/badge'
import { Button } from '@codexsun/ui/components/button'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@codexsun/ui/components/table'
import { Play, Square } from 'lucide-react'
import type { ServiceAction, ServiceSnapshot } from './orchestration.types'

type OrchestrationListProps = {
  actionPending: boolean
  selectedId?: string
  services: readonly ServiceSnapshot[]
  onAction: (serviceId: string, action: ServiceAction) => void
  onSelect: (serviceId: string) => void
}

export function OrchestrationList({
  actionPending,
  selectedId,
  services,
  onAction,
  onSelect,
}: OrchestrationListProps) {
  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>Service</TableHead>
          <TableHead>Status</TableHead>
          <TableHead>Latency</TableHead>
          <TableHead>Memory</TableHead>
          <TableHead>Uptime</TableHead>
          <TableHead className="w-28 text-right">Control</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {services.map((service) => (
          <TableRow
            data-state={selectedId === service.id ? 'selected' : undefined}
            key={service.id}
          >
            <TableCell>
              <button
                className="flex w-full cursor-pointer items-center gap-3 text-left"
                onClick={() => onSelect(service.id)}
                type="button"
              >
                <span className={`size-2.5 shrink-0 rounded-full ${statusColor(service.state)}`} />
                <span className="min-w-0">
                  <span className="block font-medium">{service.id}</span>
                  <span className="block text-xs text-muted-foreground">
                    {service.applicationId} · {service.kind} · :{service.port}
                  </span>
                </span>
              </button>
            </TableCell>
            <TableCell>
              <Badge variant={service.state === 'offline' ? 'outline' : 'secondary'}>
                {service.state}
              </Badge>
            </TableCell>
            <TableCell>{service.latencyMs === null ? '—' : `${service.latencyMs} ms`}</TableCell>
            <TableCell>{formatBytes(service.memoryBytes)}</TableCell>
            <TableCell>{formatDuration(service.uptimeSeconds)}</TableCell>
            <TableCell className="text-right">
              {service.controllable ? (
                <Button
                  aria-label={`${service.state === 'offline' ? 'Start' : 'Stop'} ${service.id}`}
                  disabled={actionPending}
                  onClick={() =>
                    onAction(service.id, service.state === 'offline' ? 'start' : 'stop')
                  }
                  size="icon-sm"
                  variant={service.state === 'offline' ? 'outline' : 'ghost'}
                >
                  {service.state === 'offline' ? <Play /> : <Square />}
                </Button>
              ) : (
                <span className="text-xs text-muted-foreground">
                  {service.protected ? 'Protected' : 'Read only'}
                </span>
              )}
            </TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  )
}

function statusColor(state: ServiceSnapshot['state']): string {
  if (state === 'online') return 'bg-emerald-500 shadow-[0_0_0_3px_rgb(16_185_129/0.12)]'
  if (state === 'degraded') return 'bg-amber-500 shadow-[0_0_0_3px_rgb(245_158_11/0.12)]'
  return 'bg-muted-foreground/40'
}

function formatBytes(bytes: number | null): string {
  if (bytes === null) return '—'
  return `${(bytes / 1_048_576).toFixed(1)} MB`
}

function formatDuration(seconds: number | null): string {
  if (seconds === null) return '—'
  if (seconds < 60) return `${seconds}s`
  if (seconds < 3_600) return `${Math.floor(seconds / 60)}m`
  return `${Math.floor(seconds / 3_600)}h ${Math.floor((seconds % 3_600) / 60)}m`
}
