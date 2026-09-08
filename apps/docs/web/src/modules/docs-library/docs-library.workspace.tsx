import { GlobalLoader } from '@codexsun/ui/blocks/loader'
import { Badge } from '@codexsun/ui/components/badge'
import { Button } from '@codexsun/ui/components/button'
import { TopologyRegion } from '@codexsun/ui/features/interface-topology'
import { MdiMain, type MdiNavigationSection, useMdiTopology } from '@codexsun/ui/layouts/mdi-main'
import { BookOpen, ChevronRight, FileText, LightbulbIcon, ListTree, Network } from 'lucide-react'
import { useEffect, useMemo, useRef, useState } from 'react'
import { useDocsLibrary } from './docs-library.hooks'
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
  const [view, setView] = useState<'docs' | 'ideas'>('docs')
  const [query, setQuery] = useState('')
  const visibleDocuments = useMemo(
    () => library.documents.filter((document) => matchesDocument(document, query)),
    [library.documents, query],
  )
  const navigation = useMemo(
    () => [
      {
        defaultOpen: view === 'ideas',
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
      ...toNavigation(visibleDocuments, library.activeDocument?.slug, (slug) => {
        setView('docs')
        library.selectDocument(slug)
      }),
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
      {view === 'ideas' ? <IdeasWorkspace /> : <DocsLibraryView library={library} query={query} />}
    </MdiMain>
  )
}

function DocsLibraryView({
  library,
  query,
}: {
  library: ReturnType<typeof useDocsLibrary>
  query: string
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
      <TopologyRegion
        as="header"
        className="flex h-16 shrink-0 items-center gap-3 border-b px-5"
        id="10.1"
        topology={topology}
      >
        <BookOpen className="size-4 text-muted-foreground" />
        <div className="min-w-0">
          <p className="text-sm font-semibold">Docs library</p>
          <p className="text-xs text-muted-foreground">
            {query
              ? `${documents.filter((document) => matchesDocument(document, query)).length} matching documents`
              : `${documents.length} connected documents`}
          </p>
        </div>
      </TopologyRegion>
      <TopologyRegion
        as="div"
        className="docs-reader-scroll relative flex-1 overflow-y-auto"
        id="10.2"
        topology={topology}
        aria-busy={loading}
      >
        <div className="mx-auto min-h-full w-[90%] max-w-[120rem] px-6 py-10 lg:px-10">
          {error ? <UnavailablePage error={error} /> : null}
          {!error && activeDocument ? (
            <div className="docs-reading-layout">
              <TopologyRegion
                as="article"
                className="docs-content min-w-0 max-w-[75ch]"
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
                <DocumentBody html={activeDocument.html} source={activeDocument.source} />
                <DocumentConnections
                  backlinks={backlinks}
                  documents={documents}
                  links={activeDocument.links}
                  onSelect={selectDocument}
                  related={related}
                />
              </TopologyRegion>
              <DocumentOutline source={activeDocument.source} />
            </div>
          ) : null}
          {!error && !activeDocument ? (
            <OverviewPage count={documents.length} onSelect={selectDocument} />
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

function DocumentBody({ html, source }: { html: string; source: string }) {
  const headings = getDocumentHeadings(source)
  const contentRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    contentRef.current?.querySelectorAll('h2, h3').forEach((element, index) => {
      const heading = headings[index]
      if (heading) element.id = heading.id
    })
  }, [headings])

  return <div ref={contentRef} dangerouslySetInnerHTML={{ __html: html }} />
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

function toNavigation(
  documents: DocsState['documents'],
  activeSlug: string | undefined,
  selectDocument: (slug: string) => void,
): MdiNavigationSection[] {
  const sections = new Map<string, MdiNavigationSection['items']>()
  for (const document of documents) {
    const section = getSection(document.path)
    const items = sections.get(section) ?? []
    items.push({
      active: document.slug === activeSlug,
      badge: document.tags.length || undefined,
      href: `#${document.slug}`,
      label: document.title,
      onSelect: () => selectDocument(document.slug),
    })
    sections.set(section, items)
  }
  return [...sections.entries()]
    .sort(([left], [right]) => left.localeCompare(right))
    .map(([label, items]) => ({ defaultOpen: items.some((item) => item.active), items, label }))
}

function getSection(path: string): string {
  if (path.startsWith('assist/')) return 'Assist'
  if (path.startsWith('apps/docs/content/')) return 'Docs vault'
  if (path.startsWith('apps/docs/')) return 'Docs application'
  if (path.startsWith('apps/')) return 'Applications'
  if (path.startsWith('packages/')) return 'Packages'
  return 'Repository'
}

function OverviewPage({ count, onSelect }: { count: number; onSelect: (slug?: string) => void }) {
  const topology = useMdiTopology()
  return (
    <TopologyRegion
      as="article"
      className="docs-content max-w-[75ch]"
      id="10.3"
      topology={topology}
    >
      <Badge variant="secondary">Overview</Badge>
      <h1 className="mt-5">CODEXSUN documentation</h1>
      <p>
        A source-linked library for application guides, module contracts, architecture decisions,
        and operating records.
      </p>
      <TopologyRegion
        as="div"
        className="mt-10 grid gap-4 sm:grid-cols-3"
        id="10.3.1"
        topology={topology}
      >
        <OverviewMetric label="Documents" value={count} />
        <OverviewMetric label="Source model" value="Markdown + MDX" />
        <OverviewMetric label="Connections" value="Tags + wiki-links" />
      </TopologyRegion>
      <h2>Start here</h2>
      <p>
        Use search to find a title, tag, alias, description, or source path. Open any document to
        see its outline, linked notes, backlinks, and related guidance.
      </p>
      <TopologyRegion as="div" id="10.3.2" topology={topology}>
        <Button className="mt-5" onClick={() => onSelect('architecture')}>
          Open architecture
        </Button>
      </TopologyRegion>
    </TopologyRegion>
  )
}

function OverviewMetric({ label, value }: { label: string; value: string | number }) {
  return (
    <div className="rounded-lg border bg-muted/20 p-4">
      <p className="text-lg font-semibold text-foreground">{value}</p>
      <p className="mt-1 text-xs text-muted-foreground">{label}</p>
    </div>
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
