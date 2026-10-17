import { createHash } from "node:crypto";
import { sql, type Kysely } from "kysely";
import { AppError } from "@codexsun/framework/errors";
/** Trusted application contract: callers authorize the work and supply its current participants. */
export async function writeWorkMessage(
  database: Kysely<Record<string, Record<string, unknown>>>,
  input: {
    companyId: number;
    actorEmail: string;
    reference: string;
    title: string;
    body: string;
    members: string[];
    eventUuid: string;
  }
) {
  const members = [...new Set(input.members.map((email) => email.trim().toLowerCase()))].sort();
  if (!members.includes(input.actorEmail.toLowerCase()))
    throw AppError.forbidden("The reporter must participate in the work conversation.");
  const channelUuid = createHash("sha256")
    .update(`codexsun:work:${input.companyId}:${input.reference}:${members.join(",")}`)
    .digest("hex")
    .slice(0, 8);
  await sql`INSERT INTO chat_channels (uuid,company_id,name,kind,status,created_by,updated_by,created_at,updated_at) VALUES (${channelUuid},${input.companyId},${input.title},'group','active',${input.actorEmail},${input.actorEmail},UTC_TIMESTAMP(),UTC_TIMESTAMP()) ON DUPLICATE KEY UPDATE updated_at=UTC_TIMESTAMP()`.execute(
    database
  );
  const channel = await sql<{
    id: number;
  }>`SELECT id FROM chat_channels WHERE uuid=${channelUuid} AND company_id=${input.companyId} FOR UPDATE`.execute(
    database
  );
  const id = channel.rows[0]?.id;
  if (!id) throw AppError.conflict("Work conversation could not be resolved.");
  for (const email of members) {
    const uuid = createHash("sha256")
      .update(`codexsun:work-member:${channelUuid}:${email}`)
      .digest("hex")
      .slice(0, 8);
    await sql`INSERT INTO chat_channel_members (uuid,company_id,channel_id,user_email,role,status,created_by,updated_by,created_at,updated_at) SELECT ${uuid},${input.companyId},${id},u.email,'member','active',${input.actorEmail},${input.actorEmail},UTC_TIMESTAMP(),UTC_TIMESTAMP() FROM app_users u WHERE u.email=${email} AND u.status='active' ON DUPLICATE KEY UPDATE status='active'`.execute(
      database
    );
  }
  await sql`INSERT INTO chat_messages (uuid,company_id,channel_id,sender_email,body,status,created_by,updated_by,created_at,updated_at) VALUES (${input.eventUuid},${input.companyId},${id},${input.actorEmail},${input.body},'active',${input.actorEmail},${input.actorEmail},UTC_TIMESTAMP(),UTC_TIMESTAMP())`.execute(
    database
  );
}
