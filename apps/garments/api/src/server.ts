import Fastify from "fastify";
import { resolve } from "node:path";
import { createPlatformRuntime } from "@codexsun/platform-core";
import { readConfig } from "./config.js";
import { GarmentsCatalogProvider } from "./modules/catalog/provider.js";
import { registerGarmentsHealthRoute } from "./modules/catalog/routes/garments-health-route.js";

const config = readConfig();
const runtime = createPlatformRuntime({ id: "garments.local", enabledProviderIds: ["platform.core", "garments.catalog"] }, [
  new GarmentsCatalogProvider({
    indexPath: resolve(process.cwd(), config.GARMENTS_INDEX_PATH),
    repositoryRoot: resolve(process.cwd(), "../../.."),
  }),
]);

runtime.start();
const app = Fastify({ logger: true });
app.addHook("onClose", () => runtime.stop());
app.addHook("onSend", async (_request, reply) => {
  reply.header("access-control-allow-origin", config.GARMENTS_WEB_ORIGIN);
});
await registerGarmentsHealthRoute(app, runtime.engine);
await app.listen({ host: config.PLATFORM_HOST, port: config.GARMENTS_API_PORT });
