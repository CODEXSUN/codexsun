import { useQuery } from "@tanstack/react-query";
import type { TconnectGateway } from "../../workspace.types";
export function useProducts(gateway: TconnectGateway) {
  return useQuery({ queryKey: ["tconnect", "products"], queryFn: gateway.product.list });
}
