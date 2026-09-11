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
  cvv?: string
  method: 'card' | 'upi' | 'wallet' | 'cod'
  savedCardId?: string
  upiId?: string
}

export type CheckoutItemSummary = {
  id: string
  image: string
  price: string
  quantity: number
  title: string
  variant?: string
}

export type CheckoutWizardProps = {
  readonly className?: string
  readonly currencySymbol?: string
  readonly defaultAddress?: Partial<CheckoutAddress>
  readonly initialStep?: 1 | 2 | 3
  readonly items: readonly CheckoutItemSummary[]
  readonly onPlaceOrder?: (data: {
    address: CheckoutAddress
    payment: CheckoutPaymentSelection
    shipping: CheckoutShippingOption
  }) => void
  readonly shippingOptions?: readonly CheckoutShippingOption[]
  readonly subtotal: number
}
