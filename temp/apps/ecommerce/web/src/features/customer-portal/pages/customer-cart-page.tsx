import { ArrowRightIcon, Trash2Icon } from 'lucide-react'
import { Link } from 'react-router-dom'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { QuantitySelector } from '@/features/store/components/product/QuantitySelector'
import { useStorefront } from '@/features/store/context/storefront-context'
import { formatCurrency, getPrimaryProductImage } from '@/features/store/lib/storefront-utils'

export function CustomerCartPage() {
  const { cartItems, products, cartSubtotal, updateCartItem, removeFromCart } = useStorefront()
  const shipping = cartSubtotal > 5000 ? 0 : 199
  const handling = cartItems.length > 0 ? 99 : 0
  const total = cartSubtotal + shipping + handling

  return (
    <div className="space-y-4">
      <Card className="mesh-panel overflow-hidden">
        <CardHeader className="gap-4 border-b border-border/60 p-8">
          <Badge className="w-fit">Cart</Badge>
          <div className="space-y-3">
            <CardTitle className="text-4xl tracking-tight sm:text-5xl">Current cart state.</CardTitle>
            <CardDescription className="max-w-3xl text-base leading-7">
              Review queued products, adjust quantities, and move back into the existing storefront checkout flow.
            </CardDescription>
          </div>
        </CardHeader>
      </Card>

      {cartItems.length === 0 ? (
        <Card>
          <CardContent className="space-y-4 p-6">
            <p className="text-sm text-muted-foreground">Your cart is empty right now.</p>
            <Button asChild>
              <Link to="/search">Browse catalog</Link>
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4 xl:grid-cols-[1.15fr_0.85fr]">
          <div className="space-y-4">
            {cartItems.map((item) => {
              const product = products.find((entry) => entry.id === item.productId)
              if (!product) {
                return null
              }

              return (
                <Card key={`${item.productId}-${item.size}-${item.color}`}>
                  <CardContent className="grid gap-4 p-4 sm:grid-cols-[132px_minmax(0,1fr)]">
                    <div className="overflow-hidden rounded-[1.25rem] bg-muted/50">
                      {getPrimaryProductImage(product) ? (
                        <img src={getPrimaryProductImage(product)} alt={product.name} className="aspect-[4/4.6] w-full object-cover" loading="lazy" decoding="async" />
                      ) : (
                        <div className="flex aspect-[4/4.6] items-center justify-center text-sm text-muted-foreground">No image</div>
                      )}
                    </div>
                    <div className="space-y-4">
                      <div className="flex flex-wrap items-start justify-between gap-4">
                        <div>
                          <p className="text-xs uppercase tracking-[0.16em] text-muted-foreground">{product.categoryName}</p>
                          <h2 className="mt-2 text-xl font-semibold text-foreground">{product.name}</h2>
                          <p className="mt-1 text-sm text-muted-foreground">{item.size} / {item.color}</p>
                        </div>
                        <p className="text-lg font-semibold text-foreground">{formatCurrency(product.price)}</p>
                      </div>
                      <div className="flex flex-wrap items-center justify-between gap-4">
                        <QuantitySelector value={item.quantity} onChange={(value) => updateCartItem(item.productId, { quantity: value })} />
                        <Button variant="ghost" onClick={() => removeFromCart(item.productId)}>
                          <Trash2Icon className="size-4" />
                          Remove
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              )
            })}
          </div>

          <Card>
            <CardHeader>
              <CardTitle>Order summary</CardTitle>
              <CardDescription>Current total from your live storefront cart.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid gap-3 text-sm">
                <div className="flex items-center justify-between"><span className="text-muted-foreground">Subtotal</span><span>{formatCurrency(cartSubtotal)}</span></div>
                <div className="flex items-center justify-between"><span className="text-muted-foreground">Shipping</span><span>{shipping === 0 ? 'Free' : formatCurrency(shipping)}</span></div>
                <div className="flex items-center justify-between"><span className="text-muted-foreground">Handling</span><span>{formatCurrency(handling)}</span></div>
                <div className="flex items-center justify-between border-t border-border pt-3 text-base font-semibold"><span>Total</span><span>{formatCurrency(total)}</span></div>
              </div>
              <Button asChild className="w-full">
                <Link to="/checkout">
                  Continue to checkout
                  <ArrowRightIcon className="size-4" />
                </Link>
              </Button>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  )
}
