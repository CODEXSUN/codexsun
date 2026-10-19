import assert from "node:assert/strict";
import test from "node:test";
import { DatabaseSync, type SQLInputValue } from "node:sqlite";
import { Kysely, SqliteDialect } from "kysely";
import Fastify from "fastify";
import type { SportsclubContext, SportsclubDatabase } from "../sportsclub.types.js";
import { migrateSportsclubDatabase } from "../sportsclub.migration.js";
import { seedSportsclubDatabase } from "../sportsclub.seed.js";
import { ProgramRepository, ProgramService, registerProgramRoutes } from "../modules/program/index.js";
import { MasterRepository, MasterService, registerMasterRoutes } from "../modules/master/index.js";
import { MemberRepository, MemberService, registerMemberRoutes } from "../modules/member/index.js";
import { SessionRepository, SessionService, registerSessionRoutes } from "../modules/session/index.js";
import { AttendanceRepository, AttendanceService, registerAttendanceRoutes } from "../modules/attendance/index.js";
import { ProgressRepository, ProgressService, registerProgressRoutes } from "../modules/progress/index.js";
import { EventRepository, EventService, registerEventRoutes } from "../modules/event/index.js";
import { EnquiryRepository, EnquiryService, registerEnquiryRoutes } from "../modules/enquiry/index.js";

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

function createServices(
  db: Kysely<SportsclubDatabase>,
  context: SportsclubContext
) {
  const programRepo = new ProgramRepository(db);
  const masterRepo = new MasterRepository(db);
  const memberRepo = new MemberRepository(db);
  const sessionRepo = new SessionRepository(db);
  const attendanceRepo = new AttendanceRepository(db);
  const progressRepo = new ProgressRepository(db);
  const eventRepo = new EventRepository(db);
  const enquiryRepo = new EnquiryRepository(db);

  return {
    programRepo,
    masterRepo,
    memberRepo,
    sessionRepo,
    attendanceRepo,
    progressRepo,
    eventRepo,
    enquiryRepo,
    programService: new ProgramService(programRepo, context),
    masterService: new MasterService(masterRepo, context),
    memberService: new MemberService(memberRepo, masterRepo, context),
    sessionService: new SessionService(sessionRepo, programRepo, masterRepo, context),
    attendanceService: new AttendanceService(attendanceRepo, sessionRepo, memberRepo, masterRepo, context),
    progressService: new ProgressService(progressRepo, memberRepo, masterRepo, context),
    eventService: new EventService(eventRepo, context),
    enquiryService: new EnquiryService(enquiryRepo, context)
  };
}

test("sportsclub: migrations and seeds run idempotently without publishing unverified defaults", async () => {
  const db = createInMemoryDatabase();
  try {
    // 1. Initial migration and seed
    await migrateSportsclubDatabase(db);
    await seedSportsclubDatabase(db);

    // 2. Idempotent rerun check
    await migrateSportsclubDatabase(db);
    await seedSportsclubDatabase(db);

    const programRepo = new ProgramRepository(db);
    const programs = await programRepo.list();
    assert.equal(programs.length, 3);
    assert.equal(programs[0]?.code, "SILAMBAM");
    assert.equal(programs[0]?.name, "Veerathamilan Traditional Silambam");
    assert.equal(programs[0]?.discipline, "Silambam");
    assert.deepEqual(await programRepo.listApprovedPublic(), []);

    const masterRepo = new MasterRepository(db);
    const masters = await masterRepo.list();
    assert.equal(masters.length, 1);
    assert.equal(masters[0]?.name, "Asan Thiru. Veerapandian");
    assert.equal(masters[0]?.title, "Silambam & Varma Asan");
    assert.equal(masters[0]?.primaryDiscipline, "Silambam");
    assert.deepEqual(await masterRepo.listApprovedPublic(), []);
    assert.deepEqual(await new SessionRepository(db).listApprovedPublic(), []);
    assert.deepEqual(await new EventRepository(db).listApprovedPublic(), []);

    const memberRepo = new MemberRepository(db);
    const members = await memberRepo.list();
    assert.equal(members.length, 1);
    assert.equal(members[0]?.name, "S. Kabilan");
    assert.equal(members[0]?.status, "active");
    assert.equal(members[0]?.masterUuid, "b0010001");
  } finally {
    await db.destroy();
  }
});

