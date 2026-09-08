import type { ReactNode } from 'react'

import {
  Card,
  CardAction,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from '../../components/card'
import { cn } from '../../lib/utils'

type WorkspaceSectionCardProps = {
  action?: ReactNode
  children: ReactNode
  className?: string
  description?: ReactNode
  footer?: ReactNode
  title: ReactNode
}

export function WorkspaceSectionCard({
  action,
  children,
  className,
  description,
  footer,
  title,
}: WorkspaceSectionCardProps) {
  return (
    <Card className={cn('min-w-0 shadow-xs', className)}>
      <CardHeader className="border-b">
        <CardTitle>{title}</CardTitle>
        {description ? <CardDescription>{description}</CardDescription> : null}
        {action ? <CardAction>{action}</CardAction> : null}
      </CardHeader>
      <CardContent>{children}</CardContent>
      {footer ? <CardFooter>{footer}</CardFooter> : null}
    </Card>
  )
}
