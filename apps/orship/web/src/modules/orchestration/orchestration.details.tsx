import { Badge } from '@codexsun/ui/components/badge'
import { Button } from '@codexsun/ui/components/button'
import { ScrollArea } from '@codexsun/ui/components/scroll-area'
import { Tabs, TabsList, TabsTrigger } from '@codexsun/ui/components/tabs'
import { Check, Clipboard, FileText, Play, RefreshCw, Square } from 'lucide-react'
import { useEffect, useMemo, useState } from 'react'
import { DeploymentConsole } from './deployment-console'
import { OrchestrationFailures } from './orchestration.failures'
import type {
  CloudTarget,
  DeploymentEvidence,
  DeploymentRecord,
  DeploymentRecordCreate,
  DockerContainerAction,
  DockerContainerList,
  RuntimeFailureOverview,
  ServiceAction,
  ServiceLogsResponse,
  ServiceSnapshot,
} from './orchestration.types'

export function OrchestrationDetails({
  actionPending,
  cloudTarget,
  deploymentEvidence,
  deploymentRecordError,
  deploymentRecordPending,
  deploymentRecords,
  dockerActionError,
  dockerActionPending,
  dockerWorkloads,
  failures,
  logsByService,
  logsFetching,
  services,
  onAction,
  onCreateDeploymentRecord,
  onDockerAction,
  onOpenDeploymentSettings,
  onRefreshLogs,
}: {
  actionPending: boolean
  cloudTarget: CloudTarget | undefined
  deploymentEvidence: DeploymentEvidence | undefined
  deploymentRecordError: string | undefined
  deploymentRecordPending: boolean
  deploymentRecords: readonly DeploymentRecord[]
  dockerActionError: string | undefined
  dockerActionPending: boolean
  dockerWorkloads: DockerContainerList | undefined
  failures: RuntimeFailureOverview | undefined
  logsByService: Readonly<Record<string, ServiceLogsResponse | undefined>>
  logsFetching: boolean
  services: readonly ServiceSnapshot[]
  onAction: (serviceId: string, action: ServiceAction) => void
  onCreateDeploymentRecord: (record: DeploymentRecordCreate) => void
  onDockerAction: (containerId: string, action: DockerContainerAction) => void
  onOpenDeploymentSettings: () => void
  onRefreshLogs: (serviceId: string) => void
}) {
  const [copied, setCopied] = useState(false)
  const [activePanel, setActivePanel] = useState<'overview' | 'deployment' | 'failures'>('overview')
  const [activeServiceId, setActiveServiceId] = useState('')
  const logServices = useMemo(() => services.filter((service) => service.logsAvailable), [services])
  const activeService = logServices.find(({ id }) => id === activeServiceId) ?? logServices[0]
  const logText = activeService ? (logsByService[activeService.id]?.lines.join('\n') ?? '') : ''
  const lastVerifiedDeployment = deploymentRecords.find(({ status }) => status === 'verified')

  useEffect(() => {
    if (activeService && activeService.id !== activeServiceId) setActiveServiceId(activeService.id)
  }, [activeService, activeServiceId])

  const copyLogs = async () => {
    if (!logText) return
    await navigator.clipboard.writeText(logText)
    setCopied(true)
    window.setTimeout(() => setCopied(false), 1_500)
  }

  return (
    <div className="flex size-full min-h-0 flex-col overflow-hidden">
      <section className="flex flex-wrap items-center justify-between gap-4 border-b border-border bg-muted/20 px-5 py-4">
        <div className="min-w-0">
          <p className="text-xs font-medium uppercase tracking-[0.14em] text-muted-foreground">
            Project detail
          </p>
          <div className="mt-1 flex flex-wrap items-center gap-x-3 gap-y-1">
            <h1 className="text-lg font-semibold capitalize">{services[0]?.applicationId}</h1>
            <span className="text-sm text-muted-foreground">Combined runtime report</span>
            {lastVerifiedDeployment ? (
              <Button
                variant="ghost"
                className="cursor-pointer text-sm text-muted-foreground underline-offset-4 hover:underline"
                onClick={() => setActivePanel('deployment')}
                type="button"
              >
                Last verified deployment · {lastVerifiedDeployment.repository.commit}
              </Button>
            ) : null}
          </div>
        </div>
        <div className="flex flex-wrap items-center gap-x-5 gap-y-2 text-sm">
          <span className="text-muted-foreground">
            {services.filter(({ state }) => state === 'online').length}/{services.length} online
          </span>
          <span className="font-mono text-xs text-muted-foreground">
            {services.length} monitored components
          </span>
        </div>
      </section>

      <div className="border-b border-border px-5">
        <Tabs
          value={activePanel}
          onValueChange={(value) => setActivePanel(value as typeof activePanel)}
        >
          <TabsList aria-label="Application report" variant="line">
            <TabsTrigger value="overview">Overview</TabsTrigger>
            <TabsTrigger value="failures">Failures</TabsTrigger>
            <TabsTrigger value="deployment">Deployment console</TabsTrigger>
          </TabsList>
        </Tabs>
      </div>

      {activePanel === 'overview' ? (
        <OverviewPanel
          actionPending={actionPending}
          activeService={activeService}
          copied={copied}
          logServices={logServices}
          logText={logText}
          logsFetching={logsFetching}
          services={services}
          onAction={onAction}
          onCopyLogs={copyLogs}
          onRefreshLogs={onRefreshLogs}
          onSelectLogService={setActiveServiceId}
        />
      ) : activePanel === 'failures' ? (
        <OrchestrationFailures
          applicationId={services[0]?.applicationId ?? ''}
          overview={failures}
        />
      ) : (
        <DeploymentConsole
          cloudTarget={cloudTarget}
          evidence={deploymentEvidence}
          recordError={deploymentRecordError}
          recordPending={deploymentRecordPending}
          records={deploymentRecords}
          dockerActionError={dockerActionError}
          dockerActionPending={dockerActionPending}
          dockerWorkloads={dockerWorkloads}
          services={services}
          onCreateRecord={onCreateDeploymentRecord}
          onDockerAction={onDockerAction}
          onOpenSettings={onOpenDeploymentSettings}
        />
      )}
    </div>
  )
}

