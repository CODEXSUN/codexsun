import { Badge } from '@codexsun/ui/components/badge'
import { ArrowRight, Radio } from 'lucide-react'
import type { ServiceSnapshot } from './orchestration.types'

type ApplicationGroup = {
  applicationId: string
  services: readonly ServiceSnapshot[]
}

export function OrchestrationList({
  services,
  onSelect,
}: {
  services: readonly ServiceSnapshot[]
  onSelect: (applicationId: string) => void
}) {
  const groups = groupServices(services)

  return (
    <div className="mx-auto flex w-full max-w-6xl flex-col gap-5 p-5">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <p className="text-sm font-semibold">Service desk</p>
          <p className="text-sm text-muted-foreground">
            Select an application to inspect its combined runtime report and component logs.
          </p>
        </div>
        <p className="font-mono text-xs text-muted-foreground">
          {services.length} monitored processes
        </p>
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        {groups.map((group) => (
          <ApplicationCard group={group} key={group.applicationId} onSelect={onSelect} />
        ))}
      </div>
    </div>
  )
}

function ApplicationCard({
  group,
  onSelect,
}: {
  group: ApplicationGroup
  onSelect: (applicationId: string) => void
}) {
  const online = group.services.filter((service) => service.state === 'online').length

  return (
    <button
      aria-label={`Open ${group.applicationId} combined service report`}
      className="w-full cursor-pointer overflow-hidden rounded-lg border border-border bg-card text-left transition-colors hover:border-foreground/25 hover:bg-muted/20 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
      onClick={() => onSelect(group.applicationId)}
      type="button"
    >
      <header className="flex items-center justify-between gap-3 border-b border-border bg-muted/30 px-4 py-3">
        <div>
          <h2 className="font-semibold capitalize">{group.applicationId}</h2>
          <p className="text-xs text-muted-foreground">Application runtime</p>
        </div>
        <Badge variant="outline">
          {online}/{group.services.length} online
        </Badge>
      </header>
      <div className="divide-y divide-border">
        {group.services.map((service) => (
          <div className="flex w-full items-center gap-3 px-4 py-3" key={service.id}>
            <span className={`size-2.5 shrink-0 rounded-full ${statusColor(service.state)}`} />
            <Radio className="size-4 shrink-0 text-muted-foreground" aria-hidden="true" />
            <span className="min-w-0 flex-1">
              <span className="flex items-center gap-2">
                <strong className="text-sm font-semibold uppercase">{service.kind}</strong>
                <span className="font-mono text-xs text-muted-foreground">:{service.port}</span>
              </span>
              <span className="block truncate text-xs text-muted-foreground">{service.id}</span>
            </span>
            <Badge
              className="shrink-0"
              variant={service.state === 'offline' ? 'outline' : 'secondary'}
            >
              {service.state}
            </Badge>
            <ArrowRight className="size-4 shrink-0 text-muted-foreground" aria-hidden="true" />
          </div>
        ))}
      </div>
    </button>
  )
}

function groupServices(services: readonly ServiceSnapshot[]): ApplicationGroup[] {
  const groups = new Map<string, ServiceSnapshot[]>()
  for (const service of services) {
    const group = groups.get(service.applicationId) ?? []
    group.push(service)
    groups.set(service.applicationId, group)
  }
  return [...groups].map(([applicationId, groupedServices]) => ({
    applicationId,
    services: groupedServices.sort((left, right) => serviceOrder(left) - serviceOrder(right)),
  }))
}

function serviceOrder(service: ServiceSnapshot): number {
  if (service.kind === 'api') return 0
  if (service.kind === 'web') return 1
  return 2
}

function statusColor(state: ServiceSnapshot['state']): string {
  if (state === 'online') return 'bg-emerald-500'
  if (state === 'degraded') return 'bg-amber-500'
  return 'bg-muted-foreground/40'
}
