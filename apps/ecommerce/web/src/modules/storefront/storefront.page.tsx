import { useEffect, useState } from "react";
import { ArrowLeftIcon, ArrowRightIcon } from "lucide-react";
import {
  getStorefrontAnnouncement,
  getStorefrontBootstrap,
  getStorefrontBranding,
  getStorefrontDiscovery,
  getStorefrontProduct,
  getStorefrontSiteNavigation,
  getStorefrontSliders,
  getStorefrontPromotions,
  getStorefrontFeaturedCards,
  listLatestBlogPosts,
  listStorefrontProducts
} from "./storefront.services";
import {
  BackToTopButton,
  CatalogFilters,
  CollectionFilter,
  ProductCard,
  StoreFooter
} from "./storefront.components";
import { StorefrontHomeSections } from "./storefront.home-sections";
import { CampaignsCollection, resolveStorefrontCampaigns } from "./storefront.campaigns";
import { StoreHeader } from "./storefront.navigation";
import type {
  StorefrontAnnouncement,
  StorefrontBranding,
  StorefrontDiscovery,
  StorefrontFilters,
  StorefrontProduct,
  StorefrontProductDetail,
  StorefrontBlogPost,
  StorefrontSiteNavigation,
  StorefrontSlider,
  StorefrontPromotion
} from "./storefront.types";
import type { StorefrontFeaturedCard } from "./storefront.types";
import {
  hasStorefrontPrice,
  money,
  responsiveImageSrcSet,
  whatsappLink
} from "./storefront.formatters";
import "./storefront.css";
import { PikoStoreAssistant } from "./storefront.assistant";
import { addStorefrontCartItem } from "./storefront.cart";
import { createProductStructuredData, setStorefrontSeo } from "./storefront.seo";
import { observeStorefrontVitals } from "./storefront.performance";
import { StorefrontCartPage } from "./storefront.cart.page";
import { useStorefrontCatalog } from "./storefront.catalog";

const emptyDiscovery: StorefrontDiscovery = {
  brands: [],
  categories: [],
  priceRange: { maximum: 0, minimum: 0 }
};

export function StorefrontPage() {
  useEffect(() => observeStorefrontVitals(), []);
  const path = window.location.pathname;
  const productSlug = path.startsWith("/shop/product/") ? decodeURIComponent(path.slice(14)) : "";
  const category = path.startsWith("/shop/category/") ? decodeURIComponent(path.slice(15)) : "";
  const page = productSlug ? (
    <ProductPage slug={productSlug} />
  ) : path === "/cart" ? (
    <StorefrontCartPage />
  ) : path === "/campaigns" ? (
    <CampaignsPage />
  ) : path === "/search" || category ? (
    <CatalogPage category={category} searchPage />
  ) : (
    <CatalogPage category="" />
  );
  return (
    <>
      {page}
      <PikoStoreAssistant />
    </>
  );
}

function CampaignsPage() {
  const [campaignEvents, setCampaignEvents] = useState<StorefrontPromotion[]>([]);
  const [campaigns, setCampaigns] = useState<StorefrontPromotion[]>([]);
  const [campaignCards, setCampaignCards] = useState<StorefrontFeaturedCard[]>([]);
  const [campaignSlides, setCampaignSlides] = useState<StorefrontSlider[]>([]);
  const [discovery, setDiscovery] = useState<StorefrontDiscovery>(emptyDiscovery);
  const [siteNavigation, setSiteNavigation] = useState<StorefrontSiteNavigation | null>(null);
  const [announcement, setAnnouncement] = useState<StorefrontAnnouncement | null>(null);
  const [branding, setBranding] = useState<StorefrontBranding | null>(null);

  useEffect(() => {
    void loadOptional(
      getStorefrontBootstrap().then((value) => value.campaignEvents),
      setCampaignEvents
    );
    void loadOptional(getStorefrontPromotions(), setCampaigns);
    void loadOptional(getStorefrontFeaturedCards(), setCampaignCards);
    void loadOptional(getStorefrontSliders(), setCampaignSlides);
    void loadOptional(getStorefrontDiscovery(), setDiscovery);
    void loadOptional(getStorefrontSiteNavigation(), setSiteNavigation);
    void loadOptional(getStorefrontAnnouncement(), setAnnouncement);
    void loadOptional(getStorefrontBranding(), setBranding);
  }, []);
  useEffect(() => {
    setStorefrontSeo({
      description:
        "Explore active Tech Media campaigns, events, launches, seasonal offers, and customer programmes in Tiruppur.",
      path: "/campaigns",
      title: `Campaigns and Events | ${branding?.brandName || "Tech Media"}`
    });
  }, [branding?.brandName]);

  return (
    <div className="cx-store">
      <StoreHeader
        announcement={announcement}
        branding={branding}
        discovery={discovery}
        filters={defaultFilters("", "")}
      />
      <CampaignsCollection
        campaigns={
          campaignEvents.length
            ? campaignEvents
            : resolveStorefrontCampaigns(campaigns, campaignCards, campaignSlides)
        }
      />
      <BackToTopButton />
      <StoreFooter branding={branding} navigation={siteNavigation} />
    </div>
  );
}

