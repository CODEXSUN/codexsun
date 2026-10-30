import { parsers } from "prettier/plugins/typescript";

export function migrationFilesForOwner(files, owner) {
  if (!owner) return files;
  if (!/^(?:apps|devkits)\/[a-z0-9-]+$/u.test(owner))
    throw new Error("Migration owner must be an apps/<name> or devkits/<name> path.");
  const matches = files.filter((file) => file.replaceAll("\\", "/").startsWith(`${owner}/`));
  if (!matches.length) throw new Error(`No migration files found for owner ${owner}.`);
  return matches;
}

export function isSqliteMigrationLedger(table, body, dialect) {
  if (table !== "migration_schema" || dialect !== "sqlite") return false;
  const columns = body.split(",").map((column) => column.trim());
  return (
    columns.length === 2 &&
    /^name\s+TEXT\s+PRIMARY\s+KEY$/i.test(columns[0]) &&
    /^applied_at\s+TEXT\s+NOT\s+NULL$/i.test(columns[1])
  );
}

export function scopedOwnerPrefix(file, table) {
  const path = file.replaceAll("\\", "/");
  const owners = [
    ["apps/marketing/", "marketing_"],
    ["apps/tconnect/", "tconnect_"],
    ["apps/hrms/", "hrms_"],
    ["apps/sportsclub/", "sportsclub_"],
    ["apps/sites/", "sites_"],
    ["apps/qcafe/", "qcafe_"],
    ["apps/docs/", "docs_"],
    ["devkits/codeit/", "codeit_"],
    ["devkits/data-migration/", "data_migration_"],
    ["devkits/data-bridge/", "data_bridge_"]
  ];
  return owners.some(([owner, prefix]) => path.startsWith(owner) && table.startsWith(prefix));
}

export function migrationContext(source) {
  const tree = parsers.typescript.parse(source, {});
  const calls = new Set();
  const nodes = [];
  function collect(node, parents = []) {
    if (!node || typeof node !== "object") return;
    if (Array.isArray(node)) {
      for (const value of node) collect(value, parents);
      return;
    }
    if (typeof node.type !== "string" || !node.range) return;
    if (node.type === "CallExpression" && node.callee?.type === "Identifier")
      calls.add(node.callee.name);
    nodes.push({ node, parents });
    for (const [key, value] of Object.entries(node)) {
      if (!["loc", "range", "tokens", "comments"].includes(key)) collect(value, [...parents, node]);
    }
  }
  collect(tree);
  const sqliteTypes = new Set(
    tree.body
      .filter((node) => node.type === "ImportDeclaration" && node.source.value === "node:sqlite")
      .flatMap((node) =>
        node.specifiers
          .filter((item) => item.imported?.name === "DatabaseSync")
          .map((item) => item.local.name)
      )
  );
  for (const { node, parents } of nodes) {
    if (node.type !== "Identifier" || !/^rollback[A-Z_]/u.test(node.name)) continue;
    const parent = parents.at(-1);
    if (parent?.type === "FunctionDeclaration" && parent.id === node) continue;
    if (parent?.type === "Property" && parent.key === node && !parent.computed) continue;
    const down = parents.some(
      (item) =>
        item.type === "Property" &&
        !item.computed &&
        item.key?.name === "down" &&
        item.value?.range?.[0] <= node.range[0] &&
        node.range[1] <= item.value.range[1]
    );
    if (!down) calls.add(node.name);
  }
  function contextAt(position) {
    const containing = nodes.filter(
      ({ node }) => node.range[0] <= position && node.range[1] > position
    );
    let dialect = "mariadb";
    let rollback = false;
    for (const { node } of containing) {
      if (
        node.type === "FunctionDeclaration" &&
        node.params.some((param) =>
          sqliteTypes.has(param.typeAnnotation?.typeAnnotation?.typeName?.name)
        )
      )
        dialect = "sqlite";
      if (
        node.type === "Property" &&
        !node.computed &&
        node.key?.name === "down" &&
        node.value?.range?.[0] <= position &&
        position < node.value.range[1]
      )
        rollback = true;
      if (
        node.type === "FunctionDeclaration" &&
        node.id &&
        /^rollback[A-Z_]/u.test(node.id.name) &&
        !calls.has(node.id.name)
      )
        rollback = true;
      if (
        node.type === "IfStatement" &&
        node.test?.type === "CallExpression" &&
        node.test.callee?.name === "isSqliteDatabase"
      ) {
        if (position >= node.consequent.range[0] && position < node.consequent.range[1])
          dialect = "sqlite";
        else if (
          node.alternate &&
          position >= node.alternate.range[0] &&
          position < node.alternate.range[1]
        )
          dialect = "mariadb";
      }
    }
    return { dialect, rollback };
  }
  const isCommentAt = (position) =>
    (tree.comments ?? []).some(
      (comment) => comment.range[0] <= position && position < comment.range[1]
    );
  return { contextAt, isCommentAt };
}

