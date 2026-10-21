import { randomUUID } from "node:crypto";
import { sql } from "kysely";
import type { DataMigrationHost } from "./migration.types.js";
import { decryptPassword, encryptPassword } from "./migration.secrets.js";
import type { MigrationSourceInput, MigrationTenant } from "./migration.types.js";
import type { MigrationColumnMapping } from "./migration.types.js";

export class MigrationRepository {
  constructor(private readonly database: DataMigrationHost["database"]) {}

  async listJobs() {
    const result = await sql<{
      uuid: string;
      session_name: string;
      source_id: number;
      source_database: string;
      source_tenant_id: number | null;
      target_tenant_id: number;
      target_database: string;
      status: string;
      created_by: string;
      created_at: Date;
      table_count: number | string;
    }>`SELECT j.uuid, j.session_name, j.source_id, j.source_database, j.source_tenant_id,
      j.target_tenant_id, j.target_database, j.status,
      j.created_by, j.created_at, COUNT(t.id) AS table_count
      FROM data_migration_jobs j LEFT JOIN data_migration_job_tables t ON t.job_id = j.id
      GROUP BY j.id ORDER BY j.id DESC LIMIT 100`.execute(this.database);
    return result.rows.map((row) => ({
      id: row.uuid,
      sessionName: row.session_name,
      sourceId: Number(row.source_id),
      sourceDatabase: row.source_database,
      sourceTenantId: row.source_tenant_id === null ? null : Number(row.source_tenant_id),
      targetTenantId: Number(row.target_tenant_id),
      targetDatabase: row.target_database,
      status: row.status,
      createdBy: row.created_by,
      createdAt: new Date(row.created_at).toISOString(),
      tableCount: Number(row.table_count)
    }));
  }

  async createJob(
    input: {
      sessionName: string;
      sourceId: number;
      sourceDatabase: string;
      sourceTenantId: number | null;
      targetTenantId: number;
      targetDatabase: string;
    },
    actor: string
  ) {
    const uuid = randomUUID();
    await sql`INSERT INTO data_migration_jobs
      (uuid, session_name, source_id, source_database, source_tenant_id, target_tenant_id,
       target_database, created_by, updated_by)
      VALUES (${uuid}, ${input.sessionName}, ${input.sourceId}, ${input.sourceDatabase},
       ${input.sourceTenantId}, ${input.targetTenantId}, ${input.targetDatabase}, ${actor}, ${actor})`.execute(
      this.database
    );
    return { id: uuid };
  }

  async renameJob(uuid: string, sessionName: string, actor: string) {
    const result = await sql`UPDATE data_migration_jobs
      SET session_name = ${sessionName}, updated_by = ${actor}
      WHERE uuid = ${uuid}`.execute(this.database);
    if (Number(result.numAffectedRows) === 0) throw new Error("Migration session was not found.");
    return { id: uuid, sessionName };
  }

  async resolveJob(uuid: string) {
    const result = await sql<{
      id: number;
      uuid: string;
      session_name: string;
      source_id: number;
      source_database: string;
      source_tenant_id: number | null;
      target_tenant_id: number;
      target_database: string;
      status: string;
    }>`SELECT id, uuid, session_name, source_id, source_database, source_tenant_id,
      target_tenant_id, target_database, status
      FROM data_migration_jobs WHERE uuid = ${uuid}`.execute(this.database);
    const row = result.rows[0];
    if (!row) throw new Error("Migration session was not found.");
    return {
      id: Number(row.id),
      uuid: row.uuid,
      sessionName: row.session_name,
      sourceId: Number(row.source_id),
      sourceDatabase: row.source_database,
      sourceTenantId: row.source_tenant_id === null ? null : Number(row.source_tenant_id),
      targetTenantId: Number(row.target_tenant_id),
      targetDatabase: row.target_database,
      status: row.status
    };
  }

  async getJobTables(uuid: string) {
    const job = await this.resolveJob(uuid);
    const result = await sql<{
      id: number;
      table_name: string;
      source_table_name: string;
      target_table_name: string;
      source_rows: number | string;
      target_rows: number | string;
      mapping_status: string;
      migration_status: string;
      column_mappings: MigrationColumnMapping[] | string | null;
    }>`SELECT id, table_name, source_table_name, target_table_name, source_rows, target_rows,
      mapping_status, migration_status, column_mappings FROM data_migration_job_tables
      WHERE job_id = ${job.id} ORDER BY table_name`.execute(this.database);
    return Promise.all(
      result.rows.map(async (row) => {
        const fields = await sql<{
          id: number;
          source_field: string;
          destination_field: string;
          status: string;
          mapped_by: string;
        }>`SELECT id, source_field, destination_field, status, mapped_by FROM data_migration_job_fields
        WHERE job_table_id = ${row.id} AND status = 'mapped' ORDER BY id`.execute(this.database);
        const legacy =
          typeof row.column_mappings === "string"
            ? (JSON.parse(row.column_mappings) as MigrationColumnMapping[])
            : (row.column_mappings ?? []);
        return {
          id: Number(row.id),
          table: row.source_table_name || row.table_name,
          sourceTable: row.source_table_name || row.table_name,
          targetTable: row.target_table_name || row.table_name,
          sourceRows: Number(row.source_rows),
          targetRows: Number(row.target_rows),
          mappingStatus: row.mapping_status,
          migrationStatus: row.migration_status,
          columnMappings: fields.rows.length
            ? fields.rows.map((field) => ({
                id: Number(field.id),
                sourceColumn: field.source_field,
                targetColumn: field.destination_field,
                status: field.status,
                by: field.mapped_by
              }))
            : legacy
        };
      })
    );
  }

