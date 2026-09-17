import { cn } from '@codexsun/ui/lib/utils'

import { AgentActivityRail } from './agent-activity-rail'
import type { AgentWorkspaceProps } from './agent-workspace.types'

export function AgentWorkspace({
  canvasClassName,
  children,
  className,
  primaryRail,
  secondaryRail,
  showPrimaryRail = true,
  showSecondaryRail = true,
}: AgentWorkspaceProps) {
  return (
    <section
      aria-label="Agent workspace"
      className={cn('flex size-full min-h-0 min-w-0 overflow-hidden bg-background', className)}
    >
      <AgentActivityRail rail={primaryRail} side="left" visible={showPrimaryRail} />
      <div className={cn('relative min-h-0 min-w-0 flex-1 overflow-hidden', canvasClassName)}>
        {children}
      </div>
      <AgentActivityRail rail={secondaryRail} side="right" visible={showSecondaryRail} />
    </section>
  )
}
