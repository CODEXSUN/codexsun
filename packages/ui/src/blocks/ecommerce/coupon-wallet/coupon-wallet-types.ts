export type StoreCoupon = {
  readonly applicableCategory?: string | undefined
  readonly code: string
  readonly description: string
  readonly discountText: string
  readonly expiresAt: string
  readonly id: string
  readonly isApplied?: boolean | undefined
  readonly minimumOrderValue?: number | undefined
  readonly terms?: string | undefined
  readonly title: string
}

export type CouponWalletProps = {
  readonly appliedCouponId?: string | undefined
  readonly className?: string | undefined
  readonly coupons: readonly StoreCoupon[]
  readonly onApplyCoupon?: ((code: string) => void) | undefined
  readonly onCopyCode?: ((code: string) => void) | undefined
  readonly onRemoveCoupon?: (() => void) | undefined
}
