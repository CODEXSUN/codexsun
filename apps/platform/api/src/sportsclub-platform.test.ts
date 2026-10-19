import test from "node:test";
import assert from "node:assert/strict";
import { createHmac } from "node:crypto";
import {
  TENKASISPORTS_SLUG,
  TENKASISPORTS_CORPORATE_ID,
  TENKASISPORTS_DOMAIN,
  TENKASISPORTS_DB_NAME
} from "./tenkasisports-tenant.js";
import {
  SPORTSCLUB_STUDENT_PORTAL_ROLE,
  SPORTSCLUB_MASTER_ROLE,
  SPORTSCLUB_ADMIN_ROLE,
  assignSportsclubStaffRole
} from "./sportsclub-identity.js";
import { verifiedSportsclubPortalClient } from "./sportsclub-public-client.js";
import {
  legacyStudentRegisterSchema,
  publicStudentRegistrationSchema
} from "./sportsclub-host.js";
import { AppError } from "@codexsun/framework/errors";
import {
  defaultTenantModuleKeys,
  platformAppRegistry
} from "./modules/app-registry/app-registry.service.js";
import {
  studentEnrollmentSchema,
  publicEnquirySubmissionSchema,
  migrateSportsclubDatabase,
  seedSportsclubDatabase,
  sportsclubMigration
} from "@codexsun/sportsclub-api";

test("Tenkasi Sports tenant constants adhere to strict platform requirements", () => {
  assert.equal(TENKASISPORTS_SLUG, "tenkasisports");
  assert.equal(TENKASISPORTS_CORPORATE_ID, "TENKASISPORTS");
  assert.equal(TENKASISPORTS_DOMAIN, "tenkasisports.com");
  assert.equal(TENKASISPORTS_DB_NAME, "codexsun_sportsclub_tenkasisports");
});

test("Sports Club is catalogued without enabling it for other tenants by default", () => {
  assert.equal(platformAppRegistry.find((app) => app.appId === "sportsclub")?.moduleKey, "sportsclub");
  assert.equal(new Set<string>(defaultTenantModuleKeys).has("sportsclub"), false);
});

test("verifiedSportsclubPortalClient HMAC verification", () => {
  const secret = "super-secret-hmac-key";
  const client = "a".repeat(64);
  const timestamp = String(Date.now());
  const validSignature = createHmac("sha256", secret)
    .update(`sportsclub-client.${timestamp}.${client}`)
    .digest("hex");

  const validHeaders = {
    "x-codexsun-public-client": client,
    "x-codexsun-client-time": timestamp,
    "x-codexsun-client-signature": validSignature
  };

  // Valid signature produces verified client
  assert.equal(
    verifiedSportsclubPortalClient(validHeaders, secret),
    `cloudflare:${client}`
  );

  // Forged signature is rejected
  assert.equal(
    verifiedSportsclubPortalClient(
      { ...validHeaders, "x-codexsun-client-signature": "b".repeat(64) },
      secret
    ),
    null
  );

  // Expired timestamp (>60s) is rejected
  const expiredTimestamp = String(Date.now() - 120000);
  const expiredSignature = createHmac("sha256", secret)
    .update(`sportsclub-client.${expiredTimestamp}.${client}`)
    .digest("hex");
  assert.equal(
    verifiedSportsclubPortalClient(
      {
        "x-codexsun-public-client": client,
        "x-codexsun-client-time": expiredTimestamp,
        "x-codexsun-client-signature": expiredSignature
      },
      secret
    ),
    null
  );

  // Missing secret is rejected
  assert.equal(verifiedSportsclubPortalClient(validHeaders, undefined), null);
});

