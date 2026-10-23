import type { Kysely } from "kysely";
export type ContactPolicyContext = {
  database: Kysely<Record<string, Record<string, unknown>>>;
  companyId: number;
  actorEmail: string;
  authorize(permission: string): Promise<void>;
};