function OverviewPanel({
  actionPending,
  activeService,
  copied,
  logServices,
  logText,
  logsFetching,
  services,
  onAction,
  onCopyLogs,
  onRefreshLogs,
  onSelectLogService,
}: {
  actionPending: boolean
  activeService: ServiceSnapshot | undefined
  copied: boolean
  logServices: readonly ServiceSnapshot[]
  logText: string
  logsFetching: boolean
  services: readonly ServiceSnapshot[]
  onAction: (serviceId: string, action: ServiceAction) => void
  onCopyLogs: () => Promise<void>
  onRefreshLogs: (serviceId: string) => void
  onSelectLogService: (serviceId: string) => void
}) {
  return (
    <>
      <div className="grid gap-px border-b border-border bg-border lg:grid-cols-2">
        {services.map((service) => (
          <ServiceReport
            actionPending={actionPending}
            key={service.id}
            service={service}
            onAction={onAction}
          />
        ))}
      </div>

      <div className="flex items-center justify-between gap-2 border-b border-border px-5 py-2.5">
        <div className="flex items-center gap-2 text-sm font-medium">
          <FileText className="size-4 text-muted-foreground" />
          Runtime logs
        </div>
        <div className="flex items-center gap-2">
          {logServices.length > 0 ? (
            <Tabs value={activeService?.id} onValueChange={onSelectLogService}>
              <TabsList aria-label="Runtime log component" variant="line">
                {logServices.map((service) => (
                  <TabsTrigger key={service.id} value={service.id}>
                    {service.kind.toUpperCase()}
                  </TabsTrigger>
                ))}
              </TabsList>
            </Tabs>
          ) : null}
          <Button
            aria-label="Refresh runtime logs"
            disabled={logsFetching || !activeService}
            onClick={() => activeService && onRefreshLogs(activeService.id)}
            size="icon-sm"
            variant="ghost"
          >
            <RefreshCw className={logsFetching ? 'animate-spin' : undefined} />
          </Button>
          <Button
            aria-label="Copy runtime logs"
            disabled={!logText}
            onClick={() => void onCopyLogs()}
            size="icon-sm"
            variant="ghost"
          >
            {copied ? <Check /> : <Clipboard />}
          </Button>
        </div>
      </div>

      <div className="min-h-0 flex-1 overflow-hidden bg-muted/20">
        <ScrollArea className="h-full w-full bg-zinc-950">
          <pre className="min-h-full whitespace-pre-wrap break-words p-5 font-mono text-xs leading-5 text-zinc-300">
            {logText ||
              (activeService?.logsAvailable
                ? `Waiting for ${activeService.kind.toUpperCase()} log output…`
                : 'No shared runtime log exists for this application.')}
          </pre>
        </ScrollArea>
      </div>
    </>
  )
}

