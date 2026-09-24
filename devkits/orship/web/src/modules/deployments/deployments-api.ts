export type Provider = { id: string; name: string; kind: string; baseUrl: string; accessTokenReference: string; status: string };
export type Target = { id: string; name: string; address: string; status: string; production: boolean };
export type Application = { id: string; name: string; target_id: string; provider_application_id?: string; status: string; source_json: string };
export type Deployment = { id: string; application_id: string; operation: string; status: string; provider_deployment_id?: string; message?: string; created_at?: string };
export type EnvironmentRecord = { name: string; variables: { name: string; secretReference?: string; hasValue?: boolean }[] };

async function read<T>(request: typeof fetch, path: string, init?: RequestInit): Promise<T> {
  const response = await request(path, { ...init, signal: init?.signal ?? AbortSignal.timeout(20_000) });
  if (!response.ok) {
    const body = await response.json().catch(() => undefined) as { error?: string } | undefined;
    throw new Error(body?.error ?? `Deployment request failed: ${response.status}`);
  }
  return response.json() as Promise<T>;
}

export const fetchProviders = (request: typeof fetch) => read<{ providers: Provider[] }>(request, "/api/v1/orship/deployment/providers");
export const fetchTargets = (request: typeof fetch) => read<{ targets: Target[] }>(request, "/api/v1/orship/deployment/targets");
export const fetchApplications = (request: typeof fetch) => read<{ applications: Application[] }>(request, "/api/v1/orship/deployment/applications");
export const fetchDeployments = (request: typeof fetch) => read<{ deployments: Deployment[] }>(request, "/api/v1/orship/deployment/deployments");
export const fetchApplicationEnvironments = (request: typeof fetch, id: string) => read<{ environments: unknown[] }>(request, `/api/v1/orship/deployment/applications/${id}/environments`);
export const fetchDeploymentLogs = (request: typeof fetch, id: string) => read<{ logs: { message: string; level?: string; timestamp?: string }[] }>(request, `/api/v1/orship/deployment/deployments/${id}/logs?tail=200`);
export const syncTargets = (request: typeof fetch) => read<{ targets: Target[] }>(request, "/api/v1/orship/deployment/targets/sync", { method: "POST" });
export const checkProviderHealth = (request: typeof fetch, id: string) => read<{ status: string; message: string; checkedAt: string }>(request, `/api/v1/orship/deployment/providers/${id}/health`);
export const createDeployment = (request: typeof fetch, applicationId: string, operation: "deploy" | "redeploy" | "rollback") => read<{ deployment: Deployment }>(request, "/api/v1/orship/deployment/deployments", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ applicationId, operation }) });
export const createProvider = (request: typeof fetch, input: { name: string; kind: "dokploy"; baseUrl: string; accessTokenReference: string }) => read<{ provider: Provider }>(request, "/api/v1/orship/deployment/providers", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify(input) });
export const createApplication = (request: typeof fetch, input: { name: string; targetId: string; source: { type: "docker" | "compose" | "git"; image?: string; repository?: string; branch?: string; composeFile?: string } }) => read<{ application: Application }>(request, "/api/v1/orship/deployment/applications", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify(input) });
export const saveEnvironment = (request: typeof fetch, id: string, input: { name: string; variables: { name: string; secretReference?: string; value?: string }[] }) => read<{ environment: EnvironmentRecord }>(request, `/api/v1/orship/deployment/applications/${id}/environments`, { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify(input) });
