import { TagsIcon } from 'lucide-react'
import {
  TopologyInspector,
  useInterfaceTopology,
  type InterfaceTopologyController,
} from '@codexsun/ui/features/interface-topology'
import { Button } from '@codexsun/ui/components/button'
import { mdiTopologySections, useMdiTopology } from '@codexsun/ui/layouts/mdi-main'
import { UiTemplatePage } from '@codexsun/ui/templates/ui-page'
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

const documentationWorkspaceStructureItems = [
  {
    description: 'Applies documentation defaults to the shared MDI application shell.',
    name: 'Documentation Workspace',
  },
  {
    description: 'Finds document titles, tags, and repository paths.',
    name: 'Documentation search',
  },
  {
    description: 'Shows application-owned guide groups and document links.',
    name: 'Document navigation',
  },
  {
    description: 'Hosts the selected article, editor, index, or unavailable state.',
    name: 'Reading canvas',
  },
  {
    description: 'Preserves shared shell settings and the sidebar position.',
    name: 'Workspace state',
  },
] as const

export function UiLayoutDocumentation({ layout }: { layout: UiLayoutDoc }) {
  const topology = useMdiTopology()
  const structureTopology = useInterfaceTopology(mdiDocumentationDesk)
  const isMdiMain = layout.id === 'mdi-main'
  const structureItems = resolveStructureItems(layout.id)
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
            ? { href: `/?layout=${previousLayout.id}`, name: previousLayout.name }
            : { href: '/', name: 'UI overview' },
          next: nextLayout
            ? { href: `/?layout=${nextLayout.id}`, name: nextLayout.name }
            : { href: '/?block=table', name: 'Table' },
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

function resolveStructureItems(layoutId: UiLayoutDoc['id']) {
  if (layoutId === 'mdi-main') return mdiStructureItems
  if (layoutId === 'documentation-workspace') return documentationWorkspaceStructureItems
  return agentWorkspaceStructureItems
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
              <Button
                aria-label={`Inspect ${item.name} topology`}
                className="text-violet-700 hover:text-violet-800"
                onClick={() =>
                  item.sectionId ? topology.inspect(item.sectionId) : topology.toggleOpen()
                }
                size="icon-sm"
                title={`Inspect ${item.name} topology`}
                type="button"
                variant="ghost"
              >
                <TagsIcon aria-hidden="true" className="size-4" />
              </Button>
            ) : null}
          </div>
        </li>
      ))}
    </ol>
  )
}
