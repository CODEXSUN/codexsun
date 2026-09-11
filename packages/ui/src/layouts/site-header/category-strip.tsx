import { cn } from '../../lib/utils'
import type { SiteHeaderCategory } from './site-header-types'

export interface CategoryStripProps {
  categories: readonly SiteHeaderCategory[]
  className?: string
  onSelect?: (category: SiteHeaderCategory) => void
}

export function CategoryStrip({
  categories,
  className,
  onSelect,
}: CategoryStripProps) {
  if (!categories || categories.length === 0) return null

  return (
    <div className={cn('w-full border-t border-border/40 bg-muted/20 select-none', className)}>
      <div className="mx-auto flex h-10 w-full max-w-7xl items-center overflow-x-auto px-4 scrollbar-none sm:px-6 lg:px-8">
        <nav aria-label="Category navigation" className="flex items-center gap-1.5 min-w-max">
          {categories.map((cat) => (
            <a
              className={cn(
                'rounded-lg px-2.5 py-1 text-xs font-medium transition-colors',
                cat.active
                  ? 'bg-background text-foreground font-semibold shadow-2xs'
                  : 'text-muted-foreground hover:bg-muted/60 hover:text-foreground',
              )}
              href={cat.href}
              key={cat.id}
              onClick={(e) => {
                if (onSelect) {
                  e.preventDefault()
                  onSelect(cat)
                }
              }}
            >
              {cat.label}
            </a>
          ))}
        </nav>
      </div>
    </div>
  )
}
