import { useState } from 'react'
import { ArrowRightIcon, CheckIcon, MailIcon, ShieldCheckIcon } from 'lucide-react'
import { cn } from '../../lib/utils'
import { Button } from '../../components/button'
import type { SiteFooterProps } from './footer-types'

const defaultColumns = [
  {
    title: 'Storefront',
    links: [
      { href: '#products', label: 'All Products' },
      { href: '#deals', label: 'Flash Deals', badge: 'Hot' },
      { href: '#bestsellers', label: 'Best Sellers' },
      { href: '#new', label: 'New Arrivals' },
      { href: '#compare', label: 'Product Compare' },
    ],
  },
  {
    title: 'Customer Care',
    links: [
      { href: '#tracking', label: 'Delivery Tracker' },
      { href: '#returns', label: 'Returns & Refunds' },
      { href: '#faq', label: 'Help & FAQ' },
      { href: '#shipping', label: 'Shipping Information' },
      { href: '#contact', label: 'Contact Support' },
    ],
  },
  {
    title: 'Editorial & Story',
    links: [
      { href: '#blog', label: 'Journal & Stories' },
      { href: '#guides', label: 'Buying Guides' },
      { href: '#authors', label: 'Design Team' },
      { href: '#community', label: 'Community Forum' },
    ],
  },
  {
    title: 'Legal & Security',
    links: [
      { href: '#privacy', label: 'Privacy Policy' },
      { href: '#terms', label: 'Terms of Service' },
      { href: '#security', label: 'Security & Trust' },
      { href: '#compliance', label: 'Compliance' },
    ],
  },
]

export function SiteFooter({
  brand,
  className,
  columns = defaultColumns,
  copyright = `© ${new Date().getFullYear()} ${brand.title}. All rights reserved.`,
  newsletter = {
    description: 'Get weekly design insights, product drops, and exclusive flash sale access.',
    placeholder: 'Enter your email address...',
    title: 'Subscribe to our newsletter',
  },
  paymentBadges = ['Visa', 'Mastercard', 'Amex', 'PayPal', 'Apple Pay', 'Stripe'],
  socialLinks = [],
}: SiteFooterProps) {
  const [email, setEmail] = useState('')
  const [isSubscribed, setIsSubscribed] = useState(false)

  const handleSubscribe = (e: React.FormEvent) => {
    e.preventDefault()
    if (!email.includes('@')) return
    newsletter.onSubscribe?.(email)
    setIsSubscribed(true)
  }

  return (
    <footer className={cn('w-full border-t border-border/80 bg-background text-foreground', className)}>
      {/* 1. Newsletter Strip */}
      {newsletter && (
        <div className="border-b border-border/60 bg-muted/20 px-6 py-10">
          <div className="mx-auto flex max-w-7xl flex-col lg:flex-row lg:items-center lg:justify-between gap-6">
            <div className="space-y-1">
              <h3 className="text-base font-bold tracking-tight text-foreground flex items-center gap-2">
                <MailIcon className="size-4 text-primary" />
                <span>{newsletter.title}</span>
              </h3>
              {newsletter.description && (
                <p className="text-xs text-muted-foreground">{newsletter.description}</p>
              )}
            </div>

            <form onSubmit={handleSubscribe} className="flex max-w-md w-full gap-2">
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder={newsletter.placeholder ?? 'Enter your email...'}
                className="flex-1 rounded-xl border border-input bg-background px-3.5 py-2 text-xs placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-primary"
              />
              <Button size="sm" type="submit" className="gap-1.5 text-xs px-4" disabled={isSubscribed}>
                {isSubscribed ? (
                  <>
                    <CheckIcon className="size-3.5" />
                    <span>Subscribed</span>
                  </>
                ) : (
                  <>
                    <span>Join</span>
                    <ArrowRightIcon className="size-3.5" />
                  </>
                )}
              </Button>
            </form>
          </div>
        </div>
      )}

      {/* 2. Main Columns Navigation */}
      <div className="mx-auto max-w-7xl px-6 py-12">
        <div className="grid grid-cols-1 md:grid-cols-12 gap-10">
          {/* Brand Column */}
          <div className="md:col-span-4 space-y-4">
            <div className="flex items-center gap-2.5">
              {brand.logo}
              <span className="text-lg font-bold tracking-tight text-foreground">{brand.title}</span>
            </div>

            {brand.description && (
              <p className="text-xs text-muted-foreground leading-relaxed max-w-sm">
                {brand.description}
              </p>
            )}

            <div className="flex items-center gap-2 text-xs text-muted-foreground pt-1">
              <ShieldCheckIcon className="size-4 text-emerald-600" />
              <span>Certified secure checkout & buyer protection</span>
            </div>

            {socialLinks.length > 0 && (
              <div className="flex items-center gap-2 pt-2">
                {socialLinks.map((s) => (
                  <a
                    key={s.label}
                    href={s.href}
                    aria-label={s.label}
                    className="flex size-8 items-center justify-center rounded-lg border border-border/80 text-muted-foreground hover:bg-muted hover:text-foreground transition-colors"
                  >
                    {s.icon}
                  </a>
                ))}
              </div>
            )}
          </div>

          {/* Links Columns */}
          <div className="md:col-span-8 grid grid-cols-2 sm:grid-cols-4 gap-8">
            {columns.map((col) => (
              <div key={col.title} className="space-y-3">
                <h4 className="text-xs font-bold uppercase tracking-wider text-foreground">
                  {col.title}
                </h4>
                <ul className="space-y-2 text-xs">
                  {col.links.map((link) => (
                    <li key={link.label}>
                      <a
                        href={link.href}
                        className="flex items-center gap-1.5 text-muted-foreground hover:text-foreground transition-colors"
                      >
                        <span>{link.label}</span>
                        {link.badge && (
                          <span className="rounded bg-primary/10 px-1 py-0.2 text-[9px] font-bold text-primary">
                            {link.badge}
                          </span>
                        )}
                      </a>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* 3. Bottom Legal & Payment Badges Strip */}
      <div className="border-t border-border/60 bg-muted/10 px-6 py-6">
        <div className="mx-auto flex max-w-7xl flex-col sm:flex-row items-center justify-between gap-4 text-xs text-muted-foreground">
          <p>{copyright}</p>

          {/* Payment Badges */}
          {paymentBadges.length > 0 && (
            <div className="flex flex-wrap items-center gap-1.5">
              {paymentBadges.map((badge) => (
                <span
                  key={badge}
                  className="rounded-md border border-border/60 bg-background px-2 py-0.5 font-mono text-[10px] font-bold text-muted-foreground"
                >
                  {badge}
                </span>
              ))}
            </div>
          )}
        </div>
      </div>
    </footer>
  )
}
