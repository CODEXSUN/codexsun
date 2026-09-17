import Fastify from "fastify";
import { resolve } from "node:path";
import { createPlatformRuntime } from "@codexsun/platform-core";
import { readConfig } from "./config.js";
import { ZetroFoundationProvider } from "./modules/foundation/provider.js";
import { registerZetroHealthRoute } from "./modules/foundation/routes/zetro-health-route.js";
import { ZetroStorageProvider } from "./modules/storage/provider.js";

const config = readConfig();
const runtime = createPlatformRuntime(
  { id: "zetro.local", enabledProviderIds: ["platform.core", "zetro.foundation", "zetro.storage"] },
  [new ZetroFoundationProvider(), new ZetroStorageProvider(config.ZETRO_DATABASE_PATH)],
  { storageRoot: resolve(process.cwd(), config.ZETRO_STORAGE_ROOT) },
);

runtime.start();
const app = Fastify({ logger: true });
app.addHook("onClose", () => runtime.stop());
await registerZetroHealthRoute(app, runtime.engine);
await app.listen({ host: config.PLATFORM_HOST, port: config.ZETRO_API_PORT });
