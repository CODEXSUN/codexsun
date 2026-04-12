import { randomUUID } from "node:crypto";

import type { Kysely } from "kysely";

import { zetroTableNames } from "../../database/table-names.js";
import { ApplicationError } from "../../../framework/src/runtime/errors/application-error.js";
import {
  listStorePayloads,
  listStoreRecords,
  replaceStoreRecords,
} from "../data/query-database.js";
import type {
  ZetroRun,
  ZetroRunEvent,
  ZetroCreateRunInput,
} from "./run-service.js";

export type ZetroLoopStatus =
  | "idle"
  | "running"
  | "paused"
  | "completed"
  | "cancelled"
  | "failed"
  | "timed-out";

export type ZetroStopConditionType =
  | "max-iterations"
  | "timeout"
  | "all-findings-fixed"
  | "zero-critical-findings"
  | "manual";

export type ZetroStopCondition = {
  type: ZetroStopConditionType;
  threshold?: number;
};

export type ZetroLoopConfiguration = {
  maxIterations: number;
  timeoutMs: number;
  stopConditions: ZetroStopCondition[];
  dryRun: boolean;
};

export type ZetroLoopState = {
  runId: string;
  status: ZetroLoopStatus;
  currentIteration: number;
  startedAt: string | null;
  endedAt: string | null;
  cancelledAt: string | null;
  cancelledBy: string | null;
  configuration: ZetroLoopConfiguration;
};

export type ZetroIterationEvent = {
  id: string;
  runId: string;
  iteration: number;
  kind:
    | "iteration-start"
    | "iteration-end"
    | "iteration-cancelled"
    | "proposal-generated"
    | "proposal-approved"
    | "proposal-rejected"
    | "command-executed"
    | "finding-created"
    | "stop-condition-met"
    | "timeout-reached"
    | "loop-started"
    | "loop-completed"
    | "loop-cancelled"
    | "loop-failed";
  summary: string;
  detail?: string;
  createdAt: string;
};

export type ZetroCreateLoopConfigurationInput = {
  maxIterations?: number;
  timeoutMs?: number;
  stopConditions?: ZetroStopCondition[];
  dryRun?: boolean;
};

export const DEFAULT_LOOP_CONFIGURATION: ZetroLoopConfiguration = {
  maxIterations: 10,
  timeoutMs: 30 * 60 * 1000,
  stopConditions: [
    { type: "max-iterations" },
    { type: "timeout" },
    { type: "zero-critical-findings" },
  ],
  dryRun: true,
};

const zetroLoopStatuses = new Set<ZetroLoopStatus>([
  "idle",
  "running",
  "paused",
  "completed",
  "cancelled",
  "failed",
  "timed-out",
]);

const zetroStopConditionTypes = new Set<ZetroStopConditionType>([
  "max-iterations",
  "timeout",
  "all-findings-fixed",
  "zero-critical-findings",
  "manual",
]);

function assertLoopStatus(status: ZetroLoopStatus) {
  if (!zetroLoopStatuses.has(status)) {
    throw new ApplicationError(`Unsupported loop status: ${status}`, {}, 400);
  }
}

function assertStopConditionType(type: ZetroStopConditionType) {
  if (!zetroStopConditionTypes.has(type)) {
    throw new ApplicationError(
      `Unsupported stop condition type: ${type}`,
      {},
      400,
    );
  }
}

export function normalizeLoopConfiguration(
  input?: ZetroCreateLoopConfigurationInput,
): ZetroLoopConfiguration {
  const config = {
    maxIterations:
      input?.maxIterations ?? DEFAULT_LOOP_CONFIGURATION.maxIterations,
    timeoutMs: input?.timeoutMs ?? DEFAULT_LOOP_CONFIGURATION.timeoutMs,
    stopConditions:
      input?.stopConditions ?? DEFAULT_LOOP_CONFIGURATION.stopConditions,
    dryRun: input?.dryRun ?? DEFAULT_LOOP_CONFIGURATION.dryRun,
  };

  if (config.maxIterations < 1 || config.maxIterations > 100) {
    throw new ApplicationError(
      "maxIterations must be between 1 and 100",
      {},
      400,
    );
  }

  if (config.timeoutMs < 60000 || config.timeoutMs > 3600000) {
    throw new ApplicationError(
      "timeoutMs must be between 60000 (1min) and 3600000 (1hr)",
      {},
      400,
    );
  }

  for (const condition of config.stopConditions) {
    assertStopConditionType(condition.type);
  }

  return config;
}

