import { GlobalLoader } from '@codexsun/ui/blocks/loader'
import { Badge } from '@codexsun/ui/components/badge'
import { Button } from '@codexsun/ui/components/button'
import { TopologyRegion } from '@codexsun/ui/features/interface-topology'
import { MdiMain, type MdiNavigationItem, useMdiTopology } from '@codexsun/ui/layouts/mdi-main'
import { UiTemplateNavigation } from '@codexsun/ui/templates/ui-page'
import {
  BookOpen,
  BotIcon,
  ChevronRight,
  FileText,
  FolderTreeIcon,
  LightbulbIcon,
  ListTree,
  MonitorIcon,
  Network,
  PackageIcon,
  ServerIcon,
  WorkflowIcon,
  WrenchIcon,
} from 'lucide-react'
import type { LucideIcon } from 'lucide-react'
import { useEffect, useMemo, useState } from 'react'
import { DocsLibraryArticle } from './docs-library.article'
import { useDocsLibrary } from './docs-library.hooks'
import { DocsLibraryHeader } from './docs-library.header'
import { DocsLibraryEditor } from './docs-library.editor'
import {
  getAdjacentDocuments,
  getDocsIndexGroups,
  getDocsNavigationNodes,
} from './docs-library.index'
import { DocsIndexPage } from './docs-library.index-page'
import type { DocsState } from './docs-library.types'
import {
  getBacklinks,
  getDocumentHeadings,
  getRelatedDocuments,
  matchesDocument,
} from './docs-library.utils'
import { IdeasWorkspace } from './ideas.workspace'
import { docsTopologySections } from './docs-library.topology'

export function DocsWorkspace() {
  const library = useDocsLibrary()
  const [editing, setEditing] = useState(false)
  const [view, setView] = useState<'docs' | 'ideas'>('docs')
  const [query, setQuery] = useState('')
  const visibleDocuments = useMemo(
    () => library.documents.filter((document) => matchesDocument(document, query)),
    [library.documents, query],
  )
  useEffect(() => setEditing(false), [library.activeDocument?.slug])
  const navigation = useMemo(
    () => [
      {
        items: [
          {
            active: view === 'docs' && !library.activeDocument,
            icon: BookOpen,
            label: 'Overview',
            onSelect: () => {
              setView('docs')
              library.selectDocument()
            },
          },
        ],
      },
      {
        defaultOpen: view === 'ideas',
        icon: LightbulbIcon,
        label: 'Ideas',
        items: [
          {
            active: view === 'ideas',
            icon: LightbulbIcon,
            label: 'Development plan',
            onSelect: () => setView('ideas'),
          },
        ],
      },
      ...getDocsIndexGroups(visibleDocuments).map((group) => ({
        defaultOpen: group.documents.some(
          (document) => document.slug === library.activeDocument?.slug,
        ),
        icon: getDocsGroupIcon(group.id),
        items: toMdiNavigationItems(
          getDocsNavigationNodes(group),
          library.activeDocument?.slug,
          library.selectDocument,
          setView,
        ),
        label: group.label,
      })),
    ],
    [library, view, visibleDocuments],
  )

  return (
    <MdiMain
      applicationIcon={BookOpen}
      applicationId="docs"
      applicationName="Docs"
      navigation={navigation}
      onSearchChange={setQuery}
      primaryAction={null}
      searchPlaceholder="Search titles, tags, and paths"
      searchValue={query}
      sidebarContentClassName="docs-sidebar-scroll"
      topologySections={docsTopologySections}
      workspaceTitle="Documentation"
    >
      {view === 'ideas' ? (
        <IdeasWorkspace />
      ) : editing && library.activeDocument ? (
        <DocsLibraryEditor
          document={library.activeDocument}
          onBack={() => setEditing(false)}
          onSave={async (input) => {
            await library.saveDocument(library.activeDocument!.slug, input)
          }}
        />
      ) : (
        <DocsLibraryView library={library} onEdit={() => setEditing(true)} />
      )}
    </MdiMain>
  )
}

