import { useEffect, useMemo, useState } from "react";
import { MinusIcon, PlusIcon, Trash2Icon } from "lucide-react";
import { BackToTopButton, StoreFooter } from "./storefront.components";
import {
  clearStorefrontCart,
  removeStorefrontCartItem,
  updateStorefrontCartQuantity,
  useStorefrontCart
} from "./storefront.cart";
import { money, whatsappLink } from "./storefront.formatters";
import { StoreHeader } from "./storefront.navigation";
import { setStorefrontSeo } from "./storefront.seo";
import {
  getStorefrontAnnouncement,
  getStorefrontBranding,
  getStorefrontDiscovery,
  getStorefrontSiteNavigation
} from "./storefront.services";
import type {
  StorefrontAnnouncement,
  StorefrontBranding,
  StorefrontDiscovery,
  StorefrontFilters,
  StorefrontSiteNavigation
} from "./storefront.types";

const emptyDiscovery: StorefrontDiscovery = {
  brands: [],
  categories: [],
  priceRange: { maximum: 0, minimum: 0 }
};
const cartFilters: StorefrontFilters = {
  brand: "",
  category: "",
  maxPrice: null,
  minPrice: null,
  scope: "all",
  search: "",
  sort: "featured"
};

export function StorefrontCartPage() {
  const items = useStorefrontCart();
  const [discovery, setDiscovery] = useState(emptyDiscovery);
  const [branding, setBranding] = useState<StorefrontBranding | null>(null);
  const [announcement, setAnnouncement] = useState<StorefrontAnnouncement | null>(null);
  const [navigation, setNavigation] = useState<StorefrontSiteNavigation | null>(null);

  useEffect(() => {
    getStorefrontDiscovery().then(setDiscovery);
    getStorefrontBranding().then(setBranding);
    getStorefrontAnnouncement().then(setAnnouncement);
    getStorefrontSiteNavigation().then(setNavigation);
  }, []);
  useEffect(() => {
    setStorefrontSeo({
      description: "Review products saved in your Tech Media shopping cart.",
      path: "/cart",
      robots: "noindex,follow",
      title: "Shopping Cart | Tech Media"
    });
  }, []);

  const total = useMemo(
    () => items.reduce((sum, item) => sum + item.price * item.quantity, 0),
    [items]
  );
  const orderLink = whatsappLink(
    `Hello${branding?.brandName ? ` ${branding.brandName}` : ""}, I would like to order: ${items
      .map((item) => `${item.name} x ${item.quantity}`)
      .join(", ")}. Cart total: ${money(total)}.`,
    branding?.primaryPhone
  );

  return (
    <div className="cx-store">
      <StoreHeader
        announcement={announcement}
        branding={branding}
        discovery={discovery}
        filters={cartFilters}
      />
      <main className="cx-cart">
        <header className="cx-cart__heading">
          <div>
            <span>Your selection</span>
            <h1>Shopping cart</h1>
          </div>
          {items.length ? (
            <button onClick={clearStorefrontCart} type="button">
              Clear cart
            </button>
          ) : null}
        </header>
        {items.length ? (
          <div className="cx-cart__layout">
            <section aria-label="Cart items" className="cx-cart__items">
              {items.map((item) => (
                <article className="cx-cart__item" key={item.slug}>
                  <a href={`/shop/product/${item.slug}`}>
                    <img alt={item.imageAlt} src={item.imageUrl} />
                  </a>
                  <div className="cx-cart__item-copy">
                    <a href={`/shop/product/${item.slug}`}>
                      <strong>{item.name}</strong>
                    </a>
                    <span>{money(item.price)} each</span>
                    <div className="cx-cart__quantity" aria-label={`Quantity for ${item.name}`}>
                      <button
                        aria-label={`Decrease ${item.name} quantity`}
                        disabled={item.quantity === 1}
                        onClick={() => updateStorefrontCartQuantity(item.slug, item.quantity - 1)}
                        type="button"
                      >
                        <MinusIcon />
                      </button>
                      <span aria-live="polite">{item.quantity}</span>
                      <button
                        aria-label={`Increase ${item.name} quantity`}
                        onClick={() => updateStorefrontCartQuantity(item.slug, item.quantity + 1)}
                        type="button"
                      >
                        <PlusIcon />
                      </button>
                    </div>
                  </div>
                  <div className="cx-cart__item-total">
                    <strong>{money(item.price * item.quantity)}</strong>
                    <button
                      aria-label={`Remove ${item.name} from cart`}
                      onClick={() => removeStorefrontCartItem(item.slug)}
                      type="button"
                    >
                      <Trash2Icon /> Remove
                    </button>
                  </div>
                </article>
              ))}
            </section>
            <aside className="cx-cart__summary">
              <span>Order summary</span>
              <div>
                <span>Subtotal</span>
                <strong>{money(total)}</strong>
              </div>
              <p>Taxes and delivery are confirmed before the order is placed.</p>
              <a href={orderLink} rel="noreferrer" target="_blank">
                Request order on WhatsApp
              </a>
              <a href="/shop">Continue shopping</a>
            </aside>
          </div>
        ) : (
          <section className="cx-cart__empty">
            <h2>Your cart is empty</h2>
            <p>
              Explore computers and accessories, then add the products you want to compare or order.
            </p>
            <a href="/shop">Browse the catalog</a>
          </section>
        )}
      </main>
      <BackToTopButton />
      <StoreFooter branding={branding} navigation={navigation} />
    </div>
  );
}
