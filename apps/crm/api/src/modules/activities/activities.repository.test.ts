import assert from "node:assert/strict";
import { test } from "node:test";
import { DummyDriver, Kysely, MysqlAdapter, MysqlIntrospector, MysqlQueryCompiler } from "kysely";
import { ActivitiesRepository } from "./activities.repository.js";
import type { ActivitiesDatabase, ActivityFilters } from "./activities.types.js";

const database = new Kysely<ActivitiesDatabase>({
  dialect: {
    createAdapter: () => new MysqlAdapter(),
    createDriver: () => new DummyDriver(),
    createIntrospector: (db) => new MysqlIntrospector(db),
    createQueryCompiler: () => new MysqlQueryCompiler()
  }
});

const baseFilters: ActivityFilters = {
  page: 1,
  pageSize: 50,
  search: "",
  contact: "",
  enquiry: "",
  allocatedTo: "",
  listIn: "",
  status: "",
  action: "",
  actor: "",
  actorEmail: "agent@example.com",
  actorUserId: 17,
  canViewAll: false
};

function compiled(filters: ActivityFilters) {
  return new ActivitiesRepository(database)
    ["filteredQuery"](filters)
    .select("activity.id")
    .compile();
}

test("activity events follow enquiry visibility, including assigned enquiries", () => {
  const scoped = compiled(baseFilters);
  assert.match(scoped.sql, /`enquiry`.`assigned_user_id` = \? or `enquiry`.`created_by` = \?/u);
  assert.deepEqual(scoped.parameters.slice(1, 3), [17, "agent@example.com"]);

  const all = compiled({ ...baseFilters, canViewAll: true });
  assert.doesNotMatch(all.sql, /`enquiry`.`assigned_user_id` = \?/u);
  assert.doesNotMatch(all.sql, /`enquiry`.`created_by` = \?/u);
});

test("activity column filters combine with the visibility rule", () => {
  const query = compiled({
    ...baseFilters,
    contact: "Acme",
    enquiry: "#42",
    allocatedTo: "Mira",
    listIn: "Support",
    status: "open"
  });
  assert.match(query.sql, /`enquiry`.`enquiry_no` = \?/u);
  assert.match(query.sql, /`status`.`code` = \?/u);
  assert.ok(query.parameters.includes(42));
  assert.ok(query.parameters.includes("%Acme%"));
  assert.ok(query.parameters.includes("%Mira%"));
  assert.ok(query.parameters.includes("%Support%"));
  assert.ok(query.parameters.includes("open"));
});
