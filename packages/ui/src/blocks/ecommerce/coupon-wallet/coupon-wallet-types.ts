export type StoreCoupon = {
  readonly applicableCategory?: string
  readonly code: string
  readonly description: string
  readonly discountText: string
  readonly expiresAt: string
  readonly id: string
  readonly isApplied?: boolean
  readonly minimumOrderValue?: number
  readonly terms?: string
  readonly title: string
}

export type CouponWalletProps = {
  readonly appliedCouponId?: string
  readonly className?: string
  readonly coupons: readonly StoreCoupon[]
  readonly onApplyCoupon?: (code: string) => void
  readonly onCopyCode?: (code: string) => void
  readonly onRemoveCoupon?: () => void
}
