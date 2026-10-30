import { cp, mkdir } from "node:fs/promises";
import { fileURLToPath } from "node:url";
const source = fileURLToPath(new URL("../apps/docs/content/", import.meta.url));
const target = fileURLToPath(new URL("../dist/apps/docs/content/", import.meta.url));
await mkdir(target, { recursive: true });
await cp(source, target, { recursive: true, force: true });
console.log("Docs content assets copied to root dist/apps/docs/content.");
