import { useQuery } from "@tanstack/react-query";
import { useMarketingTransport } from "../../transport";
import { listCaptures } from "./capture.services";
export function useCaptures(search: string, page: number, status = "all") {
  const api = useMarketingTransport();
  return useQuery({
    queryKey: ["marketing", api.scopeKey, "capture", search, page, status],
    queryFn: () => listCaptures(api, search, page * 50, status)
  });
}
