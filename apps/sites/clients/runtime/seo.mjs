import { sitePublicPaths } from "@codexsun/sites-api/page-routes";
export const publicRoutes = (snapshot) =>
  sitePublicPaths(snapshot.siteSlug, snapshot.content, snapshot.blogs);
export function escapeHtml(value) {
  return String(value).replace(
    /[&<>"']/g,
    (char) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[char]
  );
}
export function sitemap(snapshot, origin) {
  return `<?xml version="1.0" encoding="UTF-8"?><urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">${publicRoutes(
    snapshot
  )
    .map((path) => `<url><loc>${escapeHtml(origin + path)}</loc></url>`)
    .join("")}</urlset>`;
}
export function robots(origin) {
  return `User-agent: *\nAllow: /\nDisallow: /content/\nDisallow: /__sites-content\nDisallow: /health\nSitemap: ${origin}/sitemap.xml\n`;
}
export function documentHead(snapshot, path, origin) {
  const { content, blogs } = snapshot;
  const post = blogs.find((post) => path === `/blogs/${post.slug}`);
  const app = content.applications?.find((app) => path === `/apps/${app.slug}`);
  const service = content.finishes.items.find(
    (item) =>
      path ===
      `/services/${item.name
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, "-")
        .replace(/^-|-$/g, "")}`
  );
  const label =
    app?.name ||
    service?.name ||
    {
      "/apps": "Business applications",
      "/support": "Support & maintenance",
      "/about": "About",
      "/services": "Services",
      "/contact": "Contact",
      "/blogs": "Blog",
      "/privacy": "Privacy notice"
    }[path];
  const title = post
    ? `${post.title} | ${content.profile.name}`
    : label
      ? `${label} | ${content.profile.name}`
      : content.pageTitle;
  const description =
    app?.summary ??
    service?.detail ??
    post?.summary ??
    (path === "/about"
      ? content.about.intro
      : path === "/services"
        ? content.finishes.intro
        : path === "/contact"
          ? content.contact.intro
          : content.description);
  const canonical = origin + path;
  const structured = {
    "@context": "https://schema.org",
    "@type": "Organization",
    name: content.profile.name,
    url: origin,
    logo: origin + "/logo.svg",
    ...(content.profile.emails[0] ? { email: content.profile.emails[0] } : {}),
    ...(content.profile.phones[0] ? { telephone: content.profile.phones[0].href } : {})
  };
  const json = (value) => JSON.stringify(value).replace(/</g, "\\u003c");
  return `<title>${escapeHtml(title)}</title><meta name="description" content="${escapeHtml(description)}"><link rel="canonical" href="${escapeHtml(canonical)}"><meta property="og:title" content="${escapeHtml(title)}"><meta property="og:description" content="${escapeHtml(description)}"><meta property="og:url" content="${escapeHtml(canonical)}"><meta property="og:type" content="${post ? "article" : "website"}"><meta property="og:image" content="${origin}/social-card.png"><meta name="twitter:card" content="summary_large_image"><link rel="icon" href="/favicon.svg" type="image/svg+xml"><link rel="icon" href="/favicon.ico" sizes="any"><link rel="apple-touch-icon" href="/apple-touch-icon.png"><link rel="manifest" href="/site.webmanifest"><script type="application/ld+json">${json(structured)}</script>`;
}
