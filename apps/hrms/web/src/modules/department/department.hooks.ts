import { useQuery } from "@tanstack/react-query";
import type { DepartmentGateway } from "./department.services";
import type { DepartmentFilters } from "./department.types";

export const departmentQueryKey = ["hrms", "departments"] as const;
export const useDepartments = (gateway: DepartmentGateway, filters: DepartmentFilters) =>
  useQuery({
    queryKey: [...departmentQueryKey, "list", filters],
    queryFn: () => gateway.list(filters)
  });
export const useDepartment = (gateway: DepartmentGateway, id: string | null) =>
  useQuery({
    queryKey: [...departmentQueryKey, "detail", id],
    queryFn: () => gateway.get(id!),
    enabled: Boolean(id)
  });
export const useDepartmentActivity = (gateway: DepartmentGateway, id: string | null) =>
  useQuery({
    queryKey: [...departmentQueryKey, "activity", id],
    queryFn: () => gateway.activity(id!),
    enabled: Boolean(id)
  });
