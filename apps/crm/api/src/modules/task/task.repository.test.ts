import assert from "node:assert/strict";
import { test } from "node:test";
import { DummyDriver, Kysely, MysqlAdapter, MysqlIntrospector, MysqlQueryCompiler } from "kysely";
import { TaskRepository } from "./task.repository.js";
import type { TaskDatabase } from "./task.types.js";

const database = new Kysely<TaskDatabase>({
  dialect: {
    createAdapter: () => new MysqlAdapter(),
    createDriver: () => new DummyDriver(),
    createIntrospector: (db) => new MysqlIntrospector(db),
    createQueryCompiler: () => new MysqlQueryCompiler()
  }
});

function compiled(canViewAll: boolean, scope: "visible" | "mine") {
  return new TaskRepository(database)
    ["listQuery"](canViewAll, "agent@example.com", 17, scope)
    .select("t.id")
    .compile();
}

test("mine task scope stays user-bound even when the actor can view all", () => {
  const query = compiled(true, "mine");
  assert.match(query.sql, /`t`.`assigned_user_id` = \? or `t`.`created_by` = \?/u);
  assert.deepEqual(query.parameters.slice(0, 2), [17, "agent@example.com"]);
});

test("visible task scope retains administrator-wide access", () => {
  const query = compiled(true, "visible");
  assert.doesNotMatch(query.sql, /`t`.`assigned_user_id` = \?/u);
  assert.doesNotMatch(query.sql, /`t`.`created_by` = \?/u);
});

test("task date ranges filter creation timestamps with an inclusive start and exclusive end", () => {
  const query = new TaskRepository(database)
    ["applyDateRange"](new TaskRepository(database)["query"](), {
      fromAt: "2026-10-01T00:00:00.000Z",
      toAt: "2026-10-02T00:00:00.000Z"
    })
    .select("t.id")
    .compile();

  assert.match(query.sql, /`t`.`created_at` >= \?/u);
  assert.match(query.sql, /`t`.`created_at` < \?/u);
  assert.deepEqual(query.parameters, ["2026-10-01 00:00:00", "2026-10-02 00:00:00"]);
});
