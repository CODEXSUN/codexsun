export type SavedCard = {
  readonly brand: 'visa' | 'mastercard' | 'amex' | 'discover'
  readonly cardholderName: string
  readonly expiryMonth: string
  readonly expiryYear: string
  readonly id: string
  readonly isDefault?: boolean
  readonly last4: string
}

export type PaymentMethodSelectorProps = {
  readonly allowCOD?: boolean
  readonly className?: string
  readonly onAddNewCard?: () => void
  readonly onSelectMethod?: (method: 'card' | 'upi' | 'wallet' | 'cod', details?: { cardId?: string; upiId?: string }) => void
  readonly savedCards: readonly SavedCard[]
  readonly selectedMethod?: 'card' | 'upi' | 'wallet' | 'cod'
}
