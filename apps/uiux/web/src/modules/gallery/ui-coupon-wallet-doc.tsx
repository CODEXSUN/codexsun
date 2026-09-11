import { useState } from 'react'
import { CouponWallet, type StoreCoupon } from '@codexsun/ui/blocks/ecommerce/coupon-wallet'
import { useMdiTopology } from '@codexsun/ui/layouts/mdi-main'
import { UiTemplatePage } from '@codexsun/ui/templates/ui-page'

const sampleCoupons: StoreCoupon[] = [
  {
    code: 'CODEXSPRING20',
    description: 'Enjoy 20% off all catalog electronics and accessories with no minimum order.',
    discountText: '20% OFF',
    expiresAt: 'April 30, 2026',
    id: 'c1',
    minimumOrderValue: 50,
    title: 'Seasonal Spring Discount',
  },
  {
    code: 'FREESHIP75',
    description: 'Free expedited courier delivery on any qualifying basket above $75.',
    discountText: 'FREE SHIPPING',
    expiresAt: 'May 15, 2026',
    id: 'c2',
    minimumOrderValue: 75,
    title: 'Complimentary Express Delivery',
  },
  {
    code: 'STUDIOVIP',
    description: 'Exclusive $50 voucher for VIP studio workstation purchases.',
    discountText: '$50 FLAT OFF',
    expiresAt: 'Dec 31, 2026',
    id: 'c3',
    minimumOrderValue: 200,
    title: 'Hardware Upgrade Voucher',
  },
]

export function UiCouponWalletDocumentation() {
  const topology = useMdiTopology()
  const [appliedId, setAppliedId] = useState<string | undefined>('c1')
  const [feedback, setFeedback] = useState<string | null>(null)

  return (
    <UiTemplatePage
      code={`import { CouponWallet } from '@codexsun/ui/blocks/ecommerce/coupon-wallet'

export function Vouchers({ coupons }) {
  return <CouponWallet coupons={coupons} />
}`}
      importPath="@codexsun/ui/blocks/ecommerce/coupon-wallet"
      kind="Block"
      name="Coupon Wallet"
      navigation={{
        previous: { href: '/?block=comparison', name: 'Product Comparison' },
      }}
      preview={
        <div className="space-y-6 max-w-2xl mx-auto">
          {feedback && (
            <div className="rounded-xl border border-primary/40 bg-primary/10 p-3 text-xs text-primary font-semibold">
              {feedback}
            </div>
          )}

          <CouponWallet
            appliedCouponId={appliedId}
            coupons={sampleCoupons}
            onApplyCoupon={(code) => {
              const matched = sampleCoupons.find((c) => c.code === code)
              if (matched) {
                setAppliedId(matched.id)
                setFeedback(`Applied coupon ${code}: ${matched.discountText}!`)
              } else {
                setFeedback(`Custom promo code "${code}" applied to order.`)
              }
            }}
            onRemoveCoupon={() => {
              setAppliedId(undefined)
              setFeedback('Removed active coupon discount.')
            }}
          />
        </div>
      }
      topology={topology}
      topologyIds={{ page: '37', preview: '37.1', usage: '37.2' }}
      usageDescription={
        <p>
          Promotional voucher cards with one-click code copy, discount chips, active state management,
          and manual promo code input.
        </p>
      }
    />
  )
}
