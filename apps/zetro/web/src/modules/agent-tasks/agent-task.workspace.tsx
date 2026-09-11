import { lazy, Suspense } from 'react'
import { ClipboardList } from 'lucide-react'
import type { AgentTaskDraft } from '@codexsun/zetro-contracts'

const MarkdownContent = lazy(() =>
  import('@codexsun/ui/components/markdown-content').then((module) => ({
    default: module.MarkdownContent,
  })),
)

export function AgentTaskWorkspace({ task }: { task?: AgentTaskDraft }) {
  if (!task) {
    return (
      <div className="grid size-full place-items-center p-8 text-center">
        <div>
          <ClipboardList className="mx-auto size-8 text-muted-foreground" />
          <h1 className="mt-4 text-lg font-semibold">No task draft selected</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Send a completed chat response to create one.
          </p>
        </div>
      </div>
    )
  }
  return (
    <section className="size-full overflow-y-auto bg-background px-5 py-6 sm:px-8 lg:px-12">
      <div className="mx-auto max-w-5xl">
        <div className="flex flex-wrap items-start justify-between gap-4 border-b pb-5">
          <div>
            <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
              Agent task draft
            </p>
            <h1 className="mt-1 text-xl font-semibold">{task.title}</h1>
          </div>
          <span className="rounded-full border bg-muted px-3 py-1 text-xs font-medium">
            Awaiting approval
          </span>
        </div>
        <section className="border-b py-6">
          <h2 className="text-sm font-semibold">Source prompt</h2>
          <p className="mt-3 whitespace-pre-wrap text-sm leading-6">{task.sourcePrompt}</p>
        </section>
        <section className="py-6">
          <h2 className="mb-3 text-sm font-semibold">Proposed work</h2>
          <Suspense fallback={<p className="text-sm text-muted-foreground">Loading draft…</p>}>
            <MarkdownContent content={task.sourceResponse} />
          </Suspense>
        </section>
        <p className="border-t pt-4 text-xs text-muted-foreground">
          Approval and execution controls are intentionally added in the next governed phase.
        </p>
      </div>
    </section>
  )
}
