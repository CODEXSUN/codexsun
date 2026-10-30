import { sql, type Kysely } from "kysely";
import type { CoreDatabase } from "../../../database/core-database.js";

export const companyFaviconMigration = {
  checksum: "core.organisation.company-favicon-v2:add-nullable-favicon-path-varchar255",
  description: "Add the company favicon path to existing tenant company tables.",
  name: "core.organisation.company-favicon-v2",
  up: async (database: Kysely<CoreDatabase>) => {
    await sql`ALTER TABLE core_companies ADD COLUMN IF NOT EXISTS favicon_path VARCHAR(255) NULL AFTER logo_dark_path`.execute(
      database
    );
  },
  version: 2
} as const;
