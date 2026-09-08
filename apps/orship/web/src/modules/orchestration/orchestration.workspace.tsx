import { Button } from '@codexsun/ui/components/button'
import { RefreshCw } from 'lucide-react'
import { useEffect, useMemo, useState, type ReactNode } from 'react'
import { OrchestrationDetails } from './orchestration.details'
import { useOrchestrationOverview, useServiceAction, useServiceLogs } from './orchestration.hooks'
import { OrchestrationList } from './orchestration.list'
import { OrchestrationSummary } from './orchestration.summary'
import type { ServiceAction } from './orchestration.types'

export function OrchestrationWorkspace() {
  const overview = useOrchestrationOverview()
  const action = useServiceAction()
  const [selectedId, setSelectedId] = useState<string>()
  const services = overview.data?.services ?? []
  const selectedService = useMemo(
    () => services.find(({ id }) => id === selectedId) ?? services[0],
    [selectedId, services],
  )
  const logs = useServiceLogs(selectedService?.id)

  useEffect(() => {
    if (!selectedId && services[0]) setSelectedId(services[0].id)
  }, [selectedId, services])

  const runAction = (serviceId: string, serviceAction: ServiceAction) => {
    action.mutate({ action: serviceAction, serviceId })
  }

  if (overview.isLoading) return <WorkspaceMessage title="Reading live processes…" />
  if (overview.isError) {
    return (
      <WorkspaceMessage
        action={<Button onClick={() => overview.refetch()}>Try again</Button>}
        detail={overview.error.message}
        title="Orship API is unavailable"
      />
    )
  }
  if (!overview.data) return <WorkspaceMessage title="No orchestration data is available." />

  return (
    <div className="flex size-full min-h-0 flex-col overflow-hidden">
      <header className="flex items-center justify-between gap-4 px-5 py-4">
        <div>
          <h1 className="text-xl font-semibold tracking-tight">Live services</h1>
          <p className="text-sm text-muted-foreground">
            Real process health, runtime metrics, controls, and shared logs.
          </p>
        </div>
        <Button disabled={overview.isFetching} onClick={() => overview.refetch()} variant="outline">
          <RefreshCw className={overview.isFetching ? 'animate-spin' : undefined} />
          Refresh
        </Button>
      </header>

      <OrchestrationSummary overview={overview.data} />
      {action.error ? (
        <div className="border-b border-destructive/30 bg-destructive/5 px-5 py-2 text-sm text-destructive">
          {action.error.message}
        </div>
      ) : null}

      <div className="grid min-h-0 flex-1 grid-cols-1 overflow-hidden xl:grid-cols-[minmax(0,1.65fr)_minmax(340px,0.85fr)]">
        <div className="min-h-0 overflow-auto border-r border-border">
          <OrchestrationList
            actionPending={action.isPending}
            selectedId={selectedService?.id}
            services={services}
            onAction={runAction}
            onSelect={setSelectedId}
          />
        </div>
        <aside className="min-h-72 overflow-hidden border-t border-border xl:border-t-0">
          <OrchestrationDetails logs={logs.data} service={selectedService} />
        </aside>
      </div>
    </div>
  )
}

function WorkspaceMessage({
  action,
  detail,
  title,
}: {
  action?: ReactNode
  detail?: string
  title: string
}) {
  return (
    <div className="flex size-full items-center justify-center p-8">
      <div className="flex max-w-md flex-col items-center gap-3 text-center">
        <h1 className="text-lg font-semibold">{title}</h1>
        {detail ? <p className="text-sm text-muted-foreground">{detail}</p> : null}
        {action}
      </div>
    </div>
  )
}
