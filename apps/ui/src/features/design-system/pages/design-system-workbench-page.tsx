import type { ReactNode } from "react"
import { Link } from "react-router-dom"
import {
  Blocks,
  CheckCircle2,
  ClipboardList,
  Layers3,
  PackageCheck,
  Settings2,
} from "lucide-react"

import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardTitle } from "@/components/ui/card"
import { Checkbox } from "@/components/ui/checkbox"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Separator } from "@/components/ui/separator"
import { Switch } from "@/components/ui/switch"
import { Textarea } from "@/components/ui/textarea"
import { CopyCodeButton } from "@/features/docs/components/copy-code-button"
import { ViewCodeDialog } from "@/features/docs/components/view-code-dialog"
import {
  applicationBuildCoverage,
  applicationBuildReadiness,
  designSystemComponentDefaults,
  designSystemGovernanceSummary,
} from "../data/component-governance"
import { designSystemFormBlocks } from "../data/form-blocks"

function SignInPanelPreview() {
  return (
    <div className="mx-auto w-full max-w-md rounded-[1.25rem] border border-border/70 bg-card/80 p-5">
      <div className="space-y-1">
        <p className="text-lg font-semibold">Sign in</p>
        <p className="text-sm text-muted-foreground">
          Continue with your workspace account.
        </p>
      </div>
      <div className="mt-4 space-y-3">
        <div className="space-y-2">
          <Label htmlFor="sign-in-email">Email</Label>
          <Input id="sign-in-email" type="email" placeholder="team@company.com" />
        </div>
        <div className="space-y-2">
          <Label htmlFor="sign-in-password">Password</Label>
          <Input id="sign-in-password" type="password" />
        </div>
      </div>
      <div className="mt-4 space-y-3">
        <Button className="w-full">Sign in</Button>
        <Separator />
        <Button variant="outline" className="w-full">
          Sign in with SSO
        </Button>
      </div>
    </div>
  )
}

function SupportRequestFormPreview() {
  return (
    <div className="grid gap-4 rounded-[1.25rem] border border-border/70 bg-card/80 p-5">
      <div className="grid gap-4 md:grid-cols-2">
        <div className="space-y-2">
          <Label htmlFor="support-name">Name</Label>
          <Input id="support-name" placeholder="Ava Patel" />
        </div>
        <div className="space-y-2">
          <Label htmlFor="support-email">Email</Label>
          <Input id="support-email" type="email" placeholder="ava@company.com" />
        </div>
      </div>
      <div className="grid gap-4 md:grid-cols-2">
        <div className="space-y-2">
          <Label>Category</Label>
          <Select>
            <SelectTrigger className="w-full">
              <SelectValue placeholder="Select category" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="billing">Billing</SelectItem>
              <SelectItem value="product">Product</SelectItem>
              <SelectItem value="ops">Operations</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <div className="space-y-2">
          <Label>Priority</Label>
          <Select>
            <SelectTrigger className="w-full">
              <SelectValue placeholder="Select priority" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="low">Low</SelectItem>
              <SelectItem value="medium">Medium</SelectItem>
              <SelectItem value="high">High</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>
      <div className="space-y-2">
        <Label htmlFor="support-details">Details</Label>
        <Textarea id="support-details" placeholder="Describe the request..." />
      </div>
      <Label htmlFor="support-updates" className="gap-3">
        <Checkbox id="support-updates" defaultChecked />
        Email me updates about this request
      </Label>
      <Button>Submit request</Button>
    </div>
  )
}

function ProfileSettingsFormPreview() {
  return (
    <div className="space-y-4 rounded-[1.25rem] border border-border/70 bg-card/80 p-5">
      <div className="grid gap-4 md:grid-cols-2">
        <div className="space-y-2">
          <Label htmlFor="profile-name">Display name</Label>
          <Input id="profile-name" placeholder="Ava Patel" />
        </div>
        <div className="space-y-2">
          <Label htmlFor="profile-role">Job title</Label>
          <Input id="profile-role" placeholder="Operations lead" />
        </div>
      </div>
      <div className="space-y-2">
        <Label htmlFor="profile-bio">Bio</Label>
        <Textarea id="profile-bio" placeholder="Short profile summary" />
      </div>
      <Separator />
      <div className="flex items-center justify-between gap-4 rounded-xl border border-border/70 p-4">
        <div className="space-y-1">
          <p className="font-medium">Weekly digest</p>
          <p className="text-sm text-muted-foreground">
            Send a summary of account activity every Friday.
          </p>
        </div>
        <Switch defaultChecked />
      </div>
      <Button>Save changes</Button>
    </div>
  )
}

