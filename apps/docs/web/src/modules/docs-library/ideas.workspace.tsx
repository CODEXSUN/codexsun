import { Badge } from '@codexsun/ui/components/badge'
import { Card, CardContent, CardHeader, CardTitle } from '@codexsun/ui/components/card'
import { TopologyRegion } from '@codexsun/ui/features/interface-topology'
import { useMdiTopology } from '@codexsun/ui/layouts/mdi-main'
import {
  ArrowRightIcon,
  BlocksIcon,
  ClipboardCheckIcon,
  DatabaseIcon,
  NetworkIcon,
  ShieldCheckIcon,
} from 'lucide-react'
import { DocsLibraryHeader } from './docs-library.header'

const deliveryStages = [
  [
    '1',
    'Durable module runtime',
    'Installed-module state and a checksum-protected migration ledger.',
  ],
  [
    '2',
    'Request and diagnostics',
    'Request context, cancellation, readiness details, and lifecycle diagnostics.',
  ],
  [
    '3',
    'Identity extension points',
    'Identity as an application module with named authentication and policy boundaries.',
  ],
  [
    '4',
    'Events and background work',
    'Typed events first; durable outbox and jobs only for a real consumer.',
  ],
  ['5', 'Client platform adapters', 'Shared contracts before Tauri or Expo adapters are approved.'],
] as const

export function IdeasWorkspace() {
  const topology = useMdiTopology()
  return (
    <TopologyRegion
      as="div"
      className="flex size-full min-h-0 flex-col"
      id="11"
      topology={topology}
    >
      <DocsLibraryHeader title="Development plan" />
      <div className="docs-reader-scroll flex-1 overflow-y-auto">
        <div className="mx-auto w-4/5 max-w-[120rem] px-6 py-10 lg:px-10">
          <TopologyRegion className="max-w-4xl" id="11.1" topology={topology}>
            <Badge variant="secondary">Ideas</Badge>
            <h1 className="mt-5 text-3xl font-bold tracking-tight">What we are developing</h1>
            <p className="mt-4 max-w-3xl text-base leading-7 text-muted-foreground">
              CODEXSUN is a modular application platform. The framework remains small and
              runtime-neutral; Platform Core supplies reusable technical contracts; applications
              select infrastructure; business modules own their domain behavior.
            </p>
          </TopologyRegion>

          <TopologyRegion className="mt-10" id="11.2" topology={topology}>
            <h2 className="text-xl font-semibold">Development flow</h2>
            <p className="mt-2 text-sm text-muted-foreground">
              Every capability follows this order before it becomes shared platform behavior.
            </p>
            <div className="mt-5 grid gap-3 lg:grid-cols-[1fr_auto_1fr_auto_1fr_auto_1fr] lg:items-center">
              <FlowStep
                icon={ClipboardCheckIcon}
                title="Real consumer"
                detail="A named product need"
              />
              <FlowArrow />
              <FlowStep
                icon={BlocksIcon}
                title="Owned contract"
                detail="Stable and business-free"
              />
              <FlowArrow />
              <FlowStep
                icon={NetworkIcon}
                title="Application proof"
                detail="Composition and failure flow"
              />
              <FlowArrow />
              <FlowStep
                icon={ShieldCheckIcon}
                title="Verified release"
                detail="Tests, docs, and lifecycle"
              />
            </div>
          </TopologyRegion>

          <TopologyRegion className="mt-12" id="11.3" topology={topology}>
            <h2 className="text-xl font-semibold">Ownership pattern</h2>
            <div className="mt-5 grid gap-4 md:grid-cols-3">
              <PatternCard
                icon={BlocksIcon}
                title="Framework"
                detail="Manifests, validation, composition plans, lifecycle ordering, and diagnostics only."
              />
              <PatternCard
                icon={NetworkIcon}
                title="Platform Core"
                detail="Reusable HTTP, request context, health, shutdown, and technical adapter contracts."
              />
              <PatternCard
                icon={DatabaseIcon}
                title="Application and module"
                detail="Concrete infrastructure, selected modules, migrations, data, routes, and domain workflows."
              />
            </div>
          </TopologyRegion>

          <TopologyRegion className="mt-12" id="11.4" topology={topology}>
            <h2 className="text-xl font-semibold">Five-stage delivery plan</h2>
            <ol className="mt-5 grid gap-3 lg:grid-cols-5">
              {deliveryStages.map(([number, title, detail]) => (
                <li key={number} className="relative">
                  <Card className="h-full" size="sm">
                    <CardHeader>
                      <Badge variant="outline">Stage {number}</Badge>
                      <CardTitle>{title}</CardTitle>
                    </CardHeader>
                    <CardContent className="leading-6 text-muted-foreground">{detail}</CardContent>
                  </Card>
                </li>
              ))}
            </ol>
          </TopologyRegion>

          <TopologyRegion className="mt-12 border-t pt-6" id="11.5" topology={topology}>
            <h2 className="text-xl font-semibold">Guardrails</h2>
            <p className="mt-3 max-w-4xl leading-7 text-muted-foreground">
              No reflection-based dependency injection, service locator, generic CRUD engine, or
              business behavior in shared packages. A shared capability must have an owner, a real
              consumer, explicit failure behavior, and focused verification.
            </p>
          </TopologyRegion>
        </div>
      </div>
    </TopologyRegion>
  )
}

function FlowStep({
  detail,
  icon: Icon,
  title,
}: {
  detail: string
  icon: typeof BlocksIcon
  title: string
}) {
  return (
    <div className="flex min-h-28 flex-col justify-center gap-2 rounded-xl border bg-card p-4">
      <Icon className="size-5 text-muted-foreground" />
      <h3 className="font-semibold">{title}</h3>
      <p className="text-sm text-muted-foreground">{detail}</p>
    </div>
  )
}

function FlowArrow() {
  return <ArrowRightIcon className="mx-auto size-5 rotate-90 text-muted-foreground lg:rotate-0" />
}

function PatternCard({
  detail,
  icon: Icon,
  title,
}: {
  detail: string
  icon: typeof BlocksIcon
  title: string
}) {
  return (
    <Card>
      <CardHeader>
        <Icon className="size-5 text-muted-foreground" />
        <CardTitle>{title}</CardTitle>
      </CardHeader>
      <CardContent className="leading-6 text-muted-foreground">{detail}</CardContent>
    </Card>
  )
}
