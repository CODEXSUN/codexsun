import Fastify from "fastify";
import { createPlatformRuntime } from "@codexsun/platform-core";
import { SystemModuleProvider } from "./modules/system/provider.js";
import { registerHealthRoute } from "./modules/system/routes/health-route.js";
import { readConfig } from "./config.js";

const runtime = createPlatformRuntime([new SystemModuleProvider()]);
const { engine } = runtime;
runtime.start();
const app = Fastify({ logger: true });
app.addHook("onClose", () => runtime.stop());
await registerHealthRoute(app, engine);
const config = readConfig();
await app.listen({ host: config.PLATFORM_HOST, port: config.PLATFORM_API_PORT });
