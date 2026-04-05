"use client"

import * as React from "react"

import type { CompanyBrandProfile } from "@cxapp/shared"
import { useRuntimeBrandQuery } from "@cxapp/web/src/query/runtime-queries"

type RuntimeBrandContextValue = {
  brand: CompanyBrandProfile | null
}

const RuntimeBrandContext = React.createContext<RuntimeBrandContextValue>({
  brand: null,
})

export function RuntimeBrandProvider({
  children,
}: React.PropsWithChildren) {
  const { data: brand } = useRuntimeBrandQuery()

  return (
    <RuntimeBrandContext.Provider value={{ brand: brand ?? null }}>
      {children}
    </RuntimeBrandContext.Provider>
  )
}

export function useRuntimeBrand() {
  return React.useContext(RuntimeBrandContext)
}
