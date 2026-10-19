import { createConnection, type Connection, type RowDataPacket } from "mysql2/promise";
import { createHash } from "node:crypto";
import type {
  DataMigrationHost,
  MigrationTenant,
  MigrationSourceInput,
  MigrationSourceUpdate,
  TableColumn,
  TablePreview
} from "./migration.types.js";
import { MigrationRepository } from "./migration.repository.js";

const identifierPattern = /^[A-Za-z_][A-Za-z0-9_]*$/u;
const copyLimit = 10000;
const systemDatabases = new Set(["information_schema", "mysql", "performance_schema", "sys"]);

export class MigrationService {
  private readonly runs: MigrationRepository;

  constructor(private readonly host: DataMigrationHost) {
    this.runs = new MigrationRepository(host.database);
  }

  listRuns() {
    return this.runs.list();
  }
  listTenants() {
    return this.host.listTenants();
  }

  listSources() {
    return this.runs.listSources();
  }

  async addSource(input: MigrationSourceInput, actor: string) {
    this.ensureNotMaster(input);
    await this.testConnection(input);
    const id = await this.runs.createSource(input, actor, this.host.secretKey);
    return { id };
  }

  async addCurrentSource(actor: string) {
    const { host, port, user, password } = this.host.currentDatabase;
    const input: MigrationSourceInput = {
      label: "CODEXSUN current MariaDB",
      host,
      port,
      database: "",
      user,
      password,
      tlsMode: "disabled"
    };
    await this.testConnection(input);
    const id = await this.runs.upsertCurrentSource(input, actor, this.host.secretKey);
    return { id };
  }

  async updateSource(id: number, input: MigrationSourceUpdate, actor: string) {
    const saved = await this.runs.resolveSource(id, this.host.secretKey);
    const connection = { ...input, password: input.password ?? saved.password };
    this.ensureNotMaster(connection);
    await this.testConnection(connection);
    await this.runs.updateSource(id, connection, actor, this.host.secretKey);
    return { id };
  }

  async verifySource(id: number, actor: string) {
    const source = await this.runs.resolveSource(id, this.host.secretKey);
    const result = await this.withConnection(source, async (connection) => {
      await connection.query("SELECT 1");
      return { verified: true };
    });
    await this.runs.markVerified(id, actor);
    return result;
  }

  deactivateSource(id: number, actor: string) {
    return this.runs.deactivateSource(id, actor);
  }

  removeSource(id: number, actor: string) {
    return this.runs.removeSource(id, actor);
  }

  async listTables(sourceId: number) {
    const source = await this.runs.resolveSource(sourceId, this.host.secretKey);
    this.requireDatabase(source);
    return this.withConnection(source, async (connection) => {
      const [rows] = await connection.query<RowDataPacket[]>(
        `SELECT TABLE_NAME AS name FROM information_schema.TABLES
         WHERE TABLE_SCHEMA = ? AND TABLE_TYPE = 'BASE TABLE' ORDER BY TABLE_NAME`,
        [source.database]
      );
      return rows.map((row) => String(row.name)).filter((name) => identifierPattern.test(name));
    });
  }

  async listDatabases(sourceId: number) {
    const source = await this.runs.resolveSource(sourceId, this.host.secretKey);
    return this.withConnection({ ...source, database: "" }, async (connection) => {
      const [rows] = await connection.query<RowDataPacket[]>("SHOW DATABASES");
      return rows
        .map((row) => String(row.Database ?? ""))
        .filter((name) => name && !systemDatabases.has(name.toLowerCase()))
        .filter((name) => name.toLowerCase() !== this.host.masterDatabase.database.toLowerCase());
    });
  }

