import { Home, LogOut, ShieldCheck } from "lucide-react"
import { Link, useNavigate } from "react-router-dom"

import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { useRuntimeBrand } from "@/features/branding/runtime-brand-provider"

import { useAuth } from "../auth/auth-context"

export function WebUserLayout({
  title,
  description,
  children,
}: {
  title: string
  description: string
  children: React.ReactNode
}) {
  const { brand } = useRuntimeBrand()
  const auth = useAuth()
  const navigate = useNavigate()

  return (
    <div className="min-h-screen bg-[linear-gradient(180deg,#f7f2ec_0%,#f4efe9_18%,#faf8f4_100%)] text-foreground">
      <header className="border-b border-border/70 bg-background/82 backdrop-blur-xl">
        <div className="mx-auto flex w-full max-w-6xl flex-wrap items-center justify-between gap-4 px-5 py-4 lg:px-8">
          <div className="min-w-0">
            <p className="text-xs font-semibold uppercase tracking-[0.22em] text-muted-foreground">
              Web Dashboard
            </p>
            <h1 className="truncate font-heading text-2xl font-semibold tracking-tight">
              {brand?.brandName ?? "Codexsun"}
            </h1>
            <p className="text-sm text-muted-foreground">
              {brand?.tagline ?? "Connected business portal"}
            </p>
          </div>
          <div className="flex items-center gap-3">
            <Button asChild variant="outline" className="rounded-full">
              <Link to="/">
                <Home className="size-4" />
                Home
              </Link>
            </Button>
            <Button
              variant="outline"
              className="rounded-full border-destructive/20 bg-destructive/5 text-destructive hover:bg-destructive/10"
              onClick={() => {
                void auth.logout().then(() => navigate("/login"))
              }}
            >
              <LogOut className="size-4" />
              Sign out
            </Button>
          </div>
        </div>
      </header>

      <main className="mx-auto w-full max-w-6xl space-y-6 px-5 py-8 lg:px-8">
        <Card className="rounded-[1.8rem] border-border/70 py-0 shadow-sm">
          <CardContent className="space-y-4 p-6">
            <div className="inline-flex size-12 items-center justify-center rounded-2xl bg-primary/8 text-primary">
              <ShieldCheck className="size-6" />
            </div>
            <div className="space-y-2">
              <h2 className="font-heading text-3xl font-semibold tracking-tight">{title}</h2>
              <p className="max-w-3xl text-sm leading-7 text-muted-foreground">{description}</p>
            </div>
          </CardContent>
        </Card>

        {children}
      </main>
    </div>
  )
}
