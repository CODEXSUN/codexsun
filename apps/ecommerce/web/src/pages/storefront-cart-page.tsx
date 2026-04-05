import { Trash2 } from "lucide-react"
import { Link } from "react-router-dom"

import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { CommercePrice } from "@/components/ux/commerce-price"
import { CommerceQuantityStepper } from "@/components/ux/commerce-quantity-stepper"

import { useStorefrontCart } from "../cart/storefront-cart"
import { StorefrontLayout } from "../components/storefront-layout"
import { storefrontPaths } from "../lib/storefront-routes"

export function StorefrontCartPage() {
  const cart = useStorefrontCart()

  return (
    <StorefrontLayout>
      <div className="mx-auto grid w-full max-w-7xl gap-8 px-5 pt-8 lg:grid-cols-[1.1fr_0.9fr] lg:px-8">
        <div className="space-y-6">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.22em] text-muted-foreground">
              Cart
            </p>
            <h1 className="mt-2 font-heading text-4xl font-semibold tracking-tight">
              Review your bag
            </h1>
            <p className="mt-3 max-w-2xl text-sm leading-7 text-muted-foreground">
              Adjust quantities, review totals, and move to checkout when you are ready.
            </p>
          </div>
          {cart.items.length === 0 ? (
            <Card className="rounded-[1.8rem] border-dashed border-border/70 py-0 shadow-sm">
              <CardContent className="grid gap-4 p-6">
                <p className="text-sm text-muted-foreground">
                  Your cart is empty. Start with the live catalog sourced from core products.
                </p>
                <div>
                  <Button asChild className="rounded-full">
                    <Link to={storefrontPaths.catalog()}>Browse catalog</Link>
                  </Button>
                </div>
              </CardContent>
            </Card>
          ) : (
            <div className="grid gap-4">
              {cart.items.map((item) => (
                <Card
                  key={item.productId}
                  className="rounded-[1.8rem] border-border/70 py-0 shadow-sm"
                >
                  <CardContent className="flex flex-col gap-4 p-5 sm:flex-row">
                    <img
                      src={
                        item.imageUrl ??
                        "https://placehold.co/400x500/e8ddd1/2d211b?text=Cart"
                      }
                      alt={item.name}
                      className="h-28 w-24 rounded-[1.4rem] object-cover"
                    />
                    <div className="min-w-0 flex-1 space-y-4">
                      <div className="space-y-1">
                        <Link
                          to={storefrontPaths.product(item.slug)}
                          className="line-clamp-2 font-medium text-foreground transition hover:text-primary"
                        >
                          {item.name}
                        </Link>
                        <CommercePrice
                          amount={item.unitPrice}
                          compareAtAmount={item.mrp}
                        />
                      </div>
                      <div className="flex flex-wrap items-center justify-between gap-3">
                        <CommerceQuantityStepper
                          value={item.quantity}
                          onChange={(value) =>
                            cart.updateQuantity(item.productId, value)
                          }
                        />
                        <div className="flex items-center gap-3">
                          <CommercePrice
                            amount={item.unitPrice * item.quantity}
                            compareAtAmount={item.mrp * item.quantity}
                          />
                          <Button
                            type="button"
                            variant="ghost"
                            size="icon"
                            className="rounded-full"
                            onClick={() => cart.removeItem(item.productId)}
                          >
                            <Trash2 className="size-4" />
                          </Button>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </div>
        <div className="space-y-6">
          <Card className="rounded-[1.8rem] border-border/70 py-0 shadow-sm">
            <CardHeader>
              <CardTitle>Summary</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between text-sm">
                <span className="text-muted-foreground">Items</span>
                <span className="font-medium">{cart.itemCount}</span>
              </div>
              <div className="flex items-center justify-between text-sm">
                <span className="text-muted-foreground">Subtotal</span>
                <CommercePrice amount={cart.subtotalAmount} />
              </div>
              <div className="rounded-[1.4rem] border border-border/70 bg-background/80 p-4 text-sm text-muted-foreground">
                Shipping and final taxes are calculated during checkout.
              </div>
              <Button
                asChild
                className="w-full rounded-full"
                size="lg"
                disabled={cart.items.length === 0}
              >
                <Link to={storefrontPaths.checkout()}>Proceed to checkout</Link>
              </Button>
              <Button asChild variant="outline" className="w-full rounded-full">
                <Link to={storefrontPaths.catalog()}>Continue shopping</Link>
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    </StorefrontLayout>
  )
}
