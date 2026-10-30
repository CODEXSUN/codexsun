import { sql, type Kysely } from "kysely";
import { randomBytes } from "node:crypto";
import type { TconnectDatabase } from "../../context.js";
import { CompanyRepository } from "./company.repository.js";
export async function createRegisteredCompany(
  database: Kysely<TconnectDatabase>,
  input: { name: string; industry: string; city: string }
) {
  const slug =
    input.name
      .toLowerCase()
      .normalize("NFKD")
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-|-$/g, "")
      .slice(0, 140) || "company";
  const company = await new CompanyRepository(database).save({
    name: input.name,
    slug: `${slug}-${randomBytes(4).toString("hex")}`,
    industry: input.industry,
    city: input.city,
    tagline: "",
    description:
      "Welcome to our company profile. We are preparing information about our products and services.",
    color: "#285d4c",
    initials: input.name
      .split(/\s+/)
      .map((word) => word[0])
      .slice(0, 3)
      .join("")
      .toUpperCase(),
    role: "supplier",
    products: "Products and services coming soon",
    capacity: "",
    established: new Date().getUTCFullYear(),
    associationUuid: null,
    website: "",
    logoDataUrl: "",
    status: "inactive"
  });
  return company.uuid;
}
export async function setApprovedCompanyAssociation(
  database: Kysely<TconnectDatabase>,
  companyUuid: string,
  associationUuid: string | null
) {
  await sql`UPDATE tconnect_companies SET associationUuid=${associationUuid} WHERE uuid=${companyUuid}`.execute(
    database
  );
}
export async function migrateCompanyBranding(database: Kysely<TconnectDatabase>) {
  await sql
    .raw(
      "ALTER TABLE tconnect_companies ADD COLUMN IF NOT EXISTS logoDataUrl MEDIUMTEXT NOT NULL DEFAULT ''"
    )
    .execute(database);
}
