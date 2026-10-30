import { dutyAssignmentSchema } from "./duty-assignment.schema";
import { crmRequest } from "../../crm-request";
import type { DutyAssignment, DutyAssignmentInput } from "./duty-assignment.types";
export type { DutyAssignment, DutyAssignmentInput } from "./duty-assignment.types";
export const getDutyOptions = () =>
  crmRequest<{
    actorUserId: number | null;
    canCreate: boolean;
    canEdit: boolean;
    canViewAll: boolean;
  }>("/crm/duty-assignments/options");
export const listDuties = () => crmRequest<DutyAssignment[]>("/crm/duty-assignments");
export const listOwnDuties = () => crmRequest<DutyAssignment[]>("/crm/duties");
export const listDutyUsers = () =>
  crmRequest<Array<{ id: number; name: string; email: string }>>("/crm/duty-users");
export const saveDuty = (id: number | undefined, input: DutyAssignmentInput) =>
  crmRequest<DutyAssignment>(`/crm/duty-assignments${id ? `/${id}` : ""}`, {
    method: id ? "PUT" : "POST",
    body: JSON.stringify(dutyAssignmentSchema.parse(input))
  });
