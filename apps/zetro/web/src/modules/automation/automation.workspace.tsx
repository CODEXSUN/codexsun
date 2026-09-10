import { useEffect, useRef, useState } from 'react'
import {
  Activity,
  ArrowLeft,
  CheckCircle2,
  History,
  Radio,
  RefreshCw,
  Terminal,
  Wifi,
  WifiOff,
} from 'lucide-react'
import { Button } from '@codexsun/ui/components/button'
import { Badge } from '@codexsun/ui/components/badge'
import { Progress } from '@codexsun/ui/components/progress'
import { Spinner } from '@codexsun/ui/components/spinner'
import { Popover, PopoverContent, PopoverTrigger } from '@codexsun/ui/components/popover'
import { WorkspaceMetricCard, WorkspaceMetricGrid } from '@codexsun/ui/blocks/workspace'
import { useSystemTasks } from '../system-tasks'
import { useProjects } from '../projects'
import { useAgentChat } from '../agent-chat'
import { getOperationsMetrics, type OperationsMetrics } from '../operations'
import { AutomationScriptsPage } from './automation.scripts-page'
import { AutomationRunList } from './automation.run-list'
import { AutomationRunDetail } from './automation.run-detail'
import { isLiveRun } from './automation.run-model'
import { createAutomationSupervisorPrompt } from './automation.supervisor'

