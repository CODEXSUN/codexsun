import { useState } from 'react'
import { Button } from '@codexsun/ui/components/button'
import { SiteHeader, type SiteHeaderCategory, type SiteHeaderNavLink } from '@codexsun/ui/layouts/site-header'
import { useMdiTopology } from '@codexsun/ui/layouts/mdi-main'
import { UiTemplatePage } from '@codexsun/ui/templates/ui-page'

const sampleLinks: readonly SiteHeaderNavLink[] = [
  { href: '#products', label: 'Products', badge: 'New' },
  { href: '#categories', label: 'Categories' },
  { href: '#deals', label: 'Deals', badge: 'Sale' },
  { href: '#about', label: 'About Us' },
]

const sampleCategories: readonly SiteHeaderCategory[] = [
  { active: true, href: '#all', id: 'all', label: 'All Products' },
  { href: '#electronics', id: 'electronics', label: 'Electronics & Audio' },
  { href: '#apparel', id: 'apparel', label: 'Apparel & Streetwear' },
  { href: '#home', id: 'home', label: 'Home Office & Studio' },
  { href: '#accessories', id: 'accessories', label: 'Accessories' },
]

const headerCode = `import { SiteHeader } from '@codexsun/ui/layouts/site-header'

export function StorefrontHeader() {
  return (
    <SiteHeader
      announcement={{
        actionLabel: 'Shop Now',
        actionUrl: '/deals',
        message: 'Mid-Season Sale: Up to 40% off with code CODEX40',
      }}
      brand={{
        badge: 'Store',
        tagline: 'Modern Lifestyle Essentials',
        title: 'CodexShop',
      }}
      links={navLinks}
      categories={categoryList}
      actions={{
        cartCount: 4,
        ctaLabel: 'Checkout',
        onCartClick: () => openCartDrawer(),
        onSearchClick: () => openSearchModal(),
      }}
    />
  )
}`

export function UiSiteHeaderDocumentation() {
  const topology = useMdiTopology()
  const [cartCount, setCartCount] = useState(3)
  const [mode, setMode] = useState<'ecommerce' | 'portfolio'>('ecommerce')
  const [feedback, setFeedback] = useState('Site Header active in E-Commerce mode.')

  const isEcom = mode === 'ecommerce'

  return (
    <UiTemplatePage
      code={headerCode}
      importPath="@codexsun/ui/layouts/site-header"
      kind="Layout"
      name="Site Header"
      navigation={{
        next: { href: '/?layout=mdi-main', name: 'MDI Main' },
        previous: { href: '/?layout=documentation-workspace', name: 'Documentation Workspace' },
      }}
      preview={
        <div className="flex flex-col gap-6">
          {/* Controls Bar */}
          <div className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-border/80 bg-muted/40 p-3">
            <div className="flex items-center gap-2">
              <span className="text-xs font-semibold text-foreground">Header Mode:</span>
              <div className="flex rounded-lg border border-border/80 bg-background p-0.5">
                <Button
                  size="sm"
                  variant={isEcom ? 'default' : 'ghost'}
                  className="h-7 px-2.5 text-xs"
                  onClick={() => {
                    setMode('ecommerce')
                    setFeedback('Switched to E-Commerce mode (announcement, categories, cart).')
                  }}
                >
                  E-Commerce Storefront
                </Button>
                <Button
                  size="sm"
                  variant={!isEcom ? 'default' : 'ghost'}
                  className="h-7 px-2.5 text-xs"
                  onClick={() => {
                    setMode('portfolio')
                    setFeedback('Switched to Portfolio Showcase mode (minimal, hire me CTA).')
                  }}
                >
                  Static Portfolio
                </Button>
              </div>
            </div>

            {isEcom && (
              <div className="flex items-center gap-2">
                <span className="text-xs text-muted-foreground">Cart Count:</span>
                <Button
                  size="sm"
                  variant="outline"
                  className="h-6 w-6 p-0 text-xs"
                  onClick={() => setCartCount((prev) => Math.max(0, prev - 1))}
                >
                  -
                </Button>
                <span className="text-xs font-bold w-4 text-center">{cartCount}</span>
                <Button
                  size="sm"
                  variant="outline"
                  className="h-6 w-6 p-0 text-xs"
                  onClick={() => setCartCount((prev) => prev + 1)}
                >
                  +
                </Button>
              </div>
            )}
          </div>

          {/* Interactive Header Rendering */}
          <div className="overflow-hidden rounded-2xl border border-border/80 bg-background shadow-xs">
            {isEcom ? (
              <SiteHeader
                actions={{
                  cartCount,
                  ctaLabel: 'Checkout',
                  onAccountClick: () => setFeedback('Account profile clicked.'),
                  onCartClick: () => setFeedback(`Cart opened (${cartCount} items).`),
                  onCtaClick: () => setFeedback('Checkout requested.'),
                  onSearchClick: () => setFeedback('Search triggered.'),
                  showCart: true,
                  showCta: true,
                }}
                announcement={{
                  actionLabel: 'Shop Now',
                  actionUrl: '#deals',
                  message: 'Mid-Season Flash Sale: Up to 40% off with code CODEX40',
                }}
                brand={{
                  badge: 'Store',
                  tagline: 'Modern Lifestyle Essentials',
                  title: 'CodexShop',
                }}
                categories={sampleCategories}
                links={sampleLinks}
                onCategorySelect={(cat) => setFeedback(`Selected category: ${cat.label}`)}
                showCategories
                sticky={false}
              />
            ) : (
              <SiteHeader
                actions={{
                  ctaLabel: 'Hire Me',
                  onCtaClick: () => setFeedback('Inquiry form requested.'),
                  onThemeToggle: () => setFeedback('Theme toggled.'),
                  showAccount: false,
                  showCart: false,
                  showCta: true,
                  showSearch: false,
                }}
                brand={{
                  tagline: 'Staff Software Architect & Designer',
                  title: 'Alex Chen',
                }}
                links={[
                  { href: '#work', label: 'Selected Works', badge: 'Featured' },
                  { href: '#experience', label: 'Experience' },
                  { href: '#writing', label: 'Articles' },
                  { href: '#contact', label: 'Get in Touch' },
                ]}
                showCategories={false}
                sticky={false}
              />
            )}

            <div className="flex h-36 items-center justify-center border-t border-border/40 bg-muted/10 p-6 text-center text-xs text-muted-foreground">
              Page Content Body Area (Simulated)
            </div>
          </div>

          <p className="text-xs text-muted-foreground" aria-live="polite">
            {feedback}
          </p>
        </div>
      }
      topology={topology}
      topologyIds={{ page: '28', preview: '28.1', usage: '28.2' }}
      usageDescription={
        <p>
          The Separated Site Header layout decouples the top announcement bar, primary brand navbar,
          action cluster, category strip, and mobile drawer into independently configurable bands.
          Ideal for public-facing e-commerce storefronts, SaaS landing pages, and portfolio sites.
        </p>
      }
    />
  )
}
