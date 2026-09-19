import { useQuery } from "@tanstack/react-query";
import { fetchPlatformHealth, fetchPlatformModules } from "../lib/platform-client";

type RequestFunction = (input: RequestInfo | URL, init?: RequestInit) => Promise<Response>;

export function usePlatformHealth(apiUrl: string | undefined, request?: RequestFunction) {
  return useQuery({
    queryKey: ["platform", "health", apiUrl],
    queryFn: ({ signal }) => fetchPlatformHealth(apiUrl!, request, signal),
    enabled: Boolean(apiUrl),
  });
}

export function usePlatformModules(apiUrl: string | undefined, request?: RequestFunction) {
  return useQuery({
    queryKey: ["platform", "modules", apiUrl],
    queryFn: ({ signal }) => fetchPlatformModules(apiUrl!, request, signal),
    enabled: Boolean(apiUrl),
  });
}
