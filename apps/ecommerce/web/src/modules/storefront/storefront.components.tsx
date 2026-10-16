import { useEffect, useState } from "react";
import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import {
  ArrowUpIcon,
  ArrowUpRightIcon,
  CheckIcon,
  ChevronRightIcon,
  CreditCardIcon,
  HeadphonesIcon,
  CameraIcon,
  MessageCircleIcon,
  MenuIcon,
  Globe2Icon,
  LaptopIcon,
  NetworkIcon,
  RotateCcwIcon,
  TruckIcon,
  WrenchIcon,
  XIcon
} from "lucide-react";
import type {
  StorefrontDiscovery,
  StorefrontBranding,
  StorefrontFilters,
  StorefrontProduct,
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
import { StorefrontCollectionIcon } from "./storefront.collection-icons";
import { StorefrontSocialIcon } from "./storefront.social-icon";

type FilterProps = {
  discovery: StorefrontDiscovery;
  filters: StorefrontFilters;
  onFilters: (value: StorefrontFilters) => void;
};

export function HeroSlider({ slides }: { slides: StorefrontSlider[] }) {
  const [active, setActive] = useState(0);
  useEffect(() => {
    if (slides.length < 2) return;
    const timer = window.setInterval(() => setActive((value) => (value + 1) % slides.length), 6800);
    return () => window.clearInterval(timer);
  }, [slides.length]);
  const slide = slides[active];
  if (!slide) return null;
  return (
    <section
      aria-label="Storefront highlights"
      aria-roledescription="carousel"
      className="cx-store__hero"
    >
      <div className="cx-store__hero-copy" key={`copy-${slide.sliderCode}`}>
        {slide.eyebrow ? <span className="cx-store__hero-reveal">{slide.eyebrow}</span> : null}
        <h1 className="cx-store__hero-reveal">{slide.title}</h1>
        {slide.description ? <p className="cx-store__hero-reveal">{slide.description}</p> : null}
        <a className="cx-store__hero-reveal" href={slide.actionUrl}>
          {slide.actionLabel}
        </a>
      </div>
      <div className="cx-store__hero-media" key={`media-${slide.sliderCode}`}>
        <img
          alt={slide.imageAlt || slide.title}
          decoding="async"
          fetchPriority="high"
          height={720}
          sizes="(max-width: 900px) 100vw, 50vw"
          src={slide.imageUrl}
          srcSet={responsiveImageSrcSet(slide.imageUrl, [480, 768, 1200, 1600])}
          width={1200}
        />
        <div aria-label="Choose storefront highlight" className="cx-store__hero-bullets">
          {slides.map((item, index) => (
            <button
              aria-label={`Show ${item.title}`}
              aria-current={index === active ? "true" : undefined}
              className={index === active ? "is-active" : undefined}
              key={item.sliderCode}
              onClick={() => setActive(index)}
              type="button"
            />
          ))}
        </div>
      </div>
    </section>
  );
}

export function TechMediaTrustSection({
  content
}: {
  content?: StorefrontSiteNavigation["trustedStrip"] | undefined;
}) {
  const [activePanel, setActivePanel] = useState(0);
  const reduceMotion = useReducedMotion();
  const panels = [
    {
      action: "Explore products",
      description:
        "Practical systems selected around your workload, budget, service needs, and future upgrades.",
      details: [
        "Business and student laptops",
        "Desktops and workstations",
        "Custom systems and accessories"
      ],
      href: "/shop",
      icon: LaptopIcon,
      number: "01",
      title: "Computers and laptops"
    },
    {
      action: "Explore solutions",
      description:
        "Connected technology for offices, factories, retailers, institutions, and growing teams.",
      details: [
        "Networking, Wi-Fi and storage",
        "CCTV, biometric and access",
        "POS, VoIP and displays"
      ],
      href: "/features",
      icon: NetworkIcon,
      number: "02",
      title: "Business IT solutions"
    },
    {
      action: "Get local support",
      description:
        "Reach a Tiruppur team that can help before the purchase and after the installation.",
      details: [
        "Computer and laptop service",
        "Installation and upgrades",
        "Maintenance and warranty help"
      ],
      href: "/support",
      icon: WrenchIcon,
      number: "03",
      title: "Service and support"
    },
    {
      action: "Plan security",
      description:
        "Practical protection and access systems designed for the site, people, and daily workflow.",
      details: [
        "CCTV and remote monitoring",
        "Biometric attendance",
        "Face recognition and access control"
      ],
      href: "/features",
      icon: CameraIcon,
      number: "04",
      title: "Security and access"
    },
    {
      action: "Discuss infrastructure",
      description:
        "A connected foundation for teams that depend on reliable systems, communication, and support.",
      details: [
        "Servers, storage and backup",
        "VoIP and video conferencing",
        "AMC and planned maintenance"
      ],
      href: "/contact",
      icon: Globe2Icon,
      number: "05",
      title: "Managed infrastructure"
    }
  ] as const;

  return (
    <section className="cx-store__tech-media" aria-labelledby="tech-media-title">
      <div className="cx-store__tech-media-intro">
        <span>{content?.eyebrow || "Trusted in Tiruppur since 2002"}</span>
        <h2 id="tech-media-title">
          {content?.title || "25+ years of practical technology experience"}
        </h2>
        <p>
          {content?.description ||
            "We help you choose technology that fits the work, set it up properly, and keep it useful as your needs grow."}
        </p>
        <div className="cx-store__tech-media-proof" aria-label="Tech Media service strengths">
          {(content?.proofPoints.length
            ? content.proofPoints
            : ["Multi-brand guidance", "Local technical support", "Retail and business expertise"]
          ).map((point) => (
            <span key={point}>
              <CheckIcon /> {point}
            </span>
          ))}
        </div>
      </div>
      <div className="cx-store__tech-media-accordion" aria-label="Technology services">
        {panels.map((panel, index) => {
          const Icon = panel.icon;
          const active = activePanel === index;
          return (
            <motion.article
              animate={{ flexBasis: active ? 390 : 74, flexGrow: active ? 1 : 0 }}
              className={active ? "is-active" : undefined}
              key={panel.title}
              transition={
                reduceMotion
                  ? { duration: 0 }
                  : { duration: 0.78, ease: [0.22, 1, 0.36, 1], type: "tween" }
              }
            >
              <button
                aria-controls={`tech-media-panel-${index}`}
                aria-expanded={active}
                onClick={() => setActivePanel(index)}
                onFocus={() => setActivePanel(index)}
                type="button"
              >
                <span className="cx-store__tech-media-number">{panel.number}</span>
                <Icon aria-hidden="true" />
                <strong>{panel.title}</strong>
                <ChevronRightIcon className="cx-store__tech-media-chevron" aria-hidden="true" />
              </button>
              <AnimatePresence initial={false} mode="popLayout">
                {active ? (
                  <motion.div
                    animate={{
                      opacity: 1,
                      transition: {
                        delay: reduceMotion ? 0 : 0.38,
                        duration: reduceMotion ? 0 : 0.34,
                        ease: [0.22, 1, 0.36, 1]
                      },
                      x: 0
                    }}
                    className="cx-store__tech-media-panel"
                    exit={{
                      opacity: 0,
                      transition: { duration: reduceMotion ? 0 : 0.16 },
                      x: reduceMotion ? 0 : -10
                    }}
                    id={`tech-media-panel-${index}`}
                    initial={{ opacity: 0, x: reduceMotion ? 0 : 28 }}
                    key={panel.title}
                  >
                    <p>{panel.description}</p>
                    <ul>
                      {panel.details.map((detail) => (
                        <li key={detail}>
                          <CheckIcon /> {detail}
                        </li>
                      ))}
                    </ul>
                    <a href={panel.href}>
                      {panel.action} <ArrowUpRightIcon />
                    </a>
                  </motion.div>
                ) : null}
              </AnimatePresence>
            </motion.article>
          );
        })}
      </div>
    </section>
  );
}

export function ServiceBanner({
  content
}: {
  content?: StorefrontSiteNavigation["serviceBanner"] | undefined;
}) {
  return (
    <motion.a
      className="cx-store__service-banner"
      href={content?.actionUrl || "/support"}
      initial={{ opacity: 0, y: 16 }}
      transition={{ duration: 0.7, ease: [0.22, 1, 0.36, 1] }}
      viewport={{ amount: 0.35, once: true }}
      whileInView={{ opacity: 1, y: 0 }}
    >
      <span className="cx-store__service-banner-mark" aria-hidden="true">
        <HeadphonesIcon />
      </span>
      <span className="cx-store__service-banner-copy">
        <small>{content?.eyebrow || "Tech Media care"}</small>
        <strong>{content?.title || "Technology works better with support close by."}</strong>
        {content?.description ? <span>{content.description}</span> : null}
      </span>
      <span className="cx-store__service-banner-action">
        {content?.actionLabel || "Get support"} <ArrowUpRightIcon />
      </span>
    </motion.a>
  );
}

export function PromotionsSection({ promotions }: { promotions: StorefrontPromotion[] }) {
  return (
    <StorefrontCardsSection
      cards={promotions.map((item) => ({ ...item, cardCode: item.promotionCode }))}
      id="promotions"
      label="Current promotions"
      title="Better value on everyday technology"
    />
  );
}

export function SeasonBanner({ promotions }: { promotions: StorefrontPromotion[] }) {
  const campaigns = promotions.slice(0, 2);
  if (!campaigns.length) return null;

  return (
    <section className="cx-store__campaign-banner" aria-label="Featured store offers">
      <div className={`cx-store__campaign-panels is-${campaigns.length}`}>
        {campaigns.map((campaign) => (
          <a href={campaign.actionUrl} key={campaign.promotionCode}>
            <img
              alt={campaign.imageAlt || campaign.title}
              decoding="async"
              loading="lazy"
              src={campaign.imageUrl}
              sizes="(max-width: 800px) 100vw, 50vw"
              srcSet={responsiveImageSrcSet(campaign.imageUrl, [480, 768, 960])}
              height={520}
              width={960}
            />
            <span className="cx-store__campaign-copy">
              <small>{campaign.eyebrow || "Featured offer"}</small>
              <strong>{campaign.title}</strong>
              <span>
                {campaign.actionLabel || "Explore offer"} <ArrowUpRightIcon />
              </span>
            </span>
          </a>
        ))}
      </div>
      <div className="cx-store__campaign-benefits" aria-label="Shopping benefits">
        <strong>Tech Media assurance</strong>
        <span>Local product guidance</span>
        <span>Business-ready installation</span>
        <span>Support after purchase</span>
      </div>
    </section>
  );
}

export function FeaturedCardsSection({ cards }: { cards: StorefrontFeaturedCard[] }) {
  return (
    <StorefrontCardsSection
      cards={cards.map((item) => ({ ...item, cardCode: item.featuredCode }))}
      id="featured"
      label="Featured products"
      title="Selected technology worth a closer look"
    />
  );
}

type StorefrontCard = Omit<StorefrontPromotion, "promotionCode"> & { cardCode: string };

function StorefrontCardsSection({
  cards,
  id,
  label,
  title
}: {
  cards: StorefrontCard[];
  id: string;
  label: string;
  title: string;
}) {
  if (!cards.length) return null;
  return (
    <section className="cx-store__promotions" id={id}>
      <SectionTitle label={label} title={title} />
      <div className="cx-store__promotion-grid">
        {cards.map((promotion) => {
          const priced = hasStorefrontPrice(promotion.offerPrice);
          return (
            <a
              className="cx-store__promotion-card"
              href={promotion.actionUrl}
              key={promotion.cardCode}
            >
              <span className="cx-store__promotion-media">
                <img
                  alt={promotion.imageAlt || promotion.title}
                  decoding="async"
                  loading="lazy"
                  src={promotion.imageUrl}
                />
                {promotion.badge ? (
                  <span
                    className={`cx-store__promotion-saving is-${promotion.badgePosition}`}
                    style={{
                      backgroundColor: badgeColor(promotion.badgeTint),
                      color: promotion.badgeTextColor || "#ffffff"
                    }}
                  >
                    {promotion.badge}
                  </span>
                ) : null}
              </span>
              <span className="cx-store__promotion-copy">
                {promotion.eyebrow ? <small>{promotion.eyebrow}</small> : null}
                <strong>{promotion.title}</strong>
                {promotion.description ? <span>{promotion.description}</span> : null}
                <span className="cx-store__promotion-actions">
                  {priced ? (
                    <span className="cx-store__promotion-price">
                      <b>{money(promotion.offerPrice)}</b>
                      {hasStorefrontPrice(promotion.originalPrice) ? (
                        <del>{money(promotion.originalPrice ?? promotion.offerPrice)}</del>
                      ) : null}
                    </span>
                  ) : null}
                  <span className="cx-store__promotion-link">
                    {promotion.actionLabel || (priced ? "View offer" : "Enquire")}
                  </span>
                </span>
              </span>
            </a>
          );
        })}
      </div>
    </section>
  );
}

function badgeColor(value: string) {
  return (
    (
      {
        brand: "#0f766e",
        success: "#15803d",
        warning: "#b45309",
        danger: "#b91c1c",
        neutral: "#334155"
      } as Record<string, string>
    )[value] ||
    value ||
    "#0f766e"
  );
}

export function BrandsSection({ brands }: { brands: StorefrontDiscovery["brands"] }) {
  const items = [...brands, ...brands];
  return (
    <section className="cx-store__brands" id="brands">
      <span>Shop trusted brands</span>
      <div className="cx-store__brand-marquee">
        <div className="cx-store__brand-track">
          {items.map((brand, index) => (
            <a
              aria-hidden={index >= brands.length ? "true" : undefined}
              href={`/search?q=${encodeURIComponent(brand.name)}&scope=brands`}
              key={`${brand.name}-${index}`}
              tabIndex={index >= brands.length ? -1 : undefined}
            >
              <span className="cx-store__brand-logo">
                {brand.logoUrl ? (
                  <img
                    alt={index >= brands.length ? "" : brand.logoAlt || `${brand.name} logo`}
                    decoding="async"
                    loading="lazy"
                    src={brand.logoUrl}
                  />
                ) : (
                  <strong>{brand.name}</strong>
                )}
              </span>
              <small>{brand.productCount} products</small>
            </a>
          ))}
        </div>
      </div>
    </section>
  );
}

export function BlogSolutionsSection({
  brandName = "",
  posts
}: {
  brandName?: string | undefined;
  posts: StorefrontBlogPost[];
}) {
  if (!posts.length) return null;
  return (
    <section className="cx-store__blog-solutions" id="solutions">
      <div className="cx-store__latest-heading">
        <div>
          <h2>Latest Posts</h2>
          <p>Practical computer guides from the {brandName} editorial team</p>
        </div>
        <a href="/blog">View all posts</a>
      </div>
      <div className="cx-store__blog-solution-grid">
        {posts.map((post) => (
          <a href={`/blog/${post.slug}`} key={post.slug}>
            <span className="cx-store__blog-solution-media">
              {post.featuredImage ? (
                <img alt={post.imageAlt} decoding="async" loading="lazy" src={post.featuredImage} />
              ) : (
                <span>{brandName} Journal</span>
              )}
              <span className="cx-store__blog-solution-arrow" aria-hidden="true">
                <ArrowUpRightIcon />
              </span>
            </span>
            <span className="cx-store__blog-solution-copy">
              <span className="cx-store__blog-meta">
                <b>{articleCategory(post.title)}</b>
                <span>·</span>
                <span>{readingMinutes(post.excerpt)} min read</span>
              </span>
              <strong>{post.title}</strong>
              <span>{post.excerpt}</span>
              <span className="cx-store__blog-author">
                <span>CX</span>
                <span>
                  <b>{brandName} Editorial</b>
                  <small>
                    {post.publishedAt
                      ? new Date(post.publishedAt).toLocaleDateString(undefined, {
                          day: "numeric",
                          month: "short",
                          year: "numeric"
                        })
                      : "Latest"}
                  </small>
                </span>
              </span>
            </span>
          </a>
        ))}
      </div>
    </section>
  );
}
function readingMinutes(excerpt: string) {
  return Math.max(4, Math.round(excerpt.length / 35));
}
function articleCategory(title: string) {
  if (/laptop/iu.test(title)) return "Laptops";
  if (/desktop|workstation/iu.test(title)) return "Desktop";
  if (/network|security/iu.test(title)) return "Security";
  if (/upgrade|RAM|SSD/iu.test(title)) return "Upgrades";
  if (/maintenance/iu.test(title)) return "Maintenance";
  return "Buying Guide";
}

export function CatalogFilters({ discovery, filters, onFilters }: FilterProps) {
  return (
    <aside className="cx-store__filters" aria-label="Product filters">
      <strong>Filter the range</strong>
      <label className="cx-store__filter-search">
        Search products
        <input
          aria-label="Search products"
          autoComplete="off"
          placeholder="Name, brand, or category"
          type="search"
          value={filters.search}
          onChange={(event) => onFilters({ ...filters, scope: "all", search: event.target.value })}
        />
      </label>
      <label>
        Category
        <select
          value={filters.category}
          onChange={(event) => onFilters({ ...filters, category: event.target.value })}
        >
          <option value="">All categories</option>
          {discovery.categories.map((item) => (
            <option key={item.name}>{item.name}</option>
          ))}
        </select>
      </label>
      <label>
        Brand
        <select
          value={filters.brand}
          onChange={(event) => onFilters({ ...filters, brand: event.target.value })}
        >
          <option value="">All brands</option>
          {discovery.brands.map((item) => (
            <option key={item.name}>{item.name}</option>
          ))}
        </select>
      </label>
      <div className="cx-store__price-filter">
        <span>Price range</span>
        <label>
          From
          <input
            min={0}
            type="number"
            value={filters.minPrice ?? ""}
            onChange={(event) =>
              onFilters({ ...filters, minPrice: numberOrNull(event.target.value) })
            }
            placeholder={String(discovery.priceRange.minimum)}
          />
        </label>
        <label>
          To
          <input
            min={0}
            type="number"
            value={filters.maxPrice ?? ""}
            onChange={(event) =>
              onFilters({ ...filters, maxPrice: numberOrNull(event.target.value) })
            }
            placeholder={String(discovery.priceRange.maximum)}
          />
        </label>
      </div>
      <label>
        Sort by
        <select
          value={filters.sort}
          onChange={(event) =>
            onFilters({ ...filters, sort: event.target.value as StorefrontFilters["sort"] })
          }
        >
          <option value="featured">Featured</option>
          <option value="name">Product name</option>
          <option value="price-asc">Price: low to high</option>
          <option value="price-desc">Price: high to low</option>
          <option value="discount">Largest saving</option>
        </select>
      </label>
      <button
        onClick={() =>
          onFilters({
            brand: "",
            category: "",
            maxPrice: null,
            minPrice: null,
            scope: "all",
            search: "",
            sort: "featured"
          })
        }
      >
        Reset all filters
      </button>
    </aside>
  );
}

export function CollectionFilter({
  categories,
  filters,
  onFilters
}: {
  categories: StorefrontDiscovery["categories"];
  filters: StorefrontFilters;
  onFilters: (value: StorefrontFilters) => void;
}) {
  const collections = collectionDefinitions.map((collection) => ({
    ...collection,
    value: resolveCollectionValue(categories, collection)
  }));
  return (
    <nav className="cx-store__collection-filter" aria-label="Filter product collections">
      <div>
        {collections.map((collection) => {
          const deals = collection.name === "Deals";
          const active = deals
            ? filters.sort === "discount"
            : filters.category === collection.value && filters.sort !== "discount";
          return (
            <button
              aria-pressed={active}
              className={active ? "is-active" : undefined}
              key={collection.name}
              onClick={() =>
                onFilters({
                  ...filters,
                  category: collection.value,
                  sort: deals ? "discount" : "featured"
                })
              }
              type="button"
            >
              <StorefrontCollectionIcon name={collection.name} />
              <span>{collection.name}</span>
            </button>
          );
        })}
      </div>
    </nav>
  );
}

const collectionDefinitions = [
  { aliases: [], name: "All Collections" },
  { aliases: ["laptop", "notebook"], name: "Laptops" },
  { aliases: ["desktop", "computer", "aio", "workstation"], name: "Desktop Computers" },
  { aliases: ["monitor", "display"], name: "Monitors" },
  { aliases: ["accessor"], name: "Accessories" },
  { aliases: ["printer", "scanner"], name: "Printers" },
  { aliases: ["cable", "connector", "adapter"], name: "Cables & Connectors" },
  { aliases: [], name: "Deals" }
] as const;

function resolveCollectionValue(
  categories: StorefrontDiscovery["categories"],
  collection: (typeof collectionDefinitions)[number]
) {
  if (collection.name === "All Collections" || collection.name === "Deals") return "";
  return (
    categories.find((category) =>
      collection.aliases.some((alias) => category.name.toLowerCase().includes(alias))
    )?.name ?? collection.name
  );
}

export function ProductCard({
  brandName = "",
  eagerImage = false,
  product,
  whatsappNumber
}: {
  brandName?: string | undefined;
  eagerImage?: boolean | undefined;
  product: StorefrontProduct;
  whatsappNumber?: string | null | undefined;
}) {
  const metadata = [product.brand, product.category].filter(Boolean).join(" · ");
  const priced = hasStorefrontPrice(product.price);
  return (
    <article className="cx-product-card">
      <a href={`/shop/product/${product.slug}`}>
        <div className="cx-product-card__image">
          {product.featured ? <span>Featured</span> : null}
          <img
            alt={product.imageAlt}
            decoding="async"
            loading={eagerImage ? "eager" : "lazy"}
            src={product.imageUrl}
            sizes="(max-width: 720px) 100vw, (max-width: 1200px) 50vw, 25vw"
            srcSet={responsiveImageSrcSet(product.imageUrl, [320, 480, 640, 960])}
            height={640}
            width={640}
          />
        </div>
        <div className="cx-product-card__copy">
          {metadata ? <small>{metadata}</small> : null}
          <h3>{product.name}</h3>
          {product.shortDescription ? <p>{product.shortDescription}</p> : null}
        </div>
      </a>
      <div className="cx-product-card__actions">
        {priced ? (
          <div className="cx-product-card__price">
            <strong>{money(product.price)}</strong>
            {hasStorefrontPrice(product.compareAtPrice) ? (
              <del>{money(product.compareAtPrice ?? product.price)}</del>
            ) : null}
          </div>
        ) : null}
        <a
          className="cx-product-card__enquiry"
          href={whatsappLink(
            `Hello ${brandName}, please share details for ${product.name}.`,
            whatsappNumber
          )}
          rel="noreferrer"
          target="_blank"
        >
          <MessageCircleIcon size={16} /> Enquire
        </a>
      </div>
    </article>
  );
}

export function HomeClosingCta() {
  return (
    <section className="cx-store__closing-cta">
      <div>
        <span>Ready when you are</span>
        <h2>Find technology that fits the way you work.</h2>
        <p>Compare dependable systems, accessories, and practical support in one place.</p>
      </div>
      <a href="/shop">
        Browse all products <ArrowUpRightIcon />
      </a>
    </section>
  );
}

export function BackToTopButton() {
  const [visible, setVisible] = useState(false);
  useEffect(() => {
    const update = () => setVisible(window.scrollY > 480);
    update();
    window.addEventListener("scroll", update, { passive: true });
    return () => window.removeEventListener("scroll", update);
  }, []);
  return (
    <button
      aria-label="Back to top"
      className={`cx-store__back-to-top${visible ? " is-visible" : ""}`}
      onClick={() => window.scrollTo({ behavior: "smooth", top: 0 })}
      tabIndex={visible ? 0 : -1}
      type="button"
    >
      <ArrowUpIcon />
    </button>
  );
}

export function StoreFooter({
  branding,
  navigation
}: {
  branding: StorefrontBranding | null;
  navigation: StorefrontSiteNavigation | null;
}) {
  const copyrightText =
    navigation?.copyrightText.trim() ||
    `© ${new Date().getFullYear()} ${branding?.brandName || "Tech Media"}. All rights reserved.`;
  const poweredByText = navigation?.poweredByText.trim() || "Powered by Logicx Softwares";
  const groups = (navigation?.groups ?? defaultFooterGroups).map((group) => ({
    ...group,
    links: group.links.filter((link) => !["Customer portal", "Support"].includes(link.label))
  }));
  const [menuOpen, setMenuOpen] = useState(false);
  const [newsletterEmail, setNewsletterEmail] = useState("");
  const subscribe = () => {
    if (!newsletterEmail) return;
    window.open(
      whatsappLink(
        `Hello${branding?.brandName ? ` ${branding.brandName}` : ""}, please add ${newsletterEmail} to the latest-deals update list.`,
        branding?.primaryPhone
      ),
      "_blank",
      "noopener,noreferrer"
    );
  };
  return (
    <>
      <StoreBenefitsBar />
      <footer className="cx-store__footer">
        <div className="cx-store__footer-main">
          <section className="cx-store__footer-brand">
            <a className="cx-store__footer-logo" href="/shop">
              <StoreBrandMark branding={branding} dark />
              {branding?.brandName ? <strong>{branding.brandName}</strong> : null}
            </a>
            {navigation?.tagline ? <b>{navigation.tagline}</b> : null}
            {navigation?.about ? <p>{navigation.about}</p> : null}
          </section>
          <button
            aria-controls="cx-store-footer-menu"
            aria-expanded={menuOpen}
            className="cx-store__footer-menu-toggle"
            onClick={() => setMenuOpen((value) => !value)}
            type="button"
          >
            <span>Explore footer</span>
            {menuOpen ? <XIcon /> : <MenuIcon />}
          </button>
          <div
            className={`cx-store__footer-menu${menuOpen ? " is-open" : ""}`}
            id="cx-store-footer-menu"
          >
            {groups.map((group) => (
              <FooterColumn
                title={group.title}
                links={group.links.map((link) => [link.label, link.href])}
                key={group.title}
              />
            ))}
          </div>
        </div>
        <div className="cx-store__footer-utility">
          <section className="cx-store__payment-types" aria-label="Supported payment types">
            <strong>Supported payment types</strong>
            <div>
              <CreditCardIcon aria-hidden="true" />
              {navigation?.paymentMethods.map((method) => (
                <span className="cx-store__payment-method" key={`${method.name}:${method.logoUrl}`}>
                  {method.logoUrl ? <img alt="" aria-hidden="true" src={method.logoUrl} /> : null}
                  <b>{method.name}</b>
                </span>
              ))}
            </div>
          </section>
          <section className="cx-store__footer-updates">
            <strong>Get the latest deals and practical buying updates</strong>
            <form
              onSubmit={(event) => {
                event.preventDefault();
                subscribe();
              }}
            >
              <input
                aria-label="Email address for deal updates"
                onChange={(event) => setNewsletterEmail(event.target.value)}
                placeholder="Enter email address"
                required
                type="email"
                value={newsletterEmail}
              />
              <button type="submit">Sign up</button>
            </form>
          </section>
          <div className="cx-store__socials" aria-label="Social and contact links">
            {navigation?.socialLinks.map((link) => (
              <a
                aria-label={link.label}
                href={link.href}
                key={link.label}
                rel="noreferrer"
                target="_blank"
              >
                <StorefrontSocialIcon label={link.label} />
              </a>
            ))}
            {navigation?.socialLinks.some((link) => link.label === "WhatsApp") ? null : (
              <a
                aria-label="WhatsApp"
                href={whatsappLink(
                  `Hello${branding?.brandName ? ` ${branding.brandName}` : ""}, I need help choosing a product.`,
                  branding?.primaryPhone
                )}
                rel="noreferrer"
                target="_blank"
              >
                <StorefrontSocialIcon label="WhatsApp" />
              </a>
            )}
          </div>
        </div>
        <div className="cx-store__footer-bottom">
          <div className="cx-store__footer-legal">
            <span>{copyrightText}</span>
            <nav aria-label="Footer legal links">
              <a href="/terms">Terms of Use Notice</a>
              <a href="/privacy">Privacy Policy</a>
              <a href="/cookies">Cookie Settings</a>
            </nav>
          </div>
          <a
            className="cx-store__footer-powered"
            href="https://logicx.in"
            rel="noreferrer"
            target="_blank"
          >
            {poweredByText}
          </a>
        </div>
      </footer>
    </>
  );
}

function StoreBenefitsBar() {
  const benefits = [
    {
      description: "Delivery options confirmed for your location",
      icon: TruckIcon,
      title: "Dependable delivery"
    },
    {
      description: "Clear guidance for eligible returns",
      icon: RotateCcwIcon,
      title: "Easy returns"
    },
    {
      description: "Protected checkout and payment handling",
      icon: CreditCardIcon,
      title: "Secure payments"
    },
    {
      description: "Local help for products, orders, and service",
      icon: HeadphonesIcon,
      title: "Customer support"
    }
  ];
  return (
    <aside className="cx-store__benefits-bar" aria-label="Store service benefits">
      {benefits.map((benefit) => {
        const Icon = benefit.icon;
        return (
          <div key={benefit.title}>
            <Icon aria-hidden="true" />
            <span>
              <strong>{benefit.title}</strong>
              <small>{benefit.description}</small>
            </span>
          </div>
        );
      })}
    </aside>
  );
}

function StoreBrandMark({
  branding,
  dark = false
}: {
  branding: StorefrontBranding | null;
  dark?: boolean;
}) {
  const source = dark ? (branding?.logoDarkUrl ?? branding?.logoUrl) : branding?.logoUrl;
  if (!source) return null;
  return <img alt="" aria-hidden="true" className="cx-store__brand-mark" src={source} />;
}

function FooterColumn({ title, links }: { title: string; links: Array<[string, string]> }) {
  return (
    <section className="cx-store__footer-column">
      <strong>{title}</strong>
      {links.map(([label, href]) => (
        <a href={href} key={href}>
          {label}
        </a>
      ))}
    </section>
  );
}
const defaultFooterGroups = [
  { title: "Shop", links: [{ label: "All products", href: "/shop" }] },
  {
    title: "Company",
    links: [
      { label: "About", href: "/about" },
      { label: "Blog", href: "/blog" }
    ]
  },
  {
    title: "Help",
    links: [
      { label: "Order help", href: "/order-help" },
      { label: "Shipping", href: "/shipping" },
      { label: "Returns", href: "/returns" }
    ]
  }
];

function SectionTitle({ label, title }: { label: string; title: string }) {
  return (
    <div className="cx-store__section-title">
      <div>
        <span>{label}</span>
        <h2>{title}</h2>
      </div>
    </div>
  );
}
function numberOrNull(value: string) {
  return value === "" ? null : Number(value);
}
