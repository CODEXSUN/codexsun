import type { Runbook, RunbookCreateRequest, RunbookRun } from '@codexsun/zetro-contracts'

export type RunbookStore = {
  close(): void
  create(runbook: Runbook): Runbook
  createRun(run: RunbookRun): RunbookRun
  get(id: string): Runbook | undefined
  isReady(): boolean
  list(): Runbook[]
  listDue(now: number): Runbook[]
  listRuns(): RunbookRun[]
  updateEnabled(id: string, enabled: boolean, nextRunAt: number): Runbook
  updateArchive(id: string, archived: boolean): Runbook
  updateRun(run: RunbookRun): RunbookRun
  markScheduled(id: string, lastRunAt: number, nextRunAt: number): void
}

export type RunbookExecutor = {
  execute(input: { prompt: string; runId: string; worktreePath: string }): Promise<{ report: string; success: boolean }>
  stop(runId: string): boolean
}

export type RunbookWorktrees = {
  prepare(input: { branchName: string; modulePath: string; repositoryPath: string; worktreePath: string }): {
    branchName: string
    worktreePath: string
  }
}

export type RunbookInput = RunbookCreateRequest
