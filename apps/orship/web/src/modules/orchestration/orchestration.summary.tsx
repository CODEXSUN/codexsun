import type { OrchestrationOverview } from './orchestration.types'

export function OrchestrationSummary({ overview }: { overview: OrchestrationOverview }) {
  const metrics = [
    { label: 'Services', value: overview.summary.total },
    {
      label: 'Online',
      tone: 'text-emerald-600 dark:text-emerald-400',
      value: overview.summary.online,
    },
    {
      label: 'Degraded',
      tone: 'text-amber-600 dark:text-amber-400',
      value: overview.summary.degraded,
    },
    { label: 'Offline', tone: 'text-muted-foreground', value: overview.summary.offline },
  ]

  return (
    <div className="grid grid-cols-2 border-y border-border sm:grid-cols-4">
      {metrics.map((metric) => (
        <div className="flex min-h-16 items-center gap-3 px-6 py-2" key={metric.label}>
          <span className="text-sm text-muted-foreground">{metric.label}</span>
          <strong className={`text-xl font-semibold tracking-tight ${metric.tone ?? ''}`}>
            {metric.value}
          </strong>
        </div>
      ))}
    </div>
  )
}
