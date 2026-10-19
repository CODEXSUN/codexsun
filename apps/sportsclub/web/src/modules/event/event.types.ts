export type EventStatus = "upcoming" | "ongoing" | "completed" | "cancelled";
export type EventSavePayload = {
  title: string;
  eventType: "demonstration" | "tournament" | "workshop" | "camp";
  description: string;
  eventDate: string;
  endDate: string | null;
  location: string;
  isApprovedPublic: boolean;
  status: EventStatus;
  revision: number;
};
export type EventRecord = EventSavePayload & { uuid: string; createdAt: string; updatedAt: string };
export type EventPage = {
  items: EventRecord[];
  total: number;
  pagination: {
    page: number;
    pageSize: number;
    total: number;
    totalPages: number;
    hasNextPage: boolean;
    hasPreviousPage: boolean;
  } | null;
};
export type EventColumnFilters = {
  eventType?: EventSavePayload["eventType"];
  status?: EventStatus;
};
