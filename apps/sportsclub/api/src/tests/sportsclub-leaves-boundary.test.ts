import assert from "node:assert/strict";
import test from "node:test";
import { DatabaseSync, type SQLInputValue } from "node:sqlite";
import { Kysely, SqliteDialect } from "kysely";
import Fastify from "fastify";
import type { SportsclubContext, SportsclubDatabase } from "../sportsclub.types.js";
import { migrateSportsclubDatabase } from "../sportsclub.migration.js";
import { AttendanceRepository, AttendanceService, registerAttendanceRoutes } from "../modules/attendance/index.js";
import { ProgressRepository, ProgressService, registerProgressRoutes } from "../modules/progress/index.js";
import { EventRepository, EventService, registerEventRoutes } from "../modules/event/index.js";
import { EnquiryRepository, EnquiryService, registerEnquiryRoutes } from "../modules/enquiry/index.js";
import { MemberRepository } from "../modules/member/index.js";
import { MasterRepository } from "../modules/master/index.js";
import { SessionRepository } from "../modules/session/index.js";

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

function hexUuid(n: number): string {
  return n.toString(16).padStart(8, "0");
}

test("sportsclub leaves boundary: attendance list pagination, search, filters, and GET :uuid detail route", async () => {
  const db = createInMemoryDatabase();
  const app = Fastify();

  try {
    await migrateSportsclubDatabase(db);
    const now = "2026-10-19 10:00:00";

    // Setup master, member, and session required for relations
    await db.insertInto("sportsclub_masters").values({
      uuid: "b0010001",
      email: "master@tenkasisports.test",
      name: "Master Veerapandian",
      phone: "+91 94431 00000",
      title: "Asan",
      primary_discipline: "Silambam",
      public_bio: "Bio",
      private_notes: "Notes",
      experience_years: 25,
      is_approved_public: 1,
      status: "active",
      sort_order: 1,
      revision: 0,
      created_at: now,
      updated_at: now
    }).execute();

    await db.insertInto("sportsclub_programs").values({
      uuid: "a0010001",
      code: "SILAMBAM",
      name: "Silambam Basics",
      discipline: "Silambam",
      description: "Basics",
      level: "beginner",
      age_group: "All Ages",
      is_approved_public: 1,
      status: "active",
      sort_order: 1,
      revision: 0,
      created_at: now,
      updated_at: now
    }).execute();

    await db.insertInto("sportsclub_sessions").values({
      uuid: "c0010001",
      title: "Morning Session",
      program_uuid: "a0010001",
      master_uuid: "b0010001",
      days_of_week: "Mon, Wed",
      start_time: "06:00:00",
      end_time: "07:30:00",
      venue: "Main Hall",
      max_capacity: 30,
      is_approved_public: 1,
      status: "active",
      revision: 0,
      created_at: now,
      updated_at: now
    }).execute();

    await db.insertInto("sportsclub_members").values({
      uuid: "d0010001",
      email: "student@tenkasisports.test",
      name: "Student Kabilan",
      phone: "+91 98888 11111",
      date_of_birth: "2010-01-01",
      gender: "male",
      guardian_name: null,
      guardian_phone: null,
      emergency_contact: null,
      medical_notes: "",
      address: "Tenkasi",
      program_uuid: "a0010001",
      master_uuid: "b0010001",
      role: "student",
      status: "active",
      progress_note: "",
      revision: 0,
      created_at: now,
      updated_at: now
    }).execute();

    const attendanceRepo = new AttendanceRepository(db);
    const sessionRepo = new SessionRepository(db);
    const memberRepo = new MemberRepository(db);
    const masterRepo = new MasterRepository(db);

    // 1. Empty list boundary
    const emptyList = await attendanceRepo.list();
    assert.equal(emptyList.total, 0);
    assert.equal(emptyList.items.length, 0);
    assert.equal(emptyList.pagination, null);

    // 2. Insert 105 attendance records with distinct dates to satisfy unique constraint
    const records = [];
    for (let i = 1; i <= 105; i++) {
      const month = String(Math.floor((i - 1) / 28) + 1).padStart(2, "0");
      const day = String(((i - 1) % 28) + 1).padStart(2, "0");
      records.push({
        uuid: hexUuid(i),
        session_uuid: "c0010001",
        member_uuid: "d0010001",
        attendance_date: `2026-${month}-${day}`,
        status: (i <= 50 ? "present" : i <= 80 ? "absent" : "late") as "present" | "absent" | "late",
        remarks: `Drill session note ${i}`,
        recorded_by: "master@tenkasisports.test",
        created_at: now,
        updated_at: now
      });
    }
    await db.insertInto("sportsclub_attendance").values(records).execute();

    // 3. Test list: Page 1 with 105 total -> exactly 100 items, pagination metadata present
    const page1 = await attendanceRepo.list({ page: 1 });
    assert.equal(page1.total, 105);
    assert.equal(page1.items.length, 100);
    assert.notEqual(page1.pagination, null);
    assert.equal(page1.pagination?.page, 1);
    assert.equal(page1.pagination?.pageSize, 100);
    assert.equal(page1.pagination?.totalPages, 2);
    assert.equal(page1.pagination?.hasNextPage, true);
    assert.equal(page1.pagination?.hasPreviousPage, false);

    // 4. Test list: Page 2 -> 5 items
    const page2 = await attendanceRepo.list({ page: 2 });
    assert.equal(page2.total, 105);
    assert.equal(page2.items.length, 5);
    assert.equal(page2.pagination?.page, 2);
    assert.equal(page2.pagination?.hasNextPage, false);
    assert.equal(page2.pagination?.hasPreviousPage, true);

    // 5. Filter by status 'present' (50 rows) -> pagination strictly null
    const presentOnly = await attendanceRepo.list({ status: "present" });
    assert.equal(presentOnly.total, 50);
    assert.equal(presentOnly.items.length, 50);
    assert.equal(presentOnly.pagination, null, "50 rows <= 100 threshold must return null pagination");

    // 6. Filter by sessionDate / attendanceDate
    const dateFiltered = await attendanceRepo.list({ sessionDate: "2026-01-01" });
    assert.equal(dateFiltered.total, 1);
    assert.equal(dateFiltered.items[0]?.uuid, hexUuid(1));
    assert.equal(dateFiltered.pagination, null);

    // 7. Search filter on remarks
    const searchFiltered = await attendanceRepo.list({ search: "note 105" });
    assert.equal(searchFiltered.total, 1);
    assert.equal(searchFiltered.items[0]?.uuid, hexUuid(105));
    assert.equal(searchFiltered.pagination, null);

    // 8. Test HTTP Routes including GET /sportsclub/attendance/:uuid detail route
    const getContext = (role: string, email: string): SportsclubContext => ({
      actorEmail: email,
      actorRole: role as SportsclubContext["actorRole"],
      isClubAdmin: role === "club_admin" || role === "super_admin",
      isSuperAdmin: role === "super_admin"
    });

    registerAttendanceRoutes(app, (req) => {
      const role = (req.headers["x-test-role"] as string) ?? "super_admin";
      const email = (req.headers["x-test-actor"] as string) ?? "admin@tenkasisports.test";
      return new AttendanceService(attendanceRepo, sessionRepo, memberRepo, masterRepo, getContext(role, email));
    });

    // Super Admin fetches list
    const httpListRes = await app.inject({
      method: "GET",
      url: "/sportsclub/attendance",
      headers: { "x-test-role": "super_admin", "x-test-actor": "admin@tenkasisports.test" }
    });
    assert.equal(httpListRes.statusCode, 200);
    assert.equal(httpListRes.json().data.total, 105);
    assert.equal(httpListRes.json().data.items.length, 100);

    // Super Admin fetches single record by UUID (detail route for full-page Edit direct URL)
    const testUuid = hexUuid(1);
    const detailRes = await app.inject({
      method: "GET",
      url: `/sportsclub/attendance/${testUuid}`,
      headers: { "x-test-role": "super_admin", "x-test-actor": "admin@tenkasisports.test" }
    });
    assert.equal(detailRes.statusCode, 200);
    assert.equal(detailRes.json().data.uuid, testUuid);
    assert.equal(detailRes.json().data.sessionUuid, "c0010001");
    assert.equal(detailRes.json().data.memberUuid, "d0010001");

    // Student fetches their own attendance detail
    const studentDetailRes = await app.inject({
      method: "GET",
      url: `/sportsclub/attendance/${testUuid}`,
      headers: { "x-test-role": "student", "x-test-actor": "student@tenkasisports.test" }
    });
    assert.equal(studentDetailRes.statusCode, 200);
    assert.equal(studentDetailRes.json().data.uuid, testUuid);

    // Unrelated user denied on detail
    const otherUserRes = await app.inject({
      method: "GET",
      url: `/sportsclub/attendance/${testUuid}`,
      headers: { "x-test-role": "student", "x-test-actor": "other@tenkasisports.test" }
    });
    assert.equal(otherUserRes.statusCode, 403);

    // 404 for non-existent attendance UUID
    const notFoundRes = await app.inject({
      method: "GET",
      url: "/sportsclub/attendance/ffffffff",
      headers: { "x-test-role": "super_admin", "x-test-actor": "admin@tenkasisports.test" }
    });
    assert.equal(notFoundRes.statusCode, 404);
  } finally {
    await app.close();
    await db.destroy();
  }
});

