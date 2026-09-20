export type OrshipInfraDetail = {
  readonly connectionStrength: string;
  readonly containerName: string;
  readonly endpoint: string;
  readonly image: string;
  readonly latencyMs: number;
  readonly port: number;
  readonly ports: string;
  readonly rootPasswordHidden: string;
  readonly rootUser: string;
};

export type OrshipInfraLog = {
  readonly line: string;
  readonly level: "info" | "warning";
  readonly time: string;
};

export type OrshipInfraMetric = {
  readonly label: string;
  readonly percent?: number;
  readonly series: number[];
  readonly value: string;
};

export type OrshipInfraRecord = {
  readonly composeYaml: string;
  readonly description: string;
  readonly detail: OrshipInfraDetail;
  readonly id: number;
  readonly kind: "infras";
  readonly logs: OrshipInfraLog[];
  readonly metrics: OrshipInfraMetric[];
  readonly name: string;
  readonly status: string;
  readonly summary: string;
  readonly uuid: string;
};

export type CreateInfraInput = {
  readonly composeYaml: string;
  readonly containerName: string;
  readonly description: string;
  readonly image: string;
  readonly name: string;
  readonly port: number;
  readonly ports: string;
  readonly rootUser: string;
  readonly summary: string;
};

export type DockerContainerPort = {
  readonly ip?: string;
  readonly privatePort: number;
  readonly publicPort?: number;
  readonly type: string;
};

export type DockerContainer = {
  readonly id: string;
  readonly image: string;
  readonly name: string;
  readonly ports: DockerContainerPort[];
  readonly state: string;
  readonly status: string;
};

export type DockerContainerAction = "start" | "stop" | "restart";

export type MariaDBSample = {
  readonly backupVolume: string;
  readonly containerPort: string;
  readonly dataVolume: string;
  readonly database: string;
  readonly hostIp: string;
  readonly hostPort: string;
  readonly image: string;
  readonly name: string;
  readonly network: string;
  readonly restartPolicy: string;
};

export type DockerContainerMetrics = {
  readonly blockReadBytes: number;
  readonly blockWriteBytes: number;
  readonly collectedAt: string;
  readonly cpuPercent: number;
  readonly memoryLimitBytes: number;
  readonly memoryPercent: number;
  readonly memoryUsageBytes: number;
  readonly networkRxBytes: number;
  readonly networkTxBytes: number;
};

export type DockerContainerSnapshot = {
  readonly container: DockerContainer;
  readonly logs: string[];
  readonly metrics: DockerContainerMetrics;
};

export async function fetchInfras(request: typeof fetch): Promise<OrshipInfraRecord[]> {
  const response = await request("/api/v1/orship/infras", { signal: AbortSignal.timeout(5_000) });
  if (!response.ok) throw new Error(`Infras request failed: ${response.status}`);
  const body = await response.json() as { infras: OrshipInfraRecord[] };
  return body.infras;
}

export async function fetchInfra(request: typeof fetch, uuid: string): Promise<OrshipInfraRecord> {
  const response = await request(`/api/v1/orship/infras/${uuid}`, { signal: AbortSignal.timeout(5_000) });
  if (!response.ok) throw new Error(`Infra request failed: ${response.status}`);
  const body = await response.json() as { infra: OrshipInfraRecord };
  return body.infra;
}

export async function createInfra(request: typeof fetch, input: CreateInfraInput): Promise<OrshipInfraRecord> {
  const response = await request("/api/v1/orship/infras", {
    body: JSON.stringify(input),
    headers: { "content-type": "application/json" },
    method: "POST",
    signal: AbortSignal.timeout(5_000),
  });
  if (!response.ok) throw new Error(`Create infra request failed: ${response.status}`);
  const body = await response.json() as { infra: OrshipInfraRecord };
  return body.infra;
}

export async function fetchDockerContainers(request: typeof fetch): Promise<DockerContainer[]> {
  const response = await request("/api/v1/orship/docker/containers", { signal: AbortSignal.timeout(10_000) });
  if (!response.ok) throw new Error(await readResponseError(response, "Docker containers request failed"));
  const body = await response.json() as { containers: DockerContainer[] };
  return body.containers;
}

export async function runDockerContainerAction(
  request: typeof fetch,
  id: string,
  action: DockerContainerAction,
): Promise<void> {
  const response = await request(`/api/v1/orship/docker/containers/${id}/${action}`, {
    method: "POST",
    signal: AbortSignal.timeout(20_000),
  });
  if (!response.ok) throw new Error(await readResponseError(response, `Docker ${action} request failed`));
}

export async function fetchDockerSnapshot(request: typeof fetch, id: string): Promise<DockerContainerSnapshot> {
  const response = await request(`/api/v1/orship/docker/containers/${id}/snapshot`, { signal: AbortSignal.timeout(20_000) });
  if (!response.ok) throw new Error(await readResponseError(response, "Docker snapshot request failed"));
  return await response.json() as DockerContainerSnapshot;
}

export async function installMariaDB(request: typeof fetch, action: "install" | "reinstall"): Promise<MariaDBSample> {
  const response = await request(`/api/v1/orship/docker/samples/mariadb/${action}`, {
    method: "POST",
    signal: AbortSignal.timeout(5 * 60_000),
  });
  if (!response.ok) throw new Error(await readResponseError(response, `MariaDB ${action} request failed`));
  const body = await response.json() as { sample: MariaDBSample };
  return body.sample;
}

export async function dropMariaDB(request: typeof fetch): Promise<void> {
  const response = await request("/api/v1/orship/docker/samples/mariadb/drop", {
    method: "POST",
    signal: AbortSignal.timeout(5 * 60_000),
  });
  if (!response.ok) throw new Error(await readResponseError(response, "MariaDB drop request failed"));
}

async function readResponseError(response: Response, fallback: string): Promise<string> {
  const body = await response.json().catch(() => undefined) as { error?: unknown } | undefined;
  return typeof body?.error === "string" ? body.error : `${fallback}: ${response.status}`;
}
