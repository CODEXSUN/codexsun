import { Link } from "react-router-dom"

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
  return (
    <Link
      to={href}
      className={cn("flex items-center gap-3 text-foreground", className)}
    >
      <img
        src="/logo.svg"
        alt="Codexsun logo"
        className={cn("w-auto shrink-0", compact ? "h-10" : "h-12")}
      />
      <div className="min-w-0">
        <p className="font-heading text-lg font-semibold tracking-tight">
          codexsun
        </p>
        <p className="text-xs uppercase tracking-[0.24em] text-muted-foreground">
          Enterprise application suite
        </p>
      </div>
    </Link>
  )
}
