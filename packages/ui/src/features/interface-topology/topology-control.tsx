import { Tags } from 'lucide-react'
import type { InterfaceTopologyController } from './interface-topology.types'

export function TopologyInspectionControl({ topology }: { topology: InterfaceTopologyController }) {
  const action = topology.open ? 'Close Topology Inspection' : 'Open Topology Inspection'
  return (
    <button
      aria-label={action}
      className="fixed bottom-16 right-2 z-50 grid size-9 cursor-pointer place-items-center rounded-md border border-border bg-white text-violet-700 shadow-sm transition hover:bg-violet-50 hover:text-violet-800 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-violet-500 data-[open=true]:bg-violet-100"
      data-open={topology.open}
      onClick={topology.toggleOpen}
      title={action}
      type="button"
    >
      <Tags aria-hidden="true" size={16} />
    </button>
  )
}
