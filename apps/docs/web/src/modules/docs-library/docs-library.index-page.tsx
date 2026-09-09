import type { DocumentSummary } from '@codexsun/docs-contracts'
import { Badge } from '@codexsun/ui/components/badge'
import { BookOpen, FileText, FolderTree } from 'lucide-react'
import { getDocumentNavigationLabel, getDocsIndexGroups } from './docs-library.index'

export function DocsIndexPage({
  documents,
  onSelect,
}: {
  documents: DocumentSummary[]
  onSelect: (slug: string) => void
}) {
  const groups = getDocsIndexGroups(documents)

  return (
    <article className="w-full">
      <Badge variant="secondary">Repository index</Badge>
      <h1 className="mt-5 text-3xl font-bold tracking-tight">CODEXSUN documentation</h1>
      <p className="mt-3 max-w-3xl text-muted-foreground">
        Browse repository guidance by Assist area, application, module, shared package, and runtime
        owner.
      </p>
      <div className="mt-8 grid gap-3 sm:grid-cols-3">
        <IndexMetric icon={FileText} label="Documents" value={documents.length} />
        <IndexMetric icon={FolderTree} label="Groups" value={groups.length} />
        <IndexMetric icon={BookOpen} label="Source" value="Markdown + MDX" />
      </div>
      <div className="mt-10 space-y-10">
        {groups.map((group) => (
          <section key={group.id}>
            <div className="flex flex-wrap items-baseline justify-between gap-2 border-b pb-3">
              <div>
                <h2 className="m-0 text-xl font-semibold tracking-tight">{group.label}</h2>
                <p className="mt-1 text-sm text-muted-foreground">{group.description}</p>
              </div>
              <Badge variant="outline">{group.documents.length}</Badge>
            </div>
            <div className="mt-4 grid gap-3 md:grid-cols-2 xl:grid-cols-3">
              {group.documents.map((document) => (
                <button
                  className="group flex min-h-28 flex-col items-start rounded-lg border bg-card p-4 text-left transition-colors hover:border-primary/40 hover:bg-muted/40 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                  key={document.slug}
                  onClick={() => onSelect(document.slug)}
                >
                  <span className="font-medium group-hover:text-primary">
                    {getDocumentNavigationLabel(document)}
                  </span>
                  <span className="mt-2 line-clamp-2 text-sm text-muted-foreground">
                    {document.description || document.path}
                  </span>
                  <code className="mt-auto pt-3 text-xs text-muted-foreground">
                    {document.path}
                  </code>
                </button>
              ))}
            </div>
          </section>
        ))}
      </div>
    </article>
  )
}

function IndexMetric({
  icon: Icon,
  label,
  value,
}: {
  icon: typeof FileText
  label: string
  value: number | string
}) {
  return (
    <div className="flex items-center gap-3 rounded-lg border bg-muted/20 p-4">
      <Icon className="size-4 text-muted-foreground" />
      <div>
        <p className="font-semibold text-foreground">{value}</p>
        <p className="text-sm text-muted-foreground">{label}</p>
      </div>
    </div>
  )
}
