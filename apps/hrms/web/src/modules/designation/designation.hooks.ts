import { useQuery } from "@tanstack/react-query";
import type { DesignationGateway } from "./designation.services";
import type { DesignationFilters } from "./designation.types";

export const designationQueryKey = ["hrms", "designations"] as const;
export const useDesignations = (gateway: DesignationGateway, filters: DesignationFilters) =>
  useQuery({
    queryKey: [...designationQueryKey, "list", filters],
    queryFn: () => gateway.list(filters)
  });
export const useDesignation = (gateway: DesignationGateway, id: string | null) =>
  useQuery({
    queryKey: [...designationQueryKey, "detail", id],
    queryFn: () => gateway.get(id!),
    enabled: Boolean(id)
  });
export const useDesignationActivity = (gateway: DesignationGateway, id: string | null) =>
  useQuery({
    queryKey: [...designationQueryKey, "activity", id],
    queryFn: () => gateway.activity(id!),
    enabled: Boolean(id)
  });
