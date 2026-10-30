import { useEffect, useState } from "react";
import type { StorefrontProduct } from "./storefront.types";

export type StorefrontCartItem = Pick<
  StorefrontProduct,
  "imageAlt" | "imageUrl" | "name" | "price" | "slug"
> & { quantity: number };

const cartKey = "codexsun.storefront.cart";
const cartChangedEvent = "codexsun:storefront-cart-changed";

export function addStorefrontCartItem(product: StorefrontProduct) {
  const items = readStorefrontCart();
  const existing = items.find((item) => item.slug === product.slug);
  if (existing) existing.quantity += 1;
  else {
    items.push({
      imageAlt: product.imageAlt,
      imageUrl: product.imageUrl,
      name: product.name,
      price: product.price,
      quantity: 1,
      slug: product.slug
    });
  }
  writeStorefrontCart(items);
}

export function updateStorefrontCartQuantity(slug: string, quantity: number) {
  const items = readStorefrontCart().map((item) =>
    item.slug === slug ? { ...item, quantity: Math.max(1, quantity) } : item
  );
  writeStorefrontCart(items);
}

export function removeStorefrontCartItem(slug: string) {
  writeStorefrontCart(readStorefrontCart().filter((item) => item.slug !== slug));
}

export function clearStorefrontCart() {
  writeStorefrontCart([]);
}

export function useStorefrontCart() {
  const [items, setItems] = useState(readStorefrontCart);
  useEffect(() => subscribeToCart(() => setItems(readStorefrontCart())), []);
  return items;
}

export function useStorefrontCartCount() {
  return useStorefrontCart().reduce((total, item) => total + item.quantity, 0);
}

function subscribeToCart(update: () => void) {
  window.addEventListener(cartChangedEvent, update);
  window.addEventListener("storage", update);
  return () => {
    window.removeEventListener(cartChangedEvent, update);
    window.removeEventListener("storage", update);
  };
}

function readStorefrontCart(): StorefrontCartItem[] {
  if (typeof window === "undefined") return [];
  try {
    const value: unknown = JSON.parse(window.localStorage.getItem(cartKey) ?? "[]");
    if (!Array.isArray(value)) return [];
    return value.filter(isCartItem);
  } catch {
    return [];
  }
}

function writeStorefrontCart(items: StorefrontCartItem[]) {
  window.localStorage.setItem(cartKey, JSON.stringify(items));
  window.dispatchEvent(new CustomEvent(cartChangedEvent));
}

function isCartItem(value: unknown): value is StorefrontCartItem {
  if (!value || typeof value !== "object") return false;
  const item = value as Partial<StorefrontCartItem>;
  return (
    typeof item.slug === "string" &&
    typeof item.name === "string" &&
    typeof item.imageUrl === "string" &&
    typeof item.imageAlt === "string" &&
    typeof item.price === "number" &&
    typeof item.quantity === "number" &&
    item.quantity > 0
  );
}
