import { sportsclubRequest } from "../../sportsclub-request";
import type {
  EventColumnFilters,
  EventPage,
  EventRecord,
  EventSavePayload
} from "./event.types";

export async function listEventsPage(options: {
  page: number;
  pageSize: number;
  search: string;
  status?: string;
  columnFilters?: EventColumnFilters;
}): Promise<EventPage> {
  const query = new URLSearchParams({
    page: String(options.page),
    pageSize: String(options.pageSize),
    search: options.search
  });
  if (options.status && options.status !== "all") query.set("status", options.status);
  for (const [key, value] of Object.entries(options.columnFilters ?? {})) {
    if (value?.trim()) query.set(key, value.trim());
  }
  return sportsclubRequest<EventPage>(`/sportsclub/events?${query}`);
}

export async function getEvent(uuid: string): Promise<EventRecord> {
  return sportsclubRequest<EventRecord>(`/sportsclub/events/${uuid}`);
}

export async function createEvent(payload: EventSavePayload): Promise<EventRecord> {
  return sportsclubRequest<EventRecord>("/sportsclub/events", {
    method: "POST",
    body: JSON.stringify(payload)
  });
}

export async function updateEvent(
  uuid: string,
  payload: EventSavePayload,
  revision: number
): Promise<EventRecord> {
  return sportsclubRequest<EventRecord>(`/sportsclub/events/${uuid}`, {
    method: "PUT",
    body: JSON.stringify({ ...payload, revision })
  });
}

export async function deleteEvent(
  uuid: string,
  revision: number
): Promise<{ success: boolean }> {
  return sportsclubRequest<{ success: boolean }>(`/sportsclub/events/${uuid}`, {
    method: "DELETE",
    body: JSON.stringify({ revision })
  });
}
