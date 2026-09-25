export type Task = {
  id: string;
  title: string;
  prompt: string;
  skill: string;
  count: number;
  maxRuns: number;
  enabled: boolean;
  intervalMinutes: number | null;
};
export type Run = { id: string; taskId: string; status: string; answer: string; error: string; startedAt: number };
export type Event = { id: string; event: string; at: number; taskId?: string };
export type Status = {
  ollama: boolean;
  qdrant: boolean;
  modelReady: boolean;
  embeddingsReady: boolean;
  model: string;
  active: string | null;
  queued: string[];
};

export async function request<T>(token: string, path: string, body?: unknown): Promise<T> {
  const response = await fetch(`/api/v1/agentcrew${path}`, {
    method: body === undefined ? "GET" : "POST",
    headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
    ...(body === undefined ? {} : { body: JSON.stringify(body) }),
    signal: AbortSignal.timeout(90000),
  });
  const result = await response.json();
  if (!response.ok) throw new Error(result.error ?? "Request failed.");
  return result as T;
}
