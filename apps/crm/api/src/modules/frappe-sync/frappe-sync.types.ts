import type { ColumnType, Generated } from "kysely";
export type CrmFrappeSyncType = "sop-item" | "duty-assignment" | "duty-report";
export type CrmFrappeSyncRow = { id: Generated<number>; uuid: Generated<string>; entity_type: CrmFrappeSyncType; local_record_id: number; actor_email: string; status: "pending" | "processing" | "synced" | "failed"; attempts: number; available_at: ColumnType<string,string|undefined,string>; remote_name: string|null; last_error: string|null; created_at: ColumnType<string,string|undefined,never>; updated_at: ColumnType<string,string|undefined,string> };
