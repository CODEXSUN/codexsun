import assert from "node:assert/strict";
import { randomBytes } from "node:crypto";
import { test } from "node:test";
import Fastify from "fastify";
import { AppError } from "@codexsun/framework/errors";
import { Kysely, MysqlDialect } from "kysely";
import { createPool } from "mysql2";
import { createConnection, type Connection, type RowDataPacket } from "mysql2/promise";
import { registerDataMigrationApi } from "../../devkits/data-migration/api/src/app.js";
import { migrateDataMigrationDatabase } from "../../devkits/data-migration/api/src/modules/migration/migration.migration.js";
import { MigrationService } from "../../devkits/data-migration/api/src/modules/migration/migration.service.js";
import type { DataMigrationHost } from "../../devkits/data-migration/api/src/modules/migration/migration.types.js";

test("copies an empty compatible table and rolls back a failed transfer", async () => {
  const suffix = randomBytes(5).toString("hex");
  const names = [
    `codexsun_mig_source_${suffix}`,
    `codexsun_mig_target_${suffix}`,
    `codexsun_mig_master_${suffix}`,
    `codexsun_mig_job_target_${suffix}`
  ];
  const config = {
    host: required("DB_HOST"),
    port: Number(required("DB_PORT")),
    user: required("DB_USER"),
    password: required("DB_PASSWORD")
  };
  const admin = await createConnection(config);
  let database: Kysely<unknown> | null = null;
  try {
    for (const name of names) await admin.query(`CREATE DATABASE \`${name}\``);
    database = new Kysely<unknown>({
      dialect: new MysqlDialect({ pool: createPool({ ...config, database: names[2] }) })
    });
    await sqlAdmin(
      admin,
      names[2]!,
      "CREATE TABLE tenants (id INT NOT NULL PRIMARY KEY) ENGINE=InnoDB"
    );
    await sqlAdmin(admin, names[2]!, "INSERT INTO tenants (id) VALUES (2), (3)");
    await migrateDataMigrationDatabase(database);
    await migrateDataMigrationDatabase(database);
    const source = await createConnection({ ...config, database: names[0] });
    const target = await createConnection({ ...config, database: names[1] });
    const jobTarget = await createConnection({ ...config, database: names[3] });
    try {
      await source.query("CREATE TABLE sample (id INT PRIMARY KEY, label VARCHAR(32) NOT NULL)");
      await target.query("CREATE TABLE sample (id INT PRIMARY KEY, label VARCHAR(32) NOT NULL)");
      await jobTarget.query("CREATE TABLE sample (id INT PRIMARY KEY, label VARCHAR(32) NOT NULL)");
      await source.query("INSERT INTO sample VALUES (1, 'first'), (2, 'second')");
      const service = new MigrationService(host(database, names, config));
      await assert.rejects(
        service.addSource(
          {
            label: "Master",
            database: names[2]!,
            tlsMode: "disabled",
            ...config
          },
          "test@codexsun.app"
        ),
        /master database/u
      );
      await assert.rejects(
        service.addSource(
          { label: "System", database: "mysql", tlsMode: "disabled", ...config },
          "test@codexsun.app"
        ),
        /system database/u
      );
      const { id: sourceId } = await service.addSource(
        {
          label: "External test database",
          database: "",
          tlsMode: "disabled",
          ...config
        },
        "test@codexsun.app"
      );
      await assert.rejects(service.listTables(sourceId), /Select a source database/u);
      const databases = await service.listDatabases(sourceId);
      assert.ok(databases.includes(names[0]!));
      assert.ok(databases.includes(names[1]!));
      assert.ok(!databases.includes(names[2]!));
      assert.ok(!databases.includes("mysql"));
      assert.ok(!databases.includes("information_schema"));
      const api = Fastify();
      try {
        await registerDataMigrationApi(api, host(database, names, config));
        const response = await api.inject({
          method: "GET",
          url: `/api/data-migration/sources/${sourceId}/databases`
        });
        assert.equal(response.statusCode, 200);
        assert.ok((response.json().data as string[]).includes(names[0]!));
        const updateResponse = await api.inject({
          method: "PUT",
          url: `/api/data-migration/sources/${sourceId}`,
          payload: {
            label: "Updated external source",
            host: config.host,
            port: config.port,
            database: names[0],
            user: config.user,
            tlsMode: "disabled"
          }
        });
        assert.equal(updateResponse.statusCode, 200, updateResponse.body);
        const copyPayload = {
          label: "Copied source",
          host: config.host,
          port: config.port,
          database: names[1],
          user: config.user,
          tlsMode: "disabled"
        };
        const copied = await api.inject({
          method: "POST",
          url: `/api/data-migration/sources/${sourceId}/copy`,
          payload: copyPayload
        });
        assert.equal(copied.statusCode, 200, copied.body);
        const copiedId = Number(copied.json().data.id);
        assert.notEqual(copiedId, sourceId);
        const savedSources = await service.listSources();
        assert.equal(savedSources.find((item) => item.id === sourceId)?.database, names[0]);
        assert.equal(savedSources.find((item) => item.id === copiedId)?.database, names[1]);
        assert.equal(JSON.stringify(copied.json()).includes(config.password), false);
        assert.deepEqual(await service.listTables(copiedId), ["sample"]);
        const rejectedCopy = await api.inject({
          method: "POST",
          url: `/api/data-migration/sources/${sourceId}/copy`,
          payload: { ...copyPayload, label: "Blocked copy", database: names[2] }
        });
        assert.notEqual(rejectedCopy.statusCode, 200);
        const changedServer = await api.inject({
          method: "POST",
          url: `/api/data-migration/sources/${sourceId}/copy`,
          payload: { ...copyPayload, label: "Different host", host: "untrusted.invalid" }
        });
        assert.notEqual(changedServer.statusCode, 200);
        assert.match(changedServer.body, /Enter a password/u);
        await service.removeSource(copiedId, "test@codexsun.app");
      } finally {
        await api.close();
      }
      assert.equal((await service.listSources())[0]?.label, "Updated external source");
      assert.equal(JSON.stringify(await service.listSources()).includes(config.password), false);
      const [secrets] = await admin.query<RowDataPacket[]>(
        `SELECT password_ciphertext FROM \`${names[2]}\`.data_migration_sources WHERE id = ?`,
        [sourceId]
      );
      assert.notEqual(secrets[0]?.password_ciphertext, config.password);
      await service.updateSource(
        sourceId,
        {
          label: "Updated external source",
          database: names[0]!,
          tlsMode: "disabled",
          host: config.host,
          port: config.port,
          user: config.user
        },
        "test@codexsun.app"
      );
      assert.equal((await service.listSources())[0]?.label, "Updated external source");
      await assert.rejects(
        service.updateSource(
          sourceId,
          {
            label: "Master source",
            database: names[2]!,
            tlsMode: "disabled",
            host: config.host,
            port: config.port,
            user: config.user
          },
          "test@codexsun.app"
        ),
        /master database/u
      );
      await assert.rejects(
        service.updateSource(
          sourceId,
          {
            label: "Invalid port",
            database: names[0]!,
            tlsMode: "disabled",
            host: config.host,
            port: 1,
            user: config.user
          },
          "test@codexsun.app"
        ),
        /refused the connection/u
      );
      assert.equal((await service.listSources())[0]?.port, config.port);
      assert.deepEqual(await service.listTables(sourceId), ["sample"]);
      assert.deepEqual(await service.preview(sourceId, 2, "sample"), {
        table: "sample",
        sourceRows: 2,
        targetRows: 0,
        exactMatches: 0,
        uniqueKeyConflicts: 0,
        compatible: true,
        reason: null
      });
      const emptyTargetSample = await service.sampleTableData(
        sourceId,
        2,
        "sample",
        "sample",
        1,
        1
      );
      assert.deepEqual(emptyTargetSample.sourceRows, [
        { id: 1, label: "first" },
        { id: 2, label: "second" }
      ]);
      assert.deepEqual(emptyTargetSample.targetRows, []);
      assert.equal(await count(source, "sample"), 2);
      assert.equal(await count(target, "sample"), 0);
      assert.equal((await service.copy(sourceId, 2, "sample", "test@codexsun.app")).copiedRows, 2);
      assert.equal(await count(target, "sample"), 2);
      const populatedTargetSample = await service.sampleTableData(
        sourceId,
        2,
        "sample",
        "sample",
        1,
        1
      );
      assert.deepEqual(populatedTargetSample.sourceRows, populatedTargetSample.targetRows);
      const existingRowsPreview = await service.preview(sourceId, 2, "sample");
      assert.equal(existingRowsPreview.exactMatches, 2);
      assert.equal(existingRowsPreview.uniqueKeyConflicts, 0);
      await target.query("UPDATE sample SET label = 'changed' WHERE id = 1");
      const conflictingRowsPreview = await service.preview(sourceId, 2, "sample");
      assert.equal(conflictingRowsPreview.exactMatches, 1);
      assert.equal(conflictingRowsPreview.uniqueKeyConflicts, 1);
      assert.equal((await service.listRuns())[0]?.status, "completed");
      await assert.rejects(service.copy(sourceId, 2, "sample", "test@codexsun.app"), /empty/u);
      assert.equal((await service.listRuns())[0]?.status, "failed");

      await source.query(
        "CREATE TABLE paging_source (legacy_value INT NOT NULL, source_note VARCHAR(32) NOT NULL)"
      );
      await target.query(
        "CREATE TABLE paging_target (new_value INT NOT NULL, target_note VARCHAR(32) NOT NULL)"
      );
      for (let start = 1; start <= 205; start += 100) {
        const batch = Array.from({ length: Math.min(100, 206 - start) }, (_, index) => {
          const value = start + index;
          return [value, `source-${value}`];
        });
        await source.query(
          `INSERT INTO paging_source (legacy_value, source_note) VALUES ${batch
            .map(() => "(?, ?)")
            .join(",")}`,
          batch.flat()
        );
        await target.query(
          `INSERT INTO paging_target (new_value, target_note) VALUES ${batch
            .map(() => "(?, ?)")
            .join(",")}`,
          batch.flatMap(([value]) => [value, `target-${value}`])
        );
      }
      const firstPage = await service.sampleTableData(
        sourceId,
        2,
        "paging_source",
        "paging_target",
        1,
        1,
        "source_note",
        "target_note"
      );
      assert.equal(firstPage.source.totalRows, 205);
      assert.equal(firstPage.target.totalRows, 205);
      assert.equal(firstPage.pageSize, 100);
      assert.equal(firstPage.sourceRows.length, 100);
      assert.equal(firstPage.targetRows.length, 100);
      assert.deepEqual(firstPage.sourceColumns, ["source_note"]);
      assert.deepEqual(firstPage.targetColumns, ["target_note"]);
      assert.deepEqual(firstPage.selectedMapping, {
        sourceColumn: "source_note",
        targetColumn: "target_note"
      });
      const secondPage = await service.sampleTableData(
        sourceId,
        2,
        "paging_source",
        "paging_target",
        2,
        2,
        "source_note",
        "target_note"
      );
      assert.equal(secondPage.sourceRows.length, 100);
      assert.equal(secondPage.targetRows.length, 100);
      const finalPage = await service.sampleTableData(
        sourceId,
        2,
        "paging_source",
        "paging_target",
        3,
        2,
        "source_note",
        "target_note"
      );
      assert.equal(finalPage.sourceRows.length, 5);
      assert.equal(finalPage.source.page, 3);
      assert.equal(finalPage.target.page, 2);
      assert.equal(await count(source, "paging_source"), 205);
      await source.query("DROP TABLE paging_source");
      await target.query("DROP TABLE paging_target");

      await source.query(
        "CREATE TABLE rollback_sample (id INT PRIMARY KEY, label VARCHAR(32) NOT NULL)"
      );
      await target.query(
        "CREATE TABLE rollback_sample (id INT PRIMARY KEY, label VARCHAR(32) NOT NULL, CONSTRAINT allowed_label CHECK (label <> 'blocked'))"
      );
      await source.query("INSERT INTO rollback_sample VALUES (1, 'allowed'), (2, 'blocked')");
      await assert.rejects(service.copy(sourceId, 2, "rollback_sample", "test@codexsun.app"));
      assert.equal(await count(target, "rollback_sample"), 0);
      assert.equal((await service.listRuns())[0]?.status, "failed");

      await source.query(
        "CREATE TABLE mapped_sample (id INT PRIMARY KEY, old_label VARCHAR(32) NOT NULL)"
      );
      await target.query(
        "CREATE TABLE mapped_sample (id INT PRIMARY KEY, new_label VARCHAR(32) NOT NULL, note VARCHAR(24) NOT NULL DEFAULT 'local')"
      );
      await jobTarget.query(
        "CREATE TABLE mapped_sample (id INT PRIMARY KEY, new_label VARCHAR(32) NOT NULL, note VARCHAR(24) NOT NULL DEFAULT 'local')"
      );
      await source.query("INSERT INTO mapped_sample VALUES (1, 'first'), (2, 'second')");
      const mapping = [
        { sourceColumn: "id", targetColumn: "id" },
        { sourceColumn: "old_label", targetColumn: "new_label" }
      ];
      const mappedPreview = await service.preview(sourceId, 2, "mapped_sample", mapping);
      assert.equal(mappedPreview.compatible, true);
      assert.equal(
        (await service.copy(sourceId, 2, "mapped_sample", "test@codexsun.app", mapping)).copiedRows,
        2
      );
      const [mappedRows] = await target.query<RowDataPacket[]>(
        "SELECT * FROM mapped_sample ORDER BY id"
      );
      assert.deepEqual(mappedRows, [
        { id: 1, new_label: "first", note: "local" },
        { id: 2, new_label: "second", note: "local" }
      ]);
      assert.equal(await count(source, "mapped_sample"), 2);
      await source.query(
        "CREATE TABLE old_accounts (legacy_id INT NOT NULL, legacy_name VARCHAR(32) NOT NULL, created_by VARCHAR(32) NULL)"
      );
      await target.query(
        "CREATE TABLE new_accounts (id INT NOT NULL, display_name VARCHAR(32) NOT NULL)"
      );
      await source.query("INSERT INTO old_accounts VALUES (1, 'Sukraa', 'cloud-user')");
      const { id: jobId } = await service.createJob(
        { sessionName: "Sukraa job", sourceId, sourceTenantId: null, targetTenantId: 2 },
        "test@codexsun.app"
      );
      await service.renameJob(jobId, "Sukraa migration", "test@codexsun.app");
      await service.saveJobTable(
        jobId,
        {
          sourceTable: "old_accounts",
          targetTable: "new_accounts",
          mappings: [
            { sourceColumn: "legacy_id", targetColumn: "id" },
            { sourceColumn: "legacy_name", targetColumn: "display_name" }
          ]
        },
        "test@codexsun.app"
      );
      const job = (await service.listJobs()).find((item) => item.id === jobId);
      assert.equal(job?.sessionName, "Sukraa migration");
      assert.equal(job?.sourceDatabase, names[0]);
      assert.equal(job?.targetDatabase, names[1]);
      assert.equal(job?.tableCount, 1);
      const jobTables = await service.getJobTables(jobId);
      assert.equal(jobTables[0]?.sourceTable, "old_accounts");
      assert.equal(jobTables[0]?.targetTable, "new_accounts");
      assert.equal(jobTables[0]?.sourceRows, 1);
      assert.equal(jobTables[0]?.targetRows, 0);
      assert.equal(jobTables[0]?.mappingStatus, "mapped");
      assert.equal(jobTables[0]?.migrationStatus, "pending");
      assert.equal(jobTables[0]?.columnMappings[0]?.by, "test@codexsun.app");
      assert.ok(jobTables[0]?.columnMappings[0]?.id);
      assert.equal(await count(source, "old_accounts"), 1);
      await jobTarget.query(
        "CREATE TABLE new_accounts (id INT NOT NULL, display_name VARCHAR(32) NOT NULL)"
      );
      await source.query("DROP TABLE old_accounts");
      await source.query("DROP TABLE rollback_sample");
      await target.query("DROP TABLE rollback_sample");
      const sampleMapping = [
        { sourceColumn: "id", targetColumn: "id" },
        { sourceColumn: "label", targetColumn: "label" }
      ];
      await source.query(
        "CREATE TABLE old_accounts (legacy_id INT NOT NULL, legacy_name VARCHAR(32) NOT NULL, created_by VARCHAR(32) NULL)"
      );
      await source.query("INSERT INTO old_accounts VALUES (1, 'Sukraa', 'cloud-user')");
      const { id: batchJobId } = await service.createJob(
        { sessionName: "Sukraa migration", sourceId, sourceTenantId: null, targetTenantId: 3 },
        "test@codexsun.app"
      );
      await service.saveJobTable(
        batchJobId,
        { sourceTable: "sample", targetTable: "sample", mappings: sampleMapping },
        "test@codexsun.app"
      );
      await service.saveJobTable(
        batchJobId,
        { sourceTable: "mapped_sample", targetTable: "mapped_sample", mappings: mapping },
        "test@codexsun.app"
      );
      await service.saveJobTable(
        batchJobId,
        {
          sourceTable: "old_accounts",
          targetTable: "new_accounts",
          mappings: [
            { sourceColumn: "legacy_id", targetColumn: "id" },
            { sourceColumn: "legacy_name", targetColumn: "display_name" }
          ]
        },
        "test@codexsun.app"
      );
      await jobTarget.query("ALTER TABLE sample ADD COLUMN extra VARCHAR(32) NULL");
      const selectedBatch = await service.saveQueryBatch(
        batchJobId,
        {
          rows: [
            {
              sourceTable: "sample",
              targetTable: "sample",
              rowNumber: 1,
              rowData: { id: 1, label: "first" }
            }
          ],
          fieldValues: { extra: { mode: "custom", value: "saved" } }
        },
        "test@codexsun.app"
      );
      assert.equal(selectedBatch.savedRows, 1);
      await sqlAdmin(
        admin,
        names[2]!,
        "ALTER TABLE data_migration_query_batches DROP COLUMN source_label"
      );
      await sqlAdmin(
        admin,
        names[2]!,
        "DELETE FROM migration_schema WHERE scope = 'data-migration' AND name = 'data-migration.query-batch-source-snapshot-v8'"
      );
      await migrateDataMigrationDatabase(database);
      const savedSelection = await service.getQueryBatch(batchJobId);
      assert.equal(savedSelection?.rows[0]?.rowNumber, 1);
      assert.deepEqual(savedSelection?.rows[0]?.rowData, { id: 1, label: "first" });
      assert.deepEqual(savedSelection?.rows[0]?.fieldValues, {
        extra: { mode: "custom", value: "saved" }
      });
      assert.equal(savedSelection?.sourceLabel, "Updated external source");
      assert.equal(savedSelection?.passwordStored, true);
      const generatedPlan = await service.generateJobQueryPlan(batchJobId, "test@codexsun.app");
      assert.equal(generatedPlan.status, "generated");
      assert.equal(generatedPlan.canFinalize, true);
      assert.equal(generatedPlan.totalSourceRows, 5);
      const accountsPlan = generatedPlan.tables.find((item) => item.sourceTable === "old_accounts");
      assert.match(accountsPlan?.selectSql ?? "", /^SELECT `legacy_id`/u);
      assert.match(accountsPlan?.insertSqlTemplate ?? "", /VALUES \(\?, \?\)/u);
      assert.deepEqual(accountsPlan?.excludedSourceFields, ["created_by"]);
      assert.equal(JSON.stringify(generatedPlan).includes("Sukraa"), false);
      await assert.rejects(
        service.migrateJob(batchJobId, "test@codexsun.app"),
        /finalize the migration query plan/u
      );
      const queryPlanApi = Fastify();
      try {
        await registerDataMigrationApi(queryPlanApi, host(database, names, config));
        const { id: partialJobId } = await service.createJob(
          {
            sessionName: "Partial table handoff",
            sourceId,
            sourceTenantId: null,
            targetTenantId: 3
          },
          "test@codexsun.app"
        );
        await service.saveJobTable(
          partialJobId,
          { sourceTable: "sample", targetTable: "sample", mappings: sampleMapping },
          "test@codexsun.app"
        );
        await service.saveQueryBatch(
          partialJobId,
          {
            rows: [
              {
                sourceTable: "sample",
                targetTable: "sample",
                rowNumber: 1,
                rowData: { id: 1, label: "first" }
              }
            ],
            fieldValues: {}
          },
          "test@codexsun.app"
        );
        const partialBatch = await service.getQueryBatch(partialJobId);
        const partialHandoff = await queryPlanApi.inject({
          method: "POST",
          url: `/api/data-migration/jobs/${partialJobId}/audit-handoff`,
          payload: { rowIds: [partialBatch!.rows[0]!.id] }
        });
        assert.equal(partialHandoff.statusCode, 200, partialHandoff.body);
        assert.equal(partialHandoff.json().data.sourceTable, "sample");
        assert.equal(partialHandoff.json().data.selectedRows, 1);
        const deletedAuditItem = await queryPlanApi.inject({
          method: "DELETE",
          url: `/api/data-migration/audit-queue/${partialHandoff.json().data.id}`,
          payload: {}
        });
        assert.equal(deletedAuditItem.statusCode, 200, deletedAuditItem.body);
        assert.equal(deletedAuditItem.json().data.deleted, true);
        const removedPartialBatch = await queryPlanApi.inject({
          method: "DELETE",
          url: `/api/data-migration/jobs/${partialJobId}/query-batch`,
          payload: {}
        });
        assert.equal(removedPartialBatch.statusCode, 200, removedPartialBatch.body);
        assert.equal(removedPartialBatch.json().data.deletedRows, 1);
        assert.equal(await service.getQueryBatch(partialJobId), null);
        const deletedPartialJob = await queryPlanApi.inject({
          method: "DELETE",
          url: `/api/data-migration/jobs/${partialJobId}`,
          payload: {}
        });
        assert.equal(deletedPartialJob.statusCode, 200, deletedPartialJob.body);
        assert.equal(deletedPartialJob.json().data.deleted, true);
        assert.equal(
          (await service.listJobs()).some((item) => item.id === partialJobId),
          false
        );

        const { id: mappingDeleteJobId } = await service.createJob(
          {
            sessionName: "Mapping delete check",
            sourceId,
            sourceTenantId: null,
            targetTenantId: 3
          },
          "test@codexsun.app"
        );
        await service.saveJobTable(
          mappingDeleteJobId,
          { sourceTable: "sample", targetTable: "sample", mappings: sampleMapping },
          "test@codexsun.app"
        );
        await service.saveQueryBatch(
          mappingDeleteJobId,
          {
            rows: [
              {
                sourceTable: "sample",
                targetTable: "sample",
                rowNumber: 1,
                rowData: { id: 1, label: "first" }
              }
            ],
            fieldValues: {}
          },
          "test@codexsun.app"
        );
        const deletedMapping = await queryPlanApi.inject({
          method: "DELETE",
          url: `/api/data-migration/jobs/${mappingDeleteJobId}/tables/sample`,
          payload: {}
        });
        assert.equal(deletedMapping.statusCode, 200, deletedMapping.body);
        assert.equal(deletedMapping.json().data.deleted, true);
        assert.deepEqual(await service.getJobTables(mappingDeleteJobId), []);
        assert.equal((await service.getQueryBatch(mappingDeleteJobId))?.rows.length, 0);
        await queryPlanApi.inject({
          method: "DELETE",
          url: `/api/data-migration/jobs/${mappingDeleteJobId}`,
          payload: {}
        });
        const { id: unmappedBatchJobId } = await service.createJob(
          {
            sessionName: "Unmapped query batch",
            sourceId,
            sourceTenantId: null,
            targetTenantId: 3
          },
          "test@codexsun.app"
        );
        const unmappedBatch = await queryPlanApi.inject({
          method: "POST",
          url: `/api/data-migration/jobs/${unmappedBatchJobId}/query-batch`,
          payload: {
            rows: [
              {
                sourceTable: "sample",
                targetTable: "sample",
                rowNumber: 1,
                rowData: { id: 1, label: "first" }
              }
            ],
            fieldValues: {}
          }
        });
        assert.equal(unmappedBatch.statusCode, 409, unmappedBatch.body);
        assert.match(
          unmappedBatch.body,
          /Save the table pair sample.*sample before saving selected rows/u
        );
        const planRead = await queryPlanApi.inject({
          method: "GET",
          url: `/api/data-migration/jobs/${batchJobId}/query-plan`
        });
        assert.equal(planRead.statusCode, 200, planRead.body);
        assert.equal(planRead.json().data.hash, generatedPlan.hash);
        const handoff = await queryPlanApi.inject({
          method: "POST",
          url: `/api/data-migration/jobs/${batchJobId}/audit-handoff`,
          payload: { rowIds: [savedSelection!.rows[0]!.id] }
        });
        assert.equal(handoff.statusCode, 200, handoff.body);
        const queuedDump = handoff.json().data;
        assert.equal(queuedDump.status, "queued");
        assert.equal(queuedDump.sourceTable, "sample");
        assert.equal(queuedDump.selectedRows, 1);
        assert.match(queuedDump.queryDump, /SELECT `id`, `label`/u);
        assert.match(queuedDump.queryDump, /VALUES \(\?, \?, \?\)/u);
        assert.deepEqual(queuedDump.samples, [
          { rowNumber: 1, rowData: { id: 1, label: "first" } }
        ]);
        assert.equal(queuedDump.queryDump.includes("password"), false);
        assert.equal(queuedDump.queryDump.includes('"first"'), false);
        const auditQueue = await queryPlanApi.inject({
          method: "GET",
          url: "/api/data-migration/audit-queue"
        });
        assert.equal(auditQueue.statusCode, 200, auditQueue.body);
        assert.equal(
          auditQueue.json().data.some((item: { id: string }) => item.id === queuedDump.id),
          true
        );
        const queueSummary = auditQueue
          .json()
          .data.find((item: { id: string }) => item.id === queuedDump.id);
        assert.equal("queryDump" in queueSummary, false);
        const auditDetail = await queryPlanApi.inject({
          method: "GET",
          url: `/api/data-migration/audit-queue/${queuedDump.id}`
        });
        assert.equal(auditDetail.statusCode, 200, auditDetail.body);
        assert.deepEqual(auditDetail.json().data.samples, queuedDump.samples);
        const auditReview = await queryPlanApi.inject({
          method: "POST",
          url: `/api/data-migration/audit-queue/${queuedDump.id}/review`,
          payload: {}
        });
        assert.equal(auditReview.statusCode, 200, auditReview.body);
        assert.equal(auditReview.json().data.status, "reviewed");
        assert.equal(auditReview.json().data.planStatus, "generated");
        assert.equal(auditReview.json().data.migrationStatus, "draft");
        const runBeforeFinalize = await queryPlanApi.inject({
          method: "POST",
          url: `/api/data-migration/audit-queue/${queuedDump.id}/run`,
          payload: {}
        });
        assert.equal(runBeforeFinalize.statusCode, 409, runBeforeFinalize.body);
        assert.match(runBeforeFinalize.body, /Finalize the session migration plan/u);
        const queryBatchRead = await queryPlanApi.inject({
          method: "GET",
          url: `/api/data-migration/jobs/${batchJobId}/query-batch`
        });
        assert.equal(queryBatchRead.statusCode, 200, queryBatchRead.body);
        assert.equal(queryBatchRead.json().data.sourceLabel, "Updated external source");
        assert.equal(queryBatchRead.json().data.rows.length, 1);
        const finalize = await queryPlanApi.inject({
          method: "POST",
          url: `/api/data-migration/jobs/${batchJobId}/query-plan/finalize`,
          payload: {}
        });
        assert.equal(finalize.statusCode, 200, finalize.body);
        assert.equal(finalize.json().data.status, "finalized");
      } finally {
        await queryPlanApi.close();
      }
      await source.query("UPDATE sample SET label = 'source changed after review' WHERE id = 1");
      await assert.rejects(
        service.migrateJob(batchJobId, "test@codexsun.app"),
        /no longer current/u
      );
      assert.equal(
        (await service.listAuditQueue()).find((item) => item.jobId === batchJobId)?.status,
        "stale"
      );
      const refreshedPlan = await service.generateJobQueryPlan(batchJobId, "test@codexsun.app");
      assert.equal(refreshedPlan.canFinalize, true);
      await service.finalizeJobQueryPlan(batchJobId, "test@codexsun.app");
      const reviewedRun = await service.handoffJobToAuditQueue(
        batchJobId,
        [savedSelection!.rows[0]!.id],
        "test@codexsun.app"
      );
      await service.markAuditQueueReviewed(reviewedRun.id, "test@codexsun.app");
      const jobBatch = await service.runReviewedMigration(reviewedRun.id, "test@codexsun.app");
      assert.equal(jobBatch.completed.length, 3);
      assert.equal(jobBatch.copiedRows, 5);
      assert.equal(await count(source, "sample"), 2);
      assert.equal(await count(source, "mapped_sample"), 2);
      assert.equal(await count(source, "old_accounts"), 1);
      assert.equal(await count(jobTarget, "sample"), 2);
      assert.equal(await count(jobTarget, "mapped_sample"), 2);
      assert.equal(await count(jobTarget, "new_accounts"), 1);
      assert.equal((await service.getJobQueryPlan(batchJobId))?.status, "completed");
      assert.equal(
        (await service.getJobTables(batchJobId)).every(
          (item) => item.migrationStatus === "completed"
        ),
        true
      );
      await assert.rejects(service.deleteJob(batchJobId), /Only an unrun draft migration/u);
      await assert.rejects(
        service.deleteJobTable(batchJobId, "sample"),
        /locked after a migration has started/u
      );
      await assert.rejects(service.deleteQueryBatch(batchJobId), /after a migration has started/u);
      await assert.rejects(
        service.deleteAuditQueueItem(reviewedRun.id),
        /retained with its run history/u
      );
      assert.equal((await service.verifySource(sourceId, "test@codexsun.app")).verified, true);
      await service.deactivateSource(sourceId, "test@codexsun.app");
      assert.equal((await service.listSources()).length, 0);
      await assert.rejects(service.listTables(sourceId), /not found/u);
    } finally {
      await Promise.all([source.end(), target.end(), jobTarget.end()]);
    }
  } finally {
    if (database) await database.destroy();
    for (const name of names.reverse()) await admin.query(`DROP DATABASE IF EXISTS \`${name}\``);
    await admin.end();
  }
});

