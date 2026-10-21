import assert from "node:assert/strict";
import test from "node:test";
import { DatabaseSync, type SQLInputValue } from "node:sqlite";
import { Kysely, SqliteDialect } from "kysely";
import Fastify from "fastify";
import type { SportsclubDatabase } from "../sportsclub.types.js";
import {
  migrateSportsclubDatabase,
  rollbackSportsclubDatabase,
  sportsclubMigration,
  sportsclubTenantMigrations
} from "../sportsclub.migration.js";
import { seedSportsclubDatabase } from "../sportsclub.seed.js";
import {
  TENKASISPORTS_DB_NAME,
  closeAllSportsclubDatabases,
  getSportsclubDatabase,
  registerSportsclubTenantDatabaseConnection,
  resolveSportsclubDatabaseName
} from "../database/sportsclub-database.js";
import { resolveMasterScope, resolveStudentScope } from "../sportsclub.scope.js";
import {
  defaultSportsclubFeeCatalog,
  sportsclubFeeDuesSchema,
  sportsclubFeeInvoiceRequestSchema,
  sportsclubFeeItemSchema,
  toBillingCustomer
} from "../sportsclub.billing-contract.js";
import { registerSportsclubApi, sportsclubApiModuleKeys } from "../app.js";
import type { MemberRecord } from "../modules/member/member.types.js";

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
            all: (parameters: readonly unknown[]) =>
              statement.all(...(parameters as SQLInputValue[])),
            run: (parameters: readonly unknown[]) =>
              statement.run(...(parameters as SQLInputValue[])),
            iterate: (parameters: readonly unknown[]) =>
              statement.iterate(...(parameters as SQLInputValue[]))
          };
        }
      }
    })
  });
}

test("sportsclub infrastructure: module keys, tenant migrations, and DB naming conventions", () => {
  assert.equal(sportsclubApiModuleKeys.length, 8);
  assert.ok(sportsclubApiModuleKeys.includes("program"));
  assert.ok(sportsclubApiModuleKeys.includes("master"));
  assert.ok(sportsclubApiModuleKeys.includes("member"));
  assert.ok(sportsclubApiModuleKeys.includes("session"));
  assert.ok(sportsclubApiModuleKeys.includes("attendance"));
  assert.ok(sportsclubApiModuleKeys.includes("progress"));
  assert.ok(sportsclubApiModuleKeys.includes("event"));
  assert.ok(sportsclubApiModuleKeys.includes("enquiry"));

  assert.equal(sportsclubTenantMigrations.length, 2);
  assert.equal(sportsclubTenantMigrations[0]?.name, sportsclubMigration.name);
  assert.equal(sportsclubTenantMigrations[1]?.name, "sportsclub.member.photos");

  assert.equal(resolveSportsclubDatabaseName(null), TENKASISPORTS_DB_NAME);
  assert.equal(resolveSportsclubDatabaseName(""), TENKASISPORTS_DB_NAME);
  assert.equal(resolveSportsclubDatabaseName("tenkasisports"), TENKASISPORTS_DB_NAME);
  assert.equal(resolveSportsclubDatabaseName("TENKASISPORTS"), TENKASISPORTS_DB_NAME);
  assert.equal(resolveSportsclubDatabaseName("custom_club_db"), "custom_club_db");
});

test("sportsclub infrastructure: migration, seed, rollback symmetry and connection registry", async () => {
  const db = createInMemoryDatabase();
  const tenantDbName = "test_tenant_sportsclub_db";

  try {
    registerSportsclubTenantDatabaseConnection(tenantDbName, db);
    const resolvedDb = await getSportsclubDatabase(tenantDbName);
    assert.equal(resolvedDb, db);

    // 1. Run migrations & seeds
    await migrateSportsclubDatabase(db);
    await seedSportsclubDatabase(db);

    const members = await db.selectFrom("sportsclub_members").selectAll().execute();
    assert.equal(members.length, 1);
    assert.equal(members[0]?.email, "kabilan@tenkasisports.test");

    // 2. Test rollback drops all tables cleanly
    await rollbackSportsclubDatabase(db);

    // Verify tables are dropped
    await assert.rejects(
      db.selectFrom("sportsclub_members").selectAll().execute(),
      /no such table/
    );

    // 3. Re-migrate after rollback
    await migrateSportsclubDatabase(db);
    await seedSportsclubDatabase(db);

    const reMembers = await db.selectFrom("sportsclub_members").selectAll().execute();
    assert.equal(reMembers.length, 1);
  } finally {
    await closeAllSportsclubDatabases();
    await db.destroy();
  }
});

