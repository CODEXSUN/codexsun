export type SyncWorkspace = {
  devices: Array<{ device_code: string; id: string; last_seen_at: string | null; name: string; platform: string; status: string }>;
  changes: Array<{ actor_ref: string; change_kind: string; device_id: string | null; entity_id: string; entity_type: string; id: string; occurred_at: string; seq: number }>;
  cursors: Array<{ device_id: string; last_seq: number; updated_at: string }>;
  conflicts: Array<{ decided_by: string | null; entity_id: string; entity_type: string; id: string; reason: string; resolution: string | null; status: string }>;
};

export function readSync(request: typeof fetch, businessId: string, locationId: string) {
  const query = new URLSearchParams({ businessId, locationId });
  return syncRequest<SyncWorkspace>(request, `/api/v1/qcafe/sync?${query}`);
}

export function changeSync(request: typeof fetch, path: string, input: Record<string, unknown> = {}) {
  return syncRequest<unknown>(request, `/api/v1/qcafe/sync/${path}`, input);
}

export function readPendingChanges(request: typeof fetch, deviceId: string) {
  return syncRequest<{ changes: SyncWorkspace["changes"]; lastSeq: number }>(request, `/api/v1/qcafe/sync/devices/${deviceId}/pending-changes`);
}

async function syncRequest<T>(request: typeof fetch, path: string, body?: Record<string, unknown>): Promise<T> {
  const response = await request(path, {
    body: body ? JSON.stringify(body) : undefined,
    headers: body ? { "Content-Type": "application/json" } : undefined,
    method: body ? "POST" : "GET",
    signal: AbortSignal.timeout(8_000),
  });
  if (!response.ok) {
    const payload = (await response.json().catch(() => undefined)) as { error?: string } | undefined;
    throw new Error(payload?.error ?? `Sync request failed: ${response.status}`);
  }
  return response.json() as Promise<T>;
}
