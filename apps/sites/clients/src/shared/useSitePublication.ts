import { useEffect, useState } from "react";
import { initialRamuTexPage, initialLogicxPage } from "@codexsun/sites-api/page-content";
import { sitePublicationSchema, type SitePublication } from "@codexsun/sites-api/public-contract";
import type { PageContent } from "@codexsun/sites-api/page-contract";

export function useSitePublication(slug: string, fallback?: PageContent) {
  const initial = fallback ?? (slug === "logicx" ? initialLogicxPage : initialRamuTexPage);
  const [bootstrap] = useState(() => initialPublication(slug));
  const [content, setContent] = useState(bootstrap?.content ?? initial);
  const [blogs, setBlogs] = useState<SitePublication["blogs"]>(bootstrap?.blogs ?? []);
  const [connected, setConnected] = useState(Boolean(bootstrap));
  const [published, setPublished] = useState(Boolean(bootstrap?.content));
  useEffect(() => {
    let active = true;
    let pending = false;
    const controller = new AbortController();
    async function refresh() {
      if (pending) return;
      pending = true;
      try {
        const response = await fetch(
          (slug === "ramutex"
            ? import.meta.env.VITE_CODEXSUN_SITES_RAMUTEX_CONTENT_URL
            : slug === "logicx"
              ? import.meta.env.VITE_CODEXSUN_SITES_LOGICX_CONTENT_URL
              : import.meta.env.VITE_CODEXSUN_SITES_CONTENT_URL) || "/__sites-content",
          { cache: "no-store", credentials: "omit", signal: controller.signal }
        );
        if (!response.ok) throw new Error("Published content is unavailable.");
        const envelope = (await response.json()) as { success?: boolean; data?: unknown };
        if (!envelope.success) throw new Error("Published content is unavailable.");
        const publication = sitePublicationSchema.parse(envelope.data);
        if (publication.siteSlug !== slug) throw new Error("Wrong client publication.");
        if (active) {
          setContent(publication.content ?? initial);
          setBlogs(publication.blogs);
          setConnected(true);
          setPublished(Boolean(publication.content));
        }
      } catch {
        if (active) setConnected(false);
      } finally {
        pending = false;
      }
    }
    void refresh();
    const interval = setInterval(() => void refresh(), 30000);
    const onFocus = () => void refresh();
    window.addEventListener("focus", onFocus);
    return () => {
      active = false;
      controller.abort();
      clearInterval(interval);
      window.removeEventListener("focus", onFocus);
    };
  }, [slug, initial]);
  return { content, blogs, connected, published };
}

function initialPublication(slug: string): SitePublication | null {
  const server = (globalThis as unknown as { __CODEXSUN_SITES_PUBLICATION__?: unknown })
    .__CODEXSUN_SITES_PUBLICATION__;
  try {
    const value =
      server ??
      (typeof document !== "undefined"
        ? JSON.parse(document.getElementById("codexsun-sites-publication")?.textContent || "null")
        : null);
    const result = sitePublicationSchema.safeParse(value);
    return result.success && result.data.siteSlug === slug ? result.data : null;
  } catch {
    return null;
  }
}
