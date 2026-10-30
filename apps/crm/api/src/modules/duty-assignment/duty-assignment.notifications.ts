import { randomBytes } from "node:crypto";
import type { Kysely } from "kysely";
import type { DutyAssignmentDatabase } from "./duty-assignment.types.js";
export async function deliverDutyUpdate(
  database: Kysely<DutyAssignmentDatabase>,
  assignmentId: number,
  actorEmail: string,
  body: string,
  send: (message: {
    title: string;
    body: string;
    members: string[];
    reference: string;
    eventUuid: string;
  }) => Promise<void>
) {
  const assignment = await database
    .selectFrom("crm_duty_assignments as assignment")
    .innerJoin("crm_sop_items as item", "item.id", "assignment.sop_item_id")
    .innerJoin("app_users as user", "user.id", "assignment.assignee_user_id")
    .select(["assignment.assigned_by", "item.title", "user.email"])
    .where("assignment.id", "=", assignmentId)
    .executeTakeFirstOrThrow();
  const members = await database
    .selectFrom("app_users")
    .select("email")
    .where("status", "=", "active")
    .where("email", "in", [assignment.assigned_by, assignment.email, actorEmail])
    .execute();
  await send({
    title: `Duty: ${assignment.title}`.slice(0, 120),
    body: `Duty #${assignmentId} · ${assignment.title}\n${body}`,
    reference: `duty:${assignmentId}`,
    members: members.map((row) => row.email),
    eventUuid: randomBytes(4).toString("hex")
  });
}