function FilterToolbarPreview() {
  return (
    <div className="grid gap-3 rounded-[1.25rem] border border-border/70 bg-card/80 p-5 lg:grid-cols-[minmax(0,1fr)_220px_auto]">
      <Input placeholder="Search by customer, order, or owner" />
      <Select>
        <SelectTrigger className="w-full">
          <SelectValue placeholder="Status" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="all">All statuses</SelectItem>
          <SelectItem value="active">Active</SelectItem>
          <SelectItem value="flagged">Flagged</SelectItem>
        </SelectContent>
      </Select>
      <div className="flex items-center gap-2">
        <Badge variant="outline">24 results</Badge>
        <Button variant="outline">Export</Button>
      </div>
      <div className="lg:col-span-3">
        <div className="flex flex-wrap gap-2">
          <Badge>All</Badge>
          <Badge variant="outline">Active</Badge>
          <Badge variant="outline">Flagged</Badge>
        </div>
      </div>
    </div>
  )
}

const formBlockPreviews: Record<string, ReactNode> = {
  "filter-toolbar": <FilterToolbarPreview />,
  "profile-settings-form": <ProfileSettingsFormPreview />,
  "sign-in-panel": <SignInPanelPreview />,
  "support-request-form": <SupportRequestFormPreview />,
}

const workspaceLinks = {
  blocks: "/dashboard/apps/ui/form-blocks",
  readiness: "/dashboard/apps/ui/build-readiness",
  settings: "/dashboard/apps/ui/design-settings",
}

