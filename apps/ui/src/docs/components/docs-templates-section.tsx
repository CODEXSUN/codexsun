import { Badge } from "@/components/ui/badge"
import { Card, CardContent } from "@/components/ui/card"
import { DocsTemplateCard } from "@/docs/components/docs-template-card"
import {
  docsTemplateCategories,
  docsTemplates,
} from "@/registry/data/catalog"

export function DocsTemplatesSection() {
  return <DocsTemplatesSectionContent />
}

export function DocsTemplatesSectionContent({
  categorySlug,
}: {
  categorySlug?: string
}) {
  const visibleTemplates = categorySlug
    ? docsTemplates.filter((template) => template.category.slug === categorySlug)
    : docsTemplates
  const visibleCategories = categorySlug
    ? docsTemplateCategories.filter((category) => category.slug === categorySlug)
    : docsTemplateCategories

  return (
    <div id="templates" className="space-y-5">
      <Card className="overflow-hidden border-border/70 py-0 shadow-sm">
        <CardContent className="space-y-5 px-5 py-6 md:px-6">
          <div className="flex flex-col gap-3 md:flex-row md:items-end md:justify-between">
            <div className="space-y-2">
              <p className="text-xs font-semibold uppercase tracking-[0.24em] text-muted-foreground">
                Templates
              </p>
              <div>
                <h2 className="text-2xl font-semibold tracking-tight">
                  Docs Templates
                </h2>
                <p className="mt-1 text-sm text-muted-foreground">
                  Imported starter templates published alongside the component catalog.
                </p>
              </div>
            </div>
            <div className="flex flex-wrap gap-2">
              {visibleCategories.map((category) => (
                <Badge key={category.slug} variant="outline">
                  {category.name}
                </Badge>
              ))}
            </div>
          </div>

          <div className="grid gap-4 xl:grid-cols-2">
            {visibleTemplates.map((template) => (
              <DocsTemplateCard key={template.slug} template={template} />
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}

