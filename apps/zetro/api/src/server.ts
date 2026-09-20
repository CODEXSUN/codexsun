import Fastify from "fastify";
import { serializerCompiler, validatorCompiler, type ZodTypeProvider } from "fastify-type-provider-zod";
import { resolve } from "node:path";
import { createPlatformRuntime, loadEnabledAddonProviders, LocalIdentityStore, readApplicationDeployableProfile } from "@codexsun/platform-core";
import { readConfig } from "./config.js";
import { ZetroFoundationProvider } from "./modules/foundation/provider.js";
import { registerZetroHealthRoute } from "./modules/foundation/routes/zetro-health-route.js";
import { ZetroStorageProvider } from "./modules/storage/provider.js";
import { ZetroChatProvider } from "./modules/chat/provider.js";
import { registerChatRoutes } from "./modules/chat/routes.js";
import { ChatService } from "./modules/chat/chat-service.js";
import { ZetroBriefProvider } from "./modules/brief/provider.js";
import { registerBriefRoutes } from "./modules/brief/routes.js";
import { BriefService } from "./modules/brief/brief-service.js";
import { ZetroTaskProvider } from "./modules/task/provider.js";
import { registerAgentTaskRoutes } from "./modules/task/routes.js";
import { AgentTaskService } from "./modules/task/task-service.js";
import { registerZetroIdentityRoutes } from "./modules/identity/routes.js";

const config = readConfig();
const identity = new LocalIdentityStore(config);
await identity.initialize();
const applicationProviders = [
  new ZetroFoundationProvider(),
  new ZetroStorageProvider(config.ZETRO_DATABASE_PATH),
  new ZetroChatProvider(config.ZETRO_DATABASE_PATH),
  new ZetroBriefProvider(config.ZETRO_DATABASE_PATH),
  new ZetroTaskProvider(config.ZETRO_DATABASE_PATH),
];
const profile = readApplicationDeployableProfile({
  applicationId: "zetro",
  availableProviderIds: ["platform.core", ...applicationProviders.map((provider) => provider.manifest.id)],
});
const runtime = createPlatformRuntime(
  profile,
  [...applicationProviders, ...(await loadEnabledAddonProviders(profile))],
  { storageRoot: resolve(process.cwd(), config.ZETRO_STORAGE_ROOT) },
);

runtime.start();
const app = Fastify({ logger: true }).withTypeProvider<ZodTypeProvider>();
app.setValidatorCompiler(validatorCompiler);
app.setSerializerCompiler(serializerCompiler);
await registerZetroIdentityRoutes(app, identity);
app.addHook("onClose", () => { identity.close(); runtime.stop(); });
await registerZetroHealthRoute(app, runtime.engine);
await registerChatRoutes(app, runtime.engine.require<ChatService>("zetro.chat"));
await registerBriefRoutes(app, runtime.engine.require<BriefService>("zetro.brief"));
await registerAgentTaskRoutes(app, runtime.engine.require<AgentTaskService>("zetro.task"));
await app.listen({ host: config.PLATFORM_HOST, port: config.ZETRO_API_PORT });
