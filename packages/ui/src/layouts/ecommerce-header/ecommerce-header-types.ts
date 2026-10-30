import type { ReactNode } from "react";

export type EcommerceCurrency = {
  readonly code: string;
  readonly label: string;
  readonly symbol: string;
};

export type EcommerceCategoryItem = {
  readonly href: string;
  readonly icon?: ReactNode | undefined;
  readonly id: string;
  readonly isHot?: boolean | undefined;
  readonly isNew?: boolean | undefined;
  readonly label: string;
  readonly subcategories?: readonly {
    readonly description?: string | undefined;
    readonly href: string;
    readonly label: string;
  }[];
};

export type EcommerceHeaderActions = {
  readonly cartCount?: number | undefined;
  readonly cartSubtotal?: string | undefined;
  readonly currency?: string | undefined;
  readonly isSearching?: boolean | undefined;
  readonly onAccountClick?: (() => void) | undefined;
  readonly onCartClick?: (() => void) | undefined;
  readonly onCurrencyChange?: ((currency: string) => void) | undefined;
  readonly onSearch?: ((query: string) => void) | undefined;
  readonly onWishlistClick?: (() => void) | undefined;
  readonly wishlistCount?: number | undefined;
};

export type EcommerceHeaderProps = {
  readonly actions?: EcommerceHeaderActions | undefined;
  readonly announcement?: {
    readonly actionHref?: string | undefined;
    readonly actionLabel?: string | undefined;
    readonly freeShippingProgress?: number | undefined;
    readonly message: string;
    readonly showFreeShippingMeter?: boolean | undefined;
  };
  readonly brand: {
    readonly href?: string | undefined;
    readonly logo?: ReactNode | undefined;
    readonly title: string;
  };
  readonly categories?: readonly EcommerceCategoryItem[] | undefined;
  readonly className?: string | undefined;
  readonly popularSearches?: readonly string[] | undefined;
  readonly quickLinks?: readonly {
    readonly badge?: string | undefined;
    readonly href: string;
    readonly label: string;
  }[];
  readonly supportPhone?: string | undefined;
};