test("denies migration reads and writes before resolving a tenant", async () => {
  const app = Fastify();
  let resolved = false;
  await registerDataMigrationApi(app, {
    database: {} as Kysely<unknown>,
    secretKey: "test-secret",
    masterDatabase: { host: "master.invalid", port: 3306, database: "master" },
    authorize() {
      throw AppError.forbidden("Super Admin required.");
    },
    async listTenants() {
      resolved = true;
      return [];
    },
    async resolveTenant() {
      resolved = true;
      throw new Error("Should not resolve.");
    }
  });
  try {
    const reads = await app.inject({ method: "GET", url: "/api/data-migration/tenants" });
    const writes = await app.inject({
      method: "POST",
      url: "/api/data-migration/jobs",
      payload: {
        sessionName: "Denied session",
        sourceId: 1,
        sourceTenantId: null,
        targetTenantId: 2
      }
    });
    const settingsWrite = await app.inject({
      method: "PUT",
      url: "/api/data-migration/sources/1",
      payload: {
        label: "Source",
        host: "localhost",
        port: 3306,
        database: "source",
        user: "admin",
        tlsMode: "disabled"
      }
    });
    const databases = await app.inject({
      method: "GET",
      url: "/api/data-migration/sources/1/databases"
    });
    const sourceCopy = await app.inject({
      method: "POST",
      url: "/api/data-migration/sources/1/copy",
      payload: {}
    });
    assert.notEqual(sourceCopy.statusCode, 200);
    const planRead = await app.inject({
      method: "POST",
      url: "/api/data-migration/plan/read",
      payload: { sourceId: 1, targetTenantId: 2 }
    });
    const planRun = await app.inject({
      method: "POST",
      url: "/api/data-migration/plan/migrate",
      payload: { sourceId: 1, targetTenantId: 2 }
    });
    const directJobRun = await app.inject({
      method: "POST",
      url: "/api/data-migration/jobs/00000000-0000-4000-8000-000000000001/migrate",
      payload: {}
    });
    const directTableRun = await app.inject({
      method: "POST",
      url: "/api/data-migration/runs",
      payload: { sourceId: 1, targetTenantId: 2, table: "sample" }
    });
    const queryPlanRead = await app.inject({
      method: "GET",
      url: "/api/data-migration/jobs/00000000-0000-4000-8000-000000000001/query-plan"
    });
    const queryPlanGenerate = await app.inject({
      method: "POST",
      url: "/api/data-migration/jobs/00000000-0000-4000-8000-000000000001/query-plan/generate",
      payload: {}
    });
    const queryPlanFinalize = await app.inject({
      method: "POST",
      url: "/api/data-migration/jobs/00000000-0000-4000-8000-000000000001/query-plan/finalize",
      payload: {}
    });
    const auditHandoff = await app.inject({
      method: "POST",
      url: "/api/data-migration/jobs/00000000-0000-4000-8000-000000000001/audit-handoff",
      payload: { rowIds: [1] }
    });
    const auditQueueRead = await app.inject({
      method: "GET",
      url: "/api/data-migration/audit-queue"
    });
    const auditedRun = await app.inject({
      method: "POST",
      url: "/api/data-migration/audit-queue/00000000-0000-4000-8000-000000000001/run",
      payload: {}
    });
    const jobDelete = await app.inject({
      method: "DELETE",
      url: "/api/data-migration/jobs/00000000-0000-4000-8000-000000000001",
      payload: {}
    });
    const auditDelete = await app.inject({
      method: "DELETE",
      url: "/api/data-migration/audit-queue/00000000-0000-4000-8000-000000000001",
      payload: {}
    });
    assert.equal(reads.statusCode, 403);
    assert.equal(writes.statusCode, 403);
    assert.equal(settingsWrite.statusCode, 403);
    assert.equal(databases.statusCode, 403);
    assert.equal(planRead.statusCode, 404);
    assert.equal(planRun.statusCode, 404);
    assert.equal(directJobRun.statusCode, 404);
    assert.equal(directTableRun.statusCode, 404);
    assert.equal(queryPlanRead.statusCode, 403);
    assert.equal(queryPlanGenerate.statusCode, 403);
    assert.equal(queryPlanFinalize.statusCode, 403);
    assert.equal(auditHandoff.statusCode, 403);
    assert.equal(auditQueueRead.statusCode, 403);
    assert.equal(auditedRun.statusCode, 403);
    assert.equal(jobDelete.statusCode, 403);
    assert.equal(auditDelete.statusCode, 403);
    assert.equal(resolved, false);
  } finally {
    await app.close();
  }
});

function host(
  database: Kysely<unknown>,
  names: string[],
  config: {
    host: string;
    port: number;
    user: string;
    password: string;
  }
): DataMigrationHost {
  return {
    database,
    secretKey: "test-secret",
    masterDatabase: { host: config.host, port: config.port, database: names[2]! },
    currentDatabase: config,
    authorize: () => "test@codexsun.app",
    listTenants: async () => [
      { id: 2, label: "Target" },
      { id: 3, label: "Job target" }
    ],
    async resolveTenant(id) {
      if (id === 2) return { id, label: "Target", database: names[1]!, ...config };
      if (id === 3) return { id, label: "Job target", database: names[3]!, ...config };
      throw new Error("Unknown tenant.");
    }
  };
}

async function sqlAdmin(admin: Connection, database: string, statement: string) {
  await admin.query(`USE \`${database}\``);
  await admin.query(statement);
}

async function count(connection: Connection, table: string) {
  const [rows] = await connection.query<RowDataPacket[]>(
    `SELECT COUNT(*) AS count FROM \`${table}\``
  );
  return Number(rows[0]?.count);
}

function required(name: string) {
  const value = process.env[name];
  if (!value) throw new Error(`${name} is required for the disposable database test.`);
  return value;
}
