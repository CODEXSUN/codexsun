import type { Generated } from "kysely";

export type RequirementPriority = "low" | "normal" | "high" | "urgent";
export type RequirementOrigin = "web" | "desktop" | "mobile";
export type RequirementStatus = "draft" | "awaiting_approval" | "approved" | "rejected";
export type RequirementInput = {
  clientKey: string;
  title: string;
  description: string;
  priority: RequirementPriority;
  origin: RequirementOrigin;
};
export type RequirementRecord = Omit<RequirementInput, "clientKey"> & {
  uuid: string;
  status: RequirementStatus;
  revision: number;
  decisionNote: string;
  createdBy: string;
  createdAt: string;
  updatedAt: string;
};
export type RequirementRow = {
  id: Generated<number>;
  uuid: string;
  client_key: string;
  request_hash: string;
  title: string;
  description: string;
  priority: RequirementPriority;
  origin: RequirementOrigin;
  status: RequirementStatus;
  revision: number;
  decision_note: string;
  created_by: string;
  created_at: string;
  updated_at: string;
};
export type RequirementActivity = {
  uuid: string;
  requirementUuid: string;
  action: "created" | "updated" | "submitted" | "approved" | "rejected";
  revision: number;
  note: string;
  actorEmail: string;
  createdAt: string;
};
export type RequirementActivityRow = {
  id: Generated<number>;
  uuid: string;
  requirement_uuid: string;
  action: RequirementActivity["action"];
  revision: number;
  note: string;
  actor_email: string;
  status: Generated<"active" | "inactive">;
  created_by: Generated<string>;
  updated_at: Generated<string>;
  created_at: string;
};
export type RequirementsDatabase = {
  codexsun_requirements: RequirementRow;
  codexsun_requirement_activity: RequirementActivityRow;
};
export type RequirementListOptions = {
  page: number;
  pageSize: number;
  search?: string | undefined;
  status?: RequirementStatus | undefined;
};
export type RequirementPatch = {
  revision: number;
  title: string;
  description: string;
  priority: RequirementPriority;
};
