import { ArrowLeft, ArrowRight } from 'lucide-react'
import { cn } from '../../lib/utils'

export type UiTemplateNavigationItem = {
  href: string
  name: string
}

export function UiTemplateNavigation({
  next,
  previous,
}: {
  next?: UiTemplateNavigationItem
  previous?: UiTemplateNavigationItem
}) {
  return (
    <nav aria-label="Documentation navigation" className="grid gap-3 border-t pt-6 sm:grid-cols-2">
      {previous ? <NavigationLink direction="previous" item={previous} /> : <span />}
      {next ? <NavigationLink direction="next" item={next} /> : null}
    </nav>
  )
}

function NavigationLink({
  direction,
  item,
}: {
  direction: 'next' | 'previous'
  item: UiTemplateNavigationItem
}) {
  const isPrevious = direction === 'previous'

  return (
    <a
      aria-label={`${isPrevious ? 'Previous' : 'Next'}: ${item.name}`}
      className={cn(
        'group flex min-h-20 items-center gap-3 rounded-md border bg-card px-4 py-3 shadow-sm',
        'transition-[transform,box-shadow,border-color] duration-200 ease-out',
        'hover:-translate-y-0.5 hover:border-foreground/20 hover:shadow-md',
        'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2',
        'motion-reduce:transform-none motion-reduce:transition-none',
        isPrevious ? 'text-left' : 'justify-end text-right sm:col-start-2',
      )}
      href={item.href}
    >
      {isPrevious ? (
        <ArrowLeft className="size-4 shrink-0 transition-transform group-hover:-translate-x-0.5 motion-reduce:transform-none" />
      ) : null}
      <span className="grid gap-1">
        <span className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
          {isPrevious ? 'Previous' : 'Next'}
        </span>
        <span className="font-semibold text-foreground">{item.name}</span>
      </span>
      {!isPrevious ? (
        <ArrowRight className="size-4 shrink-0 transition-transform group-hover:translate-x-0.5 motion-reduce:transform-none" />
      ) : null}
    </a>
  )
}
