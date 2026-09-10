import { ArrowDownIcon, type LucideIcon } from 'lucide-react'

export function MonorepoFlowLane({
  icon: Icon,
  steps,
  title,
}: {
  icon: LucideIcon
  steps: ReadonlyArray<readonly [LucideIcon, string]>
  title: string
}) {
  return (
    <section>
      <div className="mb-3 flex items-center gap-2">
        <Icon className="size-5 text-primary" />
        <h3 className="font-semibold">{title}</h3>
      </div>
      <ol className="grid gap-2">
        {steps.map(([StepIcon, label], index) => (
          <li className="flex min-w-0 items-center gap-2" key={label}>
            <span className="grid size-8 shrink-0 place-items-center rounded-lg bg-card ring-1 ring-foreground/10">
              <StepIcon className="size-4 text-muted-foreground" />
            </span>
            <span className="min-w-0 text-sm font-medium">{label}</span>
            {index < steps.length - 1 ? (
              <ArrowDownIcon className="ml-auto size-4 text-muted-foreground" />
            ) : null}
          </li>
        ))}
      </ol>
    </section>
  )
}