function CatalogPage({ category, searchPage = false }: { category: string; searchPage?: boolean }) {
  const initialSearch = new URLSearchParams(window.location.search).get("q") ?? "";
  const initialScope = searchScope();
  const [discovery, setDiscovery] = useState<StorefrontDiscovery>(emptyDiscovery);
  const [filters, setFilters] = useState<StorefrontFilters>({
    ...defaultFilters(category, searchPage ? initialSearch : ""),
    scope: searchPage ? initialScope : "all"
  });
  const [loadMoreMarker, setLoadMoreMarker] = useState<HTMLDivElement | null>(null);
  const [blogPosts, setBlogPosts] = useState<StorefrontBlogPost[]>([]);
  const [siteNavigation, setSiteNavigation] = useState<StorefrontSiteNavigation | null>(null);
  const [announcement, setAnnouncement] = useState<StorefrontAnnouncement | null>(null);
  const [branding, setBranding] = useState<StorefrontBranding | null>(null);
  const [slides, setSlides] = useState<StorefrontSlider[]>([]);
  const [promotions, setPromotions] = useState<StorefrontPromotion[]>([]);
  const [featuredCards, setFeaturedCards] = useState<StorefrontFeaturedCard[]>([]);
  const [brandStrips, setBrandStrips] = useState<StorefrontDiscovery["brands"]>([]);
  const [seasonStrips, setSeasonStrips] = useState<StorefrontPromotion[]>([]);
  const [campaignEvents, setCampaignEvents] = useState<StorefrontPromotion[]>([]);
  const [contentReady, setContentReady] = useState(false);

  useEffect(() => {
    let active = true;
    void loadCatalogPageContent(searchPage).then((content) => {
      if (!active) return;
      setDiscovery(content.discovery);
      setSiteNavigation(content.siteNavigation);
      setAnnouncement(content.announcement);
      setBranding(content.branding);
      setSlides(content.slides);
      setPromotions(content.promotions);
      setFeaturedCards(content.featuredCards);
      setBrandStrips(content.brandStrips);
      setSeasonStrips(content.seasonStrips);
      setCampaignEvents(content.campaignEvents);
      setBlogPosts(content.blogPosts);
      setContentReady(true);
    });
    return () => {
      active = false;
    };
  }, [searchPage]);
  useEffect(() => {
    if (!branding?.brandName) return;
    setStorefrontSeo({
      description:
        "Tech Media provides computers, laptops, networking, IT infrastructure, business technology, and dependable service in Tiruppur.",
      path: searchPage ? "/search" : window.location.pathname,
      ...(searchPage ? { robots: "noindex,follow" } : {}),
      title: category
        ? `${category} Products in Tiruppur | ${branding.brandName}`
        : `${branding.brandName} | Computers and IT Solutions in Tiruppur`
    });
  }, [branding?.brandName, category, searchPage]);
  const { error, hasMore, loading, loadingMore, loadMore, products } =
    useStorefrontCatalog(filters);
  useEffect(() => {
    if (!loadMoreMarker || !hasMore || loading) return;
    const rootMargin = `${catalogPreloadDistance(loadMoreMarker)}px 0px`;
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0]?.isIntersecting) void loadMore();
      },
      { rootMargin }
    );
    observer.observe(loadMoreMarker);
    return () => observer.disconnect();
  }, [hasMore, loadMore, loadMoreMarker, loading]);

  const catalogSection = (
    <section className="cx-store__catalog" id="catalog">
      <div className="cx-store__section-title">
        <div>
          <span>{searchPage ? "Search and filter" : "The complete collection"}</span>
          <h2>
            {loading
              ? "Loading products…"
              : searchPage
                ? "Find products that match what you need"
                : "Technology for work, life, and everything in between"}
          </h2>
        </div>
        {searchPage ? (
          <button onClick={() => setFilters(defaultFilters("", ""))}>Clear all</button>
        ) : null}
      </div>
      {!searchPage ? (
        <CollectionFilter
          categories={discovery.categories}
          filters={filters}
          onFilters={setFilters}
        />
      ) : null}
      <div className={searchPage ? "cx-store__catalog-layout" : "cx-store__catalog-full"}>
        {searchPage ? (
          <CatalogFilters discovery={discovery} filters={filters} onFilters={setFilters} />
        ) : null}
        <div>
          <div className="cx-store__grid">
            {loading ? <ProductSkeletons count={8} /> : null}
            {products.map((item, index) => (
              <ProductCard
                brandName={branding?.brandName}
                eagerImage={index < 4}
                key={item.slug}
                product={item}
                whatsappNumber={branding?.primaryPhone}
              />
            ))}
            {loadingMore ? <ProductSkeletons count={4} /> : null}
          </div>
          <div ref={setLoadMoreMarker} className="cx-store__load-marker" aria-hidden="true" />
          {!loading && products.length === 0 ? (
            <p className="cx-store__empty">{error || "No products match this selection."}</p>
          ) : null}
        </div>
      </div>
    </section>
  );

  if (!contentReady) {
    return <div className="cx-store cx-store--initializing" aria-busy="true" />;
  }

  return (
    <div className="cx-store">
      <StoreHeader
        announcement={announcement}
        branding={branding}
        discovery={discovery}
        filters={filters}
      />
      <main className={searchPage ? "cx-store__search-main" : undefined}>
        {searchPage ? (
          catalogSection
        ) : (
          <StorefrontHomeSections
            blogPosts={blogPosts}
            brandName={branding?.brandName}
            brands={discovery.brands}
            brandStrips={brandStrips}
            campaignEvents={campaignEvents}
            catalog={catalogSection}
            featuredCards={featuredCards}
            promotions={promotions}
            seasonStrips={seasonStrips}
            siteNavigation={siteNavigation}
            slides={slides}
          />
        )}
      </main>
      <BackToTopButton />
      <StoreFooter branding={branding} navigation={siteNavigation} />
    </div>
  );
}

