import { createContext, useContext, useEffect, useMemo, useState } from 'react'
import type { ReactNode } from 'react'

import { getStorefrontCatalog } from '@/shared/api/client'
import { showSuccessToast } from '@/shared/notifications/toast'
import { getCartSubtotal } from '@/features/store/lib/storefront-utils'
import type {
  StorefrontBrand,
  StorefrontCartItem,
  StorefrontCategory,
  StorefrontProduct,
  StorefrontReview,
} from '@/features/store/types/storefront'

type StorefrontContextValue = {
  brands: StorefrontBrand[]
  categories: StorefrontCategory[]
  products: StorefrontProduct[]
  reviews: StorefrontReview[]
  cartItems: StorefrontCartItem[]
  wishlistProductIds: string[]
  cartCount: number
  cartSubtotal: number
  isLoading: boolean
  errorMessage: string | null
  addToCart: (
    productId: string,
    quantity: number,
    size?: string,
    color?: string,
    options?: { toast?: boolean },
  ) => void
  updateCartItem: (productId: string, next: Partial<StorefrontCartItem>) => void
  removeFromCart: (productId: string) => void
  toggleWishlist: (productId: string) => void
  isInWishlist: (productId: string) => boolean
  addReview: (productId: string, payload: { rating: number; title: string; review: string }) => void
  clearCart: () => void
}

const StorefrontContext = createContext<StorefrontContextValue | null>(null)
const cartStorageKey = 'codexsun-storefront-cart'
const wishlistStorageKey = 'codexsun-storefront-wishlist'

function readStoredJson<T>(key: string, fallback: T) {
  if (typeof window === 'undefined') return fallback

  try {
    const value = window.localStorage.getItem(key)
    return value ? (JSON.parse(value) as T) : fallback
  } catch {
    return fallback
  }
}

export function StorefrontProvider({ children }: { children: ReactNode }) {
  const [brands, setBrands] = useState<StorefrontBrand[]>([])
  const [categories, setCategories] = useState<StorefrontCategory[]>([])
  const [products, setProducts] = useState<StorefrontProduct[]>([])
  const [reviews, setReviews] = useState<StorefrontReview[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [errorMessage, setErrorMessage] = useState<string | null>(null)
  const [cartItems, setCartItems] = useState<StorefrontCartItem[]>(() =>
    readStoredJson(cartStorageKey, []),
  )
  const [wishlistProductIds, setWishlistProductIds] = useState<string[]>(() =>
    readStoredJson(wishlistStorageKey, []),
  )

  useEffect(() => {
    let cancelled = false

    async function loadCatalog() {
      setIsLoading(true)
      setErrorMessage(null)

      try {
        const catalog = await getStorefrontCatalog()
        if (cancelled) {
          return
        }

        setBrands(catalog.brands)
        setCategories(catalog.categories)
        setProducts(catalog.products)
        setReviews(catalog.reviews)
      } catch (error) {
        if (!cancelled) {
          setErrorMessage(error instanceof Error ? error.message : 'Failed to load storefront catalog.')
        }
      } finally {
        if (!cancelled) {
          setIsLoading(false)
        }
      }
    }

    void loadCatalog()
    return () => {
      cancelled = true
    }
  }, [])

  useEffect(() => {
    window.localStorage.setItem(cartStorageKey, JSON.stringify(cartItems))
  }, [cartItems])

  useEffect(() => {
    window.localStorage.setItem(wishlistStorageKey, JSON.stringify(wishlistProductIds))
  }, [wishlistProductIds])

  useEffect(() => {
    if (products.length === 0) {
      return
    }

    const validProductIds = new Set(products.map((product) => product.id))

    setWishlistProductIds((current) => {
      const next = [...new Set(current.filter((productId) => validProductIds.has(productId)))]
      return next.length === current.length && next.every((productId, index) => productId === current[index])
        ? current
        : next
    })

    setCartItems((current) => {
      const next = current.filter((item) => validProductIds.has(item.productId))
      return next.length === current.length
        ? current
        : next
    })
  }, [products])

  const value = useMemo<StorefrontContextValue>(() => {
    const cartCount = cartItems.reduce((total, item) => total + item.quantity, 0)
    const cartSubtotal = getCartSubtotal(products, cartItems)

    return {
      brands,
      categories,
      products,
      reviews,
      cartItems,
      wishlistProductIds,
      cartCount,
      cartSubtotal,
      isLoading,
      errorMessage,
      addToCart: (productId, quantity, size, color, options) => {
        const product = products.find((entry) => entry.id === productId)
        if (!product) return

        const resolvedSize = size ?? product.sizes[0] ?? 'Default'
        const resolvedColor = color ?? product.colors[0]?.name ?? 'Default'

        setCartItems((current) => {
          const existing = current.find(
            (item) =>
              item.productId === productId &&
              item.size === resolvedSize &&
              item.color === resolvedColor,
          )

          if (!existing) {
            return [...current, { productId, quantity, size: resolvedSize, color: resolvedColor }]
          }

          return current.map((item) =>
            item === existing ? { ...item, quantity: item.quantity + quantity } : item,
          )
        })

        if (options?.toast !== false) {
          const variantSummary =
            resolvedSize !== 'Default' || resolvedColor !== 'Default'
              ? ` (${resolvedSize}, ${resolvedColor})`
              : ''

          showSuccessToast({
            title: 'Added to cart',
            description: `${product.name}${variantSummary} x${quantity} added to your cart.`,
          })
        }
      },
      updateCartItem: (productId, next) => {
        setCartItems((current) =>
          current.map((item) =>
            item.productId === productId
              ? { ...item, ...next, quantity: Math.max(1, next.quantity ?? item.quantity) }
              : item,
          ),
        )
      },
      removeFromCart: (productId) => {
        setCartItems((current) => current.filter((item) => item.productId !== productId))
      },
      toggleWishlist: (productId) => {
        setWishlistProductIds((current) =>
          current.includes(productId)
            ? current.filter((entry) => entry !== productId)
            : [...current, productId],
        )
      },
      isInWishlist: (productId) => wishlistProductIds.includes(productId),
      addReview: (productId, payload) => {
        setReviews((current) => [
          {
            id: `review-local-${current.length + 1}`,
            productId,
            username: 'Guest Shopper',
            rating: payload.rating,
            title: payload.title || null,
            review: payload.review || null,
            createdAt: new Date().toISOString(),
            verifiedPurchase: false,
          },
          ...current,
        ])
      },
      clearCart: () => setCartItems([]),
    }
  }, [brands, cartItems, categories, errorMessage, isLoading, products, reviews, wishlistProductIds])

  return <StorefrontContext.Provider value={value}>{children}</StorefrontContext.Provider>
}

export function useStorefront() {
  const context = useContext(StorefrontContext)

  if (!context) {
    throw new Error('useStorefront must be used within StorefrontProvider.')
  }

  return context
}
