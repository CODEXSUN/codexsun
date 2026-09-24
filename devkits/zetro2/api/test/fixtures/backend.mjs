// Deterministic test backend fixture for agent execution simulations

export function createTestBackendFixture() {
  const runs = new Map();
  const listeners = new Set();

  function emit(event) {
    for (const listener of listeners) {
      try {
        listener(event);
      } catch {
        // ignore subscriber errors
      }
    }
  }

  return {
    onEvent(listener) {
      listeners.add(listener);
      return () => listeners.delete(listener);
    },

    startRun({ runId, taskId, workspaceId, actorId, prompt, backend = 'native' }) {
      const run = {
        id: runId,
        taskId,
        workspaceId,
        actorId,
        backend,
        prompt,
        status: 'running',
        steps: [],
        proposedEdits: [],
        startedAt: new Date().toISOString(),
        completedAt: null,
      };
      runs.set(runId, run);
      emit({ type: 'run.started', runId, taskId, timestamp: run.startedAt });
      return run;
    },

    proposeToolCall(runId, { toolName, args }) {
      const run = runs.get(runId);
      if (!run) throw new Error(`Run ${runId} not found`);
      const step = { type: 'tool_proposed', toolName, args, timestamp: new Date().toISOString() };
      run.steps.push(step);
      emit({ type: 'tool.proposed', runId, toolName, args });
      return step;
    },

    proposeDiff(runId, { filePath, originalContent, proposedContent, conflictDetected = false }) {
      const run = runs.get(runId);
      if (!run) throw new Error(`Run ${runId} not found`);
      const edit = { filePath, originalContent, proposedContent, conflictDetected, status: conflictDetected ? 'conflict' : 'pending' };
      run.proposedEdits.push(edit);
      emit({ type: 'diff.proposed', runId, filePath, conflictDetected });
      return edit;
    },

    cancelRun(runId, reason = 'user_cancelled') {
      const run = runs.get(runId);
      if (!run) throw new Error(`Run ${runId} not found`);
      run.status = 'cancelled';
      run.completedAt = new Date().toISOString();
      run.cancelReason = reason;
      emit({ type: 'run.cancelled', runId, reason });
      return run;
    },

    completeRun(runId, { status = 'succeeded', summary = 'Run completed successfully' } = {}) {
      const run = runs.get(runId);
      if (!run) throw new Error(`Run ${runId} not found`);
      run.status = status;
      run.completedAt = new Date().toISOString();
      run.summary = summary;
      emit({ type: 'run.completed', runId, status, summary });
      return run;
    },

    getRun(runId) {
      return runs.get(runId);
    },

    getAllRuns() {
      return Array.from(runs.values());
    },
  };
}
