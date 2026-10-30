import assert from "node:assert/strict";
import test from "node:test";
import { DatabaseSync, type SQLInputValue } from "node:sqlite";
import { Kysely, SqliteDialect } from "kysely";
import Fastify from "fastify";
import type { SportsclubContext, SportsclubDatabase } from "../sportsclub.types.js";
import { migrateSportsclubDatabase } from "../sportsclub.migration.js";
import { ProgramRepository, ProgramService, registerProgramRoutes } from "../modules/program/index.js";
import { MasterRepository, MasterService, registerMasterRoutes } from "../modules/master/index.js";
import { MemberRepository, MemberService, registerMemberRoutes } from "../modules/member/index.js";
import { SessionRepository, SessionService, registerSessionRoutes } from "../modules/session/index.js";
import { calculatePagination, PAGINATION_THRESHOLD } from "../sportsclub.pagination.js";

function createInMemoryDatabase(): Kysely<SportsclubDatabase> {
  const raw = new DatabaseSync(":memory:");
  raw.exec("PRAGMA foreign_keys = ON;");
  return new Kysely<SportsclubDatabase>({
    dialect: new SqliteDialect({
      database: {
        close: () => raw.close(),
        prepare: (sql: string) => {
          const statement = raw.prepare(sql);
          return {
            reader: statement.columns().length > 0,
            all: (parameters: readonly unknown[]) => statement.all(...(parameters as SQLInputValue[])),
            run: (parameters: readonly unknown[]) => statement.run(...(parameters as SQLInputValue[])),
            iterate: (parameters: readonly unknown[]) => statement.iterate(...(parameters as SQLInputValue[]))
          };
        }
      }
    })
  });
}

test("sportsclub pagination calculation: strict 0, 1, 100, 101 boundaries and invariants", () => {
  // 0 rows -> null
  assert.equal(calculatePagination(0, 1), null);

  // 1 row -> null
  assert.equal(calculatePagination(1, 1), null);

  // 99 rows -> null
  assert.equal(calculatePagination(99, 1), null);

  // 100 rows (boundary) -> null
  assert.equal(calculatePagination(100, 1), null);
  assert.equal(calculatePagination(PAGINATION_THRESHOLD, 1), null);

  // 101 rows (boundary exceeded) -> returns metadata
  const p101_1 = calculatePagination(101, 1);
  assert.notEqual(p101_1, null);
  assert.deepEqual(p101_1, {
    page: 1,
    pageSize: 100,
    total: 101,
    totalPages: 2,
    hasNextPage: true,
    hasPreviousPage: false
  });

  const p101_2 = calculatePagination(101, 2);
  assert.notEqual(p101_2, null);
  assert.deepEqual(p101_2, {
    page: 2,
    pageSize: 100,
    total: 101,
    totalPages: 2,
    hasNextPage: false,
    hasPreviousPage: true
  });

  // Out of bounds page clamps safely to totalPages
  const p101_overflow = calculatePagination(101, 99);
  assert.equal(p101_overflow?.page, 2);
});

