import {
  ArrowRightIcon,
  BellIcon,
  CheckCircle2Icon,
  CirclePlusIcon,
  QrCodeIcon,
  ShieldCheckIcon,
  SparklesIcon,
} from 'lucide-react'

import { Badge } from '../../components/badge'
import { Button } from '../../components/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../../components/card'
import { Input } from '../../components/input'
import { Progress, ProgressLabel, ProgressValue } from '../../components/progress'
import { Switch } from '../../components/switch'
import { Textarea } from '../../components/textarea'
import { TopologyRegion } from '../../features/interface-topology'
import { useMdiTopology } from '../../layouts/mdi-main'

export function UiOverview() {
  const topology = useMdiTopology()

  return (
    <TopologyRegion
      as="main"
      className="h-full overflow-y-auto bg-background"
      id="20"
      topology={topology}
    >
      <div className="mx-auto grid max-w-7xl gap-10 px-6 py-12 lg:px-10 lg:py-16">
        <header className="mx-auto grid max-w-3xl justify-items-center gap-5 text-center">
          <Badge className="gap-1.5" variant="secondary">
            <SparklesIcon className="size-3.5" /> CODEXSUN UI
          </Badge>
          <div className="grid gap-4">
            <h1 className="text-4xl font-semibold tracking-tight text-balance sm:text-5xl">
              Build coherent application workspaces
            </h1>
            <p className="mx-auto max-w-2xl text-base leading-7 text-muted-foreground sm:text-lg">
              Shared layouts, components, and semantic tokens give every application a consistent
              base without owning its business experience.
            </p>
          </div>
          <div className="flex flex-wrap justify-center gap-2">
            <Button render={<a href="/ui?layout=mdi-main" />}>
              Browse layouts <ArrowRightIcon />
            </Button>
            <Button render={<a href="#showcase" />} variant="outline">
              View system cards
            </Button>
          </div>
        </header>

        <div className="grid auto-rows-min gap-4 md:grid-cols-2 xl:grid-cols-4" id="showcase">
          <ComponentSampler />
          <ActivityCard />
          <GoalCard />
          <ConnectionCard />
          <TargetCard />
          <AccessCard />
          <PreferenceCard />
          <EmptyStateCard />
        </div>
      </div>
    </TopologyRegion>
  )
}

function ComponentSampler() {
  return (
    <Card className="xl:row-span-2">
      <CardHeader>
        <CardTitle>Component sampler</CardTitle>
        <CardDescription>Common controls share one visual language.</CardDescription>
      </CardHeader>
      <CardContent className="grid gap-4">
        <div className="flex flex-wrap gap-2">
          <Button size="sm">Primary</Button>
          <Button size="sm" variant="secondary">
            Secondary
          </Button>
          <Button size="sm" variant="outline">
            Outline
          </Button>
        </div>
        <Input aria-label="Workspace name example" placeholder="Workspace name" />
        <Textarea aria-label="Workspace note example" placeholder="Add a short workspace note" />
        <div className="flex items-center justify-between rounded-lg bg-muted/50 px-3 py-2.5">
          <span className="text-sm font-medium">Live updates</span>
          <Switch aria-label="Toggle live updates" defaultChecked />
        </div>
      </CardContent>
    </Card>
  )
}

function ActivityCard() {
  const barClasses = [
    'h-12 bg-foreground/30',
    'h-20 bg-foreground/45',
    'h-16 bg-foreground/40',
    'h-24 bg-foreground/65',
    'h-[4.5rem] bg-foreground/50',
    'h-28 bg-foreground/85',
  ]
  return (
    <Card className="md:col-span-1 xl:row-span-2">
      <CardHeader>
        <CardTitle>Release activity</CardTitle>
        <CardDescription>Approved changes over six weeks.</CardDescription>
      </CardHeader>
      <CardContent className="grid gap-5">
        <div className="flex h-32 items-end gap-2">
          {barClasses.map((className) => (
            <div className={`${className} flex-1 rounded-t-md`} key={className} />
          ))}
        </div>
        <div className="grid grid-cols-2 gap-3">
          <Metric label="Ready" value="28" />
          <Metric label="In review" value="7" />
        </div>
      </CardContent>
    </Card>
  )
}

