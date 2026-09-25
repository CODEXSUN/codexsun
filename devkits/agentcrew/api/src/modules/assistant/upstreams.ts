import type { Configuration } from "../../config.js";

export class UpstreamError extends Error {
  constructor(readonly status: number) {
    super(`Upstream request failed (${status}). Check connection and model availability.`);
  }
}

export class Upstreams {
  constructor(
    readonly config: Configuration,
    private readonly transport: typeof fetch = fetch,
  ) {}

  async json(path: string, body?: unknown, qdrant = false, signal?: AbortSignal): Promise<Record<string, unknown>> {
    const base = qdrant ? this.config.QDRANT_URL : this.config.OLLAMA_URL;
    const timeout = AbortSignal.timeout(path === "/api/chat" ? 180000 : 20000);
    const response = await this.transport(new URL(path, base), {
      method: body ? "POST" : "GET",
      headers: { "Content-Type": "application/json" },
      ...(body ? { body: JSON.stringify(body) } : {}),
      signal: signal ? AbortSignal.any([signal, timeout]) : timeout,
    });
    if (!response.ok) throw new UpstreamError(response.status);
    return (await response.json()) as Record<string, unknown>;
  }

  async createCollection(name: string, size: number): Promise<void> {
    const response = await this.transport(new URL(`/collections/${name}`, this.config.QDRANT_URL), {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ vectors: { size, distance: "Cosine" } }),
      signal: AbortSignal.timeout(20000),
    });
    if (!response.ok && response.status !== 409) throw new UpstreamError(response.status);
  }

  async upsert(name: string, points: unknown[]): Promise<void> {
    const response = await this.transport(new URL(`/collections/${name}/points?wait=true`, this.config.QDRANT_URL), {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ points }),
      signal: AbortSignal.timeout(20000),
    });
    if (!response.ok) throw new UpstreamError(response.status);
  }

  async status() {
    const [ollama, qdrant] = await Promise.allSettled([
      this.json("/api/tags"),
      this.json("/collections", undefined, true),
    ]);
    const models =
      ollama.status === "fulfilled" ? ((ollama.value.models as { name: string }[]) ?? []).map((m) => m.name) : [];
    const installed = (name: string) => models.includes(name) || models.includes(`${name}:latest`);
    return {
      ollama: ollama.status === "fulfilled",
      qdrant: qdrant.status === "fulfilled",
      modelReady: installed(this.config.AGENTCREW_MODEL),
      embeddingsReady: installed(this.config.AGENTCREW_EMBED_MODEL),
      model: this.config.AGENTCREW_MODEL,
      models,
    };
  }
}

export async function withRetry<T>(
  operation: () => Promise<T>,
  signal: AbortSignal,
  log: () => void,
  pause = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms)),
): Promise<T> {
  for (let attempt = 0; ; attempt++) {
    signal.throwIfAborted();
    try {
      return await operation();
    } catch (error) {
      if (
        signal.aborted ||
        attempt >= 2 ||
        (error instanceof UpstreamError && error.status !== 429 && error.status < 500)
      )
        throw error;
      log();
      await pause(500 * 2 ** attempt + Math.floor(Math.random() * 150));
    }
  }
}