test("sportsclub database: 0, 1, 100, 101 row boundaries on programs", async () => {
  const db = createInMemoryDatabase();
  try {
    await migrateSportsclubDatabase(db);
    const repo = new ProgramRepository(db);

    // 1. Boundary: 0 rows
    const list0 = await repo.list();
    assert.equal(list0.total, 0);
    assert.equal(list0.items.length, 0);
    assert.equal(list0.pagination, null);

    // 2. Boundary: 1 row
    await repo.save(null, {
      code: "PROG0001",
      name: "Program 1",
      discipline: "Silambam",
      description: "Sample description",
      level: "beginner",
      ageGroup: "All Ages",
      isApprovedPublic: true,
      status: "active",
      sortOrder: 1,
      revision: 0
    });

    const list1 = await repo.list();
    assert.equal(list1.total, 1);
    assert.equal(list1.items.length, 1);
    assert.equal(list1.pagination, null);
    assert.equal(list1.items[0]?.code, "PROG0001");

    // 3. Bulk insert to reach exactly 100 rows (boundary)
    const now = "2026-10-19 12:00:00";
    const batch99 = [];
    for (let i = 2; i <= 100; i++) {
      const hex = i.toString(16).padStart(8, "0");
      batch99.push({
        uuid: hex,
        code: `PROG${i.toString().padStart(4, "0")}`,
        name: `Program ${i}`,
        discipline: i % 2 === 0 ? "Silambam" : "Varma Kalai",
        description: `Description ${i}`,
        level: "beginner" as const,
        age_group: "All Ages",
        is_approved_public: 1,
        status: (i <= 80 ? "active" : "inactive") as "active" | "inactive",
        sort_order: i,
        revision: 0,
        created_at: now,
        updated_at: now
      });
    }
    await db.insertInto("sportsclub_programs").values(batch99).execute();

    const list100 = await repo.list();
    assert.equal(list100.total, 100);
    assert.equal(list100.items.length, 100);
    assert.equal(list100.pagination, null, "total = 100 must return pagination: null");

    // Filter check on 100 rows
    const activePrograms = await repo.list({ status: "active" });
    assert.equal(activePrograms.total, 80);
    assert.equal(activePrograms.pagination, null);

    const silambamPrograms = await repo.list({ discipline: "Silambam" });
    assert.equal(silambamPrograms.total, 51);
    assert.equal(silambamPrograms.pagination, null);

    // Search check
    const searchProg50 = await repo.list({ search: "Program 50" });
    assert.equal(searchProg50.total, 1);
    assert.equal(searchProg50.items[0]?.code, "PROG0050");
    assert.equal(searchProg50.pagination, null);

    // 4. Boundary: Add row 101
    await repo.save(null, {
      code: "PROG0101",
      name: "Program 101",
      discipline: "Silambam",
      description: "Boundary row 101",
      level: "advanced",
      ageGroup: "Adults",
      isApprovedPublic: true,
      status: "active",
      sortOrder: 101,
      revision: 0
    });

    // Page 1 of 101
    const list101Page1 = await repo.list({ page: 1 });
    assert.equal(list101Page1.total, 101);
    assert.equal(list101Page1.items.length, 100);
    assert.notEqual(list101Page1.pagination, null, "total = 101 must return pagination controls");
    assert.deepEqual(list101Page1.pagination, {
      page: 1,
      pageSize: 100,
      total: 101,
      totalPages: 2,
      hasNextPage: true,
      hasPreviousPage: false
    });

    // Page 2 of 101
    const list101Page2 = await repo.list({ page: 2 });
    assert.equal(list101Page2.total, 101);
    assert.equal(list101Page2.items.length, 1);
    assert.deepEqual(list101Page2.pagination, {
      page: 2,
      pageSize: 100,
      total: 101,
      totalPages: 2,
      hasNextPage: false,
      hasPreviousPage: true
    });
  } finally {
    await db.destroy();
  }
});

test("sportsclub database: 100/101 boundary on members with search and role filters", async () => {
  const db = createInMemoryDatabase();
  try {
    await migrateSportsclubDatabase(db);
    const repo = new MemberRepository(db);

    const now = "2026-10-19 12:00:00";
    const members101 = [];
    for (let i = 1; i <= 101; i++) {
      const hex = i.toString(16).padStart(8, "0");
      members101.push({
        uuid: hex,
        email: `student${i}@tenkasisports.test`,
        name: `Student Tenkasi ${i}`,
        phone: `+91 94431 ${i.toString().padStart(5, "0")}`,
        date_of_birth: "2010-01-01",
        gender: i % 2 === 0 ? "male" : "female",
        guardian_name: `Guardian ${i}`,
        guardian_phone: `+91 94432 ${i.toString().padStart(5, "0")}`,
        emergency_contact: "+91 94430 00000",
        medical_notes: "None",
        address: "Tenkasi City",
        program_uuid: null,
        master_uuid: null,
        role: "student" as const,
        status: (i <= 90 ? "active" : "pending") as "active" | "pending",
        progress_note: "",
        revision: 0,
        created_at: now,
        updated_at: now
      });
    }
    await db.insertInto("sportsclub_members").values(members101).execute();

    // 101 total rows
    const allMembers = await repo.list();
    assert.equal(allMembers.total, 101);
    assert.equal(allMembers.items.length, 100);
    assert.notEqual(allMembers.pagination, null);
    assert.equal(allMembers.pagination?.totalPages, 2);

    // Active status filter reduces total to 90 <= 100 -> pagination becomes null!
    const activeOnly = await repo.list({ status: "active" });
    assert.equal(activeOnly.total, 90);
    assert.equal(activeOnly.items.length, 90);
    assert.equal(activeOnly.pagination, null, "90 rows must yield null pagination");

    // Pending status filter: 11 rows -> null pagination
    const pendingOnly = await repo.list({ status: "pending" });
    assert.equal(pendingOnly.total, 11);
    assert.equal(pendingOnly.items.length, 11);
    assert.equal(pendingOnly.pagination, null);

    // Search query matches exactly 1 student -> null pagination
    const searched = await repo.list({ search: "Student Tenkasi 42" });
    assert.equal(searched.total, 1);
    assert.equal(searched.items.length, 1);
    assert.equal(searched.items[0]?.email, "student42@tenkasisports.test");
    assert.equal(searched.pagination, null);
  } finally {
    await db.destroy();
  }
});

