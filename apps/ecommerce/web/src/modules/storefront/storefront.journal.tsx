import { lazy, Suspense, useEffect, useState } from "react";
import { BlogSolutionsSection, StoreFooter } from "./storefront.components";
import { StoreHeader } from "./storefront.navigation";
import {
  getStorefrontBranding,
  getStorefrontBlogAvailability,
  getStorefrontDiscovery,
  getStorefrontSiteNavigation,
  listLatestBlogPosts
} from "./storefront.services";
import type {
  StorefrontBlogPost,
  StorefrontBranding,
  StorefrontDiscovery,
  StorefrontSiteNavigation
} from "./storefront.types";

const Article = lazy(() =>
  import("@codexsun/blog/web").then((module) => ({ default: module.PublicArticlePage }))
);

export function StorefrontJournalPage({ slug }: { slug: string }) {
  const [branding, setBranding] = useState<StorefrontBranding | null>(null);
  const [navigation, setNavigation] = useState<StorefrontSiteNavigation | null>(null);
  const [discovery, setDiscovery] = useState<StorefrontDiscovery>({
    brands: [],
    categories: [],
    priceRange: { minimum: 0, maximum: 0 }
  });
  const [posts, setPosts] = useState<StorefrontBlogPost[]>([]);
  const [error, setError] = useState("");
  const [blogEnabled, setBlogEnabled] = useState<boolean | null>(null);
  useEffect(() => {
    let active = true;
    void Promise.all([
      getStorefrontBranding(),
      getStorefrontSiteNavigation(),
      getStorefrontDiscovery(),
      slug ? Promise.resolve([]) : listLatestBlogPosts(),
      getStorefrontBlogAvailability()
    ])
      .then(([brand, site, catalog, articles, enabled]) => {
        if (!active) return;
        setBranding(brand);
        setNavigation(site);
        setDiscovery(catalog);
        setPosts(articles);
        setBlogEnabled(enabled);
      })
      .catch(() => {
        if (active) setError("The journal could not be loaded. Please try again.");
      });
    return () => {
      active = false;
    };
  }, [slug]);
  return (
    <div className="cx-store">
      <StoreHeader
        announcement={null}
        branding={branding}
        discovery={discovery}
        filters={{
          brand: "",
          category: "",
          scope: "all",
          search: "",
          sort: "featured",
          minPrice: null,
          maxPrice: null
        }}
      />
      <div>
        {error ? <p role="alert">{error}</p> : null}
        {blogEnabled === null ? (
          <p role="status">Loading journal…</p>
        ) : !blogEnabled ? (
          <p role="status">Stories are not available for this site.</p>
        ) : slug ? (
          <Suspense fallback={<p role="status">Loading article…</p>}>
            <Article slug={slug} />
          </Suspense>
        ) : (
          <main>
            <BlogSolutionsSection brandName={branding?.brandName} posts={posts} />
          </main>
        )}
      </div>
      <StoreFooter branding={branding} navigation={navigation} />
    </div>
  );
}
