import Fastify from "fastify";
import { serializerCompiler, validatorCompiler, type ZodTypeProvider } from "fastify-type-provider-zod";
import { resolve } from "node:path";
import { createPlatformRuntime, loadEnabledAddonProviders, LocalIdentityStore, readApplicationDeployableProfile } from "@codexsun/platform-core";
import { readConfig } from "./config";
import { ZetroFoundationProvider } from "./modules/foundation/provider";
import { registerZetroHealthRoute } from "./modules/foundation/routes/zetro-health-route";
import { ZetroStorageProvider } from "./modules/storage/provider";
import { ZetroChatProvider } from "./modules/chat/provider";
import { registerChatRoutes } from "./modules/chat/routes";
import { ChatService } from "./modules/chat/chat-service";
import { ZetroBriefProvider } from "./modules/brief/provider";
import { registerBriefRoutes } from "./modules/brief/routes";
import { BriefService } from "./modules/brief/brief-service";
import { ZetroTaskProvider } from "./modules/task/provider";
import { registerAgentTaskRoutes } from "./modules/task/routes";
import { AgentTaskService } from "./modules/task/task-service";
import { registerZetroIdentityRoutes } from "./modules/identity/routes";

const config = readConfig();
const identity = new LocalIdentityStore(config);
await identity.initialize();
const applicationProviders = [
  new ZetroFoundationProvider(),
  new ZetroStorageProvider(config.ZETRO_DATABASE_PATH),
  new ZetroChatProvider(config.ZETRO_DATABASE_PATH),
  new ZetroBriefProvider(config.ZETRO_DATABASE_PATH),
  new ZetroTaskProvider(config.ZETRO_DATABASE_PATH, config.zunoApiUrl, config.zunoClientKey),
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
