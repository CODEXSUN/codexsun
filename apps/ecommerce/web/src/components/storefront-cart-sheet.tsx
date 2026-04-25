import { ShoppingBag, Trash2 } from "lucide-react"
import { Link } from "react-router-dom"

import { Button } from "@/components/ui/button"
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet"
import { CommercePrice } from "@/components/ux/commerce-price"
import { CommerceQuantityStepper } from "@/components/ux/commerce-quantity-stepper"

import { useStorefrontCart } from "../cart/storefront-cart"
import {
  handleStorefrontImageError,
  resolveStorefrontImageUrl,
} from "../lib/storefront-image"
import { storefrontPaths } from "../lib/storefront-routes"

export function StorefrontCartSheet() {
  const cart = useStorefrontCart()

  return (
    <Sheet>
      <SheetTrigger
        render={<Button variant="outline" className="gap-2 rounded-full" />}
      >
        <ShoppingBag className="size-4" />
        Cart
        <span className="rounded-full bg-primary px-2 py-0.5 text-xs text-primary-foreground">
          {cart.itemCount}
        </span>
      </SheetTrigger>
      <SheetContent className="w-full max-w-lg gap-0 overflow-hidden p-0 sm:max-w-lg">
        <SheetHeader className="border-b border-border/60 px-6 py-5">
          <SheetTitle className="font-heading text-2xl font-semibold tracking-tight">
            Your cart
          </SheetTitle>
          <SheetDescription>
            Review items before you move to secure checkout.
          </SheetDescription>
        </SheetHeader>
        <div className="flex h-full flex-col">
          <div className="flex-1 space-y-4 overflow-y-auto px-6 py-5 [scrollbar-width:none] [-ms-overflow-style:none] [&::-webkit-scrollbar]:hidden">
            {cart.items.length === 0 ? (
              <div className="rounded-[1.5rem] border border-dashed border-border/70 bg-muted/20 p-6 text-sm text-muted-foreground">
                Your cart is empty. Add a few products from the catalog to start checkout.
              </div>
            ) : (
              cart.items.map((item) => (
                <div
                  key={item.productId}
                  className="grid gap-4 rounded-[1.4rem] border border-border/70 bg-card/90 p-4"
                >
                  <div className="flex gap-4">
                    <img
                      src={resolveStorefrontImageUrl(item.imageUrl, item.name)}
                      alt={item.name}
                      className="h-24 w-20 rounded-2xl object-cover"
                      onError={(event) => handleStorefrontImageError(event, item.name)}
                    />
                    <div className="min-w-0 flex-1 space-y-3">
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
                      <div className="flex items-center justify-between gap-3">
                        <CommerceQuantityStepper
                          value={item.quantity}
                          onChange={(value) =>
                            cart.updateQuantity(item.productId, value)
                          }
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
                </div>
              ))
            )}
          </div>
          <div className="border-t border-border/60 bg-background/95 px-6 py-5">
            <div className="flex items-center justify-between text-sm text-muted-foreground">
              <span>Subtotal</span>
              <span className="font-medium text-foreground">
                <CommercePrice amount={cart.subtotalAmount} />
              </span>
            </div>
            <div className="mt-4 grid gap-2">
              <Button asChild variant="outline" className="w-full rounded-full">
                <Link to={storefrontPaths.cart()}>Open cart</Link>
              </Button>
              <Button asChild className="w-full rounded-full" disabled={cart.items.length === 0}>
                <Link to={storefrontPaths.checkout()}>Continue to checkout</Link>
              </Button>
            </div>
          </div>
        </div>
      </SheetContent>
    </Sheet>
  )
}