export async function getZetroLoopState(
  database: Kysely<unknown>,
  runId: string,
): Promise<ZetroLoopState | null> {
  const states = await listStorePayloads<ZetroLoopState>(
    database,
    zetroTableNames.loopStates,
  );

  return states.find((s) => s.runId === runId) ?? null;
}

export async function createZetroLoopState(
  database: Kysely<unknown>,
  runId: string,
  configuration?: ZetroCreateLoopConfigurationInput,
): Promise<ZetroLoopState> {
  const normalizedConfig = normalizeLoopConfiguration(configuration);

  const existingState = await getZetroLoopState(database, runId);
  if (existingState) {
    throw new ApplicationError(
      "Loop state already exists for this run",
      { runId },
      409,
    );
  }

  const state: ZetroLoopState = {
    runId,
    status: "idle",
    currentIteration: 0,
    startedAt: null,
    endedAt: null,
    cancelledAt: null,
    cancelledBy: null,
    configuration: normalizedConfig,
  };

  const records = await listStoreRecords<ZetroLoopState>(
    database,
    zetroTableNames.loopStates,
  );

  await replaceStoreRecords(database, zetroTableNames.loopStates, [
    ...records,
    {
      id: state.runId,
      moduleKey: "loop-state",
      sortOrder: (records.at(-1)?.sortOrder ?? 0) + 10,
      payload: state,
    },
  ]);

  return state;
}

export async function updateZetroLoopState(
  database: Kysely<unknown>,
  runId: string,
  updates: Partial<
    Pick<
      ZetroLoopState,
      "status" | "currentIteration" | "startedAt" | "endedAt"
    >
  >,
): Promise<ZetroLoopState> {
  const state = await getZetroLoopState(database, runId);

  if (!state) {
    throw new ApplicationError("Loop state not found", { runId }, 404);
  }

  if (updates.status) {
    assertLoopStatus(updates.status);
  }

  const updatedState: ZetroLoopState = {
    ...state,
    ...updates,
  };

  const records = await listStoreRecords<ZetroLoopState>(
    database,
    zetroTableNames.loopStates,
  );

  await replaceStoreRecords(
    database,
    zetroTableNames.loopStates,
    records.map((r) => (r.id === runId ? { ...r, payload: updatedState } : r)),
  );

  return updatedState;
}

export async function startZetroLoop(
  database: Kysely<unknown>,
  runId: string,
  cancelledBy?: string,
): Promise<ZetroLoopState> {
  let state = await getZetroLoopState(database, runId);

  if (!state) {
    state = await createZetroLoopState(database, runId);
  }

  if (state.status === "running") {
    throw new ApplicationError("Loop is already running", { runId }, 409);
  }

  return updateZetroLoopState(database, runId, {
    status: "running",
    startedAt: state.startedAt ?? new Date().toISOString(),
    currentIteration: state.status === "paused" ? state.currentIteration : 1,
  });
}

export async function cancelZetroLoop(
  database: Kysely<unknown>,
  runId: string,
  cancelledBy: string = "operator",
): Promise<ZetroLoopState> {
  const state = await getZetroLoopState(database, runId);

  if (!state) {
    throw new ApplicationError("Loop state not found", { runId }, 404);
  }

  if (state.status === "completed" || state.status === "cancelled") {
    throw new ApplicationError(
      "Loop cannot be cancelled",
      { runId, status: state.status },
      409,
    );
  }

  const updatedState: ZetroLoopState = {
    ...state,
    status: "cancelled",
    endedAt: new Date().toISOString(),
    cancelledAt: new Date().toISOString(),
    cancelledBy,
  };

  const records = await listStoreRecords<ZetroLoopState>(
    database,
    zetroTableNames.loopStates,
  );

  await replaceStoreRecords(
    database,
    zetroTableNames.loopStates,
    records.map((r) => (r.id === runId ? { ...r, payload: updatedState } : r)),
  );

  return updatedState;
}

