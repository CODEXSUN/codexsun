import type {
  AgentTaskDraft,
  CodingWorkerAttempt,
  CodingWorkerCheckResult,
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
}

export type WorktreePreparation = Omit<
  CodingWorkerAttempt,
  | 'acceptanceCriteria'
  | 'approvalStatus'
  | 'checks'
  | 'createdAt'
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
}

export type WorkerHandoffInput = CodingWorkerHandoffRequest
