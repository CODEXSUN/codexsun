import { useQuery } from "@tanstack/react-query";
import type { TconnectGateway } from "../../workspace.types";
import { loadConversations } from "./conversation.services";
export const useConversations = (gateway: TconnectGateway) =>
  useQuery({
    queryKey: ["tconnect", "conversation"],
    queryFn: () => loadConversations(gateway),
    refetchInterval: 15000
  });