function GoalCard() {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Plan a milestone</CardTitle>
        <CardDescription>Keep important delivery targets visible.</CardDescription>
      </CardHeader>
      <CardContent className="grid gap-3">
        <Input aria-label="Milestone name" defaultValue="Design system rollout" />
        <div className="grid grid-cols-2 gap-2">
          <Input aria-label="Target date" defaultValue="Sep 30" />
          <Input aria-label="Owners" defaultValue="4 owners" />
        </div>
        <Button className="w-full">Create milestone</Button>
      </CardContent>
    </Card>
  )
}

function ConnectionCard() {
  return (
    <Card className="text-center">
      <CardContent className="grid justify-items-center gap-3 py-3">
        <div className="grid size-24 place-items-center rounded-2xl bg-muted">
          <QrCodeIcon className="size-14" strokeWidth={1.4} />
        </div>
        <div className="grid gap-1">
          <CardTitle>Connect a device</CardTitle>
          <CardDescription>Scan from a trusted CODEXSUN client.</CardDescription>
        </div>
      </CardContent>
    </Card>
  )
}

function TargetCard() {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Adoption target</CardTitle>
        <CardDescription>Shared layout use across active applications.</CardDescription>
      </CardHeader>
      <CardContent className="grid gap-4">
        <Progress value={72}>
          <ProgressLabel>Workspace coverage</ProgressLabel>
          <ProgressValue>{() => '72%'}</ProgressValue>
        </Progress>
        <div className="flex items-center gap-2 text-sm text-success">
          <CheckCircle2Icon className="size-4" /> Four applications connected
        </div>
      </CardContent>
    </Card>
  )
}

function AccessCard() {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Access review</CardTitle>
        <CardDescription>Confirm sensitive workspace changes.</CardDescription>
      </CardHeader>
      <CardContent className="grid gap-3">
        <div className="flex items-start gap-3 rounded-lg bg-muted/45 p-3">
          <ShieldCheckIcon className="mt-0.5 size-5 shrink-0" />
          <div>
            <div className="text-sm font-medium">Policy checks passed</div>
            <div className="text-sm text-muted-foreground">Last reviewed 12 minutes ago.</div>
          </div>
        </div>
        <Button className="w-full" variant="outline">
          Review access
        </Button>
      </CardContent>
    </Card>
  )
}

function PreferenceCard() {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Workspace signals</CardTitle>
        <CardDescription>Choose which events need attention.</CardDescription>
      </CardHeader>
      <CardContent className="grid gap-3">
        <PreferenceRow defaultChecked icon={BellIcon} label="Security alerts" />
        <PreferenceRow defaultChecked label="Milestone updates" />
        <PreferenceRow label="Weekly summary" />
      </CardContent>
    </Card>
  )
}

function EmptyStateCard() {
  return (
    <Card className="text-center">
      <CardContent className="grid justify-items-center gap-3 py-5">
        <span className="grid size-10 place-items-center rounded-full bg-muted">
          <CirclePlusIcon className="size-5" />
        </span>
        <div className="grid gap-1">
          <CardTitle>Create your first block</CardTitle>
          <CardDescription>Compose primitives without copying app-local UI.</CardDescription>
        </div>
        <Button render={<a href="/ui?layout=mdi-main" />} size="sm">
          Open layouts
        </Button>
      </CardContent>
    </Card>
  )
}

function Metric({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-lg bg-muted/50 p-3">
      <div className="text-lg font-semibold tabular-nums">{value}</div>
      <div className="text-sm text-muted-foreground">{label}</div>
    </div>
  )
}

function PreferenceRow({
  defaultChecked,
  icon: Icon,
  label,
}: {
  defaultChecked?: boolean
  icon?: typeof BellIcon
  label: string
}) {
  return (
    <label className="flex items-center gap-3 rounded-lg px-1 py-1.5">
      <span className="grid size-5 shrink-0 place-items-center">
        {Icon ? <Icon className="size-4" /> : null}
      </span>
      <span className="min-w-0 flex-1 text-sm font-medium">{label}</span>
      <Switch aria-label={label} defaultChecked={defaultChecked} size="sm" />
    </label>
  )
}
