import { Badge } from '@codexsun/ui/components/badge'
import { AlertTriangle } from 'lucide-react'
import type { RuntimeFailureOverview } from './orchestration.types'

export function OrchestrationFailures({
  applicationId,
  overview,
}: {
  applicationId: string
  overview: RuntimeFailureOverview | undefined
}) {
  const failures =
    overview?.failures.filter((failure) => failure.application === applicationId) ?? []

  if (failures.length === 0) {
    return (
      <div className="flex min-h-48 flex-1 items-center justify-center p-6 text-sm text-muted-foreground">
        No captured runtime failures for {applicationId}.
      </div>
    )
  }

  return (
    <div className="min-h-0 flex-1 overflow-y-auto p-5">
      <div className="space-y-3">
        {failures.map((failure, index) => (
          <article
            className="border border-destructive/25 bg-destructive/5 p-4"
            key={`${failure.component}-${failure.time}-${index}`}
          >
            <div className="flex flex-wrap items-center gap-2">
              <AlertTriangle className="size-4 text-destructive" />
              <Badge variant="outline">{levelName(failure.level)}</Badge>
              <strong className="text-sm">{failure.component}</strong>
              <time className="ml-auto font-mono text-xs text-muted-foreground">
                {new Date(failure.time).toLocaleString()}
              </time>
            </div>
            <p className="mt-3 text-sm">{failure.msg}</p>
            <div className="mt-2 flex flex-wrap gap-x-4 text-xs text-muted-foreground">
              <span>{failure.event}</span>
              {failure.requestId ? <span>request {failure.requestId.slice(0, 8)}</span> : null}
              {failure.correlationId ? (
                <span>correlation {failure.correlationId.slice(0, 8)}</span>
              ) : null}
            </div>
          </article>
        ))}
      </div>
    </div>
  )
}

function levelName(level: number): string {
  if (level >= 60) return 'FATAL'
  if (level >= 50) return 'ERROR'
  return 'WARN'
}
