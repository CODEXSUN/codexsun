import type { ReactNode } from "react"

import { Card, CardContent } from "@/components/ui/card"

type PublicPageShellProps = {
  eyebrow?: string
  title: string
  description: string
  children: ReactNode
  aside?: ReactNode
}

export function PublicPageShell({ eyebrow, title, description, children, aside }: PublicPageShellProps) {
  return (
    <div className="mx-auto flex max-w-7xl flex-col gap-8 px-4 py-8 sm:px-6 sm:py-10">
      <section className="grid gap-6 rounded-4xl border border-border/60 bg-card px-6 py-8 shadow-[0_24px_60px_-40px_rgba(40,28,18,0.18)] lg:grid-cols-[1.5fr_0.9fr] lg:px-8">
        <div className="space-y-4">
          {eyebrow ? <div className="text-xs font-semibold uppercase tracking-[0.24em] text-muted-foreground">{eyebrow}</div> : null}
          <div className="space-y-3">
            <h1 className="max-w-3xl text-4xl font-semibold tracking-tight sm:text-5xl">{title}</h1>
            <p className="max-w-2xl text-base leading-7 text-muted-foreground">{description}</p>
          </div>
        </div>
        {aside ? (
          <Card className="border-border/60 bg-muted/25 shadow-none">
            <CardContent className="flex h-full flex-col justify-center gap-4 p-6">{aside}</CardContent>
          </Card>
        ) : null}
      </section>

      <div className="space-y-8">{children}</div>
    </div>
  )
}

export function PublicSection({
  title,
  description,
  children,
}: {
  title: string
  description: string
  children: ReactNode
}) {
  return (
    <section className="space-y-5">
      <div className="space-y-2">
        <h2 className="text-2xl font-semibold tracking-tight sm:text-3xl">{title}</h2>
        <p className="max-w-3xl text-sm leading-6 text-muted-foreground">{description}</p>
      </div>
      {children}
    </section>
  )
}
