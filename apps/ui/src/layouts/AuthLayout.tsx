import type { ReactNode } from "react"

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
        variant === "desktop" ? "theme-auth-shell-desktop" : "theme-auth-shell"
      )}
    >
      <div className="w-full max-w-md">
        <div className="mb-8 flex flex-col items-center gap-3 text-center">
          <img
            src="/logo.svg"
            alt="Codexsun logo"
            className="h-12 w-auto"
          />
          <div className="space-y-1">
            <p className="text-3xl font-semibold tracking-[0.28em] text-foreground uppercase">
              codexsun
            </p>
            <p className="text-sm text-muted-foreground">
              Business software, made to work together.
            </p>
          </div>
        </div>
        <div
          className={cn(
            "rounded-[2rem] border border-border/70 bg-background/92 p-7 shadow-[0_24px_60px_rgba(15,23,42,0.08)] backdrop-blur",
            variant === "desktop" ? "p-8" : "p-7"
          )}
        >
          {children}
        </div>
      </div>
    </div>
  )
}

export default AuthLayout
