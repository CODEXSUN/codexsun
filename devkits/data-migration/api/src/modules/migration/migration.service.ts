import { createConnection, type Connection, type RowDataPacket } from "mysql2/promise";
import { createHash, randomBytes } from "node:crypto";
import { AppError } from "@codexsun/framework/errors";
import type {
  DataMigrationHost,
  MigrationTenant,
  MigrationSourceInput,
  MigrationSourceUpdate,
  MigrationColumnMapping,
  TableColumn,
  TablePreview
} from "./migration.types.js";
import { MigrationRepository } from "./migration.repository.js";
import { analyzeDatabases } from "./migration.analysis.js";

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
    const id = await this.persistSource(() =>
      this.runs.createSource(input, actor, this.host.secretKey)
    );
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
    const id = await this.persistSource(() =>
      this.runs.upsertCurrentSource(input, actor, this.host.secretKey)
    );
    return { id };
  }

  async updateSource(id: number, input: MigrationSourceUpdate, actor: string) {
    const saved = await this.runs.resolveSource(id, this.host.secretKey);
    const connection = { ...input, password: input.password ?? saved.password };
    this.ensureNotMaster(connection);
    await this.testConnection(connection);
    await this.persistSource(() =>
      this.runs.updateSource(id, connection, actor, this.host.secretKey)
    );
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
      return rows
        .map((row) => String(row.name))
        .filter((name) => identifierPattern.test(name) && name !== "migration_schema");
    });
  }

  async listTenantTables(targetId: number) {
    const target = await this.host.resolveTenant(targetId);
    return this.withConnection(target, async (connection) => {
      const [rows] = await connection.query<RowDataPacket[]>(
        `SELECT TABLE_NAME AS name FROM information_schema.TABLES
         WHERE TABLE_SCHEMA = ? AND TABLE_TYPE = 'BASE TABLE' ORDER BY TABLE_NAME`,
        [target.database]
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

  async tableSchema(sourceId: number, targetId: number, table: string, targetTable = table) {
    this.validateSelection(table);
    this.validateSelection(targetTable);
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
      const [sourceColumns, targetColumns] = await Promise.all([
        this.columns(sourceConnection, source.database, table),
        this.columns(targetConnection, target.database, targetTable)
      ]);
      if (!sourceColumns.length) throw new Error("Source table does not exist.");
      return {
        sourceColumns: sourceColumns.map(columnOption),
        targetColumns: targetColumns.map(columnOption)
      };
    } finally {
      await Promise.all([sourceConnection.end(), targetConnection.end()]);
    }
  }

  async preview(
    sourceId: number,
    targetId: number,
    table: string,
    columnMappings?: MigrationColumnMapping[],
    targetTable = table
  ): Promise<TablePreview> {
    this.validateSelection(table);
    this.validateSelection(targetTable);
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
      return await this.inspect(
        sourceConnection,
        targetConnection,
        source,
        target,
        table,
        columnMappings,
        targetTable
      );
    } finally {
      await Promise.all([sourceConnection.end(), targetConnection.end()]);
    }
  }

  async analyze(sourceId: number, targetId: number) {
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
      return await analyzeDatabases(sourceConnection, targetConnection, source, target);
    } finally {
      await Promise.all([sourceConnection.end(), targetConnection.end()]);
    }
  }

  async getPlan(sourceId: number, targetId: number) {
    await this.runs.resolveSource(sourceId, this.host.secretKey);
    await this.host.resolveTenant(targetId);
    return this.runs.getPlan(sourceId, targetId);
  }

  async listJobs() {
    const [jobs, sources, tenants] = await Promise.all([
      this.runs.listJobs(),
      this.runs.listSources(),
      this.host.listTenants()
    ]);
    return jobs.map((job) => ({
      ...job,
      sourceLabel: sources.find((item) => item.id === job.sourceId)?.label ?? "Unavailable source",
      targetLabel:
        tenants.find((item) => item.id === job.targetTenantId)?.label ?? "Unavailable tenant"
    }));
  }

  async createJob(
    input: {
      sessionName: string;
      sourceId: number;
      sourceTenantId: number | null;
      targetTenantId: number;
    },
    actor: string
  ) {
    const source = await this.runs.resolveSource(input.sourceId, this.host.secretKey);
    const target = await this.host.resolveTenant(input.targetTenantId);
    if (input.sourceTenantId !== null) await this.host.resolveTenant(input.sourceTenantId);
    this.requireDatabase(source);
    return this.runs.createJob(
      {
        ...input,
        sourceDatabase: source.database,
        targetDatabase: target.database
      },
      actor
    );
  }

  async renameJob(uuid: string, sessionName: string, actor: string) {
    await this.runs.resolveJob(uuid);
    return this.runs.renameJob(uuid, sessionName, actor);
  }

  async getJobTables(uuid: string) {
    const job = await this.runs.resolveJob(uuid);
    await this.runs.resolveSource(job.sourceId, this.host.secretKey);
    await this.host.resolveTenant(job.targetTenantId);
    return this.runs.getJobTables(uuid);
  }

  async saveJobTable(
    uuid: string,
    input: { sourceTable: string; targetTable: string; mappings: MigrationColumnMapping[] },
    actor: string
  ) {
    const job = await this.runs.resolveJob(uuid);
    await this.assertJobDatabases(job);
    const schema = await this.tableSchema(
      job.sourceId,
      job.targetTenantId,
      input.sourceTable,
      input.targetTable
    );
    resolveMappings(
      schema.sourceColumns.map((column) => ({
        ...column,
        nullable: column.nullable ? "YES" : "NO",
        extra: column.generated ? "generated" : "",
        defaultValue: column.defaultValue
      })),
      schema.targetColumns.map((column) => ({
        ...column,
        nullable: column.nullable ? "YES" : "NO",
        extra: column.generated ? "generated" : "",
        defaultValue: column.defaultValue
      })),
      input.mappings
    );
    const [source, target] = await Promise.all([
      this.runs.resolveSource(job.sourceId, this.host.secretKey),
      this.host.resolveTenant(job.targetTenantId)
    ]);
    const [sourceConnection, targetConnection] = await Promise.all([
      this.connect(source),
      this.connect(target)
    ]);
    let sourceRows = 0;
    let targetRows = 0;
    try {
      [sourceRows, targetRows] = await Promise.all([
        this.count(sourceConnection, input.sourceTable),
        this.count(targetConnection, input.targetTable)
      ]);
    } finally {
      await Promise.all([sourceConnection.end(), targetConnection.end()]);
    }
    await this.runs.saveJobTable(
      uuid,
      {
        ...input,
        sourceRows,
        targetRows
      },
      actor
    );
    return {
      saved: true,
      jobId: uuid,
      sourceTable: input.sourceTable,
      targetTable: input.targetTable
    };
  }

  private async assertJobDatabases(job: Awaited<ReturnType<MigrationRepository["resolveJob"]>>) {
    const [source, target] = await Promise.all([
      this.runs.resolveSource(job.sourceId, this.host.secretKey),
      this.host.resolveTenant(job.targetTenantId)
    ]);
    if (source.database !== job.sourceDatabase) {
      throw new Error(
        "The source database changed after this session was created. Create a new session."
      );
    }
    if (target.database !== job.targetDatabase) {
      throw new Error(
        "The target database changed after this session was created. Create a new session."
      );
    }
  }

  async migrateJob(uuid: string, actor: string) {
    const job = await this.runs.resolveJob(uuid);
    await this.assertJobDatabases(job);
    const [source, target, plan] = await Promise.all([
      this.runs.resolveSource(job.sourceId, this.host.secretKey),
      this.host.resolveTenant(job.targetTenantId),
      this.runs.getJobTables(uuid)
    ]);
    const sourceTables = await this.listTables(job.sourceId);
    const planBySource = new Map(plan.map((item) => [item.sourceTable, item]));
    const missing = sourceTables.filter((name) => !planBySource.has(name));
    if (missing.length) throw new Error(`Map every source table first: ${missing.join(", ")}`);
    const entries = sourceTables.map((name) => planBySource.get(name)!);
    if (entries.some((item) => item.mappingStatus !== "mapped" || !item.columnMappings.length)) {
      throw new Error("Every source table needs a complete saved field mapping.");
    }

    const sourceConnection = await this.connect(source);
    const targetConnection = await this.connect(target).catch(async (error: unknown) => {
      await sourceConnection.end();
      throw error;
    });
    const locks: string[] = [];
    const runIds: Array<{ id: string; sourceTable: string; rows: number }> = [];
    let committed = false;
    try {
      const ordered = await jobDependencyOrder(sourceConnection, source.database, entries);
      for (const item of ordered) {
        const lock = migrationLock(target, item.targetTable);
        const [rows] = await targetConnection.query<RowDataPacket[]>(
          "SELECT GET_LOCK(?, 0) AS acquired",
          [lock]
        );
        if (Number(rows[0]?.acquired) !== 1) {
          throw new Error(`Another transfer is using ${item.targetTable}.`);
        }
        locks.push(lock);
      }
      await sourceConnection.query("START TRANSACTION WITH CONSISTENT SNAPSHOT");
      for (const item of ordered) {
        const preview = await this.inspect(
          sourceConnection,
          targetConnection,
          source,
          target,
          item.sourceTable,
          item.columnMappings,
          item.targetTable
        );
        if (!preview.compatible) {
          throw new Error(`${item.sourceTable}: ${preview.reason ?? "preflight failed"}`);
        }
        if (preview.sourceRows !== item.sourceRows) {
          throw new Error(
            `${item.sourceTable}: source row count changed. Save its mapping again to refresh preflight.`
          );
        }
        if (preview.targetRows !== 0 || item.targetRows !== 0) {
          throw new Error(`${item.targetTable}: destination must be empty.`);
        }
        if (preview.sourceRows > copyLimit) {
          throw new Error(`${item.sourceTable}: table exceeds the ${copyLimit} row limit.`);
        }
        await this.runs.markJobTableStatus(uuid, item.sourceTable, "running", actor);
        runIds.push({
          id: await this.runs.start(
            job.sourceId,
            job.targetTenantId,
            item.sourceTable,
            preview.sourceRows,
            actor
          ),
          sourceTable: item.sourceTable,
          rows: preview.sourceRows
        });
      }
      await this.runs.markJobStatus(uuid, "running", actor);
      await targetConnection.beginTransaction();
      try {
        for (const item of ordered) {
          const projection = item.columnMappings
            .map((field) => quote(field.sourceColumn))
            .join(", ");
          const targetColumns = item.columnMappings
            .map((field) => quote(field.targetColumn))
            .join(", ");
          const [rows] = await sourceConnection.query<RowDataPacket[]>(
            `SELECT ${projection} FROM ${quote(item.sourceTable)}`
          );
          const expected = runIds.find((run) => run.sourceTable === item.sourceTable)?.rows ?? 0;
          if (rows.length !== expected) {
            throw new Error(`${item.sourceTable}: source row count changed during migration.`);
          }
          for (let offset = 0; offset < rows.length; offset += 250) {
            const batch = rows.slice(offset, offset + 250);
            const placeholders = batch
              .map(() => `(${item.columnMappings.map(() => "?").join(",")})`)
              .join(",");
            await targetConnection.query(
              `INSERT INTO ${quote(item.targetTable)} (${targetColumns}) VALUES ${placeholders}`,
              batch.flatMap((row) => item.columnMappings.map((field) => row[field.sourceColumn]))
            );
          }
        }
        await targetConnection.commit();
        committed = true;
      } catch (error) {
        await targetConnection.rollback();
        throw error;
      }
      await sourceConnection.commit();
      for (const run of runIds) {
        await this.runs.finish(run.id, "completed", run.rows, null);
        await this.runs.markJobTableStatus(uuid, run.sourceTable, "completed", actor);
      }
      await this.runs.markJobStatus(uuid, "completed", actor);
      return {
        completed: runIds.map(({ sourceTable, rows }) => ({
          table: sourceTable,
          copiedRows: rows
        })),
        copiedRows: runIds.reduce((total, run) => total + run.rows, 0)
      };
    } catch (error) {
      await sourceConnection.rollback().catch(() => undefined);
      if (!committed) {
        for (const run of runIds) await this.runs.finish(run.id, "failed", 0, message(error));
        for (const item of entries) {
          await this.runs.markJobTableStatus(uuid, item.sourceTable, "failed", actor);
        }
        await this.runs.markJobStatus(uuid, "failed", actor);
      }
      throw error;
    } finally {
      for (const lock of locks) {
        await targetConnection.query("SELECT RELEASE_LOCK(?)", [lock]).catch(() => undefined);
      }
      await Promise.all([sourceConnection.end(), targetConnection.end()]);
    }
  }

  async savePlan(
    sourceId: number,
    targetId: number,
    table: string,
    mappings: MigrationColumnMapping[],
    actor: string
  ) {
    this.validateSelection(table);
    const schema = await this.tableSchema(sourceId, targetId, table);
    resolveMappings(
      schema.sourceColumns.map((column) => ({
        ...column,
        nullable: column.nullable ? "YES" : "NO",
        extra: column.generated ? "generated" : "",
        defaultValue: column.defaultValue
      })),
      schema.targetColumns.map((column) => ({
        ...column,
        nullable: column.nullable ? "YES" : "NO",
        extra: column.generated ? "generated" : "",
        defaultValue: column.defaultValue
      })),
      mappings
    );
    await this.runs.savePlan(sourceId, targetId, table, mappings, actor);
    return { saved: true };
  }

  async migratePlan(sourceId: number, targetId: number, actor: string) {
    const [analysis, plan, source, target] = await Promise.all([
      this.analyze(sourceId, targetId),
      this.runs.getPlan(sourceId, targetId),
      this.runs.resolveSource(sourceId, this.host.secretKey),
      this.host.resolveTenant(targetId)
    ]);
    this.requireDatabase(source);
    this.ensureDifferent(source, target);
    const planByTable = new Map(plan.map((item) => [item.table, item.columnMappings]));
    const sourceTables = await this.listTables(sourceId);
    const pending = analysis.tables.filter(
      (item) => item.sourceRows > 0 && item.status !== "excluded"
    );
    const missingMappings = sourceTables.filter((table) => !planByTable.has(table));
    if (missingMappings.length)
      throw new Error(`Save mappings for all source tables first: ${missingMappings.join(", ")}`);
    const missingTargets = analysis.tables.filter(
      (item) => item.status === "blocked" && !item.targetColumns.length
    );
    if (missingTargets.length)
      throw new Error(
        `Destination tables are missing: ${missingTargets.map((item) => item.table).join(", ")}`
      );
    const ordered = dependencyOrder(pending, analysis.tables);
    const sourceConnection = await this.connect(source);
    const targetConnection = await this.connect(target).catch(async (error: unknown) => {
      await sourceConnection.end();
      throw error;
    });
    const acquiredLocks: string[] = [];
    const runIds: Array<{ id: string; table: string; rows: number }> = [];
    let committed = false;
    try {
      for (const item of ordered) {
        const lock = migrationLock(target, item.table);
        const [rows] = await targetConnection.query<RowDataPacket[]>(
          "SELECT GET_LOCK(?, 0) AS acquired",
          [lock]
        );
        if (Number(rows[0]?.acquired) !== 1)
          throw new Error(`Another transfer is using ${item.table}.`);
        acquiredLocks.push(lock);
      }
      await sourceConnection.query("START TRANSACTION WITH CONSISTENT SNAPSHOT");
      for (const item of ordered) {
        const mapping = planByTable.get(item.table)!;
        const preview = await this.inspect(
          sourceConnection,
          targetConnection,
          source,
          target,
          item.table,
          mapping
        );
        if (!preview.compatible)
          throw new Error(`${item.table}: ${preview.reason ?? "preflight failed"}`);
        if (preview.targetRows !== 0)
          throw new Error(`${item.table}: destination table must be empty.`);
        if (preview.sourceRows > copyLimit)
          throw new Error(`${item.table}: table exceeds the ${copyLimit} row limit.`);
        runIds.push({
          id: await this.runs.start(sourceId, targetId, item.table, preview.sourceRows, actor),
          table: item.table,
          rows: preview.sourceRows
        });
      }
      await targetConnection.beginTransaction();
      try {
        for (const item of ordered) {
          const mapping = planByTable.get(item.table)!;
          const projection = mapping.map((entry) => quote(entry.sourceColumn)).join(", ");
          const targetColumns = mapping.map((entry) => quote(entry.targetColumn)).join(", ");
          const [rows] = await sourceConnection.query<RowDataPacket[]>(
            `SELECT ${projection} FROM ${quote(item.table)}`
          );
          const expected = runIds.find((entry) => entry.table === item.table)?.rows ?? 0;
          if (rows.length !== expected)
            throw new Error(
              `${item.table}: source row count changed. No destination rows were committed.`
            );
          for (let offset = 0; offset < rows.length; offset += 250) {
            const batch = rows.slice(offset, offset + 250);
            const placeholders = batch.map(() => `(${mapping.map(() => "?").join(",")})`).join(",");
            await targetConnection.query(
              `INSERT INTO ${quote(item.table)} (${targetColumns}) VALUES ${placeholders}`,
              batch.flatMap((row) => mapping.map((entry) => row[entry.sourceColumn]))
            );
          }
        }
        await targetConnection.commit();
        committed = true;
      } catch (error) {
        await targetConnection.rollback();
        throw error;
      }
      await sourceConnection.commit();
      for (const run of runIds) await this.runs.finish(run.id, "completed", run.rows, null);
      return {
        completed: runIds.map(({ table, rows }) => ({ table, copiedRows: rows })),
        copiedRows: runIds.reduce((sum, run) => sum + run.rows, 0)
      };
    } catch (error) {
      await sourceConnection.rollback().catch(() => undefined);
      if (!committed) {
        for (const run of runIds) await this.runs.finish(run.id, "failed", 0, message(error));
      }
      throw error;
    } finally {
      for (const lock of acquiredLocks)
        await targetConnection.query("SELECT RELEASE_LOCK(?)", [lock]).catch(() => undefined);
      await Promise.all([sourceConnection.end(), targetConnection.end()]);
    }
  }

  async copy(
    sourceId: number,
    targetId: number,
    table: string,
    actor: string,
    columnMappings?: MigrationColumnMapping[]
  ) {
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
    let attemptedRows = 0;
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
      attemptedRows = await this.count(sourceConnection, table);
      const preview = await this.inspect(
        sourceConnection,
        targetConnection,
        source,
        target,
        table,
        columnMappings
      );
      if (!preview.compatible) throw new Error(preview.reason ?? "Table is not compatible.");
      if (preview.targetRows !== 0) throw new Error("Destination table must be empty.");
      if (preview.sourceRows > copyLimit)
        throw new Error(`Table exceeds the ${copyLimit} row limit.`);
      runId = await this.runs.start(sourceId, targetId, table, preview.sourceRows, actor);
      await targetConnection.beginTransaction();
      try {
        const sourceColumns = await this.columns(sourceConnection, source.database, table);
        const mappings = resolveMappings(
          sourceColumns,
          await this.columns(targetConnection, target.database, table),
          columnMappings
        );
        const quotedTable = quote(table);
        const selectedSourceColumns = mappings
          .map((mapping) => quote(mapping.sourceColumn))
          .join(", ");
        const quotedColumns = mappings.map((mapping) => quote(mapping.targetColumn)).join(", ");
        const [sourceRows] = await sourceConnection.query<RowDataPacket[]>(
          `SELECT ${selectedSourceColumns} FROM ${quotedTable}`
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
          const placeholders = batch.map(() => `(${mappings.map(() => "?").join(",")})`).join(",");
          await targetConnection.query(
            `INSERT INTO ${quotedTable} (${quotedColumns}) VALUES ${placeholders}`,
            batch.flatMap((row) => mappings.map((mapping) => row[mapping.sourceColumn]))
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
      if (!runId) {
        runId = await this.runs
          .start(sourceId, targetId, table, attemptedRows, actor)
          .catch(() => null);
      }
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
    table: string,
    columnMappings?: MigrationColumnMapping[],
    targetTable = table
  ): Promise<TablePreview> {
    const [sourceColumns, targetColumns] = await Promise.all([
      this.columns(sourceConnection, source.database, table),
      this.columns(targetConnection, target.database, targetTable)
    ]);
    if (!sourceColumns.length) throw new Error("Source table does not exist.");
    const [sourceRows, targetRows] = await Promise.all([
      this.count(sourceConnection, table),
      targetColumns.length ? this.count(targetConnection, targetTable) : Promise.resolve(0)
    ]);
    const [sourceEngine, targetEngine] = await Promise.all([
      this.tableEngine(sourceConnection, source.database, table),
      this.tableEngine(targetConnection, target.database, targetTable)
    ]);
    if (sourceEngine?.toLowerCase() !== "innodb" || targetEngine?.toLowerCase() !== "innodb") {
      return {
        table,
        sourceRows,
        targetRows,
        compatible: false,
        reason:
          "Source and destination tables must use InnoDB for consistent reads and atomic rollback."
      };
    }
    let mappings: MigrationColumnMapping[] = [];
    let reason: string | null = null;
    try {
      mappings = resolveMappings(sourceColumns, targetColumns, columnMappings);
    } catch (error) {
      reason = message(error);
    }
    if (!reason && sourceRows <= copyLimit) {
      reason = await this.validateMappedRows(
        sourceConnection,
        targetConnection,
        table,
        mappings,
        targetTable
      );
    }
    const compatible = reason === null;
    return {
      table,
      sourceRows,
      targetRows,
      compatible,
      reason
    };
  }

  private async validateMappedRows(
    sourceConnection: Connection,
    targetConnection: Connection,
    table: string,
    mappings: MigrationColumnMapping[],
    targetTable = table
  ): Promise<string | null> {
    if (!mappings.length) return "Map every source column before previewing.";
    const probeTable = `codexsun_migration_probe_${randomBytes(6).toString("hex")}`;
    const quotedProbe = quote(probeTable);
    try {
      await targetConnection.query(
        `CREATE TEMPORARY TABLE ${quotedProbe} LIKE ${quote(targetTable)}`
      );
      const sourceProjection = mappings.map((mapping) => quote(mapping.sourceColumn)).join(", ");
      const targetColumns = mappings.map((mapping) => quote(mapping.targetColumn)).join(", ");
      const [rows] = await sourceConnection.query<RowDataPacket[]>(
        `SELECT ${sourceProjection} FROM ${quote(table)}`
      );
      for (let offset = 0; offset < rows.length; offset += 250) {
        const batch = rows.slice(offset, offset + 250);
        const placeholders = batch.map(() => `(${mappings.map(() => "?").join(",")})`).join(",");
        await targetConnection.query(
          `INSERT INTO ${quotedProbe} (${targetColumns}) VALUES ${placeholders}`,
          batch.flatMap((row) => mappings.map((mapping) => row[mapping.sourceColumn]))
        );
      }
      return null;
    } catch (error) {
      return `Mapped values do not fit the destination: ${message(error)}`;
    } finally {
      await targetConnection
        .query(`DROP TEMPORARY TABLE IF EXISTS ${quotedProbe}`)
        .catch(() => undefined);
    }
  }

  private async columns(connection: Connection, database: string, table: string) {
    const [rows] = await connection.query<RowDataPacket[]>(
      `SELECT COLUMN_NAME AS name, COLUMN_TYPE AS type, IS_NULLABLE AS nullable,
        COLUMN_DEFAULT AS defaultValue, EXTRA AS extra FROM information_schema.COLUMNS
        WHERE TABLE_SCHEMA = ? AND TABLE_NAME = ? ORDER BY ORDINAL_POSITION`,
      [database, table]
    );
    return rows.map((row) => ({
      name: String(row.name),
      type: String(row.type),
      nullable: String(row.nullable),
      extra: String(row.extra),
      defaultValue: row.defaultValue,
      required:
        row.nullable !== "YES" &&
        row.defaultValue === null &&
        !/auto_increment|generated/iu.test(String(row.extra))
    })) as TableColumn[];
  }

  private async count(connection: Connection, table: string) {
    const [rows] = await connection.query<RowDataPacket[]>(
      `SELECT COUNT(*) AS count FROM ${quote(table)}`
    );
    return Number(rows[0]?.count ?? 0);
  }

  private async tableEngine(connection: Connection, database: string, table: string) {
    const [rows] = await connection.query<RowDataPacket[]>(
      `SELECT ENGINE AS engine FROM information_schema.TABLES
       WHERE TABLE_SCHEMA = ? AND TABLE_NAME = ? AND TABLE_TYPE = 'BASE TABLE'`,
      [database, table]
    );
    return rows[0]?.engine == null ? null : String(rows[0].engine);
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
    }).catch((error: unknown) => {
      throw AppError.validation(connectionFailureMessage(error));
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

  private async persistSource<T>(persist: () => Promise<T>) {
    try {
      return await persist();
    } catch (error) {
      throw AppError.internal(sourceSaveFailureMessage(error));
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
    if (table === "migration_schema") {
      throw new Error("Migration schema history is local metadata and cannot be copied.");
    }
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

function resolveMappings(
  sourceColumns: TableColumn[],
  targetColumns: TableColumn[],
  requested?: MigrationColumnMapping[]
): MigrationColumnMapping[] {
  const mappings =
    requested ??
    sourceColumns
      .filter((source) => targetColumns.some((target) => target.name === source.name))
      .map((source) => ({ sourceColumn: source.name, targetColumn: source.name }));
  const sourceByName = new Map(sourceColumns.map((column) => [column.name, column]));
  const targetByName = new Map(targetColumns.map((column) => [column.name, column]));
  const seenSource = new Set<string>();
  const seenTarget = new Set<string>();
  for (const mapping of mappings) {
    if (!sourceByName.has(mapping.sourceColumn)) {
      throw new Error(`Source field ${mapping.sourceColumn} does not exist.`);
    }
    const target = targetByName.get(mapping.targetColumn);
    if (!target) throw new Error(`Destination field ${mapping.targetColumn} does not exist.`);
    if (target.extra.toLowerCase().includes("generated")) {
      throw new Error(
        `Destination field ${mapping.targetColumn} is generated and cannot be mapped.`
      );
    }
    if (seenSource.has(mapping.sourceColumn)) {
      throw new Error(`Source field ${mapping.sourceColumn} is mapped more than once.`);
    }
    if (seenTarget.has(mapping.targetColumn)) {
      throw new Error(`Destination field ${mapping.targetColumn} is mapped more than once.`);
    }
    seenSource.add(mapping.sourceColumn);
    seenTarget.add(mapping.targetColumn);
  }
  const unmappedSource = sourceColumns.find((column) => !seenSource.has(column.name));
  if (unmappedSource) throw new Error(`Map source field ${unmappedSource.name} before importing.`);
  const missingRequired = targetColumns.find(
    (column) => column.required && !seenTarget.has(column.name)
  );
  if (missingRequired) {
    throw new Error(`Destination field ${missingRequired.name} is required and has no default.`);
  }
  return mappings;
}

function columnOption(column: TableColumn) {
  return {
    name: column.name,
    type: column.type,
    nullable: column.nullable === "YES",
    required: column.required,
    generated: column.extra.toLowerCase().includes("generated"),
    defaultValue: column.defaultValue
  };
}

function message(error: unknown) {
  return error instanceof Error ? error.message : "Transfer failed.";
}

function connectionFailureMessage(error: unknown) {
  const code = error && typeof error === "object" && "code" in error ? String(error.code) : "";
  if (code === "ER_ACCESS_DENIED_ERROR") {
    return "MariaDB rejected this user. Check the username, password, and access grants.";
  }
  if (code === "ENOTFOUND" || code === "EAI_AGAIN") {
    return "The MariaDB host could not be resolved. Check the host name and network DNS.";
  }
  if (code === "ECONNREFUSED") {
    return "The MariaDB server refused the connection. Check the host, port, and server listener.";
  }
  if (code === "ETIMEDOUT" || code === "ESOCKETTIMEDOUT") {
    return "The MariaDB connection timed out. Check the network, firewall, and server availability.";
  }
  if (code.includes("SSL") || code.includes("TLS") || code.startsWith("ERR_TLS")) {
    return "The MariaDB TLS handshake failed. Check the server certificate or change the TLS setting.";
  }
  return "Could not connect to MariaDB. Check the host, port, credentials, and TLS setting.";
}

function sourceSaveFailureMessage(error: unknown) {
  const code = error && typeof error === "object" && "code" in error ? String(error.code) : "";
  if (code === "ER_NO_SUCH_TABLE") {
    return "MariaDB connection succeeded, but the Data Migration tables are missing. Restart the Platform API to apply its database migrations.";
  }
  if (code === "ER_BAD_FIELD_ERROR") {
    return "MariaDB connection succeeded, but the Data Migration schema is outdated. Restart the Platform API to apply its database migrations.";
  }
  if (code === "ER_ACCESS_DENIED_ERROR" || code === "ER_TABLEACCESS_DENIED_ERROR") {
    return "MariaDB connection succeeded, but the Platform database user cannot save migration settings. Check its write access.";
  }
  return "MariaDB connection succeeded, but CODEXSUN could not save the server connection. Check Platform database availability and the Data Migration schema.";
}

function migrationLock(target: MigrationTenant, table: string) {
  return `codexsun:migration:${createHash("sha256")
    .update(`${target.host}:${target.port}:${target.database}:${table}`)
    .digest("hex")
    .slice(0, 40)}`;
}

function dependencyOrder(
  pending: Array<{ table: string }>,
  analysis: Awaited<ReturnType<MigrationService["analyze"]>>["tables"]
) {
  const pendingNames = new Set(pending.map((item) => item.table));
  const dependencies = new Map(
    analysis.map((item) => [item.table, item.dependencies.filter((name) => pendingNames.has(name))])
  );
  const ordered: Array<{ table: string }> = [];
  const visiting = new Set<string>();
  const visited = new Set<string>();
  const visit = (table: string) => {
    if (visited.has(table)) return;
    if (visiting.has(table)) throw new Error(`Foreign key dependency cycle detected at ${table}.`);
    visiting.add(table);
    for (const dependency of dependencies.get(table) ?? []) visit(dependency);
    visiting.delete(table);
    visited.add(table);
    ordered.push({ table });
  };
  for (const item of pending) visit(item.table);
  return ordered;
}

async function jobDependencyOrder<
  T extends {
    sourceTable: string;
    targetTable: string;
    columnMappings: MigrationColumnMapping[];
  }
>(sourceConnection: Connection, sourceDatabase: string, mappings: T[]): Promise<T[]> {
  const [rows] = await sourceConnection.query<RowDataPacket[]>(
    `SELECT TABLE_NAME AS tableName, REFERENCED_TABLE_NAME AS dependency
     FROM information_schema.KEY_COLUMN_USAGE
     WHERE TABLE_SCHEMA = ? AND REFERENCED_TABLE_NAME IS NOT NULL`,
    [sourceDatabase]
  );
  const included = new Set(mappings.map((item) => item.sourceTable));
  const dependencies = new Map<string, string[]>();
  for (const row of rows) {
    const tableName = String(row.tableName);
    const dependency = String(row.dependency);
    if (!included.has(tableName)) continue;
    if (!included.has(dependency)) {
      throw new Error(
        `${tableName} references ${dependency}, which is not included in this migration session.`
      );
    }
    dependencies.set(tableName, [...(dependencies.get(tableName) ?? []), dependency]);
  }
  const byName = new Map(mappings.map((item) => [item.sourceTable, item]));
  const ordered: T[] = [];
  const visiting = new Set<string>();
  const visited = new Set<string>();
  const visit = (name: string) => {
    if (visited.has(name)) return;
    if (visiting.has(name)) throw new Error(`Foreign key dependency cycle detected at ${name}.`);
    visiting.add(name);
    for (const dependency of dependencies.get(name) ?? []) visit(dependency);
    visiting.delete(name);
    visited.add(name);
    const item = byName.get(name);
    if (item) ordered.push(item);
  };
  for (const item of mappings) visit(item.sourceTable);
  return ordered;
}
