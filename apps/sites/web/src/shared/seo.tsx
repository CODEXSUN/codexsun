import { useEffect } from "react";

type SeoProps = { title: string; description: string; keywords?: string[]; type?: "website" | "article" };

export function Seo({ title, description, keywords = [], type = "website" }: SeoProps) {
  useEffect(() => {
    const canonical = new URL(window.location.pathname, import.meta.env.VITE_SITES_PUBLIC_URL || window.location.origin).toString();
    document.title = title;
    setMeta("description", description);
    setMeta("keywords", keywords.join(", "));
    setMeta("robots", "index, follow");
    setMeta("og:title", title, "property");
    setMeta("og:description", description, "property");
    setMeta("og:type", type, "property");
    setMeta("og:url", canonical, "property");
    setMeta("og:site_name", "Sites Studio", "property");
    setMeta("twitter:card", "summary_large_image", "name");
    setMeta("twitter:title", title, "name");
    setMeta("twitter:description", description, "name");
    let link = document.querySelector<HTMLLinkElement>('link[rel="canonical"]');
    if (!link) { link = document.createElement("link"); link.rel = "canonical"; document.head.append(link); }
    link.href = canonical;
  }, [description, keywords, title, type]);
  return null;
}

export function StructuredData({ data }: { data: Record<string, unknown> }) {
  useEffect(() => {
    const id = "sites-structured-data";
    document.getElementById(id)?.remove();
    const script = document.createElement("script");
    script.id = id;
    script.type = "application/ld+json";
    script.textContent = JSON.stringify(data);
    document.head.append(script);
    return () => document.getElementById(id)?.remove();
  }, [data]);
  return null;
}

function setMeta(name: string, content: string, attribute = "name") {
  let meta = document.querySelector<HTMLMetaElement>(`meta[${attribute}="${name}"]`);
  if (!meta) { meta = document.createElement("meta"); meta.setAttribute(attribute, name); document.head.append(meta); }
  meta.content = content;
}
