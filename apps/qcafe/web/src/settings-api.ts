export type DatabaseSettings = {
  connectionSource: "environment";
  driver: "mariadb" | "sqlite";
  engine: "MariaDB" | "SQLite";
  lifecycleRecords: number;
  mode: "cloud" | "local";
  status: "ready" | "unavailable";
  storageLabel: string;
  verifiedAt: string;
};
export type CloudSyncSettings = {
  available: boolean;
  enabled: boolean;
  reason: string | null;
  targetLabel: string | null;
  updatedAt: string | null;
};
export type ConnectorKind = "accounting" | "delivery" | "marketplace" | "messaging" | "payment" | "storage";
export type Connector = {
  code: string;
  enabled: boolean;
  endpointLabel: string | null;
  id: string;
  kind: ConnectorKind;
  name: string;
  secretReference: string | null;
  status: "configured" | "not_configured";
  updatedAt: string;
};

export function readDatabaseSettings(request: typeof fetch): Promise<DatabaseSettings> { return send(request, "/api/v1/qcafe/settings/database"); }
export function verifyDatabaseSettings(request: typeof fetch): Promise<DatabaseSettings> { return send(request, "/api/v1/qcafe/settings/database/verify", {}, "POST"); }
export function readCloudSyncSettings(request: typeof fetch): Promise<CloudSyncSettings> { return send(request, "/api/v1/qcafe/settings/cloud-sync"); }
export function updateCloudSyncSettings(request: typeof fetch, enabled: boolean): Promise<CloudSyncSettings> { return send(request, "/api/v1/qcafe/settings/cloud-sync", { enabled }, "PUT"); }
export function readConnectors(request: typeof fetch): Promise<{ connectors: Connector[] }> { return send(request, "/api/v1/qcafe/settings/connectors"); }
export function createConnector(request: typeof fetch, input: { code: string; endpointLabel?: string; kind: ConnectorKind; name: string; secretReference?: string }): Promise<{ connectors: Connector[] }> { return send(request, "/api/v1/qcafe/settings/connectors", input, "POST"); }
export function setConnectorEnabled(request: typeof fetch, connectorId: string, enabled: boolean): Promise<{ connectors: Connector[] }> { return send(request, `/api/v1/qcafe/settings/connectors/${connectorId}`, { enabled }, "PUT"); }

async function send<T>(request: typeof fetch, path: string, body?: Record<string, unknown>, method?: "POST" | "PUT"): Promise<T> {
  const response = await request(path, {
    body: body ? JSON.stringify(body) : undefined,
    headers: body ? { "Content-Type": "application/json", "X-Correlation-Id": createRandomId() } : undefined,
    method: method ?? "GET",
    signal: AbortSignal.timeout(8_000),
  });
  if (!response.ok) {
    const error = (await response.json().catch(() => undefined)) as { error?: string } | undefined;
    throw new Error(error?.error ?? `Settings request failed: ${response.status}`);
  }
  return response.json() as Promise<T>;
}
import { createRandomId } from "@codexsun/ui/lib/random-id";
