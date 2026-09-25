import { config as dotenv } from "dotenv";
import { mkdir } from "node:fs/promises";
import { dirname, resolve } from "node:path";
import { createPlatformRuntime, StorageProvider } from "@codexsun/platform-core";
import { createApp } from "./app.js";
import { readConfig } from "./config.js";
import { AssistantProvider } from "./modules/assistant/provider.js";
import { AssistantRepository } from "./modules/assistant/repository.js";
import { Retrieval } from "./modules/assistant/retrieval.js";
import { AssistantService } from "./modules/assistant/service.js";
import { Upstreams } from "./modules/assistant/upstreams.js";

// Source and dist/devkits/agentcrew/api share the same depth from the repository root.
const root = resolve(import.meta.dirname, "../../../..");
dotenv({ path: resolve(root, ".env"), quiet: true });
dotenv({ path: resolve(root, "devkits/agentcrew/api/.app.env"), quiet: true });
const configuration = readConfig();
const storage = new StorageProvider(resolve(root, "storage/apps")).forModule("agentcrew", "assistant");
const databasePath = storage.pathFor("private", "assistant.sqlite");
await mkdir(dirname(databasePath), { recursive: true });
const repository = new AssistantRepository(databasePath);
const upstream = new Upstreams(configuration);
const service = new AssistantService(repository, upstream, new Retrieval(upstream));
const runtime = createPlatformRuntime(
  { id: "agentcrew.local", enabledProviderIds: ["platform.core", "agentcrew.assistant"] },
  [new AssistantProvider()],
);
runtime.start();
const app = createApp(configuration, service);
app.addHook("onClose", async () => {
  await service.close();
  repository.close();
  runtime.stop();
});
for (const event of ["SIGINT", "SIGTERM"])
  process.once(event, () => {
    void app.close();
  });
await app.listen({ host: configuration.AGENTCREW_HOST, port: configuration.AGENTCREW_PORT });
