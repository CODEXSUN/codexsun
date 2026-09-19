import Fastify from "fastify";
import { resolve } from "node:path";
import { createPlatformRuntime, readApplicationDeployableProfile } from "@codexsun/platform-core";
import { readConfig } from "./config.js";
import { DocsCatalogProvider } from "./modules/catalog/provider.js";
import { registerDocsHealthRoute } from "./modules/catalog/routes/docs-health-route.js";

const config = readConfig();
const catalogProvider = new DocsCatalogProvider({
  indexPath: resolve(process.cwd(), config.DOCS_INDEX_PATH),
  repositoryRoot: resolve(process.cwd(), "../../.."),
});
const runtime = createPlatformRuntime(
  readApplicationDeployableProfile({ applicationId: "docs", availableProviderIds: ["platform.core", catalogProvider.manifest.id] }),
  [catalogProvider],
);

runtime.start();
const app = Fastify({ logger: true });
app.addHook("onClose", () => runtime.stop());
app.addHook("onSend", async (_request, reply) => {
  reply.header("access-control-allow-origin", config.DOCS_WEB_ORIGIN);
});
await registerDocsHealthRoute(app, runtime.engine);
await app.listen({ host: config.PLATFORM_HOST, port: config.DOCS_API_PORT });