function getDocsGroupIcon(groupId: string): LucideIcon {
  if (groupId === 'assists') return FileText
  if (groupId === 'runtime') return ServerIcon
  if (groupId === 'repository') return FolderTreeIcon
  if (groupId.startsWith('packages-')) return PackageIcon

  switch (groupId) {
    case 'apps-platform':
      return MonitorIcon
    case 'apps-docs':
      return BookOpen
    case 'apps-devkit':
      return WrenchIcon
    case 'apps-zetro':
      return BotIcon
    case 'apps-orship':
      return WorkflowIcon
    default:
      return FolderTreeIcon
  }
}

function toMdiNavigationItems(
  nodes: ReturnType<typeof getDocsNavigationNodes>,
  activeSlug: string | undefined,
  selectDocument: (slug?: string) => void,
  setView: (view: 'docs') => void,
): MdiNavigationItem[] {
  return nodes.map((node) => ({
    active: node.document?.slug === activeSlug,
    badge: node.document?.tags.length || undefined,
    children: node.children
      ? toMdiNavigationItems(node.children, activeSlug, selectDocument, setView)
      : undefined,
    defaultOpen: node.children?.some((child) => child.document?.slug === activeSlug),
    href: node.document ? `#${node.document.slug}` : undefined,
    label: node.label,
    onSelect: node.document
      ? () => {
          setView('docs')
          selectDocument(node.document?.slug)
        }
      : undefined,
  }))
}

function DocsLibraryView({
  library,
  onEdit,
}: {
  library: ReturnType<typeof useDocsLibrary>
  onEdit: () => void
}) {
  const topology = useMdiTopology()
  const { activeDocument, documents, error, loading, selectDocument } = library
  const related = activeDocument ? getRelatedDocuments(activeDocument, documents) : []
  const backlinks = activeDocument ? getBacklinks(activeDocument, documents) : []

  return (
    <TopologyRegion
      as="div"
      className="flex size-full min-h-0 flex-col"
      id="10"
      topology={topology}
    >
      <TopologyRegion as="div" id="10.1" topology={topology}>
        <DocsLibraryHeader document={activeDocument} onEdit={onEdit} />
      </TopologyRegion>
      <TopologyRegion
        as="div"
        className="docs-reader-scroll relative flex-1 overflow-y-auto"
        id="10.2"
        topology={topology}
        aria-busy={loading}
      >
        <div
          className={
            activeDocument
              ? 'min-h-full w-full px-6 py-10 lg:px-10 xl:px-14'
              : 'mx-auto min-h-full w-4/5 max-w-[120rem] px-6 py-10 lg:px-10'
          }
        >
          {error ? <UnavailablePage error={error} /> : null}
          {!error && activeDocument ? (
            <div className="docs-reading-layout">
              <TopologyRegion
                as="article"
                className="docs-content min-w-0 max-w-none"
                id="10.2.1"
                topology={topology}
              >
                <div className="mb-8 flex flex-wrap gap-2">
                  {activeDocument.tags.map((tag) => (
                    <Badge key={tag} variant="outline">
                      #{tag}
                    </Badge>
                  ))}
                </div>
                <DocsLibraryArticle
                  html={activeDocument.html}
                  path={activeDocument.path}
                  source={activeDocument.source}
                />
                <DocumentConnections
                  backlinks={backlinks}
                  documents={documents}
                  links={activeDocument.links}
                  onSelect={selectDocument}
                  related={related}
                />
                <DocumentNavigation documents={documents} slug={activeDocument.slug} />
              </TopologyRegion>
              <DocumentOutline source={activeDocument.source} />
            </div>
          ) : null}
          {!error && !activeDocument ? (
            <DocsIndexPage documents={documents} onSelect={selectDocument} />
          ) : null}
        </div>
        <GlobalLoader
          active={loading}
          delayMs={activeDocument ? 120 : 0}
          label="Loading documentation"
          overlay
        />
      </TopologyRegion>
    </TopologyRegion>
  )
}

