import type { PageContent } from "@codexsun/sites-api/page-contract";
import { useEffect } from "react";
import type { PortalData } from "./portal.data";
import { portalMetadata } from "./portal.metadata";
export function usePortalMetadata(data: PortalData, content: PageContent) {
  const path = location.pathname.split("/").filter(Boolean);
  const company = data.companies.data.find((item) => item.slug === path[1]);
  const post = data.posts.data.find((item) => item.uuid === path[1]);
  const association = data.associations.data.find(
    (item) => item.slug === path[1] || item.uuid === post?.associationUuid
  );
  useEffect(() => {
    const metadata = portalMetadata(location.pathname, { company, association, post });
    if (location.pathname === "/") {
      metadata.title = content.pageTitle;
      metadata.description = content.description;
    }
    metadata.image = content.textile?.heroImage?.startsWith("https://")
      ? content.textile.heroImage
      : `https://tirupurconnect.com${content.textile?.heroImage ?? "/textiles/textile-hero.webp"}`;
    document.title = metadata.title;
    for (const [key, value] of Object.entries({
      title: metadata.title,
      description: metadata.description,
      url: metadata.canonical,
      image: metadata.image,
      type: metadata.type
    }))
      meta("property", `og:${key}`, value);
    meta("name", "description", metadata.description);
    meta("name", "twitter:card", "summary_large_image");
    meta("name", "twitter:title", metadata.title);
    meta("name", "twitter:description", metadata.description);
    meta("name", "twitter:image", metadata.image);
    meta(
      "name",
      "robots",
      metadata.sample || metadata.account || ["localhost", "127.0.0.1"].includes(location.hostname)
        ? "noindex,follow"
        : "index,follow"
    );
    let link = document.querySelector<HTMLLinkElement>('link[rel="canonical"]');
    if (!link) {
      link = document.createElement("link");
      link.rel = "canonical";
      document.head.append(link);
    }
    link.href = metadata.canonical;
    document.querySelector("[data-tconnect-structured]")?.remove();
    const record =
      path[0] === "companies" ? company : path[0] === "associations" ? association : undefined;
    if (record && !metadata.sample) {
      const script = document.createElement("script");
      script.type = "application/ld+json";
      script.dataset.tconnectStructured = "true";
      script.textContent = JSON.stringify({
        "@context": "https://schema.org",
        "@type": "Organization",
        name: record.name,
        description: record.description,
        url: metadata.canonical,
        address: { "@type": "PostalAddress", addressLocality: record.city }
      });
      document.head.append(script);
    }
  }, [location.pathname, company, association, post, content]);
}
function meta(attribute: "name" | "property", key: string, content: string) {
  let element = document.querySelector<HTMLMetaElement>(`meta[${attribute}="${key}"]`);
  if (!element) {
    element = document.createElement("meta");
    element.setAttribute(attribute, key);
    document.head.append(element);
  }
  element.content = content;
}
