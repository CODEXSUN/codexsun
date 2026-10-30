import { createHmac } from "node:crypto";
import { z } from "zod";
import type { FastifyInstance, FastifyRequest } from "fastify";
import type { Kysely } from "kysely";
import { AppError } from "@codexsun/framework/errors";
import {
  AttendanceRepository,
  AttendanceService,
  EnquiryRepository,
  EnquiryService,
  EventRepository,
  EventService,
  MasterRepository,
  MasterService,
  MemberRepository,
  MemberService,
  ProgramRepository,
  ProgramService,
  ProgressRepository,
  ProgressService,
  SessionRepository,
  SessionService,
  publicEnquirySubmissionSchema,
  registerAttendanceRoutes,
  registerEnquiryRoutes,
  registerEventRoutes,
  registerMasterRoutes,
  registerMemberRoutes,
  registerProgramRoutes,
  registerProgressRoutes,
  registerSessionRoutes,
  studentEnrollmentSchema,
  type SportsclubContext as SportsclubApiContext,
  type SportsclubDatabase
} from "@codexsun/sportsclub-api";

export const publicStudentRegistrationSchema = studentEnrollmentSchema.extend({
  password: z
    .string()
    .min(12, "Password must be at least 12 characters.")
    .max(128, "Password must not exceed 128 characters.")
    .refine((value) => value === value.trim(), "Password must not start or end with spaces.")
});

export const legacyStudentRegisterSchema = z.strictObject({
  name: z.string().trim().min(2, "Name must be at least 2 characters.").max(180),
  email: z.string().email("A valid email is required.").trim().toLowerCase().max(180),
  password: z
    .string()
    .min(12, "Password must be at least 12 characters.")
    .max(128, "Password must not exceed 128 characters.")
    .refine((value) => value === value.trim(), "Password must not start or end with spaces."),
  mobile: z.string().trim().max(32).optional()
});
import { env } from "./env.js";
import type { TenantDatabase } from "./database/schema.js";
import { getTenantDatabase } from "./database/tenant-database.js";
import { tenantAccessContext } from "./auth/tenant-access-context.js";
import { EntitlementRepository } from "./modules/entitlement/entitlement.repository.js";
import { TenantRepository } from "./modules/tenant/tenant.repository.js";
import { resolvePublicApplicationTenant } from "./modules/tenant/tenant.service.js";
import { createPortalUser } from "./modules/tenant-user/tenant-user.portal.js";
import {
  SPORTSCLUB_ADMIN_ROLE,
  SPORTSCLUB_MASTER_ROLE,
  SPORTSCLUB_STUDENT_PORTAL_ROLE
} from "./sportsclub-identity.js";
import { verifiedSportsclubPortalClient } from "./sportsclub-public-client.js";
import type {
  SportsclubContext,
  SportsclubMasterScope,
  SportsclubStudentScope
} from "./sportsclub-contract.js";

function withNestedTransactionSupport<T extends object>(targetDb: T): T {
  return new Proxy(targetDb, {
    get(target, prop, receiver) {
      if (prop === "transaction") {
        return () => ({
          execute: <R>(callback: (trx: unknown) => Promise<R>): Promise<R> => {
            return callback(receiver);
          }
        });
      }
      const value = Reflect.get(target, prop, target);
      if (typeof value === "function") {
        return value.bind(target);
      }
      return value;
    }
  });
}

async function sportsclubContextFromRequest(
  database: unknown,
  request: FastifyRequest,
  isPublic: boolean
): Promise<SportsclubApiContext> {
  const isSuperAdmin = request.authContext?.payload.userType === "super_admin";
  let isClubAdmin = isSuperAdmin;
  let isMaster = false;
  let isStudent = false;

  const email = request.authContext?.payload.email;
  if (email && !isPublic && database) {
    try {
      const db = database as unknown as Kysely<TenantDatabase>;
      const userRoles = await db
        .selectFrom("app_users as user")
        .innerJoin("app_user_roles as userRole", "userRole.user_id", "user.id")
        .innerJoin("app_roles as role", "role.id", "userRole.role_id")
        .select("role.key")
        .where("user.email", "=", email)
        .where("user.status", "=", "active")
        .where("userRole.status", "=", "active")
        .where("role.status", "=", "active")
        .execute();

      const roleKeys = new Set(userRoles.map((r) => r.key));
      isClubAdmin = isSuperAdmin || roleKeys.has(SPORTSCLUB_ADMIN_ROLE) || roleKeys.has("admin");
      isMaster = roleKeys.has(SPORTSCLUB_MASTER_ROLE);
      isStudent = roleKeys.has(SPORTSCLUB_STUDENT_PORTAL_ROLE);
    } catch {
      // Database unavailable or mock testing context
    }
  }

  const actorRole = isSuperAdmin
    ? "super_admin"
    : isClubAdmin
      ? "club_admin"
      : isMaster
        ? "master"
        : isStudent
          ? "student"
          : isPublic
            ? "anonymous"
            : "student";

  return {
    actorEmail: request.authContext?.payload.email,
    actorRole,
    isClubAdmin,
    isSuperAdmin
  };
}

