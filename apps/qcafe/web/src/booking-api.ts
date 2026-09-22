export type GuestBookingWorkspace = {
  customers: Array<{
    email: string | null;
    id: string;
    name: string;
    phone: string | null;
  }>;
  qrTokens: Array<{
    expires_at: string | null;
    id: string;
    revoked_at: string | null;
    table_id: string;
    valid_from: string;
    version: number;
  }>;
  reservationBills: Array<{
    balance_minor: number;
    number: string;
    order_id: string;
    status: string;
  }>;
  reservationEvents: Array<{
    actor_ref: string;
    event_type: string;
    id: string;
    occurred_at: string;
    reservation_id: string;
  }>;
  reservations: Array<{
    arrival_at: string;
    customer_id: string;
    duration_minutes: number;
    id: string;
    order_id: string | null;
    party_size: number;
    status: string;
    table_session_id: string | null;
  }>;
  reservationTables: Array<{ reservation_id: string; table_id: string }>;
  scannerProfiles: Array<{
    accepted_formats_json: string;
    active: number;
    device_ref: string;
    id: string;
    scan_purpose: string;
  }>;
};

export type EventSalesWorkspace = {
  advances: Array<{
    event_ref: string;
    id: string;
    number: string;
    original_value_minor: number;
    status: string;
  }>;
  bookings: Array<{
    customer_id: string | null;
    ends_at: string;
    guest_count: number;
    id: string;
    lead_id: string;
    starts_at: string;
    status: string;
  }>;
  collections: Array<{ eventBookingId: string; number: string; paid_minor: number; status: string }>;
  followups: Array<{
    completed_at: string | null;
    id: string;
    lead_id: string;
    note: string;
    scheduled_at: string;
  }>;
  leads: Array<{
    customer_id: string | null;
    event_date: string;
    guest_count: number;
    id: string;
    occasion_type: string;
    owner_ref: string;
    status: string;
  }>;
  orders: Array<{ event_booking_id: string; id: string; order_id: string; role: string }>;
  quoteLines: Array<{ description: string; quote_id: string; total_minor: number }>;
  quotes: Array<{
    currency: string;
    event_booking_id: string;
    id: string;
    number: string;
    status: string;
    total_minor: number;
  }>;
  requirements: Array<{
    category: string;
    details: string;
    event_booking_id: string;
    id: string;
    status: string;
  }>;
  schedules: Array<{
    activity: string;
    event_booking_id: string;
    id: string;
    starts_at: string;
    status: string;
  }>;
  tasks: Array<{
    event_booking_id: string;
    id: string;
    owner_ref: string;
    status: string;
    task: string;
  }>;
};

export function readGuestBookings(request: typeof fetch, businessId: string, locationId: string) {
  return operation<GuestBookingWorkspace>(
    request,
    `/api/v1/qcafe/guest-booking?${new URLSearchParams({ businessId, locationId })}`,
  );
}

export function changeGuestBooking(request: typeof fetch, path: string, input: Record<string, unknown>) {
  return operation<unknown>(request, `/api/v1/qcafe/guest-booking/${path}`, input);
}

export function readEventSales(request: typeof fetch, businessId: string, locationId: string) {
  return operation<EventSalesWorkspace>(
    request,
    `/api/v1/qcafe/event-sales?${new URLSearchParams({ businessId, locationId })}`,
  );
}

export function changeEventSales(request: typeof fetch, path: string, input: Record<string, unknown>) {
  return operation<unknown>(request, `/api/v1/qcafe/event-sales/${path}`, input);
}

async function operation<T>(request: typeof fetch, path: string, body?: Record<string, unknown>): Promise<T> {
  const response = await request(path, {
    body: body ? JSON.stringify(body) : undefined,
    headers: body ? { "Content-Type": "application/json", "X-Correlation-Id": createRandomId() } : undefined,
    method: body ? "POST" : "GET",
    signal: AbortSignal.timeout(8_000),
  });
  if (!response.ok) {
    const payload = (await response.json().catch(() => undefined)) as { error?: string } | undefined;
    throw new Error(payload?.error ?? `Booking request failed: ${response.status}`);
  }
  return response.json() as Promise<T>;
}
import { createRandomId } from "@codexsun/ui/lib/random-id";
