/**
 * @file Multi-Tenant Sportsclub Application Router & Host
 *
 * Implements registerSportsclubApi with tenant isolation, direct auth,
 * access introspection, health checks, and module route registration
 * wired to Billing-like application infrastructure.
 */

import type { FastifyInstance, FastifyRequest } from "fastify";
import type { Kysely } from "kysely";
import { AppError } from "@codexsun/framework/errors";
import { ok } from "@codexsun/framework/http";
import type { SportsclubContext, SportsclubDatabase } from "./sportsclub.types.js";
import {
  getSportsclubDatabase,
  resolveSportsclubDatabaseName
} from "./database/sportsclub-database.js";
import { ProgramRepository, ProgramService, registerProgramRoutes } from "./modules/program/index.js";
import { MasterRepository, MasterService, registerMasterRoutes } from "./modules/master/index.js";
import { MemberRepository, MemberService, registerMemberRoutes } from "./modules/member/index.js";
import { SessionRepository, SessionService, registerSessionRoutes } from "./modules/session/index.js";
import { AttendanceRepository, AttendanceService, registerAttendanceRoutes } from "./modules/attendance/index.js";
import { ProgressRepository, ProgressService, registerProgressRoutes } from "./modules/progress/index.js";
import { EventRepository, EventService, registerEventRoutes } from "./modules/event/index.js";
import { EnquiryRepository, EnquiryService, registerEnquiryRoutes } from "./modules/enquiry/index.js";

export const sportsclubApiModuleKeys = [
  "program",
  "master",
  "member",
  "session",
  "attendance",
  "progress",
  "event",
  "enquiry"
] as const;

export type SportsclubApiOptions = {
  database?: Kysely<SportsclubDatabase>;
  resolveContext?: (
    request: FastifyRequest,
    isPublic: boolean
  ) => Promise<SportsclubContext> | SportsclubContext;
  resolveDatabase?: (
    request: FastifyRequest
  ) => Promise<Kysely<SportsclubDatabase>> | Kysely<SportsclubDatabase>;
};

declare module "fastify" {
  interface FastifyRequest {
    sportsclubContext?: SportsclubContext;
    sportsclubDb?: Kysely<SportsclubDatabase>;
  }
}

export function createSportsclubServices(
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
    program: new ProgramService(programRepo, context, masterRepo, memberRepo, sessionRepo),
    master: new MasterService(masterRepo, context),
    member: new MemberService(memberRepo, masterRepo, context),
    session: new SessionService(sessionRepo, programRepo, masterRepo, context),
    attendance: new AttendanceService(attendanceRepo, sessionRepo, memberRepo, masterRepo, context),
    progress: new ProgressService(progressRepo, memberRepo, masterRepo, context),
    event: new EventService(eventRepo, context),
    enquiry: new EnquiryService(enquiryRepo, context)
  };
}

export async function resolveDirectSportsclubContext(
  request: FastifyRequest,
  isPublic: boolean
): Promise<SportsclubContext> {
  // 1. Check for platform authContext
  const authContext = (request as FastifyRequest & { authContext?: { payload?: { email?: string; userType?: string } } }).authContext;
  if (authContext?.payload) {
    const isSuperAdmin = authContext.payload.userType === "super_admin";
    const role = isSuperAdmin ? "super_admin" : (authContext.payload.userType as SportsclubContext["actorRole"]) ?? "student";
    return {
      actorEmail: authContext.payload.email,
      actorRole: role,
      isClubAdmin: isSuperAdmin,
      isSuperAdmin
    };
  }

  // 2. Direct test / custom headers (e.g. x-test-actor, x-test-role, x-actor-email, x-actor-role)
  const actor =
    (request.headers["x-test-actor"] as string | undefined) ??
    (request.headers["x-actor-email"] as string | undefined);
  const rawRole =
    (request.headers["x-test-role"] as string | undefined) ??
    (request.headers["x-actor-role"] as string | undefined);

  if (rawRole) {
    const isSuper = rawRole === "super_admin";
    const isClubAdmin = rawRole === "club_admin" || isSuper;
    return {
      actorEmail: actor,
      actorRole: rawRole as SportsclubContext["actorRole"],
      isClubAdmin,
      isSuperAdmin: isSuper
    };
  }

  // 3. Fallback for public vs authenticated
  return {
    actorEmail: actor,
    actorRole: isPublic ? "anonymous" : "unregistered",
    isClubAdmin: false,
    isSuperAdmin: false
  };
}