function catalogPreloadDistance(marker: HTMLDivElement) {
  const grid = marker.previousElementSibling;
  const card = grid?.firstElementChild;
  if (!(grid instanceof HTMLElement) || !(card instanceof HTMLElement)) return 1000;
  const rowGap = Number.parseFloat(window.getComputedStyle(grid).rowGap) || 0;
  return Math.max(800, Math.ceil((card.getBoundingClientRect().height + rowGap) * 2));
}

function ProductSkeletons({ count }: { count: number }) {
  return Array.from({ length: count }, (_, index) => (
    <div className="cx-product-skeleton" key={index} aria-hidden="true">
      <div className="cx-product-skeleton__image" />
      <div className="cx-product-skeleton__line cx-product-skeleton__line--short" />
      <div className="cx-product-skeleton__line" />
      <div className="cx-product-skeleton__line" />
    </div>
  ));
}

function ProductPage({ slug }: { slug: string }) {
  const [product, setProduct] = useState<StorefrontProductDetail | null>(null);
  const [similarProducts, setSimilarProducts] = useState<StorefrontProduct[]>([]);
  const [discovery, setDiscovery] = useState<StorefrontDiscovery>(emptyDiscovery);
  const [error, setError] = useState("");
  const [siteNavigation, setSiteNavigation] = useState<StorefrontSiteNavigation | null>(null);
  const [announcement, setAnnouncement] = useState<StorefrontAnnouncement | null>(null);
  const [branding, setBranding] = useState<StorefrontBranding | null>(null);
  useEffect(() => {
    Promise.all([getStorefrontProduct(slug), getStorefrontDiscovery()])
      .then(async ([item, data]) => {
        setProduct(item);
        setDiscovery(data);
        const related = await listStorefrontProducts(defaultFilters(item.category, ""));
        setSimilarProducts(related.filter((candidate) => candidate.slug !== item.slug).slice(0, 4));
      })
      .catch((reason) =>
        setError(reason instanceof Error ? reason.message : "Product unavailable")
      );
  }, [slug]);
  useEffect(() => {
    Promise.all([
      getStorefrontSiteNavigation(),
      getStorefrontAnnouncement(),
      getStorefrontBranding()
    ]).then(([navigation, activeAnnouncement, activeBranding]) => {
      setSiteNavigation(navigation);
      setAnnouncement(activeAnnouncement);
      setBranding(activeBranding);
    });
  }, []);
  useEffect(() => {
    if (!product) return;
    const description =
      product.shortDescription ||
      product.description ||
      `${product.name} from Tech Media, Tiruppur.`;
    setStorefrontSeo({
      description,
      path: `/shop/product/${encodeURIComponent(product.slug)}`,
      structuredData: createProductStructuredData({
        brand: product.brand,
        description,
        imageUrl: product.imageUrl,
        name: product.name,
        price: product.price,
        slug: product.slug
      }),
      title: `${product.name} | Tech Media Tiruppur`
    });
  }, [product]);
  const header = (
    <StoreHeader
      announcement={announcement}
      branding={branding}
      discovery={discovery}
      filters={defaultFilters("", "")}
    />
  );
  if (error)
    return (
      <div className="cx-store">
        {header}
        <main className="cx-store__empty">{error}</main>
      </div>
    );
  if (!product)
    return (
      <div className="cx-store">
        {header}
        <main className="cx-store__empty">Loading product…</main>
      </div>
    );
  const enquiry = whatsappLink(
    `Hello${branding?.brandName ? ` ${branding.brandName}` : ""}, I would like to know more about ${product.name}.`,
    branding?.primaryPhone
  );
  const priced = hasStorefrontPrice(product.price);
  const bulletPoints = product.bulletPoints.filter(Boolean);
  const hasPolicies = Boolean(product.warranty || product.returnPolicy);
  return (
    <div className="cx-store">
      {header}
      <main className="cx-detail">
        <button
          className="cx-detail__back"
          onClick={() => {
            if (window.history.length > 1) window.history.back();
            else window.location.assign("/shop");
          }}
          type="button"
        >
          <ArrowLeftIcon aria-hidden="true" /> Back
        </button>
        <div className="cx-detail__image">
          <img
            src={product.imageUrl}
            alt={product.imageAlt}
            height={900}
            sizes="(max-width: 900px) 100vw, 50vw"
            srcSet={responsiveImageSrcSet(product.imageUrl, [480, 768, 960, 1200])}
            width={900}
          />
        </div>
        <div className="cx-detail__copy">
          {product.category ? (
            <a href={`/shop/category/${encodeURIComponent(product.category)}`}>
              {product.category}
            </a>
          ) : null}
          <h1>{product.name}</h1>
          {product.shortDescription ? (
            <p className="cx-detail__subtitle">{product.shortDescription}</p>
          ) : null}
          {priced ? (
            <div className="cx-detail__price">
              <strong>{money(product.price)}</strong>
              {hasStorefrontPrice(product.compareAtPrice) ? (
                <del>{money(product.compareAtPrice ?? product.price)}</del>
              ) : null}
            </div>
          ) : null}
          {product.description ? <p>{product.description}</p> : null}
          {bulletPoints.length ? (
            <ul>
              {bulletPoints.map((point) => (
                <li key={point}>{point}</li>
              ))}
            </ul>
          ) : null}
          <div className="cx-detail__actions">
            {priced ? (
              <button onClick={() => addStorefrontCartItem(product)} type="button">
                Add to basket
              </button>
            ) : null}
            <a className="cx-detail__whatsapp" href={enquiry} rel="noreferrer" target="_blank">
              Enquire on WhatsApp
            </a>
          </div>
          {hasPolicies ? (
            <div className="cx-detail__policy">
              {product.warranty ? (
                <span>
                  <strong>Warranty</strong>
                  {product.warranty}
                </span>
              ) : null}
              {product.returnPolicy ? (
                <span>
                  <strong>Returns</strong>
                  {product.returnPolicy}
                </span>
              ) : null}
            </div>
          ) : null}
        </div>
        {similarProducts.length ? (
          <div className="cx-detail__similar">
            <ProductSection
              brandName={branding?.brandName}
              label="Similar items"
              products={similarProducts}
              title="More products you may like"
              whatsappNumber={branding?.primaryPhone}
            />
          </div>
        ) : null}
      </main>
      <BackToTopButton />
      <StoreFooter branding={branding} navigation={siteNavigation} />
    </div>
  );
}

