import { Badge } from '@codexsun/ui/components/badge'
import { Card, CardContent, CardHeader, CardTitle } from '@codexsun/ui/components/card'
import { TopologyRegion } from '@codexsun/ui/features/interface-topology'
import { useMdiTopology } from '@codexsun/ui/layouts/mdi-main'
import {
  ArrowDownIcon,
  ArrowRightIcon,
  BlocksIcon,
  BookOpenIcon,
  BoxesIcon,
  CheckCircle2Icon,
  Code2Icon,
  ComponentIcon,
  LayoutPanelTopIcon,
  MonitorIcon,
  PackageIcon,
  PaletteIcon,
  ServerCogIcon,
  ShieldCheckIcon,
  WrenchIcon,
} from 'lucide-react'

const applications = [
  {
    color: 'text-sky-600 dark:text-sky-400',
    detail: 'Shared browser host, Identity composition, and platform HTTP service.',
    icon: MonitorIcon,
    title: 'Platform',
  },
  {
    color: 'text-fuchsia-600 dark:text-fuchsia-400',
    detail: 'Independent UI showcase, documentation pages, and visual verification.',
    icon: ComponentIcon,
    title: 'UI',
  },
  {
    color: 'text-pink-600 dark:text-pink-400',
    detail:
      'Gallery routes, live specimens, examples, and package export guidance for browser teams.',
    icon: LayoutPanelTopIcon,
    title: 'UI Web',
  },
  {
    color: 'text-blue-600 dark:text-blue-400',
    detail: 'Repository documentation discovery, reading, editing, and health checks.',
    icon: BookOpenIcon,
    title: 'Docs',
  },
  {
    color: 'text-violet-600 dark:text-violet-400',
    detail: 'Project planning registry, module profiles, and confirmation workflow.',
    icon: WrenchIcon,
    title: 'DevKit',
  },
  {
    color: 'text-indigo-600 dark:text-indigo-400',
    detail: 'Agent chat, tasks, projects, and desktop conversation host.',
    icon: BoxesIcon,
    title: 'Zetro',
  },
  {
    color: 'text-emerald-600 dark:text-emerald-400',
    detail: 'Local service observation, deployment catalog, and guarded controls.',
    icon: ShieldCheckIcon,
    title: 'Orship',
  },
] as const

const sharedPackages = [
  {
    color: 'text-amber-600 dark:text-amber-400',
    detail: 'Module manifests, lifecycle validation, dependency ordering, and diagnostics.',
    icon: BlocksIcon,
    path: 'packages/framework',
    title: 'Framework',
  },
  {
    color: 'text-cyan-600 dark:text-cyan-400',
    detail: 'Reusable HTTP, request context, health, shutdown, and public technical contracts.',
    icon: Code2Icon,
    path: 'packages/platform-core',
    title: 'Platform Core',
  },
  {
    color: 'text-fuchsia-600 dark:text-fuchsia-400',
    detail: 'Tokens, Button, Table, Form, MDI layout, templates, hooks, and Tailwind theme.',
    icon: PaletteIcon,
    path: 'packages/ui',
    title: 'UI',
  },
  {
    color: 'text-orange-600 dark:text-orange-400',
    detail: 'Deployment catalog validation, dependency resolution, and immutable assembly plans.',
    icon: ServerCogIcon,
    path: 'packages/runtime',
    title: 'Runtime',
  },
] as const

const monorepoPractices = [
  [
    'One install',
    'Install dependencies at the repository root. Keep one lockfile and one node_modules folder.',
  ],
  [
    'Clear workspace edges',
    'Applications do not import each other’s private source. Shared packages expose public contracts.',
  ],
  [
    'Independent ownership',
    'Each application keeps its routes, modules, migrations, and operational records.',
  ],
  [
    'Selected assembly',
    'The runtime catalog selects the applications and packages for a local or customer deployment.',
  ],
] as const

