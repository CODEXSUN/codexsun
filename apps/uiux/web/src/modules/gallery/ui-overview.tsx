import { ArrowRight, Boxes, Component, LayoutTemplate } from 'lucide-react'
import { Badge } from '@codexsun/ui/components/badge'
import { ExecutionStatus } from '@codexsun/ui/blocks/execution-status'
import { Button } from '@codexsun/ui/components/button'
import { designSystemCategories } from '@codexsun/ui/design-system'
import { TopologyRegion } from '@codexsun/ui/features/interface-topology'
import { useMdiTopology } from '@codexsun/ui/layouts/mdi-main'
import { ComponentSpecimen } from './component-specimen'
import { resolveUiComponentVariant } from './component-variants'
import { uiBlockDocs } from './ui-blocks'
import { uiComponentDocs, type UiComponentDoc } from './ui-components'

export function UiOverview() {
  const topology = useMdiTopology()

  return (
    <TopologyRegion
      as="main"
      className="h-full overflow-y-auto bg-background"
      id="20"
      topology={topology}
    >
      <div className="mx-auto grid w-full max-w-[96rem] gap-14 px-6 py-12 lg:px-10 lg:py-14">
        <OverviewHeader />
        <DefaultBlockLinks />
        <DefaultComponentSections />
      </div>
    </TopologyRegion>
  )
}

function OverviewHeader() {
  return (
    <header className="grid gap-6 border-b pb-8 lg:grid-cols-[minmax(0,1fr)_auto] lg:items-end">
      <div className="grid max-w-3xl gap-4">
        <Badge className="w-fit gap-1.5" variant="secondary">
          <Component className="size-3.5" /> CODEXSUN UI
        </Badge>
        <div className="grid gap-3">
          <h1 className="text-4xl font-semibold tracking-tight text-balance sm:text-5xl">
            Application design system
          </h1>
          <p className="max-w-2xl text-base leading-7 text-muted-foreground">
            Every preview below renders the package-owned default. Applications import the same
            component, block, variant, and token contracts.
          </p>
        </div>
      </div>
      <div className="flex flex-wrap gap-2">
        <Button nativeButton={false} render={<a href="/?layout=mdi-main" />} variant="outline">
          <LayoutTemplate /> Layouts
        </Button>
        <Button nativeButton={false} render={<a href="/?block=table" />}>
          <Boxes /> Blocks <ArrowRight data-icon="inline-end" />
        </Button>
      </div>
    </header>
  )
}

function DefaultBlockLinks() {
  return (
    <section className="grid gap-6" aria-labelledby="default-blocks-title">
      <SectionHeader
        count={uiBlockDocs.length}
        description="Open the real package-owned block with its pinned default composition."
        id="default-blocks-title"
        title="Default blocks"
      />
      <div className="grid gap-6 md:grid-cols-2">
        {uiBlockDocs.map((block) => (
          <a
            className="group grid min-h-28 content-center gap-3 rounded-2xl border bg-card p-7 transition-[border-color,transform] duration-200 hover:-translate-y-0.5 hover:border-foreground/25 focus-visible:outline-none focus-visible:ring-3 focus-visible:ring-ring/50 motion-reduce:transform-none motion-reduce:transition-none"
            href={`/?block=${block.id}`}
            key={block.id}
          >
            <span className="flex items-center justify-between gap-3 font-semibold">
              {block.name}
              <ArrowRight className="size-4 transition-transform group-hover:translate-x-0.5 motion-reduce:transition-none" />
            </span>
            <code className="truncate text-sm text-muted-foreground">{block.source}</code>
          </a>
        ))}
      </div>
      <ExecutionStatus
        state="idle"
        title="Execution Status · sample preview"
        description="Open the block to inspect active, complete, attention, and paused motion states."
        elapsed="Not started"
        metrics={[{ label: 'Sample updates', value: 0 }]}
      />
    </section>
  )
}

function DefaultComponentSections() {
  return (
    <div className="grid gap-14">
      {designSystemCategories.map((category) => {
        const components = uiComponentDocs.filter((component) => component.category === category)
        if (components.length === 0) return null
        return (
          <section className="grid gap-7" key={category} aria-labelledby={`category-${category}`}>
            <SectionHeader
              count={components.length}
              description="Live defaults from the public component exports."
              id={`category-${category}`}
              title={category}
            />
            <div className="grid items-start gap-6 lg:grid-cols-2 xl:grid-cols-3 xl:gap-7">
              {components.map((component) => (
                <DefaultComponentCard component={component} key={component.id} />
              ))}
            </div>
          </section>
        )
      })}
    </div>
  )
}

function DefaultComponentCard({ component }: { component: UiComponentDoc }) {
  const defaultVariant = resolveUiComponentVariant(component, null)
  const wide = component.id === 'button' || component.id === 'button-group'

  return (
    <article
      className={`min-w-0 overflow-hidden rounded-2xl border bg-card ${wide ? 'xl:col-span-3' : ''}`}
    >
      <header className="flex min-h-20 items-center justify-between gap-5 border-b bg-muted/15 px-6 py-4">
        <div className="grid min-w-0 gap-1.5">
          <a
            className="w-fit text-base font-semibold underline-offset-4 hover:underline focus-visible:outline-none focus-visible:ring-3 focus-visible:ring-ring/50"
            href={`/?component=${component.id}`}
          >
            {component.name}
          </a>
          <code className="block truncate text-xs text-muted-foreground">{component.source}</code>
        </div>
        <Badge className="shrink-0" variant="outline">
          {defaultVariant.name}
        </Badge>
      </header>
      <div className="min-w-0 px-6 py-7 sm:px-7 sm:py-8">
        <ComponentSpecimen compact component={component} variant={defaultVariant.id} />
      </div>
    </article>
  )
}

function SectionHeader({
  count,
  description,
  id,
  title,
}: {
  count: number
  description: string
  id: string
  title: string
}) {
  return (
    <header className="flex flex-wrap items-end justify-between gap-4">
      <div className="grid gap-2">
        <h2 className="text-2xl font-semibold tracking-tight" id={id}>
          {title}
        </h2>
        <p className="text-sm text-muted-foreground">{description}</p>
      </div>
      <Badge variant="secondary">{count}</Badge>
    </header>
  )
}
