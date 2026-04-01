import type { ReactNode } from 'react'
import { useMemo } from 'react'
import { useNavigate } from 'react-router-dom'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { AnimatedTabs, type AnimatedContentTab } from '@/components/ui/animated-tabs'

const docsNavItems = [
  { title: 'Introduction', href: '/admin/dashboard/ui' },
  { title: 'Button', href: '/admin/dashboard/ui/button' },
  { title: 'Badge', href: '/admin/dashboard/ui/badge' },
  { title: 'Card', href: '/admin/dashboard/ui/card' },
  { title: 'Input', href: '/admin/dashboard/ui/input' },
] as const

export function UiDocsPageShell({
  title,
  description,
  activeHref,
  children,
}: {
  title: string
  description: string
  activeHref: string
  children: ReactNode
}) {
  const navigate = useNavigate()
  const tabs = useMemo<AnimatedContentTab[]>(
    () => docsNavItems.map((item) => ({
      label: item.title,
      value: item.href,
      content: children,
      contentClassName: 'mt-0 rounded-[1rem] border border-border/70 bg-card p-4 md:p-5',
    })),
    [children],
  )

  return (
    <div className="space-y-3">
      <Card className="mesh-panel overflow-hidden">
        <CardHeader className="border-b border-border/60 px-5 py-5 md:px-6 md:py-6">
          <div className="space-y-3">
            <Badge className="w-fit px-4 py-1.5">UI</Badge>
            <div className="max-w-3xl space-y-2">
              <CardTitle className="text-xl tracking-tight sm:text-2xl">{title}</CardTitle>
              <p className="max-w-2xl text-sm leading-6 text-muted-foreground">
                {description}
              </p>
            </div>
          </div>
        </CardHeader>
      </Card>

      <AnimatedTabs
        tabs={tabs}
        selectedTabValue={activeHref}
        onTabChange={(value) => {
          if (value !== activeHref) {
            navigate(value)
          }
        }}
      />
    </div>
  )
}
