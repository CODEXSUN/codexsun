import type { ReactNode } from 'react'

import { cn } from '../../lib/utils'

type WorkspacePageHeaderProps = {
  actions?: ReactNode
  badge?: ReactNode
  className?: string
  description?: ReactNode
  eyebrow?: ReactNode
  title: ReactNode
}

export function WorkspacePageHeader({
  actions,
  badge,
  className,
  description,
  eyebrow,
  title,
}: WorkspacePageHeaderProps) {
  return (
    <header
      className={cn('flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between', className)}
    >
      <div className="min-w-0 max-w-3xl">
        {eyebrow ? (
          <div className="pb-2 text-xs font-semibold tracking-widest text-primary uppercase">
            {eyebrow}
          </div>
        ) : null}
        <div className="flex flex-wrap items-center gap-2">
          <h1 className="text-2xl font-semibold tracking-tight sm:text-3xl">{title}</h1>
          {badge}
        </div>
        {description ? (
          <p className="pt-2 text-sm leading-6 text-muted-foreground">{description}</p>
        ) : null}
      </div>
      {actions ? <div className="flex shrink-0 flex-wrap items-center gap-2">{actions}</div> : null}
    </header>
  )
}
