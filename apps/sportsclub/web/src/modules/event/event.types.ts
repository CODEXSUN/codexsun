export type EventStatus = "upcoming" | "completed" | "cancelled";

export type EventSavePayload = {
  title: string;
  eventType: "tournament" | "demonstration" | "workshop" | "camp";
  eventDate: string;
  venue: string;
  description: string;
  isApprovedPublic: boolean;
  status: EventStatus;
};

export type EventRecord = EventSavePayload & {
  id: number;
  uuid: string;
  revision: number;
  createdAt: string;
  updatedAt: string;
};

export type EventPage = {
  items: EventRecord[];
  total: number;
};

export type EventColumnFilters = {
  title?: string;
  eventType?: string;
  status?: string;
};
