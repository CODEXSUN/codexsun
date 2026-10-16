export type EmployeeStatus = "active" | "inactive";
export type EmployeeInput = {
  employeeCode: string;
  name: string;
  email: string;
  phone: string;
  department: string;
  designation: string;
  joiningDate: string | null;
  userId: number | null;
  notes: string;
  status: EmployeeStatus;
};
export type EmployeeRecord = EmployeeInput & {
  id: string;
  userName: string | null;
  userEmail: string | null;
  deletedAt: string | null;
  createdAt: string;
  updatedAt: string;
};
export type EmployeeFilters = { search: string; status: "all" | EmployeeStatus; deleted: boolean };
export type EmployeeColumnKey =
  "name" | "email" | "phone" | "department" | "designation" | "joiningDate" | "userName" | "status";
export type EmployeeColumnFilters = Partial<Record<EmployeeColumnKey, string>>;
export type EmployeeAction = "status" | "remove" | "restore" | "forceDelete";
export type EmployeeUserOption = { id: number; name: string; email: string; status: string };
export type EmployeeActivity = {
  id: string;
  action: string;
  actorEmail: string;
  summary: string;
  createdAt: string;
};
