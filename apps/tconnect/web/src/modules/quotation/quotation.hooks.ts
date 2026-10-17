import { useQuery } from "@tanstack/react-query";
import type { TconnectGateway } from "../../workspace.types";
import { loadQuotations } from "./quotation.services";
export const useQuotations = (gateway: TconnectGateway, conversationUuid?: string) =>
  useQuery({
    queryKey: ["tconnect", "quotation", conversationUuid ?? "all"],
    queryFn: () => loadQuotations(gateway, conversationUuid),
    refetchInterval: 15000
  });
