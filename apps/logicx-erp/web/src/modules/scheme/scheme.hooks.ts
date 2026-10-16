import { keepPreviousData, useQuery } from "@tanstack/react-query";
import type { LogicxErpSchemeGateway } from "./scheme.services";
import type { LogicxErpSchemeFilters } from "./scheme.types";

export const logicxErpSchemesQueryKey = ["logicx-erp", "schemes"] as const;

export const useLogicxErpSchemes = (
  gateway: LogicxErpSchemeGateway,
  filters: LogicxErpSchemeFilters
) =>
  useQuery({
    queryKey: [...logicxErpSchemesQueryKey, "list", filters],
    queryFn: () => gateway.list(filters),
    placeholderData: keepPreviousData
  });

export const useLogicxErpScheme = (gateway: LogicxErpSchemeGateway, id: string | null) =>
  useQuery({
    queryKey: [...logicxErpSchemesQueryKey, "record", id],
    queryFn: () => {
      if (!id) throw new Error("Scheme is not selected.");
      return gateway.get(id);
    },
    enabled: Boolean(id)
  });

export const useLogicxErpSchemeActivity = (gateway: LogicxErpSchemeGateway, id: string) =>
  useQuery({
    queryKey: [...logicxErpSchemesQueryKey, "activity", id],
    queryFn: () => gateway.activity(id)
  });

export const useLogicxErpSchemeLookups = (gateway: LogicxErpSchemeGateway) =>
  useQuery({
    queryKey: [...logicxErpSchemesQueryKey, "lookups"],
    queryFn: gateway.lookups,
    staleTime: 60_000
  });

export const useLogicxErpSchemeInvoices = (gateway: LogicxErpSchemeGateway, search: string) =>
  useQuery({
    queryKey: [...logicxErpSchemesQueryKey, "invoices", search.trim()],
    queryFn: () => gateway.invoices(search),
    placeholderData: keepPreviousData,
    staleTime: 30_000
  });