test("sportsclub leaves boundary: progress list pagination, search, status filters, and master scoping", async () => {
  const db = createInMemoryDatabase();
  const app = Fastify();

  try {
    await migrateSportsclubDatabase(db);
    const now = "2026-10-19 10:00:00";

    await db.insertInto("sportsclub_masters").values({
      uuid: "b0010001",
      email: "master1@tenkasisports.test",
      name: "Master 1",
      phone: "+91 94431 11111",
      title: "Asan",
      primary_discipline: "Silambam",
      public_bio: "Bio",
      private_notes: "Notes",
      experience_years: 20,
      is_approved_public: 1,
      status: "active",
      sort_order: 1,
      revision: 0,
      created_at: now,
      updated_at: now
    }).execute();

    await db.insertInto("sportsclub_masters").values({
      uuid: "b0010002",
      email: "master2@tenkasisports.test",
      name: "Master 2",
      phone: "+91 94431 22222",
      title: "Assistant Asan",
      primary_discipline: "Silambam",
      public_bio: "Bio",
      private_notes: "Notes",
      experience_years: 10,
      is_approved_public: 1,
      status: "active",
      sort_order: 2,
      revision: 0,
      created_at: now,
      updated_at: now
    }).execute();

    await db.insertInto("sportsclub_members").values({
      uuid: "d0010001",
      email: "kabilan@tenkasisports.test",
      name: "S. Kabilan",
      phone: "+91 98888 11111",
      date_of_birth: "2010-01-01",
      gender: "male",
      guardian_name: null,
      guardian_phone: null,
      emergency_contact: null,
      medical_notes: "",
      address: "Tenkasi",
      program_uuid: null,
      master_uuid: "b0010001",
      role: "student",
      status: "active",
      progress_note: "",
      revision: 0,
      created_at: now,
      updated_at: now
    }).execute();

    const progressRepo = new ProgressRepository(db);
    const memberRepo = new MemberRepository(db);
    const masterRepo = new MasterRepository(db);

    // 0 rows -> null pagination
    const initial = await progressRepo.list();
    assert.equal(initial.total, 0);
    assert.equal(initial.pagination, null);

    // Insert 105 progress records: 70 for master 1, 35 for master 2
    const items = [];
    for (let i = 1; i <= 105; i++) {
      items.push({
        uuid: hexUuid(i),
        member_uuid: "d0010001",
        master_uuid: i <= 70 ? "b0010001" : "b0010002",
        program_uuid: null,
        stage_level: `Stage ${i % 10 + 1}`,
        score: i % 100,
        assessment: `Assessment text for evaluation ${i}`,
        private_notes: `Instructor private note ${i}`,
        status: (i <= 40 ? "passed" : i <= 80 ? "in_progress" : "recommended") as "passed" | "in_progress" | "recommended",
        graded_at: now,
        revision: 0,
        created_at: now,
        updated_at: now
      });
    }
    await db.insertInto("sportsclub_progress").values(items).execute();

    // Page 1 returns 100 of 105 with metadata
    const list1 = await progressRepo.list({ page: 1 });
    assert.equal(list1.total, 105);
    assert.equal(list1.items.length, 100);
    assert.notEqual(list1.pagination, null);
    assert.equal(list1.pagination?.page, 1);
    assert.equal(list1.pagination?.totalPages, 2);

    // Page 2 returns 5 items
    const list2 = await progressRepo.list({ page: 2 });
    assert.equal(list2.items.length, 5);
    assert.equal(list2.pagination?.page, 2);

    // Filter by status 'passed' (40 rows) -> null pagination
    const passedList = await progressRepo.list({ status: "passed" });
    assert.equal(passedList.total, 40);
    assert.equal(passedList.items.length, 40);
    assert.equal(passedList.pagination, null);

    // Test HTTP route with role scoping
    const getContext = (role: string, email: string): SportsclubContext => ({
      actorEmail: email,
      actorRole: role as SportsclubContext["actorRole"],
      isClubAdmin: role === "club_admin" || role === "super_admin",
      isSuperAdmin: role === "super_admin"
    });

    registerProgressRoutes(app, (req) => {
      const role = (req.headers["x-test-role"] as string) ?? "super_admin";
      const email = (req.headers["x-test-actor"] as string) ?? "admin@tenkasisports.test";
      return new ProgressService(progressRepo, memberRepo, masterRepo, getContext(role, email));
    });

    // Master 1 gets only their 70 evaluations -> total 70, pagination null
    const master1Res = await app.inject({
      method: "GET",
      url: "/sportsclub/progress",
      headers: { "x-test-role": "master", "x-test-actor": "master1@tenkasisports.test" }
    });
    assert.equal(master1Res.statusCode, 200);
    assert.equal(master1Res.json().data.total, 70);
    assert.equal(master1Res.json().data.items.length, 70);
    assert.equal(master1Res.json().data.pagination, null);

    // Master 2 gets only their 35 evaluations
    const master2Res = await app.inject({
      method: "GET",
      url: "/sportsclub/progress",
      headers: { "x-test-role": "master", "x-test-actor": "master2@tenkasisports.test" }
    });
    assert.equal(master2Res.statusCode, 200);
    assert.equal(master2Res.json().data.total, 35);
    assert.equal(master2Res.json().data.items.length, 35);
    assert.equal(master2Res.json().data.pagination, null);
  } finally {
    await app.close();
    await db.destroy();
  }
});

