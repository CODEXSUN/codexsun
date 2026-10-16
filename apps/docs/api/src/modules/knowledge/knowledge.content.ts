import { existsSync } from "node:fs";
import { readFile, realpath, stat } from "node:fs/promises";
import { fileURLToPath } from "node:url";
import { resolve, sep } from "node:path";
import { createHash } from "node:crypto";
import { z } from "zod";
import type { KnowledgeSource, DeveloperReference } from "./knowledge.types.js";
const sourceSchema = z
  .object({
    pageKey: z.string().regex(/^[a-z0-9/-]+$/),
    appKey: z.string(),
    appLabel: z.string(),
    groupKey: z.string(),
    groupLabel: z.string(),
    moduleKey: z.string(),
    title: z.string(),
    summary: z.string(),
    sourcePath: z.string().regex(/^applications\/[a-z0-9-]+\/[a-z0-9/.-]+\.mdx?$/),
    sourceHash: z.string().regex(/^[a-f0-9]{64}$/),
    sortOrder: z.number().int()
  })
  .strict();
const contentRoot = ["../../../content/", "../../../../content/"]
  .map((path) => fileURLToPath(new URL(path, import.meta.url)))
  .find((path) => existsSync(resolve(path, "catalog.json")));
if (!contentRoot) throw new Error("Docs content assets are missing.");
const sourceRoot = contentRoot;
export async function knowledgeSources(): Promise<KnowledgeSource[]> {
  const data = z
    .object({ formatVersion: z.literal(1), pages: z.array(sourceSchema) })
    .strict()
    .parse(JSON.parse(await readFile(resolve(sourceRoot, "catalog.json"), "utf8")));
  return data.pages;
}
export async function readKnowledgeSource(source: KnowledgeSource) {
  const root = await realpath(sourceRoot);
  const path = await realpath(resolve(root, source.sourcePath));
  if (!path.startsWith(root + sep) || (await stat(path)).size > 128000)
    throw new Error("Invalid documentation source");
  const body = await readFile(path, "utf8");
  if (createHash("sha256").update(body).digest("hex") !== source.sourceHash)
    throw new Error("Documentation source hash mismatch; rebuild the catalog.");
  return body;
}
export function referenceExcerpt(body: string, query: string) {
  const lower = body.toLowerCase();
  const term = query.toLowerCase().trim();
  const start = Math.max(0, lower.indexOf(term) - 200);
  return body.slice(start, start + 5000);
}
export async function searchDeveloperReference(query: string): Promise<DeveloperReference[]> {
  const term = query.trim().toLowerCase();
  if (term.length < 2 || term.length > 160) return [];
  const sources = await knowledgeSources();
  const ranked = sources
    .filter((s) =>
      `${s.appKey} ${s.title} ${s.summary} ${s.moduleKey}`.toLowerCase().includes(term)
    )
    .sort(
      (a, b) =>
        Number(b.appKey === term) * 100 +
          Number(b.title.toLowerCase().includes(term)) * 40 -
          (Number(a.appKey === term) * 100 + Number(a.title.toLowerCase().includes(term)) * 40) ||
        a.sortOrder - b.sortOrder
    )
    .slice(0, 5);
  const results = await Promise.all(
    ranked.map(async (s) => ({ ...s, body: await readKnowledgeSource(s) }))
  );
  return results.map((s) => ({
    title: s.title,
    pageKey: s.pageKey,
    url: `/app/docs/library?page=${encodeURIComponent(s.pageKey)}`,
    sourcePath: s.sourcePath,
    sourceHash: s.sourceHash,
    revision: 1,
    origin: "repository",
    excerpt: referenceExcerpt(s.body, query)
  }));
}
