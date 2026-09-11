import { ArrowRightIcon, MinusIcon, PlusIcon, ShoppingBagIcon, Trash2Icon, TruckIcon, XIcon } from 'lucide-react'
import { cn } from '../../../lib/utils'
import { Button } from '../../../components/button'
import type { StorefrontCartProps } from './cart-types'

export function StorefrontCart({
  className,
  currencySymbol = '$',
  freeShippingThreshold = 75,
  isDrawer = true,
  items,
  onCheckout,
  onClose,
  onQuantityChange,
  onRemoveItem,
  open = true,
  promoDiscountValue = 0,
}: StorefrontCartProps) {
  if (isDrawer && !open) return null

  const subtotal = items.reduce((acc, item) => acc + item.priceValue * item.quantity, 0)
  const total = Math.max(0, subtotal - promoDiscountValue)
  const freeShippingProgress = Math.min(100, Math.round((subtotal / freeShippingThreshold) * 100))
  const remainingForFreeShipping = Math.max(0, freeShippingThreshold - subtotal)

  const content = (
    <div className="flex h-full flex-col justify-between bg-background">
      {/* Header */}
      <div className="flex items-center justify-between border-b border-border/80 px-5 py-4">
        <div className="flex items-center gap-2">
          <ShoppingBagIcon className="size-5 text-primary" />
          <h2 className="text-base font-bold text-foreground">Shopping Cart</h2>
          <span className="rounded-full bg-muted px-2 py-0.5 text-xs font-semibold text-muted-foreground">
            {items.reduce((acc, it) => acc + it.quantity, 0)}
          </span>
        </div>
        {isDrawer && onClose && (
          <Button size="icon" variant="ghost" className="size-8" onClick={onClose} aria-label="Close cart">
            <XIcon className="size-4" />
          </Button>
        )}
      </div>

      {/* Free Shipping Progress Meter */}
      <div className="border-b border-border/40 bg-muted/30 px-5 py-3 text-xs">
        <div className="flex items-center gap-2 text-foreground font-medium mb-1.5">
          <TruckIcon className="size-4 text-primary" />
          {remainingForFreeShipping > 0 ? (
            <span>
              Add <strong className="text-primary">{currencySymbol}{remainingForFreeShipping.toFixed(2)}</strong> more to get Free Shipping!
            </span>
          ) : (
            <span className="font-semibold text-emerald-600 dark:text-emerald-400">
              🎉 Congratulations! You have unlocked Free Shipping!
            </span>
          )}
        </div>
        <div className="h-2 w-full rounded-full bg-border overflow-hidden">
          <div
            className="h-full bg-primary transition-all duration-300"
            style={{ width: `${freeShippingProgress}%` }}
          />
        </div>
      </div>

      {/* Item List */}
      <div className="flex-1 overflow-y-auto px-5 py-4 space-y-4">
        {items.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 text-center text-muted-foreground">
            <ShoppingBagIcon className="size-12 stroke-[1.2] mb-3 opacity-40" />
            <p className="text-sm font-semibold text-foreground">Your cart is empty</p>
            <p className="text-xs text-muted-foreground mt-1">Add products to your cart to checkout.</p>
          </div>
        ) : (
          items.map((item) => (
            <div
              key={item.id}
              className="flex items-center gap-3 rounded-xl border border-border/60 bg-card p-3 shadow-xs transition-colors hover:border-border"
            >
              <img
                src={item.image}
                alt={item.title}
                className="size-18 rounded-lg object-cover bg-muted shrink-0 border border-border/40"
              />

              <div className="flex-1 min-w-0">
                <h4 className="text-xs font-semibold text-foreground truncate">{item.title}</h4>
                {item.variant && (
                  <p className="text-[11px] text-muted-foreground truncate">{item.variant}</p>
                )}
                <div className="flex items-baseline gap-1.5 mt-1">
                  <span className="text-xs font-bold text-foreground">{item.price}</span>
                  {item.originalPrice && (
                    <span className="text-[10px] text-muted-foreground line-through">
                      {item.originalPrice}
                    </span>
                  )}
                </div>

                {/* Quantity Stepper */}
                <div className="flex items-center gap-2 mt-2">
                  <div className="flex items-center rounded-lg border border-border/80 bg-muted/40">
                    <button
                      type="button"
                      disabled={item.quantity <= 1}
                      onClick={() => onQuantityChange?.(item.id, item.quantity - 1)}
                      className="flex size-6 items-center justify-center text-muted-foreground hover:text-foreground disabled:opacity-30"
                    >
                      <MinusIcon className="size-3" />
                    </button>
                    <span className="w-6 text-center text-xs font-bold text-foreground">
                      {item.quantity}
                    </span>
                    <button
                      type="button"
                      onClick={() => onQuantityChange?.(item.id, item.quantity + 1)}
                      className="flex size-6 items-center justify-center text-muted-foreground hover:text-foreground"
                    >
                      <PlusIcon className="size-3" />
                    </button>
                  </div>

                  <button
                    type="button"
                    onClick={() => onRemoveItem?.(item.id)}
                    className="text-muted-foreground hover:text-destructive p-1 transition-colors"
                    aria-label={`Remove ${item.title}`}
                  >
                    <Trash2Icon className="size-3.5" />
                  </button>
                </div>
              </div>
            </div>
          ))
        )}
      </div>

      {/* Order Summary & Checkout */}
      {items.length > 0 && (
        <div className="border-t border-border/80 bg-muted/20 p-5 space-y-3">
          <div className="space-y-1.5 text-xs">
            <div className="flex justify-between text-muted-foreground">
              <span>Subtotal</span>
              <span className="font-semibold text-foreground">{currencySymbol}{subtotal.toFixed(2)}</span>
            </div>
            {promoDiscountValue > 0 && (
              <div className="flex justify-between text-emerald-600 dark:text-emerald-400">
                <span>Discount</span>
                <span className="font-semibold">-{currencySymbol}{promoDiscountValue.toFixed(2)}</span>
              </div>
            )}
            <div className="flex justify-between text-muted-foreground">
              <span>Shipping</span>
              <span className="font-semibold text-foreground">
                {remainingForFreeShipping === 0 ? 'FREE' : `${currencySymbol}9.99`}
              </span>
            </div>
            <div className="border-t border-border/60 pt-2 flex justify-between text-sm font-bold text-foreground">
              <span>Estimated Total</span>
              <span>{currencySymbol}{total.toFixed(2)}</span>
            </div>
          </div>

          <Button className="w-full gap-2 shadow-xs" onClick={onCheckout}>
            <span>Proceed to Checkout</span>
            <ArrowRightIcon className="size-4" />
          </Button>
        </div>
      )}
    </div>
  )

  if (!isDrawer) {
    return (
      <div className={cn('rounded-2xl border border-border/80 bg-card overflow-hidden shadow-xs', className)}>
        {content}
      </div>
    )
  }

  return (
    <div className="fixed inset-0 z-50 flex justify-end bg-background/80 backdrop-blur-sm animate-in fade-in-0 duration-200">
      <div className={cn('w-full max-w-md border-l border-border/80 shadow-2xl animate-in slide-in-from-right duration-300', className)}>
        {content}
      </div>
    </div>
  )
}
