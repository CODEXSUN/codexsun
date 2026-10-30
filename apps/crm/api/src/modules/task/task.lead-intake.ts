import { randomBytes } from "node:crypto";
import { sql, type Kysely } from "kysely";
import { AppError } from "@codexsun/framework/errors";
import { listActiveStatusesForDatabase } from "../status/index.js";
import { listActivePrioritiesForDatabase } from "../priority/index.js";
import type { TaskDatabase } from "./task.types.js";

export async function createLeadFollowUp(
  database: Kysely<TaskDatabase>,
  actor: string,
  leadUuid: string,
  name: string
) {
  const status = (await listActiveStatusesForDatabase(database as never)).find(
    (row) => row.code === "new"
  );
  const priority = (await listActivePrioritiesForDatabase(database as never)).find(
    (row) => row.code === "normal"
  );
  const user = await database
    .selectFrom("app_users")
    .select("id")
    .where("email", "=", actor)
    .where("status", "=", "active")
    .executeTakeFirst();
  if (!status || !priority || !user)
    throw AppError.validation("CRM intake requires an active owner and New/Normal task defaults.");
  const result =
    await sql`INSERT INTO crm_tasks(uuid,title,description,contact_id,list_in_id,priority_id,status_id,assigned_user_id,due_date,created_by)
    VALUES(${randomBytes(4).toString("hex")},${"Review lead: " + name},${"Marketing intake CRM Lead " + leadUuid},NULL,NULL,${priority.id},${status.id},${user.id},DATE_ADD(UTC_TIMESTAMP(),INTERVAL 1 DAY),${actor})`.execute(
      database
    );
  const id = Number(result.insertId);
  await sql`INSERT INTO crm_task_activity(uuid,task_id,event_type,description,actor,created_by)
    VALUES(${randomBytes(4).toString("hex")},${id},'created',${"Lead follow-up " + leadUuid},${actor},${actor})`.execute(
    database
  );
  return id;
}
