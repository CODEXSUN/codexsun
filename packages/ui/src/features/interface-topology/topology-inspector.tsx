import { Check, ChevronRight, Eye, EyeOff, Highlighter, X } from 'lucide-react'
import { useEffect, useState } from 'react'
import type {
  InterfaceTopologyController,
  InterfaceTopologySection,
} from './interface-topology.types'

export function TopologyInspector({ topology }: { topology: InterfaceTopologyController }) {
  if (!topology.open) return null
  const selected =
    topology.sections.find(({ id }) => id === topology.selected) ?? topology.sections[0]
  if (!selected) return null

  return (
    <aside
      aria-label="Interface Topology Overlay"
      className="fixed bottom-16 right-14 top-8 z-50 flex w-[min(23rem,calc(100vw-4.5rem))] flex-col overflow-hidden rounded-xl border border-border bg-white text-neutral-950 shadow-[0_16px_42px_rgb(15_23_42/0.16)]"
    >
      <InspectorHeader topology={topology} />
      <div className="border-b border-border px-4 py-5">
        <strong className="block text-sm">
          {selected.id} · {selected.name}
        </strong>
        <code className="mt-1 block break-all text-xs font-bold text-violet-700">
          {selected.technicalName}
        </code>
        <span className="mt-3 block text-[10px] font-bold uppercase tracking-[0.14em] text-violet-700">
          {selected.scope}
        </span>
        <p className="mt-1 text-sm leading-5 text-neutral-600">{selected.description}</p>
      </div>
      <nav
        aria-label="Topology sections"
        className="min-h-0 flex-1 overflow-y-auto px-2 py-2 [scrollbar-color:#a78bfa_transparent] [scrollbar-width:thin] [&::-webkit-scrollbar-thumb]:rounded-full [&::-webkit-scrollbar-thumb]:bg-violet-400 [&::-webkit-scrollbar]:w-1"
      >
        {topology.sections.filter(isRootSection).map((section) => (
          <TopologyGroup key={section.id} section={section} topology={topology} />
        ))}
      </nav>
    </aside>
  )
}

function InspectorHeader({ topology }: { topology: InterfaceTopologyController }) {
  return (
    <header className="border-b border-border px-4 py-3">
      <p className="pb-3 text-[11px] font-bold uppercase tracking-[0.12em] text-violet-700">
        Interface Topology Overlay
      </p>
      <div className="flex items-center justify-end gap-1 border-t border-border pt-3">
        <HeaderAction
          active={topology.labelsVisible}
          label={topology.labelsVisible ? 'Hide ITO labels' : 'Show ITO labels'}
          onClick={topology.toggleLabels}
        >
          {topology.labelsVisible ? <Eye size={16} /> : <EyeOff size={16} />}
        </HeaderAction>
        <HeaderAction
          active={topology.highlighting}
          label="Toggle boundary highlighter"
          onClick={topology.toggleHighlight}
        >
          <Highlighter size={16} />
        </HeaderAction>
        <HeaderAction label="Close Topology Inspection" onClick={topology.close}>
          <X size={16} />
        </HeaderAction>
      </div>
    </header>
  )
}

function HeaderAction({
  active = false,
  children,
  label,
  onClick,
}: {
  active?: boolean
  children: React.ReactNode
  label: string
  onClick: () => void
}) {
  return (
    <button
      aria-label={label}
      aria-pressed={active}
      className="grid size-8 cursor-pointer place-items-center rounded-md text-neutral-600 transition hover:bg-neutral-100 hover:text-neutral-950 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-violet-500 data-[active=true]:bg-violet-700 data-[active=true]:text-white"
      data-active={active}
      onClick={onClick}
      title={label}
      type="button"
    >
      {children}
    </button>
  )
}

function TopologyGroup({
  section,
  topology,
}: {
  section: InterfaceTopologySection
  topology: InterfaceTopologyController
}) {
  const [collapsed, setCollapsed] = useState(false)
  const children = topology.sections.filter(
    ({ id }) => id.includes('.') && id.slice(0, id.lastIndexOf('.')) === section.id,
  )
  const selected = topology.selected === section.id
  const expanded =
    !collapsed &&
    topology.highlighting &&
    (selected || topology.selected.startsWith(`${section.id}.`))
  useEffect(() => setCollapsed(false), [topology.highlighting, topology.selected])

  return (
    <div>
      <button
        aria-expanded={children.length ? expanded : undefined}
        className="grid w-full cursor-pointer grid-cols-[auto_1fr_auto] items-center gap-2 rounded-md px-2 py-1.5 text-left text-sm text-neutral-600 transition hover:bg-neutral-100 hover:text-neutral-950 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-violet-500 data-[selected=true]:bg-neutral-200 data-[selected=true]:text-violet-800"
        data-selected={selected}
        onClick={() => {
          if (children.length && expanded) setCollapsed(true)
          else {
            setCollapsed(false)
            topology.inspect(section.id)
          }
        }}
        type="button"
      >
        <b className="min-w-7 rounded bg-violet-700 px-1.5 py-1 text-center text-[10px] text-white">
          {section.id}
        </b>
        <span className="truncate">{section.name}</span>
        {children.length ? (
          <ChevronRight className={expanded ? 'rotate-90' : ''} size={15} />
        ) : selected ? (
          <Check size={15} />
        ) : null}
      </button>
      {expanded ? (
        <div className="ml-4 border-l border-border pl-1">
          {children.map((child) => (
            <TopologyGroup key={child.id} section={child} topology={topology} />
          ))}
        </div>
      ) : null}
    </div>
  )
}

function isRootSection(section: InterfaceTopologySection) {
  return !section.id.includes('.')
}
