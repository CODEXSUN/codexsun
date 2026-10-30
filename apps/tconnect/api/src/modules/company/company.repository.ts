import { sql, type Kysely } from "kysely";
import { randomBytes } from "node:crypto";
import type { TconnectDatabase } from "../../context.js";
import type { CompanyInput, CompanyRecord } from "./company.types.js";
export class CompanyRepository {
  constructor(private database: Kysely<TconnectDatabase>) {}
  async list(publicOnly: boolean, companyUuid?: string) {
    return (
      await sql<CompanyRecord>`SELECT uuid, logoDataUrl, name, slug, tagline, description, industry, city, color, initials, role, products, capacity, established, associationUuid, website, status FROM tconnect_companies
      WHERE (${publicOnly ? 1 : 0} = 0 OR status='active') AND (${companyUuid ?? null} IS NULL OR uuid=${companyUuid ?? null}) ORDER BY id DESC LIMIT 500`.execute(
        this.database
      )
    ).rows;
  }
  async save(input: CompanyInput, uuid?: string) {
    const key = uuid ?? randomBytes(4).toString("hex");
    if (uuid) {
      await sql`UPDATE tconnect_companies SET logoDataUrl=${input.logoDataUrl}, name=${input.name}, slug=${input.slug}, tagline=${input.tagline}, description=${input.description}, industry=${input.industry}, city=${input.city}, color=${input.color}, initials=${input.initials}, role=${input.role}, products=${input.products}, capacity=${input.capacity}, established=${input.established}, associationUuid=${input.associationUuid}, website=${input.website}, status=${input.status} WHERE uuid=${uuid}`.execute(
        this.database
      );
    } else {
      await sql`INSERT INTO tconnect_companies (uuid, logoDataUrl, name, slug, tagline, description, industry, city, color, initials, role, products, capacity, established, associationUuid, website, status) VALUES (${key}, ${input.logoDataUrl}, ${input.name}, ${input.slug}, ${input.tagline}, ${input.description}, ${input.industry}, ${input.city}, ${input.color}, ${input.initials}, ${input.role}, ${input.products}, ${input.capacity}, ${input.established}, ${input.associationUuid}, ${input.website}, ${input.status})`.execute(
        this.database
      );
    }
    return { ...input, uuid: key };
  }
}
