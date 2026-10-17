export type DutyAssignment = {
  id: number;
  sopItemId: number;
  revisionId: number;
  assigneeUserId: number;
  displayOrder: number;
  startDate: string;
  endDate: string | null;
  status: string;
  itemTitle: string;
  department: string;
  frequency: string;
  instructions: string;
  assigneeName: string;
  assigneeEmail: string;
};
export type DutyAssignmentInput = Pick<
  DutyAssignment,
  "sopItemId" | "revisionId" | "assigneeUserId" | "displayOrder" | "startDate" | "endDate"
>;
