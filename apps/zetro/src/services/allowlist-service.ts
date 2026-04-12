import { randomUUID } from "node:crypto";

import type { Kysely } from "kysely";

import { zetroTableNames } from "../../database/table-names.js";
import { ApplicationError } from "../../../framework/src/runtime/errors/application-error.js";
import {
  listStorePayloads,
  listStoreRecords,
  replaceStoreRecords,
} from "../data/query-database.js";

export type ZetroAllowedCommandCategory =
  | "read-only"
  | "code-generation"
  | "build"
  | "test"
  | "lint"
  | "typecheck"
  | "database"
  | "file-system"
  | "git"
  | "custom";

export type ZetroBlockedCommandPattern = {
  pattern: string;
  reason: string;
};

export type ZetroCommandAllowlistEntry = {
  id: string;
  command: string;
  category: ZetroAllowedCommandCategory;
  description: string;
  enabled: boolean;
  maxArgs?: number;
  maxTimeoutSeconds?: number;
  createdAt: string;
  updatedAt: string | null;
};

export type ZetroBlockedCommandEntry = {
  id: string;
  pattern: string;
  reason: string;
  severity: "blocking" | "warning";
  createdAt: string;
};

export type ZetroRunnerPolicySettings = {
  allowAll: boolean;
  requireApproval: boolean;
  maxTimeoutSeconds: number;
  auditAllCommands: boolean;
};

export type ZetroCreateAllowlistEntryInput = {
  command: string;
  category: ZetroAllowedCommandCategory;
  description?: string;
  enabled?: boolean;
  maxArgs?: number;
  maxTimeoutSeconds?: number;
};

export type ZetroCreateBlockedCommandInput = {
  pattern: string;
  reason: string;
  severity?: "blocking" | "warning";
};

export type ZetroPolicyCheckResult = {
  allowed: boolean;
  reason: string;
  blocked: boolean;
  category?: ZetroAllowedCommandCategory;
};

const SENSITIVE_COMMANDS = new Set([
  "rm",
  "rmdir",
  "del",
  "format",
  "shutdown",
  "reboot",
  "halt",
  "init",
  "mkfs",
  "dd",
  "fdisk",
]);

const BLOCKED_COMMANDS = new Set(["sudo", "su", "chmod", "chown", "chgrp"]);

function isSensitiveCommand(command: string): boolean {
  const parts = command.toLowerCase().split(/\s+/);
  const baseCommand = parts[0] ?? "";
  return SENSITIVE_COMMANDS.has(baseCommand);
}

function isBlockedCommand(command: string): boolean {
  const parts = command.toLowerCase().split(/\s+/);
  const baseCommand = parts[0] ?? "";
  return BLOCKED_COMMANDS.has(baseCommand);
}

export async function listZetroAllowlistEntries(
  database: Kysely<unknown>,
  filters?: { enabled?: boolean; category?: ZetroAllowedCommandCategory },
) {
  let entries = await listStorePayloads<ZetroCommandAllowlistEntry>(
    database,
    zetroTableNames.commandAllowlist,
  );

  if (filters?.enabled !== undefined) {
    entries = entries.filter((e) => e.enabled === filters.enabled);
  }

  if (filters?.category) {
    entries = entries.filter((e) => e.category === filters.category);
  }

  return entries;
}

export async function listZetroBlockedCommands(database: Kysely<unknown>) {
  return listStorePayloads<ZetroBlockedCommandEntry>(
    database,
    zetroTableNames.commandAllowlist,
  ).then((entries) =>
    entries.filter((e) => "pattern" in e && "reason" in e && "severity" in e),
  ) as Promise<ZetroBlockedCommandEntry[]>;
}

export async function getZetroRunnerPolicy(
  database: Kysely<unknown>,
): Promise<ZetroRunnerPolicySettings> {
  const entries = await listStorePayloads<{
    allowAll?: boolean;
    requireApproval?: boolean;
    maxTimeoutSeconds?: number;
    auditAllCommands?: boolean;
  }>(database, zetroTableNames.commandAllowlist);

  const policy = entries.find((e) => "allowAll" in e);

  return {
    allowAll: policy?.allowAll ?? false,
    requireApproval: policy?.requireApproval ?? true,
    maxTimeoutSeconds: policy?.maxTimeoutSeconds ?? 300,
    auditAllCommands: policy?.auditAllCommands ?? true,
  };
}

