import assert from "node:assert/strict";
import { test } from "node:test";
import { DummyDriver, Kysely, MysqlAdapter, MysqlIntrospector, MysqlQueryCompiler } from "kysely";
import { TaskRepository, taskJobCycleComment } from "./task.repository.js";
import { jobCycleComment } from "../enquiry/enquiry.work.repository.js";
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

test("completed enquiry and task job comments use the requested date and time format", () => {
  const start = "2026-10-22T00:05:09.000Z";
  const stop = "2026-10-22T13:05:09.000Z";

  for (const body of [
    jobCycleComment(4, start, stop, 46_800),
    taskJobCycleComment(4, start, stop, 46_800)
  ]) {
    assert.match(body, /Started @ 22-10-26 12:05:09 AM/);
    assert.match(body, /Completed @ 22-10-26 01:05:09 PM/);
    assert.match(body, /Duration: 13:00:00/);
  }
});
