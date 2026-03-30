import { resolveProjectComponentName } from "./component-governance"

export type DesignSystemFormBlock = {
  id: string
  name: string
  summary: string
  description: string
  componentIds: string[]
  code: string
}

export const designSystemFormBlocks: DesignSystemFormBlock[] = [
  {
    id: "sign-in-panel",
    name: "Sign In Panel",
    summary: "Authentication block with single-column credentials and action footer.",
    description:
      "Use for sign-in, invite acceptance, and account access checkpoints.",
    componentIds: ["card", "input", "button", "separator"],
    code: `import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Separator } from "@/components/ui/separator"

export function SignInPanel() {
  return (
    <Card className="mx-auto w-full max-w-md">
      <CardContent className="space-y-5 p-6">
        <div className="space-y-1">
          <h2 className="text-xl font-semibold">Sign in</h2>
          <p className="text-sm text-muted-foreground">
            Continue with the project defaults.
          </p>
        </div>
        <div className="space-y-3">
          <div className="space-y-2">
            <Label htmlFor="email">Email</Label>
            <Input id="email" type="email" placeholder="team@company.com" />
          </div>
          <div className="space-y-2">
            <Label htmlFor="password">Password</Label>
            <Input id="password" type="password" />
          </div>
        </div>
        <Button className="w-full">Sign in</Button>
        <Separator />
        <Button variant="outline" className="w-full">
          Sign in with SSO
        </Button>
      </CardContent>
    </Card>
  )
}

// Defaults: button -> ${resolveProjectComponentName("button")}, input -> ${resolveProjectComponentName("input")}, card -> ${resolveProjectComponentName("card")}`,
  },
  {
    id: "support-request-form",
    name: "Support Request Form",
    summary: "Multi-field support form with routed category, urgency, and details.",
    description:
      "Use for contact, issue reporting, and operational service requests.",
    componentIds: ["card", "input", "select", "textarea", "button", "checkbox"],
    code: `import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
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
import { Textarea } from "@/components/ui/textarea"

export function SupportRequestForm() {
  return (
    <Card>
      <CardContent className="grid gap-4 p-6">
        <div className="grid gap-4 md:grid-cols-2">
          <div className="space-y-2">
            <Label htmlFor="name">Name</Label>
            <Input id="name" placeholder="Ava Patel" />
          </div>
          <div className="space-y-2">
            <Label htmlFor="email">Email</Label>
            <Input id="email" type="email" placeholder="ava@company.com" />
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
          <Label htmlFor="details">Details</Label>
          <Textarea id="details" placeholder="Describe the request..." />
        </div>
        <Label htmlFor="updates" className="gap-3">
          <Checkbox id="updates" />
          Email me status updates
        </Label>
        <Button>Submit request</Button>
      </CardContent>
    </Card>
  )
}

// Defaults: select -> ${resolveProjectComponentName("select")}, textarea -> ${resolveProjectComponentName("textarea")}, checkbox -> ${resolveProjectComponentName("checkbox")}`,
  },
  {
    id: "profile-settings-form",
    name: "Profile Settings Form",
    summary: "Settings block with profile fields, preferences, and immediate toggles.",
    description:
      "Use for account settings, organization preferences, and profile editing.",
    componentIds: ["card", "input", "textarea", "switch", "button", "separator"],
    code: `import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Separator } from "@/components/ui/separator"
import { Switch } from "@/components/ui/switch"
import { Textarea } from "@/components/ui/textarea"

export function ProfileSettingsForm() {
  return (
    <Card>
      <CardContent className="space-y-5 p-6">
        <div className="grid gap-4 md:grid-cols-2">
          <div className="space-y-2">
            <Label htmlFor="display-name">Display name</Label>
            <Input id="display-name" placeholder="Ava Patel" />
          </div>
          <div className="space-y-2">
            <Label htmlFor="job-title">Job title</Label>
            <Input id="job-title" placeholder="Operations lead" />
          </div>
        </div>
        <div className="space-y-2">
          <Label htmlFor="bio">Bio</Label>
          <Textarea id="bio" placeholder="Short profile summary" />
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
      </CardContent>
    </Card>
  )
}

// Defaults: switch -> ${resolveProjectComponentName("switch")}, separator -> ${resolveProjectComponentName("separator")}`,
  },
  {
    id: "filter-toolbar",
    name: "Filter Toolbar",
    summary: "Compact listing filter block with search, segmented status, and actions.",
    description:
      "Use above tables and result lists where filtering is part of the main workflow.",
    componentIds: ["input", "select", "button", "tabs", "badge"],
    code: `import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs"

export function FilterToolbar() {
  return (
    <div className="grid gap-3 rounded-2xl border border-border/70 bg-card/70 p-4 lg:grid-cols-[minmax(0,1fr)_220px_auto]">
      <Input placeholder="Search by customer, order, or owner" />
      <Select>
        <SelectTrigger className="w-full">
          <SelectValue placeholder="Status" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="all">All statuses</SelectItem>
          <SelectItem value="open">Open</SelectItem>
          <SelectItem value="closed">Closed</SelectItem>
        </SelectContent>
      </Select>
      <div className="flex items-center gap-2">
        <Badge variant="outline">24 results</Badge>
        <Button variant="outline">Export</Button>
      </div>
      <Tabs defaultValue="all" className="lg:col-span-3">
        <TabsList>
          <TabsTrigger value="all">All</TabsTrigger>
          <TabsTrigger value="active">Active</TabsTrigger>
          <TabsTrigger value="flagged">Flagged</TabsTrigger>
        </TabsList>
      </Tabs>
    </div>
  )
}

// Defaults: tabs -> ${resolveProjectComponentName("tabs")}, badge -> ${resolveProjectComponentName("badge")}`,
  },
]
