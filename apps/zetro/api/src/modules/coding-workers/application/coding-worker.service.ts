import { randomUUID } from 'node:crypto'
import { basename, dirname, resolve } from 'node:path'
import type { CodingWorkerAttempt, CodingWorkerEvent } from '@codexsun/zetro-contracts'
import type {
  CodingWorkerStore,
  CodingWorkerTaskSource,
  WorkerRunner,
  WorkerHandoffInput,
  WorktreeService,
} from './coding-worker.ports.js'
import { verifyWorkerChecks } from '../infrastructure/coding-worker-verifier.js'

export class CodingWorkerService {
  constructor(
    private readonly tasks: CodingWorkerTaskSource,
    private readonly worktrees: WorktreeService,
    private readonly store: CodingWorkerStore,
    private readonly runner: WorkerRunner,
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
      execution: { events: [], status: 'not-started' },
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

  archive(attemptId: string): CodingWorkerAttempt {
    const attempt = this.requireAttempt(attemptId)
    if (attempt.execution.status === 'working') {
      throw new Error('Stop the worker before archiving its record.')
    }
    return this.store.updateLifecycle(attemptId, { ...lifecycleOf(attempt), archivedAt: Date.now() })
  }

  cleanup(attemptId: string): CodingWorkerAttempt {
    const attempt = this.requireAttempt(attemptId)
    if (attempt.execution.status === 'working') {
      throw new Error('Stop the worker before cleaning its worktree.')
    }
    if (attempt.cleanedAt) return attempt
    this.worktrees.cleanup(attempt)
    return this.store.updateLifecycle(attemptId, { ...lifecycleOf(attempt), cleanedAt: Date.now() })
  }

  integrate(attemptId: string): CodingWorkerAttempt {
    const attempt = this.requireAttempt(attemptId)
    if (attempt.approvalStatus !== 'approved') {
      throw new Error('Only an approved worker can be integrated.')
    }
    if (attempt.cleanedAt) throw new Error('The worker worktree has already been cleaned.')
    if (!attempt.integratedAt) this.worktrees.integrate(attempt)
    return this.store.updateLifecycle(attemptId, { ...lifecycleOf(attempt), integratedAt: Date.now() })
  }

  verify(attemptId: string): CodingWorkerAttempt {
    const attempt = this.requireAttempt(attemptId)
    if (attempt.approvalStatus === 'approved')
      throw new Error('Approved attempts cannot be re-verified.')
    if (attempt.execution.status !== 'complete') {
      throw new Error('The coding worker must finish successfully before verification.')
    }
    const verification = verifyWorkerChecks(attempt.worktreePath, attempt.checks)
    return this.store.updateVerification(attemptId, verification)
  }

  start(attemptId: string): CodingWorkerAttempt {
    const attempt = this.requireAttempt(attemptId)
    if (attempt.approvalStatus !== 'awaiting-verification') {
      throw new Error('Only attempts awaiting verification can start a coding worker.')
    }
    if (attempt.execution.status !== 'not-started') {
      throw new Error('This coding worker has already started. Prepare a new worker for another attempt.')
    }
    const task = this.tasks.get(attempt.taskId)
    const startedAt = Date.now()
    const started = this.store.updateExecution(attemptId, {
      events: [{ createdAt: startedAt, message: 'Starting the isolated Codex worker.', type: 'started' }],
      startedAt,
      status: 'working',
    })
    try {
      this.runner.start({
        attempt: started,
        instructions: workerInstructions(started, task.sourcePrompt, task.sourceResponse),
        onEvent: (event) => this.appendEvent(attemptId, event),
        onExit: ({ exitCode, status }) => this.complete(attemptId, status, exitCode),
      })
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Codex could not start the worker.'
      this.complete(attemptId, 'failed')
      this.appendEvent(attemptId, { message, type: 'error' })
    }
    return this.requireAttempt(attemptId)
  }

  stop(attemptId: string): CodingWorkerAttempt {
    const attempt = this.requireAttempt(attemptId)
    if (attempt.execution.status !== 'working') {
      throw new Error('Only a working coding worker can be stopped.')
    }
    if (!this.runner.stop(attemptId)) throw new Error('The coding worker process is no longer available.')
    return this.appendEvent(attemptId, { message: 'Stop requested by the user.', type: 'stopped' })
  }

  private requireAttempt(attemptId: string): CodingWorkerAttempt {
    const attempt = this.store.get(attemptId)
    if (!attempt) throw new Error('Coding worker attempt was not found.')
    return attempt
  }

  private appendEvent(
    attemptId: string,
    event: Omit<CodingWorkerEvent, 'createdAt'>,
  ): CodingWorkerAttempt {
    const attempt = this.requireAttempt(attemptId)
    const events = [...attempt.execution.events, { ...event, createdAt: Date.now() }].slice(-250)
    return this.store.updateExecution(attemptId, { ...attempt.execution, events })
  }

  private complete(
    attemptId: string,
    status: 'complete' | 'failed' | 'stopped',
    exitCode?: number,
  ) {
    const attempt = this.requireAttempt(attemptId)
    const eventType: CodingWorkerEvent['type'] =
      status === 'complete' ? 'complete' : status === 'stopped' ? 'stopped' : 'error'
    const message =
      status === 'complete'
        ? 'Codex completed the worker request.'
        : status === 'stopped'
          ? 'Codex stopped. Partial work remains in the isolated worktree.'
          : `Codex exited with code ${exitCode ?? 'unknown'}. Partial work remains in the isolated worktree.`
    const events = [...attempt.execution.events, { createdAt: Date.now(), message, type: eventType }].slice(
      -250,
    )
    this.store.updateExecution(attemptId, {
      completedAt: Date.now(),
      events,
      exitCode,
      startedAt: attempt.execution.startedAt,
      status,
    })
  }

  close() {
    this.store.close()
  }
}

function lifecycleOf(attempt: CodingWorkerAttempt) {
  return {
    archivedAt: attempt.archivedAt,
    cleanedAt: attempt.cleanedAt,
    integratedAt: attempt.integratedAt,
  }
}

function workerInstructions(attempt: CodingWorkerAttempt, prompt: string, response: string) {
  return [
    'You are an isolated Zetro coding worker.',
    `Work only in the current approved module: ${attempt.modulePath}.`,
    'Do not edit outside this module. Do not commit, push, merge, deploy, delete the worktree, or change Git configuration.',
    'Use the task source and acceptance criteria below. Make the smallest complete change.',
    'Do not run checks that are not listed in the task plan. Zetro runs the named checks after you finish.',
    '',
    `Task request:\n${prompt}`,
    '',
    `Proposed work:\n${response}`,
    '',
    `Acceptance criteria:\n${attempt.acceptanceCriteria.map((item) => `- ${item}`).join('\n')}`,
    '',
    `Named checks (do not run here):\n${attempt.checks.map((item) => `- ${item}`).join('\n')}`,
    '',
    'End with a concise summary of files changed and any remaining risks.',
  ].join('\n')
}
