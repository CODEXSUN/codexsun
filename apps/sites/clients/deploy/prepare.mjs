import { build } from "vite";
import react from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";
import { readFile, writeFile, mkdir, cp, rm, readdir } from "node:fs/promises";
import { resolve, dirname, relative } from "node:path";
import { pathToFileURL } from "node:url";
import { verifyPublication } from "@codexsun/sites-api/delivery-integrity";
import { createHash } from "node:crypto";
import { writeBranding } from "./branding.mjs";
process.env.NODE_ENV = "production";
process.env.VITE_USER_NODE_ENV = "production";
const clientRoot = resolve(import.meta.dirname, "..");
const root = resolve(clientRoot, "../../..");
const args = process.argv.slice(2);
const snapshotFile = args[args.indexOf("--snapshot") + 1];
if (!args.includes("--snapshot") || !snapshotFile)
  throw new Error("Use --snapshot with a publication exported from the client's Studio.");
const raw = JSON.parse(await readFile(resolve(snapshotFile), "utf8"));
const snapshot = verifyPublication(raw.success ? raw.data : raw);
const slug = snapshot.siteSlug;
const named = ["logicx", "ramutex", "tenkasisports"].includes(slug);
const originIndex = args.indexOf("--origin");
const origin =
  originIndex >= 0 ? args[originIndex + 1] : `https://${snapshot.content.profile.domain}`;
if (new URL(origin).origin !== origin || !origin.startsWith("https://"))
  throw new Error("The deployment origin must be an HTTPS origin without a path.");
const output = resolve(root, "dist/apps/sites/releases", slug);
if (dirname(output) !== resolve(root, "dist/apps/sites/releases"))
  throw new Error("Unsafe release path.");
process.env.CODEXSUN_SITES_CLIENT_SLUG = slug;
await build({
  configFile: resolve(clientRoot, "vite.config.ts"),
  mode: named ? slug : "portfolio"
});
await rm(output, { recursive: true, force: true });
await mkdir(resolve(output, "runtime"), { recursive: true });
await cp(resolve(root, "dist/apps/sites/clients", slug), resolve(output, "public"), {
  recursive: true
});
await writeBranding(resolve(output, "public"), snapshot.content.profile.brand, slug);
const template = await readFile(resolve(output, "public/index.html"), "utf8");
await writeFile(resolve(output, "public/index.template.html"), template);
await writeFile(
  resolve(output, "release.json"),
  JSON.stringify(
    {
      schemaVersion: 1,
      siteUuid: snapshot.siteUuid,
      siteKey: snapshot.siteKey,
      siteSlug: slug,
      origin,
      checksum: snapshot.checksum,
      sequence: snapshot.sequence
    },
    null,
    2
  )
);
await writeFile(resolve(output, "publication.json"), JSON.stringify(snapshot, null, 2));
await build({
  configFile: false,
  root: clientRoot,
  plugins: [react(), tailwindcss()],
  define: { "import.meta.env.CODEXSUN_SITES_CLIENT_SLUG": JSON.stringify(slug) },
  resolve: {
    alias: {
      "@sites-client-entry": resolve(
        clientRoot,
        `src/clients/${named ? slug : "standard"}/site.tsx`
      )
    },
    dedupe: ["react", "react-dom"]
  },
  ssr: { noExternal: true },
  build: {
    ssr: resolve(clientRoot, "runtime/server.mjs"),
    outDir: resolve(output, "runtime"),
    emptyOutDir: true,
    rollupOptions: { output: { entryFileNames: "server.mjs", codeSplitting: false } }
  }
});
const runtime = await import(pathToFileURL(resolve(output, "runtime/server.mjs")).href);
for (const path of runtime.publicRoutes(snapshot)) {
  const file = resolve(output, "public", "." + path, "index.html");
  await mkdir(dirname(file), { recursive: true });
  await writeFile(file, runtime.renderPublicDocument(snapshot, path, template, origin));
}
for (const name of ["sitemap.xml", "site.xml"])
  await writeFile(resolve(output, "public", name), runtime.sitemap(snapshot, origin));
for (const name of ["robots.txt", "robo.txt"])
  await writeFile(resolve(output, "public", name), runtime.robots(origin));
await cp(resolve(clientRoot, "deploy/manage.mjs"), resolve(output, "runtime/manage.mjs"));
for (const file of ["Dockerfile", "nginx.conf", "compose.yaml", ".env.example"])
  await cp(resolve(clientRoot, "deploy", file), resolve(output, file));
const hostPort = slug === "logicx" ? 7131 : slug === "ramutex" ? 7132 : slug === "tenkasisports" ? 7134 : 8080;
const hostname = new URL(origin).hostname;
const unit = (await readFile(resolve(clientRoot, "deploy/site.service"), "utf8"))
  .replaceAll("client-slug", slug)
  .replace("https://client.example", origin)
  .replace("CODEXSUN_SITES_PORT=8080", `CODEXSUN_SITES_PORT=${hostPort}`);
await writeFile(resolve(output, "site.service"), unit);

const nginx = (await readFile(resolve(output, "nginx.conf"), "utf8"))
  .replaceAll("client.example", hostname)
  .replace("127.0.0.1:8080", `127.0.0.1:${hostPort}`);
await writeFile(resolve(output, "nginx.conf"), nginx);
await writeFile(
  resolve(output, ".env.example"),
  `CODEXSUN_SITES_ORIGIN=${origin}\nCODEXSUN_SITES_HOST_PORT=${hostPort}\n# Trust only the exact reverse-proxy IP seen by Node. Docker's bridge IP must be set explicitly.\nCODEXSUN_SITES_TRUSTED_PROXIES=\n`
);
const number =
  snapshot.content.profile.whatsappNumber ??
  snapshot.content.profile.phones[0]?.href.replace(/\D/g, "");
await writeFile(
  resolve(output, "readiness.json"),
  JSON.stringify(
    {
      site: slug,
      sequence: snapshot.sequence,
      renderedRoutes: runtime.publicRoutes(snapshot),
      sqlite: "Set CODEXSUN_SITES_DB to a persistent absolute path",
      contactForm: "SQLite enquiry submission enabled",
      whatsapp: number
        ? "Uses saved company number"
        : "Configure this client's company / WhatsApp number in Studio",
      map:
        snapshot.content.profile.mapQuery || snapshot.content.profile.address.length
          ? "Configured"
          : "Add company location in Studio",
      productionDeployment: "Not performed"
    },
    null,
    2
  )
);
console.log(`Prepared ${slug}: ${output}`);

const checksums = [];
async function hashDirectory(directory) {
  for (const entry of await readdir(directory, { withFileTypes: true })) {
    const path = resolve(directory, entry.name);
    if (entry.isDirectory()) await hashDirectory(path);
    else {
      if (/\.sqlite(?:-|$)/.test(entry.name))
        throw new Error("A release must not contain a runtime database.");
      checksums.push(
        `${createHash("sha256")
          .update(await readFile(path))
          .digest("hex")}  ${relative(output, path).replaceAll("\\", "/")}`
      );
    }
  }
}
await hashDirectory(output);
await writeFile(resolve(output, "checksums.sha256"), checksums.sort().join("\n") + "\n");
