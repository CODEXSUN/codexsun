import { LocalIdentityStore } from "@codexsun/platform-core";
import { readConfig } from "./config.js";
import { SitesContentStore } from "./modules/content/content-store.js";

const configuration = readConfig();
const identity = new LocalIdentityStore({ ...configuration, appMode: "development", refreshSeeds: false });
const content = new SitesContentStore(configuration.databasePath);

try {
  await identity.initialize();
  console.log("Prepared the Sites identity schema, public content schema, and required accounts.");
} finally {
  content.close();
  identity.close();
}
