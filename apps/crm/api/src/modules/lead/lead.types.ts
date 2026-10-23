import type { Kysely } from "kysely";
export type LeadDatabase = Record<string, Record<string, unknown>>;
export type LeadIntake = {
  submissionUuid: string;
  campaignUuid: string;
  campaignLabel: string;
  name: string;
  email: string;
  phone: string;
  message: string;
  source: string;
};
export type LeadRecord = LeadIntake & {
  uuid: string;
  companyId: number;
  assignedTo: string;
  status: "review";
  taskId: number | null;
};
export type LeadContext = {
  database: Kysely<LeadDatabase>;
  companyId: number;
  actorEmail: string;
  authorize: (permission: string) => Promise<void>;
};
