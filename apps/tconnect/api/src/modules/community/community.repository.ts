import { sql, type Kysely } from "kysely";
import { randomBytes } from "node:crypto";
import type { TconnectDatabase } from "../../context.js";
import type { CommunityInput, CommunityRecord } from "./community.types.js";
export class CommunityRepository {
  constructor(private database: Kysely<TconnectDatabase>) {}
  async list(publicOnly: boolean) {
    return (
      await sql<CommunityRecord>`SELECT uuid, title, body, category, associationUuid, DATE_FORMAT(eventDate, '%Y-%m-%d') AS eventDate, status FROM tconnect_community
      WHERE (${publicOnly ? 1 : 0} = 0 OR status='active') ORDER BY id DESC LIMIT 500`.execute(
        this.database
      )
    ).rows;
  }
  async save(input: CommunityInput, uuid?: string) {
    const key = uuid ?? randomBytes(4).toString("hex");
    if (uuid) {
      await sql`UPDATE tconnect_community SET title=${input.title}, body=${input.body}, category=${input.category}, associationUuid=${input.associationUuid}, eventDate=${input.eventDate}, status=${input.status} WHERE uuid=${uuid}`.execute(
        this.database
      );
    } else {
      await sql`INSERT INTO tconnect_community (uuid, title, body, category, associationUuid, eventDate, status) VALUES (${key}, ${input.title}, ${input.body}, ${input.category}, ${input.associationUuid}, ${input.eventDate}, ${input.status})`.execute(
        this.database
      );
    }
    return { ...input, uuid: key };
  }
}
