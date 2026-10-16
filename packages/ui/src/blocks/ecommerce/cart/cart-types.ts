export type CartItem = {
  readonly discount?: string | undefined
  readonly id: string
  readonly image: string
  readonly inStock?: boolean | undefined
  readonly originalPrice?: string | undefined
  readonly price: string
  readonly priceValue: number
  readonly quantity: number
  readonly title: string
  readonly variant?: string | undefined
}

export type StorefrontCartProps = {
  readonly className?: string | undefined
  readonly currencySymbol?: string | undefined
  readonly freeShippingThreshold?: number | undefined
  readonly isDrawer?: boolean | undefined
  readonly items: readonly CartItem[]
  readonly onCheckout?: (() => void) | undefined
  readonly onClose?: (() => void) | undefined
  readonly onQuantityChange?: ((itemId: string, newQuantity: number) => void) | undefined
  readonly onRemoveItem?: ((itemId: string) => void) | undefined
  readonly open?: boolean | undefined
  readonly promoCode?: string | undefined
  readonly promoDiscountValue?: number | undefined
}
