import { sql, type Kysely } from "kysely";
import type { CrmFrappeSyncDatabase } from "./frappe-sync.migration.js";
import type { CrmFrappeSyncType } from "./frappe-sync.types.js";
export class CrmFrappeSyncRepository { constructor(private readonly db:Kysely<CrmFrappeSyncDatabase>){}
 find(type:CrmFrappeSyncType,id:number){return this.db.selectFrom("crm_frappe_sync_queue").select(["id","uuid","entity_type","local_record_id","status","attempts"]).where("entity_type","=",type).where("local_record_id","=",id).executeTakeFirst();}
}

export function crmDutySyncIdempotencyKey(tenantId: string, eventUuid: string, attempts: number) {
  return `crm-duty-sync:${tenantId}:${eventUuid}:${attempts}`;
}

export async function enqueueCrmFrappeSync(database: Kysely<CrmFrappeSyncDatabase>, entity: CrmFrappeSyncType, id: number, actorEmail: string) {
  await database.insertInto("crm_frappe_sync_queue").values({entity_type:entity,local_record_id:id,actor_email:actorEmail,status:"pending",attempts:0,available_at:sql`UTC_TIMESTAMP()`,remote_name:null,last_error:null}).onDuplicateKeyUpdate({actor_email:actorEmail,status:sql`CASE WHEN status = 'processing' THEN status ELSE 'pending' END`,available_at:sql`CASE WHEN status = 'processing' THEN available_at ELSE UTC_TIMESTAMP() END`,last_error:sql`CASE WHEN status = 'processing' THEN 'Sync requested while processing.' ELSE NULL END`}).execute();
}
