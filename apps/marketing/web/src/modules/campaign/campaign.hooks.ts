import { useQuery } from "@tanstack/react-query";
import { useMarketingTransport } from "../../transport";
import { listCampaigns } from "./campaign.services";
export function useCampaigns(search: string, page: number, status = "all") {
  const api = useMarketingTransport();
  return useQuery({
    queryKey: ["marketing", api.scopeKey, "campaign", search, page, status],
    queryFn: () => listCampaigns(api, search, page * 50, status)
  });
}
