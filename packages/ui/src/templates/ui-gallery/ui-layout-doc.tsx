import { ArrowLeftIcon, BoxIcon, CheckCircle2Icon, PackageIcon } from 'lucide-react'

import { Badge } from '../../components/badge'
import { Button } from '../../components/button'
import { Separator } from '../../components/separator'
import { TopologyRegion } from '../../features/interface-topology'
import { useMdiTopology } from '../../layouts/mdi-main'
import { UiTemplateCode } from '../ui-page'
import { UiLayoutPreview } from './ui-layout-preview'
import type { UiLayoutDoc } from './ui-layouts'

const pageLinks = [
  { href: '#preview', label: 'Preview' },
  { href: '#usage', label: 'Usage' },
  { href: '#code', label: 'Code' },
  { href: '#composition', label: 'Composition' },
]

export function UiLayoutDocumentation({ layout }: { layout: UiLayoutDoc }) {
  const topology = useMdiTopology()

  return (
    <TopologyRegion
      as="main"
      className="h-full overflow-y-auto bg-background"
      id="21"
      topology={topology}
    >
      <div className="mx-auto grid max-w-7xl gap-10 px-6 py-10 lg:grid-cols-[minmax(0,1fr)_11rem] lg:px-10">
        <article className="min-w-0">
          <header className="grid gap-5 pb-10">
            <Button className="w-fit" render={<a href="/ui" />} size="sm" variant="ghost">
              <ArrowLeftIcon /> Overview
            </Button>
            <div className="grid max-w-3xl gap-3">
              <Badge className="w-fit gap-1.5" variant="secondary">
                <BoxIcon className="size-3.5" /> Layout
              </Badge>
              <h1 className="text-3xl font-semibold tracking-tight sm:text-4xl">{layout.name}</h1>
              <p className="text-base leading-7 text-muted-foreground">{layout.description}</p>
              <code className="w-fit rounded-md bg-muted px-2.5 py-1.5 text-sm">
                {layout.packageName}
              </code>
            </div>
          </header>

          <div className="grid gap-12">
            <TopologyRegion as="section" className="scroll-mt-6" id="21.1" topology={topology}>
              <SectionHeader
                description={
                  layout.id === 'mdi-main'
                    ? 'A live section browser for the command bar, navigation, workspace canvas, and status bar.'
                    : 'A scaled working composition built from the shared design tokens.'
                }
                id="preview"
                title="Preview"
              />
              <UiLayoutPreview layoutId={layout.id} />
            </TopologyRegion>

            <TopologyRegion as="section" className="scroll-mt-6" id="21.2" topology={topology}>
              <SectionHeader description={layout.summary} id="usage" title="Usage" />
              <div className="grid gap-3 rounded-xl border p-5 sm:grid-cols-2">
                <UsageItem
                  description="Import from the public package path. Do not copy the source into an application."
                  title="Use the public export"
                />
                <UsageItem
                  description="Keep routes, records, permissions, and actions inside the consuming application."
                  title="Supply app-owned data"
                />
              </div>
            </TopologyRegion>

            <TopologyRegion as="section" className="scroll-mt-6" id="21.3" topology={topology}>
              <SectionHeader
                description="Copy this starting point and replace the example composition with your application content."
                id="code"
                title="Code"
              />
              <UiTemplateCode code={layout.code} />
            </TopologyRegion>

            <section className="scroll-mt-6" id="composition">
              <SectionHeader
                description="The shared package owns presentation. The application owns product behavior."
                title="Composition"
              />
              <div className="grid gap-4 sm:grid-cols-3">
                <CompositionItem label="Shared" value="Layout and tokens" />
                <CompositionItem label="Application" value="Routes and content" />
                <CompositionItem label="Module" value="Data and workflows" />
              </div>
            </section>
          </div>
        </article>

        <aside className="hidden lg:block">
          <div className="sticky top-8 grid gap-4">
            <div className="text-sm font-semibold">On this page</div>
            <Separator />
            <nav aria-label="On this page" className="grid gap-2.5 text-sm text-muted-foreground">
              {pageLinks.map((link) => (
                <a
                  className="transition-colors hover:text-foreground"
                  href={link.href}
                  key={link.href}
                >
                  {link.label}
                </a>
              ))}
            </nav>
          </div>
        </aside>
      </div>
    </TopologyRegion>
  )
}

function SectionHeader({
  description,
  id,
  title,
}: {
  description: string
  id?: string
  title: string
}) {
  return (
    <header className="grid gap-1.5 pb-4" id={id}>
      <h2 className="text-xl font-semibold tracking-tight">{title}</h2>
      <p className="max-w-3xl text-sm leading-6 text-muted-foreground">{description}</p>
    </header>
  )
}

function UsageItem({ description, title }: { description: string; title: string }) {
  return (
    <div className="flex gap-3">
      <CheckCircle2Icon className="mt-0.5 size-5 shrink-0 text-success" />
      <div className="grid gap-1">
        <h3 className="font-medium">{title}</h3>
        <p className="text-sm leading-6 text-muted-foreground">{description}</p>
      </div>
    </div>
  )
}

function CompositionItem({ label, value }: { label: string; value: string }) {
  return (
    <div className="grid gap-2 rounded-xl bg-muted/40 p-4">
      <PackageIcon className="size-5 text-muted-foreground" />
      <div className="text-sm font-semibold">{label}</div>
      <div className="text-sm text-muted-foreground">{value}</div>
    </div>
  )
}
