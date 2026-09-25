export type InventoryWorkspace = {
  units: Array<{ active: number; code: string; id: string; name: string; symbol: string | null }>;
  items: Array<{ active: number; code: string; id: string; name: string; reorder_level_milli: number; track_stock: number; unit_id: string }>;
  adjustments: Array<{ id: string; occurred_at: string; reason: string }>;
  movements: Array<{ id: string; movement_type: string; occurred_at: string; quantity_milli: number; reason: string; source_id: string; source_type: string; stock_item_id: string }>;
  balances: Array<{ quantityMilli: number; stockItemId: string }>;
  availability: Array<{ availableMilli: number; onHandMilli: number; reservedMilli: number; stockItemId: string }>;
  recipes: Array<{ code: string; effective_from: string; effective_to: string | null; id: string; menu_item_id: string; menu_variant_id: string | null; name: string; revision_no: number; source_recipe_id: string | null; status: string }>;
  recipeComponents: Array<{ id: string; note: string | null; quantity_milli: number; recipe_id: string; stock_item_id: string }>;
  plans: Array<{ id: string; note: string | null; plan_date: string; status: string }>;
  planLines: Array<{ demand_ref: string | null; demand_source: string; id: string; menu_item_id: string; plan_id: string; quantity_milli: number }>;
  reservations: Array<{ id: string; quantity_milli: number; source_id: string; source_type: string; status: string; stock_item_id: string }>;
  purchaseOrders: Array<{ id: string; status: string; supplier_ref: string | null }>;
  purchaseOrderLines: Array<{ id: string; po_id: string; quantity_milli: number; received_milli: number; stock_item_id: string }>;
  receipts: Array<{ id: string; po_id: string; received_at: string }>;
  receiptLines: Array<{ id: string; lot_id: string | null; po_line_id: string; quantity_milli: number; receipt_id: string; stock_item_id: string }>;
  lots: Array<{ expires_at: string | null; id: string; lot_code: string; stock_item_id: string }>;
  counts: Array<{ id: string; counted_at: string; reason: string }>;
  countLines: Array<{ counted_milli: number; count_id: string; expected_milli: number; stock_item_id: string; variance_milli: number }>;
  wasteEvents: Array<{ approved_by: string; id: string; occurred_at: string; quantity_milli: number; reason: string; stock_item_id: string }>;
  consumptions: Array<{ id: string; occurred_at: string; portions: number; recipe_id: string; source_id: string; source_type: string }>;
};

export function readInventory(request: typeof fetch, businessId: string, locationId: string) {
  const query = new URLSearchParams({ businessId, locationId });
  return inventoryRequest<InventoryWorkspace>(request, `/api/v1/qcafe/inventory?${query}`);
}

export function changeInventory(request: typeof fetch, path: string, input: Record<string, unknown> = {}) {
  return inventoryRequest<unknown>(request, `/api/v1/qcafe/inventory/${path}`, input);
}

async function inventoryRequest<T>(request: typeof fetch, path: string, body?: Record<string, unknown>): Promise<T> {
  const response = await request(path, {
    body: body ? JSON.stringify(body) : undefined,
    headers: body ? { "Content-Type": "application/json" } : undefined,
    method: body ? "POST" : "GET",
    signal: AbortSignal.timeout(8_000),
  });
  if (!response.ok) {
    const payload = (await response.json().catch(() => undefined)) as { error?: string } | undefined;
    throw new Error(payload?.error ?? `Inventory request failed: ${response.status}`);
  }
  return response.json() as Promise<T>;
}
