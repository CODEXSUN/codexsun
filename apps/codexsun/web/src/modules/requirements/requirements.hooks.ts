import { useQuery } from "@tanstack/react-query";
import {
  getCodexsunContext,
  getRequirementActivity,
  listRequirements,
  type CodexsunGateway
} from "./requirements.services";
import type { RequirementsFilter } from "./requirements.types";
export function useCodexsunContext(gateway: CodexsunGateway) {
  const query = useQuery({
    queryKey: ["codexsun", "context", gateway.sessionKey],
    queryFn: () => getCodexsunContext(gateway),
    staleTime: 0
  });
  return { ...query, data: isCodexsunAccessError(query.error) ? undefined : query.data };
}

export function isCodexsunAccessError(error: unknown): boolean {
  if (!error || typeof error !== "object" || !("statusCode" in error)) return false;
  return error.statusCode === 401 || error.statusCode === 403;
}
export function useRequirements(
  gateway: CodexsunGateway,
  filter: RequirementsFilter,
  enabled: boolean,
  scope: string
) {
  return useQuery({
    queryKey: ["codexsun", "requirements", gateway.sessionKey, scope, filter],
    queryFn: () => listRequirements(gateway, filter),
    enabled,
    staleTime: 0
  });
}
export function useRequirementActivity(
  gateway: CodexsunGateway,
  uuid: string | undefined,
  scope: string
) {
  return useQuery({
    queryKey: ["codexsun", "requirements", gateway.sessionKey, scope, "activity", uuid],
    queryFn: () => getRequirementActivity(gateway, uuid!),
    enabled: Boolean(uuid)
  });
}
