import { defineConfig, loadEnv } from "vite";
import { readFileSync, readdirSync } from "node:fs";
import { resolve } from "node:path";
import react from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";

const root = resolve(import.meta.dirname, "../../..");
const registry = resolve(root, "core/registry/applications");
const registryPorts = Object.fromEntries(
  readdirSync(registry).filter((file) => file.endsWith(".json")).flatMap((file) => {
    const application = JSON.parse(readFileSync(resolve(registry, file), "utf8")) as {
      mdi?: { localUrlKey?: string };
      hosts?: { kind: string; defaultPort?: number }[];
    };
    const key = application.mdi?.localUrlKey;
    const port = application.hosts?.find((host) => host.kind === "web")?.defaultPort;
    return key && Number.isInteger(port) && port! > 0 && port! <= 65535 ? [[key, String(port)]] : [];
  }),
);
const publicPortDefaults = {
  // The shared catalog still lists CXForge although its registry has no web host.
  VITE_CXFORGE_WEB_URL: "6401",
  ...Object.fromEntries(
  [...readFileSync(resolve(root, ".env.example"), "utf8").matchAll(/^(VITE_[A-Z0-9_]+_WEB_URL)=(\d+)\s*$/gmu)].map(
    (match) => [match[1], match[2]],
  ),
  ),
};

export default defineConfig(({ mode }) => ({
  define: Object.fromEntries(
    Object.entries({ ...registryPorts, ...publicPortDefaults, ...loadEnv(mode, root, "VITE_") })
      .filter(([key]) => /^VITE_[A-Z0-9_]+_WEB_URL$/u.test(key))
      .map(([key, value]) => [`import.meta.env.${key}`, JSON.stringify(value)]),
  ),
  cacheDir: "../../../dist/.vite/agentcrew",
  plugins: [react(), tailwindcss()],
  server: { host: "127.0.0.1", port: 6411, strictPort: true, proxy: { "/api": "http://127.0.0.1:6410" } },
  build: { outDir: "../../../dist/devkits/agentcrew/web", emptyOutDir: true },
}));
