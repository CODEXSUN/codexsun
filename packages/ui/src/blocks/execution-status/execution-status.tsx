import { CheckCircle2, PauseCircle, TriangleAlert } from 'lucide-react'
import { Progress } from '../../components/progress'
import { Spinner } from '../../components/spinner'

export type ExecutionStatusProps = {
  state: 'active' | 'idle' | 'complete' | 'attention'
  title: string
  description: string
  elapsed: string
  metrics: readonly { label: string; value: string | number }[]
  animated?: boolean
}

/** Presentation only. The caller owns execution, freshness, and measured values. */
export function ExecutionStatus({
  state,
  title,
  description,
  elapsed,
  metrics,
  animated = true,
}: ExecutionStatusProps) {
  const Icon =
    state === 'complete' ? CheckCircle2 : state === 'attention' ? TriangleAlert : PauseCircle
  return (
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
    </section>
  )
}
