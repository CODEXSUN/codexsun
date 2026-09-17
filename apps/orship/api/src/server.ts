import Fastify from "fastify";
import { createPlatformRuntime } from "@codexsun/platform-core";
import { readConfig } from "./config.js";
import { OrshipOrchestrationProvider } from "./modules/orchestration/provider.js";
import { registerOrchestrationRoutes } from "./modules/orchestration/routes/orchestration-routes.js";

const config = readConfig();
const runtime = createPlatformRuntime(
  { id: "orship.local", enabledProviderIds: ["platform.core", "orship.orchestration"] },
  [new OrshipOrchestrationProvider()],
  { storageRoot: config.ORSHIP_STORAGE_ROOT },
);

runtime.start();
const app = Fastify({ logger: true });
app.addHook("onRequest", async (request, reply) => {
  if (request.headers.origin !== config.ORSHIP_WEB_ORIGIN) return;
  reply.header("access-control-allow-origin", config.ORSHIP_WEB_ORIGIN);
  reply.header("access-control-allow-methods", "GET, POST, OPTIONS");
  reply.header("access-control-allow-headers", "content-type");
  if (request.method === "OPTIONS") return reply.code(204).send();
});
app.addHook("onClose", () => runtime.stop());
await registerOrchestrationRoutes(app, runtime.engine);
await app.listen({ host: config.ORSHIP_HOST, port: config.ORSHIP_API_PORT });