function DocumentNavigation({
  documents,
  slug,
}: {
  documents: DocsState['documents']
  slug: string
}) {
  const topology = useMdiTopology()
  const { next, previous } = getAdjacentDocuments(documents, slug)
  if (!previous && !next) return null

  return (
    <TopologyRegion as="div" className="mt-12" id="10.2.4" topology={topology}>
      <UiTemplateNavigation
        next={next ? { href: `#${next.slug}`, name: next.title } : undefined}
        previous={previous ? { href: `#${previous.slug}`, name: previous.title } : undefined}
      />
    </TopologyRegion>
  )
}

function DocumentOutline({ source }: { source: string }) {
  const topology = useMdiTopology()
  const headings = getDocumentHeadings(source)
  if (!headings.length) return null
  return (
    <TopologyRegion
      as="aside"
      className="docs-outline"
      id="10.2.2"
      topology={topology}
      aria-label="On this page"
    >
      <p className="flex items-center gap-2 text-xs font-semibold tracking-wide text-foreground uppercase">
        <ListTree className="size-3.5" />
        On this page
      </p>
      <nav className="mt-3 flex flex-col gap-1">
        {headings.map((heading) => (
          <button
            key={heading.id}
            className={heading.level === 3 ? 'pl-4' : ''}
            onClick={() =>
              document
                .getElementById(heading.id)
                ?.scrollIntoView({ behavior: 'smooth', block: 'start' })
            }
          >
            {heading.text}
          </button>
        ))}
      </nav>
    </TopologyRegion>
  )
}

function DocumentConnections({
  backlinks,
  documents,
  links,
  onSelect,
  related,
}: {
  backlinks: DocsState['documents']
  documents: DocsState['documents']
  links: string[]
  onSelect: (slug?: string) => void
  related: DocsState['documents']
}) {
  const topology = useMdiTopology()
  const linked = documents.filter((document) => links.includes(document.slug))
  return (
    <TopologyRegion
      as="div"
      className="mt-12 grid gap-8 border-t pt-7 md:grid-cols-2"
      id="10.2.3"
      topology={topology}
    >
      <ConnectionList icon={ChevronRight} items={linked} label="Linked notes" onSelect={onSelect} />
      <ConnectionList icon={Network} items={backlinks} label="Referenced by" onSelect={onSelect} />
      <ConnectionList icon={FileText} items={related} label="Related by tag" onSelect={onSelect} />
    </TopologyRegion>
  )
}

function ConnectionList({
  icon: Icon,
  items,
  label,
  onSelect,
}: {
  icon: typeof FileText
  items: DocsState['documents']
  label: string
  onSelect: (slug?: string) => void
}) {
  if (!items.length) return null
  return (
    <section>
      <h2 className="mt-0 flex items-center gap-2 text-base">
        <Icon className="size-4" />
        {label}
      </h2>
      <div className="mt-3 flex flex-wrap gap-2">
        {items.map((document) => (
          <Button
            key={document.slug}
            size="sm"
            variant="secondary"
            onClick={() => onSelect(document.slug)}
          >
            {document.title}
          </Button>
        ))}
      </div>
    </section>
  )
}

function UnavailablePage({ error }: { error: string }) {
  const topology = useMdiTopology()
  return (
    <TopologyRegion
      as="article"
      className="docs-content max-w-[75ch]"
      id="10.4"
      topology={topology}
    >
      <Badge variant="destructive">Docs unavailable</Badge>
      <h1 className="mt-5">Documentation could not load</h1>
      <p>{error}</p>
      <p>Start the Docs API, then refresh this page.</p>
    </TopologyRegion>
  )
}
