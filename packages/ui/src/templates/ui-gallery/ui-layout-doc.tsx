import { TagsIcon } from 'lucide-react'
import {
  TopologyInspector,
  useInterfaceTopology,
  type InterfaceTopologyController,
} from '../../features/interface-topology'
import { mdiTopologySections, useMdiTopology } from '../../layouts/mdi-main'
import { UiTemplatePage } from '../ui-page'
import { UiLayoutPreview } from './ui-layout-preview'
import { uiLayoutDocs, type UiLayoutDoc } from './ui-layouts'

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

const agentWorkspaceStructureItems = [
  {
    description: 'Composes two fixed activity rails around one focused agent canvas.',
    name: 'Agent Workspace',
  },
  {
    description: 'Shows application-owned agent activities along the left edge.',
    name: 'Primary activity rail',
  },
  {
    description: 'Hosts the active conversation, task, editor, or agent-owned surface.',
    name: 'Workspace canvas',
  },
  {
    description: 'Shows context and supporting tools along the right edge.',
    name: 'Secondary utility rail',
  },
  {
    description: 'Controls each rail through shared MDI feature switches.',
    name: 'Feature settings',
  },
] as const

export function UiLayoutDocumentation({ layout }: { layout: UiLayoutDoc }) {
  const topology = useMdiTopology()
  const structureTopology = useInterfaceTopology(mdiDocumentationDesk)
  const isMdiMain = layout.id === 'mdi-main'
  const structureItems = isMdiMain ? mdiStructureItems : agentWorkspaceStructureItems
  const layoutIndex = uiLayoutDocs.findIndex(({ id }) => id === layout.id)
  const previousLayout = uiLayoutDocs[layoutIndex - 1]
  const nextLayout = uiLayoutDocs[layoutIndex + 1]

  return (
    <>
      <UiTemplatePage
        code={layout.code}
        importPath={layout.packageName}
        kind="Layout"
        name={layout.name}
        navigation={{
          previous: previousLayout
            ? { href: `/ui?layout=${previousLayout.id}`, name: previousLayout.name }
            : { href: '/ui', name: 'UI overview' },
          next: nextLayout
            ? { href: `/ui?layout=${nextLayout.id}`, name: nextLayout.name }
            : { href: '/ui?block=table', name: 'Table' },
        }}
        preview={<UiLayoutPreview layoutId={layout.id} />}
        topology={topology}
        topologyIds={{ page: '21', preview: '21.1', usage: '21.2' }}
        usageDescription={
          <LayoutStructureList
            items={structureItems}
            topology={isMdiMain ? structureTopology : undefined}
          />
        }
        usageTitle={`${layout.name} structure`}
      />
      {isMdiMain ? <TopologyInspector topology={structureTopology} /> : null}
    </>
  )
}

type LayoutStructureItem = {
  description: string
  name: string
  sectionId?: string
}

function LayoutStructureList({
  items,
  topology,
}: {
  items: readonly LayoutStructureItem[]
  topology?: InterfaceTopologyController
}) {
  return (
    <ol className="grid list-decimal gap-2 pl-5">
      {items.map((item) => (
        <li className="pl-1" key={item.name}>
          <div className="flex min-h-8 items-center gap-2">
            <span className="min-w-0 flex-1">
              <strong className="font-medium text-foreground">{item.name}.</strong>{' '}
              {item.description}
            </span>
            {topology ? (
              <button
                aria-label={`Inspect ${item.name} topology`}
                className="grid size-8 shrink-0 cursor-pointer place-items-center rounded-md text-violet-700 transition hover:-translate-y-0.5 hover:bg-violet-50 hover:text-violet-800 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-violet-500 motion-reduce:transform-none motion-reduce:transition-none dark:hover:bg-violet-950"
                onClick={() =>
                  item.sectionId ? topology.inspect(item.sectionId) : topology.toggleOpen()
                }
                title={`Inspect ${item.name} topology`}
                type="button"
              >
                <TagsIcon aria-hidden="true" className="size-4" />
              </button>
            ) : null}
          </div>
        </li>
      ))}
    </ol>
  )
}
