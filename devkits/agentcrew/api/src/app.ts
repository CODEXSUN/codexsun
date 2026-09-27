import Fastify from "fastify";
import { randomBytes, timingSafeEqual } from "node:crypto";
import { chmodSync, existsSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { dirname } from "node:path";
import { ZodError } from "zod";
import type { Configuration } from "./config.js";
import type { AssistantService } from "./modules/assistant/service.js";
import { registerAssistantRoutes } from "./modules/assistant/routes.js";
import { registerWorkspaceRoutes } from "./modules/assistant/workspace-routes.js";
import type { WorkspaceTools } from "./modules/assistant/workspace-tools.js";

export function createApp(config: Configuration, service: AssistantService, workspaceTools?: WorkspaceTools) {
  const app = Fastify({ bodyLimit: 100000, logger: false });
  let activeToken = readPersistedToken(config.AGENTCREW_TOKEN_FILE) ?? config.AGENTCREW_TOKEN;
  app.addHook("onRequest", async (request, reply) => {
    reply.header("Cache-Control", "no-store");
    reply.header("X-Content-Type-Options", "nosniff");
    if (request.url === "/health" || request.url === "/api/v1/agentcrew/token/generate") return;
    const supplied = Buffer.from(request.headers.authorization ?? "");
    const authorized = [activeToken, config.AGENTCREW_TOKEN].some((token) => {
      const expected = Buffer.from(`Bearer ${token}`);
      return supplied.length === expected.length && timingSafeEqual(supplied, expected);
    });
    if (!authorized)
      return reply.code(401).send({ error: "Connect with your local access token." });
  });
  app.get("/health", async () => ({ healthy: true }));
  app.post("/api/v1/agentcrew/token/generate", async () => {
    activeToken = randomBytes(32).toString("hex");
    persistToken(config.AGENTCREW_TOKEN_FILE, activeToken);
    return { token: activeToken, url: "http://127.0.0.1:6411" };
  });
  app.setErrorHandler((error, _request, reply) => {
    if (error instanceof ZodError)
      return reply
        .code(400)
        .send({ error: "Invalid input.", fields: error.issues.map((issue) => issue.path.join(".")) });
    return reply.code(503).send({ error: "Request unavailable. Check the service status and retry." });
  });
  registerAssistantRoutes(app, service);
  if (workspaceTools) registerWorkspaceRoutes(app, workspaceTools);
  return app;
}

function readPersistedToken(path: string): string | undefined {
  if (!path || !existsSync(path)) return undefined;
  try {
    const token = readFileSync(path, "utf8").trim();
    return token.length >= 32 ? token : undefined;
  } catch {
    return undefined;
  }
}

function persistToken(path: string, token: string): void {
  if (!path) return;
  mkdirSync(dirname(path), { recursive: true });
  writeFileSync(path, `${token}\n`, { mode: 0o600 });
  chmodSync(path, 0o600);
}