test("sportsclub infrastructure: Platform student and master scope resolution", async () => {
  const db = createInMemoryDatabase();
  try {
    await migrateSportsclubDatabase(db);
    await seedSportsclubDatabase(db);

    // 1. Resolve student scope
    const studentScope = await resolveStudentScope(db, "d0010001");
    assert.ok(studentScope);
    assert.equal(studentScope.studentUuid, "d0010001");
    assert.equal(studentScope.studentName, "S. Kabilan");
    assert.equal(studentScope.status, "active");

    // Lookup by email
    const studentByEmail = await resolveStudentScope(
      db,
      "unmatched-uuid",
      "kabilan@tenkasisports.test"
    );
    assert.ok(studentByEmail);
    assert.equal(studentByEmail.studentUuid, "d0010001");

    // 2. Resolve master scope
    const masterScope = await resolveMasterScope(db, "b0010001");
    assert.ok(masterScope);
    assert.equal(masterScope.masterUuid, "b0010001");
    assert.equal(masterScope.masterName, "Asan Thiru. Veerapandian");
    assert.equal(masterScope.specialization, "Silambam");
    assert.equal(masterScope.status, "active");

    // 3. Non-existent scopes return null
    assert.equal(await resolveStudentScope(db, "nonexistent"), null);
    assert.equal(await resolveMasterScope(db, "nonexistent"), null);
  } finally {
    await db.destroy();
  }
});

test("sportsclub infrastructure: billing-facing fee catalog and customer contact conversion", () => {
  // 1. Fee catalog validation
  assert.ok(defaultSportsclubFeeCatalog.length >= 4);
  for (const item of defaultSportsclubFeeCatalog) {
    const validated = sportsclubFeeItemSchema.parse(item);
    assert.ok(validated.amount >= 0);
    assert.equal(validated.currency, "INR");
  }

  // 2. Fee Dues schema validation
  const duesSample = {
    uuid: "a1b2c3d4",
    memberUuid: "d0010001",
    studentName: "S. Kabilan",
    studentEmail: "kabilan@tenkasisports.test",
    feeItemCode: "SILAMBAM_MONTHLY_TUITION",
    amount: 800,
    currency: "INR",
    dueDate: "2026-11-01",
    status: "pending",
    paidAmount: 0,
    receiptReference: null,
    invoiceUuid: null,
    notes: "November tuition"
  };
  assert.equal(sportsclubFeeDuesSchema.parse(duesSample).status, "pending");

  // 3. Invoice request schema validation
  const invoiceReq = {
    memberUuid: "d0010001",
    feeItemCode: "SILAMBAM_ADMISSION",
    amount: 1000,
    currency: "INR",
    description: "New enrollment admission fee",
    dueDate: "2026-11-01"
  };
  assert.equal(sportsclubFeeInvoiceRequestSchema.parse(invoiceReq).amount, 1000);

  // 4. Conversion of MemberRecord to Billing Customer
  const minorMember: MemberRecord = {
    uuid: "d0010001",
    email: "kabilan@tenkasisports.test",
    name: "S. Kabilan",
    phone: "+91 94431 11111",
    dateOfBirth: "2010-05-15",
    gender: "male",
    guardianName: "S. Murugan",
    guardianPhone: "+91 94431 11112",
    emergencyContact: "+91 94431 11112",
    medicalNotes: "",
    address: "Tenkasi",
    programUuid: "a0010001",
    masterUuid: "b0010001",
    role: "student",
    status: "active",
    progressNote: "",
    revision: 1,
    createdAt: "2026-10-19 10:00:00",
    updatedAt: "2026-10-19 10:00:00"
  };

  const customer = toBillingCustomer(minorMember);
  assert.equal(customer.name, "S. Kabilan");
  assert.equal(customer.contactPerson, "S. Murugan");
  assert.equal(customer.referenceId, "d0010001");
  assert.ok(customer.notes.includes("Sportsclub Member"));
});

