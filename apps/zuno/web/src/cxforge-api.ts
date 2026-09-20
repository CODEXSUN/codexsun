export type CxforgeTaskStatus = "draft" | "queued" | "running" | "review" | "approved" | "rejected" | "blocked";

export interface CxforgeTask {
  readonly id: string;
  readonly title: string;
  readonly appName: string;
  readonly prompt: string;
  readonly repository: string;
  readonly ownedPaths: string[];
  readonly status: CxforgeTaskStatus;
  readonly createdAt: string;
  readonly report: string;
  readonly previewUrl?: string;
}
export interface CxforgeSkill { readonly id: string; readonly name: string; readonly enabled: boolean; }

export interface CxforgeOverview {
  readonly agents: { readonly id: string; readonly name: string; readonly status: "ready" | "busy" | "offline"; readonly capabilities: string[] }[];
  readonly artifacts: { readonly id: string; readonly name: string; readonly kind: "workspace" | "preview" | "patch" | "report"; readonly status: "ready" | "pending" | "expired" }[];
  readonly components: string[];
  readonly containerId?: string;
  readonly containerName?: string;
  readonly frontEndPortUrl: string;
  readonly latencyMs: number;
  readonly mode: "local-edge";
  readonly previewPorts: number[];
  readonly runnerUrl: string;
  readonly serverId: string;
  readonly skills: CxforgeSkill[];
  readonly tasks: CxforgeTask[];
}

export interface CxforgeHealth {
  readonly status: "ok";
  readonly providers: string[];
}

export interface CreateCxforgeTaskInput {
  readonly title: string;
  readonly appName: string;
  readonly prompt: string;
  readonly repository: string;
  readonly ownedPaths: string[];
}

export async function getCxforgeHealth(baseUrl: string, request: typeof fetch = fetch): Promise<CxforgeHealth> {
  return requestJson<CxforgeHealth>(request, endpoint(baseUrl, "/api/v1/zuno/cxforge/health"));
}

export async function getCxforgeOverview(baseUrl: string, request: typeof fetch = fetch): Promise<CxforgeOverview> {
  return requestJson<CxforgeOverview>(request, endpoint(baseUrl, "/api/v1/zuno/cxforge/overview"));
}

export async function createCxforgeTask(baseUrl: string, input: CreateCxforgeTaskInput, request: typeof fetch = fetch): Promise<CxforgeTask> {
  return requestJson<CxforgeTask>(request, endpoint(baseUrl, "/api/v1/zuno/cxforge/tasks"), {
    body: JSON.stringify(input),
    headers: { "Content-Type": "application/json" },
    method: "POST",
  });
}

export async function queueCxforgeTask(baseUrl: string, taskId: string, request: typeof fetch = fetch): Promise<CxforgeTask> {
  return requestJson<CxforgeTask>(request, endpoint(baseUrl, `/api/v1/zuno/cxforge/tasks/${taskId}/queue`), { method: "POST" });
}

export async function reviewCxforgeTask(baseUrl: string, taskId: string, decision: "approve" | "reject", request: typeof fetch = fetch): Promise<CxforgeTask> {
  return requestJson<CxforgeTask>(request, endpoint(baseUrl, `/api/v1/zuno/cxforge/tasks/${taskId}/${decision}`), { method: "POST" });
}

export async function updateCxforgeSkills(baseUrl: string, skills: { readonly id: string; readonly enabled: boolean }[], request: typeof fetch = fetch): Promise<CxforgeSkill[]> {
  return requestJson<CxforgeSkill[]>(request, endpoint(baseUrl, "/api/v1/zuno/cxforge/skills"), { body: JSON.stringify({ skills }), headers: { "Content-Type": "application/json" }, method: "PUT" });
}

function endpoint(baseUrl: string, path: string): string {
  return `${baseUrl.replace(/\/$/u, "")}${path}`;
}

async function requestJson<T>(request: typeof fetch, url: string, init?: RequestInit): Promise<T> {
  const response = await request(url, { ...init, signal: AbortSignal.timeout(5_000) });
  if (!response.ok) throw new Error(`CXForge request failed: ${response.status}`);
  return response.json() as Promise<T>;
}
