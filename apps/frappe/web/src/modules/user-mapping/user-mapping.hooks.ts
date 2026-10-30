import { useQuery } from "@tanstack/react-query";
import {
  getFrappeMappingUsers,
  getUserMappingAudit,
  getUserMappings
} from "./user-mapping.services";

export const userMappingsKey = ["frappe", "user-mappings"] as const;
export const frappeMappingUsersKey = ["frappe", "users"] as const;
export const userMappingAuditKey = ["frappe", "user-mapping-audit"] as const;

export function useUserMappings() {
  return useQuery({ queryKey: userMappingsKey, queryFn: getUserMappings });
}

export function useUserMappingAudit() {
  return useQuery({ queryKey: userMappingAuditKey, queryFn: getUserMappingAudit, retry: false });
}

export function useFrappeMappingUsers() {
  return useQuery({
    queryKey: frappeMappingUsersKey,
    queryFn: getFrappeMappingUsers,
    retry: false
  });
}
