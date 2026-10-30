import { useInfiniteQuery } from "@tanstack/react-query";
import type { TconnectGateway } from "../../workspace.types";
import { loadMessages } from "./message.services";
export const useMessages = (gateway: TconnectGateway, uuid: string) =>
  useInfiniteQuery({
    queryKey: ["tconnect", "message", uuid],
    queryFn: ({ pageParam }) => loadMessages(gateway, uuid, pageParam),
    initialPageParam: null as string | null,
    getNextPageParam: (page) => page.nextBefore,
    refetchInterval: 15000
  });
