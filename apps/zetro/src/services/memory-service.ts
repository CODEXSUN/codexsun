import { randomUUID } from "node:crypto";

import type { Kysely } from "kysely";

import { zetroTableNames } from "../../database/table-names.js";
import { ApplicationError } from "../../../framework/src/runtime/errors/application-error.js";
import {
  listStorePayloads,
  listStoreRecords,
  replaceStoreRecords,
} from "../data/query-database.js";

export type ZetroMemoryProvider = "ollama" | "openai" | "anthropic" | "none";

export type ZetroMemoryVector = {
  id: string;
  findingId?: string;
  runId?: string;
  sessionId?: string;
  content: string;
  contentType: "finding" | "run-summary" | "chat-message" | "command-output";
  provider: ZetroMemoryProvider;
  embedding: number[];
  model?: string;
  createdAt: string;
  metadata?: Record<string, string | number | boolean>;
};

export type ZetroMemorySearchResult = {
  id: string;
  content: string;
  contentType: ZetroMemoryVector["contentType"];
  similarity: number;
  findingId?: string;
  runId?: string;
  createdAt: string;
  metadata?: Record<string, string | number | boolean>;
};

export type ZetroCreateMemoryVectorInput = {
  id?: string;
  findingId?: string;
  runId?: string;
  sessionId?: string;
  content: string;
  contentType: ZetroMemoryVector["contentType"];
  provider?: ZetroMemoryProvider;
  model?: string;
  metadata?: Record<string, string | number | boolean>;
};

export type ZetroMemoryConfig = {
  provider: ZetroMemoryProvider;
  ollamaUrl: string;
  ollamaModel: string;
  openaiModel: string;
  anthropicModel: string;
  embeddingDimension: number;
  similarityThreshold: number;
  maxResults: number;
};

export const DEFAULT_MEMORY_CONFIG: ZetroMemoryConfig = {
  provider: "ollama",
  ollamaUrl: process.env["ZETRO_OLLAMA_URL"] ?? "http://localhost:11434",
  ollamaModel: process.env["ZETRO_OLLAMA_EMBED_MODEL"] ?? "nomic-embed-text",
  openaiModel: "text-embedding-3-small",
  anthropicModel: "claude-3-haiku",
  embeddingDimension: 768,
  similarityThreshold: 0.7,
  maxResults: 5,
};

export async function getEmbedding(
  text: string,
  config: ZetroMemoryConfig = DEFAULT_MEMORY_CONFIG,
): Promise<{ embedding: number[]; model: string }> {
  if (config.provider === "ollama") {
    return getOllamaEmbedding(text, config.ollamaUrl, config.ollamaModel);
  }

  if (config.provider === "none") {
    return getFallbackEmbedding(text);
  }

  return getFallbackEmbedding(text);
}

async function getOllamaEmbedding(
  text: string,
  url: string,
  model: string,
): Promise<{ embedding: number[]; model: string }> {
  try {
    const response = await fetch(`${url}/api/embeddings`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ model, prompt: text }),
    });

    if (!response.ok) {
      throw new Error(`Ollama API error: ${response.status}`);
    }

    const data = (await response.json()) as { embedding: number[] };
    return { embedding: data.embedding, model };
  } catch (error) {
    throw new ApplicationError(
      "Failed to get embedding from Ollama. Is Ollama running?",
      { error: String(error) },
      503,
    );
  }
}

function getFallbackEmbedding(text: string): {
  embedding: number[];
  model: string;
} {
  const words = text.toLowerCase().split(/\s+/).filter(Boolean);
  const dimension = 128;
  const embedding = new Array(dimension).fill(0);

  for (let i = 0; i < words.length; i++) {
    const word = words[i] as string;
    const hash = simpleHash(word);
    for (let j = 0; j < dimension; j++) {
      embedding[j]! += Math.sin(hash * (j + 1) + i) * 0.1;
    }
  }

  const magnitude = Math.sqrt(
    embedding.reduce((sum, val) => sum + val * val, 0),
  );
  const normalized =
    magnitude > 0 ? embedding.map((val) => val / magnitude) : embedding;

  return { embedding: normalized, model: "fallback-tfidf" };
}

function simpleHash(str: string): number {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    const char = str.charCodeAt(i);
    hash = (hash << 5) - hash + char;
    hash = hash & hash;
  }
  return Math.abs(hash);
}

function cosineSimilarity(a: number[], b: number[]): number {
  if (a.length !== b.length) return 0;

  let dotProduct = 0;
  let normA = 0;
  let normB = 0;

  for (let i = 0; i < a.length; i++) {
    const aVal = a[i] as number;
    const bVal = b[i] as number;
    dotProduct += aVal * bVal;
    normA += aVal * aVal;
    normB += bVal * bVal;
  }

  const denominator = Math.sqrt(normA) * Math.sqrt(normB);
  return denominator > 0 ? dotProduct / denominator : 0;
}

export async function storeMemoryVector(
  database: Kysely<unknown>,
  input: ZetroCreateMemoryVectorInput,
): Promise<ZetroMemoryVector> {
  let embeddingData: { embedding: number[]; model: string };

  try {
    embeddingData = await getEmbedding(input.content);
  } catch {
    embeddingData = { embedding: [], model: "none" };
  }

  const vector: ZetroMemoryVector = {
    id: input.id ?? `zetro-memory-${randomUUID()}`,
    findingId: input.findingId,
    runId: input.runId,
    sessionId: input.sessionId,
    content: input.content,
    contentType: input.contentType,
    provider: input.provider ?? "none",
    embedding: embeddingData.embedding,
    model: embeddingData.model,
    createdAt: new Date().toISOString(),
    metadata: input.metadata,
  };

  const records = await listStoreRecords<ZetroMemoryVector>(
    database,
    zetroTableNames.memoryVectors,
  );

  await replaceStoreRecords(database, zetroTableNames.memoryVectors, [
    ...records,
    {
      id: vector.id,
      moduleKey: "memory",
      sortOrder: (records.at(-1)?.sortOrder ?? 0) + 10,
      payload: vector,
    },
  ]);

  return vector;
}

