import type { ReactNode } from "react"

import { AppBrand } from "@/components/ux/app-brand"
import { cn } from "@/lib/utils"

type AuthLayoutProps = {
  children: ReactNode
  variant?: "web" | "desktop"
}

function AuthLayout({ children, variant = "web" }: AuthLayoutProps) {
  return (
    <div
      className={cn(
        "flex min-h-screen items-center justify-center px-6 py-10",
        variant === "desktop"
          ? "bg-[radial-gradient(circle_at_top,_rgba(15,23,42,0.14),_transparent_34%),linear-gradient(180deg,_#f5f5f4_0%,_#e7e5e4_100%)]"
          : "bg-[radial-gradient(circle_at_top,_rgba(15,23,42,0.06),_transparent_32%),linear-gradient(180deg,_#fafaf9_0%,_#f5f5f4_100%)]"
      )}
    >
      <div
        className={cn(
          "w-full rounded-3xl border border-border bg-background/90 p-6 shadow-lg backdrop-blur",
          variant === "desktop" ? "max-w-lg" : "max-w-md"
        )}
      >
        <div className="mb-6 border-b border-border/70 pb-5">
          <AppBrand compact />
        </div>
        {children}
      </div>
    </div>
  )
}

export default AuthLayout
