import type { DepartmentRoute } from "./department.types";

export function departmentRouteFromPath(pathname: string): DepartmentRoute {
  if (pathname === "/app/hrms/departments/new") return { mode: "new" };
  const edit = /^\/app\/hrms\/departments\/([^/]+)\/edit$/.exec(pathname);
  return edit ? { mode: "edit", id: edit[1]! } : { mode: "list" };
}
