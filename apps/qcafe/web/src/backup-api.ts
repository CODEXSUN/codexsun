export type BackupWorkspace = {
  dataFolders: Array<{ folder_path: string; location_id: string; selected_at: string; selected_by: string }>;
  backupSchedules: Array<{ active: number; frequency: string; id: string; name: string; retain_count: number }>;
  backups: Array<{ checksum: string; created_at: string; file_ref: string; id: string; schedule_id: string | null; size_bytes: number; status: string }>;
  restoreChecks: Array<{ backup_id: string; checked_at: string; detail: string | null; id: string; status: string }>;
};

export function readBackup(request: typeof fetch, businessId: string, locationId: string) {
  const query = new URLSearchParams({ businessId, locationId });
  return backupRequest<BackupWorkspace>(request, `/api/v1/qcafe/backup?${query}`);
}

export function changeBackup(request: typeof fetch, path: string, input: Record<string, unknown> = {}) {
  return backupRequest<unknown>(request, `/api/v1/qcafe/backup/${path}`, input);
}

async function backupRequest<T>(request: typeof fetch, path: string, body?: Record<string, unknown>): Promise<T> {
  const response = await request(path, {
    body: body ? JSON.stringify(body) : undefined,
    headers: body ? { "Content-Type": "application/json" } : undefined,
    method: body ? "POST" : "GET",
    signal: AbortSignal.timeout(8_000),
  });
  if (!response.ok) {
    const payload = (await response.json().catch(() => undefined)) as { error?: string } | undefined;
    throw new Error(payload?.error ?? `Backup request failed: ${response.status}`);
  }
  return response.json() as Promise<T>;
}