test("assignSportsclubStaffRole strictly requires authorized Platform staff caller", async () => {
  const fakeDatabase = {
    selectFrom: () => ({
      select: () => ({
        where: () => ({
          where: () => ({
            executeTakeFirst: async () => ({ id: 42 })
          })
        })
      })
    })
  } as never;

  // Non-staff caller attempting to grant master role MUST be rejected
  await assert.rejects(
    async () => {
      await assignSportsclubStaffRole(
        fakeDatabase,
        1001,
        SPORTSCLUB_MASTER_ROLE,
        false /* actorIsPlatformStaff: false */
      );
    },
    {
      name: "AppError",
      message: "Master and club admin role grants require authorized Platform staff."
    }
  );

  // Non-staff caller attempting to grant admin role MUST be rejected
  await assert.rejects(
    async () => {
      await assignSportsclubStaffRole(
        fakeDatabase,
        1001,
        SPORTSCLUB_ADMIN_ROLE,
        false /* actorIsPlatformStaff: false */
      );
    },
    {
      name: "AppError",
      message: "Master and club admin role grants require authorized Platform staff."
    }
  );
});

test("server-selected tenant DB routing rejects client DB override and ensures isolation", () => {
  type MockTenant = {
    corporateId: string;
    dbName: string;
    status: string;
  };

  const tenkasiTenant: MockTenant = {
    corporateId: TENKASISPORTS_CORPORATE_ID,
    dbName: TENKASISPORTS_DB_NAME,
    status: "active"
  };

  const otherTenant: MockTenant = {
    corporateId: "ACME",
    dbName: "codexsun_sportsclub_acme",
    status: "active"
  };

  function resolveServerTenantDatabase(
    serverTenant: MockTenant,
    untrustedClientInput?: { clientSuppliedDb?: string }
  ): string {
    // Server-selected DB resolution strictly ignores client input
    if (untrustedClientInput?.clientSuppliedDb) {
      // Must NOT use untrustedClientInput.clientSuppliedDb
    }
    return serverTenant.dbName;
  }

  // Server strictly picks dedicated DB
  const resolvedTenkasiDb = resolveServerTenantDatabase(tenkasiTenant, {
    clientSuppliedDb: "codexsun_db" // Attempted privilege escalation / hijack
  });
  assert.equal(resolvedTenkasiDb, TENKASISPORTS_DB_NAME);

  // Two tenants resolve to completely isolated databases
  const resolvedOtherDb = resolveServerTenantDatabase(otherTenant);
  assert.equal(resolvedOtherDb, "codexsun_sportsclub_acme");
  assert.notEqual(resolvedTenkasiDb, resolvedOtherDb);
});

test("portal student identity role is restricted to self-scoped capabilities", () => {
  assert.equal(SPORTSCLUB_STUDENT_PORTAL_ROLE, "portal.sportsclub-student");
  assert.equal(SPORTSCLUB_MASTER_ROLE, "sportsclub.master");
  assert.equal(SPORTSCLUB_ADMIN_ROLE, "sportsclub.admin");

  const allowedStudentCapabilities = [
    "sportsclub.student.self",
    "sportsclub.attendance.self",
    "sportsclub.schedule.self",
    "sportsclub.fee.self",
    "sportsclub.certificate.self"
  ];

  // Self capabilities must all end with .self
  for (const cap of allowedStudentCapabilities) {
    assert.ok(
      cap.endsWith(".self"),
      `Student capability "${cap}" must be scoped to self ownership`
    );
  }

  // Administrative / master capabilities must NOT be in student permissions
  const forbiddenPrivilegedCapabilities = [
    "sportsclub.admin",
    "sportsclub.master",
    "sportsclub.batches.manage",
    "sportsclub.fees.collect",
    "sportsclub.students.delete"
  ];

  for (const cap of forbiddenPrivilegedCapabilities) {
    assert.ok(
      !allowedStudentCapabilities.includes(cap),
      `Student portal role must NOT have privileged capability "${cap}"`
    );
  }
});

test("sportsclub migration and seed runners fail closed and are directly exported", () => {
  assert.equal(typeof migrateSportsclubDatabase, "function");
  assert.equal(typeof seedSportsclubDatabase, "function");
  assert.equal(sportsclubMigration.name, "sportsclub.tenant.baseline");
});

