"use client"

import * as React from "react"

import type { CompanyBrandProfile } from "@cxapp/shared"
import { useRuntimeBrandQuery } from "@cxapp/web/src/query/runtime-queries"
import { fallbackRuntimeBrandProfile } from "./runtime-brand-default"

type RuntimeBrandContextValue = {
  brand: CompanyBrandProfile
}

const RuntimeBrandContext = React.createContext<RuntimeBrandContextValue>({
  brand: fallbackRuntimeBrandProfile,
})

export function RuntimeBrandProvider({
  children,
}: React.PropsWithChildren) {
  const { data: brand } = useRuntimeBrandQuery()

  return (
    <RuntimeBrandContext.Provider
      value={{ brand: brand ?? fallbackRuntimeBrandProfile }}
    >
      {children}
    </RuntimeBrandContext.Provider>
  )
}

// eslint-disable-next-line react-refresh/only-export-components
export function useRuntimeBrand() {
  return React.useContext(RuntimeBrandContext)
}
