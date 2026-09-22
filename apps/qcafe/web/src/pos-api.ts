export type PosOrder = {
  business_id: string;
  closed_at: string | null;
  contact_ref: string | null;
  currency: string;
  customer_name: string | null;
  discount_minor: number;
  id: string;
  location_id: string;
  note: string | null;
  number: string;
  price_book_id: string;
  service_channel_id: string;
  status: "cancelled" | "confirmed" | "draft" | "fulfilled" | "held";
  subtotal_minor: number;
  table_session_id: string | null;
  total_minor: number;
  updated_at: string;
};

export type PosLine = {
  id: string;
  item_name: string;
  line_total_minor: number;
  modifier_total_minor: number;
  note: string | null;
  order_id: string;
  quantity_milli: number;
  status: "active" | "voided";
  unit_price_minor: number;
  variant_name: string | null;
};

export type PosWorkspace = {
  adjustments: Array<{ amount_minor: number; id: string; kind: string; order_id: string; reason: string }>;
  events: Array<{ event_type: string; id: string; occurred_at: string; order_id: string; reason: string | null }>;
  fulfillments: Array<{ id: string; kind: string; order_id: string; status: string }>;
  lines: PosLine[];
  modifiers: Array<{ option_name: string; order_line_id: string; price_adjustment_minor: number; quantity: number }>;
  notes: Array<{ content: string; id: string; note_kind: string; order_id: string }>;
  orders: PosOrder[];
  takeawayDetails: Array<{
    collection_name: string;
    contact_ref: string | null;
    fulfillment_job_id: string;
    pickup_code: string;
    pickup_window: string | null;
  }>;
};

export type BookingWorkspace = {
  areas: Array<{ id: string; kind: string; name: string }>;
  tables: Array<{ area_id: string; capacity: number; code: string; id: string; position_label: string | null }>;
  sessions: Array<{
    guest_count: number;
    id: string;
    opened_at: string;
    primary_order_id: string | null;
    status: string;
  }>;
  sessionTables: Array<{ session_id: string; table_id: string }>;
};

export type KitchenWorkspace = {
  stations: Array<{ code: string; id: string; name: string }>;
  routes: Array<{ id: string; item_id: string; priority: number; station_id: string; variant_id: string | null }>;
  tickets: Array<{
    fired_at: string;
    id: string;
    number: string;
    order_id: string;
    ready_at: string | null;
    station_id: string;
    status: string;
  }>;
  lines: Array<{
    id: string;
    order_line_id: string;
    preparation_note: string | null;
    quantity_milli: number;
    status: string;
    ticket_id: string;
  }>;
  events: Array<{ event_type: string; occurred_at: string; ticket_id: string }>;
  printAttempts: Array<{
    attempt_number: number;
    requested_at: string;
    route_ref: string;
    status: string;
    ticket_id: string;
  }>;
};

export type CreatePosOrder = {
  businessId: string;
  collectionName?: string;
  contactRef?: string;
  customerName?: string;
  locationId: string;
  note?: string;
  pickupWindow?: string;
  priceBookId: string;
  serviceChannelId: string;
  tableSessionId?: string;
};

export function readPos(request: typeof fetch, businessId: string, locationId: string): Promise<PosWorkspace> {
  return send(
    request,
    `/api/v1/qcafe/pos?businessId=${encodeURIComponent(businessId)}&locationId=${encodeURIComponent(locationId)}`,
  );
}

export function createPosOrder(request: typeof fetch, input: CreatePosOrder) {
  return send(request, "/api/v1/qcafe/pos/orders", "POST", input);
}

export function addPosLine(request: typeof fetch, orderId: string, input: Record<string, unknown>) {
  return send(request, `/api/v1/qcafe/pos/orders/${orderId}/lines`, "POST", input);
}

export function changePosLine(
  request: typeof fetch,
  orderId: string,
  lineId: string,
  input: { note?: string | null; quantity: number },
) {
  return send(request, `/api/v1/qcafe/pos/orders/${orderId}/lines/${lineId}`, "PUT", input);
}

export function removePosLine(request: typeof fetch, orderId: string, lineId: string) {
  return send(request, `/api/v1/qcafe/pos/orders/${orderId}/lines/${lineId}`, "DELETE");
}

export function runPosAction(request: typeof fetch, orderId: string, action: string, reason?: string) {
  return send(request, `/api/v1/qcafe/pos/orders/${orderId}/${action}`, "POST", { reason });
}

export function addPosAdjustment(
  request: typeof fetch,
  orderId: string,
  input: { amountMinor: number; kind: "discount" | "rounding" | "service_recovery"; reason: string },
) {
  return send(request, `/api/v1/qcafe/pos/orders/${orderId}/adjustments`, "POST", input);
}

export function addPosNote(
  request: typeof fetch,
  orderId: string,
  input: { content: string; noteKind: "guest" | "internal" | "kitchen"; visibility: "guest" | "internal" | "kitchen" },
) {
  return send(request, `/api/v1/qcafe/pos/orders/${orderId}/notes`, "POST", input);
}

export function readBooking(request: typeof fetch, businessId: string, locationId: string) {
  const query = new URLSearchParams({ businessId, locationId });
  return operationRequest<BookingWorkspace>(request, `/api/v1/qcafe/table-service?${query}`);
}

export function changeBooking(request: typeof fetch, path: string, input: Record<string, unknown>) {
  return operationRequest<BookingWorkspace>(request, `/api/v1/qcafe/table-service/${path}`, input);
}

export function readKitchen(request: typeof fetch, businessId: string, locationId: string) {
  const query = new URLSearchParams({ businessId, locationId });
  return operationRequest<KitchenWorkspace>(request, `/api/v1/qcafe/kitchen?${query}`);
}

export function changeKitchen(request: typeof fetch, path: string, input: Record<string, unknown>) {
  return operationRequest<KitchenWorkspace | { ok: true }>(request, `/api/v1/qcafe/kitchen/${path}`, input);
}

async function operationRequest<T>(request: typeof fetch, path: string, body?: Record<string, unknown>): Promise<T> {
  const response = await request(path, {
    body: body ? JSON.stringify(body) : undefined,
    headers: body ? { "Content-Type": "application/json", "X-Correlation-Id": crypto.randomUUID() } : undefined,
    method: body ? "POST" : "GET",
    signal: AbortSignal.timeout(8_000),
  });
  if (!response.ok) {
    const error = (await response.json().catch(() => undefined)) as { error?: string } | undefined;
    throw new Error(error?.error ?? `Q Cafe operation failed: ${response.status}`);
  }
  return response.json() as Promise<T>;
}

async function send(
  request: typeof fetch,
  path: string,
  method: "DELETE" | "GET" | "POST" | "PUT" = "GET",
  body?: Record<string, unknown>,
): Promise<PosWorkspace> {
  const response = await request(path, {
    body: body ? JSON.stringify(body) : undefined,
    headers: body ? { "Content-Type": "application/json", "X-Correlation-Id": crypto.randomUUID() } : undefined,
    method,
    signal: AbortSignal.timeout(8_000),
  });
  if (!response.ok) {
    const error = (await response.json().catch(() => undefined)) as { error?: string } | undefined;
    throw new Error(error?.error ?? `POS request failed: ${response.status}`);
  }
  return response.json() as Promise<PosWorkspace>;
}
