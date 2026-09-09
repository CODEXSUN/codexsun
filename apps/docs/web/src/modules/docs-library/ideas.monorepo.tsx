import { Badge } from '@codexsun/ui/components/badge'
import { Card, CardContent, CardHeader, CardTitle } from '@codexsun/ui/components/card'
import { TopologyRegion } from '@codexsun/ui/features/interface-topology'
import { useMdiTopology } from '@codexsun/ui/layouts/mdi-main'
import {
  ArrowDownIcon,
  ArrowRightIcon,
  BoxesIcon,
  CheckCircle2Icon,
  PackageIcon,
} from 'lucide-react'

const applications = [
  ['Platform', 'Shared browser host and HTTP composition.'],
  ['Docs', 'Repository documentation indexing and editing.'],
  ['DevKit', 'Project planning registry and confirmations.'],
  ['Zetro', 'Agent chat, tasks, projects, and desktop host.'],
  ['Orship', 'Local service observation and guarded controls.'],
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
          Multiple applications, one repository
        </h1>
        <p className="mt-4 max-w-3xl text-base leading-7 text-muted-foreground">
          A monorepo shares standards and technical packages. It does not make every application one
          system. Each application stays deployable, testable, and accountable for its own work.
        </p>
      </TopologyRegion>

      <TopologyRegion className="mt-10" id="11.12" topology={topology}>
        <h2 className="text-xl font-semibold">CODEXSUN application map</h2>
        <p className="mt-2 text-sm text-muted-foreground">
          Shared packages support applications through public exports. The runtime holder selects
          the required applications for an assembled environment.
        </p>
        <div className="mt-5 rounded-xl border bg-muted/30 p-5 sm:p-7">
          <div className="mx-auto max-w-sm rounded-xl border bg-card p-4 text-center">
            <PackageIcon className="mx-auto size-5 text-muted-foreground" />
            <h3 className="mt-2 font-semibold">Shared packages</h3>
            <p className="mt-1 text-sm text-muted-foreground">
              Framework, Platform Core, UI, and runtime
            </p>
          </div>
          <ArrowDownIcon className="mx-auto my-3 size-5 text-muted-foreground" />
          <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-5">
            {applications.map(([title, detail]) => (
              <Card key={title} className="h-full">
                <CardHeader>
                  <BoxesIcon className="size-5 text-muted-foreground" />
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

      <TopologyRegion className="mt-12" id="11.14" topology={topology}>
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

      <TopologyRegion className="mt-12 border-t pt-6" id="11.15" topology={topology}>
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
