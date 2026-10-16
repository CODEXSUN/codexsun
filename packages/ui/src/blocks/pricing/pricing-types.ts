export type BillingInterval = 'monthly' | 'annual'

export interface PricingFeatureItem {
  excluded?: boolean | undefined
  highlight?: boolean | undefined
  label: string
}

export interface PricingTierItem {
  annualPrice?: number | undefined
  badge?: string | undefined
  ctaHref?: string | undefined
  ctaLabel?: string | undefined
  ctaVariant?: 'default' | 'outline' | 'secondary' | undefined
  currency?: string | undefined
  description: string
  features: readonly PricingFeatureItem[]
  id: string
  isPopular?: boolean | undefined
  monthlyPrice: number
  name: string
  periodLabel?: string | undefined
}

export interface PricingTableProps {
  allowIntervalToggle?: boolean | undefined
  annualDiscountLabel?: string | undefined
  className?: string | undefined
  defaultInterval?: BillingInterval | undefined
  onSelectTier?: ((tier: PricingTierItem, interval: BillingInterval) => void) | undefined
  subtitle?: string | undefined
  tiers: readonly PricingTierItem[]
  title?: string | undefined
}
