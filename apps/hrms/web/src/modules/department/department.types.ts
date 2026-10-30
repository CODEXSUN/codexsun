export type DepartmentStatus = "active" | "inactive";
export type DepartmentInput = {
  name: string;
  description: string;
  status: DepartmentStatus;
};
export type DepartmentRecord = DepartmentInput & {
  id: string;
  deletedAt: string | null;
  createdAt: string;
  updatedAt: string;
};
export type DepartmentActivity = {
  id: string;
  action: string;
  actorEmail: string;
  summary: string;
  createdAt: string;
};
export type DepartmentFilters = {
  search: string;
  status: "all" | DepartmentStatus;
  deleted: boolean;
};
export type DepartmentRoute = { mode: "list" } | { mode: "new" } | { mode: "edit"; id: string };
