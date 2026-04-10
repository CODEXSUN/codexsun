import type { ReactNode } from "react"

import { useStorefrontShellData } from "../hooks/use-storefront-shell-data"
import { useStorefrontShellStore } from "../state/storefront-shell-store"

export type StorefrontLayoutProps = {
  children: ReactNode
  className?: string
  showCategoryMenu?: boolean
  showFloatingContact?: boolean
  showFooter?: boolean
}

export function useStorefrontLayoutData() {
  const { data } = useStorefrontShellData()
  const fallbackCategories = useStorefrontShellStore((state) => state.categories)

  return {
    categories: data?.categories ?? fallbackCategories,
    settings: data?.settings,
  }
}
