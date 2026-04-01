import { create } from "zustand"
import { persist } from "zustand/middleware"

import { validateCoupon } from "@/api/promotionApi"
import { addCartItem, clearCart, getCart, getCartSessionId, removeCartItem, updateCartItem } from "@/api/salesApi"
import type { Cart } from "@/types/sales"

type CartStoreState = {
  sessionId: string
  cart: Cart | null
  couponCode: string
  discountAmount: number
  shippingMethod: string
  shippingCost: number
  paymentMethod: string
  isSyncing: boolean
  error: string | null
  hydrateCart: () => Promise<void>
  addItem: (productId: number, quantity: number, productVariantId?: number | null, vendorUserId?: string | null) => Promise<void>
  removeItem: (itemId: number) => Promise<void>
  updateQty: (itemId: number, quantity: number) => Promise<void>
  clearCart: () => Promise<void>
  applyCoupon: (code: string) => Promise<{ isValid: boolean; message: string }>
  setShippingMethod: (value: string, cost: number) => void
  setPaymentMethod: (value: string) => void
  getTotal: () => number
}

export const useCartStore = create<CartStoreState>()(
  persist(
    (set, get) => ({
      sessionId: getCartSessionId(),
      cart: null,
      couponCode: "",
      discountAmount: 0,
      shippingMethod: "standard",
      shippingCost: 0,
      paymentMethod: "cod",
      isSyncing: false,
      error: null,
      hydrateCart: async () => {
        set({ isSyncing: true, error: null })

        try {
          const cart = await getCart(get().sessionId)
          set({ cart, isSyncing: false })
        } catch (caught) {
          set({ error: caught instanceof Error ? caught.message : "Unable to load cart.", isSyncing: false })
        }
      },
      addItem: async (productId, quantity, productVariantId, vendorUserId) => {
        set({ isSyncing: true, error: null })

        try {
          const cart = await addCartItem(productId, quantity, productVariantId, vendorUserId)
          set({ cart, isSyncing: false })
        } catch (caught) {
          set({ error: caught instanceof Error ? caught.message : "Unable to add item to cart.", isSyncing: false })
        }
      },
      removeItem: async (itemId) => {
        set({ isSyncing: true, error: null })

        try {
          await removeCartItem(itemId)
          const cart = await getCart(get().sessionId)
          set({ cart, isSyncing: false })
        } catch (caught) {
          set({ error: caught instanceof Error ? caught.message : "Unable to remove item.", isSyncing: false })
        }
      },
      updateQty: async (itemId, quantity) => {
        set({ isSyncing: true, error: null })

        try {
          const cart = await updateCartItem(itemId, quantity)
          set({ cart, isSyncing: false })
        } catch (caught) {
          set({ error: caught instanceof Error ? caught.message : "Unable to update quantity.", isSyncing: false })
        }
      },
      clearCart: async () => {
        set({ isSyncing: true, error: null })

        try {
          await clearCart(get().sessionId)
          set({ cart: null, couponCode: "", discountAmount: 0, shippingCost: 0, isSyncing: false })
        } catch (caught) {
          set({ error: caught instanceof Error ? caught.message : "Unable to clear cart.", isSyncing: false })
        }
      },
      applyCoupon: async (code) => {
        const amount = get().cart?.subtotal ?? 0

        try {
          const result = await validateCoupon({ code, amount })
          if (result.isValid) {
            set({ couponCode: code, discountAmount: result.discountAmount })
          }

          return { isValid: result.isValid, message: result.message }
        } catch (caught) {
          const message = caught instanceof Error ? caught.message : "Unable to validate coupon."
          set({ error: message })
          return { isValid: false, message }
        }
      },
      setShippingMethod: (value, cost) => set({ shippingMethod: value, shippingCost: cost }),
      setPaymentMethod: (value) => set({ paymentMethod: value }),
      getTotal: () => {
        const subtotal = get().cart?.subtotal ?? 0
        return Math.max(0, subtotal - get().discountAmount + get().shippingCost)
      },
    }),
    {
      name: "cxstore.cart",
      partialize: (state) => ({
        sessionId: state.sessionId,
        couponCode: state.couponCode,
        discountAmount: state.discountAmount,
        shippingMethod: state.shippingMethod,
        shippingCost: state.shippingCost,
        paymentMethod: state.paymentMethod,
      }),
    },
  ),
)
