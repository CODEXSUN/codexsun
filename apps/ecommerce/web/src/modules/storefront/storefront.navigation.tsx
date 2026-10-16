import {
  NavigationMenu,
  NavigationMenuContent,
  NavigationMenuItem,
  NavigationMenuLink,
  NavigationMenuList,
  NavigationMenuTrigger
} from "@codexsun/ui/components/navigation-menu";
import {
  ArrowRightIcon,
  MenuIcon,
  SearchIcon,
  ShoppingCartIcon,
  UserRoundIcon,
  XIcon
} from "lucide-react";
import { useEffect, useRef, useState, type ReactNode, type RefObject } from "react";
import { StorefrontSearch } from "./storefront.search";
import type {
  StorefrontBranding,
  StorefrontDiscovery,
  StorefrontFilters
} from "./storefront.types";
import type { StorefrontAnnouncement } from "./storefront.types";
import { StorefrontAnnouncementBanner } from "./storefront.announcement";
import { useStorefrontCartCount } from "./storefront.cart";

export function StoreHeader({
  announcement,
  branding,
  discovery,
  filters
}: {
  announcement: StorefrontAnnouncement | null;
  branding: StorefrontBranding | null;
  discovery: StorefrontDiscovery;
  filters: StorefrontFilters;
}) {
  const cartCount = useStorefrontCartCount();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const mobileMenuButton = useRef<HTMLButtonElement>(null);
  const mobileMenu = useRef<HTMLElement>(null);

  useEffect(() => {
    if (!mobileMenuOpen) return;
    const closeOnEscape = (event: KeyboardEvent) => {
      if (event.key !== "Escape") return;
      setMobileMenuOpen(false);
      mobileMenuButton.current?.focus();
    };
    const closeOutside = (event: PointerEvent) => {
      const target = event.target as Node;
      if (mobileMenu.current?.contains(target) || mobileMenuButton.current?.contains(target))
        return;
      setMobileMenuOpen(false);
    };
    window.addEventListener("keydown", closeOnEscape);
    window.addEventListener("pointerdown", closeOutside);
    return () => {
      window.removeEventListener("keydown", closeOnEscape);
      window.removeEventListener("pointerdown", closeOutside);
    };
  }, [mobileMenuOpen]);

  return (
    <>
      <StorefrontAnnouncementBanner announcement={announcement} />
      <header className="cx-store__header">
        <a className="cx-store__brand" href="/shop">
          {branding?.logoUrl ? (
            <img
              alt=""
              aria-hidden="true"
              className="cx-store__brand-mark"
              height={40}
              src={branding.logoUrl}
              width={40}
            />
          ) : null}
          {branding?.brandName ? <strong>{branding.brandName}</strong> : null}
        </a>
        <StoreNavigation branding={branding} discovery={discovery} />
        <button
          aria-controls="storefront-mobile-menu"
          aria-expanded={mobileMenuOpen}
          aria-label={mobileMenuOpen ? "Close navigation menu" : "Open navigation menu"}
          className="cx-store__mobile-menu-button"
          onClick={() => setMobileMenuOpen((open) => !open)}
          ref={mobileMenuButton}
          type="button"
        >
          {mobileMenuOpen ? <XIcon aria-hidden="true" /> : <MenuIcon aria-hidden="true" />}
        </button>
        <StorefrontSearch branding={branding} discovery={discovery} filters={filters} />
        <div className="cx-store__header-actions">
          <a
            aria-label={`Shopping cart, ${cartCount} items`}
            className="cx-store__header-icon"
            href="/cart"
          >
            <ShoppingCartIcon aria-hidden="true" />
            <span aria-hidden="true" className="cx-store__cart-count">
              {cartCount > 99 ? "99+" : cartCount}
            </span>
          </a>
          <a aria-label="Customer account" className="cx-store__header-icon" href="/login">
            <UserRoundIcon aria-hidden="true" />
          </a>
        </div>
        <MobileStoreNavigation
          cartCount={cartCount}
          menuRef={mobileMenu}
          open={mobileMenuOpen}
          onNavigate={() => setMobileMenuOpen(false)}
        />
      </header>
    </>
  );
}

function MobileStoreNavigation({
  cartCount,
  menuRef,
  open,
  onNavigate
}: {
  cartCount: number;
  menuRef: RefObject<HTMLElement | null>;
  open: boolean;
  onNavigate: () => void;
}) {
  return (
    <nav
      aria-label="Mobile store navigation"
      className={`cx-store__mobile-nav${open ? " is-open" : ""}`}
      id="storefront-mobile-menu"
      ref={menuRef}
    >
      <a href="/search" onClick={onNavigate}>
        <SearchIcon aria-hidden="true" />
        <span>
          <strong>Search</strong>
          <small>Find products across the catalog</small>
        </span>
      </a>
      <a href="/cart" onClick={onNavigate}>
        <ShoppingCartIcon aria-hidden="true" />
        <span>
          <strong>Cart</strong>
          <small>
            {cartCount} {cartCount === 1 ? "item" : "items"}
          </small>
        </span>
        <b className="cx-store__mobile-cart-count">{cartCount > 99 ? "99+" : cartCount}</b>
      </a>
      <a href="/login" onClick={onNavigate}>
        <UserRoundIcon aria-hidden="true" />
        <span>
          <strong>Account</strong>
          <small>Sign in or manage your profile</small>
        </span>
      </a>
      <span className="cx-store__mobile-nav-label">Menu</span>
      <a href="/shop" onClick={onNavigate}>
        <span>
          <strong>Shop</strong>
          <small>Browse all products</small>
        </span>
      </a>
      <a href="/#solutions" onClick={onNavigate}>
        <span>
          <strong>Solutions</strong>
          <small>Find the right setup</small>
        </span>
      </a>
      <a href="/about" onClick={onNavigate}>
        <span>
          <strong>Company</strong>
          <small>About and contact</small>
        </span>
      </a>
      <a href="/campaigns" onClick={onNavigate}>
        <span>
          <strong>Campaigns and events</strong>
          <small>Current offers, launches, and programmes</small>
        </span>
      </a>
      <a href="/blog" onClick={onNavigate}>
        <span>
          <strong>Blog</strong>
          <small>Guides and advice</small>
        </span>
      </a>
    </nav>
  );
}

