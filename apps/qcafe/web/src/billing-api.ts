export type BillingWorkspace = {
  bills: Array<{
    balance_minor: number;
    business_id: string;
    currency: string;
    id: string;
    issued_at: string;
    location_id: string;
    number: string;
    order_id: string;
    paid_minor: number;
    payable_minor: number;
    status: string;
    tax_minor: number;
  }>;
  billLines: Array<{ bill_id: string; description: string; id: string; quantity_milli: number; total_minor: number }>;
  billTaxes: Array<{ bill_id: string; id: string; tax_code: string; tax_minor: number }>;
  taxRates: Array<{ active: number; basis_points: number; code: string; id: string; name: string }>;
  paymentMethods: Array<{ active: number; code: string; id: string; kind: string; name: string }>;
  payments: Array<{
    amount_minor: number;
    bill_id: string | null;
    direction: string;
    id: string;
    payment_method_id: string;
    purpose: string;
    received_at: string;
    status: string;
  }>;
  tenderDetails: Array<{ change_minor: number; masked_reference: string | null; payment_id: string }>;
  receipts: Array<{ bill_id: string | null; id: string; issued_at: string; number: string; payment_id: string }>;
  vouchers: Array<{
    customer_ref: string | null;
    event_ref: string | null;
    id: string;
    number: string;
    original_value_minor: number;
    remaining_value_minor: number;
    status: string;
  }>;
  voucherApplications: Array<{ applied_minor: number; bill_id: string; id: string; voucher_id: string }>;
  refunds: Array<{ id: string; original_payment_id: string; reason: string; refund_payment_id: string }>;
  drawers: Array<{ active: number; code: string; id: string; name: string }>;
  cashShifts: Array<{
    business_day_id: string;
    cashier_ref: string;
    id: string;
    opened_at: string;
    opening_float_minor: number;
    status: string;
  }>;
  cashMovements: Array<{ amount_minor: number; cash_shift_id: string; id: string; kind: string; reason: string }>;
  settlements: Array<{
    cash_shift_id: string;
    counted_minor: number;
    expected_minor: number;
    id: string;
    variance_minor: number;
  }>;
  dayCloses: Array<{ business_day_id: string; closed_at: string; id: string; sales_minor: number }>;
};

export function readBilling(request: typeof fetch, businessId: string, locationId: string) {
  const query = new URLSearchParams({ businessId, locationId });
  return billingRequest<BillingWorkspace>(request, `/api/v1/qcafe/billing?${query}`);
}

export function changeBilling(request: typeof fetch, path: string, input: Record<string, unknown> = {}) {
  return billingRequest<unknown>(request, `/api/v1/qcafe/billing/${path}`, input);
}

async function billingRequest<T>(request: typeof fetch, path: string, body?: Record<string, unknown>): Promise<T> {
  const response = await request(path, {
    body: body ? JSON.stringify(body) : undefined,
    headers: body ? { "Content-Type": "application/json" } : undefined,
    method: body ? "POST" : "GET",
    signal: AbortSignal.timeout(8_000),
  });
  if (!response.ok) {
    const payload = (await response.json().catch(() => undefined)) as { error?: string } | undefined;
    throw new Error(payload?.error ?? `Billing request failed: ${response.status}`);
  }
  return response.json() as Promise<T>;
}
