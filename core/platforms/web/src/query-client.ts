import { QueryClient } from "@tanstack/react-query";

export function createPlatformQueryClient(): QueryClient {
  return new QueryClient({
    defaultOptions: {
      queries: { retry: 2, staleTime: 15_000, refetchOnWindowFocus: false },
    },
  });
}
