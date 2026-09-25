export type MarketplaceWorkspace = {
  partners: Array<{ adapter_contract: string; code: string; id: string; name: string; status: string }>;
  mappings: Array<{ id: string; menu_item_id: string; menu_variant_id: string | null; partner_id: string; partner_item_ref: string }>;
  intakes: Array<{ currency: string; id: string; partner_id: string; partner_order_ref: string; pos_order_id: string | null; status: string; total_minor: number }>;
  intakeLines: Array<{ id: string; intake_id: string; mapping_id: string | null; partner_item_ref: string; quantity: number; unit_price_minor: number }>;
  events: Array<{ event_type: string; id: string; intake_id: string; occurred_at: string }>;
  fulfillments: Array<{ delivered_at: string | null; id: string; intake_id: string; partner_collected_minor: number; partner_fee_minor: number; picked_at: string | null; rider_ref: string | null; status: string }>;
  settlements: Array<{ fee_minor: number; gross_minor: number; id: string; net_minor: number; partner_id: string; period_from: string; period_to: string; status: string }>;
};

export function readMarketplace(request: typeof fetch, businessId: string, locationId: string) {
  const query = new URLSearchParams({ businessId, locationId });
  return marketplaceRequest<MarketplaceWorkspace>(request, `/api/v1/qcafe/marketplace?${query}`);
}

export function changeMarketplace(request: typeof fetch, path: string, input: Record<string, unknown> = {}) {
  return marketplaceRequest<unknown>(request, `/api/v1/qcafe/marketplace/${path}`, input);
}

export function readReconciliation(request: typeof fetch, intakeId: string) {
  return marketplaceRequest<Record<string, unknown>>(request, `/api/v1/qcafe/marketplace/intakes/${intakeId}/reconciliation`);
}

async function marketplaceRequest<T>(request: typeof fetch, path: string, body?: Record<string, unknown>): Promise<T> {
  const response = await request(path, {
    body: body ? JSON.stringify(body) : undefined,
    headers: body ? { "Content-Type": "application/json" } : undefined,
    method: body ? "POST" : "GET",
    signal: AbortSignal.timeout(8_000),
  });
  if (!response.ok) {
    const payload = (await response.json().catch(() => undefined)) as { error?: string } | undefined;
    throw new Error(payload?.error ?? `Marketplace request failed: ${response.status}`);
  }
  return response.json() as Promise<T>;
}
