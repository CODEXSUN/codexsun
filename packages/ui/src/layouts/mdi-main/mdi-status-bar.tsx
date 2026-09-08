import { Separator } from '@codexsun/ui/components/separator'
import { TopologyMarker } from '../../features/interface-topology'
import { useMdiTopology } from './mdi-topology'

type MdiStatusBarProps = {
  statusLabel: string
  workspaceTitle: string
}

export function MdiStatusBar({ statusLabel, workspaceTitle }: MdiStatusBarProps) {
  const topology = useMdiTopology()
  return (
    <footer
      className="relative flex h-7 shrink-0 items-center border-t bg-muted/30 px-3 text-xs text-muted-foreground data-[ito-highlighted=true]:ring-2 data-[ito-highlighted=true]:ring-inset data-[ito-highlighted=true]:ring-violet-700"
      {...topology.regionProps('04')}
    >
      <TopologyMarker id="04" topology={topology} />
      <span>{statusLabel}</span>
      <Separator orientation="vertical" className="mx-2 h-3" />
      <span className="truncate">{workspaceTitle}</span>
    </footer>
  )
}
