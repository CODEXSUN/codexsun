export type CheckoutAddress = {
  city: string
  country: string
  fullName: string
  phone: string
  postalCode: string
  state: string
  streetAddress: string
}

export type CheckoutShippingOption = {
  deliveryEstimate: string
  id: string
  label: string
  price: string
  priceValue: number
}

export type CheckoutPaymentSelection = {
  cvv?: string | undefined
  method: 'card' | 'upi' | 'wallet' | 'cod'
  savedCardId?: string | undefined
  upiId?: string | undefined
}

export type CheckoutItemSummary = {
  id: string
  image: string
  price: string
  quantity: number
  title: string
  variant?: string | undefined
}

export type CheckoutWizardProps = {
  readonly className?: string | undefined
  readonly currencySymbol?: string | undefined
  readonly defaultAddress?: Partial<CheckoutAddress> | undefined
  readonly initialStep?: 1 | 2 | 3 | undefined
  readonly items: readonly CheckoutItemSummary[]
  readonly onPlaceOrder?: (data: {
    address: CheckoutAddress
    payment: CheckoutPaymentSelection
    shipping: CheckoutShippingOption
  }) => void
  readonly shippingOptions?: readonly CheckoutShippingOption[] | undefined
  readonly subtotal: number
}
