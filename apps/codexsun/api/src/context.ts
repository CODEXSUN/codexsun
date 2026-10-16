import type { FastifyRequest } from "fastify";
import type { Kysely } from "kysely";
import type { RequirementsDatabase } from "./modules/requirements/index.js";
import type { DevicesDatabase } from "./modules/devices/index.js";
import type { CodexsunChange } from "./modules/realtime/index.js";

export type CodexsunDatabase = RequirementsDatabase & DevicesDatabase;
export type CodexsunRequestContext = {
  database: Kysely<CodexsunDatabase>;
  actorEmail: string;
  tenantUuid: string;
  tenantName: string;
  authorize: (permission: string) => Promise<void>;
  can: (permission: string) => Promise<boolean>;
  publishChange?: (change: CodexsunChange) => Promise<void>;
};
export type CodexsunContextResolver = (request: FastifyRequest) => Promise<CodexsunRequestContext>;
