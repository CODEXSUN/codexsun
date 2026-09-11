import { useState } from 'react'
import { PaymentMethodSelector, type SavedCard } from '@codexsun/ui/blocks/ecommerce/payment-methods'
import { useMdiTopology } from '@codexsun/ui/layouts/mdi-main'
import { UiTemplatePage } from '@codexsun/ui/templates/ui-page'

const sampleCards: SavedCard[] = [
  {
    brand: 'visa',
    cardholderName: 'Alex Morgan',
    expiryMonth: '08',
    expiryYear: '29',
    id: 'c1',
    isDefault: true,
    last4: '4242',
  },
  {
    brand: 'mastercard',
    cardholderName: 'Alex Morgan',
    expiryMonth: '11',
    expiryYear: '27',
    id: 'c2',
    last4: '8821',
  },
]

export function UiPaymentMethodsDocumentation() {
  const topology = useMdiTopology()
  const [selectedMethodSummary, setSelectedMethodSummary] = useState<string>('Card •••• 4242 (Default)')

  return (
    <UiTemplatePage
      code={`import { PaymentMethodSelector } from '@codexsun/ui/blocks/ecommerce/payment-methods'

export function PaymentOptions({ savedCards }) {
  return <PaymentMethodSelector savedCards={savedCards} />
}`}
      importPath="@codexsun/ui/blocks/ecommerce/payment-methods"
      kind="Block"
      name="Payment Methods"
      navigation={{
        previous: { href: '/?block=delivery-tracker', name: 'Delivery Tracker' },
      }}
      preview={
        <div className="space-y-6 max-w-2xl mx-auto">
          <div className="rounded-xl border border-border/80 bg-muted/30 p-3 text-xs">
            <span className="font-semibold text-foreground">Current Selection: </span>
            <span className="text-primary font-bold">{selectedMethodSummary}</span>
          </div>

          <PaymentMethodSelector
            savedCards={sampleCards}
            onSelectMethod={(method, details) => {
              if (method === 'card') {
                const card = sampleCards.find((c) => c.id === details?.cardId)
                setSelectedMethodSummary(`Card •••• ${card?.last4 ?? '4242'}`)
              } else if (method === 'upi') {
                setSelectedMethodSummary(`UPI (${details?.upiId || 'Pending ID'})`)
              } else if (method === 'wallet') {
                setSelectedMethodSummary('Digital Wallet (Apple Pay / Google Pay)')
              } else {
                setSelectedMethodSummary('Cash on Delivery (COD)')
              }
            }}
          />
        </div>
      }
      topology={topology}
      topologyIds={{ page: '39', preview: '39.1', usage: '39.2' }}
      usageDescription={
        <p>
          Comprehensive payment method selector covering saved credit/debit cards with cardholder names
          and CVV verification, instant UPI, mobile wallets, and cash on delivery.
        </p>
      }
    />
  )
}
