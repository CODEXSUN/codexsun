import type { LucideIcon } from 'lucide-react'
import type { ReactNode } from 'react'

import { Card, CardAction, CardDescription, CardHeader, CardTitle } from '../../components/card'
import { cn } from '../../lib/utils'

type WorkspaceActionCardProps = {
  action?: ReactNode
  className?: string
  description: ReactNode
  icon: LucideIcon
  title: ReactNode
}

export function WorkspaceActionCard({
  action,
  className,
  description,
  icon: Icon,
  title,
}: WorkspaceActionCardProps) {
  return (
    <Card
      className={cn('h-full shadow-xs transition-colors hover:bg-muted/25', className)}
      size="sm"
    >
      <CardHeader className="grid grid-cols-[auto_1fr_auto] items-start gap-x-3">
        <span className="row-span-2 grid size-9 place-items-center rounded-lg bg-primary/10 text-primary">
          <Icon className="size-4" />
        </span>
        <CardTitle className="col-start-2">{title}</CardTitle>
        <CardDescription className="col-start-2 leading-5">{description}</CardDescription>
        {action ? <CardAction className="col-start-3">{action}</CardAction> : null}
      </CardHeader>
    </Card>
  )
}
