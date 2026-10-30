import type { ListResponse } from "../../sportsclub-pagination.types";

export type SessionStatus = "active" | "cancelled";

export type SessionSavePayload = {
  title: string;
  programUuid: string;
  masterUuid?: string | null | undefined;
  daysOfWeek: string;
  startTime: string;
  endTime: string;
  venue: string;
  maxCapacity?: number | undefined;
  isApprovedPublic?: boolean | undefined;
  status?: SessionStatus | undefined;
  revision?: number | undefined;
};

export type SessionRecord = SessionSavePayload & {
  id?: number | undefined;
  uuid: string;
  programTitle?: string | null | undefined;
  masterName?: string | null | undefined;
  enrolledStudentsCount?: number | undefined;
  maxCapacity: number;
  isApprovedPublic: boolean;
  status: SessionStatus;
  revision: number;
  createdAt: string;
  updatedAt: string;
};

export type SessionPage = ListResponse<SessionRecord>;

export type SessionLookup = {
  uuid: string;
  title: string;
  daysOfWeek: string;
  startTime: string;
  endTime: string;
  venue: string;
  status: SessionStatus;
};

export type SessionColumnFilters = {
  title?: string | undefined;
  daysOfWeek?: string | undefined;
  programUuid?: string | undefined;
  masterUuid?: string | undefined;
  status?: string | undefined;
  venue?: string | undefined;
};
