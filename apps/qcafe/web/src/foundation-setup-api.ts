export type QcafeDataMode = "cloud" | "local";

export type FoundationServiceChannel = {
  code: string;
  enabled: boolean;
  id: string;
  kind: "counter" | "dine_in" | "takeaway" | "qr" | "delivery" | "event" | "marketplace";
  name: string;
};

export type FoundationLocation = {
  businessDay: null | {
    businessDate: string;
    closedAt: string | null;
    id: string;
    openedAt: string;
    status: "closed" | "open";
  };
  businessId: string;
  code: string;
  id: string;
  name: string;
  numberSequences: Array<{
    documentKind: "bill" | "event_quote" | "kot" | "order" | "receipt" | "voucher";
    id: string;
    nextValue: number;
    prefix: string;
  }>;
  serviceChannels: FoundationServiceChannel[];
  status: "active" | "inactive";
  timezone: string;
};

export type FoundationSetup = {
  businesses: Array<{
    currency: string;
    id: string;
    legalName: string | null;
    locations: FoundationLocation[];
    name: string;
    timezone: string;
  }>;
  dataMode: QcafeDataMode;
  syncConfigured: boolean;
};

export async function readFoundationSetup(request: typeof fetch): Promise<FoundationSetup> {
  return send(request, "/api/v1/qcafe/foundation/setup");
}

export async function createFoundationBusiness(
  request: typeof fetch,
  input: {
    businessName: string;
    currency: string;
    legalName?: string;
    locationCode: string;
    locationName: string;
    timezone: string;
  },
): Promise<FoundationSetup> {
  return send(request, "/api/v1/qcafe/foundation/businesses", input);
}

export async function createFoundationLocation(
  request: typeof fetch,
  input: { businessId: string; code: string; name: string; timezone: string },
): Promise<FoundationSetup> {
  return send(request, "/api/v1/qcafe/foundation/locations", input);
}

export async function openFoundationBusinessDay(
  request: typeof fetch,
  locationId: string,
  businessDate: string,
): Promise<FoundationSetup> {
  return send(request, `/api/v1/qcafe/foundation/locations/${locationId}/business-days`, { businessDate });
}

async function send(request: typeof fetch, path: string, body?: Record<string, unknown>): Promise<FoundationSetup> {
  const response = await request(path, {
    body: body ? JSON.stringify(body) : undefined,
    headers: body ? { "Content-Type": "application/json", "X-Correlation-Id": crypto.randomUUID() } : undefined,
    method: body ? "POST" : "GET",
    signal: AbortSignal.timeout(8_000),
  });
  if (!response.ok) {
    const error = (await response.json().catch(() => undefined)) as { error?: string } | undefined;
    throw new Error(error?.error ?? `Foundation setup request failed: ${response.status}`);
  }
  return response.json() as Promise<FoundationSetup>;
}