test("sportsclub: student enrollment, strict payload handling, master assignment and stale writes", async () => {
  const db = createInMemoryDatabase();
  try {
    await migrateSportsclubDatabase(db);
    await seedSportsclubDatabase(db);

    const adminCtx: SportsclubContext = { actorEmail: "admin@tenkasisports.test", actorRole: "super_admin", isClubAdmin: true, isSuperAdmin: true };
    const admin = createServices(db, adminCtx);

    // Second coach
    const coach2 = await admin.masterService.create({
      email: "assistant-asan@tenkasisports.test",
      name: "Assistant Asan M. Velu",
      phone: "+91 94431 22222",
      title: "Silambam Master",
      primaryDiscipline: "Silambam",
      publicBio: "Senior instructor at the Gurukulam.",
      privateNotes: "Certified in weapon forms.",
      experienceYears: 12,
      isApprovedPublic: true,
      status: "active",
      sortOrder: 2,
      revision: 0
    });

    // 1. Student self-enrollment (public / student)
    const studentCtx: SportsclubContext = { actorEmail: "newstudent@example.test", actorRole: "student", isClubAdmin: false, isSuperAdmin: false };
    const studentService = createServices(db, studentCtx).memberService;

    const pending = await studentService.enroll({
      name: "R. Anbarasan",
      email: "newstudent@example.test",
      phone: "+91 98888 11111",
      dateOfBirth: "2012-04-10",
      gender: "male",
      guardianName: "M. Ramanathan",
      guardianPhone: "+91 98888 22222",
      emergencyContact: "+91 98888 22222",
      medicalNotes: "None",
      address: "Tenkasi",
      programUuid: "a0010001"
    });

    assert.equal(pending.status, "pending");
    assert.equal(pending.role, "student");
    assert.equal(pending.masterUuid, null);

    // Re-enrollment with same email must fail
    await assert.rejects(
      studentService.enroll({ name: "Duplicate", email: "newstudent@example.test", phone: "+91 000" }),
      /already have a club membership/
    );

    // Student cannot self-approve or self-escalate
    await assert.rejects(
      studentService.save(pending.uuid, { ...pending, status: "active" }),
      /Club super admin access is required/
    );

    // 2. Admin approval with strict payload handling (record fields like uuid and updatedAt are cleanly stripped)
    const approved = await admin.memberService.save(pending.uuid, {
      ...pending,
      status: "active",
      masterUuid: "b0010001"
    });

    assert.equal(approved.status, "active");
    assert.equal(approved.masterUuid, "b0010001");
    assert.equal(approved.revision, 2);

    // 3. Stale write rejection: updating with old revision 1 (or 0) must throw conflict
    await assert.rejects(
      admin.memberService.save(approved.uuid, { ...approved, revision: 1, name: "Stale Name" }),
      /changed\. Reload before saving/
    );

    // 4. Invalid master assignment: assigning non-existent or inactive master must fail
    await assert.rejects(
      admin.memberService.save(approved.uuid, { ...approved, masterUuid: "ffffffff" }),
      /Choose an active master from this club/
    );

    // 5. Suspending a master with active students is blocked
    await assert.rejects(
      admin.masterService.update("b0010001", {
        email: "veerapandian@tenkasisports.test",
        name: "Asan Thiru. Veerapandian",
        phone: "+91 94431 00000",
        title: "Silambam & Varma Asan",
        primaryDiscipline: "Silambam",
        publicBio: "Founder",
        privateNotes: "Head",
        experienceYears: 30,
        isApprovedPublic: true,
        status: "suspended",
        sortOrder: 1,
        revision: 0
      }),
      /Reassign this master's students before changing their role or status/
    );

    // 6. Reassigning to coach2 succeeds
    const reassigned = await admin.memberService.save(approved.uuid, {
      ...approved,
      masterUuid: coach2.uuid
    });
    assert.equal(reassigned.masterUuid, coach2.uuid);
  } finally {
    await db.destroy();
  }
});

