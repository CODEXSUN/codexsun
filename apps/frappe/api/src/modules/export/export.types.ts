import type { Kysely } from "kysely";
import type { FrappeDatabase } from "../connection/index.js";

export type ExportKind = "contacts" | "enquiries" | "activities" | "call-logs";
export type ExportMode = "verify" | "export";
export type ExportOutcome = "linked" | "matched" | "new" | "blocked" | "exported";

export type ExportContext = {
  database: Kysely<FrappeDatabase>;
  secret: string;
};

export type ExportRow = {
  id: number;
  label: string;
  detail: string | null;
  remoteName: string | null;
  dependency: string | null;
};

export type ExportPage = {
  items: ExportRow[];
  page: number;
  pageSize: number;
  total: number;
};

export type ExportProgress = {
  scanned: number;
  exported: number;
  failed: number;
  failures: Array<{ id: number; message: string }>;
  results: Array<{
    id: number;
    outcome: ExportOutcome;
    remoteName: string | null;
    message: string | null;
  }>;
};