export function IdeasMonorepo() {
  const topology = useMdiTopology()
  return (
    <div className="mx-auto w-4/5 max-w-[120rem] px-6 py-10 lg:px-10">
      <TopologyRegion className="max-w-4xl" id="11.11" topology={topology}>
        <Badge variant="secondary">Architecture idea</Badge>
        <h1 className="mt-5 text-3xl font-bold tracking-tight">
          Shared packages and application ownership
        </h1>
        <p className="mt-4 max-w-3xl text-base leading-7 text-muted-foreground">
          CODEXSUN keeps reusable technical capabilities in shared packages and product behavior in
          source-owned applications. One repository gives teams a common foundation without merging
          every application into one product.
        </p>
      </TopologyRegion>

      <TopologyRegion className="mt-10" id="11.12" topology={topology}>
        <h2 className="text-xl font-semibold">How the repository fits together</h2>
        <p className="mt-2 text-sm text-muted-foreground">
          Applications consume the public exports of shared packages. They do not import another
          application’s private source. The runtime selects the applications needed for an
          environment.
        </p>
        <div className="mt-5 rounded-xl border bg-muted/30 p-5 sm:p-7">
          <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-4">
            {sharedPackages.map(({ color, detail, icon: Icon, path, title }) => (
              <Card key={title} className="h-full border-border/80 bg-card">
                <CardHeader>
                  <Icon className={`size-5 ${color}`} />
                  <CardTitle>{title}</CardTitle>
                </CardHeader>
                <CardContent className="space-y-3 text-sm leading-6 text-muted-foreground">
                  <p>{detail}</p>
                  <code className="block text-xs text-foreground/80">{path}</code>
                </CardContent>
              </Card>
            ))}
          </div>
          <ArrowDownIcon className="mx-auto my-3 size-5 text-muted-foreground" />
          <div className="mx-auto max-w-md rounded-xl border bg-card p-4 text-center">
            <PackageIcon className="mx-auto size-5 text-muted-foreground" />
            <h3 className="mt-2 font-semibold">Shared packages</h3>
            <p className="mt-1 text-sm text-muted-foreground">
              Public contracts and package-owned tests connect the technical foundation to each
              application.
            </p>
          </div>
          <ArrowDownIcon className="mx-auto my-3 size-5 text-muted-foreground" />
          <p className="mb-3 text-center text-sm font-medium text-muted-foreground">
            Source-owned applications compose those public capabilities.
          </p>
          <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-6">
            {applications.map(({ color, detail, icon: Icon, title }) => (
              <Card key={title} className="h-full">
                <CardHeader>
                  <Icon className={`size-5 ${color}`} />
                  <CardTitle>{title}</CardTitle>
                </CardHeader>
                <CardContent className="text-sm leading-6 text-muted-foreground">
                  {detail}
                </CardContent>
              </Card>
            ))}
          </div>
          <ArrowDownIcon className="mx-auto my-3 size-5 text-muted-foreground" />
          <div className="mx-auto max-w-xl rounded-xl border bg-card p-4 text-center">
            <h3 className="font-semibold">Runtime holder and deployment catalog</h3>
            <p className="mt-1 text-sm text-muted-foreground">
              Validates dependencies and creates one selected deployment plan.
            </p>
          </div>
        </div>
      </TopologyRegion>

      <TopologyRegion className="mt-12" id="11.13" topology={topology}>
        <h2 className="text-xl font-semibold">What the shared UI package contains</h2>
        <p className="mt-2 max-w-4xl text-sm leading-6 text-muted-foreground">
          <code>packages/ui</code> is the visual foundation for every browser application. It owns
          reusable presentation behavior, not business screens, workflows, or application data.
        </p>
        <div className="mt-5 grid gap-4 md:grid-cols-2 xl:grid-cols-4">
          <SharedUiCard
            detail="Color, typography, spacing, radius, elevation, motion, and the shared Tailwind theme."
            icon={PaletteIcon}
            title="Tokens and theme"
          />
          <SharedUiCard
            detail="Accessible controls such as Button, Input, Dialog, Tabs, Badge, and Tooltip."
            icon={ComponentIcon}
            title="Primitives"
          />
          <SharedUiCard
            detail="Reusable Table, Form, Auth, and Workspace surfaces with typed public contracts."
            icon={LayoutPanelTopIcon}
            title="Blocks and templates"
          />
          <SharedUiCard
            detail="The MDI shell, sidebar, top menu, status bar, hooks, and responsive layout behavior."
            icon={MonitorIcon}
            title="Application layout"
          />
        </div>
      </TopologyRegion>

      <TopologyRegion className="mt-12" id="11.14" topology={topology}>
        <h2 className="text-xl font-semibold">Shared UI versus application UI</h2>
        <div className="mt-5 grid gap-4 lg:grid-cols-2">
          <OwnershipCard
            color="text-fuchsia-600 dark:text-fuchsia-400"
            detail="Build once when the visual behavior is reusable across applications. Export it from @codexsun/ui and keep it free of business fields, API calls, routes, and persistence."
            icon={PaletteIcon}
            items={[
              'Design tokens and Tailwind theme',
              'Buttons, dialogs, tables, and form frames',
              'MDI layout, templates, hooks, and accessibility behavior',
            ]}
            title="Shared UI owns"
          />
          <OwnershipCard
            color="text-sky-600 dark:text-sky-400"
            detail="Keep product meaning and workflows with the application or its module. Compose shared UI here instead of copying or modifying package-owned primitives."
            icon={BoxesIcon}
            items={[
              'Business pages, domain forms, routes, and view state',
              'API calls, validation, persistence, and module workflows',
              'Application-specific content and user decisions',
            ]}
            title="Applications own"
          />
        </div>
      </TopologyRegion>

      <TopologyRegion className="mt-12" id="11.15" topology={topology}>
        <h2 className="text-xl font-semibold">How the model stays maintainable</h2>
        <ol className="mt-5 grid gap-3 lg:grid-cols-2">
          {monorepoPractices.map(([title, detail], index) => (
            <li key={title} className="flex gap-4 rounded-xl border bg-card p-5">
              <span className="flex size-8 shrink-0 items-center justify-center rounded-full bg-muted text-sm font-semibold">
                {index + 1}
              </span>
              <div>
                <h3 className="font-semibold">{title}</h3>
                <p className="mt-1 leading-6 text-muted-foreground">{detail}</p>
              </div>
            </li>
          ))}
        </ol>
      </TopologyRegion>

      <TopologyRegion className="mt-12" id="11.16" topology={topology}>
        <h2 className="text-xl font-semibold">Single application and multi-app repository</h2>
        <div className="mt-5 grid gap-4 lg:grid-cols-[1fr_auto_1fr] lg:items-stretch">
          <ComparisonCard
            detail="One domain, one release path, and few internal boundaries. This is simpler when the product remains small."
            title="Single application"
          />
          <ArrowRightIcon className="mx-auto size-5 rotate-90 self-center text-muted-foreground lg:rotate-0" />
          <ComparisonCard
            detail="Several source-owned applications share standards, packages, and selected deployment plans. Their domain behavior stays separate."
            title="CODEXSUN multi-app repository"
          />
        </div>
      </TopologyRegion>

      <TopologyRegion className="mt-12 border-t pt-6" id="11.17" topology={topology}>
        <h2 className="text-xl font-semibold">Before a cross-application change</h2>
        <ul className="mt-4 grid gap-3 md:grid-cols-2">
          <ChecklistItem text="Choose the owning application or shared package." />
          <ChecklistItem text="Define the public contract before importing or integrating." />
          <ChecklistItem text="Run the owner checks and the affected application build." />
          <ChecklistItem text="Update the owner README and development record." />
        </ul>
      </TopologyRegion>
    </div>
  )
}

