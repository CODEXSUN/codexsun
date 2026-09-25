import { createHash } from "node:crypto";
import { UpstreamError, Upstreams } from "./upstreams.js";

export function chunkText(text: string): string[] {
  const chunks: string[] = [];
  for (let start = 0; start < text.length; start += 1000) chunks.push(text.slice(start, start + 1200));
  return chunks;
}

export class Retrieval {
  private readonly cache = new Map<string, number[]>();
  private readonly collection: string;

  constructor(private readonly upstream: Upstreams) {
    this.collection = `agentcrew_v1_${createHash("sha256").update(upstream.config.AGENTCREW_EMBED_MODEL).digest("hex").slice(0, 12)}`;
  }

  async add(title: string, text: string): Promise<number> {
    const chunks = chunkText(text);
    const points = [];
    for (const [index, chunk] of chunks.entries()) {
      const vector = await this.embed(chunk);
      const hash = createHash("sha256").update(`${title}:${text}:${index}`).digest("hex");
      const id = `${hash.slice(0, 8)}-${hash.slice(8, 12)}-${hash.slice(12, 16)}-${hash.slice(16, 20)}-${hash.slice(20, 32)}`;
      points.push({ id, vector, payload: { title, text: chunk, index } });
    }
    await this.upstream.createCollection(this.collection, points[0].vector.length);
    await this.upstream.upsert(this.collection, points);
    return points.length;
  }

  async search(prompt: string, signal?: AbortSignal): Promise<string> {
    const vector = await this.embed(prompt, signal);
    try {
      const result = await this.upstream.json(
        `/collections/${this.collection}/points/query`,
        { query: vector, limit: 4, score_threshold: 0.35, with_payload: true },
        true,
        signal,
      );
      const points = (result.result as { points?: { payload: { title: string; text: string } }[] })?.points ?? [];
      return points
        .map((point) => `[${point.payload.title}]\n${point.payload.text}`)
        .join("\n\n")
        .slice(0, 5000);
    } catch (error) {
      if (error instanceof UpstreamError && error.status === 404) return "";
      throw error;
    }
  }

  private async embed(text: string, signal?: AbortSignal): Promise<number[]> {
    const key = createHash("sha256").update(text).digest("hex");
    const cached = this.cache.get(key);
    if (cached) return cached;
    const result = await this.upstream.json(
      "/api/embed",
      { model: this.upstream.config.AGENTCREW_EMBED_MODEL, input: text, truncate: false, keep_alive: "10m" },
      false,
      signal,
    );
    const vector = (result.embeddings as number[][])?.[0];
    if (!vector?.length || vector.some((value) => !Number.isFinite(value)))
      throw new Error("Invalid embedding response.");
    if (this.cache.size >= 128) this.cache.delete(this.cache.keys().next().value!);
    this.cache.set(key, vector);
    return vector;
  }
}