test("sportsclub infrastructure: Fastify registerSportsclubApi, direct auth, access introspection, and public health probe", async () => {
  const db = createInMemoryDatabase();
  const app = Fastify();

  try {
    await migrateSportsclubDatabase(db);
    await seedSportsclubDatabase(db);

    await registerSportsclubApi(app, { database: db });

    // 1. Deploy-readiness public health probe
    const healthRes = await app.inject({
      method: "GET",
      url: "/sportsclub/public/health"
    });
    assert.equal(healthRes.statusCode, 200);
    const healthJson = healthRes.json();
    assert.equal(healthJson.status, "healthy");
    assert.equal(healthJson.service, "@codexsun/sportsclub-api");
    assert.equal(healthJson.tenant, "tenkasisports");
    assert.ok(healthJson.time);

    // 2. Access endpoint without auth -> anonymous / unregistered
    const anonAccessRes = await app.inject({
      method: "GET",
      url: "/sportsclub/access"
    });
    assert.equal(anonAccessRes.statusCode, 200);
    assert.equal(anonAccessRes.json().data.role, "unregistered");
    assert.equal(anonAccessRes.json().data.isClubAdmin, false);

    // 3. Access endpoint with student direct auth
    const studentAccessRes = await app.inject({
      method: "GET",
      url: "/sportsclub/access",
      headers: {
        "x-actor-email": "kabilan@tenkasisports.test",
        "x-actor-role": "student"
      }
    });
    assert.equal(studentAccessRes.statusCode, 200);
    assert.equal(studentAccessRes.json().data.role, "student");
    assert.equal(studentAccessRes.json().data.canManageMembers, false);

    // 4. Access endpoint with master direct auth
    const masterAccessRes = await app.inject({
      method: "GET",
      url: "/sportsclub/access",
      headers: {
        "x-actor-email": "veerapandian@tenkasisports.test",
        "x-actor-role": "master"
      }
    });
    assert.equal(masterAccessRes.statusCode, 200);
    assert.equal(masterAccessRes.json().data.role, "master");
    assert.equal(masterAccessRes.json().data.canEvaluateProgress, true);

    // 5. Access endpoint with super_admin direct auth
    const adminAccessRes = await app.inject({
      method: "GET",
      url: "/sportsclub/access",
      headers: {
        "x-actor-email": "admin@tenkasisports.test",
        "x-actor-role": "super_admin"
      }
    });
    assert.equal(adminAccessRes.statusCode, 200);
    assert.equal(adminAccessRes.json().data.role, "super_admin");
    assert.equal(adminAccessRes.json().data.isClubAdmin, true);
    assert.equal(adminAccessRes.json().data.canManageMembers, true);

    // 6. Public registration via registerSportsclubApi
    const regRes = await app.inject({
      method: "POST",
      url: "/sportsclub/public/registration",
      payload: {
        name: "Direct Deploy Student",
        email: "directdeploy@example.test",
        phone: "+91 99999 88888",
        programUuid: "a0010001"
      }
    });
    assert.equal(regRes.statusCode, 200);
    assert.equal(regRes.json().data.status, "pending");

    // 7. Public enquiry via registerSportsclubApi
    const enquiryRes = await app.inject({
      method: "POST",
      url: "/sportsclub/public/enquiry",
      payload: {
        name: "Prospective Student",
        email: "prospect@example.test",
        phone: "+91 99999 77777",
        interest: "Varma Kalai",
        message: "Details regarding evening batches",
        consent: true
      }
    });
    assert.equal(enquiryRes.statusCode, 200);
    assert.equal(enquiryRes.json().data.status, "received");

    // 8. Public programs catalog
    const progRes = await app.inject({
      method: "GET",
      url: "/sportsclub/public/programs"
    });
    assert.equal(progRes.statusCode, 200);
    assert.equal(progRes.json().data.length, 0);
  } finally {
    await app.close();
    await db.destroy();
  }
});
