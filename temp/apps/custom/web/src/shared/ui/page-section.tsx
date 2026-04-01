import type { ReactNode } from 'react'
import { cn } from '@ui/lib/utils'

interface PageSectionProps {
  eyebrow: string
  title: string
  description: string
  children: ReactNode
  className?: string
}

export function PageSection({
  eyebrow,
  title,
  description,
  children,
  className,
}: PageSectionProps) {
  return (
    <section className={cn('space-y-5', className)}>
      <div className="space-y-2">
        <p className="text-xs font-semibold tracking-[0.24em] text-muted-foreground uppercase">{eyebrow}</p>
        <div className="space-y-2">
          <h2 className="font-display text-2xl font-semibold tracking-tight text-foreground">{title}</h2>
          <p className="max-w-3xl text-sm leading-6 text-muted-foreground">{description}</p>
        </div>
      </div>
      {children}
    </section>
  )
}
