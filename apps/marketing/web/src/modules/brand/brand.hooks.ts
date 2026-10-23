import { useQuery } from "@tanstack/react-query";
import { useMarketingTransport } from "../../transport";
import { listBrands } from "./brand.services";
export function useBrands(search: string, page: number, status = "all") {
  const api = useMarketingTransport();
  return useQuery({
    queryKey: ["marketing", api.scopeKey, "brand", search, page, status],
    queryFn: () => listBrands(api, search, page * 50, status)
  });
}
