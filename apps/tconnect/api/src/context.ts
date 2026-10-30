import "@codexsun/framework/api";
import type { Kysely } from "kysely";
import type { FastifyRequest } from "fastify";
export type TconnectDatabase = Record<string, never>;
export type TconnectContext = {
  database: Kysely<TconnectDatabase>;
  actor: string;
  userUuid?: string;
  member?: {
    uuid: string;
    companyUuid: string;
    associationUuid: string | null;
    membershipStatus: string;
  } | null;
  buyer?: {
    uuid: string;
    name: string;
    email: string;
    businessName: string;
    city: string;
    phone: string;
    status: "active" | "inactive";
  } | null;
  provisionBuyerIdentity?: TconnectContext["provisionIdentity"];
  corporateId?: string;
  registrationFingerprint?: string;
  provisionIdentity?: (
    database: Kysely<TconnectDatabase>,
    input: { name: string; email: string; password: string }
  ) => Promise<string>;
  authorize: (permission: string) => Promise<void>;
};
export type ResolveTconnectContext = (
  request: FastifyRequest,
  publicAccess: boolean
) => Promise<TconnectContext>;
