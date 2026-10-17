import type { PageContent } from "./page.schema.js";
export function serviceSlug(name: string) {
  return name
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");
}
export function sitePublicPaths(
  slug: string,
  content: PageContent,
  blogs: { slug: string }[] = []
) {
  const base = [
    "/",
    "/about",
    "/services",
    "/contact",
    "/blogs",
    "/privacy",
    ...blogs.map((post) => `/blogs/${post.slug}`)
  ];
  if (slug === "logicx")
    base.push(
      "/apps",
      "/support",
      ...(content.applications ?? []).map((app) => `/apps/${app.slug}`),
      ...content.finishes.items.map((service) => `/services/${serviceSlug(service.name)}`)
    );
  return [...new Set(base)];
}
