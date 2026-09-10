import { useEffect, useMemo, useState } from 'react'
import { z } from 'zod'
import { Download, LoaderCircle, Play, RefreshCw, Trash2 } from 'lucide-react'
import { Button } from '@codexsun/ui/components/button'
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@codexsun/ui/components/alert-dialog'
import { getRepositoryScripts, runRepositoryScriptTask } from '../developer-tools'
import { GitDeliveryFlowBuilder } from '../git-delivery'
import {
  downloadDiagnostics,
  getOperationsMetrics,
  sweepWorktrees,
  type OperationsMetrics,
} from '../operations'
import { useProjects } from '../projects'
import { useSystemTasks } from '../system-tasks'
import { groupAutomationScripts } from './automation.scripts'

type Confirmation = { label: string; run(): Promise<void> } | null

export function AutomationScriptsPage() {
  const projects = useProjects()
  const runs = useSystemTasks()
  const [scripts, setScripts] = useState<string[]>([])
  const [metrics, setMetrics] = useState<OperationsMetrics | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [busy, setBusy] = useState<string | null>(null)
  const [confirmation, setConfirmation] = useState<Confirmation>(null)
  const projectId = projects.activeProject?.id

  useEffect(() => {
    let current = true
    setScripts([])
    setMetrics(null)
    if (!projectId) return
    void Promise.all([getRepositoryScripts(projectId), getOperationsMetrics()])
      .then(([nextScripts, nextMetrics]) => {
        if (!current) return
        setScripts(nextScripts)
        setMetrics(nextMetrics)
        setError(null)
      })
      .catch((reason: unknown) => {
        if (current) setError(toMessage(reason))
      })
    return () => {
      current = false
    }
  }, [projectId])

  const scriptGroups = useMemo(() => groupAutomationScripts(scripts), [scripts])

  async function runScript(script: string) {
    if (!projectId) return
    setBusy(script)
    try {
      const result = z
        .object({ task: z.object({ id: z.string() }) })
        .parse(await runRepositoryScriptTask(projectId, script))
      await runs.refresh()
      await runs.select(result.task.id)
      setError(null)
    } catch (reason) {
      setError(toMessage(reason))
    } finally {
      setBusy(null)
    }
  }

  return (
    <section className="relative h-full overflow-y-auto bg-background">
      <div className="mx-auto w-full max-w-5xl px-8 py-8 pb-24">
        <header className="flex items-start gap-4">
          <div>
            <h2 className="text-2xl font-semibold tracking-tight">Scripts and maintenance</h2>
            <p className="mt-1 text-sm text-muted-foreground">
              Run repository-owned scripts first. Ask an agent to diagnose only after a failure.
            </p>
          </div>
          <Button
            aria-label="Refresh automation runs"
            className="ml-auto cursor-pointer"
            onClick={() => void runs.refresh()}
            size="icon-sm"
            variant="ghost"
          >
            <RefreshCw />
          </Button>
        </header>

        <div className="mt-6 flex flex-wrap gap-x-6 gap-y-2 text-xs text-muted-foreground">
          <span>{scripts.length} scripts</span>
          <span>{runs.tasks.filter(({ status }) => status === 'running').length} running</span>
          <span>{metrics?.worktrees.count ?? 0} worktrees</span>
          <span>{metrics ? formatBytes(metrics.worktrees.sizeBytes) : '—'} worktree storage</span>
        </div>

        <section className="mt-8">
          <h2 className="text-sm font-semibold">Repository scripts</h2>
          <div className="mt-3 grid gap-x-8 gap-y-6 lg:grid-cols-2">
            {scriptGroups.map((group) => (
              <div key={group.label}>
                <h3 className="text-xs font-medium text-muted-foreground">{group.label}</h3>
                <div className="mt-1 divide-y">
                  {group.scripts.map((script) => {
                    const guarded = /^(clean|release)(:|$)/u.test(script)
                    return (
                      <div className="flex min-h-10 items-center gap-3" key={script}>
                        <code className="min-w-0 flex-1 truncate text-xs">npm run {script}</code>
                        <Button
                          className="cursor-pointer"
                          disabled={busy !== null}
                          onClick={() =>
                            guarded
                              ? setConfirmation({ label: script, run: () => runScript(script) })
                              : void runScript(script)
                          }
                          size="sm"
                          variant="ghost"
                        >
                          {busy === script ? <LoaderCircle className="animate-spin" /> : <Play />}
                          Run
                        </Button>
                      </div>
                    )
                  })}
                </div>
              </div>
            ))}
            {scripts.length === 0 ? (
              <p className="py-4 text-sm text-muted-foreground">No supported scripts were found.</p>
            ) : null}
          </div>
        </section>

        <section className="mt-8">
          <h2 className="text-sm font-semibold">Maintenance</h2>
          <div className="mt-2 flex flex-wrap gap-2">
            <Button
              className="cursor-pointer"
              onClick={() => void downloadDiagnostics()}
              variant="outline"
            >
              <Download /> Download diagnostics
            </Button>
            <Button
              className="cursor-pointer"
              onClick={() =>
                setConfirmation({
                  label: 'worktree sweep',
                  run: async () => {
                    await sweepWorktrees(30)
                    await runs.refresh()
                  },
                })
              }
              variant="outline"
            >
              <Trash2 /> Sweep worktrees
            </Button>
          </div>
        </section>

        <section className="mt-8">
          <h2 className="text-sm font-semibold">Git and release flow</h2>
          <div className="mt-2 overflow-hidden rounded-lg border">
            <GitDeliveryFlowBuilder />
          </div>
        </section>

        {(error ?? runs.error) ? (
          <p className="mt-4 text-sm text-destructive">{error ?? runs.error}</p>
        ) : null}
      </div>

      <AlertDialog
        open={confirmation !== null}
        onOpenChange={(open) => !open && setConfirmation(null)}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Run {confirmation?.label}?</AlertDialogTitle>
            <AlertDialogDescription>
              Review the repository state first. Cleanup, release, and sweep operations may change
              files or remote state.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => {
                const action = confirmation?.run
                setConfirmation(null)
                if (action) void action().catch((reason: unknown) => setError(toMessage(reason)))
              }}
            >
              Run
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </section>
  )
}

function formatBytes(value: number): string {
  if (value < 1_024) return `${value} B`
  if (value < 1_048_576) return `${Math.round(value / 1_024)} KB`
  return `${(value / 1_048_576).toFixed(1)} MB`
}

function toMessage(reason: unknown): string {
  return reason instanceof Error ? reason.message : 'Automation is unavailable.'
}
