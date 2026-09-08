import { Boxes, LayoutDashboard, PanelLeft, Search, Sparkles } from 'lucide-react'
import { useMemo, useState } from 'react'
import { Badge } from '../../components/badge'
import { Button } from '../../components/button'
import { Input } from '../../components/input'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../../components/tabs'
import { TopologyRegion } from '../../features/interface-topology'
import { useMdiTopology } from '../../layouts/mdi-main'
import { galleryCategories, galleryComponents } from './gallery-catalog'
import { GalleryData } from './gallery-data'
import { GalleryForms } from './gallery-forms'
import { GalleryFoundations } from './gallery-foundations'
import { GalleryOverlays } from './gallery-overlays'

export const uiGalleryTopologySections = [
  {
    id: '20',
    technicalName: 'gallery.header.summary',
    name: 'Gallery summary',
    scope: 'UI gallery',
    description: 'Introduces the shared UI package and its installed component count.',
  },
  {
    id: '21',
    technicalName: 'gallery.search.componentFilter',
    name: 'Component filter',
    scope: 'UI gallery',
    description: 'Filters the complete component inventory by name, category, or import path.',
  },
  {
    id: '22',
    technicalName: 'gallery.preview.liveComponents',
    name: 'Live previews',
    scope: 'UI gallery',
    description: 'Interactive examples rendered from centralized shadcn components.',
  },
  {
    id: '22.1',
    technicalName: 'gallery.preview.foundations',
    name: 'Foundation previews',
    scope: 'Live previews',
    description: 'Action, identity, navigation, feedback, media, and disclosure examples.',
  },
  {
    id: '22.2',
    technicalName: 'gallery.preview.forms',
    name: 'Form previews',
    scope: 'Live previews',
    description: 'Text entry, selection, date, and structured-input examples.',
  },
  {
    id: '22.3',
    technicalName: 'gallery.preview.data',
    name: 'Data previews',
    scope: 'Live previews',
    description: 'Table, tabs, progress, scroll, carousel, and resizable examples.',
  },
  {
    id: '22.4',
    technicalName: 'gallery.preview.overlays',
    name: 'Overlay previews',
    scope: 'Live previews',
    description: 'Dialog, alert, drawer, sheet, menu, hover, popover, and tooltip examples.',
  },
  {
    id: '23',
    technicalName: 'gallery.catalog.componentInventory',
    name: 'Component inventory',
    scope: 'UI gallery',
    description: 'Complete source inventory for every centralized component module.',
  },
  {
    id: '24',
    technicalName: 'gallery.templates.availableBlocks',
    name: 'Template inventory',
    scope: 'UI gallery',
    description: 'Composition-ready dashboard, sidebar, documentation, and MDI layout packages.',
  },
] as const

