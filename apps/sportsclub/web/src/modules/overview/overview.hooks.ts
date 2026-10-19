import { useQuery } from "@tanstack/react-query";
import {
  getMasterPortalMe,
  getSportsclubOverview,
  getStudentPortalMe
} from "./overview.services";

export const overviewQueryKeys = {
  summary: ["sportsclub", "overview", "summary"] as const,
  studentPortal: ["sportsclub", "portal", "student"] as const,
  masterPortal: ["sportsclub", "portal", "master"] as const
};

export function useSportsclubOverview() {
  return useQuery({
    queryKey: overviewQueryKeys.summary,
    queryFn: getSportsclubOverview,
    refetchInterval: 30_000
  });
}

export function useStudentPortalMe(enabled = true) {
  return useQuery({
    queryKey: overviewQueryKeys.studentPortal,
    queryFn: getStudentPortalMe,
    enabled,
    refetchInterval: 30_000
  });
}

export function useMasterPortalMe(enabled = true) {
  return useQuery({
    queryKey: overviewQueryKeys.masterPortal,
    queryFn: getMasterPortalMe,
    enabled,
    refetchInterval: 30_000
  });
}
