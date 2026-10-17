import { useQuery } from "@tanstack/react-query";
import type { TconnectGateway } from "../../workspace.types";
export function useCredentialRecords(gateway: TconnectGateway) {
  return useQuery({ queryKey: ["tconnect", "credential"], queryFn: gateway.credential.list });
}
