import { cn } from "../../lib/utils";

import { EcommerceActions } from "./ecommerce-actions";
import { EcommerceAnnouncement } from "./ecommerce-announcement";
import { EcommerceDrawer } from "./ecommerce-drawer";
import { EcommerceNavigation } from "./ecommerce-navigation";
import { EcommerceSearch } from "./ecommerce-search";
import type { EcommerceHeaderProps } from "./ecommerce-header-types";

const defaultSearches = ["Wireless Earbuds", "Mechanical Keyboard", "Ergonomic Desk", "Smart Watch"];
const defaultLinks = [
  { badge: "Hot", href: "#deals", label: "Flash Deals" },
  { href: "#bestsellers", label: "Best Sellers" },
  { href: "#new", label: "New Arrivals" },
  { href: "#brands", label: "Featured Brands" },
];

export function EcommerceHeader({
  actions,
  announcement,
  brand,
  categories = [],
  className,
  popularSearches = defaultSearches,
  quickLinks = defaultLinks,
  supportPhone = "1-800-CODEXSUN",
}: EcommerceHeaderProps) {
  const cartCount = actions?.cartCount ?? 0;

  return (
    <header className={cn("w-full border-b border-border/80 bg-background/95 backdrop-blur-md", className)}>
      {announcement ? <EcommerceAnnouncement announcement={announcement} /> : null}
      <div className="mx-auto flex max-w-7xl items-center justify-between gap-4 px-4 py-3.5">
        <div className="flex items-center gap-3">
          <EcommerceDrawer actions={actions} brandTitle={brand.title} cartCount={cartCount} categories={categories} />
          <a className="flex items-center gap-2.5 focus-visible:outline-none" href={brand.href ?? "/"}>
            {brand.logo}
            <span className="text-xl font-bold tracking-tight text-foreground">{brand.title}</span>
          </a>
        </div>
        <EcommerceSearch actions={actions} popularSearches={popularSearches} />
        <EcommerceActions actions={actions} />
      </div>
      <EcommerceNavigation categories={categories} quickLinks={quickLinks} supportPhone={supportPhone} />
    </header>
  );
}