  async preview(sourceId: number, targetId: number, table: string): Promise<TablePreview> {
    this.validateSelection(table);
    const [source, target] = await Promise.all([
      this.runs.resolveSource(sourceId, this.host.secretKey),
      this.host.resolveTenant(targetId)
    ]);
    this.requireDatabase(source);
    this.ensureDifferent(source, target);
    const sourceConnection = await this.connect(source);
    const targetConnection = await this.connect(target).catch(async (error: unknown) => {
      await sourceConnection.end();
      throw error;
    });
    try {
      return await this.inspect(sourceConnection, targetConnection, source, target, table);
    } finally {
      await Promise.all([sourceConnection.end(), targetConnection.end()]);
    }
  }

  async copy(sourceId: number, targetId: number, table: string, actor: string) {
    this.validateSelection(table);
    const [source, target] = await Promise.all([
      this.runs.resolveSource(sourceId, this.host.secretKey),
      this.host.resolveTenant(targetId)
    ]);
    this.requireDatabase(source);
    this.ensureDifferent(source, target);
    const sourceConnection = await this.connect(source);
    const targetConnection = await this.connect(target).catch(async (error: unknown) => {
      await sourceConnection.end();
      throw error;
    });
    let runId: string | null = null;
    let committed = false;
    const lockName = `codexsun:migration:${createHash("sha256")
      .update(`${target.host}:${target.port}:${target.database}:${table}`)
      .digest("hex")
      .slice(0, 40)}`;
    let locked = false;
    try {
      const [lockRows] = await targetConnection.query<RowDataPacket[]>(
        "SELECT GET_LOCK(?, 0) AS acquired",
        [lockName]
      );
      if (Number(lockRows[0]?.acquired) !== 1) {
        throw new Error("Another transfer is using this destination table.");
      }
      locked = true;
      await sourceConnection.query("START TRANSACTION WITH CONSISTENT SNAPSHOT");
      const preview = await this.inspect(sourceConnection, targetConnection, source, target, table);
      if (!preview.compatible) throw new Error(preview.reason ?? "Table is not compatible.");
      if (preview.targetRows !== 0) throw new Error("Destination table must be empty.");
      if (preview.sourceRows > copyLimit)
        throw new Error(`Table exceeds the ${copyLimit} row limit.`);
      runId = await this.runs.start(sourceId, targetId, table, preview.sourceRows, actor);
      await targetConnection.beginTransaction();
      try {
        const columns = await this.columns(sourceConnection, source.database, table);
        const quotedTable = quote(table);
        const quotedColumns = columns.map((column) => quote(column.name)).join(", ");
        const [sourceRows] = await sourceConnection.query<RowDataPacket[]>(
          `SELECT ${quotedColumns} FROM ${quotedTable}`
        );
        if (sourceRows.length !== preview.sourceRows) {
          throw new Error("Source row count changed after preview. Retry the transfer.");
        }
        const [targetCount] = await targetConnection.query<RowDataPacket[]>(
          `SELECT COUNT(*) AS count FROM ${quotedTable}`
        );
        if (Number(targetCount[0]?.count) !== 0) throw new Error("Destination is no longer empty.");
        for (let offset = 0; offset < sourceRows.length; offset += 250) {
          const batch = sourceRows.slice(offset, offset + 250);
          const placeholders = batch.map(() => `(${columns.map(() => "?").join(",")})`).join(",");
          await targetConnection.query(
            `INSERT INTO ${quotedTable} (${quotedColumns}) VALUES ${placeholders}`,
            batch.flatMap((row) => columns.map((column) => row[column.name]))
          );
        }
        await targetConnection.commit();
        committed = true;
        await sourceConnection.commit();
        await this.runs.finish(runId, "completed", sourceRows.length, null);
        return { id: runId, copiedRows: sourceRows.length };
      } catch (error) {
        if (!committed) await targetConnection.rollback();
        throw error;
      }
    } catch (error) {
      await sourceConnection.rollback().catch(() => undefined);
      if (runId && !committed) await this.runs.finish(runId, "failed", 0, message(error));
      throw error;
    } finally {
      if (locked) {
        await targetConnection.query("SELECT RELEASE_LOCK(?)", [lockName]).catch(() => undefined);
      }
      await Promise.all([sourceConnection.end(), targetConnection.end()]);
    }
  }

