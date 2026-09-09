import { TagsIcon } from 'lucide-react'
import {
  TopologyInspector,
  useInterfaceTopology,
  type InterfaceTopologyController,
} from '../../features/interface-topology'
import { mdiTopologySections, useMdiTopology } from '../../layouts/mdi-main'
import { UiTemplatePage } from '../ui-page'
import { UiLayoutPreview } from './ui-layout-preview'
import type { UiLayoutDoc } from './ui-layouts'

const mdiDocumentationDesk = [
  { id: 'mdi-main-structure', name: 'MDI Main', sections: mdiTopologySections },
]

const mdiStructureItems = [
  {
    description: 'Composes the complete application shell and connects its shared regions.',
    name: 'MDI Main',
  },
  {
    description:
      'Shows application identity, global search, notifications, the app launcher, and the user menu.',
    name: 'Top header',
    sectionId: '01',
  },
  {
    description: 'Holds the Overview action, grouped application navigation, and feature settings.',
    name: 'Sidebar',
    sectionId: '02',
  },
  {
    description: 'Hosts the active page supplied by the application.',
    name: 'Workspace canvas',
    sectionId: '03',
  },
  {
    description: 'Shows the current runtime state and workspace name.',
    name: 'Status bar',
    sectionId: '04',
  },
] as const

export function UiLayoutDocumentation({ layout }: { layout: UiLayoutDoc }) {
  const topology = useMdiTopology()
  const structureTopology = useInterfaceTopology(mdiDocumentationDesk)

  return (
    <>
      <UiTemplatePage
        code={layout.code}
        importPath={layout.packageName}
        kind="Layout"
        name={layout.name}
        navigation={{
          previous: { href: '/ui', name: 'UI overview' },
          next: { href: '/ui?block=table', name: 'Table' },
        }}
        preview={<UiLayoutPreview layoutId={layout.id} />}
        topology={topology}
        topologyIds={{ page: '21', preview: '21.1', usage: '21.2' }}
        usageDescription={<MdiStructureList topology={structureTopology} />}
        usageTitle="MDI Main structure"
      />
      <TopologyInspector topology={structureTopology} />
    </>
  )
}

function MdiStructureList({ topology }: { topology: InterfaceTopologyController }) {
  return (
    <ol className="grid list-decimal gap-2 pl-5">
      {mdiStructureItems.map((item) => (
        <li className="pl-1" key={item.name}>
          <div className="flex min-h-8 items-center gap-2">
            <span className="min-w-0 flex-1">
              <strong className="font-medium text-foreground">{item.name}.</strong>{' '}
              {item.description}
            </span>
            <button
              aria-label={`Inspect ${item.name} topology`}
              className="grid size-8 shrink-0 cursor-pointer place-items-center rounded-md text-violet-700 transition hover:-translate-y-0.5 hover:bg-violet-50 hover:text-violet-800 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-violet-500 motion-reduce:transform-none motion-reduce:transition-none dark:hover:bg-violet-950"
              onClick={() =>
                'sectionId' in item ? topology.inspect(item.sectionId) : topology.toggleOpen()
              }
              title={`Inspect ${item.name} topology`}
              type="button"
            >
              <TagsIcon aria-hidden="true" className="size-4" />
            </button>
          </div>
        </li>
      ))}
    </ol>
  )
}
