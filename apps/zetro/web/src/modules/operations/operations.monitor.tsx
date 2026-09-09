import { useCallback, useEffect, useRef, useState } from 'react'
import { Activity, Database, Download, HardDrive, RefreshCw, Server, Trash2 } from 'lucide-react'
import { Button } from '@codexsun/ui/components/button'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@codexsun/ui/components/dialog'
import {
  downloadDiagnostics,
  getOperationsMetrics,
  listWorktrees,
  removeWorktree,
  sweepWorktrees,
} from './operations.services'
import type { OperationsMetrics, WorktreeStatus } from './operations.types'

export function OperationsMonitor() {
  const [metrics, setMetrics] = useState<OperationsMetrics | null>(null)
  const [worktrees, setWorktrees] = useState<WorktreeStatus[]>([])
  const [open, setOpen] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const openRef = useRef(open)
  openRef.current = open
  const refresh = useCallback(async () => {
    try {
      const nextMetrics = await getOperationsMetrics()
      setMetrics(nextMetrics)
      if (openRef.current) setWorktrees(await listWorktrees())
      setError(null)
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : 'Metrics are unavailable.')
    }
  }, [])
  useEffect(() => {
    void refresh()
    const timer = window.setInterval(() => {
      if (document.visibilityState === 'visible') void refresh()
    }, 5_000)
    return () => window.clearInterval(timer)
  }, [refresh])
  useEffect(() => {
    if (open) void refresh()
  }, [open, refresh])

  const memoryPercent = metrics
    ? Math.round((1 - metrics.host.freeMemoryBytes / metrics.host.totalMemoryBytes) * 100)
    : 0
  return (
    <>
      <button
        aria-label="Open Zetro operations metrics"
        className="fixed bottom-24 right-4 z-40 flex h-9 cursor-pointer items-center gap-2 rounded-full border bg-background px-3 text-xs shadow-md hover:border-orange-400"
        onClick={() => setOpen(true)}
        type="button"
      >
        <Activity className="size-3.5 text-emerald-500" />
        <span>{memoryPercent}% memory</span>
        <span className="text-muted-foreground">
          {metrics?.api.uptimeSeconds.toFixed(0) ?? '—'}s
        </span>
      </button>
      <Dialog onOpenChange={setOpen} open={open}>
        <DialogContent className="max-h-[85vh] overflow-y-auto sm:max-w-3xl">
          <DialogHeader>
            <DialogTitle>Operations and worktrees</DialogTitle>
            <DialogDescription>
              Live local health, connected app status, and safe workspace cleanup.
            </DialogDescription>
          </DialogHeader>
          <div className="grid grid-cols-2 gap-2 md:grid-cols-4">
            <Metric
              icon={Server}
              label="API memory"
              value={formatBytes(metrics?.api.residentBytes)}
            />
            <Metric icon={Activity} label="Host memory" value={`${memoryPercent}%`} />
            <Metric
              icon={HardDrive}
              label="Disk free"
              value={formatBytes(metrics?.disk.freeBytes)}
            />
            <Metric icon={Database} label="Database" value={metrics?.database ?? '—'} />
          </div>
          <section className="rounded-xl border">
            <header className="flex items-center gap-2 border-b px-3 py-2">
              <h3 className="flex-1 text-sm font-medium">Worktrees</h3>
              <span className="text-xs text-muted-foreground">
                {formatBytes(metrics?.worktrees.sizeBytes)}
              </span>
              <Button
                className="cursor-pointer"
                onClick={() => void sweepWorktrees(14).then(refresh)}
                size="sm"
                variant="outline"
              >
                Sweep clean
              </Button>
              <Button
                aria-label="Refresh worktrees"
                className="cursor-pointer"
                onClick={() => void refresh()}
                size="icon-xs"
                variant="ghost"
              >
                <RefreshCw />
              </Button>
            </header>
            {worktrees.map((worktree) => (
              <WorktreeRow key={worktree.path} onRefresh={refresh} worktree={worktree} />
            ))}
            {!worktrees.length ? (
              <p className="p-4 text-sm text-muted-foreground">No managed worktrees.</p>
            ) : null}
          </section>
          <section className="rounded-xl border p-3">
            <h3 className="text-sm font-medium">Connected applications</h3>
            <div className="pt-2 text-sm">
              {metrics?.connectedApps.map((app) => (
                <div className="flex gap-3 py-1" key={`${app.appId}-${app.component}`}>
                  <span className="size-2 self-center rounded-full bg-emerald-500" />
                  <span>
                    {app.appId} · {app.component}
                  </span>
                  <span className="ml-auto text-muted-foreground">{app.status}</span>
                </div>
              ))}
              {!metrics?.connectedApps.length ? (
                <span className="text-muted-foreground">No app metrics received.</span>
              ) : null}
            </div>
          </section>
          <Button
            className="w-fit cursor-pointer"
            onClick={() => void downloadDiagnostics()}
            variant="outline"
          >
            <Download /> Download redacted diagnostics
          </Button>
          {error ? <p className="text-sm text-destructive">{error}</p> : null}
        </DialogContent>
      </Dialog>
    </>
  )
}

function WorktreeRow({
  onRefresh,
  worktree,
}: {
  onRefresh(): Promise<void>
  worktree: WorktreeStatus
}) {
  return (
    <div className="group flex items-center gap-3 border-b px-3 py-2 last:border-b-0">
      <span
        className={`size-2 rounded-full ${worktree.dirty ? 'bg-amber-500' : 'bg-emerald-500'}`}
      />
      <div className="min-w-0 flex-1">
        <div className="truncate text-sm">{worktree.conversationId}</div>
        <div className="truncate text-xs text-muted-foreground">{worktree.path}</div>
      </div>
      <span className="text-xs text-muted-foreground">{formatBytes(worktree.sizeBytes)}</span>
      <Button
        aria-label={`Remove ${worktree.conversationId}`}
        className="cursor-pointer opacity-0 group-hover:opacity-100"
        disabled={worktree.dirty}
        onClick={() => void removeWorktree(worktree.path).then(onRefresh)}
        size="icon-xs"
        title={worktree.dirty ? 'Dirty worktrees cannot be removed' : 'Remove clean worktree'}
        variant="ghost"
      >
        <Trash2 />
      </Button>
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
    <div className="rounded-xl border p-3">
      <Icon className="mb-2 size-4 text-muted-foreground" />
      <div className="text-lg font-semibold">{value}</div>
      <div className="text-xs text-muted-foreground">{label}</div>
    </div>
  )
}
function formatBytes(value?: number) {
  if (value === undefined) return '—'
  const units = ['B', 'KB', 'MB', 'GB', 'TB']
  let size = value
  let unit = 0
  while (size >= 1_024 && unit < units.length - 1) {
    size /= 1_024
    unit += 1
  }
  return `${size.toFixed(unit > 1 ? 1 : 0)} ${units[unit]}`
}
