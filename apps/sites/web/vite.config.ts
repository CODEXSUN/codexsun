import { config } from "dotenv";
import { resolve } from "node:path";
import react from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";
import { defineConfig, type Plugin } from "vite";
import { createAiTxt, createLlmsTxt, createRobots, createSitemap } from "./src/shared/seo-discovery";

config({ path: resolve(import.meta.dirname, ".app.env") });
config({ path: resolve(import.meta.dirname, "../../../.env") });

const reactSourceFiles = /(?:apps[\\/]sites[\\/]web[\\/]src|packages[\\/]ui[\\/]src)[\\/].*\.[jt]sx?$/u;
const publicOrigin = (
  process.env.VITE_SITES_PUBLIC_URL ??
  `http://${process.env.PLATFORM_HOST ?? "127.0.0.1"}:${process.env.SITES_WEB_PORT ?? "6261"}`
).replace(/\/$/u, "");
const standaloneClient = process.env.VITE_SITES_CLIENT_SLUG?.trim().toLowerCase();

export default defineConfig({
  cacheDir: "../../../dist/.vite/apps/sites/web",
  plugins: [react({ include: reactSourceFiles }), tailwindcss(), publicMetadataPlugin(publicOrigin, standaloneClient)],
  server: {
    allowedHosts: [".tmnext.in"],
    host: process.env.PLATFORM_HOST ?? "127.0.0.1",
    port: Number(process.env.SITES_WEB_PORT ?? 6261),
    proxy: { "/api": process.env.VITE_SITES_API_URL ?? "http://127.0.0.1:6260" },
    strictPort: true,
  },
  build: {
    outDir: "../../../dist/apps/sites/web",
    emptyOutDir: true,
    rollupOptions: {
      output: {
        manualChunks(id) {
          if (id.includes("node_modules/@codexsun/ui") || id.includes("packages/ui/src")) return "ui";
          if (id.includes("node_modules")) return "vendor";
          if (id.includes("apps/sites/web/src/Clients/")) return "client-pages";
          return undefined;
        },
      },
    },
  },
});

function publicMetadataPlugin(origin: string, standaloneSlug?: string): Plugin {
  const files = {
    "robots.txt": createRobots(origin, standaloneSlug),
    "ai.txt": createAiTxt(origin),
    "llms.txt": createLlmsTxt(origin),
    "sitemap.xml": createSitemap(origin, standaloneSlug),
  };
  return {
    name: "sites-public-metadata",
    configureServer(server) {
      server.middlewares.use((request, response, next) => {
        const pathname = request.url?.split("?")[0]?.slice(1);
        const body = pathname ? files[pathname as keyof typeof files] : undefined;
        if (!body) return next();
        response.setHeader("Content-Type", pathname === "sitemap.xml" ? "application/xml" : "text/plain");
        response.end(body);
      });
    },
    generateBundle() {
      for (const [fileName, source] of Object.entries(files)) this.emitFile({ type: "asset", fileName, source });
    },
  };
}