function SharedUiCard({
  detail,
  icon: Icon,
  title,
}: {
  detail: string
  icon: typeof PaletteIcon
  title: string
}) {
  return (
    <Card className="h-full border-fuchsia-500/20 bg-fuchsia-500/5">
      <CardHeader>
        <Icon className="size-5 text-fuchsia-600 dark:text-fuchsia-400" />
        <CardTitle>{title}</CardTitle>
      </CardHeader>
      <CardContent className="text-sm leading-6 text-muted-foreground">{detail}</CardContent>
    </Card>
  )
}

function OwnershipCard({
  color,
  detail,
  icon: Icon,
  items,
  title,
}: {
  color: string
  detail: string
  icon: typeof PaletteIcon
  items: readonly string[]
  title: string
}) {
  return (
    <Card className="h-full">
      <CardHeader>
        <Icon className={`size-5 ${color}`} />
        <CardTitle>{title}</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4 text-sm leading-6 text-muted-foreground">
        <p>{detail}</p>
        <ul className="space-y-2">
          {items.map((item) => (
            <li className="flex gap-2" key={item}>
              <CheckCircle2Icon className={`mt-1 size-3.5 shrink-0 ${color}`} />
              {item}
            </li>
          ))}
        </ul>
      </CardContent>
    </Card>
  )
}

function ComparisonCard({ detail, title }: { detail: string; title: string }) {
  return (
    <Card className="h-full">
      <CardHeader>
        <CardTitle>{title}</CardTitle>
      </CardHeader>
      <CardContent className="leading-6 text-muted-foreground">{detail}</CardContent>
    </Card>
  )
}

function ChecklistItem({ text }: { text: string }) {
  return (
    <li className="flex items-start gap-3 rounded-lg border bg-card px-4 py-3 text-sm leading-6">
      <CheckCircle2Icon className="mt-0.5 size-4 shrink-0 text-muted-foreground" />
      {text}
    </li>
  )
}
