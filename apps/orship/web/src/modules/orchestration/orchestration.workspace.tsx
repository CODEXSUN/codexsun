import { Button } from '@codexsun/ui/components/button'
import { ArrowLeft, ArrowRight, ChevronRight, RefreshCw } from 'lucide-react'
import { useMemo, useState, type ReactNode } from 'react'
import { OrchestrationDetails } from './orchestration.details'
import {
  useCloudTarget,
  useDeploymentEvidence,
  useDockerContainerAction,
  useDockerContainers,
  useDeploymentRecord,
  useDeploymentRecords,
  useOrchestrationOverview,
  useServiceAction,
  useServiceLogs,
  useRuntimeFailures,
} from './orchestration.hooks'
import { OrchestrationList } from './orchestration.list'
import { OrchestrationSummary } from './orchestration.summary'
import type { ServiceAction } from './orchestration.types'

type WorkspaceView = { page: 'list' } | { applicationId: string; page: 'show' }

export function OrchestrationWorkspace({
  onOpenDeploymentSettings,
}: {
  onOpenDeploymentSettings: () => void
}) {
  const overview = useOrchestrationOverview()
  const cloudTarget = useCloudTarget()
  const deploymentEvidence = useDeploymentEvidence()
  const deploymentRecord = useDeploymentRecord()
  const deploymentRecords = useDeploymentRecords()
  const dockerContainers = useDockerContainers()
  const dockerAction = useDockerContainerAction()
  const action = useServiceAction()
  const failures = useRuntimeFailures()
  const [history, setHistory] = useState<WorkspaceView[]>([{ page: 'list' }])
  const [historyIndex, setHistoryIndex] = useState(0)
  const view = history[historyIndex]
  const services = overview.data?.services ?? []
  const selectedServices = useMemo(
    () =>
      view.page === 'show'
        ? services.filter(({ applicationId }) => applicationId === view.applicationId)
        : [],
    [services, view],
  )
  const apiService = selectedServices.find(({ kind }) => kind === 'api')
  const webService = selectedServices.find(({ kind }) => kind === 'web')
  const apiLogs = useServiceLogs(apiService?.id)
  const webLogs = useServiceLogs(webService?.id)

  const navigate = (nextView: WorkspaceView) => {
    const nextHistory = [...history.slice(0, historyIndex + 1), nextView]
    setHistory(nextHistory)
    setHistoryIndex(nextHistory.length - 1)
  }
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

  if (view.page === 'show' && selectedServices.length > 0) {
    return (
      <div className="flex size-full min-h-0 flex-col overflow-hidden bg-muted/20">
        <ShowHeader
          canGoBack={historyIndex > 0}
          canGoForward={historyIndex < history.length - 1}
          fetching={overview.isFetching}
          applicationId={view.applicationId}
          onBack={() => setHistoryIndex((index) => index - 1)}
          onForward={() => setHistoryIndex((index) => index + 1)}
          onRefresh={() => void overview.refetch()}
          onShowList={() => navigate({ page: 'list' })}
        />
        <div className="flex min-h-0 flex-1 justify-center overflow-hidden px-4 py-4">
          <div className="flex min-h-0 w-full flex-col overflow-hidden border border-border bg-background xl:w-[90%]">
            {action.error ? <ActionError message={action.error.message} /> : null}
            <OrchestrationDetails
              actionPending={action.isPending}
              cloudTarget={cloudTarget.data}
              deploymentEvidence={deploymentEvidence.data}
              deploymentRecordError={deploymentRecord.error?.message}
              deploymentRecordPending={deploymentRecord.isPending}
              deploymentRecords={deploymentRecords.data?.records ?? []}
              dockerActionError={dockerAction.error?.message}
              dockerActionPending={dockerAction.isPending}
              dockerWorkloads={dockerContainers.data}
              failures={failures.data}
              logsByService={{
                ...(apiService ? { [apiService.id]: apiLogs.data } : {}),
                ...(webService ? { [webService.id]: webLogs.data } : {}),
              }}
              logsFetching={apiLogs.isFetching || webLogs.isFetching}
              services={selectedServices}
              onAction={runAction}
              onCreateDeploymentRecord={(record) => deploymentRecord.mutate(record)}
              onDockerAction={(containerId, dockerActionName) =>
                dockerAction.mutate({ action: dockerActionName, containerId })
              }
              onOpenDeploymentSettings={onOpenDeploymentSettings}
              onRefreshLogs={(serviceId) => {
                if (serviceId === apiService?.id) void apiLogs.refetch()
                if (serviceId === webService?.id) void webLogs.refetch()
              }}
            />
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="flex size-full min-h-0 flex-col overflow-hidden">
      <ListHeader
        canGoBack={historyIndex > 0}
        canGoForward={historyIndex < history.length - 1}
        fetching={overview.isFetching}
        onBack={() => setHistoryIndex((index) => index - 1)}
        onForward={() => setHistoryIndex((index) => index + 1)}
        onRefresh={() => void overview.refetch()}
      />
      <OrchestrationSummary overview={overview.data} />
      {action.error ? <ActionError message={action.error.message} /> : null}
      <main className="min-h-0 flex-1 overflow-y-auto">
        <OrchestrationList
          services={services}
          onSelect={(applicationId) => navigate({ applicationId, page: 'show' })}
        />
      </main>
    </div>
  )
}

function ListHeader({
  canGoBack,
  canGoForward,
  fetching,
  onBack,
  onForward,
  onRefresh,
}: {
  canGoBack: boolean
  canGoForward: boolean
  fetching: boolean
  onBack: () => void
  onForward: () => void
  onRefresh: () => void
}) {
  return (
    <header className="flex items-center justify-between gap-4 px-5 py-4">
      <div>
        <h1 className="text-xl font-semibold tracking-tight">Live services</h1>
        <p className="text-sm text-muted-foreground">
          Monitor and maintain local application processes.
        </p>
      </div>
      <div className="flex items-center gap-2">
        <div className="flex items-center rounded-md border border-border p-0.5">
          <Button
            aria-label="Back"
            disabled={!canGoBack}
            onClick={onBack}
            size="icon-sm"
            variant="ghost"
          >
            <ArrowLeft />
          </Button>
          <Button
            aria-label="Forward"
            disabled={!canGoForward}
            onClick={onForward}
            size="icon-sm"
            variant="ghost"
          >
            <ArrowRight />
          </Button>
        </div>
        <Button disabled={fetching} onClick={onRefresh} variant="outline">
          <RefreshCw className={fetching ? 'animate-spin' : undefined} />
          Refresh
        </Button>
      </div>
    </header>
  )
}

function ShowHeader({
  canGoBack,
  canGoForward,
  fetching,
  applicationId,
  onBack,
  onForward,
  onRefresh,
  onShowList,
}: {
  canGoBack: boolean
  canGoForward: boolean
  fetching: boolean
  applicationId: string
  onBack: () => void
  onForward: () => void
  onRefresh: () => void
  onShowList: () => void
}) {
  return (
    <header className="flex flex-wrap items-center justify-between gap-3 border-b border-border bg-background px-5 py-3">
      <div className="flex min-w-0 items-center gap-2">
        <div className="flex items-center rounded-md border border-border p-0.5">
          <Button
            aria-label="Back"
            disabled={!canGoBack}
            onClick={onBack}
            size="icon-sm"
            variant="ghost"
          >
            <ArrowLeft />
          </Button>
          <Button
            aria-label="Forward"
            disabled={!canGoForward}
            onClick={onForward}
            size="icon-sm"
            variant="ghost"
          >
            <ArrowRight />
          </Button>
        </div>
        <nav aria-label="Breadcrumb" className="flex min-w-0 items-center gap-1 text-sm">
          <button
            className="cursor-pointer text-muted-foreground hover:text-foreground"
            onClick={onShowList}
            type="button"
          >
            Live services
          </button>
          <ChevronRight className="size-4 shrink-0 text-muted-foreground" aria-hidden="true" />
          <strong className="truncate capitalize">{applicationId}</strong>
        </nav>
      </div>
      <Button disabled={fetching} onClick={onRefresh} size="sm" variant="outline">
        <RefreshCw className={fetching ? 'animate-spin' : undefined} />
        Refresh
      </Button>
    </header>
  )
}

function ActionError({ message }: { message: string }) {
  return (
    <div className="border-b border-destructive/30 bg-destructive/5 px-5 py-2 text-sm text-destructive">
      {message}
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
