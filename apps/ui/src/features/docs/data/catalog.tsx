import type { ReactNode } from "react"
import {
  AppWindow,
  BadgeCheck,
  LayoutPanelTop,
  MousePointerClick,
  PencilRuler,
  RectangleHorizontal,
} from "lucide-react"

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { Input } from "@/components/ui/input"

export type DocsExample = {
  id: string
  title: string
  code: string
  preview: ReactNode
}

export type DocsEntry = {
  id: string
  name: string
  description: string
  category: string
  icon: typeof MousePointerClick
  examples: DocsExample[]
}

export type DocsCategory = {
  id: string
  name: string
  description: string
  items: string[]
  preview: ReactNode
}

export const docsCategories: DocsCategory[] = [
  {
    id: "actions",
    name: "Actions",
    description: "Primary controls and lightweight affordances.",
    items: ["button", "badge"],
    preview: (
      <div className="mx-auto flex h-32 w-full max-w-[13rem] items-center justify-center rounded-[1.5rem] border border-border/70 bg-background/90 p-4">
        <div className="w-full space-y-3">
          <div className="h-3 w-16 rounded-full bg-muted" />
          <div className="h-4 w-full rounded-full bg-muted" />
          <div className="flex gap-2">
            <div className="h-9 flex-1 rounded-xl bg-foreground/20" />
            <div className="h-9 w-16 rounded-xl bg-muted" />
          </div>
        </div>
      </div>
    ),
  },
  {
    id: "forms",
    name: "Forms",
    description: "Input primitives for structured data capture.",
    items: ["input"],
    preview: (
      <div className="mx-auto flex h-32 w-full max-w-[15rem] flex-col justify-center gap-3">
        <div className="h-4 w-24 rounded-full bg-muted" />
        <div className="h-11 rounded-xl border border-border/70 bg-background/90" />
        <div className="h-11 rounded-xl border border-border/70 bg-background/90" />
      </div>
    ),
  },
  {
    id: "surfaces",
    name: "Surfaces",
    description: "Containers and identity elements for system UI.",
    items: ["card", "avatar"],
    preview: (
      <div className="mx-auto grid h-32 w-full max-w-[15rem] grid-cols-2 gap-3">
        <div className="rounded-[1.25rem] border border-border/70 bg-background/90 p-3">
          <div className="h-3 w-12 rounded-full bg-muted" />
          <div className="mt-3 space-y-2">
            <div className="h-3 w-full rounded-full bg-muted" />
            <div className="h-3 w-3/4 rounded-full bg-muted" />
          </div>
        </div>
        <div className="rounded-[1.25rem] border border-border/70 bg-background/90 p-3">
          <div className="size-9 rounded-2xl bg-muted" />
          <div className="mt-3 space-y-2">
            <div className="h-3 w-full rounded-full bg-muted" />
            <div className="h-3 w-2/3 rounded-full bg-muted" />
          </div>
        </div>
      </div>
    ),
  },
]

