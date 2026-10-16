import { mkdirSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { ClientContentStore } from "./content-store.mjs";

const [siteUuid, filename] = process.argv.slice(2);
if (!siteUuid || !filename) {
  throw new Error(
    "Usage: node apps/sites/clients/runtime/content/init.mjs <site-uuid> <sqlite-file>"
  );
}
if (!/^[a-f0-9]{8}$/u.test(siteUuid)) {
  throw new Error("Site UUID must contain eight lowercase hexadecimal characters.");
}
const path = resolve(filename);
mkdirSync(dirname(path), { recursive: true });
const store = new ClientContentStore(path, siteUuid);
try {
  console.log(JSON.stringify({ ...store.identity(), path }));
} finally {
  store.close();
}