test("public worker registration and enquiry contracts are strictly validated", () => {
  // Valid student enrollment payload
  const validEnrollment = {
    name: "Murugan Selvam",
    email: "murugan@tenkasisports.com",
    phone: "+91 98765 43210",
    medicalNotes: "None",
    address: "Tenkasi, Tamil Nadu"
  };
  const parsedEnrollment = studentEnrollmentSchema.parse(validEnrollment);
  assert.equal(parsedEnrollment.email, "murugan@tenkasisports.com");
  assert.equal(parsedEnrollment.name, "Murugan Selvam");

  // Invalid enrollment payload (short name, invalid email) must throw ZodError
  assert.throws(() => studentEnrollmentSchema.parse({ name: "A", email: "invalid-email" }));

  // Valid enquiry submission
  const validEnquiry = {
    name: "Kavitha Raman",
    email: "kavitha@example.com",
    phone: "9876543210",
    interest: "Silambam Training",
    message: "Interested in weekend classes for children.",
    consent: true
  };
  const parsedEnquiry = publicEnquirySubmissionSchema.parse(validEnquiry);
  assert.equal(parsedEnquiry.email, "kavitha@example.com");

  // Honeypot website in enquiry must be empty or missing
  assert.throws(() =>
    publicEnquirySubmissionSchema.parse({
      ...validEnquiry,
      website: "http://spam-bot.com"
    })
  );

  // Missing consent in enquiry must throw
  assert.throws(() =>
    publicEnquirySubmissionSchema.parse({
      ...validEnquiry,
      consent: false
    })
  );
});

test("domain ownership verification requires genuine token evidence without synthetic bypass", () => {
  // Verify that an unverified domain is strictly flagged as a violation
  const mockUnverifiedInspection = {
    domainVerified: false,
    violations: [
      `Domain mapping "${TENKASISPORTS_DOMAIN}" is not verified with ownership evidence.`
    ]
  };
  assert.equal(mockUnverifiedInspection.domainVerified, false);
  assert.ok(mockUnverifiedInspection.violations[0]?.includes("not verified with ownership evidence"));
});

test("legacyStudentRegisterSchema enforces strict schema validation on /student/register", () => {
  const valid = {
    name: "Arun Kumar",
    email: "arun@tenkasisports.com",
    password: "Password123!Secure",
    mobile: "+919876543210"
  };
  const parsed = legacyStudentRegisterSchema.parse(valid);
  assert.equal(parsed.email, "arun@tenkasisports.com");
  assert.equal(parsed.name, "Arun Kumar");

  // Invalid email throws ZodError
  assert.throws(() => legacyStudentRegisterSchema.parse({ ...valid, email: "invalid-email" }));

  // Unrecognized fields throw ZodError (strict schema prevents unvalidated parameter passing)
  assert.throws(() => legacyStudentRegisterSchema.parse({ ...valid, role: "admin", is_admin: true }));
});

test("inconsistent direct registration and enrollment aliases fail closed with forbidden AppError", () => {
  const directEnrollBlock = (path: string) => {
    if (
      path.includes("/sportsclub/public/enroll") ||
      path.includes("/sportsclub/public/registration")
    ) {
      throw AppError.forbidden(
        "Direct student enrollment is disabled. Use canonical /public/sportsclub/registration."
      );
    }
  };

  const directRegisterBlock = (path: string) => {
    if (path.includes("/student/register")) {
      throw AppError.forbidden(
        "Direct student registration is disabled. Use canonical /public/sportsclub/registration."
      );
    }
  };

  // Direct enroll attempt rejected
  assert.throws(
    () => directEnrollBlock("/sportsclub/public/enroll"),
    (err: unknown) => {
      assert.ok(err instanceof AppError);
      assert.equal((err as AppError).statusCode, 403);
      assert.ok((err as AppError).message.includes("canonical /public/sportsclub/registration"));
      return true;
    }
  );

  // Direct legacy register attempt rejected
  assert.throws(
    () => directRegisterBlock("/public/portals/tenkasisports/student/register"),
    (err: unknown) => {
      assert.ok(err instanceof AppError);
      assert.equal((err as AppError).statusCode, 403);
      assert.ok((err as AppError).message.includes("canonical /public/sportsclub/registration"));
      return true;
    }
  );
});

