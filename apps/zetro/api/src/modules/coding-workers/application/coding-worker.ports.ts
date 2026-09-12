import type {
  AgentTaskDraft,
  CodingWorkerAttempt,
  CodingWorkerCheckResult,
  CodingWorkerExecution,
  CodingWorkerEvent,
  CodingWorkerHandoffRequest,
} from '@codexsun/zetro-contracts'

export type CodingWorkerTaskSource = {
  get(taskId: string): AgentTaskDraft
}

export type CodingWorkerStore = {
  close(): void
  create(attempt: CodingWorkerAttempt): CodingWorkerAttempt
  get(attemptId: string): CodingWorkerAttempt | undefined
  isReady(): boolean
  list(): CodingWorkerAttempt[]
  updateApproval(
    attemptId: string,
    approvalStatus: CodingWorkerAttempt['approvalStatus'],
  ): CodingWorkerAttempt
  updateVerification(
    attemptId: string,
    verification: CodingWorkerCheckResult[],
  ): CodingWorkerAttempt
  updateExecution(attemptId: string, execution: CodingWorkerExecution): CodingWorkerAttempt
  updateLifecycle(
    attemptId: string,
    lifecycle: Pick<CodingWorkerAttempt, 'archivedAt' | 'cleanedAt' | 'integratedAt'>,
  ): CodingWorkerAttempt
}

export type WorkerRunner = {
  start(input: {
    attempt: CodingWorkerAttempt
    instructions: string
    onEvent(event: Omit<CodingWorkerEvent, 'createdAt'>): void
    onExit(input: { exitCode?: number; status: 'complete' | 'failed' | 'stopped' }): void
  }): void
  stop(attemptId: string): boolean
}

export type WorktreePreparation = Omit<
  CodingWorkerAttempt,
  | 'acceptanceCriteria'
  | 'approvalStatus'
  | 'checks'
  | 'createdAt'
  | 'execution'
  | 'id'
  | 'taskId'
  | 'updatedAt'
  | 'verification'
>

export type WorktreeService = {
  prepare(input: {
    branchName: string
    modulePath: string
    repositoryPath: string
    worktreePath: string
  }): WorktreePreparation
  cleanup(input: Pick<CodingWorkerAttempt, 'branchName' | 'repositoryPath' | 'worktreePath'>): void
  integrate(input: Pick<CodingWorkerAttempt, 'modulePath' | 'repositoryPath' | 'worktreePath'>): void
}

export type WorkerHandoffInput = CodingWorkerHandoffRequest
