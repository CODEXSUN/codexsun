import type { DesignationRoute } from "./designation.types";

export function designationRouteFromPath(pathname: string): DesignationRoute {
  if (pathname === "/app/hrms/designations/new") return { mode: "new" };
  const edit = /^\/app\/hrms\/designations\/([^/]+)\/edit$/.exec(pathname);
  return edit ? { mode: "edit", id: edit[1]! } : { mode: "list" };
}
