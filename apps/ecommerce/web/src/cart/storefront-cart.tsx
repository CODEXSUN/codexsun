import { createContext, useContext, useMemo, useState } from "react"

import { resolveStorefrontImageUrl } from "../lib/storefront-image"

type StorefrontCartItem = {
  productId: string
  slug: string
  name: string
  imageUrl: string | null
  quantity: number
  unitPrice: number
  mrp: number
}

type StorefrontCartContextValue = {
  items: StorefrontCartItem[]
  itemCount: number
  subtotalAmount: number
  addItem: (item: Omit<StorefrontCartItem, "quantity">, quantity?: number) => void
  updateQuantity: (productId: string, quantity: number) => void
  removeItem: (productId: string) => void
  clear: () => void
}

const StorefrontCartContext = createContext<StorefrontCartContextValue | null>(null)
const cartStorageKey = "codexsun.storefront.cart"

function normalizeCartItem(item: StorefrontCartItem): StorefrontCartItem {
  return {
    ...item,
    imageUrl: item.imageUrl ? resolveStorefrontImageUrl(item.imageUrl, item.name) : null,
  }
}

function readStoredCart() {
  if (typeof window === "undefined") {
    return [] as StorefrontCartItem[]
  }

  const rawValue = window.localStorage.getItem(cartStorageKey)

  if (!rawValue) {
    return [] as StorefrontCartItem[]
  }

  try {
    return (JSON.parse(rawValue) as StorefrontCartItem[]).map(normalizeCartItem)
  } catch {
    window.localStorage.removeItem(cartStorageKey)
    return [] as StorefrontCartItem[]
  }
}

function writeStoredCart(items: StorefrontCartItem[]) {
  if (typeof window === "undefined") {
    return
  }

  window.localStorage.setItem(
    cartStorageKey,
    JSON.stringify(items.map(normalizeCartItem))
  )
}

export function StorefrontCartProvider({
  children,
}: {
  children: React.ReactNode
}) {
  const [items, setItems] = useState<StorefrontCartItem[]>(() => readStoredCart())

  const value = useMemo<StorefrontCartContextValue>(() => {
    const setAndPersist = (nextItems: StorefrontCartItem[]) => {
      setItems(nextItems)
      writeStoredCart(nextItems)
    }

    return {
      items,
      itemCount: items.reduce((sum, item) => sum + item.quantity, 0),
      subtotalAmount: items.reduce(
        (sum, item) => sum + item.unitPrice * item.quantity,
        0
      ),
      addItem: (item, quantity = 1) => {
        const existing = items.find((entry) => entry.productId === item.productId)

        if (existing) {
          setAndPersist(
            items.map((entry) =>
              entry.productId === item.productId
                ? { ...entry, quantity: Math.min(20, entry.quantity + quantity) }
                : entry
            )
          )
          return
        }

        setAndPersist([
          ...items,
          normalizeCartItem({
            ...item,
            quantity,
          }),
        ])
      },
      updateQuantity: (productId, quantity) => {
        const nextItems =
          quantity <= 0
            ? items.filter((item) => item.productId !== productId)
            : items.map((item) =>
                item.productId === productId
                  ? { ...item, quantity: Math.min(20, Math.max(1, quantity)) }
                  : item
              )

        setAndPersist(nextItems)
      },
      removeItem: (productId) => {
        setAndPersist(items.filter((item) => item.productId !== productId))
      },
      clear: () => {
        setAndPersist([])
      },
    }
  }, [items])

  return (
    <StorefrontCartContext.Provider value={value}>
      {children}
    </StorefrontCartContext.Provider>
  )
}

export function useStorefrontCart() {
  const value = useContext(StorefrontCartContext)

  if (!value) {
    throw new Error("useStorefrontCart must be used within StorefrontCartProvider.")
  }

  return value
}
