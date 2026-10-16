export type DesignationStatus = "active" | "inactive";
export type DesignationInput = {
  name: string;
  description: string;
  status: DesignationStatus;
};
export type DesignationRecord = DesignationInput & {
  id: string;
  deletedAt: string | null;
  createdAt: string;
  updatedAt: string;
};
export type DesignationActivity = {
  id: string;
  action: string;
  actorEmail: string;
  summary: string;
  createdAt: string;
};
export type DesignationFilters = {
  search: string;
  status: "all" | DesignationStatus;
  deleted: boolean;
};
export type DesignationRoute = { mode: "list" } | { mode: "new" } | { mode: "edit"; id: string };