export const docsEntries: DocsEntry[] = [
  {
    id: "button",
    name: "Button",
    description: "Action hierarchy for primary, secondary, and quiet flows.",
    category: "actions",
    icon: MousePointerClick,
    examples: [
      {
        id: "default",
        title: "Default",
        code: `import { Button } from "@/components/ui/button"

export function Example() {
  return <Button>Save changes</Button>
}`,
        preview: <Button>Save changes</Button>,
      },
      {
        id: "outline",
        title: "Outline",
        code: `import { Button } from "@/components/ui/button"

export function Example() {
  return <Button variant="outline">Secondary action</Button>
}`,
        preview: <Button variant="outline">Secondary action</Button>,
      },
      {
        id: "ghost",
        title: "Ghost",
        code: `import { Button } from "@/components/ui/button"

export function Example() {
  return <Button variant="ghost">Quiet action</Button>
}`,
        preview: <Button variant="ghost">Quiet action</Button>,
      },
      {
        id: "sizes",
        title: "Sizes",
        code: `import { Button } from "@/components/ui/button"

export function Example() {
  return (
    <div className="flex gap-3">
      <Button size="sm">Small</Button>
      <Button>Default</Button>
      <Button size="lg">Large</Button>
    </div>
  )
}`,
        preview: (
          <div className="flex flex-wrap gap-3">
            <Button size="sm">Small</Button>
            <Button>Default</Button>
            <Button size="lg">Large</Button>
          </div>
        ),
      },
    ],
  },
  {
    id: "badge",
    name: "Badge",
    description: "Compact status markers for readiness, tags, and metadata.",
    category: "actions",
    icon: BadgeCheck,
    examples: [
      {
        id: "default",
        title: "Default",
        code: `import { Badge } from "@/components/ui/badge"

export function Example() {
  return <Badge>Active</Badge>
}`,
        preview: <Badge>Active</Badge>,
      },
      {
        id: "secondary",
        title: "Secondary",
        code: `import { Badge } from "@/components/ui/badge"

export function Example() {
  return <Badge variant="secondary">Foundation</Badge>
}`,
        preview: <Badge variant="secondary">Foundation</Badge>,
      },
      {
        id: "outline",
        title: "Outline",
        code: `import { Badge } from "@/components/ui/badge"

export function Example() {
  return <Badge variant="outline">Open source</Badge>
}`,
        preview: <Badge variant="outline">Open source</Badge>,
      },
      {
        id: "mixed",
        title: "Mixed set",
        code: `import { Badge } from "@/components/ui/badge"

export function Example() {
  return (
    <div className="flex gap-2">
      <Badge>Active</Badge>
      <Badge variant="secondary">Foundation</Badge>
      <Badge variant="outline">Docs</Badge>
    </div>
  )
}`,
        preview: (
          <div className="flex flex-wrap gap-2">
            <Badge>Active</Badge>
            <Badge variant="secondary">Foundation</Badge>
            <Badge variant="outline">Docs</Badge>
          </div>
        ),
      },
    ],
  },
  {
    id: "input",
    name: "Input",
    description: "Neutral field styling for forms, search, and admin tools.",
    category: "forms",
    icon: PencilRuler,
    examples: [
      {
        id: "default",
        title: "Default",
        code: `import { Input } from "@/components/ui/input"

export function Example() {
  return <Input placeholder="Workspace name" />
}`,
        preview: <Input placeholder="Workspace name" />,
      },
      {
        id: "email",
        title: "Email",
        code: `import { Input } from "@/components/ui/input"

export function Example() {
  return <Input type="email" placeholder="team@codexsun.com" />
}`,
        preview: <Input type="email" placeholder="team@codexsun.com" />,
      },
      {
        id: "form-stack",
        title: "Form stack",
        code: `import { Input } from "@/components/ui/input"

export function Example() {
  return (
    <div className="grid gap-3">
      <Input placeholder="First name" />
      <Input placeholder="Last name" />
      <Input type="email" placeholder="Email address" />
    </div>
  )
}`,
        preview: (
          <div className="grid max-w-md gap-3">
            <Input placeholder="First name" />
            <Input placeholder="Last name" />
            <Input type="email" placeholder="Email address" />
          </div>
        ),
      },
    ],
  },
  {
    id: "card",
    name: "Card",
    description: "Base container for dashboards, docs, and app overview modules.",
    category: "surfaces",
    icon: RectangleHorizontal,
    examples: [
      {
        id: "release-note",
        title: "Release note",
        code: `import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"

export function Example() {
  return (
    <Card className="max-w-sm">
      <CardHeader>
        <CardTitle>Release note</CardTitle>
        <CardDescription>Shipped to staging</CardDescription>
      </CardHeader>
      <CardContent>
        Shared UI primitives are now documented in the UI app.
      </CardContent>
    </Card>
  )
}`,
        preview: (
          <Card className="max-w-sm">
            <CardHeader>
              <CardTitle>Release note</CardTitle>
              <CardDescription>Shipped to staging</CardDescription>
            </CardHeader>
            <CardContent>
              Shared UI primitives are now documented in the UI app.
            </CardContent>
          </Card>
        ),
      },
      {
        id: "summary",
        title: "Summary",
        code: `import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"

export function Example() {
  return (
    <Card className="max-w-sm">
      <CardHeader>
        <CardTitle>System status</CardTitle>
      </CardHeader>
      <CardContent className="space-y-2">
        <p>Environment: production</p>
        <p>Driver: MariaDB</p>
      </CardContent>
    </Card>
  )
}`,
        preview: (
          <Card className="max-w-sm">
            <CardHeader>
              <CardTitle>System status</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              <p>Environment: production</p>
              <p>Driver: MariaDB</p>
            </CardContent>
          </Card>
        ),
      },
      {
        id: "highlight",
        title: "Highlight",
        code: `import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"

export function Example() {
  return (
    <Card className="mesh-panel max-w-sm overflow-hidden">
      <CardHeader>
        <CardTitle>Design system</CardTitle>
        <CardDescription>Shared baseline for all apps</CardDescription>
      </CardHeader>
      <CardContent>
        Use cards for modular surfaces, not full-page chrome.
      </CardContent>
    </Card>
  )
}`,
        preview: (
          <Card className="mesh-panel max-w-sm overflow-hidden">
            <CardHeader>
              <CardTitle>Design system</CardTitle>
              <CardDescription>Shared baseline for all apps</CardDescription>
            </CardHeader>
            <CardContent>
              Use cards for modular surfaces, not full-page chrome.
            </CardContent>
          </Card>
        ),
      },
    ],
  },
  {
    id: "avatar",
    name: "Avatar",
    description: "Compact user identity treatment for headers and sidebars.",
    category: "surfaces",
    icon: AppWindow,
    examples: [
      {
        id: "default",
        title: "Default",
        code: `import {
  Avatar,
  AvatarFallback,
  AvatarImage,
} from "@/components/ui/avatar"

export function Example() {
  return (
    <Avatar className="size-10 rounded-xl">
      <AvatarImage src="/logo.svg" alt="Codexsun" />
      <AvatarFallback className="rounded-xl">CN</AvatarFallback>
    </Avatar>
  )
}`,
        preview: (
          <Avatar className="size-10 rounded-xl">
            <AvatarImage src="/logo.svg" alt="Codexsun" />
            <AvatarFallback className="rounded-xl">CN</AvatarFallback>
          </Avatar>
        ),
      },
      {
        id: "with-meta",
        title: "With metadata",
        code: `import {
  Avatar,
  AvatarFallback,
  AvatarImage,
} from "@/components/ui/avatar"

export function Example() {
  return (
    <div className="flex items-center gap-4">
      <Avatar className="size-10 rounded-xl">
        <AvatarImage src="/logo.svg" alt="Codexsun" />
        <AvatarFallback className="rounded-xl">CN</AvatarFallback>
      </Avatar>
      <div className="space-y-1">
        <p className="text-sm font-medium">Codexsun UI</p>
        <p className="text-sm text-muted-foreground">Shared system identity</p>
      </div>
    </div>
  )
}`,
        preview: (
          <div className="flex items-center gap-4">
            <Avatar className="size-10 rounded-xl">
              <AvatarImage src="/logo.svg" alt="Codexsun" />
              <AvatarFallback className="rounded-xl">CN</AvatarFallback>
            </Avatar>
            <div className="space-y-1">
              <p className="text-sm font-medium">Codexsun UI</p>
              <p className="text-sm text-muted-foreground">Shared system identity</p>
            </div>
          </div>
        ),
      },
      {
        id: "sizes",
        title: "Sizes",
        code: `import {
  Avatar,
  AvatarFallback,
  AvatarImage,
} from "@/components/ui/avatar"

export function Example() {
  return (
    <div className="flex items-center gap-3">
      <Avatar className="size-8 rounded-lg">
        <AvatarFallback className="rounded-lg">SM</AvatarFallback>
      </Avatar>
      <Avatar className="size-10 rounded-xl">
        <AvatarFallback className="rounded-xl">MD</AvatarFallback>
      </Avatar>
      <Avatar className="size-12 rounded-2xl">
        <AvatarFallback className="rounded-2xl">LG</AvatarFallback>
      </Avatar>
    </div>
  )
}`,
        preview: (
          <div className="flex items-center gap-3">
            <Avatar className="size-8 rounded-lg">
              <AvatarFallback className="rounded-lg">SM</AvatarFallback>
            </Avatar>
            <Avatar className="size-10 rounded-xl">
              <AvatarFallback className="rounded-xl">MD</AvatarFallback>
            </Avatar>
            <Avatar className="size-12 rounded-2xl">
              <AvatarFallback className="rounded-2xl">LG</AvatarFallback>
            </Avatar>
          </div>
        ),
      },
    ],
  },
]

export const docsStats = [
  {
    label: "Components",
    value: String(docsEntries.length).padStart(2, "0"),
    icon: LayoutPanelTop,
  },
  {
    label: "Categories",
    value: String(docsCategories.length).padStart(2, "0"),
    icon: AppWindow,
  },
  {
    label: "Style",
    value: "Shadcn",
    icon: PencilRuler,
  },
]
