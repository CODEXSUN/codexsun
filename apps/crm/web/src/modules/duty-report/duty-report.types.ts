export type DutyReport = {
  id: number;
  assignmentId: number;
  assigneeUserId: number;
  itemTitle: string;
  assigneeName: string;
  performedDate: string;
  actions: string;
  result: "completed" | "blocked";
  frappeSyncStatus: "pending" | "processing" | "failed" | "synced" | null;
  issueDetails: string;
  frequency: string;
  department: string;
  instructions: string;
};

export type DutyReportView = "sop" | "user" | "department" | "frequency";
export type DutyReportGroup = {
  key: string;
  label: string;
  completed: number;
  blocked: number;
  total: number;
};
export type DutyReportDrilldown = {
  sopItemId?: number;
  assigneeId?: number;
  department?: string;
  frequency?: string;
  result?: "completed" | "blocked";
};
