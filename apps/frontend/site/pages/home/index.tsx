import { ArrowRight, Blocks, Building2, ReceiptText, ShieldCheck } from "lucide-react"

import { Button } from "@/components/ui/button"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { Input } from "@/components/ui/input"

function HomePage() {
  return (
    <main className="min-h-screen bg-[radial-gradient(circle_at_top,_rgba(15,23,42,0.05),_transparent_38%),linear-gradient(180deg,_#fafaf9_0%,_#f5f5f4_100%)] text-foreground">
      <section className="mx-auto flex min-h-screen w-full max-w-7xl flex-col px-6 py-8 lg:px-10">
        <header className="flex items-center justify-between border-b border-border/60 pb-6">
          <div>
            <p className="text-xs font-medium uppercase tracking-[0.28em] text-muted-foreground">
              Codexsun
            </p>
            <h1 className="mt-2 font-heading text-3xl tracking-tight sm:text-4xl">
              ERP foundation for billing, commerce, and workflow apps
            </h1>
          </div>
          <Button className="hidden sm:inline-flex">Open workspace</Button>
        </header>

        <div className="grid flex-1 gap-8 py-10 lg:grid-cols-[1.25fr_0.9fr] lg:items-start">
          <section className="space-y-8">
            <div className="max-w-2xl space-y-5">
              <p className="text-lg leading-8 text-muted-foreground">
                This starter is wired with Vite, React, TypeScript, Tailwind CSS,
                and shadcn so you can build the first Codexsun modules without
                spending another pass on frontend tooling.
              </p>

              <div className="flex flex-wrap gap-3">
                <Button size="lg" className="gap-2">
                  Start building
                  <ArrowRight className="size-4" />
                </Button>
                <Button size="lg" variant="outline">
                  Review architecture
                </Button>
              </div>
            </div>

            <div className="grid gap-4 md:grid-cols-3">
              <Card>
                <CardHeader>
                  <Building2 className="size-5 text-primary" />
                  <CardTitle>Framework-first</CardTitle>
                  <CardDescription>
                    Keep runtime, auth, config, and database ownership explicit.
                  </CardDescription>
                </CardHeader>
              </Card>
              <Card>
                <CardHeader>
                  <ReceiptText className="size-5 text-primary" />
                  <CardTitle>ERP-ready</CardTitle>
                  <CardDescription>
                    Billing, inventory, ecommerce, and task apps can branch cleanly.
                  </CardDescription>
                </CardHeader>
              </Card>
              <Card>
                <CardHeader>
                  <ShieldCheck className="size-5 text-primary" />
                  <CardTitle>Typed by default</CardTitle>
                  <CardDescription>
                    TypeScript, path aliases, linting, and reusable UI are already wired.
                  </CardDescription>
                </CardHeader>
              </Card>
            </div>
          </section>

          <Card className="border border-border/70 bg-background/90 shadow-sm backdrop-blur">
            <CardHeader>
              <div className="flex items-center gap-2 text-primary">
                <Blocks className="size-5" />
                <span className="text-sm font-medium">Bootstrap panel</span>
              </div>
              <CardTitle>Start the first module batch</CardTitle>
              <CardDescription>
                Use this shell as the baseline for auth, navigation, and module routing.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <label className="text-sm font-medium" htmlFor="workspace-name">
                  Workspace name
                </label>
                <Input
                  id="workspace-name"
                  defaultValue="codexsun"
                  placeholder="Enter workspace name"
                />
              </div>

              <div className="rounded-xl border border-dashed border-border bg-muted/50 p-4 text-sm text-muted-foreground">
                Dev server: <code className="rounded bg-background px-1.5 py-0.5">npm run dev</code>
                <br />
                Production build:
                <code className="ml-1 rounded bg-background px-1.5 py-0.5">npm run build</code>
              </div>
            </CardContent>
          </Card>
        </div>
      </section>
    </main>
  )
}

export default HomePage