export function UiGallery() {
  const [query, setQuery] = useState('')
  const topology = useMdiTopology()
  const visible = useMemo(() => {
    const value = query.trim().toLowerCase()
    if (!value) return galleryComponents
    return galleryComponents.filter(({ category, name, source }) =>
      `${category} ${name} ${source}`.toLowerCase().includes(value),
    )
  }, [query])

  return (
    <main className="relative min-h-full bg-muted/20" data-ito-root="ui-gallery">
      <TopologyRegion className="border-b bg-background px-6 py-8" id="20" topology={topology}>
        <div className="mx-auto flex max-w-7xl flex-col gap-5 lg:flex-row lg:items-end lg:justify-between">
          <div className="space-y-3">
            <Badge className="gap-1.5" variant="secondary">
              <Sparkles size={13} /> Central UI workspace
            </Badge>
            <div>
              <h1 className="text-3xl font-semibold tracking-tight">Component gallery</h1>
              <p className="mt-2 max-w-2xl text-sm leading-6 text-muted-foreground">
                Live shared primitives, complete source inventory, reusable templates, and Interface
                Topology Inspection in one runnable workspace.
              </p>
            </div>
          </div>
          <div className="flex gap-3">
            <Stat
              icon={<Boxes size={17} />}
              label="Components"
              value={String(galleryComponents.length)}
            />
            <Stat icon={<LayoutDashboard size={17} />} label="Templates" value="4" />
          </div>
        </div>
      </TopologyRegion>

      <div className="mx-auto max-w-7xl space-y-8 p-6">
        <TopologyRegion className="rounded-xl border bg-background p-4" id="21" topology={topology}>
          <div className="relative">
            <Search
              className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground"
              size={16}
            />
            <Input
              aria-label="Filter UI components"
              className="pl-9"
              onChange={(event) => setQuery(event.target.value)}
              placeholder="Filter components, categories, or import paths"
              value={query}
            />
          </div>
        </TopologyRegion>

        <TopologyRegion id="22" topology={topology}>
          <SectionHeading
            description="Open controls and interact with real package components."
            title="Live component lab"
          />
          <Tabs defaultValue="foundations">
            <TabsList className="mb-4 flex h-auto w-full flex-wrap justify-start">
              <TabsTrigger value="foundations">Foundations</TabsTrigger>
              <TabsTrigger value="forms">Forms</TabsTrigger>
              <TabsTrigger value="data">Data & layout</TabsTrigger>
              <TabsTrigger value="overlays">Overlays</TabsTrigger>
            </TabsList>
            <TabsContent value="foundations">
              <TopologyRegion id="22.1" topology={topology}>
                <GalleryFoundations />
              </TopologyRegion>
            </TabsContent>
            <TabsContent value="forms">
              <TopologyRegion id="22.2" topology={topology}>
                <GalleryForms />
              </TopologyRegion>
            </TabsContent>
            <TabsContent value="data">
              <TopologyRegion id="22.3" topology={topology}>
                <GalleryData />
              </TopologyRegion>
            </TabsContent>
            <TabsContent value="overlays">
              <TopologyRegion id="22.4" topology={topology}>
                <GalleryOverlays />
              </TopologyRegion>
            </TabsContent>
          </Tabs>
        </TopologyRegion>

        <TopologyRegion id="23" topology={topology}>
          <SectionHeading
            description={`${visible.length} of ${galleryComponents.length} component modules shown.`}
            title="Complete component inventory"
          />
          <div className="space-y-5">
            {galleryCategories.map((category) => {
              const components = visible.filter((item) => item.category === category)
              return components.length ? (
                <section className="rounded-xl border bg-background p-4" key={category}>
                  <h3 className="mb-3 text-sm font-semibold">{category}</h3>
                  <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
                    {components.map(({ name, source }) => (
                      <div className="min-w-0 rounded-lg border bg-muted/20 p-3" key={name}>
                        <p className="text-sm font-medium">{name}</p>
                        <code
                          className="mt-1 block truncate text-[11px] text-muted-foreground"
                          title={source}
                        >
                          {source}
                        </code>
                      </div>
                    ))}
                  </div>
                </section>
              ) : null
            })}
          </div>
        </TopologyRegion>

        <TopologyRegion id="24" topology={topology}>
          <SectionHeading
            description="Package-owned starting points for application composition."
            title="Templates and layouts"
          />
          <div className="grid gap-4 md:grid-cols-2">
            {[
              ['Dashboard 01', '@codexsun/ui/templates/dashboard-01', LayoutDashboard],
              ['Sidebar 07', '@codexsun/ui/templates/sidebar-07', PanelLeft],
              ['Documentation sidebar', '@codexsun/ui/templates/documentation-sidebar', PanelLeft],
              ['MDI main', '@codexsun/ui/layouts/mdi-main', Boxes],
            ].map(([name, source, Icon]) => (
              <article
                className="flex items-center gap-4 rounded-xl border bg-background p-5"
                key={String(name)}
              >
                <span className="grid size-11 shrink-0 place-items-center rounded-xl bg-primary text-primary-foreground">
                  <Icon size={19} />
                </span>
                <div className="min-w-0">
                  <h3 className="font-medium">{String(name)}</h3>
                  <code className="block truncate text-xs text-muted-foreground">
                    {String(source)}
                  </code>
                </div>
                <Button className="ml-auto" size="sm" variant="outline">
                  Ready
                </Button>
              </article>
            ))}
          </div>
        </TopologyRegion>
      </div>
    </main>
  )
}

function SectionHeading({ description, title }: { description: string; title: string }) {
  return (
    <header className="mb-4">
      <h2 className="text-xl font-semibold tracking-tight">{title}</h2>
      <p className="mt-1 text-sm text-muted-foreground">{description}</p>
    </header>
  )
}

function Stat({ icon, label, value }: { icon: React.ReactNode; label: string; value: string }) {
  return (
    <div className="flex min-w-32 items-center gap-3 rounded-xl border bg-card px-4 py-3 shadow-sm">
      <span className="text-muted-foreground">{icon}</span>
      <div>
        <strong className="block text-lg leading-none">{value}</strong>
        <span className="text-xs text-muted-foreground">{label}</span>
      </div>
    </div>
  )
}
