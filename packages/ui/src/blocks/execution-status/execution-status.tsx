import { CheckCircle2, Circle, Clock3, PauseCircle, TriangleAlert, XCircle } from 'lucide-react'
import { useState, type ReactNode } from 'react'
import { Button } from '../../components/button'
import { Progress } from '../../components/progress'
import { Spinner } from '../../components/spinner'

export type ExecutionStatusProps = {
  state: 'active' | 'idle' | 'complete' | 'attention'
  title: string
  description: string
  elapsed: string
  metrics: readonly { label: string; value: string | number }[]
  animated?: boolean
  checks?: readonly {
    label: string
    state: 'passed' | 'failed' | 'checking' | 'pending' | 'expired'
  }[]
  actions?: ReactNode
  splash?: boolean
}

/** Presentation only. The caller owns execution, freshness, and measured values. */
export function ExecutionStatus({
  state,
  title,
  description,
  elapsed,
  metrics,
  animated = true,
  checks = [],
  actions,
  splash = false,
}: ExecutionStatusProps) {
  const [compact, setCompact] = useState(false)
  const Icon =
    state === 'complete' ? CheckCircle2 : state === 'attention' ? TriangleAlert : PauseCircle
  const content = (
    <section className="grid gap-5 rounded-xl border bg-muted/20 p-6" aria-label="Execution status">
      <div className="flex flex-wrap items-center gap-5">
        <div className="flex size-16 shrink-0 items-center justify-center rounded-full border bg-background">
          {state === 'active' ? (
            <Spinner className="size-8 text-primary" animated={animated} aria-label={title} />
          ) : (
            <Icon
              className={
                state === 'complete'
                  ? 'size-8 text-success'
                  : state === 'attention'
                    ? 'size-8 text-warning'
                    : 'size-8 text-muted-foreground'
              }
              aria-hidden="true"
            />
          )}
        </div>
        <div className="min-w-0 flex-1 basis-40">
          <p className="text-xs font-medium uppercase tracking-widest text-muted-foreground">
            Execution signal
          </p>
          <h3 className="pt-1 text-lg font-semibold" role="status">
            {title}
          </h3>
          <p className="pt-1 text-sm text-muted-foreground">{description}</p>
        </div>
        <span className="shrink-0 text-xl font-medium tabular-nums">{elapsed}</span>
      </div>
      {state === 'active' && <Progress value={null} animated={animated} aria-label={title} />}
      <dl className="flex flex-wrap gap-x-8 gap-y-3">
        {metrics.map(({ label, value }) => (
          <div key={label} className="grid gap-1">
            <dt className="text-sm text-muted-foreground">{label}</dt>
            <dd className="text-base font-medium tabular-nums">{value}</dd>
          </div>
        ))}
      </dl>
      {!compact && <ExecutionChecks checks={checks} />}
      {actions && <div className="flex flex-wrap gap-3">{actions}</div>}
    </section>
  )
  if (!splash) return content
  return (
    <main
      className="fixed inset-0 z-50 overflow-y-auto bg-background p-6"
      aria-label="Application startup"
    >
      <div className="mx-auto grid min-h-full max-w-2xl content-center gap-4 py-12">{content}</div>
      <div className="fixed bottom-4 right-4">
        <Button
          variant="outline"
          size="sm"
          aria-pressed={compact}
          onClick={() => setCompact(!compact)}
        >
          {compact ? 'Show check details' : 'Compact view'}
        </Button>
      </div>
    </main>
  )
}

export function ExecutionChecks({ checks }: Pick<ExecutionStatusProps, 'checks'>) {
  return (
    <ul className="grid gap-3" aria-label="Readiness checks">
      {checks?.map(({ label, state }) => {
        const Icon =
          state === 'passed'
            ? CheckCircle2
            : state === 'failed'
              ? XCircle
              : state === 'expired'
                ? Clock3
                : Circle
        const tone =
          state === 'passed'
            ? 'text-success'
            : state === 'failed'
              ? 'text-destructive'
              : state === 'expired'
                ? 'text-warning'
                : 'text-muted-foreground'
        return (
          <li key={label} className="flex items-center gap-3 text-sm">
            {state === 'checking' ? (
              <Spinner className="size-5 shrink-0 text-primary" />
            ) : (
              <Icon aria-hidden="true" className={`size-5 shrink-0 ${tone}`} />
            )}
            <span className="flex-1">{label}</span>
            <span className={`font-medium capitalize ${tone}`}>{state}</span>
          </li>
        )
      })}
    </ul>
  )
}