function ProductSection({
  brandName,
  label,
  products,
  title,
  whatsappNumber
}: {
  brandName?: string | undefined;
  label: string;
  products: StorefrontProduct[];
  title: string;
  whatsappNumber?: string | null | undefined;
}) {
  return (
    <section className="cx-store__featured-products">
      <div className="cx-store__section-title">
        <div>
          <span>{label}</span>
          <h2>{title}</h2>
        </div>
        <a href="/search?sort=featured">
          <span>Browse and filter all</span>
          <ArrowRightIcon aria-hidden="true" />
        </a>
      </div>
      <div className="cx-store__grid">
        {products.map((product) => (
          <ProductCard
            brandName={brandName}
            key={product.slug}
            product={product}
            whatsappNumber={whatsappNumber}
          />
        ))}
      </div>
    </section>
  );
}

function searchScope(): StorefrontFilters["scope"] {
  const value = new URLSearchParams(window.location.search).get("scope");
  return value === "products" || value === "brands" || value === "categories" ? value : "all";
}

function defaultFilters(category: string, search: string): StorefrontFilters {
  return {
    brand: "",
    category,
    maxPrice: null,
    minPrice: null,
    scope: "all",
    search,
    sort: "featured"
  };
}

async function loadOptional<T>(request: Promise<T>, apply: (value: T) => void) {
  try {
    apply(await request);
  } catch {
    // Optional storefront regions fail independently so the primary catalog remains usable.
  }
}

