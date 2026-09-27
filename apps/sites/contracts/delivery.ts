export type DeliveryStatus = "todo" | "in-progress" | "blocked" | "done";
export type ActionReportStatus = "open" | "in-progress" | "blocked" | "resolved";
export type ActionPriority = "low" | "normal" | "high" | "urgent";
export type WorkPlanStage = "brief" | "design" | "content" | "development" | "review" | "launch";

export type DeveloperProfile = {
  id: string;
  name: string;
  role: string;
  focus: string;
  active: boolean;
};

export type WorkPlanItem = {
  id: string;
  clientSlug: string;
  stage: WorkPlanStage;
  title: string;
  details: string;
  status: DeliveryStatus;
  assigneeId?: string;
  dueDate?: string;
  position: number;
  updatedAt: string;
};

export type ActionReport = {
  id: string;
  clientSlug: string;
  title: string;
  summary: string;
  status: ActionReportStatus;
  priority: ActionPriority;
  ownerId?: string;
  createdAt: string;
  updatedAt: string;
};

export type ClientHandoff = {
  clientSlug: string;
  brief: string;
  successCriteria: string[];
  assets: string[];
  accessNotes: string;
  updatedAt: string;
};

export type ClientDeliveryWorkspace = {
  developers: DeveloperProfile[];
  workPlan: WorkPlanItem[];
  actionReports: ActionReport[];
  handoff: ClientHandoff;
};
