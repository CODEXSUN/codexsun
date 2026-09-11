import { useState } from 'react'
import { CheckIcon, CopyIcon, SparklesIcon, TagIcon, TicketIcon } from 'lucide-react'
import { cn } from '../../../lib/utils'
import { Button } from '../../../components/button'
import { Badge } from '../../../components/badge'
import type { CouponWalletProps } from './coupon-wallet-types'

export function CouponWallet({
  appliedCouponId,
  className,
  coupons,
  onApplyCoupon,
  onCopyCode,
  onRemoveCoupon,
}: CouponWalletProps) {
  const [copiedCode, setCopiedCode] = useState<string | null>(null)
  const [customCode, setCustomCode] = useState('')

  const handleCopy = (code: string) => {
    navigator.clipboard?.writeText(code)
    setCopiedCode(code)
    onCopyCode?.(code)
    setTimeout(() => setCopiedCode(null), 2000)
  }

  return (
    <div className={cn('space-y-6', className)}>
      {/* Top Input for manual code entry */}
      <div className="flex flex-col sm:flex-row gap-2 rounded-2xl border border-border/80 bg-card p-4 shadow-xs">
        <div className="relative flex-1">
          <TagIcon className="size-4 text-muted-foreground absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={customCode}
            onChange={(e) => setCustomCode(e.target.value.toUpperCase())}
            placeholder="Have a promo code? Enter here..."
            className="w-full rounded-xl border border-input bg-muted/20 pl-9 pr-3 py-2 text-xs font-mono uppercase placeholder:font-sans placeholder:normal-case focus:outline-none focus:ring-1 focus:ring-primary"
          />
        </div>
        <Button
          size="sm"
          disabled={!customCode.trim()}
          onClick={() => {
            onApplyCoupon?.(customCode)
            setCustomCode('')
          }}
          className="text-xs"
        >
          Apply Promo
        </Button>
      </div>

      {/* Available Coupons Grid */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <TicketIcon className="size-4 text-primary" />
            <h4 className="text-sm font-bold text-foreground">Available Coupons & Vouchers</h4>
          </div>
          <span className="text-xs text-muted-foreground">{coupons.length} vouchers</span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {coupons.map((coupon) => {
            const isApplied = appliedCouponId === coupon.id
            const isCopied = copiedCode === coupon.code

            return (
              <div
                key={coupon.id}
                className={cn(
                  'relative flex flex-col justify-between overflow-hidden rounded-2xl border p-4 shadow-xs transition-all',
                  isApplied
                    ? 'border-primary bg-primary/5 ring-1 ring-primary'
                    : 'border-border/80 bg-card hover:border-border'
                )}
              >
                {/* Coupon Scallop Cutouts */}
                <div className="absolute -left-2 top-1/2 -translate-y-1/2 size-4 rounded-full bg-background border-r border-border" />
                <div className="absolute -right-2 top-1/2 -translate-y-1/2 size-4 rounded-full bg-background border-l border-border" />

                <div className="space-y-2">
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <span className="text-base font-black text-primary tracking-tight">
                        {coupon.discountText}
                      </span>
                      <h5 className="text-xs font-bold text-foreground mt-0.5">{coupon.title}</h5>
                    </div>
                    {isApplied ? (
                      <Badge variant="default" className="gap-1 text-[10px] font-bold">
                        <SparklesIcon className="size-3" />
                        <span>Applied</span>
                      </Badge>
                    ) : (
                      <span className="text-[10px] text-muted-foreground font-semibold">
                        Expires {coupon.expiresAt}
                      </span>
                    )}
                  </div>

                  <p className="text-xs text-muted-foreground">{coupon.description}</p>

                  {coupon.minimumOrderValue && (
                    <div className="text-[11px] text-muted-foreground/90">
                      Min. spend: <strong>${coupon.minimumOrderValue}</strong>
                    </div>
                  )}
                </div>

                {/* Bottom Actions */}
                <div className="mt-4 pt-3 border-t border-border/60 border-dashed flex items-center justify-between gap-2">
                  {/* Code pill */}
                  <button
                    type="button"
                    onClick={() => handleCopy(coupon.code)}
                    className="flex items-center gap-1.5 rounded-lg border border-border/80 bg-muted/40 px-2.5 py-1 text-xs font-mono font-bold text-foreground hover:bg-muted transition-colors"
                  >
                    <span>{coupon.code}</span>
                    {isCopied ? (
                      <CheckIcon className="size-3 text-emerald-600" />
                    ) : (
                      <CopyIcon className="size-3 text-muted-foreground" />
                    )}
                  </button>

                  {isApplied ? (
                    <Button
                      size="sm"
                      variant="ghost"
                      className="h-7 text-xs text-destructive hover:bg-destructive/10"
                      onClick={onRemoveCoupon}
                    >
                      Remove
                    </Button>
                  ) : (
                    <Button
                      size="sm"
                      variant="outline"
                      className="h-7 text-xs"
                      onClick={() => onApplyCoupon?.(coupon.code)}
                    >
                      Apply Code
                    </Button>
                  )}
                </div>
              </div>
            )
          })}
        </div>
      </div>
    </div>
  )
}
