import { useQuery } from "@tanstack/react-query";
import { useMarketingTransport } from "../../transport";
import { listSubmissions } from "./submission.services";
export function useSubmissions(page: number, search = "", status = "all") {
  const api = useMarketingTransport();
  return useQuery({
    queryKey: ["marketing", api.scopeKey, "submission", page, search, status],
    queryFn: () => listSubmissions(api, page, search, status)
  });
}
