import type {} from "@codexsun/framework/api";
import type { Kysely } from "kysely";
export type MarketingDatabase = Record<string, Record<string, unknown>>;
export type MarketingContext = {
 database: Kysely<MarketingDatabase>; tenantId: string; companyId: number; actorEmail: string;
 allBrands: boolean; allowedBrands: string[];
 authorize(permission: string): Promise<void>;
};
export type MarketingDependencies = {
 context(request: import("fastify").FastifyRequest): Promise<MarketingContext>;
};
