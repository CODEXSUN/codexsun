export type AccountingWorkspace = {
  accounts: Array<{ active: number; code: string; id: string; name: string; type: string }>;
  journals: Array<{ created_at: string; id: string; number: string; posted_at: string | null; source_id: string; source_type: string; status: string }>;
  journalLines: Array<{ account_id: string; credit_minor: number; debit_minor: number; id: string; journal_id: string; memo: string | null; tax_code: string | null }>;
};

export function readAccounting(request: typeof fetch, businessId: string, locationId: string) {
  const query = new URLSearchParams({ businessId, locationId });
  return accountingRequest<AccountingWorkspace>(request, `/api/v1/qcafe/accounting?${query}`);
}

export function changeAccounting(request: typeof fetch, path: string, input: Record<string, unknown> = {}) {
  return accountingRequest<unknown>(request, `/api/v1/qcafe/accounting/${path}`, input);
}

export async function exportJournals(request: typeof fetch, businessId: string, locationId: string): Promise<string> {
  const query = new URLSearchParams({ businessId, locationId, status: "posted" });
  const response = await request(`/api/v1/qcafe/accounting/export?${query}`, { signal: AbortSignal.timeout(8_000) });
  if (!response.ok) throw new Error(`Journal export failed: ${response.status}`);
  return response.text();
}

async function accountingRequest<T>(request: typeof fetch, path: string, body?: Record<string, unknown>): Promise<T> {
  const response = await request(path, {
    body: body ? JSON.stringify(body) : undefined,
    headers: body ? { "Content-Type": "application/json" } : undefined,
    method: body ? "POST" : "GET",
    signal: AbortSignal.timeout(8_000),
  });
  if (!response.ok) {
    const payload = (await response.json().catch(() => undefined)) as { error?: string } | undefined;
    throw new Error(payload?.error ?? `Accounting request failed: ${response.status}`);
  }
  return response.json() as Promise<T>;
}