export async function completeZetroLoop(
  database: Kysely<unknown>,
  runId: string,
): Promise<ZetroLoopState> {
  return updateZetroLoopState(database, runId, {
    status: "completed",
    endedAt: new Date().toISOString(),
  });
}

export async function failZetroLoop(
  database: Kysely<unknown>,
  runId: string,
): Promise<ZetroLoopState> {
  return updateZetroLoopState(database, runId, {
    status: "failed",
    endedAt: new Date().toISOString(),
  });
}

export async function timeoutZetroLoop(
  database: Kysely<unknown>,
  runId: string,
): Promise<ZetroLoopState> {
  return updateZetroLoopState(database, runId, {
    status: "timed-out",
    endedAt: new Date().toISOString(),
  });
}

export async function incrementZetroLoopIteration(
  database: Kysely<unknown>,
  runId: string,
): Promise<ZetroLoopState> {
  const state = await getZetroLoopState(database, runId);

  if (!state) {
    throw new ApplicationError("Loop state not found", { runId }, 404);
  }

  if (state.status !== "running") {
    throw new ApplicationError("Loop is not running", { runId }, 409);
  }

  return updateZetroLoopState(database, runId, {
    currentIteration: state.currentIteration + 1,
  });
}

export async function logZetroIterationEvent(
  database: Kysely<unknown>,
  runId: string,
  event: Omit<ZetroIterationEvent, "id" | "runId" | "createdAt">,
): Promise<ZetroIterationEvent> {
  const iterationEvent: ZetroIterationEvent = {
    id: `zetro-iter-event-${randomUUID()}`,
    runId,
    createdAt: new Date().toISOString(),
    ...event,
  };

  const records = await listStoreRecords<ZetroIterationEvent>(
    database,
    zetroTableNames.loopStates,
  );

  await replaceStoreRecords(database, zetroTableNames.loopStates, [
    ...records,
    {
      id: iterationEvent.id,
      moduleKey: "iteration-event",
      sortOrder: (records.at(-1)?.sortOrder ?? 0) + 10,
      payload: iterationEvent,
    },
  ]);

  return iterationEvent;
}

export async function listZetroIterationEvents(
  database: Kysely<unknown>,
  runId?: string,
): Promise<ZetroIterationEvent[]> {
  const events = await listStorePayloads<ZetroIterationEvent>(
    database,
    zetroTableNames.loopStates,
  );

  return events
    .filter((e) => !runId || e.runId === runId)
    .sort(
      (a, b) =>
        new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime(),
    );
}

export function checkStopConditions(
  state: ZetroLoopState,
  currentIteration: number,
  criticalFindings: number,
  isRunning: boolean,
): { shouldStop: boolean; reason: string } {
  const config = state.configuration;

  if (!isRunning) {
    return { shouldStop: false, reason: "" };
  }

  for (const condition of config.stopConditions) {
    switch (condition.type) {
      case "max-iterations":
        if (currentIteration >= config.maxIterations) {
          return {
            shouldStop: true,
            reason: `Max iterations reached: ${currentIteration}/${config.maxIterations}`,
          };
        }
        break;
      case "timeout":
        if (state.startedAt) {
          const elapsed = Date.now() - new Date(state.startedAt).getTime();
          if (elapsed >= config.timeoutMs) {
            return {
              shouldStop: true,
              reason: `Timeout reached: ${elapsed}ms/${config.timeoutMs}ms`,
            };
          }
        }
        break;
      case "zero-critical-findings":
        if (criticalFindings === 0) {
          return {
            shouldStop: true,
            reason: "Zero critical findings achieved",
          };
        }
        break;
      case "all-findings-fixed":
        if (criticalFindings === 0) {
          return {
            shouldStop: true,
            reason: "All findings resolved",
          };
        }
        break;
      case "manual":
        break;
    }
  }

  return { shouldStop: false, reason: "" };
}
