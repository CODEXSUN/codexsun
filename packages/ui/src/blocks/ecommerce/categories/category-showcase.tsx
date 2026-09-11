import { ArrowRightIcon } from 'lucide-react'
import { cn } from '../../../lib/utils'
import { Badge } from '../../../components/badge'
import type { CategoryShowcaseProps } from './categories-types'

export function CategoryShowcase({
  categories,
  className,
  columns = 4,
  description = 'Browse by catalog department and find curated essentials.',
  onSelectCategory,
  title = 'Shop by Category',
  variant = 'cards',
}: CategoryShowcaseProps) {
  const colClass = {
    2: 'grid-cols-1 sm:grid-cols-2',
    3: 'grid-cols-1 sm:grid-cols-2 lg:grid-cols-3',
    4: 'grid-cols-2 sm:grid-cols-3 lg:grid-cols-4',
    6: 'grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6',
  }[columns]

  if (variant === 'pills') {
    return (
      <div className={cn('flex flex-wrap items-center gap-2', className)}>
        {categories.map((cat) => (
          <button
            key={cat.id}
            type="button"
            onClick={() => onSelectCategory?.(cat.id)}
            className="group flex items-center gap-2 rounded-full border border-border/80 bg-card px-3.5 py-1.5 text-xs font-semibold text-foreground shadow-xs transition-all hover:border-primary hover:bg-primary/5"
          >
            {cat.icon}
            <span>{cat.title}</span>
            {cat.itemCount !== undefined && (
              <span className="rounded-full bg-muted px-1.5 py-0.2 text-[10px] text-muted-foreground group-hover:text-primary">
                {cat.itemCount}
              </span>
            )}
          </button>
        ))}
      </div>
    )
  }

  return (
    <div className={cn('space-y-6', className)}>
      {(title || description) && (
        <div className="flex flex-col gap-1 sm:flex-row sm:items-end sm:justify-between">
          <div>
            {title && <h3 className="text-xl font-bold tracking-tight text-foreground">{title}</h3>}
            {description && <p className="text-xs text-muted-foreground">{description}</p>}
          </div>
        </div>
      )}

      <div className={cn('grid gap-4', colClass)}>
        {categories.map((cat) => (
          <div
            key={cat.id}
            onClick={() => onSelectCategory?.(cat.id)}
            className="group relative cursor-pointer overflow-hidden rounded-2xl border border-border/80 bg-card p-4 shadow-xs transition-all duration-200 hover:-translate-y-1 hover:border-primary/50 hover:shadow-md"
          >
            {cat.image ? (
              <div className="aspect-4/3 w-full overflow-hidden rounded-xl bg-muted mb-3 relative">
                <img
                  src={cat.image}
                  alt={cat.title}
                  className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105"
                />
                {cat.badge && (
                  <Badge variant="default" className="absolute top-2 left-2 text-[10px] font-bold">
                    {cat.badge}
                  </Badge>
                )}
              </div>
            ) : (
              <div className="flex items-center justify-between mb-3">
                <div className="flex size-12 items-center justify-center rounded-xl bg-primary/10 text-primary transition-colors group-hover:bg-primary group-hover:text-primary-foreground">
                  {cat.icon}
                </div>
                {cat.badge && (
                  <Badge variant="default" className="text-[10px] font-bold">
                    {cat.badge}
                  </Badge>
                )}
              </div>
            )}

            <div className="space-y-1">
              <div className="flex items-center justify-between">
                <h4 className="text-sm font-bold text-foreground group-hover:text-primary transition-colors">
                  {cat.title}
                </h4>
                <ArrowRightIcon className="size-3.5 text-muted-foreground transition-transform group-hover:translate-x-1 group-hover:text-primary" />
              </div>

              {cat.subtitle && (
                <p className="text-xs text-muted-foreground line-clamp-1">{cat.subtitle}</p>
              )}

              {cat.itemCount !== undefined && (
                <p className="text-[11px] font-medium text-muted-foreground/80">
                  {cat.itemCount.toLocaleString()} products
                </p>
              )}

              {cat.tags && cat.tags.length > 0 && (
                <div className="flex flex-wrap gap-1 pt-2">
                  {cat.tags.slice(0, 3).map((tag) => (
                    <span
                      key={tag}
                      className="rounded bg-muted px-1.5 py-0.5 text-[10px] text-muted-foreground"
                    >
                      {tag}
                    </span>
                  ))}
                </div>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
