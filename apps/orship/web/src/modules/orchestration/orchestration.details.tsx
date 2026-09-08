import { Badge } from '@codexsun/ui/components/badge'
import { ScrollArea } from '@codexsun/ui/components/scroll-area'
import { Activity, Cpu, FileText, MemoryStick } from 'lucide-react'
import type { ServiceLogsResponse, ServiceSnapshot } from './orchestration.types'

export function OrchestrationDetails({
  logs,
  service,
}: {
  logs?: ServiceLogsResponse
  service?: ServiceSnapshot
}) {
  if (!service) {
    return (
      <div className="flex h-full items-center justify-center px-6 text-center text-sm text-muted-foreground">
        Select a service to inspect its process and logs.
      </div>
    )
  }

  return (
    <div className="flex h-full min-h-0 flex-col">
      <div className="flex items-start justify-between gap-4 border-b border-border px-5 py-4">
        <div className="min-w-0">
          <p className="truncate font-semibold">{service.id}</p>
          <p className="text-sm text-muted-foreground">PID {service.pid ?? 'not running'}</p>
        </div>
        <Badge variant="outline">{service.state}</Badge>
      </div>

      <div className="grid grid-cols-3 border-b border-border">
        <Metric
          icon={Activity}
          label="Latency"
          value={service.latencyMs === null ? '—' : `${service.latencyMs} ms`}
        />
        <Metric
          icon={MemoryStick}
          label="Memory"
          value={
            service.memoryBytes === null
              ? '—'
              : `${(service.memoryBytes / 1_048_576).toFixed(1)} MB`
          }
        />
        <Metric
          icon={Cpu}
          label="CPU time"
          value={service.cpuSeconds === null ? '—' : `${service.cpuSeconds.toFixed(1)} s`}
        />
      </div>

      <div className="flex items-center gap-2 px-5 py-3 text-sm font-medium">
        <FileText className="size-4 text-muted-foreground" />
        Runtime logs
      </div>
      <ScrollArea className="min-h-0 flex-1 border-t border-border bg-zinc-950">
        <pre className="min-h-full whitespace-pre-wrap break-words p-4 font-mono text-xs leading-5 text-zinc-300">
          {logs?.lines.length
            ? logs.lines.join('\n')
            : service.logsAvailable
              ? 'Waiting for log output…'
              : 'No shared runtime log exists for this service.'}
        </pre>
      </ScrollArea>
    </div>
  )
}

function Metric({
  icon: Icon,
  label,
  value,
}: {
  icon: typeof Activity
  label: string
  value: string
}) {
  return (
    <div className="flex min-w-0 flex-col gap-1 px-4 py-3">
      <span className="flex items-center gap-1.5 text-xs text-muted-foreground">
        <Icon className="size-3.5" />
        {label}
      </span>
      <strong className="truncate text-sm font-medium">{value}</strong>
    </div>
  )
}
