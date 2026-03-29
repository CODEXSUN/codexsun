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
        variant === "desktop"
          ? "bg-[radial-gradient(circle_at_top_left,_rgba(59,130,246,0.14),_transparent_30%),radial-gradient(circle_at_top_right,_rgba(168,85,247,0.12),_transparent_32%),radial-gradient(circle_at_bottom_left,_rgba(34,197,94,0.10),_transparent_28%),radial-gradient(circle_at_bottom_right,_rgba(249,115,22,0.12),_transparent_32%),linear-gradient(180deg,_#fafaf9_0%,_#f1f5f9_100%)]"
          : "bg-[radial-gradient(circle_at_top_left,_rgba(59,130,246,0.10),_transparent_28%),radial-gradient(circle_at_top_right,_rgba(168,85,247,0.08),_transparent_30%),radial-gradient(circle_at_bottom_left,_rgba(34,197,94,0.07),_transparent_26%),radial-gradient(circle_at_bottom_right,_rgba(249,115,22,0.09),_transparent_30%),linear-gradient(180deg,_#ffffff_0%,_#f8fafc_100%)]"
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
