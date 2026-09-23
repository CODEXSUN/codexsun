import { LocalIdentityStore } from "@codexsun/platform-core";
import { readConfig } from "./config.js";

const configuration = readConfig();
const identity = new LocalIdentityStore({ ...configuration, appMode: "development", refreshSeeds: false });

try {
  await identity.initialize();
  console.log("Prepared the Sites identity schema and required accounts.");
} finally {
  identity.close();
}
