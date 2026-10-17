import { useQuery } from "@tanstack/react-query";
import type { TconnectGateway } from "../../workspace.types";
export function useCommunityRecords(gateway: TconnectGateway) {
  return useQuery({ queryKey: ["tconnect", "community"], queryFn: gateway.community.list });
}