export function columnPatterns(dialect) {
  return [
    [
      "id",
      dialect === "sqlite"
        ? /\bid\s+INTEGER\s+PRIMARY KEY\s+AUTOINCREMENT\b/i
        : /\bid\s+INT\s+(?:NOT NULL\s+)?AUTO_INCREMENT\s+PRIMARY KEY\b/i
    ],
    [
      "uuid",
      dialect === "sqlite"
        ? /\buuid\s+TEXT\s+NOT NULL\b/i
        : /\buuid\s+(?:VAR)?CHAR\((?:8|36)\)\s+NOT NULL\b/i
    ],
    ["status", dialect === "sqlite" ? /\bstatus\s+TEXT\b/i : /\bstatus\s+VARCHAR\(/i],
    ["created_by", /\bcreated_by\s+/i],
    ["created_at", /\bcreated_at\s+/i],
    ["updated_at", /\bupdated_at\s+/i]
  ];
}

export function hasBillingComplianceActor(file, table, body) {
  const owners = new Map([
    [
      "apps/billing/api/src/modules/sales/sales.compliance-migration.ts",
      "billing_sales_compliance_jobs"
    ],
    [
      "apps/billing/api/src/modules/export-sales/export-sales.compliance-migration.ts",
      "billing_export_sales_compliance_jobs"
    ]
  ]);
  return (
    owners.get(file.replaceAll("\\", "/")) === table &&
    /\bactor_email\s+VARCHAR\(191\)\s+NOT NULL\b/i.test(body)
  );
}

export function hasOwnedActivityActor(file, table, body) {
  const owners = new Map([
    [
      "apps/docs/api/src/modules/knowledge/knowledge.migration.ts",
      ["docs_knowledge_activity", "actor"]
    ],
    [
      "apps/hrms/api/src/modules/employee/employee.migration.ts",
      ["hrms_employee_activity", "actor_email"]
    ],
    [
      "apps/hrms/api/src/modules/department/department.migration.ts",
      ["hrms_department_activity", "actor_email"]
    ],
    [
      "apps/hrms/api/src/modules/designation/designation.migration.ts",
      ["hrms_designation_activity", "actor_email"]
    ],
    [
      "apps/hrms/api/src/modules/attendance/attendance.migration.ts",
      ["hrms_attendance_activity", "actor_email"]
    ]
  ]);
  const expected = owners.get(file.replaceAll("\\", "/"));
  return (
    expected?.[0] === table &&
    new RegExp(`\\b${expected[1]}\\s+VARCHAR\\(191\\)\\s+NOT NULL\\b`, "i").test(body)
  );
}

export function destructiveForwardStatements(source, context) {
  return [...source.matchAll(/\bDROP\s+(?:TABLE|COLUMN)\b/gi)].filter(
    (match) => !context.isCommentAt(match.index) && !context.contextAt(match.index).rollback
  );
}

export function formatContractFailures(failures) {
  const groups = new Map();
  for (const failure of failures) {
    const owner = failure.replaceAll("\\", "/").split("/").slice(0, 2).join("/");
    groups.set(owner, (groups.get(owner) ?? 0) + 1);
  }
  const summary = [...groups]
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([owner, count]) => `${owner}: ${count}`);
  return `${failures.length} migration contract findings\n${summary.join("\n")}\n${failures.join("\n")}`;
}
