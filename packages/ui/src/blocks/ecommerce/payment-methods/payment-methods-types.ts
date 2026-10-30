export type SavedCard = {
  readonly brand: 'visa' | 'mastercard' | 'amex' | 'discover'
  readonly cardholderName: string
  readonly expiryMonth: string
  readonly expiryYear: string
  readonly id: string
  readonly isDefault?: boolean | undefined
  readonly last4: string
}

export type PaymentMethodSelectorProps = {
  readonly allowCOD?: boolean | undefined
  readonly className?: string | undefined
  readonly onAddNewCard?: (() => void) | undefined
  readonly onSelectMethod?: ((
    method: 'card' | 'upi' | 'wallet' | 'cod',
    details?: { cardId?: string; upiId?: string },
  ) => void) | undefined
  readonly savedCards: readonly SavedCard[]
  readonly selectedMethod?: 'card' | 'upi' | 'wallet' | 'cod' | undefined
}
