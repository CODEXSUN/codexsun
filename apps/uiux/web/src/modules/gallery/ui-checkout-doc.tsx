import { useState } from 'react'
import { CheckoutWizard, type CheckoutItemSummary } from '@codexsun/ui/blocks/ecommerce/checkout'
import { useMdiTopology } from '@codexsun/ui/layouts/mdi-main'
import { UiTemplatePage } from '@codexsun/ui/templates/ui-page'

const sampleItems: CheckoutItemSummary[] = [
  {
    id: 'p1',
    image: 'https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=200&q=80',
    price: '$199.00',
    quantity: 1,
    title: 'Acoustic Studio Headphones',
  },
  {
    id: 'p2',
    image: 'https://images.unsplash.com/photo-1587829741301-dc798b83add3?w=200&q=80',
    price: '$79.00',
    quantity: 1,
    title: 'Tactile Mechanical Keyboard',
  },
]

export function UiCheckoutDocumentation() {
  const topology = useMdiTopology()
  const [orderOutcome, setOrderOutcome] = useState<string | null>(null)

  return (
    <UiTemplatePage
      code={`import { CheckoutWizard } from '@codexsun/ui/blocks/ecommerce/checkout'

export function Checkout({ items, subtotal }) {
  return <CheckoutWizard items={items} subtotal={subtotal} />
}`}
      importPath="@codexsun/ui/blocks/ecommerce/checkout"
      kind="Block"
      name="Checkout Wizard"
      navigation={{
        previous: { href: '/?block=categories', name: 'Categories' },
      }}
      preview={
        <div className="space-y-6">
          {orderOutcome && (
            <div className="rounded-xl border border-emerald-500/40 bg-emerald-500/10 p-4 text-xs font-semibold text-emerald-600 dark:text-emerald-400">
              {orderOutcome}
            </div>
          )}

          <CheckoutWizard
            items={sampleItems}
            subtotal={278}
            onPlaceOrder={(data) => {
              setOrderOutcome(
                `Order Placed Successfully! Delivered to ${data.address.fullName} via ${data.shipping.label} with payment method: ${data.payment.method}.`
              )
            }}
          />
        </div>
      }
      topology={topology}
      topologyIds={{ page: '35', preview: '35.1', usage: '35.2' }}
      usageDescription={
        <p>
          Multi-step checkout wizard with shipping destination form, shipping speed selection,
          256-bit encrypted payment method selector, and final order review.
        </p>
      }
    />
  )
}
