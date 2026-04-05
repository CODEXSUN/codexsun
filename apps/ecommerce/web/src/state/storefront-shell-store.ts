import { create } from "zustand"

import type { StorefrontCategorySummary, StorefrontLandingResponse } from "@ecommerce/shared"

type StorefrontShellState = {
  landing: StorefrontLandingResponse | null
  categories: StorefrontCategorySummary[]
  isReady: boolean
  setLanding: (landing: StorefrontLandingResponse | null) => void
}

export const useStorefrontShellStore = create<StorefrontShellState>((set) => ({
  landing: null,
  categories: [],
  isReady: false,
  setLanding: (landing) =>
    set({
      landing,
      categories: landing?.categories ?? [],
      isReady: Boolean(landing),
    }),
}))
