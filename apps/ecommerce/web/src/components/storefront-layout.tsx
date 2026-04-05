import { cn } from "@/lib/utils"

import { StorefrontFooter } from "./storefront-footer"
import { StorefrontHeader } from "./storefront-header"

export function StorefrontLayout({
  children,
  className,
}: {
  children: React.ReactNode
  className?: string
}) {
  return (
    <div className="min-h-screen bg-[linear-gradient(180deg,#f7f1ea_0%,#f3ede6_18%,#f7f3ee_100%)] text-foreground">
      <StorefrontHeader />
      <main className={cn("pb-16", className)}>{children}</main>
      <StorefrontFooter />
    </div>
  )
}
