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
  if (slug === "tenkasisports")
    return [
      "/",
      "/about",
      "/programs",
      "/silambam",
      "/sports",
      "/classes",
      "/masters",
      "/events",
      "/gallery",
      "/join",
      "/contact",
      "/privacy",
      "/terms"
    ];
  if (slug === "tirupurconnect")
    return [
      "/",
      "/companies",
      "/categories",
      "/associations",
      "/community",
      "/contact",
      "/privacy",
      "/terms",
      "/standards",
      "/enterprises",
      "/join",
      "/login",
      "/register",
      "/register/buyer"
    ];
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
