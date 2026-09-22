import { existsSync } from "node:fs";
import { relative, resolve } from "node:path";
import { pathToFileURL } from "node:url";
import { LocalIdentityStore } from "@codexsun/platform-core";
import { applicationPath, getApplication } from "../packages/app-cli/src/registry.mjs";

const root = resolve(import.meta.dirname, "..");
const applicationId = process.argv[2]?.trim();

if (!applicationId || !/^[a-z][a-z0-9-]*$/u.test(applicationId)) {
  throw new Error("Usage: npm run identity:migrate -- <application-id>");
}

const manifestPath = resolve(root, "registry", "applications", `${applicationId}.json`);
if (!existsSync(manifestPath)) throw new Error(`Application is not registered: ${applicationId}.`);
const appPath = resolve(applicationPath(root, getApplication(root, applicationId)), "api");
if (!existsSync(appPath) || relative(resolve(root, "apps"), appPath).startsWith("..")) throw new Error(`Unknown application: ${applicationId}.`);

process.chdir(appPath);
const configModule = await import(pathToFileURL(resolve(appPath, "src", "config.ts")).href);
const configuration = configModule.readConfig();
const identity = new LocalIdentityStore({ ...configuration, appMode: "development" });

try {
  identity.migrate();
  console.log(`Applied identity migrations for ${applicationId}.`);
} finally {
  identity.close();
}
