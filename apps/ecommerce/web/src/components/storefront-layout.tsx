import { FloatingContactButton } from "@/components/blocks/floating-contact-button"
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
  const settings = data?.settings

  return (
    <div className="min-h-screen bg-[linear-gradient(180deg,#f7f1ea_0%,#f3ede6_18%,#f7f3ee_100%)] text-foreground">
      <a
        href="#storefront-main-content"
        className="sr-only z-[120] rounded-full bg-[#221812] px-4 py-2 text-sm font-medium text-white focus:not-sr-only focus:fixed focus:top-4 focus:left-4"
      >
        Skip to main content
      </a>
      <StorefrontHeader categories={categories} showCategoryMenu={showCategoryMenu} />
      <main
        id="storefront-main-content"
        tabIndex={-1}
        className={cn(
          "overflow-x-clip pb-28 lg:pb-16",
          showCategoryMenu
            ? "pt-[5.75rem] md:pt-[13rem] lg:pt-[16rem]"
            : "pt-[5.75rem] md:pt-[6rem] lg:pt-[6.5rem]",
          className
        )}
      >
        {children}
      </main>
      <StorefrontFooter />
      <FloatingContactButton
        contact={{
          email: settings?.supportEmail ?? null,
          phone: settings?.supportPhone ?? null,
        }}
        config={settings?.floatingContact}
      />
    </div>
  )
}
