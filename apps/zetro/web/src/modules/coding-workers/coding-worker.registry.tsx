import { GitBranch } from 'lucide-react'
import type { CodingWorkerAttempt } from '@codexsun/zetro-contracts'

export function CodingWorkerRegistry({ attempts }: { attempts: CodingWorkerAttempt[] }) {
  return (
    <div className="flex min-h-full flex-col gap-2 p-3">
      <div className="flex items-center justify-between px-2 py-2 text-sm font-medium">
        <span>Worker queue</span>
        <span className="text-xs font-normal text-muted-foreground">
          {attempts.length} prepared
        </span>
      </div>
      <div aria-label="Worker queue" className="grid gap-1">
        {attempts.map((attempt) => (
          <div className="flex items-center gap-2 px-2 py-2.5" key={attempt.id}>
            <GitBranch className="size-4 shrink-0 text-muted-foreground" />
            <span className="min-w-0 flex-1">
              <span className="block truncate text-sm font-medium">{attempt.branchName}</span>
              <span className="block truncate text-xs text-muted-foreground">{attempt.status}</span>
            </span>
          </div>
        ))}
        {attempts.length === 0 ? (
          <p className="px-2 py-8 text-center text-sm text-muted-foreground">
            Confirm a task review to prepare an isolated worker.
          </p>
        ) : null}
      </div>
    </div>
  )
}
