import { Search, X } from 'lucide-react'
import { Button } from '../../components/button'
import { cn } from '../../lib/utils'
import type {
  SiteHeaderActions,
  SiteHeaderBrand,
  SiteHeaderCategory,
  SiteHeaderNavLink,
} from './site-header-types'

export interface MobileDrawerProps {
  actions?: SiteHeaderActions
  brand: SiteHeaderBrand
  categories?: readonly SiteHeaderCategory[]
  isOpen: boolean
  links?: readonly SiteHeaderNavLink[]
  onClose: () => void
}

export function MobileDrawer({
  actions = {},
  brand,
  categories = [],
  isOpen,
  links = [],
  onClose,
}: MobileDrawerProps) {
  if (!isOpen) return null

  return (
    <div
      aria-label="Mobile navigation"
      aria-modal="true"
      className="fixed inset-0 z-50 flex md:hidden"
      role="dialog"
    >
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-background/80 backdrop-blur-xs transition-opacity"
        onClick={onClose}
      />

      {/* Drawer surface */}
      <div className="relative ml-auto flex h-full w-full max-w-xs flex-col gap-4 border-l border-border/80 bg-background p-5 shadow-xl animate-in slide-in-from-right duration-200">
        <div className="flex items-center justify-between border-b border-border/60 pb-3">
          <span className="font-bold tracking-tight text-foreground">{brand.title}</span>
          <button
            aria-label="Close navigation"
            className="rounded-lg p-1.5 text-muted-foreground hover:bg-muted hover:text-foreground"
            type="button"
            onClick={onClose}
          >
            <X className="size-5" />
          </button>
        </div>

        {actions.showSearch && (
          <div className="relative">
            <Search className="absolute left-2.5 top-1/2 size-3.5 -translate-y-1/2 text-muted-foreground/60" />
            <input
              className="h-9 w-full rounded-xl border border-border/80 bg-muted/30 pl-8 pr-3 text-xs text-foreground placeholder:text-muted-foreground/60 focus:border-ring focus:bg-background focus:outline-none"
              placeholder={actions.searchPlaceholder || 'Search products & projects...'}
              type="text"
            />
          </div>
        )}

        <div className="flex flex-1 flex-col gap-4 overflow-y-auto pr-1">
          {/* Main links */}
          <nav className="flex flex-col gap-1">
            <span className="px-2 text-[11px] font-semibold text-muted-foreground uppercase tracking-wider">
              Navigation
            </span>
            {links.map((link) => (
              <a
                className={cn(
                  'flex items-center justify-between rounded-lg px-3 py-2 text-sm font-medium transition-colors',
                  link.active
                    ? 'bg-primary/10 text-primary font-semibold'
                    : 'text-foreground/80 hover:bg-muted hover:text-foreground',
                )}
                href={link.href}
                key={link.href}
                onClick={onClose}
              >
                <span>{link.label}</span>
                {link.badge && (
                  <span className="rounded-full bg-primary/10 px-1.5 py-0.5 text-[10px] font-semibold text-primary">
                    {link.badge}
                  </span>
                )}
              </a>
            ))}
          </nav>

          {/* Categories */}
          {categories.length > 0 && (
            <div className="flex flex-col gap-1 border-t border-border/40 pt-3">
              <span className="px-2 text-[11px] font-semibold text-muted-foreground uppercase tracking-wider">
                Categories
              </span>
              <div className="flex flex-wrap gap-1.5 px-2 pt-1">
                {categories.map((cat) => (
                  <a
                    className={cn(
                      'rounded-md px-2.5 py-1 text-xs font-medium transition-colors',
                      cat.active
                        ? 'bg-primary text-primary-foreground font-semibold'
                        : 'bg-muted/70 text-foreground/80 hover:bg-muted',
                    )}
                    href={cat.href}
                    key={cat.id}
                    onClick={onClose}
                  >
                    {cat.label}
                  </a>
                ))}
              </div>
            </div>
          )}
        </div>

        {actions.showCta && (
          <div className="border-t border-border/60 pt-3">
            <Button
              className="w-full rounded-xl font-semibold"
              render={actions.ctaHref ? <a href={actions.ctaHref} /> : undefined}
              onClick={() => {
                actions.onCtaClick?.()
                onClose()
              }}
            >
              {actions.ctaLabel || 'Get Started'}
            </Button>
          </div>
        )}
      </div>
    </div>
  )
}
