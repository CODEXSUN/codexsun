import type { Plugin } from "vite";
import { writeFile, mkdir } from "node:fs/promises";
import { resolve } from "node:path";
import { portalMetadata } from "./src/portal.metadata.js";
import type { Company } from "./src/modules/company/company.types.js";
import type { Association } from "./src/modules/association/association.types.js";
import type { CommunityPost } from "./src/modules/community/community.types.js";
type Dataset = { companies: Company[]; associations: Association[]; posts: CommunityPost[] };
export function publicMetadataPlugin(
  apiOrigin: string,
  outDir: string,
  development: boolean,
  buildHost: string
): Plugin {
  let source = "";
  const cache = new Map<string, { until: number; data: Dataset }>();
  async function dataset(host: string): Promise<Dataset> {
    const cached = cache.get(host);
    if (cached && cached.until > Date.now()) return cached.data;
    const expectedTenant = process.env.CODEXSUN_TCONNECT_CORPORATE_ID;
    if (expectedTenant) {
      try {
        const response = await fetch(`${apiOrigin}/public/tconnect/registration`, {
          headers: { host },
          signal: AbortSignal.timeout(1800)
        });
        const context = await response.json();
        if (
          !response.ok ||
          !context.success ||
          context.data?.corporateId?.toUpperCase() !== expectedTenant.toUpperCase()
        )
          return { companies: [], associations: [], posts: [] };
      } catch {
        return { companies: [], associations: [], posts: [] };
      }
    }
    async function feed<T>(resource: string): Promise<T[]> {
      try {
        const response = await fetch(`${apiOrigin}/public/tconnect/${resource}`, {
          headers: { host },
          signal: AbortSignal.timeout(1800)
        });
        if (!response.ok) return [];
        const result = await response.json();
        return result.success ? result.data : [];
      } catch {
        return [];
      }
    }
    const [companies, associations, posts] = await Promise.all([
      feed<Company>("company"),
      feed<Association>("association"),
      feed<CommunityPost>("community")
    ]);
    const data = { companies, associations, posts };
    if (cache.size > 50) cache.clear();
    cache.set(host, { until: Date.now() + 5000, data });
    return data;
  }
  function render(html: string, path: string, data: Dataset) {
    const key = path.split("/")[2];
    const metadata = portalMetadata(path, {
      company: data.companies.find((row) => row.slug === key),
      association: data.associations.find(
        (row) =>
          row.slug === key ||
          row.uuid === data.posts.find((post) => post.uuid === key)?.associationUuid
      ),
      post: data.posts.find((row) => row.uuid === key)
    });
    let head = html
      .replace(/<title>[\s\S]*?<\/title>/i, `<title>${escape(metadata.title)}</title>`)
      .replace(
        /<meta[^>]+(?:name|property)=["'](?:description|og:[^"']+|twitter:[^"']+|robots)["'][^>]*>/gi,
        ""
      )
      .replace(/<link[^>]+rel=["']canonical["'][^>]*>/gi, "");
    const tags = [
      `<meta name="description" content="${escape(metadata.description)}">`,
      `<link rel="canonical" href="${escape(metadata.canonical)}">`,
      `<meta name="robots" content="${metadata.sample || metadata.account || development ? "noindex,follow" : "index,follow"}">`,
      `<meta name="twitter:card" content="summary_large_image">`,
      ...Object.entries({
        title: metadata.title,
        description: metadata.description,
        image: metadata.image,
        url: metadata.canonical,
        type: metadata.type
      }).map(([name, value]) => `<meta property="og:${name}" content="${escape(value)}">`)
    ];
    return head.replace("</head>", tags.join("\n") + "\n</head>");
  }
  return {
    name: "tconnect-public-metadata",
    enforce: "post",
    configureServer(server) {
      server.middlewares.use(async (req, res, next) => {
        const path = new URL(req.url ?? "/", "http://localhost").pathname;
        if (!path.startsWith("/social/companies/")) return next();
        const data = await dataset(req.headers.host ?? "127.0.0.1:7040");
        const company = data.companies.find((row) =>
          path.split("/").pop()?.startsWith(`${row.slug}.`)
        );
        const image = company?.logoDataUrl.match(
          /^data:image\/(png|jpeg|webp);base64,([A-Za-z0-9+/]+=*)$/
        );
        if (!image) {
          res.statusCode = 404;
          res.end();
          return;
        }
        res.setHeader("Content-Type", `image/${image[1]}`);
        res.setHeader("Cache-Control", "public, max-age=60");
        res.end(Buffer.from(image[2]!, "base64"));
      });
    },
    transformIndexHtml: {
      order: "post",
      async handler(html, context) {
        if (context.server) {
          const path = new URL(context.originalUrl ?? context.path, "http://localhost").pathname;
          return render(
            html,
            path,
            /\/(companies|associations|community)\/[^/]+/.test(path)
              ? await dataset(buildHost)
              : { companies: [], associations: [], posts: [] }
          );
        }
        source = html;
        return render(html, "/", { companies: [], associations: [], posts: [] });
      }
    },
    async closeBundle() {
      if (!source) return;
      const data = await dataset(buildHost);
      const paths = [
        "/",
        "/companies",
        "/categories",
        "/associations",
        "/community",
        "/join",
        "/login",
        "/register",
        "/register/buyer",
        "/contact",
        "/privacy",
        "/terms",
        "/standards",
        "/enterprises",
        ...data.companies.map((row) => `/companies/${row.slug}`),
        ...data.associations.map((row) => `/associations/${row.slug}`),
        ...data.posts.map((row) => `/community/${row.uuid}`)
      ];
      for (const path of paths) {
        const folder = resolve(outDir, `.${path}`);
        await mkdir(folder, { recursive: true });
        await writeFile(resolve(folder, "index.html"), render(source, path, data));
      }
      for (const company of data.companies) {
        const image = company.logoDataUrl.match(
          /^data:image\/(png|jpeg|webp);base64,([A-Za-z0-9+/]+=*)$/
        );
        if (!image) continue;
        const directory = resolve(outDir, "social/companies");
        await mkdir(directory, { recursive: true });
        await writeFile(
          resolve(directory, `${company.slug}.${image[1] === "jpeg" ? "jpg" : image[1]}`),
          Buffer.from(image[2]!, "base64")
        );
      }
      const publicPaths = paths.filter(
        (path) =>
          !/^\/(login|register)(\/|$)/.test(path) &&
          !data.companies.some(
            (row) =>
              path.endsWith(row.slug) && /sample|fictional|demo|illustrative/i.test(row.description)
          ) &&
          !data.associations.some(
            (row) =>
              path.endsWith(row.slug) && /sample|fictional|demo|illustrative/i.test(row.description)
          ) &&
          !data.posts.some(
            (row) =>
              path.endsWith(row.uuid) &&
              /sample|demo|illustrative/i.test(
                `${row.body} ${data.associations.find((item) => item.uuid === row.associationUuid)?.description ?? ""}`
              )
          )
      );
      await writeFile(
        resolve(outDir, "sitemap.xml"),
        `<?xml version="1.0" encoding="UTF-8"?><urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">${publicPaths.map((path) => `<url><loc>https://tirupurconnect.com${escape(path)}</loc></url>`).join("")}</urlset>`
      );
      await writeFile(
        resolve(outDir, "robots.txt"),
        "User-agent: *\nAllow: /\nSitemap: https://tirupurconnect.com/sitemap.xml\n"
      );
    }
  };
}
function escape(value: string) {
  return value
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#39;");
}
