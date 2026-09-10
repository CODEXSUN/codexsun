import type { LucideIcon } from 'lucide-react'
import type { ReactNode } from 'react'

import { Card, CardAction, CardDescription, CardHeader, CardTitle } from '../../components/card'
import { cn } from '../../lib/utils'

type WorkspaceActionCardProps = {
  action?: ReactNode
  className?: string
  description?: ReactNode
  icon: LucideIcon
  iconClassName?: string
  layout?: 'inline' | 'stacked'
  title: ReactNode
}

export function WorkspaceActionCard({
  action,
  className,
  description,
  icon: Icon,
  iconClassName,
  layout = 'inline',
  title,
}: WorkspaceActionCardProps) {
  if (layout === 'stacked') {
    return (
      <Card
        className={cn('h-full shadow-xs transition-colors hover:bg-muted/25', className)}
        size="sm"
      >
        <CardHeader className="place-items-center text-center">
          <span
            className={cn(
              'grid size-9 place-items-center rounded-lg bg-primary/10 text-primary',
              iconClassName,
            )}
          >
            <Icon className="size-4" />
          </span>
          <CardTitle>{title}</CardTitle>
          {description ? (
            <CardDescription className="leading-5">{description}</CardDescription>
          ) : null}
          {action ? <CardAction>{action}</CardAction> : null}
        </CardHeader>
      </Card>
    )
  }

  return (
    <Card
      className={cn('h-full shadow-xs transition-colors hover:bg-muted/25', className)}
      size="sm"
    >
      <CardHeader className="grid grid-cols-[auto_1fr_auto] items-start gap-x-3">
        <span
          className={cn(
            'row-span-2 grid size-9 place-items-center rounded-lg bg-primary/10 text-primary',
            iconClassName,
          )}
        >
          <Icon className="size-4" />
        </span>
        <CardTitle className="col-start-2">{title}</CardTitle>
        {description ? (
          <CardDescription className="col-start-2 leading-5">{description}</CardDescription>
        ) : null}
        {action ? <CardAction className="col-start-3">{action}</CardAction> : null}
      </CardHeader>
    </Card>
  )
}
