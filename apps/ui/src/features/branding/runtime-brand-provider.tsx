"use client"

import * as React from "react"

import type { CompanyBrandProfile } from "@cxapp/shared"

type RuntimeBrandContextValue = {
  brand: CompanyBrandProfile | null
}

const RuntimeBrandContext = React.createContext<RuntimeBrandContextValue>({
  brand: null,
})

export function RuntimeBrandProvider({
  children,
}: React.PropsWithChildren) {
  const [brand, setBrand] = React.useState<CompanyBrandProfile | null>(null)

  React.useEffect(() => {
    let cancelled = false

    async function loadBrandProfile() {
      try {
        const response = await fetch("/public/v1/brand-profile")
        if (!response.ok) {
          return
        }

        const payload = (await response.json()) as { item?: CompanyBrandProfile }
        if (!cancelled) {
          setBrand(payload.item ?? null)
        }
      } catch {
        if (!cancelled) {
          setBrand(null)
        }
      }
    }

    void loadBrandProfile()

    return () => {
      cancelled = true
    }
  }, [])

  return (
    <RuntimeBrandContext.Provider value={{ brand }}>
      {children}
    </RuntimeBrandContext.Provider>
  )
}

export function useRuntimeBrand() {
  return React.useContext(RuntimeBrandContext)
}
