import { sql, type Kysely } from "kysely";
import { randomBytes } from "node:crypto";
import type { TconnectDatabase } from "../../context.js";
import type { AssociationInput, AssociationRecord } from "./association.types.js";
export class AssociationRepository {
  constructor(private database: Kysely<TconnectDatabase>) {}
  async list(publicOnly: boolean) {
    return (
      await sql<AssociationRecord>`SELECT uuid, name, slug, tagline, description, industry, city, color, initials, status FROM tconnect_associations
      WHERE (${publicOnly ? 1 : 0} = 0 OR status='active') ORDER BY id DESC LIMIT 500`.execute(
        this.database
      )
    ).rows;
  }
  async save(input: AssociationInput, uuid?: string) {
    const key = uuid ?? randomBytes(4).toString("hex");
    if (uuid) {
      await sql`UPDATE tconnect_associations SET name=${input.name}, slug=${input.slug}, tagline=${input.tagline}, description=${input.description}, industry=${input.industry}, city=${input.city}, color=${input.color}, initials=${input.initials}, status=${input.status} WHERE uuid=${uuid}`.execute(
        this.database
      );
    } else {
      await sql`INSERT INTO tconnect_associations (uuid, name, slug, tagline, description, industry, city, color, initials, status) VALUES (${key}, ${input.name}, ${input.slug}, ${input.tagline}, ${input.description}, ${input.industry}, ${input.city}, ${input.color}, ${input.initials}, ${input.status})`.execute(
        this.database
      );
    }
    return { ...input, uuid: key };
  }
}
