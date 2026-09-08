import type { CSSProperties } from 'react'
import type { InterfaceTopologyController } from './interface-topology.types'

const hues = [215, 145, 185, 42, 198, 112, 28]

export function TopologyMarker({
  id,
  topology,
}: {
  id: string
  topology: InterfaceTopologyController
}) {
  const section = topology.sections.find((candidate) => candidate.id === id)
  if (!section || !topology.labelsVisible || !isLabelVisible(id, topology)) return null
  const selected = topology.open && topology.selected === id
  const isBanner = !id.includes('.')
  const hue = hues[sectionIndex(id) % hues.length]
  const style = {
    '--ito-sticker': `hsl(${hue} 82% 42% / 0.82)`,
    '--ito-sticker-soft': `hsl(${hue} 92% 92% / 0.72)`,
  } as CSSProperties

  return (
    <button
      aria-label={`Inspect ${section.name}: ${section.technicalName}`}
      className="absolute left-2 top-2 z-30 flex min-h-6 min-w-7 max-w-48 cursor-pointer items-center justify-center gap-1.5 rounded-md border border-white/65 bg-[var(--ito-sticker-soft)] px-1.5 text-[11px] font-extrabold text-[var(--ito-sticker)] shadow-[0_5px_16px_rgb(15_23_42/0.14)] backdrop-blur-md transition hover:-translate-y-0.5 hover:bg-[var(--ito-sticker)] hover:text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring data-[selected=true]:bg-[var(--ito-sticker)] data-[selected=true]:text-white"
      data-selected={selected}
      onClick={(event) => {
        event.preventDefault()
        event.stopPropagation()
        topology.inspect(id)
      }}
      onPointerDown={(event) => event.stopPropagation()}
      style={style}
      title={`${id} · ${section.name} · ${section.technicalName}`}
      type="button"
    >
      <span>{displayId(id)}</span>
      {isBanner && <span className="truncate font-semibold">{section.name}</span>}
    </button>
  )
}

function displayId(id: string) {
  return id.replace(/^[a-z]+/i, '').padStart(2, '0')
}

function sectionIndex(id: string) {
  return Number.parseInt(id.replace(/^[a-z]+/i, ''), 10) || 0
}

function isLabelVisible(id: string, topology: InterfaceTopologyController) {
  if (!id.includes('.')) return true
  if (!topology.highlighting) return false
  const normalized = topology.selected.replace(/^0+(?=\d)/, '')
  return id === normalized || id.slice(0, id.lastIndexOf('.')) === normalized
}