  private async inspect(
    sourceConnection: Connection,
    targetConnection: Connection,
    source: MigrationTenant,
    target: MigrationTenant,
    table: string
  ): Promise<TablePreview> {
    const [sourceColumns, targetColumns] = await Promise.all([
      this.columns(sourceConnection, source.database, table),
      this.columns(targetConnection, target.database, table)
    ]);
    if (!sourceColumns.length) throw new Error("Source table does not exist.");
    const [sourceRows, targetRows] = await Promise.all([
      this.count(sourceConnection, table),
      targetColumns.length ? this.count(targetConnection, table) : Promise.resolve(0)
    ]);
    const generated = sourceColumns.some((column) =>
      column.extra.toLowerCase().includes("generated")
    );
    const compatible =
      !generated && JSON.stringify(sourceColumns) === JSON.stringify(targetColumns);
    return {
      table,
      sourceRows,
      targetRows,
      compatible,
      reason: compatible
        ? null
        : generated
          ? "Generated columns require a dedicated migration."
          : "Destination table columns do not match the source."
    };
  }

  private async columns(connection: Connection, database: string, table: string) {
    const [rows] = await connection.query<RowDataPacket[]>(
      `SELECT COLUMN_NAME AS name, COLUMN_TYPE AS type, IS_NULLABLE AS nullable,
        EXTRA AS extra FROM information_schema.COLUMNS
        WHERE TABLE_SCHEMA = ? AND TABLE_NAME = ? ORDER BY ORDINAL_POSITION`,
      [database, table]
    );
    return rows as TableColumn[];
  }

  private async count(connection: Connection, table: string) {
    const [rows] = await connection.query<RowDataPacket[]>(
      `SELECT COUNT(*) AS count FROM ${quote(table)}`
    );
    return Number(rows[0]?.count ?? 0);
  }

  private async withConnection<T>(
    tenant: MigrationTenant,
    action: (connection: Connection) => Promise<T>
  ) {
    const connection = await this.connect(tenant);
    try {
      return await action(connection);
    } finally {
      await connection.end();
    }
  }

  private connect(tenant: MigrationTenant) {
    return createConnection({
      host: tenant.host,
      port: tenant.port,
      user: tenant.user,
      password: tenant.password,
      ...(tenant.tlsMode === "required" ? { ssl: { rejectUnauthorized: true } } : {}),
      ...(tenant.database ? { database: tenant.database } : {}),
      timezone: "Z"
    });
  }

  private async testConnection(source: MigrationSourceInput) {
    const connection = await this.connect({ ...source, id: 0 });
    try {
      await connection.query("SELECT 1");
    } finally {
      await connection.end();
    }
  }

  private ensureNotMaster(source: Pick<MigrationSourceInput, "host" | "port" | "database">) {
    if (systemDatabases.has(source.database.toLowerCase())) {
      throw new Error("A MariaDB system database cannot be an external source.");
    }
    const master = this.host.masterDatabase;
    if (source.database.toLowerCase() === master.database.toLowerCase()) {
      throw new Error("The Platform master database cannot be an external source.");
    }
  }

  private requireDatabase(source: MigrationTenant) {
    if (!source.database) {
      throw new Error("Select a source database in Migration Settings before starting a transfer.");
    }
    this.ensureNotMaster(source);
  }

  private validateSelection(table: string) {
    quote(table);
  }

  private ensureDifferent(source: MigrationTenant, target: MigrationTenant) {
    if (
      source.host === target.host &&
      source.port === target.port &&
      source.database === target.database
    ) {
      throw new Error("Source and destination resolve to the same database.");
    }
  }
}

function quote(identifier: string) {
  if (!identifierPattern.test(identifier)) throw new Error("Invalid table identifier.");
  return `\`${identifier}\``;
}

function message(error: unknown) {
  return error instanceof Error ? error.message : "Transfer failed.";
}