test("sportsclub leaves boundary: event list pagination, filters, and search", async () => {
  const db = createInMemoryDatabase();
  const app = Fastify();

  try {
    await migrateSportsclubDatabase(db);
    const now = "2026-10-19 10:00:00";
    const repo = new EventRepository(db);

    // 0 rows -> null pagination
    const list0 = await repo.list();
    assert.equal(list0.total, 0);
    assert.equal(list0.items.length, 0);
    assert.equal(list0.pagination, null);

    // Insert 102 events: 60 tournaments, 42 demonstrations
    const events = [];
    for (let i = 1; i <= 102; i++) {
      events.push({
        uuid: hexUuid(i),
        title: `Tournament Championship Event ${i}`,
        event_type: (i <= 60 ? "tournament" : "demonstration") as "tournament" | "demonstration",
        description: `Annual championship event ${i} for martial arts`,
        event_date: `2026-11-${String(i % 28 + 1).padStart(2, "0")}`,
        end_date: null,
        location: `Ground Arena ${i % 4 + 1}`,
        is_approved_public: 1,
        status: (i <= 70 ? "upcoming" : "completed") as "upcoming" | "completed",
        revision: 0,
        created_at: now,
        updated_at: now
      });
    }
    await db.insertInto("sportsclub_events").values(events).execute();

    // Page 1: 100 items of 102
    const p1 = await repo.list({ page: 1 });
    assert.equal(p1.total, 102);
    assert.equal(p1.items.length, 100);
    assert.notEqual(p1.pagination, null);
    assert.equal(p1.pagination?.page, 1);
    assert.equal(p1.pagination?.totalPages, 2);
    assert.equal(p1.pagination?.hasNextPage, true);

    // Page 2: 2 items
    const p2 = await repo.list({ page: 2 });
    assert.equal(p2.total, 102);
    assert.equal(p2.items.length, 2);
    assert.equal(p2.pagination?.page, 2);
    assert.equal(p2.pagination?.hasNextPage, false);

    // Filter by eventType 'demonstration' (42 items) -> null pagination
    const demos = await repo.list({ eventType: "demonstration" });
    assert.equal(demos.total, 42);
    assert.equal(demos.items.length, 42);
    assert.equal(demos.pagination, null);

    // Search filter
    const searchRes = await repo.list({ search: "Arena 1" });
    assert.ok(searchRes.total > 0 && searchRes.total < 100);
    assert.equal(searchRes.pagination, null);

    // Test HTTP route
    registerEventRoutes(app, () => new EventService(repo, {
      actorEmail: "admin@tenkasisports.test",
      actorRole: "super_admin",
      isClubAdmin: true,
      isSuperAdmin: true
    }));

    const httpRes = await app.inject({
      method: "GET",
      url: "/sportsclub/events?eventType=tournament&page=1"
    });
    assert.equal(httpRes.statusCode, 200);
    assert.equal(httpRes.json().data.total, 60);
    assert.equal(httpRes.json().data.items.length, 60);
    assert.equal(httpRes.json().data.pagination, null);
  } finally {
    await app.close();
    await db.destroy();
  }
});

