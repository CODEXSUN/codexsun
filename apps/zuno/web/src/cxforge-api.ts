export type CxforgeTaskStatus = "draft" | "queued" | "running" | "review" | "approved" | "rejected" | "blocked" | "failed" | "merged";

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
  readonly changedFiles?: string[];
  readonly testOutput?: string;
  readonly diff?: string;
  readonly mergeRequest?: {
    readonly title: string;
    readonly description: string;
    readonly baseBranch: string;
    readonly sourceBranch: string;
    readonly branchPublished: boolean;
    readonly provider?: string;
    readonly externalId?: string;
    readonly url?: string;
    readonly status: "draft" | "open" | "merged";
  };
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

export type CxforgeRuntimeAction = "build" | "install" | "restart" | "start" | "stop";

export interface CxforgeRuntimeStatus {
  readonly composeFile: string;
  readonly composeVersion?: string;
  readonly container: {
    readonly health?: string;
    readonly id?: string;
    readonly image?: string;
    readonly installed: boolean;
    readonly name: string;
    readonly running: boolean;
    readonly state: "absent" | "exited" | "running" | "unavailable";
  };
  readonly dockerAvailable: boolean;
  readonly dockerVersion?: string;
  readonly projectName: string;
  readonly toolchain: { readonly git?: string; readonly go?: string; readonly node?: string; readonly npm?: string; readonly python?: string };
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

export async function getCxforgeRuntime(baseUrl: string, request: typeof fetch = fetch): Promise<CxforgeRuntimeStatus> {
  return requestJson<CxforgeRuntimeStatus>(request, endpoint(baseUrl, "/api/v1/zuno/cxforge/runtime"));
}

export async function getCxforgeRuntimeLogs(baseUrl: string, request: typeof fetch = fetch): Promise<string[]> {
  const result = await requestJson<{ readonly lines: string[] }>(request, endpoint(baseUrl, "/api/v1/zuno/cxforge/runtime/logs"));
  return result.lines;
}

export async function manageCxforgeRuntime(baseUrl: string, action: CxforgeRuntimeAction, request: typeof fetch = fetch): Promise<CxforgeRuntimeStatus> {
  return requestJson<CxforgeRuntimeStatus>(request, endpoint(baseUrl, `/api/v1/zuno/cxforge/runtime/${action}`), { method: "POST" }, 10 * 60_000);
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

export async function prepareCxforgeMergeRequest(baseUrl: string, taskId: string, request: typeof fetch = fetch): Promise<CxforgeTask> {
  return requestJson<CxforgeTask>(request, endpoint(baseUrl, `/api/v1/zuno/cxforge/tasks/${taskId}/prepare-merge`), { method: "POST" });
}

export async function openCxforgeMergeRequest(baseUrl: string, taskId: string, request: typeof fetch = fetch): Promise<CxforgeTask> {
  return requestJson<CxforgeTask>(request, endpoint(baseUrl, `/api/v1/zuno/cxforge/tasks/${taskId}/open-merge-request`), { method: "POST" });
}

export async function mergeCxforgeTask(baseUrl: string, taskId: string, request: typeof fetch = fetch): Promise<CxforgeTask> {
  return requestJson<CxforgeTask>(request, endpoint(baseUrl, `/api/v1/zuno/cxforge/tasks/${taskId}/merge`), { method: "POST" });
}

export async function updateCxforgeSkills(baseUrl: string, skills: { readonly id: string; readonly enabled: boolean }[], request: typeof fetch = fetch): Promise<CxforgeSkill[]> {
  return requestJson<CxforgeSkill[]>(request, endpoint(baseUrl, "/api/v1/zuno/cxforge/skills"), { body: JSON.stringify({ skills }), headers: { "Content-Type": "application/json" }, method: "PUT" });
}

function endpoint(baseUrl: string, path: string): string {
  return `${baseUrl.replace(/\/$/u, "")}${path}`;
}

async function requestJson<T>(request: typeof fetch, url: string, init?: RequestInit, timeoutMs = 5_000): Promise<T> {
  const response = await request(url, { ...init, signal: AbortSignal.timeout(timeoutMs) });
  if (!response.ok) throw new Error(`CXForge request failed: ${response.status}`);
  return response.json() as Promise<T>;
}
