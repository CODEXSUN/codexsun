import { randomUUID } from 'node:crypto'
import { basename, dirname, resolve } from 'node:path'
import type { Runbook, RunbookInitiateRequest, RunbookRun } from '@codexsun/zetro-contracts'
import type { RunbookExecutor, RunbookInput, RunbookStore, RunbookWorktrees } from './runbook.ports.js'

export class RunbookService {
  private timer: NodeJS.Timeout | undefined
  private readonly running = new Map<string, string>()
  private readonly stopped = new Set<string>()
  constructor(private readonly store: RunbookStore, private readonly worktrees: RunbookWorktrees, private readonly executor: RunbookExecutor) {}
  create(input: RunbookInput): Runbook {
    const now = Date.now()
    return this.store.create({ ...input, id: randomUUID(), enabled: false, nextRunAt: nextRunAt(input, now), createdAt: now, updatedAt: now })
  }
  isReady() { return this.store.isReady() }
  list() { return this.store.list() }
  listRuns() { return this.store.listRuns() }
  setEnabled(id: string, enabled: boolean) { const runbook = this.requireRunbook(id); if (runbook.schedule.mode !== 'repeating') throw new Error('One-time runbooks cannot be scheduled. Start them manually.'); return this.store.updateEnabled(id, enabled, nextRunAt(runbook, Date.now())) }
  start(id: string) { const runbook = this.requireRunbook(id); return this.enqueue(runbook, 'manual') }
  initiate(input: RunbookInitiateRequest) {
    const runbook = this.requireRunbook(input.runbookId)
    if (runbook.schedule.mode !== input.mode) throw new Error('The initiator mode must match the saved runbook mode.')
    if (input.mode === 'repeating') return { runbook: this.setEnabled(runbook.id, true) }
    return { run: this.enqueue(runbook, 'manual', input.initiator), runbook }
  }
  stop(runId: string): RunbookRun {
    const run = this.store.listRuns().find((item) => item.id === runId)
    if (!run || !['queued', 'running'].includes(run.status)) throw new Error('This run is not active.')
    if (!this.executor.stop(runId)) throw new Error('The worker process is no longer active.')
    this.stopped.add(runId)
    this.running.delete(run.runbookId)
    return this.store.updateRun({ ...run, status: 'stopped', report: 'Stopped by the user.', completedAt: Date.now() })
  }
  archive(id: string, archived: boolean) {
    const runbook = this.requireRunbook(id)
    if (this.running.has(runbook.id)) throw new Error('Stop the active run before archiving its runbook.')
    return this.store.updateArchive(id, archived)
  }
  startScheduler() { this.timer = setInterval(() => void this.scheduleDueRuns(), 15_000); void this.scheduleDueRuns() }
  close() { if (this.timer) clearInterval(this.timer); this.store.close() }
  private async scheduleDueRuns() { for (const runbook of this.store.listDue(Date.now())) { if (!this.running.has(runbook.id)) void this.enqueue(runbook, 'schedule') } }
  private enqueue(runbook: Runbook, triggeredBy: RunbookRun['triggeredBy'], initiator?: RunbookRun['initiator']): RunbookRun {
    if (this.running.has(runbook.id)) throw new Error('This runbook already has an active run.')
    const id = randomUUID()
    const branchName = `codex/zetro-runbook-${id.slice(0, 8)}`
    const worktreePath = resolve(dirname(resolve(runbook.repositoryPath)), `.${basename(resolve(runbook.repositoryPath))}-zetro-worktrees`, id)
    const prepared = this.worktrees.prepare({ branchName, modulePath: runbook.modulePath, repositoryPath: runbook.repositoryPath, worktreePath })
    const run = this.store.createRun({ id, runbookId: runbook.id, triggeredBy, status: 'queued', branchName: prepared.branchName, worktreePath: prepared.worktreePath, report: '', initiator, createdAt: Date.now() })
    this.store.markScheduled(runbook.id, Date.now(), nextRunAt(runbook, Date.now()))
    this.running.set(runbook.id, run.id)
    void this.execute(runbook, run)
    return run
  }
  private async execute(runbook: Runbook, queued: RunbookRun) {
    let run = this.store.updateRun({ ...queued, status: 'running', startedAt: Date.now() })
    try { const result = await this.executor.execute({ prompt: runbook.prompt, runId: run.id, worktreePath: run.worktreePath }); if (!this.stopped.has(run.id)) run = this.store.updateRun({ ...run, status: result.success ? 'completed' : 'failed', report: result.report, completedAt: Date.now() }) }
    catch (error) { if (!this.stopped.has(run.id)) run = this.store.updateRun({ ...run, status: 'failed', report: error instanceof Error ? error.message : 'Runbook worker failed.', completedAt: Date.now() }) }
    finally { this.stopped.delete(run.id); this.running.delete(runbook.id) }
  }
  private requireRunbook(id: string) { const runbook = this.store.get(id); if (!runbook) throw new Error('Runbook was not found.'); return runbook }
}
function nextRunAt(runbook: Pick<Runbook, 'schedule'>, now: number) { return runbook.schedule.mode === 'repeating' ? now + (runbook.schedule.intervalMinutes ?? 15) * 60_000 : now }
