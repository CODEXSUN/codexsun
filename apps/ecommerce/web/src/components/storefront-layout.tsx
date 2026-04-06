import { cn } from "@/lib/utils"

import { useStorefrontShellData } from "../hooks/use-storefront-shell-data"
import { useStorefrontShellStore } from "../state/storefront-shell-store"

import { StorefrontFooter } from "./storefront-footer"
import { StorefrontHeader } from "./storefront-header"

export function StorefrontLayout({
  children,
  className,
  showCategoryMenu = true,
}: {
  children: React.ReactNode
  className?: string
  showCategoryMenu?: boolean
}) {
  const { data } = useStorefrontShellData()
  const fallbackCategories = useStorefrontShellStore((state) => state.categories)
  const categories = data?.categories ?? fallbackCategories

  return (
    <div className="min-h-screen bg-[linear-gradient(180deg,#f7f1ea_0%,#f3ede6_18%,#f7f3ee_100%)] text-foreground">
      <StorefrontHeader categories={categories} showCategoryMenu={showCategoryMenu} />
      <main className={cn("pb-16", className)}>{children}</main>
      <StorefrontFooter />
    </div>
  )
}