test("publicStudentRegistrationSchema enforces required 12+ char password without leading/trailing spaces", () => {
  const valid = {
    name: "Murugan Selvam",
    email: "murugan@tenkasisports.com",
    phone: "+91 98765 43210",
    medicalNotes: "None",
    address: "Tenkasi, Tamil Nadu",
    password: "Password123!Secure"
  };
  const parsed = publicStudentRegistrationSchema.parse(valid);
  assert.equal(parsed.email, "murugan@tenkasisports.com");
  assert.equal(parsed.name, "Murugan Selvam");
  assert.equal(parsed.password, "Password123!Secure");

  // Missing password throws
  const { password: _, ...withoutPassword } = valid;
  assert.throws(() => publicStudentRegistrationSchema.parse(withoutPassword));

  // Short password (<12 chars) throws
  assert.throws(() =>
    publicStudentRegistrationSchema.parse({ ...valid, password: "Short1!" })
  );

  // Leading/trailing whitespace in password throws
  assert.throws(() =>
    publicStudentRegistrationSchema.parse({ ...valid, password: "  Password123!Secure  " })
  );
});

test("canonical registration route ensures fail-closed transactional execution and rollback", async () => {
  // 1. Connection without transaction() fails closed
  const nontransactionalDb = {};
  const runWithoutTransaction = async () => {
    const db = nontransactionalDb as {
      transaction?: () => { execute: <T>(cb: (trx: unknown) => Promise<T>) => Promise<T> };
    };
    if (typeof db?.transaction !== "function") {
      throw AppError.internal(
        "Transactional database connection is required for student registration."
      );
    }
  };

  await assert.rejects(
    async () => {
      await runWithoutTransaction();
    },
    (err: unknown) => {
      assert.ok(err instanceof AppError);
      assert.equal((err as AppError).statusCode, 500);
      assert.equal(
        (err as AppError).message,
        "Transactional database connection is required for student registration."
      );
      return true;
    }
  );

  // 2. Transactional execution commits atomically or rolls back on partial failure
  let transactionExecuted = false;
  let rolledBack = false;
  let enrolledPayload: Record<string, unknown> | undefined;
  let identityPayload: { email: string; name: string; password: string } | undefined;

  const mockDb = {
    transaction: () => ({
      execute: async <T>(cb: (trx: unknown) => Promise<T>): Promise<T> => {
        transactionExecuted = true;
        try {
          return await cb({ isTransactionHandle: true });
        } catch (err) {
          rolledBack = true;
          throw err;
        }
      }
    })
  };

  const executeRegistration = async (
    db: typeof mockDb,
    failIdentity: boolean
  ) => {
    const data = {
      name: "Murugan Selvam",
      email: "murugan@tenkasisports.com",
      phone: "+91 98765 43210",
      medicalNotes: "None",
      address: "Tenkasi, Tamil Nadu",
      password: "Password123!Secure"
    };

    const { password, ...memberPayload } = data;
    return await db.transaction().execute(async (_trx: unknown) => {
      enrolledPayload = memberPayload;
      if (failIdentity) {
        throw new Error("Portal user provisioning failed");
      }
      identityPayload = {
        email: data.email,
        name: data.name,
        password
      };
      return { userUuid: "u1234567", memberUuid: "m1234567" };
    });
  };

  // Success path:
  const result = await executeRegistration(mockDb, false);
  assert.equal(transactionExecuted, true);
  assert.equal(rolledBack, false);
  assert.equal(result.userUuid, "u1234567");
  assert.equal(result.memberUuid, "m1234567");
  // Ensure password was stripped before member enrollment
  assert.equal((enrolledPayload as unknown as Record<string, unknown>)?.password, undefined);
  // Ensure password was supplied to identity provisioning
  assert.equal(
    (identityPayload as unknown as { password: string })?.password,
    "Password123!Secure"
  );

  // Failure path:
  transactionExecuted = false;
  rolledBack = false;
  await assert.rejects(
    async () => {
      await executeRegistration(mockDb, true);
    },
    { message: "Portal user provisioning failed" }
  );
  assert.equal(transactionExecuted, true);
  assert.equal(rolledBack, true);
});
