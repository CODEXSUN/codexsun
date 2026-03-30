import { ArrowUpRight, GitFork } from "lucide-react"

import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import type { DocsTemplate } from "@/docs/data/templates"

export function DocsTemplateCard({
  template,
}: {
  template: DocsTemplate
}) {
  return (
    <Card className="overflow-hidden border-border/70 bg-card/90 py-0 shadow-sm">
      <CardContent className="space-y-5 px-5 py-5">
        <div className="theme-preview-surface rounded-[1.5rem] border border-dashed border-border/70 p-5">
          <div className="flex items-start justify-between gap-4">
            <div className="space-y-2">
              <Badge variant="outline">{template.category.name}</Badge>
              <div>
                <h3 className="text-lg font-semibold tracking-tight">
                  {template.name}
                </h3>
                <p className="mt-2 text-sm leading-6 text-muted-foreground">
                  {template.description}
                </p>
              </div>
            </div>
            <div className="rounded-2xl border border-border/70 bg-background px-3 py-2 text-right">
              <p className="text-xs font-semibold uppercase tracking-[0.2em] text-muted-foreground">
                Sections
              </p>
              <p className="mt-1 text-xl font-semibold tracking-tight">
                {template.sections.length}
              </p>
            </div>
          </div>

          <div className="mt-5 flex flex-wrap gap-2">
            {template.features.slice(0, 4).map((feature) => (
              <Badge key={feature} variant="secondary">
                {feature}
              </Badge>
            ))}
          </div>
        </div>

        <div className="space-y-2">
          <p className="text-xs font-semibold uppercase tracking-[0.18em] text-muted-foreground">
            Included Sections
          </p>
          <div className="flex flex-wrap gap-2">
            {template.sections.map((section) => (
              <Badge key={section} variant="outline">
                {section}
              </Badge>
            ))}
          </div>
        </div>

        <div className="flex flex-wrap gap-3">
          <Button asChild>
            <a href={template.url} target="_blank" rel="noreferrer">
              Live Preview
              <ArrowUpRight className="size-4" />
            </a>
          </Button>
          <Button asChild variant="outline">
            <a
              href={`https://github.com/${template.repo}`}
              target="_blank"
              rel="noreferrer"
            >
              GitHub
              <GitFork className="size-4" />
            </a>
          </Button>
        </div>
      </CardContent>
    </Card>
  )
}
