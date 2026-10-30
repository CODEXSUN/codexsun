import { useQuery } from "@tanstack/react-query";
import type { TconnectGateway } from "../../workspace.types";
export function useCompanyRecords(gateway: TconnectGateway) {
  return useQuery({ queryKey: ["tconnect", "company"], queryFn: gateway.company.list });
}
