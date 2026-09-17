import { config } from "dotenv";
import { resolve } from "node:path";
import { z } from "zod";
import tailwindcss from "@tailwindcss/vite";
import react from "@vitejs/plugin-react";
import { defineConfig } from "vite";

config({ path: resolve(import.meta.dirname, "../../../.env") });
config({ path: resolve(import.meta.dirname, ".app.env"), override: true });

const webConfig = z
  .object({
    ORSHIP_HOST: z.string().trim().min(1),
    ORSHIP_WEB_PORT: z.coerce.number().int().min(1).max(65535),
  })
  .parse(process.env);

export default defineConfig({
  plugins: [react(), tailwindcss()],
  server: { host: webConfig.ORSHIP_HOST, port: webConfig.ORSHIP_WEB_PORT, strictPort: true },
  build: { outDir: "../../../dist/orship/web", emptyOutDir: true },
});
