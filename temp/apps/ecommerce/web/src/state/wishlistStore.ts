import { create } from "zustand"

import { addWishlistItem, clearWishlist as clearWishlistRequest, getWishlist, removeWishlistItem } from "@/api/wishlistApi"
import type { WishlistItem } from "@/types/storefront"

type WishlistStoreState = {
  items: WishlistItem[]
  isSyncing: boolean
  error: string | null
  hydrateWishlist: () => Promise<void>
  addItem: (productId: number) => Promise<void>
  removeItem: (productId: number) => Promise<void>
  toggleItem: (productId: number) => Promise<void>
  clearWishlist: () => Promise<void>
  isInWishlist: (productId: number) => boolean
  reset: () => void
}

const initialState = {
  items: [] as WishlistItem[],
  isSyncing: false,
  error: null as string | null,
}

export const useWishlistStore = create<WishlistStoreState>()((set, get) => ({
  ...initialState,
  hydrateWishlist: async () => {
    set({ isSyncing: true, error: null })

    try {
      const items = await getWishlist()
      set({ items, isSyncing: false })
    } catch (caught) {
      set({ items: [], error: caught instanceof Error ? caught.message : "Unable to load wishlist.", isSyncing: false })
    }
  },
  addItem: async (productId) => {
    set({ isSyncing: true, error: null })

    try {
      const items = await addWishlistItem(productId)
      set({ items, isSyncing: false })
    } catch (caught) {
      set({ error: caught instanceof Error ? caught.message : "Unable to add wishlist item.", isSyncing: false })
    }
  },
  removeItem: async (productId) => {
    set({ isSyncing: true, error: null })

    try {
      await removeWishlistItem(productId)
      set((state) => ({ items: state.items.filter((item) => item.productId !== productId), isSyncing: false }))
    } catch (caught) {
      set({ error: caught instanceof Error ? caught.message : "Unable to remove wishlist item.", isSyncing: false })
    }
  },
  toggleItem: async (productId) => {
    if (get().isInWishlist(productId)) {
      await get().removeItem(productId)
      return
    }

    await get().addItem(productId)
  },
  clearWishlist: async () => {
    set({ isSyncing: true, error: null })

    try {
      await clearWishlistRequest()
      set({ items: [], isSyncing: false })
    } catch (caught) {
      set({ error: caught instanceof Error ? caught.message : "Unable to clear wishlist.", isSyncing: false })
    }
  },
  isInWishlist: (productId) => get().items.some((item) => item.productId === productId),
  reset: () => set(initialState),
}))

export function resetWishlistStore() {
  useWishlistStore.getState().reset()
}
