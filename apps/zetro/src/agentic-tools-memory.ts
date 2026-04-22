/**
 * Agentic Tools Memory Integration
 *
 * Extends AgenticTools to integrate with ProjectMemory, CodebaseAnalyzer, Cache, and QuickRef
 */

import { createOrexsoClient } from "./orexso-client.js";
import { AgenticTools } from "./agentic-tools.js";
import { createProjectMemory } from "./project-memory.js";
import { analyzeCodebase } from "./codebase-analyzer.js";
import { ContextCache } from "./context-cache.js";
import { generateQuickReference, loadQuickReference } from "./quick-reference.js";
import { ensureAIFolders } from "./memory-boundary.js";

export async function createAgentWithMemory(
  projectPath: string,
  projectId: string = "default"
) {
  // Ensure boundary
  await ensureAIFolders(projectPath);

  // Create memory manager
  const memory = await createProjectMemory(projectPath, projectId);

  // Create cache
  const cache = new ContextCache(projectPath);

  // Load quick ref or generate
  let quickRef = await loadQuickReference(projectPath);
  if (!quickRef) {
    await generateQuickReference(projectPath);
    quickRef = await loadQuickReference(projectPath);
  }

  // Analyze codebase (may be cached)
  const index = await analyzeCodebase(projectPath);

  // Create base agentic tools with client
  const client = createOrexsoClient({ baseUrl: process.env.OREXSO_API_URL });
  const tools = new AgenticTools(client, {
    projectId,
    sessionId: `session-${Date.now()}`,
  });

  // Attach memory helpers
  (tools as any).memory = memory;
  (tools as any).cache = cache;
  (tools as any).quickRef = quickRef;
  (tools as any).index = index;

  // Record startup
  await memory.updateMetadata({
    projectPath,
    learningStatus: "learning",
  });

  return tools as AgenticTools & {
    memory: typeof memory;
    cache: ContextCache;
    quickRef: string;
    index: Awaited<ReturnType<typeof analyzeCodebase>>;
  };
}
