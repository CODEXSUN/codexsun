import { randomUUID } from "node:crypto";
import { sql } from "kysely";
import type { DataMigrationHost } from "./migration.types.js";
import { decryptPassword, encryptPassword } from "./migration.secrets.js";
import type { MigrationSourceInput, MigrationTenant } from "./migration.types.js";

export class MigrationRepository {
  constructor(private readonly database: DataMigrationHost["database"]) {}

  async list() {
    const result = await sql<{
      uuid: string;
      source_id: number;
      target_tenant_id: number;
      table_name: string;
      source_rows: number;
      copied_rows: number;
      status: string;
      error_text: string | null;
      created_by: string;
      created_at: Date;
    }>`SELECT uuid, source_id, target_tenant_id, table_name, source_rows,
      copied_rows, status, error_text, created_by, created_at
      FROM data_migration_runs ORDER BY id DESC LIMIT 100`.execute(this.database);
    return result.rows.map((row) => ({
      id: row.uuid,
      sourceId: row.source_id,
      targetTenantId: row.target_tenant_id,
      table: row.table_name,
      sourceRows: Number(row.source_rows),
      copiedRows: Number(row.copied_rows),
      status: row.status,
      error: row.error_text,
      actor: row.created_by,
      createdAt: new Date(row.created_at).toISOString()
    }));
  }

  async start(sourceId: number, targetId: number, table: string, rows: number, actor: string) {
    const id = randomUUID();
    await sql`INSERT INTO data_migration_runs
      (uuid, source_id, target_tenant_id, table_name, source_rows, created_by)
      VALUES (${id}, ${sourceId}, ${targetId}, ${table}, ${rows}, ${actor})`.execute(this.database);
    return id;
  }

  async finish(id: string, status: "completed" | "failed", rows: number, error: string | null) {
    await sql`UPDATE data_migration_runs SET status = ${status}, copied_rows = ${rows},
      error_text = ${error} WHERE uuid = ${id}`.execute(this.database);
  }

  async listSources() {
    const result = await sql<{
      id: number;
      label: string;
      host: string;
      port: number;
      database_name: string;
      user_name: string;
      tls_mode: "required" | "disabled";
      status: string;
      verified_at: Date | null;
    }>`SELECT id, label, host, port, database_name, user_name, tls_mode, status, verified_at
      FROM data_migration_sources WHERE status = 'active' ORDER BY label`.execute(this.database);
    return result.rows.map((row) => ({
      id: row.id,
      label: row.label,
      host: row.host,
      port: row.port,
      database: row.database_name,
      user: row.user_name,
      tlsMode: row.tls_mode,
      verifiedAt: row.verified_at ? new Date(row.verified_at).toISOString() : null
    }));
  }

  async createSource(input: MigrationSourceInput, actor: string, secretKey: string) {
    const encrypted = encryptPassword(input.password, secretKey);
    const result = await sql`INSERT INTO data_migration_sources
      (uuid, label, host, port, database_name, user_name, password_ciphertext, tls_mode, created_by, updated_by, verified_at)
      VALUES (${randomUUID()}, ${input.label}, ${input.host}, ${input.port}, ${input.database},
        ${input.user}, ${encrypted}, ${input.tlsMode}, ${actor}, ${actor}, CURRENT_TIMESTAMP)`.execute(
      this.database
    );
    return Number(result.insertId);
  }

  async upsertCurrentSource(input: MigrationSourceInput, actor: string, secretKey: string) {
    const uuid = "f1dcb1e3-38ee-5c9a-8b10-e93d4561511e";
    const encrypted = encryptPassword(input.password, secretKey);
    await sql`INSERT INTO data_migration_sources
      (uuid, label, host, port, database_name, user_name, password_ciphertext, tls_mode, status, created_by, updated_by, verified_at)
      VALUES (${uuid}, ${input.label}, ${input.host}, ${input.port}, ${input.database},
        ${input.user}, ${encrypted}, ${input.tlsMode}, 'active', ${actor}, ${actor}, CURRENT_TIMESTAMP)
      ON DUPLICATE KEY UPDATE label = VALUES(label), host = VALUES(host), port = VALUES(port),
        database_name = VALUES(database_name), user_name = VALUES(user_name),
        password_ciphertext = VALUES(password_ciphertext), tls_mode = VALUES(tls_mode),
        status = 'active', verified_at = CURRENT_TIMESTAMP, updated_by = VALUES(updated_by)`
      .execute(this.database);
    const result = await sql<{ id: number }>`SELECT id FROM data_migration_sources WHERE uuid = ${uuid}`
      .execute(this.database);
    const id = result.rows[0]?.id;
    if (!id) throw new Error("Current CODEXSUN MariaDB source could not be saved.");
    return id;
  }

  async updateSource(id: number, input: MigrationSourceInput, actor: string, secretKey: string) {
    const encrypted = encryptPassword(input.password, secretKey);
    const result = await sql`UPDATE data_migration_sources SET label = ${input.label},
      host = ${input.host}, port = ${input.port}, database_name = ${input.database},
      user_name = ${input.user}, password_ciphertext = ${encrypted}, tls_mode = ${input.tlsMode},
      verified_at = CURRENT_TIMESTAMP, updated_by = ${actor}
      WHERE id = ${id} AND status = 'active'`.execute(this.database);
    if (!Number(result.numAffectedRows)) {
      throw new Error("External source connection was not found.");
    }
  }

  async resolveSource(id: number, secretKey: string): Promise<MigrationTenant> {
    const result = await sql<{
      id: number;
      label: string;
      host: string;
      port: number;
      database_name: string;
      user_name: string;
      password_ciphertext: string;
      tls_mode: "required" | "disabled";
    }>`SELECT id, label, host, port, database_name, user_name, password_ciphertext, tls_mode
      FROM data_migration_sources WHERE id = ${id} AND status = 'active'`.execute(this.database);
    const row = result.rows[0];
    if (!row) throw new Error("External source connection was not found.");
    return {
      id: row.id,
      label: row.label,
      host: row.host,
      port: row.port,
      database: row.database_name,
      user: row.user_name,
      password: decryptPassword(row.password_ciphertext, secretKey),
      tlsMode: row.tls_mode
    };
  }

  async markVerified(id: number, actor: string) {
    await sql`UPDATE data_migration_sources SET verified_at = CURRENT_TIMESTAMP,
      updated_by = ${actor} WHERE id = ${id} AND status = 'active'`.execute(this.database);
  }

  async deactivateSource(id: number, actor: string) {
    const result = await sql`UPDATE data_migration_sources SET status = 'inactive',
      updated_by = ${actor} WHERE id = ${id} AND status = 'active'`.execute(this.database);
    if (!Number(result.numAffectedRows))
      throw new Error("External source connection was not found.");
  }

  async removeSource(id: number, actor: string) {
    const result = await sql`UPDATE data_migration_sources SET status = 'inactive',
      password_ciphertext = '', updated_by = ${actor}
      WHERE id = ${id} AND status = 'active'`.execute(this.database);
    if (!Number(result.numAffectedRows))
      throw new Error("External source connection was not found.");
  }
}
