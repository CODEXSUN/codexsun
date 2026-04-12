import { randomUUID } from "node:crypto";
import { spawn } from "node:child_process";

import type { Kysely } from "kysely";

import { zetroTableNames } from "../../database/table-names.js";
import { ApplicationError } from "../../../framework/src/runtime/errors/application-error.js";
import {
  listStorePayloads,
  listStoreRecords,
  replaceStoreRecords,
} from "../data/query-database.js";
import { checkCommandPolicy } from "./allowlist-service.js";
import {
  getZetroCommandProposal,
  updateZetroCommandProposalStatus,
} from "./command-proposal-service.js";

export type ZetroExecutedCommandStatus =
  | "running"
  | "completed"
  | "failed"
  | "cancelled";

export type ZetroExecutedCommand = {
  id: string;
  proposalId: string | null;
  runId: string;
  command: string;
  args: string[];
  stdout: string;
  stderr: string;
  exitCode: number | null;
  status: ZetroExecutedCommandStatus;
  startedAt: string;
  completedAt: string | null;
  cancelledAt: string | null;
};

export type ZetroExecuteCommandInput = {
  proposalId?: string;
  runId: string;
  command: string;
  args?: string[];
  timeoutSeconds?: number;
};

export type ZetroExecutionResult = {
  id: string;
  proposalId: string | null;
  runId: string;
  command: string;
  args: string[];
  stdout: string;
  stderr: string;
  exitCode: number | null;
  status: ZetroExecutedCommandStatus;
  durationMs: number;
  startedAt: string;
  completedAt: string;
};

const DEFAULT_TIMEOUT_SECONDS = 300;

export async function listZetroExecutedCommands(
  database: Kysely<unknown>,
  filters?: { runId?: string; status?: ZetroExecutedCommandStatus },
) {
  let commands = await listStorePayloads<ZetroExecutedCommand>(
    database,
    zetroTableNames.executedCommands,
  );

  if (filters?.runId) {
    commands = commands.filter((c) => c.runId === filters.runId);
  }

  if (filters?.status) {
    commands = commands.filter((c) => c.status === filters.status);
  }

  return commands.sort(
    (a, b) => new Date(b.startedAt).getTime() - new Date(a.startedAt).getTime(),
  );
}

export async function getZetroExecutedCommand(
  database: Kysely<unknown>,
  commandId: string,
) {
  const commands = await listStorePayloads<ZetroExecutedCommand>(
    database,
    zetroTableNames.executedCommands,
  );

  return commands.find((c) => c.id === commandId) ?? null;
}

async function persistExecutedCommand(
  database: Kysely<unknown>,
  command: ZetroExecutedCommand,
) {
  const records = await listStoreRecords<ZetroExecutedCommand>(
    database,
    zetroTableNames.executedCommands,
  );

  const existing = records.findIndex((r) => r.id === command.id);

  if (existing >= 0) {
    await replaceStoreRecords(
      database,
      zetroTableNames.executedCommands,
      records.map((r, i) => (i === existing ? { ...r, payload: command } : r)),
    );
  } else {
    await replaceStoreRecords(database, zetroTableNames.executedCommands, [
      ...records,
      {
        id: command.id,
        moduleKey: command.runId,
        sortOrder: (records.at(-1)?.sortOrder ?? 0) + 10,
        payload: command,
      },
    ]);
  }
}

