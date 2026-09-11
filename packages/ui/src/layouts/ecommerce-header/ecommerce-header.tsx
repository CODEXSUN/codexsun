import { useState } from 'react'
import {
  ChevronDownIcon,
  HeartIcon,
  MenuIcon,
  PhoneCallIcon,
  SearchIcon,
  ShoppingBagIcon,
  SparklesIcon,
  UserIcon,
  XIcon,
} from 'lucide-react'
import { cn } from '../../lib/utils'
import { Button } from '../../components/button'
import { Badge } from '../../components/badge'
import type { EcommerceHeaderProps } from './ecommerce-header-types'

export function EcommerceHeader({
  actions,
  announcement,
  brand,
  categories = [],
  className,
  popularSearches = ['Wireless Earbuds', 'Mechanical Keyboard', 'Ergonomic Desk', 'Smart Watch'],
  quickLinks = [
    { badge: 'Hot', href: '#deals', label: 'Flash Deals' },
    { href: '#bestsellers', label: 'Best Sellers' },
    { href: '#new', label: 'New Arrivals' },
    { href: '#brands', label: 'Featured Brands' },
  ],
  supportPhone = '1-800-CODEXSUN',
}: EcommerceHeaderProps) {
  const [searchQuery, setSearchQuery] = useState('')
  const [isSearchFocused, setIsSearchFocused] = useState(false)
  const [activeCategory, setActiveCategory] = useState<string | null>(null)
  const [isMobileOpen, setIsMobileOpen] = useState(false)

  const cartCount = actions?.cartCount ?? 0
  const wishlistCount = actions?.wishlistCount ?? 0

  return (
    <header className={cn('w-full border-b border-border/80 bg-background/95 backdrop-blur-md', className)}>
      {/* 1. Top Announcement Strip */}
      {announcement && (
        <div className="relative border-b border-border/40 bg-muted/60 px-4 py-1.5 text-xs text-muted-foreground">
          <div className="mx-auto flex max-w-7xl items-center justify-between gap-4">
            <div className="flex items-center gap-2">
              <SparklesIcon className="size-3.5 text-primary" />
              <span>{announcement.message}</span>
              {announcement.actionLabel && (
                <a
                  href={announcement.actionHref ?? '#'}
                  className="font-semibold text-primary underline underline-offset-2 hover:opacity-80"
                >
                  {announcement.actionLabel}
                </a>
              )}
            </div>

            {announcement.showFreeShippingMeter && (
              <div className="hidden sm:flex items-center gap-2">
                <span>Free shipping on orders over $50</span>
                <div className="h-1.5 w-24 rounded-full bg-border overflow-hidden">
                  <div
                    className="h-full bg-primary transition-all duration-300"
                    style={{ width: `${Math.min(100, Math.max(0, announcement.freeShippingProgress ?? 75))}%` }}
                  />
                </div>
                <span className="font-semibold text-foreground">
                  {announcement.freeShippingProgress ?? 75}%
                </span>
              </div>
            )}
          </div>
        </div>
      )}

      {/* 2. Main Storefront Navbar */}
      <div className="mx-auto flex max-w-7xl items-center justify-between gap-4 px-4 py-3.5">
        {/* Mobile menu trigger + Brand */}
        <div className="flex items-center gap-3">
          <Button
            size="icon"
            variant="ghost"
            className="md:hidden size-9"
            aria-label="Open storefront navigation"
            onClick={() => setIsMobileOpen(true)}
          >
            <MenuIcon className="size-5" />
          </Button>

          <a href={brand.href ?? '/'} className="flex items-center gap-2.5 focus-visible:outline-none">
            {brand.logo}
            <span className="text-xl font-bold tracking-tight text-foreground">{brand.title}</span>
          </a>
        </div>

        {/* Live Search with popular queries dropdown */}
        <div className="relative hidden md:flex flex-1 max-w-xl">
          <div
            className={cn(
              'flex w-full items-center rounded-xl border border-input bg-muted/30 px-3 py-1.5 transition-all',
              isSearchFocused && 'border-ring ring-2 ring-ring/20 bg-background'
            )}
          >
            <SearchIcon className="size-4 text-muted-foreground mr-2 shrink-0" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              onFocus={() => setIsSearchFocused(true)}
              onBlur={() => setTimeout(() => setIsSearchFocused(false), 200)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') actions?.onSearch?.(searchQuery)
              }}
              placeholder="Search products, brands, categories..."
              className="w-full bg-transparent text-sm placeholder:text-muted-foreground focus:outline-none"
            />
            {searchQuery && (
              <button
                type="button"
                onClick={() => setSearchQuery('')}
                className="text-muted-foreground hover:text-foreground mr-1"
              >
                <XIcon className="size-3.5" />
              </button>
            )}
            <Button
              size="sm"
              className="h-7 px-3 text-xs"
              onClick={() => actions?.onSearch?.(searchQuery)}
            >
              Search
            </Button>
          </div>

          {/* Autocomplete / Recent Suggestions Dropdown */}
          {isSearchFocused && (
            <div className="absolute top-full left-0 right-0 mt-1.5 rounded-xl border border-border/80 bg-popover p-3 shadow-xl z-50 animate-in fade-in-0 zoom-in-95">
              <div className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider mb-2">
                Popular Searches
              </div>
              <div className="flex flex-wrap gap-1.5">
                {popularSearches.map((item) => (
                  <button
                    key={item}
                    type="button"
                    onClick={() => {
                      setSearchQuery(item)
                      actions?.onSearch?.(item)
                    }}
                    className="rounded-lg bg-muted px-2.5 py-1 text-xs font-medium text-foreground hover:bg-primary/10 hover:text-primary transition-colors"
                  >
                    {item}
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Right Actions: Wishlist, Cart, Account */}
        <div className="flex items-center gap-1.5 sm:gap-2">
          {/* Wishlist Button */}
          <Button
            size="sm"
            variant="ghost"
            className="relative px-2.5 text-muted-foreground hover:text-foreground"
            onClick={actions?.onWishlistClick}
            aria-label="Wishlist"
          >
            <HeartIcon className="size-5" />
            {wishlistCount > 0 && (
              <span className="absolute -top-1 -right-1 flex size-4 items-center justify-center rounded-full bg-rose-600 text-[10px] font-bold text-white">
                {wishlistCount > 99 ? '99+' : wishlistCount}
              </span>
            )}
            <span className="hidden xl:inline-block ml-1.5 text-xs font-medium">Wishlist</span>
          </Button>

          {/* Cart Drawer Trigger */}
          <Button
            size="sm"
            variant="default"
            className="relative gap-2 px-3 shadow-xs"
            onClick={actions?.onCartClick}
            aria-label="Shopping Cart"
          >
            <div className="relative">
              <ShoppingBagIcon className="size-4" />
              {cartCount > 0 && (
                <span className="absolute -top-2 -right-2 flex size-4 items-center justify-center rounded-full bg-accent text-accent-foreground text-[10px] font-bold">
                  {cartCount > 99 ? '99+' : cartCount}
                </span>
              )}
            </div>
            <div className="flex flex-col items-start text-left leading-none">
              <span className="text-xs font-semibold">Cart</span>
              {actions?.cartSubtotal && (
                <span className="text-[10px] font-medium opacity-90">{actions.cartSubtotal}</span>
              )}
            </div>
          </Button>

          {/* Account Button */}
          <Button
            size="sm"
            variant="ghost"
            className="px-2.5 text-muted-foreground hover:text-foreground"
            onClick={actions?.onAccountClick}
            aria-label="User Account"
          >
            <UserIcon className="size-5" />
            <span className="hidden xl:inline-block ml-1.5 text-xs font-medium">Account</span>
          </Button>
        </div>
      </div>

      {/* 3. Categories & Quick Links Strip */}
      <div className="relative border-t border-border/40 bg-muted/20 px-4 py-1.5 text-xs">
        <div className="mx-auto flex max-w-7xl items-center justify-between gap-4">
          <div className="flex items-center gap-1 overflow-x-auto no-scrollbar py-0.5">
            {categories.map((cat) => (
              <div
                key={cat.id}
                className="relative"
                onMouseEnter={() => setActiveCategory(cat.id)}
                onMouseLeave={() => setActiveCategory(null)}
              >
                <a
                  href={cat.href}
                  className={cn(
                    'flex items-center gap-1.5 rounded-md px-2.5 py-1 font-medium transition-colors hover:bg-muted hover:text-foreground',
                    activeCategory === cat.id ? 'bg-muted text-primary' : 'text-muted-foreground'
                  )}
                >
                  {cat.icon}
                  <span>{cat.label}</span>
                  {cat.subcategories && cat.subcategories.length > 0 && (
                    <ChevronDownIcon className="size-3 text-muted-foreground" />
                  )}
                  {cat.isHot && (
                    <Badge variant="destructive" className="h-4 px-1 text-[9px] font-bold uppercase">
                      Hot
                    </Badge>
                  )}
                </a>

                {/* Subcategory Megamenu Flyout */}
                {activeCategory === cat.id && cat.subcategories && cat.subcategories.length > 0 && (
                  <div className="absolute top-full left-0 mt-1 w-64 rounded-xl border border-border/80 bg-popover p-3 shadow-xl z-50 animate-in fade-in-0 zoom-in-95">
                    <div className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider mb-2">
                      {cat.label} Subcategories
                    </div>
                    <div className="space-y-1">
                      {cat.subcategories.map((sub) => (
                        <a
                          key={sub.label}
                          href={sub.href}
                          className="flex flex-col rounded-lg p-1.5 hover:bg-muted transition-colors text-foreground"
                        >
                          <span className="text-xs font-medium">{sub.label}</span>
                          {sub.description && (
                            <span className="text-[10px] text-muted-foreground">{sub.description}</span>
                          )}
                        </a>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            ))}

            <div className="h-4 w-px bg-border/60 mx-1.5" />

            {quickLinks.map((ql) => (
              <a
                key={ql.label}
                href={ql.href}
                className="flex items-center gap-1 whitespace-nowrap rounded-md px-2 py-1 font-medium text-muted-foreground hover:text-foreground transition-colors"
              >
                <span>{ql.label}</span>
                {ql.badge && (
                  <span className="rounded bg-rose-500/10 px-1 py-0.2 text-[9px] font-semibold text-rose-500">
                    {ql.badge}
                  </span>
                )}
              </a>
            ))}
          </div>

          {supportPhone && (
            <div className="hidden lg:flex items-center gap-1.5 text-muted-foreground shrink-0">
              <PhoneCallIcon className="size-3.5 text-primary" />
              <span>Need help?</span>
              <span className="font-semibold text-foreground">{supportPhone}</span>
            </div>
          )}
        </div>
      </div>

      {/* 4. Responsive Mobile Drawer */}
      {isMobileOpen && (
        <div className="fixed inset-0 z-50 flex bg-background/80 backdrop-blur-sm md:hidden">
          <div className="w-full max-w-xs bg-background p-6 shadow-2xl border-r border-border/80 flex flex-col justify-between">
            <div className="space-y-6">
              <div className="flex items-center justify-between">
                <span className="text-lg font-bold">{brand.title}</span>
                <Button size="icon" variant="ghost" onClick={() => setIsMobileOpen(false)}>
                  <XIcon className="size-5" />
                </Button>
              </div>

              {/* Mobile Search */}
              <div className="flex items-center rounded-lg border border-input bg-muted/40 px-3 py-1.5">
                <SearchIcon className="size-4 text-muted-foreground mr-2" />
                <input
                  type="text"
                  placeholder="Search store..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full bg-transparent text-sm focus:outline-none"
                />
              </div>

              {/* Mobile Categories */}
              <div className="space-y-1.5">
                <div className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                  Categories
                </div>
                {categories.map((cat) => (
                  <a
                    key={cat.id}
                    href={cat.href}
                    className="flex items-center justify-between rounded-lg p-2 text-sm font-medium text-foreground hover:bg-muted"
                  >
                    <span>{cat.label}</span>
                    {cat.isHot && <Badge variant="destructive">Hot</Badge>}
                  </a>
                ))}
              </div>
            </div>

            <div className="pt-6 border-t border-border space-y-2">
              <Button className="w-full gap-2" onClick={actions?.onCartClick}>
                <ShoppingBagIcon className="size-4" />
                <span>View Cart ({cartCount})</span>
              </Button>
            </div>
          </div>
        </div>
      )}
    </header>
  )
}
