import { TopologyRegion } from '@codexsun/ui/features/interface-topology'
import { useMdiTopology } from '@codexsun/ui/layouts/mdi-main'
import type { ReactNode } from 'react'

export function ZetroDeskWorkspace({ children }: { children?: ReactNode }) {
  const topology = useMdiTopology()

  return (
    <TopologyRegion
      aria-label="Zetro workspace"
      as="section"
      className="size-full bg-background [&>[data-ito-marker]]:top-10"
      id="15.1"
      topology={topology}
    >
      {children}
    </TopologyRegion>
  )
}
