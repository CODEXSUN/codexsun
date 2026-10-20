import { dirname, resolve } from "node:path";
import { pathToFileURL } from "node:url";
import { readFile, writeFile, mkdir, readdir } from "node:fs/promises";
import { routeMetadata, notFoundMetadata } from "../cloudflare/tenkasisports.content.mjs";
import { englishRouteMetadata } from "../cloudflare/tenkasisports.seo.mjs";

process.env.NODE_ENV = "production";
process.env.VITE_USER_NODE_ENV = "production";
const { build } = await import("vite");

for (const mode of process.argv.slice(2)) {
  if (!["logicx", "ramutex", "portfolio", "tirupurconnect", "tenkasisports"].includes(mode))
    throw new Error("Unsupported portfolio build mode.");
  await build({ configFile: resolve(import.meta.dirname, "../vite.config.ts"), mode });

  if (mode === "tenkasisports") {
    const outDir = resolve(import.meta.dirname, "../../../../dist/apps/sites/clients/tenkasisports");
    const templatePath = resolve(outDir, "index.html");
    const sourceHtml = await readFile(templatePath, "utf8");
    const pageChunk = (await readdir(resolve(outDir, "assets"))).find((file) => /^sports\.pages-.*\.js$/.test(file));
    const prerender = await buildSportsRenderer();
    const siteUrl = "https://tenkasisports.com";
    const socialImage = `${siteUrl}/club-logo.jpg`;
    const escapeAttribute = (value) => String(value)
      .replaceAll("&", "&amp;")
      .replaceAll('"', "&quot;")
      .replaceAll("<", "&lt;")
      .replaceAll(">", "&gt;");

    const renderPage = (path, meta, language = "ta") => {
      const baseUrl = `${siteUrl}${path === "/" ? "" : path}`;
      const englishUrl = `${siteUrl}/en${path === "/" ? "" : path}`;
      const canonical = language === "en" ? englishUrl : baseUrl;
      const seoTags = [
        ...(path === "/" ? ['<link rel="preload" as="image" href="/gallery-stance-4.webp" type="image/webp" />'] : []),
        ...(path !== "/" && pageChunk ? [`<link rel="modulepreload" crossorigin href="/assets/${pageChunk}" />`] : []),
        `<meta name="description" content="${escapeAttribute(meta.description)}" />`,
        ...(path === "/404" ? ['<meta name="robots" content="noindex, follow" />'] : []),
        `<meta property="og:title" content="${escapeAttribute(meta.title)}" />`,
        `<meta property="og:description" content="${escapeAttribute(meta.description)}" />`,
        `<meta property="og:url" content="${canonical}" />`,
        `<meta property="og:type" content="website" />`,
        `<meta property="og:site_name" content="Tenkasi District Sports Club" />`,
        `<meta property="og:locale" content="${language === "en" ? "en_IN" : "ta_IN"}" />`,
        `<meta property="og:image" content="${socialImage}" />`,
        '<meta name="twitter:card" content="summary" />',
        `<meta name="twitter:image" content="${socialImage}" />`,
        ...(path === "/" ? [`<script type="application/ld+json">${JSON.stringify({
          "@context": "https://schema.org",
          "@type": "Organization",
          name: "Tenkasi District Sports Club",
          alternateName: "Sivakalai Gurukulam",
          url: siteUrl,
          logo: socialImage,
          telephone: "+91-9843930300",
          address: {
            "@type": "PostalAddress",
            streetAddress: "8/18 Neerathilingam Street, Melur",
            addressLocality: "Shengottai",
            addressRegion: "Tamil Nadu",
            postalCode: "627809",
            addressCountry: "IN"
          }
        }).replaceAll("<", "\\u003c")}</script>`] : []),
        ...(path === "/404" ? [] : [
          `<link rel="alternate" hreflang="ta-IN" href="${baseUrl}" />`,
          `<link rel="alternate" hreflang="en-IN" href="${englishUrl}" />`,
          `<link rel="alternate" hreflang="x-default" href="${baseUrl}" />`
        ]),
        `<link rel="canonical" href="${canonical}" />`
      ].join("\n    ");

      return sourceHtml
        .replace('<html lang="en">', `<html lang="${language}" data-prerendered="true">`)
        .replace(/<title>[\s\S]*?<\/title>/i, `<title>${escapeAttribute(meta.title)}</title>`)
        .replace(/content="#0a0a0a"/i, 'content="#781714"')
        .replace("</head>", `    ${seoTags}\n  </head>`)
        .replace('<div id="root"></div>', `<div id="root">${prerender(path, language)}</div>`);
    };

    for (const [route, meta] of Object.entries(routeMetadata)) {
      for (const language of ["ta", "en"]) {
        const target = route === "/" && language === "ta"
          ? templatePath
          : resolve(outDir, `.${language === "en" ? `/en${route}` : route}`, "index.html");
        await mkdir(dirname(target), { recursive: true });
        await writeFile(target, renderPage(route, language === "en" ? englishRouteMetadata[route] : meta, language), "utf8");
      }
    }

    await writeFile(resolve(outDir, "404.html"), renderPage("/404", notFoundMetadata), "utf8");

    const sitemap = [
      '<?xml version="1.0" encoding="UTF-8"?>',
      '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9" xmlns:xhtml="http://www.w3.org/1999/xhtml">',
      ...Object.keys(routeMetadata).flatMap((route) => {
        const tamilUrl = `${siteUrl}${route === "/" ? "" : route}`;
        const englishUrl = `${siteUrl}/en${route === "/" ? "" : route}`;
        const alternates = [
          `    <xhtml:link rel="alternate" hreflang="ta-IN" href="${tamilUrl}" />`,
          `    <xhtml:link rel="alternate" hreflang="en-IN" href="${englishUrl}" />`,
          `    <xhtml:link rel="alternate" hreflang="x-default" href="${tamilUrl}" />`
        ];
        return [tamilUrl, englishUrl].map((url) => [
          "  <url>",
          `    <loc>${url}</loc>`,
          ...alternates,
          "  </url>"
        ].join("\n"));
      }),
      '</urlset>',
      ''
    ].join("\n");
    await writeFile(resolve(outDir, "sitemap.xml"), sitemap, "utf8");
    await writeFile(resolve(outDir, "robots.txt"), [
      "User-agent: *",
      "Allow: /",
      "Disallow: /api/",
      "Disallow: /__sites-",
      `Sitemap: ${siteUrl}/sitemap.xml`,
      ""
    ].join("\n"), "utf8");
  }
}

async function buildSportsRenderer() {
  const clientRoot = resolve(import.meta.dirname, "..");
  const serverDir = resolve(clientRoot, "../../../dist/apps/sites/prerender/tenkasisports");
  const { default: react } = await import("@vitejs/plugin-react");
  const { default: tailwindcss } = await import("@tailwindcss/vite");
  await build({
    configFile: false,
    root: clientRoot,
    plugins: [react(), tailwindcss()],
    define: { "import.meta.env.CODEXSUN_SITES_CLIENT_SLUG": '"tenkasisports"' },
    resolve: { dedupe: ["react", "react-dom"] },
    ssr: { noExternal: true },
    build: {
      ssr: resolve(clientRoot, "src/clients/tenkasisports/sports.prerender.tsx"),
      outDir: serverDir,
      emptyOutDir: true,
      rollupOptions: { output: { entryFileNames: "server.mjs", codeSplitting: false } }
    }
  });
  const server = await import(pathToFileURL(resolve(serverDir, "server.mjs")).href);
  return server.prerenderSportsPage;
}
