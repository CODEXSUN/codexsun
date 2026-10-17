import { useQuery } from "@tanstack/react-query";
import type { TconnectGateway } from "../../workspace.types";
export function useAssociationRecords(gateway: TconnectGateway) {
  return useQuery({ queryKey: ["tconnect", "association"], queryFn: gateway.association.list });
}
