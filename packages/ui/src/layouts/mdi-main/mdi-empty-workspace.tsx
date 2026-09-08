import { LayoutGridIcon } from 'lucide-react'

export function MdiEmptyWorkspace({ workspaceTitle }: { workspaceTitle: string }) {
  return (
    <div className="grid size-full place-items-center">
      <div className="flex max-w-sm flex-col items-center gap-2 px-6 text-center">
        <div className="grid size-12 place-items-center rounded-xl border bg-background">
          <LayoutGridIcon className="size-5 text-muted-foreground" />
        </div>
        <h1 className="text-xl font-semibold tracking-tight">{workspaceTitle}</h1>
        <p className="text-sm leading-6 text-muted-foreground">
          A clean workspace for opening desks, documents, and application views.
        </p>
      </div>
    </div>
  )
}
