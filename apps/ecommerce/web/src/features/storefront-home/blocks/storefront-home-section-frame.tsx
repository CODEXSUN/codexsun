import type { ReactNode } from "react"

import { cn } from "@/lib/utils"

export const storefrontHomeSectionFrameClassName = "container mx-auto min-w-0 w-full"

export function StorefrontHomeSectionFrame({
  children,
  className,
}: {
  children: ReactNode
  className?: string
}) {
  return <div className={cn(storefrontHomeSectionFrameClassName, className)}>{children}</div>
}