async function createSportsclubServices(
  database: unknown,
  request: FastifyRequest,
  isPublic: boolean
) {
  const ctx = await sportsclubContextFromRequest(database, request, isPublic);
  const db = database as unknown as Kysely<SportsclubDatabase>;
  const programRepo = new ProgramRepository(db);
  const masterRepo = new MasterRepository(db);
  const memberRepo = new MemberRepository(db);
  const sessionRepo = new SessionRepository(db);
  const attendanceRepo = new AttendanceRepository(db);
  const progressRepo = new ProgressRepository(db);
  const eventRepo = new EventRepository(db);
  const enquiryRepo = new EnquiryRepository(db);

  return {
    program: new ProgramService(programRepo, ctx),
    master: new MasterService(masterRepo, ctx),
    member: new MemberService(memberRepo, masterRepo, ctx),
    session: new SessionService(sessionRepo, programRepo, masterRepo, ctx),
    attendance: new AttendanceService(attendanceRepo, sessionRepo, memberRepo, masterRepo, ctx),
    progress: new ProgressService(progressRepo, memberRepo, masterRepo, ctx),
    event: new EventService(eventRepo, ctx),
    enquiry: new EnquiryService(enquiryRepo, ctx)
  };
}

export async function registerSportsclubHost(app: FastifyInstance) {
  // Fail-closed direct registration of all sportsclub authenticated routes
  registerProgramRoutes(app, async (req) => {
    const ctx = await resolveContext(req, false);
    const services = await createSportsclubServices(ctx.database, req, false);
    return services.program;
  });
  registerMasterRoutes(app, async (req) => {
    const ctx = await resolveContext(req, false);
    const services = await createSportsclubServices(ctx.database, req, false);
    return services.master;
  });
  registerMemberRoutes(app, async (req) => {
    const path = req.url ?? "";
    if (
      path.includes("/sportsclub/public/enroll") ||
      path.includes("/sportsclub/public/registration")
    ) {
      throw AppError.forbidden(
        "Direct student enrollment is disabled. Use canonical /public/sportsclub/registration."
      );
    }
    const ctx = await resolveContext(req, false);
    const services = await createSportsclubServices(ctx.database, req, false);
    return services.member;
  });
  registerSessionRoutes(app, async (req) => {
    const ctx = await resolveContext(req, false);
    const services = await createSportsclubServices(ctx.database, req, false);
    return services.session;
  });
  registerAttendanceRoutes(app, async (req) => {
    const ctx = await resolveContext(req, false);
    const services = await createSportsclubServices(ctx.database, req, false);
    return services.attendance;
  });
  registerProgressRoutes(app, async (req) => {
    const ctx = await resolveContext(req, false);
    const services = await createSportsclubServices(ctx.database, req, false);
    return services.progress;
  });
  registerEventRoutes(app, async (req) => {
    const ctx = await resolveContext(req, false);
    const services = await createSportsclubServices(ctx.database, req, false);
    return services.event;
  });
  registerEnquiryRoutes(app, async (req) => {
    const ctx = await resolveContext(req, false);
    const services = await createSportsclubServices(ctx.database, req, false);
    return services.enquiry;
  });

  // Dedicated Tenkasi Sports Public Portal prefix (matching Cloudflare Worker contract)
  await app.register(
    async (portal) => {
      // Health check
      portal.get("/health", async (request) => {
        const context = await resolveContext(request, true, true);
        return {
          status: "healthy",
          corporateId: context.corporateId,
          actor: context.actor
        };
      });

      // Public registration context
      portal.get("/public/sportsclub/registration", async (request) => {
        const context = await resolveContext(request, true, true);
        return {
          success: true,
          data: {
            corporateId: context.corporateId,
            registrationFingerprint: context.registrationFingerprint
          }
        };
      });

      // Public student registration / enrollment (Worker validated proxy)
      portal.post("/public/sportsclub/registration", async (request) => {
        const context = await resolveContext(request, true, true);
        const data = publicStudentRegistrationSchema.parse(request.body);

        if (env.NODE_ENV === "production") {
          const verified = verifiedSportsclubPortalClient(
            request.headers,
            process.env.CODEXSUN_SITES_PUBLISH_SECRET
          );
          if (!verified) {
            throw AppError.forbidden("Client signature is invalid or expired.");
          }
        }

        if (!context.provisionStudentIdentity) {
          throw AppError.forbidden("Student registration is not available.");
        }

        const db = context.database as {
          transaction?: () => { execute: <T>(cb: (trx: unknown) => Promise<T>) => Promise<T> };
        };
        if (typeof db?.transaction !== "function") {
          throw AppError.internal(
            "Transactional database connection is required for student registration."
          );
        }

        const { password, ...memberPayload } = data;
        const result = await db.transaction().execute(async (trx: unknown) => {
          const transactionalDb =
            trx && typeof trx === "object" ? withNestedTransactionSupport(trx) : trx;
          const services = await createSportsclubServices(transactionalDb, request, true);
          const member = await services.member.enroll(memberPayload);
          const userUuid = await context.provisionStudentIdentity!(transactionalDb, {
            email: data.email,
            name: data.name,
            password
          });
          return { userUuid, memberUuid: member.uuid };
        });

        return {
          success: true,
          data: {
            corporateId: context.corporateId,
            userUuid: result.userUuid,
            memberUuid: result.memberUuid
          }
        };
      });

      // Public enquiry submission
      portal.post("/public/sportsclub/enquiry", async (request) => {
        const context = await resolveContext(request, true, true);
        const data = publicEnquirySubmissionSchema.parse(request.body);
        const services = await createSportsclubServices(context.database, request, true);
        const result = await services.enquiry.submit(data);
        return {
          success: true,
          data: {
            reference: result.reference,
            status: "received"
          }
        };
      });

      // Public approved programs catalog
      portal.get("/public/sportsclub/programs", async (request) => {
        const context = await resolveContext(request, true, true);
        const services = await createSportsclubServices(context.database, request, true);
        const programs = await services.program.listPublic();
        return { success: true, data: programs };
      });

      // Public approved events calendar
      portal.get("/public/sportsclub/events", async (request) => {
        const context = await resolveContext(request, true, true);
        const services = await createSportsclubServices(context.database, request, true);
        const events = await services.event.listPublic();
        return { success: true, data: events };
      });

      // Public approved masters / coaches roster
      portal.get("/public/sportsclub/masters", async (request) => {
        const context = await resolveContext(request, true, true);
        const services = await createSportsclubServices(context.database, request, true);
        const masters = await services.master.listPublic();
        return { success: true, data: masters };
      });

      // Public active classes / sessions schedule
      portal.get("/public/sportsclub/classes", async (request) => {
        const context = await resolveContext(request, true, true);
        const services = await createSportsclubServices(context.database, request, true);
        const sessions = await services.session.listPublic();
        return { success: true, data: sessions };
      });

      // Public club profile
      portal.get("/public/sportsclub/club-profile", async (request) => {
        const context = await resolveContext(request, true, true);
        return {
          success: true,
          data: {
            corporateId: context.corporateId,
            name: "Tenkasi Sports",
            discipline: "Silambam & Traditional Martial Arts",
            domain: "tenkasisports.com"
          }
        };
      });

      // Explicitly reject inconsistent public aliases on portal prefix
      portal.post("/student/register", async () => {
        throw AppError.forbidden(
          "Direct student registration is disabled. Use canonical /public/sportsclub/registration."
        );
      });

      portal.post("/sportsclub/public/enroll", async () => {
        throw AppError.forbidden(
          "Direct student enrollment is disabled. Use canonical /public/sportsclub/registration."
        );
      });

      portal.post("/sportsclub/public/registration", async () => {
        throw AppError.forbidden(
          "Direct student registration is disabled. Use canonical /public/sportsclub/registration."
        );
      });

      // Direct module public routes on portal

      portal.post("/sportsclub/public/enquiry", async (request) => {
        const context = await resolveContext(request, true, true);
        const data = publicEnquirySubmissionSchema.parse(request.body);
        const services = await createSportsclubServices(context.database, request, true);
        const result = await services.enquiry.submit(data);
        return { success: true, data: result };
      });

      portal.get("/sportsclub/public/programs", async (request) => {
        const context = await resolveContext(request, true, true);
        const services = await createSportsclubServices(context.database, request, true);
        return { success: true, data: await services.program.listPublic() };
      });

      portal.get("/sportsclub/public/events", async (request) => {
        const context = await resolveContext(request, true, true);
        const services = await createSportsclubServices(context.database, request, true);
        return { success: true, data: await services.event.listPublic() };
      });

      portal.get("/sportsclub/public/masters", async (request) => {
        const context = await resolveContext(request, true, true);
        const services = await createSportsclubServices(context.database, request, true);
        return { success: true, data: await services.master.listPublic() };
      });

      portal.get("/sportsclub/public/sessions", async (request) => {
        const context = await resolveContext(request, true, true);
        const services = await createSportsclubServices(context.database, request, true);
        return { success: true, data: await services.session.listPublic() };
      });
    },
    { prefix: "/public/portals/tenkasisports" }
  );
}