function StoreNavigation({
  branding,
  discovery
}: {
  branding: StorefrontBranding | null;
  discovery: StorefrontDiscovery;
}) {
  const brandName = branding?.brandName ?? "your company";
  return (
    <NavigationMenu className="cx-store__primary-nav" aria-label="Store navigation">
      <NavigationMenuList>
        <StoreMenu label="Shop">
          <MenuFeature
            description="Compare dependable computers and accessories for work, study, and creativity."
            eyebrow="Computer store"
            href="/shop"
            title="Find the right system"
          />
          <MenuColumn title="Categories">
            {discovery.categories.slice(0, 5).map((item) => (
              <MenuLink href={`/shop/category/${encodeURIComponent(item.name)}`} key={item.name}>
                {item.name}
                <small>{item.productCount}</small>
              </MenuLink>
            ))}
          </MenuColumn>
          <MenuColumn title="Discover">
            <MenuLink href="/#promotions">Current promotions</MenuLink>
            <MenuLink href="/#brands">Shop by brand</MenuLink>
            <MenuLink href="/search?sort=featured">Featured systems</MenuLink>
          </MenuColumn>
        </StoreMenu>
        <StoreMenu label="Solutions">
          <MenuFeature
            description="Use clear buying, security, upgrade, and maintenance guidance before you invest."
            eyebrow="Practical guidance"
            href="/blog"
            title="Choose with confidence"
          />
          <MenuColumn title="For your work">
            <MenuLink href="/blog/choose-business-computer-system">Business systems</MenuLink>
            <MenuLink href="/blog/business-laptop-buying-guide">Mobile and remote work</MenuLink>
            <MenuLink href="/blog/desktop-vs-workstation-guide">Focused workspaces</MenuLink>
          </MenuColumn>
          <MenuColumn title="Keep it working">
            <MenuLink href="/blog/computer-upgrade-priority-guide">Performance upgrades</MenuLink>
            <MenuLink href="/blog/small-business-network-security-checklist">
              Network security
            </MenuLink>
            <MenuLink href="/blog/preventive-computer-maintenance-guide">Maintenance</MenuLink>
          </MenuColumn>
        </StoreMenu>
        <StoreMenu label="Company">
          <MenuFeature
            description={`Meet the team and learn how ${brandName} helps customers make durable technology decisions.`}
            eyebrow={`About ${brandName}`}
            href="/about"
            title="Technology with useful support"
          />
          <MenuColumn title="Company">
            <MenuLink href="/about">About</MenuLink>
            <MenuLink href="/campaigns">Campaigns and events</MenuLink>
            <MenuLink href="/team">Team</MenuLink>
            <MenuLink href="/contact">Contact</MenuLink>
          </MenuColumn>
          <MenuColumn title="Help and policy">
            <MenuLink href="/support">Support</MenuLink>
            <MenuLink href="/order-help">Order help</MenuLink>
            <MenuLink href="/shipping">Shipping and delivery</MenuLink>
            <MenuLink href="/returns">Returns and refunds</MenuLink>
            <MenuLink href="/privacy">Privacy policy</MenuLink>
          </MenuColumn>
        </StoreMenu>
        <NavigationMenuItem>
          <NavigationMenuLink asChild>
            <a className="cx-store__nav-direct" href="/blog">
              Blog
            </a>
          </NavigationMenuLink>
        </NavigationMenuItem>
      </NavigationMenuList>
    </NavigationMenu>
  );
}

function StoreMenu({ children, label }: { children: ReactNode; label: string }) {
  return (
    <NavigationMenuItem>
      <NavigationMenuTrigger>{label}</NavigationMenuTrigger>
      <NavigationMenuContent className="cx-store__nav-content">
        <div className="cx-store__nav-panel">{children}</div>
      </NavigationMenuContent>
    </NavigationMenuItem>
  );
}

function MenuFeature({
  description,
  eyebrow,
  href,
  title
}: {
  description: string;
  eyebrow: string;
  href: string;
  title: string;
}) {
  return (
    <NavigationMenuLink asChild>
      <a className="cx-store__nav-feature" href={href}>
        <small>{eyebrow}</small>
        <strong>{title}</strong>
        <span>{description}</span>
        <b>
          Explore <ArrowRightIcon />
        </b>
      </a>
    </NavigationMenuLink>
  );
}

function MenuColumn({ children, title }: { children: ReactNode; title: string }) {
  return (
    <div className="cx-store__nav-column">
      <strong>{title}</strong>
      {children}
    </div>
  );
}

function MenuLink({ children, href }: { children: ReactNode; href: string }) {
  return (
    <NavigationMenuLink asChild>
      <a href={href}>{children}</a>
    </NavigationMenuLink>
  );
}