test("sportsclub: role-based access control, progress evaluations, privacy, and audit trail", async () => {
  const db = createInMemoryDatabase();
  try {
    await migrateSportsclubDatabase(db);
    await seedSportsclubDatabase(db);

    const master1Email = "veerapandian@tenkasisports.test";
    const master2Email = "coach2@tenkasisports.test";
    const studentEmail = "kabilan@tenkasisports.test";
    const otherStudentEmail = "otherstudent@tenkasisports.test";

    const admin = createServices(db, { actorEmail: "admin@tenkasisports.test", actorRole: "super_admin", isClubAdmin: true, isSuperAdmin: true });

    // Coach 2
    const coach2 = await admin.masterService.create({
      email: master2Email,
      name: "Coach 2",
      phone: "+91 94431 99999",
      title: "Assistant",
      primaryDiscipline: "Silambam",
      publicBio: "Bio",
      privateNotes: "Notes",
      experienceYears: 5,
      isApprovedPublic: true,
      status: "active",
      sortOrder: 2,
      revision: 0
    });
    assert.ok(coach2.uuid);

    const master1 = createServices(db, { actorEmail: master1Email, actorRole: "master", isClubAdmin: false, isSuperAdmin: false });
    const master2 = createServices(db, { actorEmail: master2Email, actorRole: "master", isClubAdmin: false, isSuperAdmin: false });
    const student = createServices(db, { actorEmail: studentEmail, actorRole: "student", isClubAdmin: false, isSuperAdmin: false });
    const otherStudent = createServices(db, { actorEmail: otherStudentEmail, actorRole: "student", isClubAdmin: false, isSuperAdmin: false });

    // 1. Student self portal shows only self
    const studentPortal = await student.memberService.portal();
    assert.equal(studentPortal.role, "student");
    assert.equal(studentPortal.members.length, 1);
    assert.equal(studentPortal.members[0]?.email, studentEmail);

    // 2. Master 1 portal shows self and assigned students (Kabilan d0010001)
    const master1Portal = await master1.memberService.portal();
    assert.equal(master1Portal.role, "master");
    assert.equal(master1Portal.members.length, 2);

    // 3. Master 2 has 0 assigned students
    const master2Portal = await master2.memberService.portal();
    assert.equal(master2Portal.role, "master");
    assert.equal(master2Portal.members.length, 1);

    // 4. Student self cannot grade their own progress
    await assert.rejects(
      student.progressService.evaluate("d0010001", {
        stageLevel: "Stage 2 — Double Stick",
        score: 100,
        assessment: "Self pass",
        privateNotes: "Cheating",
        status: "passed",
        revision: 0
      }),
      /Only the student's assigned active master can evaluate progress/
    );

    // 5. Unassigned Master 2 cannot grade Kabilan (assigned to Master 1)
    await assert.rejects(
      master2.progressService.evaluate("d0010001", {
        stageLevel: "Stage 2 — Double Stick",
        score: 80,
        assessment: "Wrong master evaluation",
        privateNotes: "No",
        status: "passed",
        revision: 0
      }),
      /Only the student's assigned active master can evaluate progress/
    );

    // 6. Assigned Master 1 evaluates Kabilan -> succeeds
    const evalRecord = await master1.progressService.evaluate("d0010001", {
      stageLevel: "Stage 2 — Double Stick Rotations",
      score: 92,
      assessment: "Outstanding coordination and precision in double-stick drills.",
      privateNotes: "Eligible for district demonstration team.",
      status: "passed",
      revision: 0
    });

    assert.equal(evalRecord.status, "passed");
    assert.equal(evalRecord.score, 92);

    // 7. Student view of progress excludes private instructor notes
    const studentProgressList = (await student.progressService.listForMember("d0010001")) as unknown as Record<string, unknown>[];
    assert.equal(studentProgressList.length, 2);
    assert.equal(studentProgressList[0]?.privateNotes, undefined);
    assert.equal(studentProgressList[0]?.assessment, "Outstanding coordination and precision in double-stick drills.");

    // 8. Other unrelated student cannot view Kabilan's progress (cross-account privacy)
    await assert.rejects(
      otherStudent.progressService.listForMember("d0010001"),
      /Member progress not found/
    );

    // 9. Stale write on progress update is rejected
    await assert.rejects(
      master1.progressService.update(evalRecord.uuid, {
        stageLevel: "Stage 2",
        score: 95,
        assessment: "Updated",
        privateNotes: "Notes",
        status: "passed",
        revision: 0 // Outdated revision
      }),
      /This progress record changed\. Reload before saving/
    );

    // 10. Audit trail records actions in sportsclub_activity
    const activities = await student.memberService.activity("d0010001");
    assert.ok(activities.length >= 1);
    assert.ok(activities.some((a) => a.action === "seed" || a.action === "progress_summary"));
  } finally {
    await db.destroy();
  }
});

test("sportsclub: cross-tenant database isolation", async () => {
  const dbTenantA = createInMemoryDatabase();
  const dbTenantB = createInMemoryDatabase();

  try {
    await migrateSportsclubDatabase(dbTenantA);
    await seedSportsclubDatabase(dbTenantA);

    await migrateSportsclubDatabase(dbTenantB);
    // Tenant B starts with fresh schema, no seed
    const tenantBRepo = new MemberRepository(dbTenantB);
    const tenantBMembers = await tenantBRepo.list();
    assert.equal(tenantBMembers.length, 0);

    // Check Tenant A members
    const tenantARepo = new MemberRepository(dbTenantA);
    const tenantAMembers = await tenantARepo.list();
    assert.equal(tenantAMembers.length, 1);
    assert.equal(tenantAMembers[0]?.name, "S. Kabilan");

    // Operations in Tenant B cannot see or touch Tenant A records
    assert.equal(await tenantBRepo.find(tenantAMembers[0]!.uuid), undefined);
  } finally {
    await dbTenantA.destroy();
    await dbTenantB.destroy();
  }
});

