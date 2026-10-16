import { useQuery } from "@tanstack/react-query";
import {
  listZetroGrants,
  listZetroInteractions,
  listZetroPatterns,
  listZetroRoles,
  listZetroTenants
} from "./admin.services";

export const zetroAdminKey = ["zetro", "admin"] as const;
export const zetroAdminPatternsKey = (tenantId: string) =>
  [...zetroAdminKey, tenantId, "patterns"] as const;
export const zetroAdminGrantsKey = (tenantId: string) =>
  [...zetroAdminKey, tenantId, "grants"] as const;

export function useZetroAdminTenants() {
  return useQuery({ queryKey: [...zetroAdminKey, "tenants"], queryFn: listZetroTenants });
}

export function useZetroAdminPatterns(tenantId: string) {
  return useQuery({
    queryKey: zetroAdminPatternsKey(tenantId),
    queryFn: () => listZetroPatterns(tenantId),
    enabled: Boolean(tenantId)
  });
}

export function useZetroAdminInteractions(tenantId: string) {
  return useQuery({
    queryKey: [...zetroAdminKey, tenantId, "interactions"],
    queryFn: () => listZetroInteractions(tenantId),
    enabled: Boolean(tenantId),
    refetchInterval: 15_000
  });
}

export function useZetroAdminGrants(tenantId: string) {
  return useQuery({
    queryKey: zetroAdminGrantsKey(tenantId),
    queryFn: () => listZetroGrants(tenantId)
  });
}

export function useZetroAdminRoles(tenantId: string) {
  return useQuery({
    queryKey: [...zetroAdminKey, tenantId, "roles"],
    queryFn: () => listZetroRoles(tenantId)
  });
}
