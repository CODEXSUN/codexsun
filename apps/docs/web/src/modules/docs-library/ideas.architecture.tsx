import { Badge } from '@codexsun/ui/components/badge'
import { Card, CardContent, CardHeader, CardTitle } from '@codexsun/ui/components/card'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@codexsun/ui/components/table'
import { TopologyRegion } from '@codexsun/ui/features/interface-topology'
import { useMdiTopology } from '@codexsun/ui/layouts/mdi-main'
import {
  ArrowRightIcon,
  BookOpenCheckIcon,
  ClipboardCheckIcon,
  FileCheck2Icon,
  GitPullRequestArrowIcon,
  ShieldCheckIcon,
  UsersRoundIcon,
} from 'lucide-react'

const architectureStandards = [
  {
    detail: 'Each application and module owns its domain rules, routes, data, and records.',
    title: 'Name one owner',
  },
  {
    detail: 'Share stable contracts and public package exports. Do not share private source files.',
    title: 'Protect boundaries',
  },
  {
    detail: 'Validate input at the API edge. Keep dependency direction toward the domain.',
    title: 'Control dependencies',
  },
  {
    detail: 'Record the decision. Run focused checks. Review the changed boundary.',
    title: 'Prove each change',
  },
] as const

const repositoryComparison = [
  ['Source ownership', 'Apps own business behavior. Packages own reusable technical behavior.'],
  ['Public contracts', 'Sibling modules use public index exports and versioned HTTP contracts.'],
  [
    'Contributor guidance',
    'AGENTS, Assist standards, module READMEs, and development records guide each change.',
  ],
  [
    'Integration and release',
    'npm workspaces and the runtime catalog build selected applications together.',
  ],
] as const

export function IdeasArchitectureStandards() {
  const topology = useMdiTopology()
  return (
    <div className="mx-auto w-4/5 max-w-[120rem] px-6 py-10 lg:px-10">
      <TopologyRegion className="max-w-4xl" id="11.6" topology={topology}>
        <Badge variant="secondary">Architecture idea</Badge>
        <h1 className="mt-5 text-3xl font-bold tracking-tight">Global architecture standards</h1>
        <p className="mt-4 max-w-3xl text-base leading-7 text-muted-foreground">
          A multi-developer repository stays understandable when every change has an owner,
          contract, boundary, and proof. These rules guide a team without centralizing product work.
        </p>
      </TopologyRegion>

      <TopologyRegion className="mt-10" id="11.7" topology={topology}>
        <h2 className="text-xl font-semibold">The change path</h2>
        <p className="mt-2 text-sm text-muted-foreground">
          Use the same path for a new module, a shared capability, or a cross-application change.
        </p>
        <ol className="mt-5 grid gap-3 lg:grid-cols-[1fr_auto_1fr_auto_1fr_auto_1fr_auto_1fr] lg:items-center">
          <ChangeStep
            detail="Describe the user or product need."
            icon={ClipboardCheckIcon}
            title="Need"
          />
          <FlowArrow />
          <ChangeStep
            detail="Choose the application or package owner."
            icon={UsersRoundIcon}
            title="Owner"
          />
          <FlowArrow />
          <ChangeStep
            detail="Define the public contract and failure case."
            icon={BookOpenCheckIcon}
            title="Contract"
          />
          <FlowArrow />
          <ChangeStep
            detail="Implement inside the owning boundary."
            icon={GitPullRequestArrowIcon}
            title="Change"
          />
          <FlowArrow />
          <ChangeStep
            detail="Run checks, review, and record the result."
            icon={ShieldCheckIcon}
            title="Proof"
          />
        </ol>
      </TopologyRegion>

      <TopologyRegion className="mt-12" id="11.8" topology={topology}>
        <h2 className="text-xl font-semibold">Team standards</h2>
        <div className="mt-5 grid gap-4 md:grid-cols-2 xl:grid-cols-4">
          {architectureStandards.map((standard) => (
            <Card key={standard.title} className="h-full">
              <CardHeader>
                <FileCheck2Icon className="size-5 text-muted-foreground" />
                <CardTitle>{standard.title}</CardTitle>
              </CardHeader>
              <CardContent className="leading-6 text-muted-foreground">
                {standard.detail}
              </CardContent>
            </Card>
          ))}
        </div>
      </TopologyRegion>

      <TopologyRegion className="mt-12" id="11.9" topology={topology}>
        <h2 className="text-xl font-semibold">CODEXSUN compared with the standard</h2>
        <div className="mt-5 overflow-x-auto rounded-xl border">
          <Table className="min-w-[46rem] text-left">
            <TableHeader className="bg-muted/60 text-foreground">
              <TableRow>
                <TableHead className="px-4 py-3 font-semibold">Global standard</TableHead>
                <TableHead className="px-4 py-3 font-semibold">
                  Current repository pattern
                </TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {repositoryComparison.map(([standard, implementation]) => (
                <TableRow key={standard}>
                  <TableCell className="px-4 py-3 align-top font-medium">{standard}</TableCell>
                  <TableCell className="px-4 py-3 leading-6 whitespace-normal text-muted-foreground">
                    {implementation}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      </TopologyRegion>

      <TopologyRegion className="mt-12 border-t pt-6" id="11.10" topology={topology}>
        <h2 className="text-xl font-semibold">Working agreement</h2>
        <p className="mt-3 max-w-4xl leading-7 text-muted-foreground">
          A developer first reads the owner guidance. The developer then changes one boundary,
          validates that boundary, and records the decision. Shared code grows only after a real
          application proves the need.
        </p>
      </TopologyRegion>
    </div>
  )
}

function ChangeStep({
  detail,
  icon: Icon,
  title,
}: {
  detail: string
  icon: typeof ClipboardCheckIcon
  title: string
}) {
  return (
    <li className="flex min-h-36 flex-col justify-center gap-2 rounded-xl border bg-card p-4">
      <Icon className="size-5 text-muted-foreground" />
      <h3 className="font-semibold">{title}</h3>
      <p className="text-sm leading-5 text-muted-foreground">{detail}</p>
    </li>
  )
}

function FlowArrow() {
  return <ArrowRightIcon className="mx-auto size-5 rotate-90 text-muted-foreground lg:rotate-0" />
}
