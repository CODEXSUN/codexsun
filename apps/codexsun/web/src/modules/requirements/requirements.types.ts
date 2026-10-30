export type RequirementPriority = "low" | "normal" | "high" | "urgent";
export type RequirementOrigin = "web" | "desktop" | "mobile";
export type RequirementStatus = "draft" | "awaiting_approval" | "approved" | "rejected";
export type CodexsunSurface = "frontdesk" | "workspace" | "approvals";
export interface RequirementDraftInput {
  clientKey: string;
  title: string;
  description: string;
  priority: RequirementPriority;
  origin: RequirementOrigin;
}
export interface RequirementRecord extends Omit<RequirementDraftInput, "clientKey"> {
  uuid: string;
  status: RequirementStatus;
  revision: number;
  decisionNote: string;
  createdBy: string;
  createdAt: string;
  updatedAt: string;
}
export interface RequirementsPage {
  records: RequirementRecord[];
  total: number;
  page: number;
  pageSize: number;
}
export interface CodexsunContext {
  tenantUuid: string;
  tenantName: string;
  actorEmail: string;
  permissions: Record<string, boolean>;
}
export interface RequirementActivity {
  uuid: string;
  requirementUuid: string;
  action: "created" | "updated" | "submitted" | "approved" | "rejected";
  revision: number;
  note: string;
  actorEmail: string;
  createdAt: string;
}
export interface RequirementsFilter {
  page: number;
  pageSize: number;
  search: string;
  status?: RequirementStatus;
}
