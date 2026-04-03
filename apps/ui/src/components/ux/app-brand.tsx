import { Link } from "react-router-dom"

import { useRuntimeBrand } from "@/features/branding/runtime-brand-provider"
import { cn } from "@/lib/utils"

type AppBrandProps = {
  compact?: boolean
  href?: string
  className?: string
}

export function AppBrand({
  compact = false,
  href = "/",
  className,
}: AppBrandProps) {
  const { brand } = useRuntimeBrand()

  return (
    <Link
      to={href}
      className={cn("flex items-center gap-3 text-foreground", className)}
    >
      <img
        src="/logo.svg"
        alt={`${brand?.brandName ?? "Codexsun"} logo`}
        className={cn("w-auto shrink-0", compact ? "h-10" : "h-12")}
      />
      <div className="min-w-0">
        <p className="font-heading text-lg font-semibold tracking-tight">
          {brand?.brandName ?? "codexsun"}
        </p>
        <p className="text-xs uppercase tracking-[0.24em] text-muted-foreground">
          {brand?.tagline ?? "Enterprise application suite"}
        </p>
      </div>
    </Link>
  )
}
