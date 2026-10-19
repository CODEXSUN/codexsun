export type SessionStatus = "active" | "inactive";

export type SessionSavePayload = {
  title: string;
  programUuid: string;
  masterUuid: string;
  dayOfWeek: string;
  startTime: string;
  endTime: string;
  venue: string;
  maxCapacity: number;
  status: SessionStatus;
};

export type SessionRecord = SessionSavePayload & {
  id: number;
  uuid: string;
  programTitle?: string | null;
  masterName?: string | null;
  enrolledStudentsCount?: number;
  revision: number;
  createdAt: string;
  updatedAt: string;
};

export type SessionPage = {
  items: SessionRecord[];
  total: number;
};

export type SessionLookup = {
  id: number;
  uuid: string;
  title: string;
  dayOfWeek: string;
  timeSlot: string;
  venue: string;
  status: SessionStatus;
};

export type SessionColumnFilters = {
  title?: string;
  dayOfWeek?: string;
  programUuid?: string;
  masterUuid?: string;
  status?: string;
};
