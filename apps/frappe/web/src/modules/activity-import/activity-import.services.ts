import { frappeRequest } from "../../frappe-request";
import type { FrappeActivityPage } from "./activity-import.types";

export const getFrappeActivities = (page: number) =>
  frappeRequest<FrappeActivityPage>("GET", `/frappe/activities/remote?page=${page}`);
export const pullFrappeActivity = (remoteName: string) =>
  frappeRequest<{ remoteName: string; localId: number; status: string }>(
    "POST",
    "/frappe/activities/pull",
    { remoteName }
  );
