import { TopologyRegion } from '@codexsun/ui/features/interface-topology'
import { useMdiTopology } from '@codexsun/ui/layouts/mdi-main'
import type { ReactNode } from 'react'

export function ZetroDeskSidebar({ children }: { children?: ReactNode }) {
  const topology = useMdiTopology()

  return (
    <TopologyRegion
      aria-label="Zetro Desk sidebar"
      as="aside"
      className="min-h-0 flex-1 [&>[data-ito-marker]]:top-10"
      id="15.2"
      topology={topology}
    >
      {children}
    </TopologyRegion>
  )
}
