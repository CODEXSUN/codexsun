import { Link } from "react-router-dom"

import { Badge } from "@/components/ui/badge"
import { Card, CardContent } from "@/components/ui/card"
import {
  docsCategories,
  docsEntries,
} from "@/features/docs/data/catalog"
import { DocsEntryCard } from "@/features/docs/components/docs-entry-card"

type DocsBrowserProps = {
  basePath?: string
  showHeader?: boolean
}

export function DocsBrowser({
  basePath,
  showHeader = true,
}: DocsBrowserProps) {
  const totalBlocks = docsEntries.length
  const categoryCards = (
    <div className="grid gap-4 xl:grid-cols-2">
      {docsCategories.map((category) => (
        basePath ? (
          <Link
            key={category.id}
            to={`${basePath}/${category.items[0]}`}
            className="group overflow-hidden rounded-[1.5rem] border border-border/70 bg-card/90 transition hover:-translate-y-0.5 hover:border-accent/40 hover:bg-card"
          >
            <div className="flex min-h-52 items-center justify-center border-b border-border/60 bg-[linear-gradient(180deg,_rgba(255,255,255,0.9)_0%,_rgba(245,245,244,0.75)_100%)] px-5 py-6">
              {category.preview}
            </div>
            <div className="flex items-center justify-between gap-3 px-5 py-4">
              <div className="min-w-0">
                <p className="font-semibold text-foreground">{category.name}</p>
                <p className="text-sm text-muted-foreground">
                  {category.description}
                </p>
              </div>
              <Badge variant="outline">{category.items.length} blocks</Badge>
            </div>
          </Link>
        ) : (
          <a
            key={category.id}
            href={`#${category.items[0]}`}
            className="group overflow-hidden rounded-[1.5rem] border border-border/70 bg-card/90 transition hover:-translate-y-0.5 hover:border-accent/40 hover:bg-card"
          >
            <div className="flex min-h-52 items-center justify-center border-b border-border/60 bg-[linear-gradient(180deg,_rgba(255,255,255,0.9)_0%,_rgba(245,245,244,0.75)_100%)] px-5 py-6">
              {category.preview}
            </div>
            <div className="flex items-center justify-between gap-3 px-5 py-4">
              <div className="min-w-0">
                <p className="font-semibold text-foreground">{category.name}</p>
                <p className="text-sm text-muted-foreground">
                  {category.description}
                </p>
              </div>
              <Badge variant="outline">{category.items.length} blocks</Badge>
            </div>
          </a>
        )
      ))}
    </div>
  )

  return (
    <div className="space-y-5">
      {showHeader ? (
        <Card className="gap-0 overflow-hidden border-border/70 py-0 shadow-sm">
          <CardContent className="space-y-5 px-5 py-6 md:px-6">
            <div className="space-y-1">
              <h2 className="text-2xl font-semibold tracking-tight">
                Browse by Category
              </h2>
              <p className="text-sm text-muted-foreground">
                {docsCategories.length} categories - {totalBlocks} components total
              </p>
            </div>
            {categoryCards}
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-1">
          <p className="text-sm text-muted-foreground">
            {docsCategories.length} categories - {totalBlocks} components total
          </p>
          {categoryCards}
        </div>
      )}

      {basePath ? null : docsEntries.map((entry) => (
        <DocsEntryCard key={entry.id} entry={entry} />
      ))}
    </div>
  )
}
