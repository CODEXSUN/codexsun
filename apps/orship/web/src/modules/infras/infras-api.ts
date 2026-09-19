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
  readonly status: "running";
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