async function loadCatalogPageContent(searchPage: boolean) {
  const optional = <T,>(request: Promise<T>, fallback: T) => request.catch(() => fallback);
  const [bootstrap, branding, blogPosts] = await Promise.all([
    optional(getStorefrontBootstrap(), {
      announcement: null,
      brandStrips: [],
      campaignEvents: [],
      discovery: emptyDiscovery,
      featuredCards: [],
      promotions: [],
      seasonStrips: [],
      siteNavigation: null,
      sliders: []
    }),
    optional(getStorefrontBranding(), null),
    searchPage
      ? Promise.resolve([])
      : optional(
          listLatestBlogPosts().then((items) => items.slice(0, 3)),
          []
        )
  ]);
  return {
    announcement: bootstrap.announcement,
    blogPosts,
    branding,
    discovery: bootstrap.discovery,
    brandStrips: searchPage ? [] : bootstrap.brandStrips,
    campaignEvents: searchPage ? [] : bootstrap.campaignEvents,
    featuredCards: searchPage ? [] : bootstrap.featuredCards,
    promotions: searchPage ? [] : bootstrap.promotions,
    seasonStrips: searchPage ? [] : bootstrap.seasonStrips,
    siteNavigation: bootstrap.siteNavigation,
    slides: searchPage ? [] : bootstrap.sliders
  };
}
