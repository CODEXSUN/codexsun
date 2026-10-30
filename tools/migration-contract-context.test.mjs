import assert from "node:assert/strict";
import test from "node:test";
import {
  columnPatterns,
  destructiveForwardStatements,
  formatContractFailures,
  hasBillingComplianceActor,
  hasOwnedActivityActor,
  isSqliteMigrationLedger,
  migrationFilesForOwner,
  migrationContext,
  scopedOwnerPrefix
} from "./migration-contract-context.mjs";

test("activity actor evidence applies only to the exact owning activity table", () => {
  const file = "apps/hrms/api/src/modules/department/department.migration.ts";
  assert.equal(
    hasOwnedActivityActor(file, "hrms_department_activity", "actor_email VARCHAR(191) NOT NULL"),
    true
  );
  assert.equal(
    hasOwnedActivityActor(file, "hrms_department_activity", "actor_email VARCHAR(191) NULL"),
    false
  );
  assert.equal(
    hasOwnedActivityActor(file, "hrms_departments", "actor_email VARCHAR(191) NOT NULL"),
    false
  );
  assert.equal(
    hasOwnedActivityActor(
      "apps/other/file.ts",
      "hrms_department_activity",
      "actor_email VARCHAR(191) NOT NULL"
    ),
    false
  );
  assert.equal(
    hasOwnedActivityActor(
      "apps/docs/api/src/modules/knowledge/knowledge.migration.ts",
      "docs_knowledge_activity",
      "actor VARCHAR(191) NOT NULL"
    ),
    true
  );
});

test("Billing compliance creator evidence is scoped to its exact table and required actor", () => {
  const file = "apps/billing/api/src/modules/sales/sales.compliance-migration.ts";
  const table = "billing_sales_compliance_jobs";
  assert.equal(hasBillingComplianceActor(file, table, "actor_email VARCHAR(191) NOT NULL"), true);
  assert.equal(hasBillingComplianceActor(file, table, "actor_email VARCHAR(191) NULL"), false);
  assert.equal(
    hasBillingComplianceActor(file, "billing_other", "actor_email VARCHAR(191) NOT NULL"),
    false
  );
  assert.equal(
    hasBillingComplianceActor("apps/other/file.ts", table, "actor_email VARCHAR(191) NOT NULL"),
    false
  );
});

test("owner scope requires an exact existing owner and defaults to all files", () => {
  const files = [
    "apps/marketing/a.migration.ts",
    "apps/marketing-extra/b.migration.ts",
    "devkits\\data-bridge\\c.migration.ts"
  ];
  assert.deepEqual(migrationFilesForOwner(files, ""), files);
  assert.deepEqual(migrationFilesForOwner(files, "apps/marketing"), [files[0]]);
  assert.deepEqual(migrationFilesForOwner(files, "devkits/data-bridge"), [files[2]]);
  assert.throws(() => migrationFilesForOwner(files, "apps/missing"), /No migration files/);
  assert.throws(() => migrationFilesForOwner(files, "apps/../marketing"), /Migration owner/);
});

test("recognizes only the SQLite migration ledger's concrete schema", () => {
  const body = "name TEXT PRIMARY KEY, applied_at TEXT NOT NULL";
  assert.equal(isSqliteMigrationLedger("migration_schema", body, "sqlite"), true);
  assert.equal(isSqliteMigrationLedger("migration_schema", body, "mariadb"), false);
  assert.equal(isSqliteMigrationLedger("other", body, "sqlite"), false);
  assert.equal(
    isSqliteMigrationLedger("migration_schema", "name TEXT, applied_at TEXT", "sqlite"),
    false
  );
});

test("owner prefixes are accepted only within their own source tree", () => {
  assert.equal(
    scopedOwnerPrefix("devkits/data-bridge/api/src/file.ts", "data_bridge_transfers"),
    true
  );
  assert.equal(scopedOwnerPrefix("apps/sportsclub/api/src/file.ts", "sportsclub_members"), true);
  assert.equal(scopedOwnerPrefix("apps/marketing/api/src/file.ts", "sportsclub_members"), false);
  assert.equal(scopedOwnerPrefix("apps/marketing/api/src/file.ts", "marketingevil"), false);
});

