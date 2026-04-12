import type { ReactNode } from "react"

import { Badge } from "@/components/ui/badge"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"

export function ZetroSectionIntro({
  eyebrow,
  title,
  description,
}: {
  eyebrow: string
  title: string
  description: string
}) {
  return (
    <Card className="rounded-md border-border/70 py-0 shadow-sm">
      <CardHeader className="space-y-2 p-5">
        <Badge variant="outline" className="w-fit rounded-md">
          {eyebrow}
        </Badge>
        <CardTitle>{title}</CardTitle>
        <CardDescription className="max-w-3xl text-sm leading-6">
          {description}
        </CardDescription>
      </CardHeader>
    </Card>
  )
}

export function ZetroMetricPanel({
  label,
  value,
  detail,
}: {
  label: string
  value: string
  detail: string
}) {
  return (
    <Card className="rounded-md border-border/70 py-0 shadow-sm">
      <CardContent className="space-y-2 p-5">
        <p className="text-sm font-medium text-muted-foreground">{label}</p>
        <p className="text-3xl font-semibold text-foreground">{value}</p>
        <p className="text-sm leading-6 text-muted-foreground">{detail}</p>
      </CardContent>
    </Card>
  )
}

export function ZetroDataState({
  error,
  isLoading,
}: {
  error: unknown
  isLoading: boolean
}) {
  if (isLoading) {
    return (
      <ZetroPanel>
        <CardContent className="p-5 text-sm text-muted-foreground">
          Loading Zetro data.
        </CardContent>
      </ZetroPanel>
    )
  }

  if (error) {
    return (
      <ZetroPanel>
        <CardContent className="p-5 text-sm text-destructive">
          {error instanceof Error ? error.message : "Zetro data could not be loaded."}
        </CardContent>
      </ZetroPanel>
    )
  }

  return null
}

export function ZetroPanel({
  children,
  className = "",
}: {
  children: ReactNode
  className?: string
}) {
  return (
    <Card className={`rounded-md border-border/70 py-0 shadow-sm ${className}`}>
      {children}
    </Card>
  )
}
