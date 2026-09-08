import type { ElementType, HTMLAttributes, ReactNode } from 'react'
import { cn } from '../../lib/utils'
import type { InterfaceTopologyController } from './interface-topology.types'
import { TopologyMarker } from './topology-marker'

export function TopologyRegion({
  as: Component = 'section',
  children,
  className,
  id,
  topology,
  ...props
}: Omit<HTMLAttributes<HTMLElement>, 'id'> & {
  as?: ElementType
  children: ReactNode
  className?: string
  id: string
  topology: InterfaceTopologyController
}) {
  return (
    <Component
      className={cn(
        'relative data-[ito-highlighted=true]:shadow-[inset_0_0_0_2px_rgb(126_34_206/0.92)]',
        className,
      )}
      {...props}
      {...topology.regionProps(id)}
    >
      <TopologyMarker id={id} topology={topology} />
      {children}
    </Component>
  )
}
