export type PreparedCollection = Awaited<
  ReturnType<import("../import-review/index.js").CommonTableReferences["prepare"]>
>;
export type ConflictResolution = {
  id: string;
  table: import("../import-review/index.js").CommonTableName;
  sourceId: number;
  targetId: number;
  targetUuid: string | null;
  status: "prepared" | "committed";
  source: Record<string, unknown>;
  collection: Record<string, unknown>;
  references: PreparedCollection["references"];
  prepared: Record<string, unknown>;
  before: Record<string, unknown>;
  changes: string[];
  fingerprint: string;
  actor: string;
  preparedAt: string;
  committedAt: string | null;
};