export async function registerSportsclubApi(
  app: FastifyInstance,
  options: SportsclubApiOptions = {}
): Promise<void> {
  // preHandler: resolve tenant DB and context
  app.addHook("preHandler", async (request) => {
    const path = request.url ?? "";
    const isPublic = path.includes("/sportsclub/public/");

    // Resolve tenant database
    if (options.resolveDatabase) {
      request.sportsclubDb = await options.resolveDatabase(request);
    } else if (options.database) {
      request.sportsclubDb = options.database;
    } else {
      const requestedDb = request.headers["x-tenant-db"];
      const tenantDbName = resolveSportsclubDatabaseName(
        Array.isArray(requestedDb) ? requestedDb[0] : requestedDb
      );
      request.sportsclubDb = await getSportsclubDatabase(tenantDbName);
    }

    // Resolve context
    if (options.resolveContext) {
      request.sportsclubContext = await options.resolveContext(request, isPublic);
    } else {
      request.sportsclubContext = await resolveDirectSportsclubContext(request, isPublic);
    }
  });

  const getServices = (request: FastifyRequest) => {
    const db = request.sportsclubDb;
    const ctx = request.sportsclubContext ?? {
      actorRole: "anonymous",
      isClubAdmin: false,
      isSuperAdmin: false
    };
    if (!db) {
      throw AppError.internal("Sportsclub database connection unavailable.");
    }
    return createSportsclubServices(db, ctx);
  };

  // 1. Access introspection (matching Billing /billing/access)
  app.get("/sportsclub/access", async (request) => {
    const ctx = request.sportsclubContext ?? {
      actorRole: "anonymous",
      isClubAdmin: false,
      isSuperAdmin: false
    };

    return ok(
      {
        role: ctx.actorRole,
        isClubAdmin: ctx.isClubAdmin,
        isSuperAdmin: ctx.isSuperAdmin,
        canManageMembers: ctx.isClubAdmin || ctx.isSuperAdmin,
        canEvaluateProgress:
          ctx.actorRole === "master" || ctx.isClubAdmin || ctx.isSuperAdmin,
        tenant: "tenkasisports"
      },
      {
        requestId: request.id,
        ...(request.correlationId ? { correlationId: request.correlationId } : {}),
        ...(request.tenantId ? { tenantId: request.tenantId } : {})
      }
    );
  });

  // 2. Deploy-readiness public health probe
  app.get("/sportsclub/public/health", async () => {
    return {
      status: "healthy",
      service: "@codexsun/sportsclub-api",
      tenant: "tenkasisports",
      time: new Date().toISOString()
    };
  });

  // 3. Register all 8 domain module routes
  registerProgramRoutes(app, (req) => getServices(req).program);
  registerMasterRoutes(app, (req) => getServices(req).master);
  registerMemberRoutes(app, (req) => getServices(req).member);
  registerSessionRoutes(app, (req) => getServices(req).session);
  registerAttendanceRoutes(app, (req) => getServices(req).attendance);
  registerProgressRoutes(app, (req) => getServices(req).progress);
  registerEventRoutes(app, (req) => getServices(req).event);
  registerEnquiryRoutes(app, (req) => getServices(req).enquiry);
}

/**
 * Platform Host adapter conforming to SportsclubApiModule.registerSportsclub
 */
export async function registerSportsclub(
  app: FastifyInstance,
  resolveContext: (request: FastifyRequest, isPublic: boolean) => Promise<SportsclubContext>
): Promise<void> {
  return registerSportsclubApi(app, { resolveContext });
}
