import Fastify from "fastify";
import { resolve } from "node:path";
import { createPlatformRuntime } from "@codexsun/platform-core";
import { readConfig } from "./config.js";
import { ZetroFoundationProvider } from "./modules/foundation/provider.js";
import { registerZetroHealthRoute } from "./modules/foundation/routes/zetro-health-route.js";
import { ZetroStorageProvider } from "./modules/storage/provider.js";
import { ZetroChatProvider } from "./modules/chat/provider.js";
import { registerChatRoutes } from "./modules/chat/routes.js";
import { ChatService } from "./modules/chat/chat-service.js";

const config = readConfig();
const runtime = createPlatformRuntime(
  { id: "zetro.local", enabledProviderIds: ["platform.core", "zetro.foundation", "zetro.storage", "zetro.chat"] },
  [new ZetroFoundationProvider(), new ZetroStorageProvider(config.ZETRO_DATABASE_PATH), new ZetroChatProvider(config.ZETRO_DATABASE_PATH)],
  { storageRoot: resolve(process.cwd(), config.ZETRO_STORAGE_ROOT) },
);

runtime.start();
const app = Fastify({ logger: true });
app.addHook("onClose", () => runtime.stop());
await registerZetroHealthRoute(app, runtime.engine);
await registerChatRoutes(app, runtime.engine.require<ChatService>("zetro.chat"));
await app.listen({ host: config.PLATFORM_HOST, port: config.ZETRO_API_PORT });
