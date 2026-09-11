import { useState } from 'react'
import { CheckIcon, ShoppingBagIcon, StarIcon, XIcon } from 'lucide-react'
import { cn } from '../../../lib/utils'
import { Button } from '../../../components/button'
import { Badge } from '../../../components/badge'
import type { ProductComparisonProps } from './comparison-types'

export function ProductComparison({
  className,
  featureGroups,
  onAddToCart,
  onRemoveProduct,
  products,
}: ProductComparisonProps) {
  const [highlightDifferences, setHighlightDifferences] = useState(false)

  if (products.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center p-12 text-center rounded-2xl border border-border/80 bg-card">
        <p className="text-sm font-semibold text-foreground">No products selected for comparison</p>
        <p className="text-xs text-muted-foreground mt-1">Select 2 or more products from the catalog to compare features.</p>
      </div>
    )
  }

  const isDifference = (key: string) => {
    if (products.length <= 1) return false
    const firstVal = products[0]?.attributes[key]
    return products.some((p) => p.attributes[key] !== firstVal)
  }

  return (
    <div className={cn('space-y-4', className)}>
      {/* Controls */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span className="text-xs font-semibold text-foreground">Comparing {products.length} Products</span>
        </div>

        <label className="flex items-center gap-2 cursor-pointer text-xs font-medium text-muted-foreground hover:text-foreground">
          <input
            type="checkbox"
            checked={highlightDifferences}
            onChange={(e) => setHighlightDifferences(e.target.checked)}
            className="rounded border-border text-primary focus:ring-primary size-3.5"
          />
          <span>Highlight Differences</span>
        </label>
      </div>

      {/* Comparison Table */}
      <div className="overflow-x-auto rounded-2xl border border-border/80 bg-card shadow-xs">
        <table className="w-full border-collapse text-left text-xs">
          <thead>
            <tr className="border-b border-border/80 bg-muted/20">
              <th className="w-48 p-4 font-bold text-foreground">Overview</th>
              {products.map((p) => (
                <th key={p.id} className="min-w-56 p-4 align-top">
                  <div className="relative flex flex-col space-y-2">
                    {onRemoveProduct && (
                      <button
                        type="button"
                        onClick={() => onRemoveProduct(p.id)}
                        className="absolute -top-2 -right-2 rounded-full bg-muted p-1 text-muted-foreground hover:bg-destructive hover:text-destructive-foreground transition-colors"
                        aria-label={`Remove ${p.title}`}
                      >
                        <XIcon className="size-3" />
                      </button>
                    )}

                    <img
                      src={p.image}
                      alt={p.title}
                      className="aspect-square w-full rounded-xl object-cover bg-muted border border-border/40"
                    />

                    {p.badge && (
                      <Badge variant="secondary" className="w-fit text-[10px]">
                        {p.badge}
                      </Badge>
                    )}

                    <h4 className="font-bold text-foreground text-sm line-clamp-1">{p.title}</h4>
                    <div className="text-base font-bold text-primary">{p.price}</div>

                    {/* Rating */}
                    <div className="flex items-center gap-1 text-[11px] text-muted-foreground">
                      <StarIcon className="size-3.5 fill-amber-400 text-amber-400" />
                      <span className="font-semibold text-foreground">{p.rating.toFixed(1)}</span>
                      {p.reviewsCount && <span>({p.reviewsCount})</span>}
                    </div>

                    <Button
                      size="sm"
                      className="w-full gap-1.5 mt-2 text-xs"
                      disabled={!p.inStock}
                      onClick={() => onAddToCart?.(p.id)}
                    >
                      <ShoppingBagIcon className="size-3.5" />
                      <span>{p.inStock ? 'Add to Cart' : 'Out of Stock'}</span>
                    </Button>
                  </div>
                </th>
              ))}
            </tr>
          </thead>

          <tbody>
            {featureGroups.map((group) => (
              <tr key={group.groupName} className="contents">
                <td
                  colSpan={products.length + 1}
                  className="bg-muted/50 px-4 py-2 font-bold uppercase tracking-wider text-[11px] text-muted-foreground border-y border-border/80"
                >
                  {group.groupName}
                </td>

                {group.features.map((feat) => {
                  const hasDiff = isDifference(feat.key)
                  const rowBg = highlightDifferences && hasDiff ? 'bg-amber-500/10 dark:bg-amber-500/15' : ''

                  return (
                    <tr key={feat.key} className={cn('border-b border-border/40 transition-colors', rowBg)}>
                      <td className="p-4 font-semibold text-foreground align-middle">
                        <div>{feat.label}</div>
                        {feat.description && (
                          <div className="text-[10px] text-muted-foreground font-normal">{feat.description}</div>
                        )}
                      </td>

                      {products.map((p) => {
                        const val = p.attributes[feat.key]
                        return (
                          <td key={p.id} className="p-4 text-muted-foreground align-middle">
                            {typeof val === 'boolean' ? (
                              val ? (
                                <CheckIcon className="size-4 text-emerald-600 font-bold" />
                              ) : (
                                <XIcon className="size-4 text-muted-foreground/40" />
                              )
                            ) : (
                              <span className={cn('font-medium', val ? 'text-foreground' : 'text-muted-foreground/50')}>
                                {val ?? '—'}
                              </span>
                            )}
                          </td>
                        )
                      })}
                    </tr>
                  )
                })}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}
