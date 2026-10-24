export type PreparedCollection = Awaited<
  ReturnType<import("./common-table-import.references.js").CommonTableReferences["prepare"]>
>;
export type ConflictResolution = {
  id: string;
  table: import("./common-table-import.types.js").CommonTableName;
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
