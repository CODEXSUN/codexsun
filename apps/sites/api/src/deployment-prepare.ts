import { LocalIdentityStore } from "@codexsun/platform-core";
import { readConfig } from "./config.js";
import { SitesContentStore } from "./modules/content/content-store.js";
import { SitesWorkspaceStore } from "./modules/workspace/workspace-store.js";
import { SitesDeliveryStore } from "./modules/workspace/delivery-store.js";

const configuration = readConfig();
const identity = new LocalIdentityStore({ ...configuration, appMode: "development", refreshSeeds: false });
const content = new SitesContentStore(configuration.databasePath);
const workspace = new SitesWorkspaceStore(configuration.databasePath);
const delivery = new SitesDeliveryStore({ databasePath: configuration.databasePath });
for (const client of content.listPublished()) {
  workspace.syncClient({ slug: client.slug, name: client.name, description: client.description });
  delivery.syncClient(client.slug);
}

try {
  await identity.initialize();
  console.log("Prepared the Sites identity schema, public content schema, and required accounts.");
} finally {
  workspace.close();
  delivery.close();
  content.close();
  identity.close();
}
