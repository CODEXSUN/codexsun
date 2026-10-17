import { resolve } from "node:path";
process.env.NODE_ENV = "production";
process.env.VITE_USER_NODE_ENV = "production";
const { build } = await import("vite");
for (const mode of process.argv.slice(2)) {
  if (!["logicx", "ramutex", "portfolio", "tirupurconnect"].includes(mode))
    throw new Error("Unsupported portfolio build mode.");
  await build({ configFile: resolve(import.meta.dirname, "../vite.config.ts"), mode });
}