export async function searchMemory(
  database: Kysely<unknown>,
  query: string,
  options?: {
    limit?: number;
    threshold?: number;
    contentType?: ZetroMemoryVector["contentType"];
    runId?: string;
  },
): Promise<ZetroMemorySearchResult[]> {
  const limit = options?.limit ?? DEFAULT_MEMORY_CONFIG.maxResults;
  const threshold =
    options?.threshold ?? DEFAULT_MEMORY_CONFIG.similarityThreshold;

  let queryEmbedding: number[];
  try {
    const result = await getEmbedding(query);
    queryEmbedding = result.embedding;
  } catch {
    queryEmbedding = [];
  }

  const allVectors = await listStorePayloads<ZetroMemoryVector>(
    database,
    zetroTableNames.memoryVectors,
  );

  let filtered = allVectors;

  if (options?.contentType) {
    filtered = filtered.filter((v) => v.contentType === options.contentType);
  }

  if (options?.runId) {
    filtered = filtered.filter((v) => v.runId === options.runId || v.findingId);
  }

  const results: ZetroMemorySearchResult[] = [];

  for (const vector of filtered) {
    if (vector.embedding.length === 0) continue;

    const similarity = cosineSimilarity(queryEmbedding, vector.embedding);

    if (similarity >= threshold) {
      results.push({
        id: vector.id,
        content: vector.content,
        contentType: vector.contentType,
        similarity,
        findingId: vector.findingId,
        runId: vector.runId,
        createdAt: vector.createdAt,
        metadata: vector.metadata,
      });
    }
  }

  results.sort((a, b) => b.similarity - a.similarity);

  return results.slice(0, limit);
}

export async function findSimilarFindings(
  database: Kysely<unknown>,
  findingTitle: string,
  findingSummary: string,
  options?: {
    limit?: number;
    excludeFindingId?: string;
  },
): Promise<ZetroMemorySearchResult[]> {
  const query = `${findingTitle} ${findingSummary}`;

  const results = await searchMemory(database, query, {
    limit: options?.limit ?? 5,
    contentType: "finding",
  });

  if (options?.excludeFindingId) {
    return results.filter((r) => r.findingId !== options.excludeFindingId);
  }

  return results;
}

export async function listMemoryVectors(
  database: Kysely<unknown>,
  filters?: {
    contentType?: ZetroMemoryVector["contentType"];
    runId?: string;
    limit?: number;
  },
): Promise<ZetroMemoryVector[]> {
  let vectors = await listStorePayloads<ZetroMemoryVector>(
    database,
    zetroTableNames.memoryVectors,
  );

  if (filters?.contentType) {
    vectors = vectors.filter((v) => v.contentType === filters.contentType);
  }

  if (filters?.runId) {
    vectors = vectors.filter((v) => v.runId === filters.runId || v.findingId);
  }

  vectors.sort(
    (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime(),
  );

  if (filters?.limit) {
    vectors = vectors.slice(0, filters.limit);
  }

  return vectors;
}

export async function getMemoryStats(database: Kysely<unknown>): Promise<{
  total: number;
  byType: Record<ZetroMemoryVector["contentType"], number>;
  byProvider: Record<ZetroMemoryProvider, number>;
}> {
  const vectors = await listStorePayloads<ZetroMemoryVector>(
    database,
    zetroTableNames.memoryVectors,
  );

  const byType: Record<string, number> = {};
  const byProvider: Record<string, number> = {};

  for (const vector of vectors) {
    byType[vector.contentType] = (byType[vector.contentType] ?? 0) + 1;
    byProvider[vector.provider] = (byProvider[vector.provider] ?? 0) + 1;
  }

  return {
    total: vectors.length,
    byType: byType as Record<ZetroMemoryVector["contentType"], number>,
    byProvider: byProvider as Record<ZetroMemoryProvider, number>,
  };
}

export async function deleteMemoryVector(
  database: Kysely<unknown>,
  memoryId: string,
): Promise<void> {
  const records = await listStoreRecords<ZetroMemoryVector>(
    database,
    zetroTableNames.memoryVectors,
  );

  const filtered = records.filter((r) => r.id !== memoryId);

  if (filtered.length === records.length) {
    throw new ApplicationError("Memory vector not found", { memoryId }, 404);
  }

  await replaceStoreRecords(database, zetroTableNames.memoryVectors, filtered);
}

export async function clearMemoryVectors(
  database: Kysely<unknown>,
  filters?: {
    runId?: string;
    contentType?: ZetroMemoryVector["contentType"];
    olderThan?: Date;
  },
): Promise<number> {
  const records = await listStoreRecords<ZetroMemoryVector>(
    database,
    zetroTableNames.memoryVectors,
  );

  let toDelete: string[] = [];

  for (const record of records) {
    const vector = record.payload;

    if (filters?.runId && vector.runId !== filters.runId) continue;
    if (filters?.contentType && vector.contentType !== filters.contentType)
      continue;
    if (filters?.olderThan && new Date(vector.createdAt) >= filters.olderThan)
      continue;

    toDelete.push(record.id);
  }

  if (toDelete.length === 0) return 0;

  const remaining = records.filter((r) => !toDelete.includes(r.id));

  await replaceStoreRecords(database, zetroTableNames.memoryVectors, remaining);

  return toDelete.length;
}
