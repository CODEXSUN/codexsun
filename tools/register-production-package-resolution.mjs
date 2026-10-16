import { existsSync } from "node:fs";
import { registerHooks } from "node:module";
import { dirname, resolve } from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";

const root = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const apiPackages = new Map([
  ["@codexsun/codexsun-api", "codexsun"],
  ["@codexsun/hrms-api", "hrms"],
  ["@codexsun/docs-api", "docs"],
  ["@codexsun/himsx-api", "himsx"],
  ["@codexsun/sites-api", "sites"],

  ["@codexsun/accounts-api", "accounts"],
  ["@codexsun/auditor-api", "auditor"],
  ["@codexsun/billing-api", "billing"],
  ["@codexsun/core-api", "core"],
  ["@codexsun/crm-api", "crm"],
  ["@codexsun/frappe-api", "frappe"],
  ["@codexsun/logicx-erp-api", "logicx-erp"],
  ["@codexsun/ecommerce-api", "ecommerce"],
  ["@codexsun/notes-api", "notes"],
  ["@codexsun/chat-api", "chat"],
  ["@codexsun/zetro-api", "zetro"],
  ["@codexsun/project-manager-api", "project-manager"],
  ["@codexsun/zuno-api", "zuno"],
  ["@codexsun/mail-api", "mail"]
]);

registerHooks({
  resolve(specifier, context, nextResolve) {
    const target = productionApiTarget(specifier);
    if (target) return { shortCircuit: true, url: pathToFileURL(target).href };
    return nextResolve(specifier, context);
  }
});

function productionApiTarget(specifier) {
  for (const [packageName, app] of apiPackages) {
    if (specifier !== packageName && !specifier.startsWith(`${packageName}/`)) continue;
    const subpath = specifier.slice(packageName.length + 1);
    const base = resolve(root, "dist", "apps", app, "api");
    const candidates = subpath
      ? [resolve(base, `${subpath}.js`), resolve(base, subpath, "index.js")]
      : [resolve(base, "index.js")];
    const target = candidates.find((candidate) => existsSync(candidate));
    if (!target) {
      throw new Error(`Production build output is missing for ${specifier}. Run npm run build.`);
    }
    return target;
  }
  return null;
}