export async function createZetroAllowlistEntry(
  database: Kysely<unknown>,
  input: ZetroCreateAllowlistEntryInput,
) {
  const command = input.command?.trim();
  const category = input.category;

  if (!command || !category) {
    throw new ApplicationError(
      "Zetro allowlist entry command and category are required.",
      {},
      400,
    );
  }

  const records = await listStoreRecords<ZetroCommandAllowlistEntry>(
    database,
    zetroTableNames.commandAllowlist,
  );

  if (records.some((r) => r.payload.command === command)) {
    throw new ApplicationError(
      "Zetro allowlist entry already exists for this command.",
      { command },
      409,
    );
  }

  const now = new Date().toISOString();
  const entry: ZetroCommandAllowlistEntry = {
    id: `zetro-allow-${randomUUID()}`,
    command,
    category,
    description: input.description?.trim() || "",
    enabled: input.enabled ?? true,
    maxArgs: input.maxArgs,
    maxTimeoutSeconds: input.maxTimeoutSeconds,
    createdAt: now,
    updatedAt: null,
  };

  await replaceStoreRecords(database, zetroTableNames.commandAllowlist, [
    ...records,
    {
      id: entry.id,
      moduleKey: category,
      sortOrder: (records.at(-1)?.sortOrder ?? 0) + 10,
      payload: entry,
    },
  ]);

  return entry;
}

export async function createZetroBlockedCommand(
  database: Kysely<unknown>,
  input: ZetroCreateBlockedCommandInput,
) {
  const pattern = input.pattern?.trim();
  const reason = input.reason?.trim();

  if (!pattern || !reason) {
    throw new ApplicationError(
      "Zetro blocked command pattern and reason are required.",
      {},
      400,
    );
  }

  const records = await listStoreRecords<ZetroBlockedCommandEntry>(
    database,
    zetroTableNames.commandAllowlist,
  );

  if (records.some((r) => r.payload.pattern === pattern)) {
    throw new ApplicationError(
      "Zetro blocked command pattern already exists.",
      { pattern },
      409,
    );
  }

  const now = new Date().toISOString();
  const entry: ZetroBlockedCommandEntry = {
    id: `zetro-blocked-${randomUUID()}`,
    pattern,
    reason,
    severity: input.severity ?? "warning",
    createdAt: now,
  };

  await replaceStoreRecords(database, zetroTableNames.commandAllowlist, [
    ...records,
    {
      id: entry.id,
      moduleKey: "blocked",
      sortOrder: (records.at(-1)?.sortOrder ?? 0) + 10,
      payload: entry,
    },
  ]);

  return entry;
}

export async function checkCommandPolicy(
  database: Kysely<unknown>,
  command: string,
  args: string[] = [],
): Promise<ZetroPolicyCheckResult> {
  const [allowlist, blocked, policy] = await Promise.all([
    listZetroAllowlistEntries(database, { enabled: true }),
    listZetroBlockedCommands(database),
    getZetroRunnerPolicy(database),
  ]);

  if (policy.allowAll) {
    return {
      allowed: true,
      reason: "Policy allows all commands.",
      blocked: false,
    };
  }

  if (isBlockedCommand(command)) {
    return {
      allowed: false,
      reason: `Command '${command}' is permanently blocked for security.`,
      blocked: true,
    };
  }

  if (isSensitiveCommand(command)) {
    return {
      allowed: false,
      reason: `Command '${command}' is marked as sensitive and requires explicit allowlist entry.`,
      blocked: true,
    };
  }

  for (const entry of blocked) {
    try {
      const regex = new RegExp(entry.pattern);
      if (regex.test(command)) {
        return {
          allowed: entry.severity !== "blocking",
          reason: entry.reason,
          blocked: entry.severity === "blocking",
        };
      }
    } catch {
      if (command.includes(entry.pattern)) {
        return {
          allowed: entry.severity !== "blocking",
          reason: entry.reason,
          blocked: entry.severity === "blocking",
        };
      }
    }
  }

  const allowlistEntry = allowlist.find((e) => e.command === command);

  if (!allowlistEntry) {
    return {
      allowed: false,
      reason: `Command '${command}' is not in the allowlist.`,
      blocked: true,
    };
  }

  if (allowlistEntry.maxArgs && args.length > allowlistEntry.maxArgs) {
    return {
      allowed: false,
      reason: `Command '${command}' exceeds max args (${args.length} > ${allowlistEntry.maxArgs}).`,
      blocked: true,
      category: allowlistEntry.category,
    };
  }

  return {
    allowed: true,
    reason: `Command '${command}' is allowed (${allowlistEntry.category}).`,
    blocked: false,
    category: allowlistEntry.category,
  };
}