export async function executeApprovedCommand(
  database: Kysely<unknown>,
  input: ZetroExecuteCommandInput,
): Promise<ZetroExecutionResult> {
  const {
    proposalId,
    runId,
    command,
    args = [],
    timeoutSeconds = DEFAULT_TIMEOUT_SECONDS,
  } = input;

  if (proposalId) {
    const proposal = await getZetroCommandProposal(database, proposalId);

    if (!proposal) {
      throw new ApplicationError(
        "Zetro command proposal could not be found.",
        { proposalId },
        404,
      );
    }

    if (proposal.status !== "approved") {
      throw new ApplicationError(
        "Only approved commands can be executed.",
        { proposalId, status: proposal.status },
        400,
      );
    }
  }

  const policyCheck = await checkCommandPolicy(database, command, args);

  if (policyCheck.blocked) {
    throw new ApplicationError(
      `Command '${command}' is blocked by policy: ${policyCheck.reason}`,
      { command, reason: policyCheck.reason },
      400,
    );
  }

  const executionId = `zetro-exec-${randomUUID()}`;
  const startedAt = new Date().toISOString();

  let executedCommand: ZetroExecutedCommand = {
    id: executionId,
    proposalId: proposalId ?? null,
    runId,
    command,
    args,
    stdout: "",
    stderr: "",
    exitCode: null,
    status: "running",
    startedAt,
    completedAt: null,
    cancelledAt: null,
  };

  await persistExecutedCommand(database, executedCommand);

  return new Promise<ZetroExecutionResult>((resolve, reject) => {
    const timeoutMs = timeoutSeconds * 1000;
    let timeoutHandle: ReturnType<typeof setTimeout> | null = null;
    let cancelled = false;

    const child = spawn(command, args, {
      shell: true,
      stdio: ["ignore", "pipe", "pipe"],
    });

    const stdoutChunks: Buffer[] = [];
    const stderrChunks: Buffer[] = [];

    child.stdout?.on("data", (chunk: Buffer) => {
      stdoutChunks.push(chunk);
    });

    child.stderr?.on("data", (chunk: Buffer) => {
      stderrChunks.push(chunk);
    });

    child.on("error", (error) => {
      if (timeoutHandle) {
        clearTimeout(timeoutHandle);
      }

      const completedAt = new Date().toISOString();
      executedCommand = {
        ...executedCommand,
        status: "failed",
        stderr: executedCommand.stderr + `\nExecution error: ${error.message}`,
        completedAt,
      };

      void persistExecutedCommand(database, executedCommand).then(() => {
        reject(
          new ApplicationError(
            `Command execution failed: ${error.message}`,
            { executionId, command },
            500,
          ),
        );
      });
    });

    child.on("close", async (code) => {
      if (timeoutHandle) {
        clearTimeout(timeoutHandle);
      }

      const completedAt = new Date().toISOString();
      const status = cancelled
        ? "cancelled"
        : code === 0
          ? "completed"
          : "failed";

      executedCommand = {
        ...executedCommand,
        stdout: Buffer.concat(stdoutChunks).toString("utf8"),
        stderr: Buffer.concat(stderrChunks).toString("utf8"),
        exitCode: code,
        status,
        completedAt: cancelled ? executedCommand.cancelledAt : completedAt,
      };

      await persistExecutedCommand(database, executedCommand);

      const durationMs =
        new Date(completedAt).getTime() - new Date(startedAt).getTime();

      resolve({
        id: executedCommand.id,
        proposalId: executedCommand.proposalId,
        runId: executedCommand.runId,
        command: executedCommand.command,
        args: executedCommand.args,
        stdout: executedCommand.stdout,
        stderr: executedCommand.stderr,
        exitCode: executedCommand.exitCode,
        status: executedCommand.status,
        durationMs,
        startedAt: executedCommand.startedAt,
        completedAt,
      });
    });

    timeoutHandle = setTimeout(async () => {
      cancelled = true;
      child.kill("SIGTERM");

      const cancelledAt = new Date().toISOString();
      executedCommand = {
        ...executedCommand,
        status: "cancelled",
        stderr:
          executedCommand.stderr +
          `\nExecution cancelled: timeout of ${timeoutSeconds}s exceeded`,
        cancelledAt,
        completedAt: cancelledAt,
      };

      await persistExecutedCommand(database, executedCommand);

      const durationMs =
        new Date(cancelledAt).getTime() - new Date(startedAt).getTime();

      resolve({
        id: executedCommand.id,
        proposalId: executedCommand.proposalId,
        runId: executedCommand.runId,
        command: executedCommand.command,
        args: executedCommand.args,
        stdout: executedCommand.stdout,
        stderr: executedCommand.stderr,
        exitCode: null,
        status: "cancelled",
        durationMs,
        startedAt: executedCommand.startedAt,
        completedAt: cancelledAt,
      });
    }, timeoutMs);
  });
}

export async function executeAndApprove(
  database: Kysely<unknown>,
  proposalId: string,
): Promise<ZetroExecutionResult> {
  const proposal = await getZetroCommandProposal(database, proposalId);

  if (!proposal) {
    throw new ApplicationError(
      "Zetro command proposal could not be found.",
      { proposalId },
      404,
    );
  }

  if (proposal.status !== "pending") {
    throw new ApplicationError(
      "Only pending proposals can be approved and executed.",
      { proposalId, status: proposal.status },
      400,
    );
  }

  await updateZetroCommandProposalStatus(database, proposalId, {
    status: "approved",
    reviewedBy: "zetro-runner",
  });

  return executeApprovedCommand(database, {
    proposalId,
    runId: proposal.runId,
    command: proposal.command,
    args: proposal.args,
  });
}