export async function resolveContext(
  request: FastifyRequest,
  publicAccess: boolean,
  tenkasiPortal = false
): Promise<SportsclubContext> {
  if (publicAccess) {
    const tenant = tenkasiPortal
      ? await new TenantRepository().findByCorporateId("TENKASISPORTS")
      : await resolvePublicApplicationTenant(request.hostname, "sportsclub");

    if (
      !tenant ||
      tenant.status !== "active" ||
      (tenkasiPortal &&
        tenant.primaryDomain !== "tenkasisports.com" &&
        env.NODE_ENV === "production")
    ) {
      throw AppError.notFound("The Tenkasi Sports tenant is unavailable.");
    }

    const effectiveModules = await new EntitlementRepository().resolveTenantModuleKeys(tenant.id);
    if (!effectiveModules.includes("sportsclub")) {
      throw AppError.notFound("Sports Club access is inactive.");
    }

    const database = getTenantDatabase(tenant);
    const enabled = await database
      .selectFrom("app_module_settings")
      .select("id")
      .where("module_key", "=", "sportsclub")
      .where("enabled", "=", true)
      .where("status", "=", "active")
      .executeTakeFirst();

    if (!enabled) throw AppError.notFound("Sports Club is not published for this tenant.");

    if (request.method !== "GET") {
      const origin = request.headers.origin;
      if (!origin || new URL(origin).host !== request.headers.host) {
        throw AppError.forbidden("A same-origin request is required.");
      }
    }

    return {
      database: database as never,
      actor: "public:student",
      corporateId: tenant.corporateId ?? "",
      registrationFingerprint: createHmac("sha256", env.JWT_SECRET)
        .update(
          (tenkasiPortal
            ? verifiedSportsclubPortalClient(
                request.headers,
                process.env.CODEXSUN_SITES_PUBLISH_SECRET
              )
            : null) ?? request.ip
        )
        .digest("hex"),
      provisionStudentIdentity: (
        db: unknown,
        input: { email: string; name: string; password: string }
      ) =>
        createPortalUser(
          db as never,
          input,
          SPORTSCLUB_STUDENT_PORTAL_ROLE
        ),
      authorize: async () => {
        throw AppError.forbidden("Sign in to manage Sports Club.");
      }
    };
  }

  const context = tenantAccessContext(request);
  const enabled = await context.database
    .selectFrom("app_module_settings")
    .select("id")
    .where("module_key", "=", "sportsclub")
    .where("enabled", "=", true)
    .where("status", "=", "active")
    .executeTakeFirst();

  if (!enabled) throw AppError.forbidden("Sports Club is not enabled for this tenant.");

  let studentScope: SportsclubStudentScope | null = null;
  let masterScope: SportsclubMasterScope | null = null;
  const userId = request.authContext?.payload.userId ?? "";
  if (userId) {
    const db = context.database as unknown as Kysely<SportsclubDatabase>;
    const memberRepo = new MemberRepository(db);
    const member =
      (await memberRepo.find(userId)) ??
      (context.actorEmail ? await memberRepo.byEmail(context.actorEmail) : undefined);
    if (member && member.role === "student") {
      studentScope = {
        studentUuid: member.uuid,
        studentName: member.name,
        status: member.status
      };
    }
    const masterRepo = new MasterRepository(db);
    const master = await masterRepo.find(userId);
    if (master) {
      masterScope = {
        masterUuid: master.uuid,
        masterName: master.name,
        title: master.title,
        status: master.status
      };
    }
  }

  return {
    database: context.database,
    actor: context.actorEmail,
    userUuid: request.authContext?.payload.userId ?? "",
    student: studentScope,
    master: masterScope,
    authorize: context.authorize
  };
}
