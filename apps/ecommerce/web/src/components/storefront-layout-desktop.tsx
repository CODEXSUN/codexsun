import { FloatingContactButton } from "@/components/blocks/floating-contact-button"
import { cn } from "@/lib/utils"

import type { StorefrontLayoutProps } from "./storefront-layout-shared"
import { useStorefrontLayoutData } from "./storefront-layout-shared"
import { StorefrontFooter } from "./storefront-footer"
import { StorefrontHeader } from "./storefront-header"
import { StorefrontTechnicalNameBadge } from "./storefront-technical-name-badge"

export function StorefrontLayoutDesktop({
  children,
  className,
  showCategoryMenu = true,
  showFloatingContact = true,
  showFooter = true,
}: StorefrontLayoutProps) {
  const { categories, settings } = useStorefrontLayoutData()

  return (
    <div
      className="relative min-h-screen bg-[linear-gradient(180deg,#f7f1ea_0%,#f3ede6_18%,#f7f3ee_100%)] text-foreground"
      data-technical-name="shell.storefront.layout"
      data-shell-mode="desktop"
    >
      <a
        href="#storefront-main-content"
        className="sr-only z-[120] rounded-full bg-[#221812] px-4 py-2 text-sm font-medium text-white focus:not-sr-only focus:fixed focus:top-4 focus:left-4"
      >
        Skip to main content
      </a>
      <StorefrontTechnicalNameBadge
        name="shell.storefront.layout"
        className={cn(
          "left-4 right-auto z-[55]",
          showCategoryMenu ? "top-[10.5rem]" : "top-[5.5rem]"
        )}
      />
      <StorefrontHeader categories={categories} showCategoryMenu={showCategoryMenu} />
      <main
        id="storefront-main-content"
        tabIndex={-1}
        className={cn(
          "overflow-x-clip pb-16",
          showCategoryMenu ? "pt-[13rem] lg:pt-[16rem]" : "pt-[6rem] lg:pt-[6.5rem]",
          className
        )}
      >
        {children}
      </main>
      {showFooter ? <StorefrontFooter /> : null}
      {showFloatingContact ? (
        <FloatingContactButton
          contact={{
            email: settings?.supportEmail ?? null,
            phone: settings?.supportPhone ?? null,
          }}
          config={settings?.floatingContact}
        />
      ) : null}
    </div>
  )
}
