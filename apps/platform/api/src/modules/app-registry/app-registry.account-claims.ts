import { createHash, randomBytes } from "node:crypto";
import { sql, type Kysely } from "kysely";
import { AppError } from "@codexsun/framework/errors";
import type { PlatformDatabase } from "../../database/schema.js";
import { getPlatformDatabase } from "../../database/platform-database.js";

export async function migrateProviderAccountClaims(database: Kysely<PlatformDatabase>) {
  await sql
    .raw(
      `CREATE TABLE IF NOT EXISTS provider_account_claims (
    id INT NOT NULL AUTO_INCREMENT PRIMARY KEY,uuid CHAR(8) NOT NULL UNIQUE,account_hash CHAR(64) NOT NULL UNIQUE,
    provider VARCHAR(40) NOT NULL,tenant_uuid CHAR(8) NOT NULL,connection_uuid CHAR(8) NOT NULL,
    created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
  ) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci`
    )
    .execute(database);
}

export class ProviderAccountClaims {
  constructor(private readonly database: Kysely<PlatformDatabase>) {}
  async claim(provider: string, account: string, tenant: string, connection: string) {
    const hash = createHash("sha256")
      .update(provider + ":" + account)
      .digest("hex");
    await sql`INSERT INTO provider_account_claims(uuid,account_hash,provider,tenant_uuid,connection_uuid) VALUES(${randomBytes(4).toString("hex")},${hash},${provider},${tenant},${connection}) ON DUPLICATE KEY UPDATE account_hash=account_hash`.execute(
      this.database
    );
    const row = (
      await sql<{
        tenant_uuid: string;
        connection_uuid: string;
      }>`SELECT tenant_uuid,connection_uuid FROM provider_account_claims WHERE account_hash=${hash}`.execute(
        this.database
      )
    ).rows[0];
    if (!row || row.tenant_uuid !== tenant || row.connection_uuid !== connection)
      throw AppError.conflict("This provider account cannot be attached to this connection.");
  }
  async release(provider: string, account: string, tenant: string, connection: string) {
    const hash = createHash("sha256")
      .update(provider + ":" + account)
      .digest("hex");
    await sql`DELETE FROM provider_account_claims WHERE account_hash=${hash} AND tenant_uuid=${tenant} AND connection_uuid=${connection}`.execute(
      this.database
    );
  }
}
export const claimProviderAccount = (
  provider: string,
  account: string,
  tenant: string,
  connection: string
) => new ProviderAccountClaims(getPlatformDatabase()).claim(provider, account, tenant, connection);
export const releaseProviderAccount = (
  provider: string,
  account: string,
  tenant: string,
  connection: string
) =>
  new ProviderAccountClaims(getPlatformDatabase()).release(provider, account, tenant, connection);