test("failure reports include every finding and group it by owner", () => {
  const findings = Array.from({ length: 150 }, (_, index) => `apps/chat/file.ts: finding ${index}`);
  findings.push("apps/qcafe/file.ts: other finding");
  const report = formatContractFailures(findings);
  assert.match(report, /151 migration contract findings/);
  assert.match(report, /apps\/chat: 150/);
  assert.match(report, /finding 149/);
  assert.match(report, /apps\/qcafe\/file.ts: other finding/);
});

test("detects the SQL dialect in explicit branches and retains required columns", () => {
  const source = `if (isSqliteDatabase(db)) {
    sql\`CREATE TABLE x (id INTEGER PRIMARY KEY AUTOINCREMENT, uuid TEXT NOT NULL, status TEXT NOT NULL, created_by TEXT, created_at TEXT, updated_at TEXT)\`;
  } else {
    sql\`CREATE TABLE x (id INT NOT NULL AUTO_INCREMENT PRIMARY KEY, uuid CHAR(8) NOT NULL, status VARCHAR(24), created_by TEXT, created_at DATETIME, updated_at DATETIME)\`;
  }`;
  const context = migrationContext(source);
  const sqlite = source.indexOf("CREATE TABLE");
  const mariadb = source.lastIndexOf("CREATE TABLE");
  assert.equal(context.contextAt(sqlite).dialect, "sqlite");
  assert.equal(context.contextAt(mariadb).dialect, "mariadb");
  for (const [column, pattern] of columnPatterns("sqlite"))
    assert.match(source.slice(sqlite, mariadb), pattern, column);
  for (const [column, pattern] of columnPatterns("mariadb"))
    assert.match(source.slice(mariadb), pattern, column);
  assert.doesNotMatch("id INTEGER PRIMARY KEY AUTOINCREMENT", columnPatterns("mariadb")[0][1]);
  assert.match("id INT AUTO_INCREMENT PRIMARY KEY", columnPatterns("mariadb")[0][1]);
  assert.match("id INT NOT NULL AUTO_INCREMENT PRIMARY KEY", columnPatterns("mariadb")[0][1]);
  assert.doesNotMatch("id INT AUTO_INCREMENT", columnPatterns("mariadb")[0][1]);
  assert.doesNotMatch(
    "id INTEGER PRIMARY KEY AUTOINCREMENT",
    columnPatterns("sqlite").find(([name]) => name === "created_by")[1]
  );
  const sqliteOnly =
    'import type { DatabaseSync } from "node:sqlite"; function migrate(db: DatabaseSync) { db.exec(`CREATE TABLE x`); }';
  assert.equal(
    migrationContext(sqliteOnly).contextAt(sqliteOnly.indexOf("CREATE TABLE")).dialect,
    "sqlite"
  );
});

test("allows explicit rollback bodies but flags destructive forward SQL", () => {
  const source = `const batch = { down: async () => sql\`DROP TABLE a\`, up: async () => sql\`DROP TABLE b\` };
  export async function rollbackSchema() { sql\`DROP TABLE c\`; }
  async function migrateSchema() { sql\`ALTER TABLE d DROP COLUMN value\`; }`;
  const matches = destructiveForwardStatements(source, migrationContext(source));
  assert.equal(matches.length, 2);
  assert.deepEqual(
    matches.map((match) => match[0]),
    ["DROP TABLE", "DROP COLUMN"]
  );
});

test("ignores comment text but still detects executable destructive SQL", () => {
  const source = `// DROP TABLE example\n/* ALTER TABLE t DROP COLUMN x */\nconst migration = sql\`DROP TABLE actual\`;`;
  const context = migrationContext(source);
  assert.equal(context.isCommentAt(source.indexOf("DROP TABLE example")), true);
  assert.equal(destructiveForwardStatements(source, context).length, 1);
});

test("a rollback-named function called directly is not exempted", () => {
  const source = `function rollbackSchema() { sql\`DROP TABLE a\`; } function migrate() { rollbackSchema(); }`;
  assert.equal(destructiveForwardStatements(source, migrationContext(source)).length, 1);
  const forwardReference = `function rollbackSchema() { sql\`DROP TABLE a\`; } const batch = { up: rollbackSchema };`;
  assert.equal(
    destructiveForwardStatements(forwardReference, migrationContext(forwardReference)).length,
    1
  );
  const rollbackReference = `function rollbackSchema() { sql\`DROP TABLE a\`; } const batch = { down: rollbackSchema };`;
  assert.equal(
    destructiveForwardStatements(rollbackReference, migrationContext(rollbackReference)).length,
    0
  );
});
