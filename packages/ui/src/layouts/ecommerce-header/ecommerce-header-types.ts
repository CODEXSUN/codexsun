import type { ReactNode } from 'react'

export type EcommerceCurrency = {
  readonly code: string
  readonly label: string
  readonly symbol: string
}

export type EcommerceCategoryItem = {
  readonly href: string
  readonly icon?: ReactNode
  readonly id: string
  readonly isHot?: boolean
  readonly isNew?: boolean
  readonly label: string
  readonly subcategories?: readonly {
    readonly description?: string
    readonly href: string
    readonly label: string
  }[]
}

export type EcommerceHeaderActions = {
  readonly cartCount?: number
  readonly cartSubtotal?: string
  readonly currency?: string
  readonly isSearching?: boolean
  readonly onAccountClick?: () => void
  readonly onCartClick?: () => void
  readonly onCurrencyChange?: (currency: string) => void
  readonly onSearch?: (query: string) => void
  readonly onWishlistClick?: () => void
  readonly wishlistCount?: number
}

export type EcommerceHeaderProps = {
  readonly actions?: EcommerceHeaderActions
  readonly announcement?: {
    readonly actionHref?: string
    readonly actionLabel?: string
    readonly freeShippingProgress?: number
    readonly message: string
    readonly showFreeShippingMeter?: boolean
  }
  readonly brand: {
    readonly href?: string
    readonly logo?: ReactNode
    readonly title: string
  }
  readonly categories?: readonly EcommerceCategoryItem[]
  readonly className?: string
  readonly popularSearches?: readonly string[]
  readonly quickLinks?: readonly {
    readonly badge?: string
    readonly href: string
    readonly label: string
  }[]
  readonly supportPhone?: string
}
