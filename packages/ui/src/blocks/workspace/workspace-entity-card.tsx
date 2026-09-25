import type { ReactNode } from 'react'

import { Card, CardContent, CardFooter, CardHeader, CardTitle } from '../../components/card'
import { cn } from '../../lib/utils'

export type WorkspaceEntityCardProps = {
  action?: ReactNode
  children?: ReactNode
  className?: string
  description?: ReactNode
  eyebrow?: ReactNode
  footer?: ReactNode
  title: ReactNode
  variant?: 'default' | 'interactive'
}

export function WorkspaceEntityCard({
  action,
  children,
  className,
  description,
  eyebrow,
  footer,
  title,
  variant = 'default',
}: WorkspaceEntityCardProps) {
  return (
    <Card
      className={cn(
        'h-full min-w-0 shadow-xs',
        variant === 'interactive' ? 'transition-shadow hover:shadow-md' : null,
        className,
      )}
      size="sm"
    >
      <CardHeader className="grid grid-cols-[1fr_auto] items-start gap-3">
        <div className="min-w-0">
          {eyebrow ? <div className="mb-2 text-xs font-semibold tracking-[0.16em] text-muted-foreground uppercase">{eyebrow}</div> : null}
          <CardTitle>{title}</CardTitle>
          {description ? <p className="mt-2 text-sm leading-6 text-muted-foreground">{description}</p> : null}
        </div>
        {action ? <div className="justify-self-end">{action}</div> : null}
      </CardHeader>
      {children ? <CardContent>{children}</CardContent> : null}
      {footer ? <CardFooter className="mt-auto justify-between gap-3">{footer}</CardFooter> : null}
    </Card>
  )
}
