import { Link } from 'react-router-dom'

import { useStorefront } from '@/features/store/context/storefront-context'
import { cn } from '@/lib/utils'

export function StorefrontCategories({ className }: { className?: string }) {
  const { categories } = useStorefront()
  const visibleCategories = categories.filter((category) => category.showInTopMenu)

  if (visibleCategories.length === 0) {
    return null
  }

  return (
    <div className={cn('w-full border-b border-border/40 bg-background/50 pb-2 pt-4 shadow-sm sm:pb-4 sm:pt-6', className)}>
      <div
        className="mx-auto w-full max-w-7xl overflow-x-auto pb-2"
        style={{
          scrollbarWidth: 'thin',
          scrollbarColor: 'rgba(0,0,0,0.18) transparent',
        }}
      >
        <div className="flex min-w-max items-center justify-start gap-4 px-4 sm:gap-6 md:justify-center md:gap-8 lg:gap-12">
          <Link
            to="/search"
            className="group flex w-16 flex-col items-center gap-2 transition-transform duration-300 hover:-translate-y-1 sm:w-20 md:w-24 lg:w-28"
          >
            <div className="relative flex aspect-square w-full shrink-0 items-center justify-center overflow-hidden rounded-md bg-card text-xs font-semibold text-foreground/70">
              All
            </div>
            <span className="text-center text-[10px] font-medium leading-tight tracking-tight text-foreground/80 transition-all duration-300 group-hover:font-semibold group-hover:text-primary sm:text-xs lg:text-sm">
              All Products
            </span>
          </Link>
          {visibleCategories.map((category) => (
            <Link
              key={category.id}
              to={`/category/${category.slug}`}
              className="group flex w-16 flex-col items-center gap-2 transition-transform duration-300 hover:-translate-y-1 sm:w-20 md:w-24 lg:w-28"
            >
              <div className="relative flex aspect-square w-full shrink-0 flex-col items-center justify-end overflow-hidden">
                {category.menuImage ?? category.image ? (
                  <img
                    src={category.menuImage ?? category.image ?? ''}
                    alt={category.name}
                    className="aspect-square w-full rounded-md object-cover object-center mix-blend-multiply drop-shadow-md transition-transform duration-500 group-hover:scale-110"
                    loading="lazy"
                  />
                ) : (
                  <div className="flex aspect-square w-full items-center justify-center rounded-md bg-card text-xs font-semibold text-foreground/70">
                    {category.name.slice(0, 2).toUpperCase()}
                  </div>
                )}
              </div>
              <span className="text-center text-[10px] font-medium leading-tight tracking-tight text-foreground/80 transition-all duration-300 group-hover:font-semibold group-hover:text-primary sm:text-xs lg:text-sm">
                {category.name}
              </span>
            </Link>
          ))}
        </div>
      </div>
    </div>
  )
}
