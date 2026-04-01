import { Outlet } from "react-router-dom"

import { StorefrontCategories } from "./storefront-categories"
import { StorefrontFooter } from "./storefront-footer"
import { StorefrontHeader } from "./storefront-header"
import { StorefrontBottomNav } from "./storefront-bottom-nav"
import { StorefrontScrollManager } from "./storefront-scroll-manager"
import { useStorefront } from "@/features/store/context/storefront-context"

export default function MainLayout() {
  const { categories } = useStorefront()
  const topMenuCategories = categories.filter((category) => category.showInTopMenu)

  return (
    <div className="min-h-screen bg-[radial-gradient(circle_at_top,#f6efe6,transparent_30%),linear-gradient(180deg,#fcfbf8_0%,#f5efe7_100%)] text-foreground">
      <StorefrontScrollManager />
      <StorefrontHeader />
      <StorefrontCategories className="lg:pt-4" />
      <main className="pb-[calc(7rem+env(safe-area-inset-bottom))] md:pb-0">
        <Outlet />
      </main>
      <StorefrontFooter />
      <StorefrontBottomNav
        categories={topMenuCategories.map((category) => ({
          label: category.name,
          slug: category.slug,
        }))}
      />
    </div>
  )
}
