import { createConnection, type Connection, type RowDataPacket } from "mysql2/promise";
import { createHash, createHmac, randomBytes, randomUUID } from "node:crypto";
import { AppError } from "@codexsun/framework/errors";
import type {
  DataMigrationHost,
  MigrationTenant,
  MigrationSourceInput,
  MigrationSourceUpdate,
  MigrationColumnMapping,
  TableColumn,
  TablePreview,
  MigrationQueryPlan,
  MigrationAuditTableDump
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
      const targetReferences = await this.foreignReferences(
        targetConnection,
        target.database,
        targetTable
      );
      for (const column of targetColumns) {
        const reference = targetReferences.get(column.name);
        if (reference) column.reference = reference;
      }
      return {
        sourceColumns: sourceColumns.map((column) => columnOption(column)),
        targetColumns: await Promise.all(
          targetColumns.map(async (column) => {
            const options = column.reference
              ? await this.foreignValues(targetConnection, target.database, column.reference)
              : [];
            return columnOption(column, options);
          })
        )
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

  async sampleTableData(
    sourceId: number,
    targetId: number,
    sourceTable: string,
    targetTable: string,
    sourcePage: number,
    targetPage: number,
    sourceColumn?: string,
    targetColumn?: string
  ) {
    this.validateSelection(sourceTable);
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
        this.columns(sourceConnection, source.database, sourceTable),
        this.columns(targetConnection, target.database, targetTable)
      ]);
      if (!sourceColumns.length) throw new Error("Source table does not exist.");
      if (!targetColumns.length) throw new Error("Destination table does not exist.");
      const selectedSourceColumn = sourceColumn
        ? sourceColumns.find((column) => column.name === sourceColumn)
        : undefined;
      const selectedTargetColumn = targetColumn
        ? targetColumns.find((column) => column.name === targetColumn)
        : undefined;
      if (sourceColumn && !selectedSourceColumn)
        throw new Error("Selected source field does not exist.");
      if (targetColumn && !selectedTargetColumn)
        throw new Error("Selected destination field does not exist.");
      const sourceProjection = selectedSourceColumn ? quote(selectedSourceColumn.name) : "*";
      const targetProjection = selectedTargetColumn ? quote(selectedTargetColumn.name) : "*";
      const pageSize = 100;
      const sourceOffset = (sourcePage - 1) * pageSize;
      const targetOffset = (targetPage - 1) * pageSize;
      const [[sourceCount], [targetCount], [sourceRows], [targetRows]] = await Promise.all([
        sourceConnection.query<RowDataPacket[]>(
          `SELECT COUNT(*) AS count FROM ${quote(sourceTable)}`
        ),
        targetConnection.query<RowDataPacket[]>(
          `SELECT COUNT(*) AS count FROM ${quote(targetTable)}`
        ),
        sourceConnection.query<RowDataPacket[]>(
          `SELECT ${sourceProjection} FROM ${quote(sourceTable)} LIMIT ${pageSize} OFFSET ${sourceOffset}`
        ),
        targetConnection.query<RowDataPacket[]>(
          `SELECT ${targetProjection} FROM ${quote(targetTable)} LIMIT ${pageSize} OFFSET ${targetOffset}`
        )
      ]);
      return {
        sourceTable,
        targetTable,
        sourceColumns: selectedSourceColumn
          ? [selectedSourceColumn.name]
          : sourceColumns.map(({ name }) => name),
        targetColumns: selectedTargetColumn
          ? [selectedTargetColumn.name]
          : targetColumns.map(({ name }) => name),
        sourceRows: sourceRows.map(serializableRow),
        targetRows: targetRows.map(serializableRow),
        source: { totalRows: Number(sourceCount[0]?.count ?? 0), page: sourcePage },
        target: { totalRows: Number(targetCount[0]?.count ?? 0), page: targetPage },
        pageSize,
        ...(selectedSourceColumn && selectedTargetColumn
          ? {
              selectedMapping: {
                sourceColumn: selectedSourceColumn.name,
                targetColumn: selectedTargetColumn.name
              }
            }
          : {})
      };
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

  deleteJob(uuid: string) {
    return this.runs.deleteJob(uuid);
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

  async deleteJobTable(uuid: string, sourceTable: string) {
    if (!identifierPattern.test(sourceTable))
      throw AppError.validation("Invalid source table name.");
    return this.runs.deleteJobTable(uuid, sourceTable);
  }

  async generateJobQueryPlan(uuid: string, actor: string) {
    const plan = await this.buildJobQueryPlan(uuid, actor);
    return this.runs.saveJobQueryPlan(uuid, plan, actor);
  }

  async finalizeJobQueryPlan(uuid: string, actor: string) {
    const saved = await this.runs.getJobQueryPlan(uuid);
    if (!saved || saved.status !== "generated") {
      throw new Error("Generate and review a query plan before finalizing it.");
    }
    const current = await this.buildJobQueryPlan(uuid, actor);
    if (!current.canFinalize) {
      await this.runs.saveJobQueryPlan(uuid, current, actor);
      throw new Error("The migration plan has blockers. Resolve them, then generate it again.");
    }
    if (current.hash !== saved.hash) {
      await this.runs.saveJobQueryPlan(uuid, current, actor);
      throw new Error(
        "Source data or migration settings changed. Review the regenerated plan before finalizing."
      );
    }
    return this.runs.finalizeJobQueryPlan(uuid, current.hash, actor);
  }

  async getJobQueryPlan(uuid: string) {
    return this.runs.getJobQueryPlan(uuid);
  }

  async handoffJobToAuditQueue(uuid: string, selectedRowIds: number[], actor: string) {
    if (!selectedRowIds.length || selectedRowIds.length > 100) {
      throw AppError.validation("Select between 1 and 100 saved rows before handoff.");
    }
    if (new Set(selectedRowIds).size !== selectedRowIds.length) {
      throw AppError.validation("A saved row is selected more than once.");
    }
    const job = await this.runs.resolveJob(uuid);
    await this.assertJobDatabases(job);
    const [batch, tables] = await Promise.all([
      this.runs.getQueryBatch(uuid),
      this.runs.getJobTables(uuid)
    ]);
    if (!batch || batch.sourceDatabase !== job.sourceDatabase) {
      throw AppError.conflict("Save selected source rows before handing off to audit.");
    }
    const selectedRows = selectedRowIds.map((id) => {
      const row = batch.rows.find((item) => item.id === id);
      if (!row) throw AppError.validation("A selected row is no longer in the saved row list.");
      return row;
    });
    const first = selectedRows[0]!;
    if (
      selectedRows.some(
        (row) => row.sourceTable !== first.sourceTable || row.targetTable !== first.targetTable
      )
    ) {
      throw AppError.validation("Hand off saved rows for one table pair at a time.");
    }
    const mapping = tables.find((item) => item.sourceTable === first.sourceTable);
    if (
      !mapping ||
      mapping.targetTable !== first.targetTable ||
      mapping.mappingStatus !== "mapped"
    ) {
      throw AppError.conflict("Save this source to target table mapping before handoff.");
    }
    const sourceFields = mapping.columnMappings.map((field) => field.sourceColumn);
    const targetFields = mapping.columnMappings.map((field) => field.targetColumn);
    const extraFields = Object.entries(selectedRows[0]!.fieldValues)
      .filter(([, configured]) => configured.mode !== "default")
      .map(([name]) => name);
    const insertFields = [
      ...targetFields,
      ...extraFields.filter((field) => !targetFields.includes(field))
    ];
    if (!sourceFields.length || !insertFields.length) {
      throw AppError.conflict("Map at least one source field before handoff.");
    }
    const values = selectedRows.map(() => `(${insertFields.map(() => "?").join(", ")})`).join(", ");
    const tableDump: MigrationAuditTableDump = {
      sourceTable: first.sourceTable,
      targetTable: first.targetTable,
      selectedRowNumbers: selectedRows.map((row) => row.rowNumber),
      samples: selectedRows.map((row) => ({
        rowNumber: row.rowNumber,
        rowData: redactAuditSample(row.rowData)
      })),
      selectSql: `SELECT ${sourceFields.map(quote).join(", ")} FROM ${quote(first.sourceTable)};`,
      insertSqlTemplate: `INSERT INTO ${quote(first.targetTable)} (${insertFields.map(quote).join(", ")}) VALUES ${values};`
    };
    const hash = createHash("sha256")
      .update(
        JSON.stringify({
          jobId: uuid,
          batchId: batch.id,
          selectedRows: selectedRows.map(({ id, rowNumber, rowData }) => ({
            id,
            rowNumber,
            rowData
          })),
          table: tableDump,
          mappings: mapping.columnMappings,
          fieldValues: selectedRows[0]!.fieldValues
        })
      )
      .digest("hex");
    return this.runs.saveAuditQueueItem(
      uuid,
      {
        hash,
        sourceDatabase: job.sourceDatabase,
        targetDatabase: job.targetDatabase,
        tables: [tableDump]
      },
      actor
    );
  }

  listAuditQueue() {
    return this.runs.listAuditQueue();
  }

  getAuditQueueItem(uuid: string) {
    return this.runs.getAuditQueueItem(uuid);
  }

  markAuditQueueReviewed(uuid: string, actor: string) {
    return this.runs.markAuditQueueReviewed(uuid, actor);
  }

  deleteAuditQueueItem(uuid: string) {
    return this.runs.deleteAuditQueueItem(uuid);
  }

  async runReviewedMigration(auditId: string, actor: string) {
    const audit = await this.runs.getAuditQueueItem(auditId);
    if (audit.status !== "reviewed") {
      throw AppError.conflict("Review this migration audit item before running it.");
    }
    const plan = await this.runs.getJobQueryPlan(audit.jobId);
    if (!plan || plan.status !== "finalized") {
      throw AppError.conflict("Finalize the session migration plan before running this migration.");
    }
    return this.migrateJob(audit.jobId, actor);
  }

  async getQueryBatch(uuid: string) {
    const job = await this.runs.resolveJob(uuid);
    await this.runs.resolveSource(job.sourceId, this.host.secretKey);
    return this.runs.getQueryBatch(uuid);
  }

  deleteQueryBatch(uuid: string) {
    return this.runs.deleteQueryBatch(uuid);
  }

  async saveQueryBatch(
    uuid: string,
    input: {
      rows: Array<{
        sourceTable: string;
        targetTable: string;
        rowNumber: number;
        rowData: Record<string, unknown>;
      }>;
      fieldValues: Record<string, { mode: "default" | "custom" | "foreign"; value: unknown }>;
    },
    actor: string
  ) {
    if (!input.rows.length || input.rows.length > 100) {
      throw AppError.validation("Select between 1 and 100 source sample rows before saving.");
    }
    const job = await this.runs.resolveJob(uuid);
    if (job.status === "running") throw AppError.conflict("This migration is currently running.");
    const [source, tables] = await Promise.all([
      this.runs.resolveSource(job.sourceId, this.host.secretKey),
      this.runs.getJobTables(uuid)
    ]);
    const mappings = new Map(tables.map((table) => [table.sourceTable, table]));
    const firstRow = input.rows[0]!;
    if (
      input.rows.some(
        (row) =>
          row.sourceTable !== firstRow.sourceTable || row.targetTable !== firstRow.targetTable
      )
    ) {
      throw AppError.validation(
        "Save selected rows for one source and destination table pair at a time."
      );
    }
    if (new Set(input.rows.map((row) => row.rowNumber)).size !== input.rows.length) {
      throw AppError.validation("A source sample row is selected more than once.");
    }
    const savedTable = mappings.get(firstRow.sourceTable);
    if (!savedTable || savedTable.targetTable !== firstRow.targetTable) {
      throw AppError.conflict(
        `Save the table pair ${firstRow.sourceTable} → ${firstRow.targetTable} before saving selected rows.`
      );
    }
    const [schema, sourceTotal] = await Promise.all([
      this.tableSchema(
        job.sourceId,
        job.targetTenantId,
        firstRow.sourceTable,
        firstRow.targetTable
      ),
      this.withConnection(source, async (connection) =>
        this.count(connection, firstRow.sourceTable)
      )
    ]);
    const sourceColumnNames = new Set(schema.sourceColumns.map((column) => column.name));
    const mappedTargetNames = new Set(
      savedTable.columnMappings.map((mapping) => mapping.targetColumn)
    );
    const targetColumnByName = new Map(schema.targetColumns.map((column) => [column.name, column]));
    for (const [field, configured] of Object.entries(input.fieldValues)) {
      const column = targetColumnByName.get(field);
      if (!column || mappedTargetNames.has(field) || column.generated) {
        throw AppError.validation(`Field ${field} is not an unmapped destination field.`);
      }
      if (configured.mode === "default" && column.required && column.defaultValue === null) {
        throw AppError.validation(`Destination field ${field} has no database default.`);
      }
      if (configured.mode === "foreign") {
        if (!column.reference)
          throw AppError.validation(`Destination field ${field} is not a foreign key.`);
        if (!(column.foreignOptions ?? []).includes(String(configured.value))) {
          throw AppError.validation(
            `Select a valid referenced value for destination field ${field}.`
          );
        }
      }
    }
    for (const row of input.rows) {
      const table = mappings.get(row.sourceTable);
      if (!table || table.targetTable !== row.targetTable || table.mappingStatus !== "mapped") {
        throw AppError.conflict(
          "Save the source and destination table mapping before saving selected rows."
        );
      }
      if (!Number.isSafeInteger(row.rowNumber) || row.rowNumber < 1) {
        throw AppError.validation("A selected sample row has an invalid row number.");
      }
      if (row.rowNumber > sourceTotal)
        throw AppError.conflict("A selected source row no longer exists. Refresh the table data.");
      if (Object.keys(row.rowData).some((column) => !sourceColumnNames.has(column))) {
        throw AppError.validation(
          "Selected source data contains a field outside the source table schema. Refresh the table data."
        );
      }
      if (JSON.stringify(row.rowData).length > 100_000) {
        throw AppError.validation("A selected sample row exceeds the 100 KB preview limit.");
      }
    }
    const totalBytes = input.rows.reduce((sum, row) => sum + JSON.stringify(row.rowData).length, 0);
    if (totalBytes > 1_000_000)
      throw AppError.validation("Selected preview data exceeds the 1 MB save limit.");
    if (JSON.stringify(input.fieldValues).length > 100_000) {
      throw AppError.validation("Destination field values exceed the 100 KB save limit.");
    }
    for (const [field, configured] of Object.entries(input.fieldValues)) {
      if (
        configured.mode !== "default" &&
        (configured.value === null || configured.value === undefined || configured.value === "")
      ) {
        throw AppError.validation(`Set a value for destination field ${field}.`);
      }
      if (
        configured.mode !== "default" &&
        typeof configured.value !== "string" &&
        typeof configured.value !== "number"
      ) {
        throw AppError.validation(`Destination field ${field} must use a text or numeric value.`);
      }
      if (typeof configured.value === "string" && configured.value.length > 2048) {
        throw AppError.validation(`Destination field ${field} exceeds the 2 KB value limit.`);
      }
    }
    return this.runs.saveQueryBatch(
      {
        jobId: job.id,
        sourceId: job.sourceId,
        sourceLabel: source.label,
        sourceHost: source.host,
        sourceDatabase: source.database,
        sourceUser: source.user,
        rows: input.rows,
        fieldValues: input.fieldValues
      },
      actor
    );
  }

  private async buildJobQueryPlan(uuid: string, actor: string): Promise<MigrationQueryPlan> {
    const job = await this.runs.resolveJob(uuid);
    await this.assertJobDatabases(job);
    const [source, target, tables, sourceTables] = await Promise.all([
      this.runs.resolveSource(job.sourceId, this.host.secretKey),
      this.host.resolveTenant(job.targetTenantId),
      this.runs.getJobTables(uuid),
      this.listTables(job.sourceId)
    ]);
    const tableBySource = new Map(tables.map((item) => [item.sourceTable, item]));
    const missing = sourceTables.filter((name) => !tableBySource.has(name));
    if (missing.length) throw new Error(`Map every source table first: ${missing.join(", ")}`);
    const entries = sourceTables.map((name) => tableBySource.get(name)!);
    if (entries.some((item) => item.mappingStatus !== "mapped" || !item.columnMappings.length)) {
      throw new Error("Every source table needs at least one included field mapping.");
    }
    const sourceConnection = await this.connect(source);
    const targetConnection = await this.connect(target).catch(async (error: unknown) => {
      await sourceConnection.end();
      throw error;
    });
    const blockers: string[] = [];
    const planTables: MigrationQueryPlan["tables"] = [];
    const planId = randomUUID();
    try {
      await sourceConnection.query("START TRANSACTION WITH CONSISTENT SNAPSHOT");
      const ordered = await jobDependencyOrder(sourceConnection, source.database, entries);
      for (const item of ordered) {
        const tableBlockers: string[] = [];
        let preview: TablePreview;
        try {
          preview = await this.inspect(
            sourceConnection,
            targetConnection,
            source,
            target,
            item.sourceTable,
            item.columnMappings,
            item.targetTable
          );
        } catch (error) {
          preview = {
            table: item.sourceTable,
            sourceRows: item.sourceRows,
            targetRows: item.targetRows,
            exactMatches: null,
            uniqueKeyConflicts: null,
            compatible: false,
            reason: message(error)
          };
        }
        if (!preview.compatible)
          tableBlockers.push(preview.reason ?? "Compatibility check failed.");
        if (preview.sourceRows !== item.sourceRows) {
          tableBlockers.push(
            `Source row count changed from ${item.sourceRows} to ${preview.sourceRows}; save the table mapping again.`
          );
        }
        if (preview.targetRows !== 0) {
          tableBlockers.push(`Destination contains ${preview.targetRows} rows; it must be empty.`);
        }
        if (preview.sourceRows > copyLimit) {
          tableBlockers.push(`Source exceeds the ${copyLimit} row limit.`);
        }
        const [sourceSchema, targetSchema] = await Promise.all([
          this.columns(sourceConnection, source.database, item.sourceTable),
          this.columns(targetConnection, target.database, item.targetTable)
        ]);
        const sourceSchemaFingerprint = createHash("sha256")
          .update(JSON.stringify(sourceSchema))
          .digest("hex");
        const targetSchemaFingerprint = createHash("sha256")
          .update(JSON.stringify(targetSchema))
          .digest("hex");
        const includedFields = new Set(item.columnMappings.map((mapping) => mapping.sourceColumn));
        const excludedSourceFields = sourceSchema
          .filter((column) => !includedFields.has(column.name))
          .map((column) => column.name);
        let sourceFingerprint = "";
        if (preview.sourceRows <= copyLimit && item.columnMappings.length) {
          try {
            sourceFingerprint = await this.fingerprintSourceRows(
              sourceConnection,
              item.sourceTable,
              item.columnMappings,
              preview.sourceRows
            );
          } catch {
            tableBlockers.push("Source rows changed while generating the plan.");
          }
        }
        const sourceProjection = item.columnMappings
          .map((mapping) => quote(mapping.sourceColumn))
          .join(", ");
        const targetProjection = item.columnMappings
          .map((mapping) => quote(mapping.targetColumn))
          .join(", ");
        const insertValues = item.columnMappings.map(() => "?").join(", ");
        const tablePlan = {
          sourceTable: item.sourceTable,
          targetTable: item.targetTable,
          sourceRows: preview.sourceRows,
          targetRows: preview.targetRows,
          sourceFingerprint,
          sourceSchemaFingerprint,
          targetSchemaFingerprint,
          columnMappings: item.columnMappings.map(({ sourceColumn, targetColumn }) => ({
            sourceColumn,
            targetColumn
          })),
          excludedSourceFields,
          selectSql: `SELECT ${sourceProjection} FROM ${quote(item.sourceTable)};`,
          insertSqlTemplate: `INSERT INTO ${quote(item.targetTable)} (${targetProjection}) VALUES (${insertValues});`,
          blockers: tableBlockers
        };
        planTables.push(tablePlan);
        blockers.push(...tableBlockers.map((blocker) => `${item.sourceTable}: ${blocker}`));
      }
      await sourceConnection.commit();
    } catch (error) {
      await sourceConnection.rollback().catch(() => undefined);
      throw error;
    } finally {
      await Promise.all([sourceConnection.end(), targetConnection.end()]);
    }
    const hashPayload = {
      jobId: uuid,
      sourceDatabase: job.sourceDatabase,
      targetDatabase: job.targetDatabase,
      tables: planTables.map(
        ({
          sourceTable,
          targetTable,
          sourceRows,
          targetRows,
          sourceFingerprint,
          sourceSchemaFingerprint,
          targetSchemaFingerprint,
          columnMappings,
          excludedSourceFields,
          selectSql,
          insertSqlTemplate,
          blockers: tableBlockers
        }) => ({
          sourceTable,
          targetTable,
          sourceRows,
          targetRows,
          sourceFingerprint,
          sourceSchemaFingerprint,
          targetSchemaFingerprint,
          columnMappings,
          excludedSourceFields,
          selectSql,
          insertSqlTemplate,
          blockers: tableBlockers
        })
      ),
      blockers
    };
    const hash = createHash("sha256").update(JSON.stringify(hashPayload)).digest("hex");
    const now = new Date().toISOString();
    return {
      id: planId,
      status: "generated",
      hash,
      generatedBy: actor,
      generatedAt: now,
      finalizedBy: null,
      finalizedAt: null,
      canFinalize: blockers.length === 0,
      sourceDatabase: job.sourceDatabase,
      targetDatabase: job.targetDatabase,
      totalSourceRows: planTables.reduce((total, item) => total + item.sourceRows, 0),
      tables: planTables,
      blockers
    };
  }

  private async fingerprintSourceRows(
    connection: Connection,
    table: string,
    mappings: MigrationColumnMapping[],
    expectedRows: number
  ) {
    const projection = mappings.map((mapping) => quote(mapping.sourceColumn));
    const [rows] = await connection.query<RowDataPacket[]>(
      `SELECT ${projection.join(", ")} FROM ${quote(table)} ORDER BY ${projection.join(", ")}`
    );
    if (rows.length !== expectedRows) throw new Error("Source row count changed.");
    const fingerprint = createHmac("sha256", this.host.secretKey);
    for (const row of rows) {
      const values = mappings.map((mapping) => row[mapping.sourceColumn]);
      fingerprint.update(
        JSON.stringify(values, (_key, value: unknown) => {
          if (Buffer.isBuffer(value)) return value.toString("base64");
          if (value instanceof Date) return value.toISOString();
          if (typeof value === "bigint") return value.toString();
          return value;
        }) ?? "null"
      );
      fingerprint.update("\n");
    }
    return fingerprint.digest("hex");
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
    const finalizedPlan = await this.runs.getJobQueryPlan(uuid);
    if (!finalizedPlan || finalizedPlan.status !== "finalized") {
      throw new Error("Generate and finalize the migration query plan before running it.");
    }
    const currentPlan = await this.buildJobQueryPlan(uuid, actor);
    if (!currentPlan.canFinalize || currentPlan.hash !== finalizedPlan.hash) {
      await this.runs.setJobQueryPlanStatus(uuid, "stale");
      throw new Error(
        "The finalized plan is no longer current. Generate, review, and finalize it again."
      );
    }
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
      throw new Error("Every source table needs at least one included field mapping.");
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
        const finalizedTablePlan = finalizedPlan.tables.find(
          (candidate) => candidate.sourceTable === item.sourceTable
        );
        const currentMappings = item.columnMappings.map(({ sourceColumn, targetColumn }) => ({
          sourceColumn,
          targetColumn
        }));
        if (
          !finalizedTablePlan ||
          JSON.stringify(finalizedTablePlan.columnMappings) !== JSON.stringify(currentMappings)
        ) {
          throw new Error(`${item.sourceTable}: field mappings changed after finalization.`);
        }
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
        if (!finalizedTablePlan)
          throw new Error(`${item.sourceTable}: finalized plan entry is missing.`);
        const [sourceSchema, targetSchema] = await Promise.all([
          this.columns(sourceConnection, source.database, item.sourceTable),
          this.columns(targetConnection, target.database, item.targetTable)
        ]);
        const sourceSchemaFingerprint = createHash("sha256")
          .update(JSON.stringify(sourceSchema))
          .digest("hex");
        const targetSchemaFingerprint = createHash("sha256")
          .update(JSON.stringify(targetSchema))
          .digest("hex");
        if (
          sourceSchemaFingerprint !== finalizedTablePlan.sourceSchemaFingerprint ||
          targetSchemaFingerprint !== finalizedTablePlan.targetSchemaFingerprint
        ) {
          throw new Error(`${item.sourceTable}: schema changed after the plan was finalized.`);
        }
        const sourceFingerprint = await this.fingerprintSourceRows(
          sourceConnection,
          item.sourceTable,
          item.columnMappings,
          preview.sourceRows
        );
        if (sourceFingerprint !== finalizedTablePlan.sourceFingerprint) {
          throw new Error(`${item.sourceTable}: source data changed after the plan was finalized.`);
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
      await this.runs.beginFinalizedJob(uuid, finalizedPlan.hash, actor);
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
      await this.runs.setJobQueryPlanStatus(uuid, "completed");
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
        exactMatches: null,
        uniqueKeyConflicts: null,
        compatible: false,
        reason:
          "Source and destination tables must use InnoDB for consistent reads and atomic rollback."
      };
    }
    let exactMatches: number | null = null;
    let uniqueKeyConflicts: number | null = null;
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
      if (sourceRows <= copyLimit && targetRows <= copyLimit) {
        const matches = await this.compareMappedRows(
          sourceConnection,
          targetConnection,
          target.database,
          table,
          targetTable,
          mappings,
          sourceRows,
          targetRows
        );
        exactMatches = matches.exactMatches;
        uniqueKeyConflicts = matches.uniqueKeyConflicts;
      }
    }
    const compatible = reason === null;
    return {
      table,
      sourceRows,
      targetRows,
      exactMatches,
      uniqueKeyConflicts,
      compatible,
      reason
    };
  }

  private async compareMappedRows(
    sourceConnection: Connection,
    targetConnection: Connection,
    targetDatabase: string,
    sourceTable: string,
    targetTable: string,
    mappings: MigrationColumnMapping[],
    expectedSourceRows: number,
    expectedTargetRows: number
  ) {
    if (!mappings.length) return { exactMatches: null, uniqueKeyConflicts: null };
    const [indexRows] = await targetConnection.query<RowDataPacket[]>(
      `SELECT INDEX_NAME AS name, SEQ_IN_INDEX AS position, COLUMN_NAME AS columnName
       FROM information_schema.STATISTICS
       WHERE TABLE_SCHEMA = ? AND TABLE_NAME = ? AND NON_UNIQUE = 0 AND COLUMN_NAME IS NOT NULL
       ORDER BY INDEX_NAME, SEQ_IN_INDEX`,
      [targetDatabase, targetTable]
    );
    const uniqueIndexes = new Map<string, string[]>();
    for (const row of indexRows) {
      const name = String(row.name);
      const columns = uniqueIndexes.get(name) ?? [];
      columns.push(String(row.columnName));
      uniqueIndexes.set(name, columns);
    }
    const sourceByTarget = new Map(
      mappings.map((mapping) => [mapping.targetColumn, mapping.sourceColumn])
    );
    const comparableIndexes = [...uniqueIndexes.values()].filter((columns) =>
      columns.every((column) => sourceByTarget.has(column))
    );
    const targetUniqueColumns = [...new Set(comparableIndexes.flat())];
    const [sourceResult, targetResult] = await Promise.all([
      sourceConnection.query<RowDataPacket[]>(
        `SELECT ${mappings.map((mapping) => quote(mapping.sourceColumn)).join(", ")} FROM ${quote(sourceTable)}`
      ),
      targetConnection.query<RowDataPacket[]>(
        `SELECT ${[...new Set([...mappings.map((mapping) => mapping.targetColumn), ...targetUniqueColumns])].map(quote).join(", ")} FROM ${quote(targetTable)}`
      )
    ]);
    if (
      sourceResult[0].length !== expectedSourceRows ||
      targetResult[0].length !== expectedTargetRows
    ) {
      return { exactMatches: null, uniqueKeyConflicts: null };
    }
    const targetSignatures = new Set(
      targetResult[0].map((row) => mappedRowSignature(row, mappings, "targetColumn"))
    );
    const targetUniqueValues = comparableIndexes.map(
      (columns) =>
        new Set(
          targetResult[0]
            .map((row) => uniqueValueSignature(row, columns))
            .filter((value): value is string => value !== null)
        )
    );
    let exactMatches = 0;
    let uniqueKeyConflicts = 0;
    for (const row of sourceResult[0]) {
      const exact = targetSignatures.has(mappedRowSignature(row, mappings, "sourceColumn"));
      if (exact) exactMatches += 1;
      const keyCollision = comparableIndexes.some((columns, index) => {
        const sourceKey = JSON.stringify(
          columns.map((column) => stableValue(row[sourceByTarget.get(column)!]))
        );
        return targetUniqueValues[index]?.has(sourceKey) ?? false;
      });
      if (keyCollision && !exact) uniqueKeyConflicts += 1;
    }
    return {
      exactMatches,
      uniqueKeyConflicts: comparableIndexes.length ? uniqueKeyConflicts : null
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

  private async foreignReferences(connection: Connection, database: string, table: string) {
    const [rows] = await connection.query<RowDataPacket[]>(
      `SELECT COLUMN_NAME AS columnName, REFERENCED_TABLE_NAME AS tableName,
        REFERENCED_COLUMN_NAME AS referencedColumn FROM information_schema.KEY_COLUMN_USAGE
        WHERE TABLE_SCHEMA = ? AND TABLE_NAME = ? AND REFERENCED_TABLE_NAME IS NOT NULL`,
      [database, table]
    );
    return new Map(
      rows.map((row) => [
        String(row.columnName),
        { table: String(row.tableName), column: String(row.referencedColumn) }
      ])
    );
  }

  private async foreignValues(
    connection: Connection,
    database: string,
    reference: { table: string; column: string }
  ) {
    const [rows] = await connection.query<RowDataPacket[]>(
      `SELECT DISTINCT ${quote(reference.column)} AS value FROM ${quote(database)}.${quote(reference.table)}
       WHERE ${quote(reference.column)} IS NOT NULL ORDER BY ${quote(reference.column)} LIMIT 100`
    );
    return rows.map((row) => String(row.value));
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

function redactAuditSample(value: unknown): Record<string, unknown> {
  if (!value || typeof value !== "object" || Array.isArray(value)) return {};
  return Object.fromEntries(
    Object.entries(value).map(([key, fieldValue]) => [
      key,
      /password|secret|token|credential|api.?key|private.?key|cookie|authorization/iu.test(key)
        ? "[redacted]"
        : redactAuditValue(fieldValue)
    ])
  );
}

function redactAuditValue(value: unknown): unknown {
  if (Array.isArray(value)) return value.map(redactAuditValue);
  if (!value || typeof value !== "object") return value;
  return Object.fromEntries(
    Object.entries(value).map(([key, nested]) => [
      key,
      /password|secret|token|credential|api.?key|private.?key|cookie|authorization/iu.test(key)
        ? "[redacted]"
        : redactAuditValue(nested)
    ])
  );
}

function quote(identifier: string) {
  if (!identifierPattern.test(identifier)) throw new Error("Invalid table identifier.");
  return `\`${identifier}\``;
}

function serializableRow(row: RowDataPacket): Record<string, unknown> {
  return Object.fromEntries(
    Object.entries(row).map(([key, value]) => [
      key,
      /password|secret|token|credential|api.?key|private.?key|cookie|authorization/iu.test(key)
        ? "[redacted]"
        : Buffer.isBuffer(value)
          ? `[binary ${value.length} bytes]`
          : value instanceof Date
            ? value.toISOString()
            : typeof value === "bigint"
              ? value.toString()
              : value
    ])
  );
}

function mappedRowSignature(
  row: RowDataPacket,
  mappings: MigrationColumnMapping[],
  side: "sourceColumn" | "targetColumn"
) {
  return JSON.stringify(mappings.map((mapping) => stableValue(row[mapping[side]])));
}

function uniqueValueSignature(row: RowDataPacket, columns: string[]) {
  const values = columns.map((column) => row[column]);
  if (values.some((value) => value === null || value === undefined)) return null;
  return JSON.stringify(values.map(stableValue));
}

function stableValue(value: unknown): unknown {
  if (Buffer.isBuffer(value)) return `binary:${value.toString("base64")}`;
  if (value instanceof Date) return `date:${value.toISOString()}`;
  if (typeof value === "bigint") return `bigint:${value.toString()}`;
  if (Array.isArray(value)) return value.map(stableValue);
  if (value && typeof value === "object") {
    return Object.fromEntries(
      Object.entries(value)
        .sort(([left], [right]) => left.localeCompare(right))
        .map(([key, item]) => [key, stableValue(item)])
    );
  }
  return value;
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
  if (mappings.length === 0) throw new Error("Include and map at least one source field.");
  const missingRequired = targetColumns.find(
    (column) => column.required && !seenTarget.has(column.name)
  );
  if (missingRequired) {
    throw new Error(`Destination field ${missingRequired.name} is required and has no default.`);
  }
  return mappings;
}

function columnOption(column: TableColumn, foreignOptions: string[] = []) {
  return {
    name: column.name,
    type: column.type,
    nullable: column.nullable === "YES",
    required: column.required,
    generated: column.extra.toLowerCase().includes("generated"),
    defaultValue: column.defaultValue,
    ...(column.reference ? { reference: column.reference, foreignOptions } : {})
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
