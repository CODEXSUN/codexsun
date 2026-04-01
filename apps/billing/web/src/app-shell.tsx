import { billingAppManifest } from "../../src/app-manifest"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { billingWorkspaceItems } from "@billing/shared"

import { BillingWorkspaceSection } from "./workspace-sections"

function BillingAppShell() {
  return (
    <main className="min-h-screen bg-[radial-gradient(circle_at_top,_rgba(16,185,129,0.08),_transparent_32%),linear-gradient(180deg,_#fafaf9_0%,_#f0fdf4_100%)] px-6 py-8 text-foreground lg:px-10">
      <div className="mx-auto flex w-full max-w-6xl flex-col gap-6">
        <Card className="border border-border/70 bg-background/90 shadow-sm">
          <CardHeader className="space-y-3">
            <Badge variant="outline" className="w-fit">
              Double-entry accounting
            </Badge>
            <div className="space-y-2">
              <CardTitle className="text-3xl tracking-tight">{billingAppManifest.name}</CardTitle>
              <CardDescription className="max-w-3xl text-base leading-7">
                {billingAppManifest.description}
              </CardDescription>
            </div>
          </CardHeader>
          <CardContent className="grid gap-4 md:grid-cols-3">
            <div className="rounded-xl border border-border/70 bg-background px-4 py-3">
              <p className="text-xs font-medium uppercase tracking-[0.18em] text-muted-foreground">
                Workspace sections
              </p>
              <p className="mt-2 text-2xl font-semibold text-foreground">
                {billingWorkspaceItems.length}
              </p>
            </div>
            <div className="rounded-xl border border-border/70 bg-background px-4 py-3">
              <p className="text-xs font-medium uppercase tracking-[0.18em] text-muted-foreground">
                Posting engine
              </p>
              <p className="mt-2 text-2xl font-semibold text-foreground">Live</p>
            </div>
            <div className="rounded-xl border border-border/70 bg-background px-4 py-3">
              <p className="text-xs font-medium uppercase tracking-[0.18em] text-muted-foreground">
                Voucher coverage
              </p>
              <p className="mt-2 text-2xl font-semibold text-foreground">6 types</p>
            </div>
          </CardContent>
        </Card>

        <BillingWorkspaceSection />
      </div>
    </main>
  )
}

export default BillingAppShell