export function DesignSystemDefaultsPage() {
  return (
    <div id="design-settings" className="space-y-5">
      <div className="grid gap-4 xl:grid-cols-3">
        <Card className="overflow-hidden border-border/70 py-0 shadow-sm">
          <CardContent className="flex items-center gap-4 px-5 py-5">
            <div className="flex size-11 items-center justify-center rounded-2xl border border-border/70 bg-background">
              <Settings2 className="size-5" />
            </div>
            <div>
              <p className="text-2xl font-semibold tracking-tight">
                {designSystemGovernanceSummary.governedComponents}
              </p>
              <p className="text-sm text-muted-foreground">Governed components</p>
            </div>
          </CardContent>
        </Card>
        <Card className="overflow-hidden border-border/70 py-0 shadow-sm">
          <CardContent className="flex items-center gap-4 px-5 py-5">
            <div className="flex size-11 items-center justify-center rounded-2xl border border-border/70 bg-background">
              <Layers3 className="size-5" />
            </div>
            <div>
              <p className="text-2xl font-semibold tracking-tight">
                {designSystemGovernanceSummary.defaultVariants}
              </p>
              <p className="text-sm text-muted-foreground">Default variants mapped</p>
            </div>
          </CardContent>
        </Card>
        <Card className="overflow-hidden border-border/70 py-0 shadow-sm">
          <CardContent className="flex items-center gap-4 px-5 py-5">
            <div className="flex size-11 items-center justify-center rounded-2xl border border-border/70 bg-background">
              <Blocks className="size-5" />
            </div>
            <div>
              <p className="text-2xl font-semibold tracking-tight">
                {designSystemGovernanceSummary.aliasedComponents}
              </p>
              <p className="text-sm text-muted-foreground">Components with aliases</p>
            </div>
          </CardContent>
        </Card>
      </div>

      <Card className="overflow-hidden border-border/70 py-0 shadow-sm">
        <CardContent className="space-y-4 px-5 py-6 md:px-6">
          <div className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
            <div className="space-y-1">
              <p className="text-xs font-semibold uppercase tracking-[0.22em] text-muted-foreground">
                Design Settings
              </p>
              <CardTitle>Project default component names and variants</CardTitle>
              <p className="max-w-3xl text-sm leading-6 text-muted-foreground">
                This is the source-controlled naming layer the project should use when
                implementing UI. Example: accordion now resolves to{" "}
                <span className="font-semibold text-foreground">contained</span>,
                not box.
              </p>
            </div>
            <div className="flex flex-wrap gap-2">
              <Badge variant="outline">Source controlled</Badge>
              <Badge variant="outline">Agent readable</Badge>
            </div>
          </div>
          <div className="grid gap-4 xl:grid-cols-2">
            {designSystemComponentDefaults.map((componentDefault) => (
              <Card
                key={componentDefault.componentId}
                className="overflow-hidden border-border/70 py-0 shadow-sm"
              >
                <CardContent className="space-y-4 px-5 py-5">
                  <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                    <div className="space-y-1">
                      <p className="text-lg font-semibold text-foreground">
                        {componentDefault.componentLabel}
                      </p>
                      <p className="text-sm text-muted-foreground">
                        {componentDefault.usage}
                      </p>
                    </div>
                    <Badge>{componentDefault.applicationName}</Badge>
                  </div>
                  <div className="grid gap-3 md:grid-cols-2">
                    <div className="rounded-xl border border-border/70 bg-muted/30 p-3">
                      <p className="text-xs font-semibold uppercase tracking-[0.18em] text-muted-foreground">
                        Code name
                      </p>
                      <p className="mt-2 text-sm font-medium text-foreground">
                        {componentDefault.applicationName}
                      </p>
                    </div>
                    <div className="rounded-xl border border-border/70 bg-muted/30 p-3">
                      <p className="text-xs font-semibold uppercase tracking-[0.18em] text-muted-foreground">
                        Default variant
                      </p>
                      <p className="mt-2 text-sm font-medium text-foreground">
                        {componentDefault.defaultExampleTitle}
                      </p>
                      <p className="mt-1 font-mono text-xs text-muted-foreground">
                        {componentDefault.defaultExampleId}
                      </p>
                    </div>
                  </div>
                  <div className="space-y-2">
                    <p className="text-xs font-semibold uppercase tracking-[0.18em] text-muted-foreground">
                      Aliases
                    </p>
                    <div className="flex flex-wrap gap-2">
                      {componentDefault.aliases.length > 0 ? (
                        componentDefault.aliases.map((alias) => (
                          <Badge key={alias} variant="outline">
                            {alias}
                          </Badge>
                        ))
                      ) : (
                        <Badge variant="outline">No legacy alias</Badge>
                      )}
                    </div>
                  </div>
                  <div className="rounded-xl border border-dashed border-border/80 bg-background p-3">
                    <p className="text-xs font-semibold uppercase tracking-[0.18em] text-muted-foreground">
                      Guidance
                    </p>
                    <p className="mt-2 text-sm leading-6 text-muted-foreground">
                      {componentDefault.notes}
                    </p>
                  </div>
                  <Link
                    to={`/dashboard/apps/ui/${componentDefault.componentId}`}
                    className="inline-flex text-sm font-medium text-primary hover:underline"
                  >
                    Open component entry
                  </Link>
                </CardContent>
              </Card>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}

export function DesignSystemBlocksPage() {
  return (
    <div id="form-blocks" className="space-y-5">
      <Card className="overflow-hidden border-border/70 py-0 shadow-sm">
        <CardContent className="space-y-4 px-5 py-6 md:px-6">
          <div className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
            <div className="space-y-1">
              <p className="text-xs font-semibold uppercase tracking-[0.22em] text-muted-foreground">
                Combined Blocks
              </p>
              <CardTitle>Reusable form-ready blocks</CardTitle>
              <p className="max-w-3xl text-sm leading-6 text-muted-foreground">
                These blocks combine multiple governed components into repeatable
                application patterns so new pages do not have to start from isolated
                primitives.
              </p>
            </div>
            <Link
              to={workspaceLinks.settings}
              className="text-sm font-medium text-primary hover:underline"
            >
              Review defaults first
            </Link>
          </div>
          <div className="grid gap-4">
            {designSystemFormBlocks.map((block) => (
              <Card
                key={block.id}
                className="overflow-hidden border-border/70 py-0 shadow-sm"
              >
                <CardContent className="grid gap-5 px-5 py-5 xl:grid-cols-[minmax(0,1.1fr)_minmax(320px,0.9fr)]">
                  <div className="space-y-4">
                    <div className="space-y-2">
                      <div className="flex items-center justify-between gap-3">
                        <p className="text-lg font-semibold text-foreground">
                          {block.name}
                        </p>
                        <div className="flex items-center gap-1">
                          <CopyCodeButton code={block.code} iconOnly />
                          <ViewCodeDialog
                            code={block.code}
                            title={block.name}
                            description={block.summary}
                          />
                        </div>
                      </div>
                      <p className="text-sm text-muted-foreground">
                        {block.summary}
                      </p>
                      <p className="text-sm leading-6 text-muted-foreground">
                        {block.description}
                      </p>
                    </div>
                    <div className="space-y-2">
                      <p className="text-xs font-semibold uppercase tracking-[0.18em] text-muted-foreground">
                        Included components
                      </p>
                      <div className="flex flex-wrap gap-2">
                        {block.componentIds.map((componentId) => (
                          <Badge key={componentId} variant="outline">
                            {componentId}
                          </Badge>
                        ))}
                      </div>
                    </div>
                  </div>
                  <div className="rounded-[1.5rem] border border-border/70 bg-[linear-gradient(180deg,_rgba(255,255,255,0.9)_0%,_rgba(245,245,244,0.75)_100%)] p-4">
                    {formBlockPreviews[block.id]}
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}

export function DesignSystemReadinessPage() {
  return (
    <div id="build-readiness" className="space-y-5">
      <div className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_320px]">
        <Card className="overflow-hidden border-border/70 py-0 shadow-sm">
          <CardContent className="space-y-4 px-5 py-6 md:px-6">
            <div className="space-y-1">
              <p className="text-xs font-semibold uppercase tracking-[0.22em] text-muted-foreground">
                Build Readiness
              </p>
              <CardTitle>Application build coverage</CardTitle>
              <p className="max-w-3xl text-sm leading-6 text-muted-foreground">
                This checklist confirms the core component channels required to build an
                application are present in the current catalog.
              </p>
            </div>
            <div className="grid gap-4">
              {applicationBuildReadiness.map((channel) => (
                <Card
                  key={channel.id}
                  className="overflow-hidden border-border/70 py-0 shadow-sm"
                >
                  <CardContent className="space-y-3 px-5 py-5">
                    <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                      <div className="space-y-1">
                        <p className="text-lg font-semibold text-foreground">
                          {channel.name}
                        </p>
                        <p className="text-sm text-muted-foreground">
                          {channel.summary}
                        </p>
                      </div>
                      <Badge
                        variant={
                          channel.status === "ready" ? "default" : "destructive"
                        }
                      >
                        {channel.status === "ready" ? "Ready" : "Missing"}
                      </Badge>
                    </div>
                    <div className="space-y-2">
                      <div className="h-2 rounded-full bg-muted">
                        <div
                          className="h-2 rounded-full bg-primary transition-all"
                          style={{ width: `${channel.coveragePercent}%` }}
                        />
                      </div>
                      <p className="text-sm text-muted-foreground">
                        {channel.presentComponentIds.length} /{" "}
                        {channel.requiredComponentIds.length} required components present
                      </p>
                    </div>
                    <div className="flex flex-wrap gap-2">
                      {channel.requiredComponentIds.map((componentId) => {
                        const isPresent = channel.presentComponentIds.includes(componentId)

                        return (
                          <Badge
                            key={componentId}
                            variant={isPresent ? "outline" : "destructive"}
                          >
                            {componentId}
                          </Badge>
                        )
                      })}
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </CardContent>
        </Card>

        <div className="space-y-4">
          <Card className="overflow-hidden border-border/70 py-0 shadow-sm">
            <CardContent className="space-y-3 px-5 py-5">
              <div className="flex items-center gap-3">
                <div className="flex size-10 items-center justify-center rounded-2xl border border-border/70 bg-background">
                  <PackageCheck className="size-5" />
                </div>
                <div>
                  <p className="text-lg font-semibold text-foreground">
                    {applicationBuildCoverage.presentCount} /{" "}
                    {applicationBuildCoverage.requiredCount}
                  </p>
                  <p className="text-sm text-muted-foreground">
                    Required components present
                  </p>
                </div>
              </div>
              <div className="rounded-xl border border-dashed border-border/80 bg-background p-3">
                <p className="text-sm leading-6 text-muted-foreground">
                  {applicationBuildCoverage.missingComponentIds.length === 0
                    ? "All required application-building component channels are present in the current catalog."
                    : `Missing components: ${applicationBuildCoverage.missingComponentIds.join(", ")}`}
                </p>
              </div>
            </CardContent>
          </Card>

          <Card className="overflow-hidden border-border/70 py-0 shadow-sm">
            <CardContent className="space-y-3 px-5 py-5">
              <div className="flex items-center gap-3">
                <div className="flex size-10 items-center justify-center rounded-2xl border border-border/70 bg-background">
                  <CheckCircle2 className="size-5" />
                </div>
                <div>
                  <p className="text-lg font-semibold text-foreground">
                    Design channel
                  </p>
                  <p className="text-sm text-muted-foreground">
                    Defaults and blocks are wired into the UI workspace.
                  </p>
                </div>
              </div>
              <div className="space-y-2 text-sm text-muted-foreground">
                <p>Use Design Settings to govern default names and variants.</p>
                <p>Use Form Blocks to start common application forms faster.</p>
                <p>Keep new UI work inside these governed channels before adding new primitives.</p>
              </div>
            </CardContent>
          </Card>

          <Card className="overflow-hidden border-border/70 py-0 shadow-sm">
            <CardContent className="space-y-3 px-5 py-5">
              <div className="flex items-center gap-3">
                <div className="flex size-10 items-center justify-center rounded-2xl border border-border/70 bg-background">
                  <ClipboardList className="size-5" />
                </div>
                <div>
                  <p className="text-lg font-semibold text-foreground">
                    Next step
                  </p>
                  <p className="text-sm text-muted-foreground">
                    Keep new pages aligned with governed defaults.
                  </p>
                </div>
              </div>
              <div className="flex flex-col gap-2">
                <Link
                  to={workspaceLinks.settings}
                  className="text-sm font-medium text-primary hover:underline"
                >
                  Open design settings
                </Link>
                <Link
                  to={workspaceLinks.blocks}
                  className="text-sm font-medium text-primary hover:underline"
                >
                  Open form blocks
                </Link>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}
