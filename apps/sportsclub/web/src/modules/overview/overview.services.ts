import { sportsclubRequest } from "../../sportsclub-request";
import type { MasterPortalMe, OverviewSummary, StudentPortalMe } from "./overview.types";

export async function getSportsclubOverview(): Promise<OverviewSummary> {
  return sportsclubRequest<OverviewSummary>("/sportsclub/overview");
}

export async function getStudentPortalMe(): Promise<StudentPortalMe> {
  return sportsclubRequest<StudentPortalMe>("/sportsclub/portal/me");
}

export async function getMasterPortalMe(): Promise<MasterPortalMe> {
  return sportsclubRequest<MasterPortalMe>("/sportsclub/portal/master");
}
