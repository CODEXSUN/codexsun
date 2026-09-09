import { CrownIcon, PanelsTopLeftIcon } from 'lucide-react'
import type { ReactNode } from 'react'
import { Card, CardContent } from '../../components/card'
import { cn } from '../../lib/utils'

export type AuthPageVariant = 'v1' | 'v2'

export function AuthBrand({ name = 'Codexsun' }: { name?: string }) {
  return (
    <div className="flex flex-col items-center gap-2" aria-label={name}>
      <span className="relative grid size-12 place-items-center rounded-xl border-2 border-foreground/80 bg-background">
        <PanelsTopLeftIcon className="size-7" strokeWidth={2.25} />
        <span className="absolute -right-2 -bottom-1 grid size-5 place-items-center rounded-full border border-orange-300 bg-orange-50 text-orange-600">
          <CrownIcon className="size-3" />
        </span>
      </span>
      <span className="text-xl font-semibold tracking-tight">{name}</span>
    </div>
  )
}

export function AuthPageLayout({
  aside,
  brandName,
  children,
  className,
  embedded = false,
  variant,
}: {
  aside?: ReactNode
  brandName?: string
  children: ReactNode
  className?: string
  embedded?: boolean
  variant: AuthPageVariant
}) {
  if (variant === 'v2') {
    return (
      <main
        className={cn(
          'flex items-center justify-center bg-muted/30 px-5 py-10',
          embedded ? 'min-h-[650px]' : 'min-h-screen',
          className,
        )}
      >
        <div className="grid w-full max-w-4xl gap-5">
          <AuthBrand name={brandName} />
          <Card className="overflow-hidden p-0 shadow-lg">
            <CardContent className="grid p-0 md:grid-cols-2">
              <div className="p-7 md:p-9">{children}</div>
              <div className="relative hidden min-h-[520px] overflow-hidden border-l bg-foreground text-background md:flex">
                {aside}
              </div>
            </CardContent>
          </Card>
        </div>
      </main>
    )
  }

  return (
    <main
      className={cn(
        'flex items-center justify-center bg-success/5 px-5 py-10',
        embedded ? 'min-h-[650px]' : 'min-h-screen',
        className,
      )}
    >
      <div className="grid w-full max-w-[520px] gap-5">
        <AuthBrand name={brandName} />
        <Card className="border border-orange-200/70 p-1 shadow-xl shadow-foreground/10 ring-1 ring-border">
          <CardContent className="rounded-lg border bg-card p-9">{children}</CardContent>
        </Card>
      </div>
    </main>
  )
}

export function AuthVisualPanel({ description, title }: { description: string; title: string }) {
  return (
    <div className="relative flex min-h-full w-full flex-col justify-end overflow-hidden p-9">
      <div className="absolute -top-20 -right-20 size-72 rounded-full border border-background/20" />
      <div className="absolute top-20 right-16 size-40 rounded-full border border-background/15" />
      <div className="relative grid gap-2">
        <p className="text-2xl font-semibold tracking-tight">{title}</p>
        <p className="max-w-sm text-sm leading-6 text-background/70">{description}</p>
      </div>
    </div>
  )
}
