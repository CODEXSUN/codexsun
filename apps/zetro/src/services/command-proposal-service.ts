import { randomUUID } from "node:crypto";

import type { Kysely } from "kysely";

import { zetroTableNames } from "../../database/table-names.js";
import { ApplicationError } from "../../../framework/src/runtime/errors/application-error.js";
import {
  listStorePayloads,
  listStoreRecords,
  replaceStoreRecords,
} from "../data/query-database.js";

export type ZetroCommandProposalStatus = "pending" | "approved" | "rejected";

export type ZetroCommandProposal = {
  id: string;
  runId: string;
  command: string;
  args: string[];
  summary: string;
  rationale: string;
  status: ZetroCommandProposalStatus;
  policyWarning?: string | null;
  reviewedAt: string | null;
  reviewedBy: string | null;
  createdAt: string;
};

export type ZetroCreateCommandProposalInput = {
  id?: string;
  runId: string;
  command: string;
  args?: string[];
  summary: string;
  rationale?: string;
};

export type ZetroUpdateCommandProposalStatusInput = {
  status: ZetroCommandProposalStatus;
  reviewedBy?: string;
};

const zetroCommandProposalStatuses = new Set<ZetroCommandProposalStatus>([
  "pending",
  "approved",
  "rejected",
]);

function assertCommandProposalStatus(status: ZetroCommandProposalStatus) {
  if (!zetroCommandProposalStatuses.has(status)) {
    throw new ApplicationError(
      "Unsupported Zetro command proposal status.",
      { status },
      400,
    );
  }
}

function normalizeCommandProposalInput(input: ZetroCreateCommandProposalInput) {
  const command = input.command?.trim();
  const runId = input.runId?.trim();
  const summary = input.summary?.trim();

  if (!command || !runId || !summary) {
    throw new ApplicationError(
      "Zetro command proposal command, runId, and summary are required.",
      {},
      400,
    );
  }

  return {
    id: input.id?.trim() || `zetro-proposal-${randomUUID()}`,
    runId,
    command,
    args: input.args ?? [],
    summary,
    rationale: input.rationale?.trim() || "",
  };
}

export async function listZetroCommandProposals(
  database: Kysely<unknown>,
  filters?: {
    runId?: string;
    status?: ZetroCommandProposalStatus;
  },
) {
  let proposals = await listStorePayloads<ZetroCommandProposal>(
    database,
    zetroTableNames.commandProposals,
  );

  if (filters?.runId) {
    proposals = proposals.filter((p) => p.runId === filters.runId);
  }

  if (filters?.status) {
    proposals = proposals.filter((p) => p.status === filters.status);
  }

  return proposals.sort(
    (a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime(),
  );
}

export async function getZetroCommandProposal(
  database: Kysely<unknown>,
  proposalId: string,
) {
  const proposals = await listStorePayloads<ZetroCommandProposal>(
    database,
    zetroTableNames.commandProposals,
  );

  return proposals.find((p) => p.id === proposalId) ?? null;
}

export async function createZetroCommandProposal(
  database: Kysely<unknown>,
  input: ZetroCreateCommandProposalInput,
) {
  const normalizedInput = normalizeCommandProposalInput(input);
  const records = await listStoreRecords<ZetroCommandProposal>(
    database,
    zetroTableNames.commandProposals,
  );

  if (records.some((record) => record.id === normalizedInput.id)) {
    throw new ApplicationError(
      "Zetro command proposal id already exists.",
      { proposalId: normalizedInput.id },
      409,
    );
  }

  const { checkCommandPolicy } = await import("./allowlist-service.js");
  const policyCheck = await checkCommandPolicy(
    database,
    normalizedInput.command,
    normalizedInput.args,
  );

  if (policyCheck.blocked) {
    throw new ApplicationError(
      `Command '${normalizedInput.command}' is blocked by policy: ${policyCheck.reason}`,
      { command: normalizedInput.command, reason: policyCheck.reason },
      400,
    );
  }

  const proposal = {
    id: normalizedInput.id,
    runId: normalizedInput.runId,
    command: normalizedInput.command,
    args: normalizedInput.args,
    summary: normalizedInput.summary,
    rationale: normalizedInput.rationale,
    status: "pending" as ZetroCommandProposalStatus,
    reviewedAt: null,
    reviewedBy: null,
    policyWarning: policyCheck.allowed ? null : policyCheck.reason,
    createdAt: new Date().toISOString(),
  } satisfies ZetroCommandProposal & { policyWarning?: string | null };

  await replaceStoreRecords(database, zetroTableNames.commandProposals, [
    ...records,
    {
      id: proposal.id,
      moduleKey: normalizedInput.runId,
      sortOrder: (records.at(-1)?.sortOrder ?? 0) + 10,
      payload: proposal,
    },
  ]);

  return proposal;
}

export async function updateZetroCommandProposalStatus(
  database: Kysely<unknown>,
  proposalId: string,
  input: ZetroUpdateCommandProposalStatusInput,
) {
  assertCommandProposalStatus(input.status);

  const records = await listStoreRecords<ZetroCommandProposal>(
    database,
    zetroTableNames.commandProposals,
  );
  const target = records.find((record) => record.id === proposalId);

  if (!target) {
    throw new ApplicationError(
      "Zetro command proposal could not be found.",
      { proposalId },
      404,
    );
  }

  const now = new Date().toISOString();
  const updatedProposal = {
    ...target.payload,
    status: input.status,
    reviewedAt: now,
    reviewedBy: input.reviewedBy ?? null,
  } satisfies ZetroCommandProposal;

  await replaceStoreRecords(
    database,
    zetroTableNames.commandProposals,
    records.map((record) => {
      if (record.id !== proposalId) {
        return record;
      }

      return {
        ...record,
        payload: updatedProposal,
        updatedAt: now,
      };
    }),
  );

  return updatedProposal;
}
