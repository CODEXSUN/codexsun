import type { ReactNode } from 'react'

export interface SiteHeaderNavLink {
  active?: boolean
  badge?: string
  external?: boolean
  href: string
  label: string
}

export interface SiteHeaderCategory {
  active?: boolean
  href: string
  id: string
  label: string
}

export interface SiteAnnouncementProps {
  actionLabel?: string
  actionUrl?: string
  dismissible?: boolean
  message: string
  onDismiss?: () => void
  show?: boolean
}

export interface SiteHeaderBrand {
  badge?: string
  href?: string
  logo?: ReactNode
  tagline?: string
  title: string
}

export interface SiteHeaderActions {
  accountHref?: string
  cartCount?: number
  ctaHref?: string
  ctaLabel?: string
  onAccountClick?: () => void
  onCartClick?: () => void
  onCtaClick?: () => void
  onSearchClick?: () => void
  onThemeToggle?: () => void
  searchPlaceholder?: string
  showAccount?: boolean
  showCart?: boolean
  showCta?: boolean
  showSearch?: boolean
  showThemeToggle?: boolean
}

export interface SiteHeaderProps {
  actions?: SiteHeaderActions
  announcement?: SiteAnnouncementProps
  brand: SiteHeaderBrand
  categories?: readonly SiteHeaderCategory[]
  className?: string
  links?: readonly SiteHeaderNavLink[]
  onCategorySelect?: (category: SiteHeaderCategory) => void
  showCategories?: boolean
  sticky?: boolean
}
