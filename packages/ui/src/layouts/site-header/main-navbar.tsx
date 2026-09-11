import { Menu, Search, ShoppingBag, SunMoon, User } from 'lucide-react'
import { Badge } from '../../components/badge'
import { Button } from '../../components/button'
import { cn } from '../../lib/utils'
import type {
  SiteHeaderActions,
  SiteHeaderBrand,
  SiteHeaderNavLink,
} from './site-header-types'

export interface MainNavbarProps {
  actions?: SiteHeaderActions
  brand: SiteHeaderBrand
  links?: readonly SiteHeaderNavLink[]
  onOpenMobileMenu?: () => void
}

export function MainNavbar({
  actions = {},
  brand,
  links = [],
  onOpenMobileMenu,
}: MainNavbarProps) {
  const {
    accountHref = '/account',
    cartCount = 0,
    ctaHref,
    ctaLabel = 'Get Started',
    onAccountClick,
    onCartClick,
    onCtaClick,
    onSearchClick,
    onThemeToggle,
    searchPlaceholder = 'Search...',
    showAccount = true,
    showCart = true,
    showCta = true,
    showSearch = true,
    showThemeToggle = true,
  } = actions

  return (
    <div className="mx-auto flex h-16 w-full max-w-7xl items-center justify-between gap-4 px-4 sm:px-6 lg:px-8">
      {/* Brand */}
      <div className="flex items-center gap-3">
        <a
          className="flex items-center gap-2.5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
          href={brand.href ?? '/'}
        >
          {brand.logo ? (
            <div className="flex size-9 shrink-0 items-center justify-center rounded-xl bg-primary text-primary-foreground font-bold">
              {brand.logo}
            </div>
          ) : (
            <div className="flex size-9 shrink-0 items-center justify-center rounded-xl bg-primary text-primary-foreground font-bold text-sm">
              {brand.title.slice(0, 2).toUpperCase()}
            </div>
          )}

          <div className="flex flex-col">
            <div className="flex items-center gap-2">
              <span className="text-base font-bold tracking-tight text-foreground">
                {brand.title}
              </span>
              {brand.badge && (
                <Badge className="text-[10px] font-semibold" variant="secondary">
                  {brand.badge}
                </Badge>
              )}
            </div>
            {brand.tagline && (
              <span className="text-[11px] text-muted-foreground hidden sm:inline-block">
                {brand.tagline}
              </span>
            )}
          </div>
        </a>
      </div>

      {/* Centered Navigation */}
      {links.length > 0 && (
        <nav aria-label="Main navigation" className="hidden md:flex items-center gap-1">
          {links.map((link) => (
            <a
              className={cn(
                'relative flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-sm font-medium transition-colors select-none',
                link.active
                  ? 'text-primary font-semibold'
                  : 'text-muted-foreground hover:bg-muted/60 hover:text-foreground',
              )}
              href={link.href}
              key={link.href}
              rel={link.external ? 'noopener noreferrer' : undefined}
              target={link.external ? '_blank' : undefined}
            >
              {link.label}
              {link.badge && (
                <span className="rounded-full bg-primary/10 px-1.5 py-0.2 text-[10px] font-semibold text-primary">
                  {link.badge}
                </span>
              )}
            </a>
          ))}
        </nav>
      )}

      {/* Action Cluster */}
      <div className="flex items-center gap-1.5 sm:gap-2">
        {showSearch && (
          <button
            aria-label="Search"
            className="flex items-center gap-2 rounded-xl border border-border/80 bg-muted/40 px-2.5 py-1.5 text-xs text-muted-foreground transition-colors hover:border-foreground/30 hover:bg-muted focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
            type="button"
            onClick={onSearchClick}
          >
            <Search className="size-4" />
            <span className="hidden lg:inline-block">{searchPlaceholder}</span>
            <kbd className="hidden lg:inline-flex rounded border bg-background px-1 text-[10px] font-mono">
              ⌘K
            </kbd>
          </button>
        )}

        {showThemeToggle && onThemeToggle && (
          <Button
            aria-label="Toggle theme mode"
            className="size-8.5 rounded-xl text-muted-foreground hover:text-foreground"
            size="icon"
            variant="ghost"
            onClick={onThemeToggle}
          >
            <SunMoon className="size-4" />
          </Button>
        )}

        {showAccount && (
          <a
            aria-label="Account profile"
            className="inline-flex size-8.5 items-center justify-center rounded-xl text-muted-foreground transition-colors hover:bg-muted hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
            href={accountHref}
            onClick={onAccountClick}
          >
            <User className="size-4" />
          </a>
        )}

        {showCart && (
          <button
            aria-label={`Shopping cart with ${cartCount} items`}
            className="relative inline-flex size-8.5 items-center justify-center rounded-xl text-muted-foreground transition-colors hover:bg-muted hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
            type="button"
            onClick={onCartClick}
          >
            <ShoppingBag className="size-4" />
            {cartCount > 0 && (
              <span className="absolute -right-1 -top-1 flex size-4.5 items-center justify-center rounded-full bg-primary text-[10px] font-bold text-primary-foreground shadow-xs animate-in zoom-in">
                {cartCount > 99 ? '99+' : cartCount}
              </span>
            )}
          </button>
        )}

        {showCta && (
          <Button
            className="hidden sm:inline-flex rounded-xl font-semibold"
            render={ctaHref ? <a href={ctaHref} /> : undefined}
            size="sm"
            variant="default"
            onClick={onCtaClick}
          >
            {ctaLabel}
          </Button>
        )}

        {/* Mobile menu trigger */}
        <Button
          aria-label="Open navigation menu"
          className="md:hidden size-8.5 rounded-xl text-muted-foreground hover:text-foreground"
          size="icon"
          variant="ghost"
          onClick={onOpenMobileMenu}
        >
          <Menu className="size-4.5" />
        </Button>
      </div>
    </div>
  )
}
