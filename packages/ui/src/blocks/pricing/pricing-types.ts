export type BillingInterval = 'monthly' | 'annual'

export interface PricingFeatureItem {
  excluded?: boolean
  highlight?: boolean
  label: string
}

export interface PricingTierItem {
  annualPrice?: number
  badge?: string
  ctaHref?: string
  ctaLabel?: string
  ctaVariant?: 'default' | 'outline' | 'secondary'
  currency?: string
  description: string
  features: readonly PricingFeatureItem[]
  id: string
  isPopular?: boolean
  monthlyPrice: number
  name: string
  periodLabel?: string
}

export interface PricingTableProps {
  allowIntervalToggle?: boolean
  annualDiscountLabel?: string
  className?: string
  defaultInterval?: BillingInterval
  onSelectTier?: (tier: PricingTierItem, interval: BillingInterval) => void
  subtitle?: string
  tiers: readonly PricingTierItem[]
  title?: string
}
