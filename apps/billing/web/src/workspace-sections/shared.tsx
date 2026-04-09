import type { ReactNode } from "react"

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"

export function SectionShell({
  title,
  description,
  children,
}: {
  title: string
  description: string
  children: ReactNode
}) {
  return (
    <section className="space-y-6">
      <div className="space-y-2">
        <h1 className="text-2xl font-semibold tracking-tight text-foreground">{title}</h1>
        <p className="max-w-3xl text-sm leading-6 text-muted-foreground">{description}</p>
      </div>
      {children}
    </section>
  )
}

export function MetricCard({
  label,
  value,
  hint,
}: {
  label: string
  value: string | number
  hint: string
}) {
  return (
    <Card className="border border-border/70 bg-card/80 shadow-sm">
      <CardHeader className="space-y-2">
        <CardDescription>{label}</CardDescription>
        <CardTitle className="text-2xl">{value}</CardTitle>
      </CardHeader>
      <CardContent className="pt-0 text-sm leading-6 text-muted-foreground">{hint}</CardContent>
    </Card>
  )
}

export function StateCard({ message }: { message: string }) {
  return (
    <Card className="border border-dashed border-border/70 bg-card/60 shadow-none">
      <CardContent className="py-8 text-sm text-muted-foreground">{message}</CardContent>
    </Card>
  )
}
