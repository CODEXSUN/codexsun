import type { FastifyRequest } from "fastify";
import type { Kysely } from "kysely";

export type QCafeDatabase = Record<string, Record<string, unknown>>;
export type QCafeContext = {
  database: Kysely<QCafeDatabase>;
  tenantId: string;
  actorEmail: string;
  authorize: (permission: string) => Promise<void>;
};
export type QCafeDependencies = {
  resolveContext: (request: FastifyRequest) => Promise<QCafeContext>;
  masterImageDirectory?: (tenantId: string) => string;
};
