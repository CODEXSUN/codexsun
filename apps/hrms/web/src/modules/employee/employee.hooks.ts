import { useQuery } from "@tanstack/react-query";
import type { EmployeeGateway } from "./employee.services";
import type { EmployeeFilters } from "./employee.types";

export const employeeQueryKey = ["hrms", "employees"] as const;
export const useEmployee = (gateway: EmployeeGateway, id: string | null) =>
  useQuery({
    queryKey: [...employeeQueryKey, "detail", id],
    queryFn: () => gateway.get(id!),
    enabled: Boolean(id)
  });
export const useEmployees = (gateway: EmployeeGateway, filters: EmployeeFilters) =>
  useQuery({
    queryKey: [...employeeQueryKey, "list", filters],
    queryFn: () => gateway.list(filters)
  });
export const useEmployeeUsers = (gateway: EmployeeGateway) =>
  useQuery({ queryKey: [...employeeQueryKey, "users"], queryFn: gateway.users });
export const useEmployeeActivity = (gateway: EmployeeGateway, id: string | null) =>
  useQuery({
    queryKey: [...employeeQueryKey, "activity", id],
    queryFn: () => gateway.activity(id!),
    enabled: Boolean(id)
  });
