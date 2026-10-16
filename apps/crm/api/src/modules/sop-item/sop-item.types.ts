import type { ColumnType, Generated, Kysely, Selectable } from "kysely";
import type { SopDatabase } from "../sop/index.js";
import type { CrmFrappeSyncDatabase } from "../frappe-sync/index.js";

export const sopFrequencies = ["daily", "weekly", "monthly", "quarterly", "annually", "once"] as const;
export type SopFrequency = (typeof sopFrequencies)[number];
export type SopItemInput = {
  sopId: number; code: string; title: string; department: string;
  frequency: SopFrequency; sortOrder: number;
};
export type SopRevisionInput = { instructions: string; evidenceGuidance: string };
export type SopItemRecord = SopItemInput & {
  id: number; uuid: string; status: "active" | "inactive"; currentRevision: SopItemRevision | null;
  createdBy: string; updatedBy: string; createdAt: string; updatedAt: string;
};
export type SopItemRevision = {
  id: number; uuid: string; sopItemId: number; revision: number; instructions: string;
  evidenceGuidance: string; status: "draft" | "published" | "superseded";
  effectiveFrom: string | null; author: string; publishedAt: string | null; createdAt: string;
};
export type SopItemRow = {
  id: Generated<number>; uuid: Generated<string>; sop_id: number; code: string; title: string;
  department: string; frequency: SopFrequency; sort_order: number; status: "active" | "inactive";
  created_by: string; updated_by: string; created_at: ColumnType<string, string | undefined, never>;
  updated_at: ColumnType<string, string | undefined, string>;
};
export type SopItemRevisionRow = {
  id: Generated<number>; uuid: Generated<string>; sop_item_id: number; revision: number;
  instructions: string; evidence_guidance: string; status: "draft" | "published" | "superseded";
  effective_from: string | null; author: string; published_at: string | null;
  created_at: ColumnType<string, string | undefined, never>;
};
export type SopItemDatabase = SopDatabase & CrmFrappeSyncDatabase & {
  crm_sop_items: SopItemRow;
  crm_sop_item_revisions: SopItemRevisionRow;
};
export type SelectedSopItemRow = Selectable<SopItemRow>;
export type SelectedSopItemRevisionRow = Selectable<SopItemRevisionRow>;
export type SopItemRequestContext = {
  database: Kysely<SopItemDatabase>; actorEmail: string;
  authorize: (permission: string) => Promise<void>;
  queueSync?: (entity: "sop-item" | "duty-assignment" | "duty-report", id: number) => Promise<void>;
};