export function AutomationWorkspace() {
  const runs = useSystemTasks()
  const projects = useProjects()
  const chat = useAgentChat()
  const [page, setPage] = useState<'live' | 'history' | 'scripts'>('live')
  const [search, setSearch] = useState('')
  const [opening, setOpening] = useState(false)
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [metrics, setMetrics] = useState<OperationsMetrics | null>(null)
  const [metricsError, setMetricsError] = useState(false)
  const [showConnections, setShowConnections] = useState(true)
  const [animated, setAnimated] = useState(true)
  const [now, setNow] = useState(Date.now())
  const projectId = projects.activeProject?.id
  const pageBody = useRef<HTMLDivElement>(null)
  useEffect(() => {
    pageBody.current?.scrollTo({ top: 0 })
  }, [page, runs.selected?.id])

  useEffect(() => {
    let cancelled = false
    let pending = false
    async function refreshMetrics() {
      if (pending || document.visibilityState !== 'visible') return
      pending = true
      try {
        const next = await getOperationsMetrics()
        if (!cancelled) {
          setMetrics(next)
          setMetricsError(false)
        }
      } catch {
        if (!cancelled) setMetricsError(true)
      } finally {
        pending = false
      }
    }
    void refreshMetrics()
    const timer = window.setInterval(() => {
      setNow(Date.now())
      void refreshMetrics()
    }, 5000)
    return () => {
      cancelled = true
      window.clearInterval(timer)
    }
  }, [])

  useEffect(() => {
    setOpening(false)
    setSearch('')
    setError(null)
  }, [projectId])
  const live = runs.tasks.filter(isLiveRun)
  const history = runs.tasks.filter((task) => !isLiveRun(task))
  const completed = history.filter((task) => task.status === 'completed').length
  const connected = runs.lastUpdated !== null && !runs.error && now - runs.lastUpdated < 15000

  function navigate(next: typeof page) {
    runs.clearSelection()
    setOpening(false)
    setSearch('')
    setPage(next)
  }
  async function open(id: string) {
    setOpening(true)
    await runs.select(id)
    setOpening(false)
  }
  async function stop() {
    if (!runs.selected || !window.confirm('Stop this run? Completed changes will not be reverted.'))
      return
    setBusy(true)
    try {
      await runs.stop(runs.selected.id)
      setError(null)
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : 'Stop failed.')
    } finally {
      setBusy(false)
    }
  }
  function diagnose() {
    if (!runs.selected) return
    chat.newConversation()
    chat.prepareDraft(createAutomationSupervisorPrompt(runs.selected))
    projects.setView('chat')
  }

  return (
    <section className="relative flex h-full min-h-0 flex-col bg-background">
      <header className="flex shrink-0 flex-wrap items-center justify-between gap-3 border-b px-6 py-4">
        <div>
          <h1 className="text-xl font-semibold tracking-tight">Automation control</h1>
          <p className="text-sm text-muted-foreground">
            {projects.activeProject?.name ?? 'Select a project'} · Observe, inspect, then act.
          </p>
        </div>
        <Button
          variant="outline"
          size="sm"
          disabled={!projectId}
          onClick={() => void runs.refresh()}
        >
          <RefreshCw /> Refresh
        </Button>
        <nav className="flex w-full flex-wrap gap-2" aria-label="Automation pages">
          <Button
            variant={page === 'live' ? 'secondary' : 'ghost'}
            onClick={() => navigate('live')}
          >
            <Activity /> Live runs <Badge variant="outline">{live.length}</Badge>
          </Button>
          <Button
            variant={page === 'history' ? 'secondary' : 'ghost'}
            onClick={() => navigate('history')}
          >
            <History /> History <Badge variant="outline">{history.length}</Badge>
          </Button>
          <Button
            variant={page === 'scripts' ? 'secondary' : 'ghost'}
            onClick={() => navigate('scripts')}
          >
            <Terminal /> Scripts and maintenance
          </Button>
        </nav>
      </header>
      <div ref={pageBody} className="min-h-0 flex-1 overflow-y-auto px-6 py-6 pb-28">
        {!projectId ? (
          <p>Connect or select a project to inspect its automation runs.</p>
        ) : (
          <div className="mx-auto grid max-w-6xl gap-6">
            {(runs.error || error) && (
              <p role="alert" className="text-sm text-destructive">
                {error ?? runs.error} Last received data may be stale.
              </p>
            )}
            {opening ? (
              <div role="status">
                Loading run…{' '}
                <Button variant="ghost" onClick={() => navigate(page)}>
                  <ArrowLeft /> Back
                </Button>
              </div>
            ) : runs.selected ? (
              <AutomationRunDetail
                task={runs.selected}
                busy={busy}
                connected={connected}
                animated={animated}
                now={now}
                onBack={() => navigate(page)}
                onStop={() => void stop()}
                onDiagnose={diagnose}
              />
            ) : page === 'scripts' ? (
              <AutomationScriptsPage />
            ) : (
              <>
                <WorkspaceMetricGrid>
                  <WorkspaceMetricCard
                    icon={Activity}
                    label="Active / queued"
                    value={live.length}
                    description="Current project"
                  />
                  <WorkspaceMetricCard
                    icon={CheckCircle2}
                    label="Completed"
                    value={completed}
                    description="Loaded project history"
                  />
                  <WorkspaceMetricCard
                    icon={History}
                    label="Needs review"
                    value={history.length - completed}
                    description="Failed, blocked, or stopped"
                  />
                  <WorkspaceMetricCard
                    icon={Radio}
                    label="API memory"
                    value={
                      metrics && !metricsError
                        ? `${Math.round(metrics.api.residentBytes / 1048576)} MB`
                        : 'Unavailable'
                    }
                    description="Entire Zetro API, not this run"
                  />
                </WorkspaceMetricGrid>
                <div className="grid gap-2">
                  <div className="flex justify-between text-sm">
                    <span>Completed runs in loaded history</span>
                    <span>
                      {completed} / {history.length}
                    </span>
                  </div>
                  <Progress
                    value={history.length ? (completed / history.length) * 100 : 0}
                    aria-label="Completed share of loaded history"
                  />
                  <p className="text-xs text-muted-foreground">
                    Outcome distribution, not a predicted completion percentage.
                  </p>
                </div>
                {runs.loading ? (
                  <p role="status">Loading runs…</p>
                ) : (
                  <AutomationRunList
                    animated={animated && connected}
                    tasks={page === 'live' ? live : history}
                    search={search}
                    onSearch={setSearch}
                    onSelect={(id) => void open(id)}
                    live={page === 'live'}
                  />
                )}
              </>
            )}
          </div>
        )}
      </div>
      <div className="absolute right-4 bottom-4 z-20 flex max-w-[calc(100%-2rem)] flex-wrap justify-end gap-2">
        {showConnections && (
          <Popover>
            <PopoverTrigger render={<Button variant="outline" />}>
              {connected && live.some((task) => task.status === 'running') ? (
                <Spinner animated={animated} aria-label="Active execution" />
              ) : connected ? (
                <Wifi />
              ) : (
                <WifiOff />
              )}{' '}
              {connected ? 'API connected' : 'Awaiting API'} · {live.length} active
            </PopoverTrigger>
            <PopoverContent align="end" className="w-80">
              <div className="grid gap-3 text-sm">
                <strong>Live connections</strong>
                <p>Task feed: {connected ? 'Receiving updates' : 'Unavailable or stale'}</p>
                <p>
                  Last received:{' '}
                  {runs.lastUpdated
                    ? new Date(runs.lastUpdated).toLocaleTimeString()
                    : 'Not received'}
                </p>
                <p>Codex: {metricsError ? 'Status unavailable' : (metrics?.codex ?? 'Checking')}</p>
                <p>
                  Database:{' '}
                  {metricsError ? 'Status unavailable' : (metrics?.database ?? 'Checking')}
                </p>
                <p className="text-xs text-muted-foreground">
                  Task feed refreshes every 2 seconds while visible. Supervisor jobs include bounded
                  public response and tool snapshots. Script output appears when the script ends.
                </p>
                {live.slice(0, 3).map((task) => (
                  <Button
                    key={task.id}
                    variant="ghost"
                    className="justify-start truncate"
                    onClick={() => void open(task.id)}
                  >
                    {task.status}: {task.title}
                  </Button>
                ))}
              </div>
            </PopoverContent>
          </Popover>
        )}
        <Popover>
          <PopoverTrigger render={<Button variant="outline" size="sm" />}>
            View options
          </PopoverTrigger>
          <PopoverContent align="end">
            <div className="grid gap-2">
              <strong className="text-sm">Tweak view</strong>
              <Button variant="secondary" onClick={() => setShowConnections((value) => !value)}>
                {showConnections ? 'Hide' : 'Show'} connection card
              </Button>
              <Button
                variant="secondary"
                aria-pressed={animated}
                onClick={() => setAnimated((value) => !value)}
              >
                {animated ? 'Pause' : 'Enable'} activity motion
              </Button>
            </div>
          </PopoverContent>
        </Popover>
      </div>
    </section>
  )
}
