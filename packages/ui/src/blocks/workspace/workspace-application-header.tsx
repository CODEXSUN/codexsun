import type { LucideIcon } from 'lucide-react'
import type { ReactNode } from 'react'

import { cn } from '../../lib/utils'

export type WorkspaceApplicationHeaderProps = {
  applicationIcon?: LucideIcon
  applicationLogoUrl?: string
  applicationName: ReactNode
  className?: string
  end?: ReactNode
  meta?: ReactNode
  status?: ReactNode
  showIdentity?: boolean
  showWorkspaceTitle?: boolean
  start?: ReactNode
  title?: ReactNode
  workspaceTitle?: ReactNode
}

/** Title bar for the canvas below the global workspace menu. */
export function WorkspaceApplicationHeader({
  applicationIcon: ApplicationIcon,
  applicationLogoUrl,
  applicationName,
  className,
  end,
  meta,
  status,
  showIdentity = true,
  showWorkspaceTitle = true,
  start,
  title,
  workspaceTitle,
}: WorkspaceApplicationHeaderProps) {
  return (
    <header
      aria-label="Workspace application header"
      data-ui-component="WorkspaceApplicationHeader"
      className={cn(
        'sticky top-0 z-20 flex h-10 shrink-0 items-center justify-between gap-3 border-b border-border bg-background px-3 text-[11px] leading-none text-foreground',
        className,
      )}
    >
      <div className="flex min-w-0 items-center gap-2">
        {start}
        {status}
        {title ? <span className="truncate text-sm font-semibold">{title}</span> : null}
        {showIdentity ? (
          <>
            {applicationLogoUrl ? (
              <img alt="" className="size-3 shrink-0 rounded-sm object-contain" src={applicationLogoUrl} />
            ) : ApplicationIcon ? (
              <ApplicationIcon aria-hidden="true" className="size-3 shrink-0" />
            ) : null}
            <span className="truncate font-medium">{applicationName}</span>
          </>
        ) : null}
      </div>
      <div className="flex min-w-0 shrink-0 items-center gap-3 text-xs text-muted-foreground">
        {meta}
        {showWorkspaceTitle ? <span className="max-w-[45vw] truncate tracking-[0.12em] uppercase">{workspaceTitle}</span> : null}
        {end}
      </div>
    </header>
  )
}
