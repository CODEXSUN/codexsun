import Fastify from "fastify";
import { createPlatformEngine } from "@codexsun/platform-core";
import { SystemModuleProvider } from "./modules/system/provider.js";
import { registerHealthRoute } from "./modules/system/routes/health-route.js";
import { readConfig } from "./config.js";

const engine = createPlatformEngine();
engine.register(new SystemModuleProvider());
const app = Fastify({ logger: true });
await registerHealthRoute(app, engine);
const config = readConfig();
await app.listen({ host: config.PLATFORM_HOST, port: config.PLATFORM_API_PORT });
