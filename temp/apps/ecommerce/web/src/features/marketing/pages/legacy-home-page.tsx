import { ArrowRight, CheckCircle2, Layers3, Sparkles, Workflow } from 'lucide-react'
import { Link } from 'react-router-dom'
import { navigationSections, productModules } from '@shared/index'
import { ThemeSwitcher } from '@/shared/theme/theme-switcher'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'

const heroMetrics = [
  { value: '3', label: 'Layouts ready' },
  { value: '4', label: 'Theme variants' },
  { value: '5', label: 'Starter pages' },
]

export function HomePage() {
  return (
    <div className="space-y-8 pb-6">
      <section className="grid gap-6 lg:grid-cols-[1.15fr_0.85fr]">
        <Card className="mesh-panel overflow-hidden">
          <CardHeader className="gap-4 p-8 sm:p-10">
            <div className="flex items-center justify-between gap-4">
              <Badge>ERP foundation</Badge>
              <ThemeSwitcher />
            </div>
            <div className="space-y-5">
              <h1 className="max-w-3xl text-5xl font-semibold leading-none tracking-tight text-foreground sm:text-6xl lg:text-7xl">
                Shared commerce operations across web, desktop, and finance-safe workflows.
              </h1>
              <p className="max-w-2xl text-lg leading-8 text-muted-foreground">
                The home surface now carries the requested icon-only theme menu, reusable Tailwind component primitives, and clear paths into the public site, authentication shell, and operator dashboard.
              </p>
            </div>
          </CardHeader>
          <CardContent className="grid gap-4 border-t border-border/60 bg-background/30 p-8 sm:grid-cols-3">
            {heroMetrics.map((metric) => (
              <div key={metric.label} className="rounded-[1.5rem] border border-border/60 bg-card/70 p-5">
                <p className="text-3xl font-semibold text-foreground">{metric.value}</p>
                <p className="mt-2 text-sm uppercase tracking-[0.18em] text-muted-foreground">
                  {metric.label}
                </p>
              </div>
            ))}
          </CardContent>
        </Card>

        <Card className="mesh-panel">
          <CardHeader>
            <Badge variant="outline">Launch map</Badge>
            <CardTitle>Build once, operate everywhere</CardTitle>
            <CardDescription>
              This increment focuses on reusable frontend structure without claiming finished ERP flows.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {[
              'Tailwind CSS tokens and neutral-first theming',
              'Reusable primitives modeled after shadcn component patterns',
              'Separate layouts for web, app, and auth surfaces',
              'A dashboard shell inspired by sidebar-08 composition',
            ].map((item) => (
              <div key={item} className="flex items-start gap-3 rounded-[1.25rem] bg-background/60 p-4">
                <CheckCircle2 className="mt-0.5 size-5 text-accent" />
                <p className="text-sm leading-6 text-muted-foreground">{item}</p>
              </div>
            ))}
            <div className="flex flex-wrap gap-3 pt-2">
              <Button asChild>
                <Link to="/admin/dashboard">
                  Open dashboard
                  <ArrowRight className="size-4" />
                </Link>
              </Button>
              <Button asChild variant="outline">
                <Link to="/login">View login</Link>
              </Button>
            </div>
          </CardContent>
        </Card>
      </section>

      <section className="grid gap-6 lg:grid-cols-3">
        {[
          {
            icon: Layers3,
            title: 'Reusable UI foundation',
            copy: 'Buttons, cards, inputs, dropdowns, sheets, avatars, and separators are now centralized for the web client.',
          },
          {
            icon: Workflow,
            title: 'Clear route separation',
            copy: 'Marketing, authentication, and operator views each get a dedicated layout to keep future work predictable.',
          },
          {
            icon: Sparkles,
            title: 'Theme-aware styling',
            copy: 'Light, dark, system, and accent selection all run through shared document-level tokens.',
          },
        ].map((feature) => (
          <Card key={feature.title}>
            <CardHeader>
              <div className="flex size-12 items-center justify-center rounded-2xl bg-accent/15">
                <feature.icon className="size-5 text-accent" />
              </div>
              <CardTitle>{feature.title}</CardTitle>
              <CardDescription>{feature.copy}</CardDescription>
            </CardHeader>
          </Card>
        ))}
      </section>

      <section className="grid gap-6 lg:grid-cols-[0.95fr_1.05fr]">
        <Card>
          <CardHeader>
            <Badge variant="outline">Product modules</Badge>
            <CardTitle>Readiness snapshot</CardTitle>
            <CardDescription>
              Shared package metadata still drives the module story, while the frontend now presents it with reusable cards.
            </CardDescription>
          </CardHeader>
          <CardContent className="grid gap-4">
            {productModules.slice(0, 6).map((module) => (
              <div
                key={module.id}
                className="flex items-start justify-between gap-3 rounded-[1.25rem] border border-border/70 p-4"
              >
                <div>
                  <p className="font-semibold text-foreground">{module.name}</p>
                  <p className="mt-1 text-sm leading-6 text-muted-foreground">{module.summary}</p>
                </div>
                <Badge variant={module.readiness === 'foundation' ? 'default' : 'secondary'}>
                  {module.readiness}
                </Badge>
              </div>
            ))}
          </CardContent>
        </Card>

        <Card className="mesh-panel">
          <CardHeader>
            <Badge variant="outline">Navigation map</Badge>
            <CardTitle>Workstreams aligned to the shared domain</CardTitle>
          </CardHeader>
          <CardContent className="grid gap-4 sm:grid-cols-3">
            {navigationSections.map((section) => (
              <div key={section.title} className="rounded-[1.5rem] bg-background/50 p-5">
                <p className="text-sm uppercase tracking-[0.18em] text-muted-foreground">
                  {section.title}
                </p>
                <div className="mt-4 space-y-3">
                  {section.moduleIds.map((moduleId) => (
                    <div
                      key={moduleId}
                      className="rounded-xl border border-border/70 bg-card/80 px-3 py-2 text-sm text-foreground"
                    >
                      {productModules.find((module) => module.id === moduleId)?.name ?? moduleId}
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </CardContent>
        </Card>
      </section>
    </div>
  )
}


