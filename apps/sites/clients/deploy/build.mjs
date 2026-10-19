import { resolve } from "node:path";
import { readFile, writeFile, mkdir, readdir } from "node:fs/promises";
import { routeMetadata, notFoundMetadata } from "../cloudflare/tenkasisports.content.mjs";

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
    const siteUrl = "https://tenkasisports.com";
    const socialImage = `${siteUrl}/club-logo.jpg`;
    const escapeAttribute = (value) => String(value)
      .replaceAll("&", "&amp;")
      .replaceAll('"', "&quot;")
      .replaceAll("<", "&lt;")
      .replaceAll(">", "&gt;");

    const renderPage = (path, meta) => {
      const canonical = `${siteUrl}${path === "/" ? "" : path}`;
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
        `<link rel="canonical" href="${canonical}" />`
      ].join("\n    ");

      return sourceHtml
        .replace('<html lang="en">', '<html lang="ta">')
        .replace(/<title>[\s\S]*?<\/title>/i, `<title>${escapeAttribute(meta.title)}</title>`)
        .replace(/content="#0a0a0a"/i, 'content="#781714"')
        .replace("</head>", `    ${seoTags}\n  </head>`);
    };

    // Update root index.html
    await writeFile(templatePath, renderPage("/", routeMetadata["/"]), "utf8");

    // Prerender all known public page routes
    for (const [route, meta] of Object.entries(routeMetadata)) {
      if (route === "/") continue;
      const targetDir = resolve(outDir, `.${route}`);
      await mkdir(targetDir, { recursive: true });
      await writeFile(resolve(targetDir, "index.html"), renderPage(route, meta), "utf8");
    }

    // Prerender 404 page
    await writeFile(resolve(outDir, "404.html"), renderPage("/404", notFoundMetadata), "utf8");

    const sitemap = [
      '<?xml version="1.0" encoding="UTF-8"?>',
      '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">',
      ...Object.keys(routeMetadata).map((route) => `  <url><loc>${siteUrl}${route === "/" ? "" : route}</loc></url>`),
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
