import { ArrowUpRight, BadgeCheck, LayoutPanelTop, RectangleHorizontal, TextCursorInput } from 'lucide-react'
import { Link } from 'react-router-dom'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { UiDocsPageShell } from '../components/docs-page-shell'

const componentCards = [
  {
    title: 'Button',
    href: '/admin/dashboard/ui/button',
    summary: 'Action patterns for primary, secondary, destructive, and low-emphasis flows.',
    icon: RectangleHorizontal,
  },
  {
    title: 'Badge',
    href: '/admin/dashboard/ui/badge',
    summary: 'Compact status markers for readiness, metadata, and semantic labels.',
    icon: BadgeCheck,
  },
  {
    title: 'Card',
    href: '/admin/dashboard/ui/card',
    summary: 'Structured surfaces for dashboards, panels, grouped content, and forms.',
    icon: LayoutPanelTop,
  },
  {
    title: 'Input',
    href: '/admin/dashboard/ui/input',
    summary: 'Field primitives for auth, search, setup, and admin data entry.',
    icon: TextCursorInput,
  },
] as const

export default function IndexPage() {
  return (
    <UiDocsPageShell
      title="UI workspace"
      description="Shared components, layout primitives, and implementation-ready patterns used across the Codexsun framework and app workspaces."
      activeHref="/admin/dashboard/ui"
    >
      <div className="grid gap-4 xl:grid-cols-[1.1fr_0.9fr]">
        <Card>
          <CardHeader>
            <CardTitle>What this workspace covers</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4 text-sm leading-7 text-muted-foreground">
            <p>
              The UI workspace documents the shared primitives used across the framework desk, ecommerce flows, billing screens, and future modules.
            </p>
            <p>
              Every example here imports from <code>@ui/components/ui</code> so teams can copy implementation-ready patterns directly into app surfaces.
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>How to use it</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3 text-sm leading-7 text-muted-foreground">
            <p>Open a component from the workspace cards below or switch sections with the animated tabs above.</p>
            <p>Each component page includes a live preview and implementation snippet so the behavior and usage stay together in one view.</p>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardContent className="grid gap-3 p-4 md:grid-cols-2 md:p-5 xl:grid-cols-4">
          {componentCards.map((item) => {
            const ItemIcon = item.icon

            return (
              <Link
                key={item.href}
                to={item.href}
                className="group rounded-[1rem] border border-border/70 bg-card/70 p-4 transition hover:-translate-y-0.5 hover:border-accent/40 hover:bg-card"
              >
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <p className="font-semibold text-foreground">{item.title}</p>
                    <p className="mt-2 text-sm leading-6 text-muted-foreground">{item.summary}</p>
                  </div>
                  <div className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-accent/10">
                    <ItemIcon className="size-5 text-accent" />
                  </div>
                </div>
                <div className="mt-3 inline-flex items-center gap-2 text-sm font-medium text-foreground">
                  Open view
                  <ArrowUpRight className="size-4 transition group-hover:translate-x-0.5 group-hover:-translate-y-0.5" />
                </div>
              </Link>
            )
          })}
        </CardContent>
      </Card>
    </UiDocsPageShell>
  )
}
