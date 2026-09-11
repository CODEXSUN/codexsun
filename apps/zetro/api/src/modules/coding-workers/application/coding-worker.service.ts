import { randomUUID } from 'node:crypto'
import { basename, dirname, resolve } from 'node:path'
import type { CodingWorkerAttempt, CodingWorkerCheckResult } from '@codexsun/zetro-contracts'
import type {
  CodingWorkerStore,
  CodingWorkerTaskSource,
  WorkerHandoffInput,
  WorktreeService,
} from './coding-worker.ports.js'
import { verifyWorkerChecks } from '../infrastructure/coding-worker-verifier.js'

export class CodingWorkerService {
  constructor(
    private readonly tasks: CodingWorkerTaskSource,
    private readonly worktrees: WorktreeService,
    private readonly store: CodingWorkerStore,
  ) {}

  prepare(input: WorkerHandoffInput): CodingWorkerAttempt {
    const task = this.tasks.get(input.taskId)
    if (!task.reviewConfirmedAt) {
      throw new Error('The task review must be confirmed before preparing a worker.')
    }
    if (
      !task.repositoryPath ||
      !task.modulePath ||
      !task.acceptanceCriteria.length ||
      !task.checks.length
    ) {
      throw new Error('The confirmed task must include repository, scope, criteria, and checks.')
    }
    const id = randomUUID()
    const branchName = `codex/zetro-task-${id.slice(0, 8)}`
    const worktreePath = resolve(
      dirname(resolve(task.repositoryPath)),
      `.${basename(resolve(task.repositoryPath))}-zetro-worktrees`,
      id,
    )
    const prepared = this.worktrees.prepare({
      branchName,
      modulePath: task.modulePath,
      repositoryPath: task.repositoryPath,
      worktreePath,
    })
    return this.store.create({
      acceptanceCriteria: task.acceptanceCriteria,
      approvalStatus: 'awaiting-verification',
      branchName: prepared.branchName,
      checks: task.checks,
      createdAt: Date.now(),
      id,
      modulePath: prepared.modulePath,
      repositoryPath: prepared.repositoryPath,
      revision: prepared.revision,
      runtime: prepared.runtime,
      status: 'prepared',
      taskId: input.taskId,
      toolProfile: 'daily-coding',
      updatedAt: Date.now(),
      verification: [],
      worktreePath: prepared.worktreePath,
    })
  }

  isReady(): boolean {
    return this.store.isReady()
  }

  list(): CodingWorkerAttempt[] {
    return this.store.list()
  }

  approve(attemptId: string): CodingWorkerAttempt {
    const attempt = this.requireAttempt(attemptId)
    if (attempt.approvalStatus !== 'awaiting-approval') {
      throw new Error('All recorded checks must pass before approval.')
    }
    return this.store.updateApproval(attemptId, 'approved')
  }

  reject(attemptId: string): CodingWorkerAttempt {
    this.requireAttempt(attemptId)
    return this.store.updateApproval(attemptId, 'rejected')
  }

  verify(attemptId: string): CodingWorkerAttempt {
    const attempt = this.requireAttempt(attemptId)
    if (attempt.approvalStatus === 'approved')
      throw new Error('Approved attempts cannot be re-verified.')
    const verification = verifyWorkerChecks(attempt.worktreePath, attempt.checks)
    return this.store.updateVerification(attemptId, verification)
  }

  private requireAttempt(attemptId: string): CodingWorkerAttempt {
    const attempt = this.store.get(attemptId)
    if (!attempt) throw new Error('Coding worker attempt was not found.')
    return attempt
  }

  close() {
    this.store.close()
  }
}
