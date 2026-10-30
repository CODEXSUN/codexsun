import type { FastifyInstance, FastifyRequest } from "fastify";
import type { Kysely } from "kysely";

export type SportsclubStudentScope = {
  admissionNo?: string;
  batchIds?: number[];
  status: string;
  studentName?: string;
  studentUuid: string;
};

export type SportsclubMasterScope = {
  assignedBatches?: number[];
  masterName?: string;
  masterUuid: string;
  specialization?: string;
  status?: string;
  title?: string;
};

export type PlatformSportsclubContext = {
  actor: string;
  authorize: (resource: string, action: string) => Promise<void>;
  corporateId?: string;
  database: unknown;
  master?: SportsclubMasterScope | null;
  provisionStudentIdentity?: (
    database: unknown,
    input: { email: string; name: string; password: string }
  ) => Promise<string>;
  registrationFingerprint?: string;
  student?: SportsclubStudentScope | null;
  userUuid?: string;
};

export type SportsclubContext = PlatformSportsclubContext;

export type ResolveSportsclubContext = (
  request: FastifyRequest,
  publicAccess: boolean,
  tenkasiPortal?: boolean
) => Promise<SportsclubContext>;

export type SportsclubApiModule = {
  migrateSportsclub?: (database: Kysely<unknown>) => Promise<unknown>;
  registerSportsclub?: (
    app: FastifyInstance,
    resolve: ResolveSportsclubContext
  ) => Promise<void>;
  resolveMasterScope?: (
    database: unknown,
    userUuid: string
  ) => Promise<SportsclubMasterScope | null>;
  resolveStudentScope?: (
    database: unknown,
    userUuid: string
  ) => Promise<SportsclubStudentScope | null>;
  seedSportsclub?: (database: Kysely<unknown>) => Promise<void>;
  seedSportsclubDemo?: (database: Kysely<unknown>) => Promise<void>;
  sportsclubTenantMigrations?: Array<{
    description: string;
    name: string;
  }>;
};
