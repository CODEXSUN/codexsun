import type { ReactNode } from 'react'

export interface SiteHeaderNavLink {
  active?: boolean | undefined
  badge?: string | undefined
  external?: boolean | undefined
  href: string
  label: string
}

export interface SiteHeaderCategory {
  active?: boolean | undefined
  href: string
  id: string
  label: string
}

export interface SiteAnnouncementProps {
  actionLabel?: string | undefined
  actionUrl?: string | undefined
  dismissible?: boolean | undefined
  message: string
  onDismiss?: (() => void) | undefined
  show?: boolean | undefined
}

export interface SiteHeaderBrand {
  badge?: string | undefined
  href?: string | undefined
  logo?: ReactNode | undefined
  tagline?: string | undefined
  title: string
}

export interface SiteHeaderActions {
  accountHref?: string | undefined
  cartCount?: number | undefined
  ctaHref?: string | undefined
  ctaLabel?: string | undefined
  onAccountClick?: (() => void) | undefined
  onCartClick?: (() => void) | undefined
  onCtaClick?: (() => void) | undefined
  onSearchClick?: (() => void) | undefined
  onThemeToggle?: (() => void) | undefined
  searchPlaceholder?: string | undefined
  showAccount?: boolean | undefined
  showCart?: boolean | undefined
  showCta?: boolean | undefined
  showSearch?: boolean | undefined
  showThemeToggle?: boolean | undefined
}

export interface SiteHeaderProps {
  actions?: SiteHeaderActions | undefined
  announcement?: SiteAnnouncementProps | undefined
  brand: SiteHeaderBrand
  categories?: readonly SiteHeaderCategory[] | undefined
  className?: string | undefined
  links?: readonly SiteHeaderNavLink[] | undefined
  onCategorySelect?: ((category: SiteHeaderCategory) => void) | undefined
  showCategories?: boolean | undefined
  sticky?: boolean | undefined
}
