import { readLocalIdentityConfiguration } from "@codexsun/platform-core";
import { config } from "dotenv";
import { existsSync, readFileSync } from "node:fs";
import { resolve } from "node:path";
import { fileURLToPath } from "node:url";
import type { MemoryTransport } from "./modules/memory/memory-tools.js";

type CodeloopConfiguration = ReturnType<typeof readLocalIdentityConfiguration> & { readonly agentCrewApiUrl?: string; readonly agentCrewToken?: string; readonly apiReferenceToken: string; readonly host: string; readonly port: number; readonly runtimeDatabasePath: string; readonly memoryJsonPath: string; readonly memoryTransport: MemoryTransport; readonly workspaceRoot: string; readonly sandboxMode: "read-only" | "read-write" };

export function readConfig(): CodeloopConfiguration {
  const repoRoot = fileURLToPath(new URL("../../../../", import.meta.url));
  const apiDir = fileURLToPath(new URL("../", import.meta.url));

  const rootEnvCandidates = [resolve(repoRoot, ".env"), resolve(process.cwd(), ".env"), resolve(process.cwd(), "../../../.env")];
  for (const envPath of rootEnvCandidates) {
    if (existsSync(envPath)) {
      config({ path: envPath });
      break;
    }
  }

  const appEnvCandidates = [resolve(apiDir, ".app.env"), resolve(process.cwd(), "devkits/codeloop/api/.app.env"), resolve(process.cwd(), ".app.env")];
  for (const envPath of appEnvCandidates) {
    if (existsSync(envPath)) {
      config({ path: envPath, override: true });
      break;
    }
  }

  const port = Number(process.env.CODELOOP_API_PORT);
  if (!Number.isInteger(port) || port < 1 || port > 65_535) throw new Error("Set CODELOOP_API_PORT to a valid port.");
  const host = process.env.PLATFORM_HOST;
  if (!host) throw new Error("Set PLATFORM_HOST.");
  const apiReferenceToken = process.env.CODELOOP_API_REFERENCE_TOKEN;
  if (!apiReferenceToken) throw new Error("Set CODELOOP_API_REFERENCE_TOKEN.");
  const sandboxMode = process.env.CODELOOP_SANDBOX_MODE === "read-write" ? "read-write" : "read-only";
  const runtimeDatabasePath = resolve(repoRoot, "storage/apps/codeloop/private/data/codeloop_runtime.sqlite");
  const identityDatabasePath = resolve(repoRoot, "storage/apps/codeloop/private/data/codeloop_db.sqlite");
  const workspaceRoot = resolve(repoRoot, process.env.CODELOOP_WORKSPACE_ROOT ?? "./");
  const memoryTransport: MemoryTransport = process.env.CODELOOP_MEMORY_TRANSPORT === "json" ? "json" : process.env.CODELOOP_MEMORY_TRANSPORT === "mariadb" ? "mariadb" : "sqlite";
  const memoryJsonPath = resolve(repoRoot, process.env.CODELOOP_MEMORY_JSON_PATH ?? "storage/apps/codeloop/private/data/codeloop_memory.json");

  return {
    agentCrewApiUrl: process.env.AGENTCREW_API_URL ?? "http://127.0.0.1:6411",
    agentCrewToken: process.env.AGENTCREW_TOKEN ?? readAgentCrewToken(),
    apiReferenceToken,
    host,
    port,
    runtimeDatabasePath,
    memoryJsonPath,
    memoryTransport,
    sandboxMode,
    workspaceRoot,
    ...readLocalIdentityConfiguration(process.env, { applicationId: "codeloop", databasePath: identityDatabasePath }),
  };
}

function readAgentCrewToken(): string | undefined {
  const candidatePaths = [
    fileURLToPath(new URL("../../../agentcrew/ollama/.container/.env", import.meta.url)),
    resolve(process.cwd(), "devkits/agentcrew/ollama/.container/.env"),
    resolve(process.cwd(), "../../agentcrew/ollama/.container/.env"),
  ];
  for (const candidatePath of candidatePaths) {
    try {
      if (existsSync(candidatePath)) {
        const env = readFileSync(candidatePath, "utf8");
        const token = env.match(/^AGENTCREW_TOKEN=(.+)$/m)?.[1]?.trim();
        if (token) return token;
      }
    } catch {
      // Continue to next candidate
    }
  }
  return undefined;
}
