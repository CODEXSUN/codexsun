import { existsSync } from "node:fs";
import { relative, resolve } from "node:path";
import { pathToFileURL } from "node:url";
import { LocalIdentityStore } from "@codexsun/platform-core";

const root = resolve(import.meta.dirname, "..");
const applicationId = process.argv[2]?.trim();

if (!applicationId || !/^[a-z][a-z0-9-]*$/u.test(applicationId)) {
  throw new Error("Usage: npm run identity:migrate -- <application-id>");
}

const applicationPath = resolve(root, "apps", applicationId, "api");
if (!existsSync(applicationPath) || relative(resolve(root, "apps"), applicationPath).startsWith("..")) {
  throw new Error(`Unknown application: ${applicationId}.`);
}

const manifestPath = resolve(root, "registry", "applications", `${applicationId}.json`);
if (!existsSync(manifestPath)) throw new Error(`Application is not registered: ${applicationId}.`);

process.chdir(applicationPath);
const configModule = await import(pathToFileURL(resolve(applicationPath, "src", "config.ts")).href);
const configuration = configModule.readConfig();
const identity = new LocalIdentityStore({ ...configuration, appMode: "development" });

try {
  identity.migrate();
  console.log(`Applied identity migrations for ${applicationId}.`);
} finally {
  identity.close();
}