test("sportsclub leaves boundary: enquiry list pagination, filters, and search", async () => {
  const db = createInMemoryDatabase();
  const app = Fastify();

  try {
    await migrateSportsclubDatabase(db);
    const now = "2026-10-19 10:00:00";
    const repo = new EnquiryRepository(db);

    // 0 rows -> null pagination
    const list0 = await repo.list();
    assert.equal(list0.total, 0);
    assert.equal(list0.items.length, 0);
    assert.equal(list0.pagination, null);

    // Insert 103 enquiries
    const enquiries = [];
    for (let i = 1; i <= 103; i++) {
      enquiries.push({
        uuid: hexUuid(i),
        name: `Enquirer Name ${i}`,
        email: `visitor${i}@example.test`,
        phone: "+91 99999 00000",
        interest: i % 2 === 0 ? "Silambam Training" : "Varma Kalai",
        message: `Detailed question regarding class batches ${i}`,
        consent: 1,
        status: (i <= 50 ? "new" : i <= 80 ? "in_progress" : "resolved") as "new" | "in_progress" | "resolved",
        notes: `Follow up note ${i}`,
        revision: 0,
        created_at: now,
        updated_at: now
      });
    }
    await db.insertInto("sportsclub_enquiries").values(enquiries).execute();

    // Page 1: 100 items of 103
    const p1 = await repo.list({ page: 1 });
    assert.equal(p1.total, 103);
    assert.equal(p1.items.length, 100);
    assert.notEqual(p1.pagination, null);
    assert.equal(p1.pagination?.page, 1);
    assert.equal(p1.pagination?.totalPages, 2);
    assert.equal(p1.pagination?.hasNextPage, true);

    // Page 2: 3 items
    const p2 = await repo.list({ page: 2 });
    assert.equal(p2.total, 103);
    assert.equal(p2.items.length, 3);
    assert.equal(p2.pagination?.page, 2);
    assert.equal(p2.pagination?.hasNextPage, false);

    // Filter by status 'new' (50 items) -> null pagination
    const newEnquiries = await repo.list({ status: "new" });
    assert.equal(newEnquiries.total, 50);
    assert.equal(newEnquiries.items.length, 50);
    assert.equal(newEnquiries.pagination, null);

    // Search filter
    const searchRes = await repo.list({ search: "Varma Kalai" });
    assert.equal(searchRes.total, 52); // 103 items, 52 odd numbers
    assert.equal(searchRes.pagination, null);

    // Test HTTP route
    registerEnquiryRoutes(app, () => new EnquiryService(repo, {
      actorEmail: "admin@tenkasisports.test",
      actorRole: "super_admin",
      isClubAdmin: true,
      isSuperAdmin: true
    }));

    const httpRes = await app.inject({
      method: "GET",
      url: "/sportsclub/enquiries?status=new"
    });
    assert.equal(httpRes.statusCode, 200);
    assert.equal(httpRes.json().data.total, 50);
    assert.equal(httpRes.json().data.items.length, 50);
    assert.equal(httpRes.json().data.pagination, null);
  } finally {
    await app.close();
    await db.destroy();
  }
});