function ServiceReport({
  actionPending,
  service,
  onAction,
}: {
  actionPending: boolean
  service: ServiceSnapshot
  onAction: (serviceId: string, action: ServiceAction) => void
}) {
  const controlAction = service.state === 'offline' ? 'start' : 'stop'

  return (
    <section className="bg-background px-5 py-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <Badge variant="outline">{service.kind.toUpperCase()}</Badge>
          <span className="font-mono text-xs text-muted-foreground">:{service.port}</span>
          <span className="text-sm font-medium capitalize">{service.state}</span>
        </div>
        {service.controllable ? (
          <Button
            disabled={actionPending}
            onClick={() => onAction(service.id, controlAction)}
            size="sm"
            variant={controlAction === 'start' ? 'outline' : 'ghost'}
          >
            {controlAction === 'start' ? <Play /> : <Square />}
            {controlAction === 'start' ? 'Start' : 'Stop'}
          </Button>
        ) : (
          <span className="text-sm text-muted-foreground">
            {service.protected ? 'Protected' : 'Read only'}
          </span>
        )}
      </div>
      <dl className="mt-4 grid grid-cols-2 gap-x-5 gap-y-3 text-sm sm:grid-cols-4">
        <Detail label="PID" value={service.pid?.toString() ?? '—'} />
        <Detail label="Latency" value={formatMetric(service.latencyMs, 'ms')} />
        <Detail label="Memory" value={formatBytes(service.memoryBytes)} />
        <Detail label="CPU time" value={formatSeconds(service.cpuSeconds)} />
        <Detail label="Uptime" value={formatDuration(service.uptimeSeconds)} />
        <Detail className="col-span-2 sm:col-span-3" label="Health" value={service.healthUrl} />
      </dl>
    </section>
  )
}

function Detail({ className, label, value }: { className?: string; label: string; value: string }) {
  return (
    <div className={className}>
      <dt className="text-xs text-muted-foreground">{label}</dt>
      <dd className="truncate font-medium" title={value}>
        {value}
      </dd>
    </div>
  )
}

function formatMetric(value: number | null, unit: string): string {
  return value === null ? '—' : `${value} ${unit}`
}

function formatBytes(bytes: number | null): string {
  return bytes === null ? '—' : `${(bytes / 1_048_576).toFixed(1)} MB`
}

function formatSeconds(seconds: number | null): string {
  return seconds === null ? '—' : `${seconds.toFixed(1)} s`
}

function formatDuration(seconds: number | null): string {
  if (seconds === null) return '—'
  if (seconds < 60) return `${seconds}s`
  if (seconds < 3_600) return `${Math.floor(seconds / 60)}m`
  return `${Math.floor(seconds / 3_600)}h ${Math.floor((seconds % 3_600) / 60)}m`
}
