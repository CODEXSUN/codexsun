export type EmployeeRoute = { mode: "list" } | { mode: "new" } | { mode: "edit"; id: string };

export function employeeRouteFromPath(pathname: string): EmployeeRoute {
  if (pathname === "/app/hrms/employees/new") return { mode: "new" };
  const edit = /^\/app\/hrms\/employees\/([^/]+)\/edit$/.exec(pathname);
  return edit ? { mode: "edit", id: edit[1]! } : { mode: "list" };
}