test("sportsclub HTTP API: list routes enforce 100-row pagination envelope and auth", async () => {
  const db = createInMemoryDatabase();
  const app = Fastify();

  try {
    await migrateSportsclubDatabase(db);

    app.setErrorHandler((error: Error & { statusCode?: number }, _request, reply) => {
      reply.code(error.statusCode ?? 500).send({ error: error.message });
    });

    const getContext = (request: { headers: Record<string, unknown> }): SportsclubContext => {
      const actor = request.headers["x-test-actor"] as string | undefined;
      const role = (request.headers["x-test-role"] as string | undefined) ?? "student";
      const isSuper = role === "super_admin";
      const isClubAdmin = role === "club_admin" || isSuper;
      return {
        actorEmail: actor,
        actorRole: role as SportsclubContext["actorRole"],
        isClubAdmin,
        isSuperAdmin: isSuper
      };
    };

    registerProgramRoutes(app, (req) => new ProgramService(new ProgramRepository(db), getContext(req)));
    registerMasterRoutes(app, (req) => new MasterService(new MasterRepository(db), getContext(req)));
    registerMemberRoutes(app, (req) => new MemberService(new MemberRepository(db), new MasterRepository(db), getContext(req)));
    registerSessionRoutes(app, (req) => new SessionService(new SessionRepository(db), new ProgramRepository(db), new MasterRepository(db), getContext(req)));

    // Insert program a0010001 for foreign key constraint
    const now = "2026-10-19 12:00:00";
    await db.insertInto("sportsclub_programs").values({
      uuid: "a0010001",
      code: "SILAMBAM",
      name: "Silambam Program",
      discipline: "Silambam",
      description: "Traditional martial art",
      level: "all_levels",
      age_group: "All Ages",
      is_approved_public: 1,
      status: "active",
      sort_order: 1,
      revision: 0,
      created_at: now,
      updated_at: now
    }).execute();

    // Seed 105 sessions into database
    const sessions = [];
    for (let i = 1; i <= 105; i++) {
      sessions.push({
        uuid: i.toString(16).padStart(8, "0"),
        title: `Session ${i}`,
        program_uuid: "a0010001",
        master_uuid: null,
        days_of_week: "Mon, Wed, Fri",
        start_time: "06:00:00",
        end_time: "07:30:00",
        venue: `Dojo Hall ${i % 3 + 1}`,
        max_capacity: 30,
        is_approved_public: 1,
        status: "active" as const,
        revision: 0,
        created_at: now,
        updated_at: now
      });
    }
    await db.insertInto("sportsclub_sessions").values(sessions).execute();

    // 1. Student access denied on /sportsclub/sessions
    const studentRes = await app.inject({
      method: "GET",
      url: "/sportsclub/sessions",
      headers: { "x-test-actor": "student@tenkasisports.test", "x-test-role": "student" }
    });
    assert.equal(studentRes.statusCode, 403);

    // 2. Super admin access succeeds
    const adminRes = await app.inject({
      method: "GET",
      url: "/sportsclub/sessions",
      headers: { "x-test-actor": "admin@tenkasisports.test", "x-test-role": "super_admin" }
    });
    assert.equal(adminRes.statusCode, 200);
    const body = adminRes.json();
    assert.equal(body.success, true);
    assert.equal(body.data.total, 105);
    assert.equal(body.data.items.length, 100);
    assert.notEqual(body.data.pagination, null);
    assert.equal(body.data.pagination.page, 1);
    assert.equal(body.data.pagination.pageSize, 100);
    assert.equal(body.data.pagination.totalPages, 2);
    assert.equal(body.data.pagination.hasNextPage, true);
    assert.equal(body.data.pagination.hasPreviousPage, false);

    // Page 2
    const adminPage2Res = await app.inject({
      method: "GET",
      url: "/sportsclub/sessions?page=2",
      headers: { "x-test-actor": "admin@tenkasisports.test", "x-test-role": "super_admin" }
    });
    assert.equal(adminPage2Res.statusCode, 200);
    const page2Body = adminPage2Res.json();
    assert.equal(page2Body.data.items.length, 5);
    assert.equal(page2Body.data.pagination.page, 2);
    assert.equal(page2Body.data.pagination.hasNextPage, false);
    assert.equal(page2Body.data.pagination.hasPreviousPage, true);

    // Inline search filters on venue
    const hall1Res = await app.inject({
      method: "GET",
      url: "/sportsclub/sessions?search=Hall%201",
      headers: { "x-test-actor": "admin@tenkasisports.test", "x-test-role": "super_admin" }
    });
    assert.equal(hall1Res.statusCode, 200);
    const hall1Body = hall1Res.json();
    assert.equal(hall1Body.data.total, 35); // 105 / 3 = 35
    assert.equal(hall1Body.data.items.length, 35);
    assert.equal(hall1Body.data.pagination, null, "35 rows <= 100 must have null pagination");

    // Members list via HTTP
    const membersRes = await app.inject({
      method: "GET",
      url: "/sportsclub/members",
      headers: { "x-test-actor": "admin@tenkasisports.test", "x-test-role": "super_admin" }
    });
    assert.equal(membersRes.statusCode, 200);
    assert.equal(membersRes.json().data.total, 0);
    assert.equal(membersRes.json().data.pagination, null);
  } finally {
    await app.close();
    await db.destroy();
  }
});
