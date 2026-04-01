import { ArrowRightIcon, ShoppingBagIcon, Trash2Icon } from "lucide-react"
import { Link } from "react-router-dom"

import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { useAuth } from "@framework-core/web/auth/components/auth-provider"
import { QuantitySelector } from "@/features/store/components/product/QuantitySelector"
import { useStorefront } from "@/features/store/context/storefront-context"
import { formatCurrency, getPrimaryProductImage } from "@/features/store/lib/storefront-utils"

export function StoreCartPage() {
  const auth = useAuth()
  const { cartItems, products, cartSubtotal, updateCartItem, removeFromCart } = useStorefront()
  const shipping = cartSubtotal > 5000 ? 0 : 199
  const handling = cartItems.length > 0 ? 99 : 0
  const total = cartSubtotal + shipping + handling
  const recommended = products.filter((product) => product.categorySlug === "accessories").slice(0, 2)

  if (cartItems.length === 0) {
    return (
      <div className="mx-auto max-w-7xl px-4 py-10 sm:px-6">
        <div className="rounded-[2rem] border border-dashed border-border/70 bg-white/75 p-10 text-center">
          <h1 className="text-3xl font-semibold tracking-tight">Your cart is empty.</h1>
          <p className="mt-3 text-sm text-muted-foreground">
            Add a few pieces from the live storefront catalog to review the full cart and checkout flow.
          </p>
          <Button asChild className="mt-6 rounded-full">
            <Link to="/search">Browse styles</Link>
          </Button>
        </div>
      </div>
    )
  }

  return (
    <div className="mx-auto flex max-w-7xl flex-col gap-8 px-4 py-8 sm:px-6 sm:py-10">
      <section className="rounded-[2.2rem] border border-white/70 bg-white/78 p-6 shadow-[0_24px_60px_-44px_rgba(40,28,18,0.25)] sm:p-8">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div className="space-y-2">
            <Badge variant="outline" className="w-fit">
              Shopping Bag
            </Badge>
            <h1 className="text-3xl font-semibold tracking-tight sm:text-4xl">Review your selected styles.</h1>
            <p className="max-w-2xl text-sm leading-6 text-muted-foreground">
              This cart stays fully inside the live storefront flow while preserving the current layout and checkout structure.
            </p>
          </div>
          <Button asChild variant="outline" className="rounded-full">
            <Link to="/search">Continue shopping</Link>
          </Button>
        </div>
      </section>

      <div className="grid gap-6 lg:grid-cols-[1.1fr_0.9fr]">
        <section className="space-y-4">
          {cartItems.map((item) => {
            const product = products.find((entry) => entry.id === item.productId)
            if (!product) return null

            return (
              <article
                key={`${item.productId}-${item.size}-${item.color}`}
                className="grid gap-4 rounded-[1.8rem] border border-white/70 bg-white/82 p-4 shadow-sm sm:grid-cols-[160px_minmax(0,1fr)]"
              >
                <div className="overflow-hidden rounded-[1.5rem] bg-muted/50">
                  {getPrimaryProductImage(product) ? (
                    <img src={getPrimaryProductImage(product)} alt={product.name} className="aspect-[4/4.6] w-full object-cover" loading="lazy" decoding="async" />
                  ) : (
                    <div className="flex aspect-[4/4.6] items-center justify-center text-sm text-muted-foreground">No image</div>
                  )}
                </div>
                <div className="flex flex-col gap-4">
                  <div className="flex flex-wrap items-start justify-between gap-3">
                    <div className="space-y-2">
                      <div className="text-xs uppercase tracking-[0.2em] text-muted-foreground">
                        {product.categoryName}
                      </div>
                      <h2 className="text-xl font-semibold tracking-tight">{product.name}</h2>
                      <p className="text-sm text-muted-foreground">{product.brand}</p>
                    </div>
                    <div className="text-right">
                      <div className="text-xl font-semibold">{formatCurrency(product.price)}</div>
                      <div className="text-xs text-muted-foreground">{product.inventory} available</div>
                    </div>
                  </div>

                  <div className="flex flex-wrap gap-3 text-sm text-muted-foreground">
                    <span className="rounded-full border border-border px-3 py-1.5">Size: {item.size}</span>
                    <span className="rounded-full border border-border px-3 py-1.5">Color: {item.color}</span>
                    {product.fabric ? <span className="rounded-full border border-border px-3 py-1.5">{product.fabric}</span> : null}
                  </div>

                  <div className="flex flex-wrap items-center justify-between gap-4">
                    <QuantitySelector
                      value={item.quantity}
                      onChange={(value) => updateCartItem(item.productId, { quantity: value })}
                    />
                    <Button variant="ghost" className="rounded-full px-3" onClick={() => removeFromCart(item.productId)}>
                      <Trash2Icon className="size-4" />
                      Remove
                    </Button>
                  </div>
                </div>
              </article>
            )
          })}
        </section>

        <aside className="space-y-5">
          <div className="rounded-[1.8rem] border border-white/70 bg-white/82 p-5 shadow-sm">
            <div className="space-y-4">
              <h2 className="text-xl font-semibold tracking-tight">Order summary</h2>
              <div className="grid gap-3 text-sm">
                <div className="flex items-center justify-between">
                  <span className="text-muted-foreground">Subtotal</span>
                  <span>{formatCurrency(cartSubtotal)}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-muted-foreground">Shipping</span>
                  <span>{shipping === 0 ? "Free" : formatCurrency(shipping)}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-muted-foreground">Handling</span>
                  <span>{formatCurrency(handling)}</span>
                </div>
                <div className="flex items-center justify-between border-t border-border pt-3 text-base font-semibold">
                  <span>Total</span>
                  <span>{formatCurrency(total)}</span>
                </div>
              </div>
              <Button asChild className="w-full rounded-full">
                <Link to="/checkout" state={!auth.isAuthenticated ? { from: "/checkout" } : undefined}>
                  {auth.isAuthenticated ? "Proceed to checkout" : "Sign in to checkout"}
                  <ArrowRightIcon className="size-4" />
                </Link>
              </Button>
              {!auth.isAuthenticated ? (
                <p className="text-sm leading-6 text-muted-foreground">
                  Sign in or register before checkout. Address and payment open only after account validation.
                </p>
              ) : null}
            </div>
          </div>

          <div className="rounded-[1.8rem] border border-white/70 bg-white/82 p-5 shadow-sm">
            <div className="mb-4 flex items-center gap-2">
              <ShoppingBagIcon className="size-4 text-muted-foreground" />
              <h2 className="text-lg font-semibold tracking-tight">Style add-ons</h2>
            </div>
            <div className="grid gap-4">
              {recommended.map((product) => (
                <Link key={product.id} to={`/product/${product.slug}`} className="flex gap-3 rounded-[1.4rem] border border-border/70 bg-background/70 p-3">
                  {getPrimaryProductImage(product) ? (
                    <img src={getPrimaryProductImage(product)} alt={product.name} className="size-20 rounded-2xl object-cover" loading="lazy" decoding="async" />
                  ) : (
                    <div className="flex size-20 items-center justify-center rounded-2xl bg-muted text-xs text-muted-foreground">No image</div>
                  )}
                  <div className="space-y-1">
                    <div className="font-medium">{product.name}</div>
                    <div className="text-sm text-muted-foreground">{product.categoryName}</div>
                    <div className="text-sm font-semibold">{formatCurrency(product.price)}</div>
                  </div>
                </Link>
              ))}
            </div>
          </div>
        </aside>
      </div>
    </div>
  )
}
