// Run Cancellation Coordinator
// Manages registered run cancellation hooks for active agent jobs,
// ensuring immediate, coordinated cancellation when:
// 1. A session is revoked or logged out
// 2. An actor's workspace membership is removed or role downgraded
// 3. A workspace is terminated or locked
// 4. An explicit cancellation request is issued by an authorized actor

export class RunCancellationCoordinator {
  #activeRuns = new Map();
  #store;

  constructor(options = {}) {
    this.#store = options.store || null;
  }

  // Register an active agent run with its cancellation hook
  registerRun({ runId, workspaceId, actorId, sessionId = null, cancelHook }) {
    if (!runId || !workspaceId || !actorId || typeof cancelHook !== 'function') {
      throw new Error('runId, workspaceId, actorId, and cancelHook function are required');
    }

    const run = {
      runId,
      workspaceId,
      actorId,
      sessionId,
      cancelHook,
      registeredAt: Date.now(),
      status: 'active',
    };

    this.#activeRuns.set(runId, run);
    return run;
  }

  // Unregister a completed or settled run
  unregisterRun(runId) {
    return this.#activeRuns.delete(runId);
  }

  // Check if a run is currently registered and active
  hasActiveRun(runId) {
    return this.#activeRuns.has(runId);
  }

  // Get active run metadata (without exposing internal callback)
  getRun(runId) {
    const run = this.#activeRuns.get(runId);
    if (!run) return null;
    return {
      runId: run.runId,
      workspaceId: run.workspaceId,
      actorId: run.actorId,
      sessionId: run.sessionId,
      registeredAt: run.registeredAt,
      status: run.status,
    };
  }

  // List all active runs matching optional filters
  listActiveRuns({ workspaceId = null, actorId = null, sessionId = null } = {}) {
    const results = [];
    for (const run of this.#activeRuns.values()) {
      if (workspaceId && run.workspaceId !== workspaceId) continue;
      if (actorId && run.actorId !== actorId) continue;
      if (sessionId && run.sessionId !== sessionId) continue;
      results.push({
        runId: run.runId,
        workspaceId: run.workspaceId,
        actorId: run.actorId,
        sessionId: run.sessionId,
        registeredAt: run.registeredAt,
        status: run.status,
      });
    }
    return results;
  }

  // Cancel a single run by ID
  async cancelRun(runId, { reason = 'user_cancelled', cancelledBy = 'system' } = {}) {
    const run = this.#activeRuns.get(runId);
    if (!run) {
      return { cancelled: false, reason: `Run "${runId}" not found or already completed` };
    }

    try {
      await Promise.resolve(run.cancelHook({ reason, cancelledBy, timestamp: Date.now() }));
    } catch (err) {
      // Log or swallow hook execution error to ensure cleanup proceeds
    }

    run.status = 'cancelled';
    this.#activeRuns.delete(runId);

    if (this.#store?.repository) {
      await this.#store.repository
        .recordAuditLog({
          workspaceId: run.workspaceId,
          actorId: cancelledBy,
          action: 'run.cancelled',
          targetType: 'agent_run',
          targetId: runId,
          details: { reason, previousActorId: run.actorId },
        })
        .catch(() => {});
    }

    return { cancelled: true, runId, reason, cancelledBy };
  }

  // Cancel all runs associated with a specific session ID
  async cancelRunsForSession(sessionId, { reason = 'session_revoked', cancelledBy = 'system' } = {}) {
    if (!sessionId) return [];
    const matched = [];
    for (const run of this.#activeRuns.values()) {
      if (run.sessionId === sessionId) {
        matched.push(run.runId);
      }
    }

    const results = [];
    for (const runId of matched) {
      const res = await this.cancelRun(runId, { reason, cancelledBy });
      results.push(res);
    }
    return results;
  }

  // Cancel all runs associated with a specific actor (optionally scoped to a workspace)
  async cancelRunsForActor(
    actorId,
    { workspaceId = null, reason = 'membership_revoked', cancelledBy = 'system' } = {}
  ) {
    if (!actorId) return [];
    const matched = [];
    for (const run of this.#activeRuns.values()) {
      if (run.actorId === actorId) {
        if (!workspaceId || run.workspaceId === workspaceId) {
          matched.push(run.runId);
        }
      }
    }

    const results = [];
    for (const runId of matched) {
      const res = await this.cancelRun(runId, { reason, cancelledBy });
      results.push(res);
    }
    return results;
  }

  // Cancel all runs within a workspace
  async cancelRunsForWorkspace(
    workspaceId,
    { reason = 'workspace_locked', cancelledBy = 'system' } = {}
  ) {
    if (!workspaceId) return [];
    const matched = [];
    for (const run of this.#activeRuns.values()) {
      if (run.workspaceId === workspaceId) {
        matched.push(run.runId);
      }
    }

    const results = [];
    for (const runId of matched) {
      const res = await this.cancelRun(runId, { reason, cancelledBy });
      results.push(res);
    }
    return results;
  }
}

export function createRunCancellationCoordinator(options) {
  return new RunCancellationCoordinator(options);
}
