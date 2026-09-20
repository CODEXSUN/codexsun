export interface Server { id: string; name: string; apiUrl: string; }
export interface Repository { id: string; name: string; repository: string; gitConnectionId: string; defaultBranch: string; mirrorStatus: string; commitSha?: string; }
export interface Connection { id: string; name: string; provider: string; secretConfigured: boolean; repositoryPatterns: string[]; permissions: { clone: boolean; pull: boolean; push: boolean }; }
export interface Task {
  id: string; title: string; prompt: string; appName: string; repository: string; ownedPaths: string[]; status: string; createdAt: string; report: string;
  repositoryProfileId?: string; taskRevision?: number; evidenceId?: string; commitSha?: string; baseCommitSha?: string; workspaceResumable?: boolean;
  diff?: string; testOutput?: string; changedFiles?: string[] | null; previewUrl?: string; previewStatus?: string; parentTaskId?: string;
  mergeRequest?: { externalId?: string; url?: string; status: string; sourceBranch: string; baseBranch: string; headSha?: string };
}
export interface Overview {
  containerId?: string; containerName?: string; version?: string; credentialEncryptionConfigured: boolean;
  tasks: Task[]; repositories: Repository[]; gitConnections: Connection[]; controlCapabilities: string[];
  executionProfiles: { id: string; name: string; install: string; test: string; build: string; preview: string }[];
}
export interface Snapshot { state: "ready" | "unavailable" | "configuration required"; lastConfirmedAt?: string; latencyMs?: number; error?: string; issues?: string[]; overview?: Overview; }
export interface Activity {
  snapshot: Snapshot; cursor?: string; eventError?: string;
  events: { id: string; taskId: string; type: string; message: string; createdAt: string }[];
  audit: { messageId?: string; prompt?: string; kind: string; createdAt?: string; decidedAt?: string; actorId?: string; deliveryState?: string; expectedTaskRevision?: number; decision?: string; state?: string; comment?: string }[];
}
export function controlClient(request: typeof fetch) {
  return async <T>(path = "", body?: unknown, method = "POST"): Promise<T> => {
    const response = await request(`${import.meta.env.VITE_ZUNO_API_URL ?? ""}/api/v1/zuno/control/servers${path}`, {
      method: body === undefined ? "GET" : method, signal: AbortSignal.timeout(45000),
      ...(body === undefined ? {} : { body: JSON.stringify(body), headers: { "Content-Type": "application/json" } }),
    });
    if (!response.ok) {
      const error = await response.json().catch(() => ({})) as { error?: string };
      throw new Error(error.error ?? `Zuno request failed (${response.status}).`);
    }
    return response.json() as Promise<T>;
  };
}
export type ControlClient = ReturnType<typeof controlClient>;
export function webUrl(value?: string): string | undefined {
  if (!value) return undefined;
  try { const url = new URL(value); return ["http:", "https:"].includes(url.protocol) && !url.username && !url.password ? url.href : undefined; } catch { return undefined; }
}