  async saveJobTable(
    uuid: string,
    input: {
      sourceTable: string;
      targetTable: string;
      sourceRows: number;
      targetRows: number;
      mappings: MigrationColumnMapping[];
    },
    actor: string
  ) {
    const job = await this.resolveJob(uuid);
    await this.database.transaction().execute(async (transaction) => {
      await sql`INSERT INTO data_migration_job_tables
        (job_id, table_name, source_table_name, target_table_name, source_rows, target_rows,
         mapping_status, migration_status, column_mappings, updated_by)
        VALUES (${job.id}, ${input.sourceTable}, ${input.sourceTable}, ${input.targetTable},
         ${input.sourceRows}, ${input.targetRows}, 'mapped', 'pending', NULL, ${actor})
        ON DUPLICATE KEY UPDATE target_table_name = VALUES(target_table_name),
          source_rows = VALUES(source_rows), target_rows = VALUES(target_rows),
          mapping_status = 'mapped', migration_status = 'pending',
          column_mappings = NULL, updated_by = VALUES(updated_by),
          updated_at = CURRENT_TIMESTAMP`.execute(transaction);
      const child = await sql<{ id: number }>`SELECT id FROM data_migration_job_tables
        WHERE job_id = ${job.id} AND source_table_name = ${input.sourceTable}`.execute(transaction);
      const childId = Number(child.rows[0]?.id);
      await sql`DELETE FROM data_migration_job_fields WHERE job_table_id = ${childId}`.execute(
        transaction
      );
      for (const field of input.mappings) {
        await sql`INSERT INTO data_migration_job_fields
          (job_table_id, source_field, destination_field, status, mapped_by)
          VALUES (${childId}, ${field.sourceColumn}, ${field.targetColumn}, 'mapped', ${actor})`.execute(
          transaction
        );
      }
      await sql`UPDATE data_migration_jobs SET updated_by = ${actor}, status = 'draft'
        WHERE id = ${job.id}`.execute(transaction);
    });
  }

  async markJobStatus(
    uuid: string,
    status: "draft" | "running" | "completed" | "failed",
    actor: string
  ) {
    const job = await this.resolveJob(uuid);
    await sql`UPDATE data_migration_jobs SET status = ${status}, updated_by = ${actor}
      WHERE id = ${job.id}`.execute(this.database);
  }

  async markJobTableStatus(
    uuid: string,
    sourceTable: string,
    status: "pending" | "running" | "completed" | "failed",
    actor: string
  ) {
    const job = await this.resolveJob(uuid);
    await sql`UPDATE data_migration_job_tables SET migration_status = ${status}, updated_by = ${actor}
      WHERE job_id = ${job.id} AND source_table_name = ${sourceTable}`.execute(this.database);
  }

  async getPlan(sourceId: number, targetId: number) {
    const result = await sql<{ table_name: string; column_mappings: MigrationColumnMapping[] }>`
      SELECT table_name, column_mappings FROM data_migration_plans
      WHERE source_id = ${sourceId} AND target_tenant_id = ${targetId}
      ORDER BY table_name`.execute(this.database);
    return result.rows.map((row) => ({
      table: row.table_name,
      columnMappings:
        typeof row.column_mappings === "string"
          ? (JSON.parse(row.column_mappings) as MigrationColumnMapping[])
          : row.column_mappings
    }));
  }

  async savePlan(
    sourceId: number,
    targetId: number,
    table: string,
    mappings: MigrationColumnMapping[],
    actor: string
  ) {
    await sql`INSERT INTO data_migration_plans
      (source_id, target_tenant_id, table_name, column_mappings, updated_by)
      VALUES (${sourceId}, ${targetId}, ${table}, ${JSON.stringify(mappings)}, ${actor})
      ON DUPLICATE KEY UPDATE column_mappings = VALUES(column_mappings), updated_by = VALUES(updated_by), updated_at = CURRENT_TIMESTAMP`.execute(
      this.database
    );
  }

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
        status = 'active', verified_at = CURRENT_TIMESTAMP, updated_by = VALUES(updated_by)`.execute(
      this.database
    );
    const result = await sql<{
      id: number;
    }>`SELECT id FROM data_migration_sources WHERE uuid = ${uuid}`.execute(this.database);
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
