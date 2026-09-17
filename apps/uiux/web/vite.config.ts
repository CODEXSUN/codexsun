import { config } from "dotenv";
import { resolve } from "node:path";
import tailwindcss from "@tailwindcss/vite";
import react from "@vitejs/plugin-react";
import { defineConfig } from "vite";
import { z } from "zod";

config({ path: resolve(import.meta.dirname, "../../../.env") });
config({ path: resolve(import.meta.dirname, ".app.env"), override: true });

const runtimeConfig = z
  .object({
    PLATFORM_HOST: z.string().trim().min(1),
    UIUX_WEB_PORT: z.coerce.number().int().min(1).max(65_535),
  })
  .parse(process.env);

export default defineConfig({
  plugins: [react(), tailwindcss()],
  server: { host: runtimeConfig.PLATFORM_HOST, port: runtimeConfig.UIUX_WEB_PORT, strictPort: true },
  build: { outDir: "../../../dist/uiux/web", emptyOutDir: true },
});
