export type DocumentsWorkspace = {
  documents: Array<{ checksum: string | null; id: string; kind: string; status: string; storage_object_ref: string | null; title: string }>;
  printerProfiles: Array<{ active: number; code: string; config_ref: string | null; id: string; kind: string; name: string }>;
  printerRoutes: Array<{ active: number; document_kind: string; fallback_profile_id: string | null; id: string; location_id: string; priority: number; printer_profile_id: string }>;
  jobs: Array<{ attempt_count: number; document_id: string; id: string; idempotency_key: string | null; printer_profile_id: string; status: string }>;
  attempts: Array<{ attempt_number: number; error: string | null; id: string; job_id: string; requested_at: string; status: string }>;
  previews: Array<{ confirmed_at: string | null; id: string; job_id: string; requested_at: string; status: string }>;
  dispatches: Array<{ adapter_kind: string; decision: string; detail: string | null; endpoint_ref: string | null; id: string; job_id: string }>;
  consents: Array<{ channel: string; customer_ref: string; id: string; status: string }>;
  deliveries: Array<{ channel: string; consent_id: string; destination: string; document_id: string; error: string | null; id: string; provider_reference: string | null; status: string }>;
};

export function readDocuments(request: typeof fetch, businessId: string, locationId: string) {
  const query = new URLSearchParams({ businessId, locationId });
  return documentsRequest<DocumentsWorkspace>(request, `/api/v1/qcafe/documents?${query}`);
}

export function changeDocuments(request: typeof fetch, path: string, input: Record<string, unknown> = {}) {
  const target = path ? `/api/v1/qcafe/documents/${path}` : "/api/v1/qcafe/documents";
  return documentsRequest<unknown>(request, target, input);
}

async function documentsRequest<T>(request: typeof fetch, path: string, body?: Record<string, unknown>): Promise<T> {
  const response = await request(path, {
    body: body ? JSON.stringify(body) : undefined,
    headers: body ? { "Content-Type": "application/json" } : undefined,
    method: body ? "POST" : "GET",
    signal: AbortSignal.timeout(8_000),
  });
  if (!response.ok) {
    const payload = (await response.json().catch(() => undefined)) as { error?: string } | undefined;
    throw new Error(payload?.error ?? `Documents request failed: ${response.status}`);
  }
  return response.json() as Promise<T>;
}
