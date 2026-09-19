import Fastify from "fastify";
import { resolve } from "node:path";
import { createPlatformRuntime } from "@codexsun/platform-core";
import { readConfig } from "./config.js";
import { GarmentsCatalogProvider } from "./modules/catalog/provider.js";
import { registerGarmentsHealthRoute } from "./modules/catalog/routes/garments-health-route.js";
import { FrappeLogClient } from "./modules/frappe/frappe-log-client.js";
import { registerGarmentsFrappeRoutes } from "./modules/frappe/garments-frappe-routes.js";

const config = readConfig();
const allowedWebOrigins = new Set([config.GARMENTS_WEB_ORIGIN, "http://127.0.0.1:6040", "http://127.0.0.1:6101"]);
const runtime = createPlatformRuntime({ id: "garments.local", enabledProviderIds: ["platform.core", "garments.catalog"] }, [
  new GarmentsCatalogProvider({
    indexPath: resolve(process.cwd(), config.GARMENTS_INDEX_PATH),
    repositoryRoot: resolve(process.cwd(), "../../.."),
  }),
]);

runtime.start();
const app = Fastify({ logger: true });
app.addHook("onClose", () => runtime.stop());
app.addHook("onSend", async (request, reply) => {
  const origin = request.headers.origin;
  if (!origin || !allowedWebOrigins.has(origin)) return;
  reply.header("access-control-allow-origin", origin);
  reply.header("vary", "origin");
});
await registerGarmentsHealthRoute(app, runtime.engine);
await registerGarmentsFrappeRoutes(app, new FrappeLogClient(config));
await app.listen({ host: config.PLATFORM_HOST, port: config.GARMENTS_API_PORT });