test("sportsclub: Fastify contract routes enforce authentication, authorization, and standard envelopes", async () => {
  const db = createInMemoryDatabase();
  const app = Fastify();

  try {
    await migrateSportsclubDatabase(db);
    await seedSportsclubDatabase(db);

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
    registerAttendanceRoutes(app, (req) => new AttendanceService(new AttendanceRepository(db), new SessionRepository(db), new MemberRepository(db), new MasterRepository(db), getContext(req)));
    registerProgressRoutes(app, (req) => new ProgressService(new ProgressRepository(db), new MemberRepository(db), new MasterRepository(db), getContext(req)));
    registerEventRoutes(app, (req) => new EventService(new EventRepository(db), getContext(req)));
    registerEnquiryRoutes(app, (req) => new EnquiryService(new EnquiryRepository(db), getContext(req)));

    // 1. Public endpoints work without auth headers
    const publicPrograms = await app.inject({ method: "GET", url: "/sportsclub/public/programs" });
    assert.equal(publicPrograms.statusCode, 200);
    assert.equal(publicPrograms.json().data.length, 0);

    const publicMasters = await app.inject({ method: "GET", url: "/sportsclub/public/masters" });
    assert.equal(publicMasters.statusCode, 200);
    assert.equal(publicMasters.json().data.length, 0);

    const publicEvents = await app.inject({ method: "GET", url: "/sportsclub/public/events" });
    assert.equal(publicEvents.statusCode, 200);
    assert.equal(publicEvents.json().data.length, 0);

    // 2. Public enquiry submission succeeds with consent
    const enquiryRes = await app.inject({
      method: "POST",
      url: "/sportsclub/public/enquiry",
      payload: {
        name: "Public Visitor",
        email: "visitor@example.test",
        phone: "+91 99999 11111",
        interest: "Silambam",
        message: "When do the weekend batches begin?",
        consent: true
      }
    });
    assert.equal(enquiryRes.statusCode, 200);
    assert.equal(enquiryRes.json().data.status, "received");

    // 3. Public student registration (supports both /registration and /enroll endpoints)
    const regRes = await app.inject({
      method: "POST",
      url: "/sportsclub/public/registration",
      payload: {
        name: "Cloudflare Worker Student",
        email: "cfstudent@example.test",
        phone: "+91 99999 44444",
        programUuid: "a0010001"
      }
    });
    assert.equal(regRes.statusCode, 200);
    assert.equal(regRes.json().data.status, "pending");
    assert.equal(regRes.json().data.email, "cfstudent@example.test");

    const enrollRes = await app.inject({
      method: "POST",
      url: "/sportsclub/public/enroll",
      payload: {
        name: "Direct Enroll Student",
        email: "directenroll@example.test",
        phone: "+91 99999 55555",
        programUuid: "a0010001"
      }
    });
    assert.equal(enrollRes.statusCode, 200);
    assert.equal(enrollRes.json().data.status, "pending");
    assert.equal(enrollRes.json().data.email, "directenroll@example.test");

    // 4. Admin protected endpoint denies student
    const adminEndpointAsStudent = await app.inject({
      method: "GET",
      url: "/sportsclub/enquiries",
      headers: { "x-test-actor": "kabilan@tenkasisports.test", "x-test-role": "student" }
    });
    assert.equal(adminEndpointAsStudent.statusCode, 403);

    // 4. Admin protected endpoint succeeds with super_admin
    const adminEndpointAsAdmin = await app.inject({
      method: "GET",
      url: "/sportsclub/enquiries",
      headers: { "x-test-actor": "admin@tenkasisports.test", "x-test-role": "super_admin" }
    });
    assert.equal(adminEndpointAsAdmin.statusCode, 200);
    assert.ok(adminEndpointAsAdmin.json().data.length >= 1);

    // 5. Student Portal /me returns no-store and correct member
    const studentPortalRes = await app.inject({
      method: "GET",
      url: "/sportsclub/portal/me",
      headers: { "x-test-actor": "kabilan@tenkasisports.test", "x-test-role": "student" }
    });
    assert.equal(studentPortalRes.statusCode, 200);
    assert.equal(studentPortalRes.headers["cache-control"], "no-store");
    assert.equal(studentPortalRes.json().data.role, "student");
    assert.equal(studentPortalRes.json().data.members.length, 1);
  } finally {
    await app.close();
    await db.destroy();
  }
});
