import { config } from "dotenv";
import { resolve } from "node:path";
import react from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";
import { defineConfig } from "vite";

config({ path: resolve(import.meta.dirname, "../../../.env") });
config({ path: resolve(import.meta.dirname, ".app.env"), override: true });

export default defineConfig({
  cacheDir: "../../../dist/.vite/devkits/codeloop/web",
  plugins: [react(), tailwindcss()],
  resolve: {
    alias: {
      "framer-motion": resolve(import.meta.dirname, "../../../node_modules/framer-motion/dist/es/index.mjs"),
    },
  },
  server: {
    host: process.env.PLATFORM_HOST ?? "127.0.0.1",
    port: Number(process.env.CODELOOP_WEB_PORT ?? 6371),
    proxy: { "/api": process.env.VITE_CODELOOP_API_URL ?? "http://127.0.0.1:6370" },
    strictPort: true,
  },
  build: {
    outDir: "../../../dist/devkits/codeloop/web",
    emptyOutDir: true,
    chunkSizeWarningLimit: 500,
    rollupOptions: {
      output: {
        manualChunks(id) {
          const normalized = id.replaceAll("\\\\", "/");
          if (normalized.includes("node_modules")) {
            if (normalized.includes("react/") || normalized.includes("react-dom/") || normalized.includes("scheduler/") || normalized.includes("@base-ui/") || normalized.includes("use-sync-external-store/")) return "react-vendor";
            if (normalized.includes("framer-motion")) return "motion-vendor";
            if (normalized.includes("lucide-react")) return "icons-vendor";
            if (normalized.includes("@radix-ui")) return "radix-vendor";
            if (normalized.includes("@tanstack") || normalized.includes("/reselect/") || normalized.includes("/detect-node-es/")) return "tanstack-vendor";
            if (normalized.includes("react-markdown") || normalized.includes("remark-") || normalized.includes("unified")) return "markdown-vendor";
            if (normalized.includes("html2canvas") || normalized.includes("dompurify")) return "document-vendor";
            const packagePath = normalized.split("/node_modules/").pop() ?? "runtime";
            const packageParts = packagePath.split("/");
            const packageName = packageParts[0]?.startsWith("@") ? packageParts.slice(0, 2).join("-") : packageParts[0] ?? "runtime";
            return `vendor-${packageName.replaceAll("@", "")}`;
          }
          if (normalized.includes("/packages/ui/src/components/")) return "ui-components";
          return undefined;
        },
      },
    },
  },
});
