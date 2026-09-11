import { useState } from 'react'
import { ArrowDownIcon, BellIcon, CheckIcon, TrendingDownIcon } from 'lucide-react'
import { cn } from '../../../lib/utils'
import { Button } from '../../../components/button'
import { Badge } from '../../../components/badge'
import type { PriceHistoryProps } from './price-history-types'

export function PriceHistoryChart({
  averagePrice: propAvg,
  className,
  currencySymbol = '$',
  currentPrice,
  history,
  lowestPrice: propLow,
  onSetPriceAlert,
  peakPrice: propHigh,
  productTitle,
}: PriceHistoryProps) {
  const [alertSet, setAlertSet] = useState(false)

  const prices = history.map((h) => h.price)
  const lowest = propLow ?? Math.min(...prices, currentPrice)
  const peak = propHigh ?? Math.max(...prices, currentPrice)
  const avg = propAvg ?? Math.round(prices.reduce((a, b) => a + b, 0) / (prices.length || 1))

  const isAtLowest = currentPrice <= lowest
  const savingsFromPeak = Math.max(0, peak - currentPrice)

  // SVG dimensions
  const width = 500
  const height = 160
  const padding = 24
  const range = Math.max(1, peak - lowest)

  // Points
  const points = history.map((pt, idx) => {
    const x = padding + (idx / Math.max(1, history.length - 1)) * (width - 2 * padding)
    const y = height - padding - ((pt.price - lowest) / range) * (height - 2 * padding)
    return { ...pt, x, y }
  })

  const pathD = points.reduce((acc, pt, idx) => `${acc} ${idx === 0 ? 'M' : 'L'} ${pt.x} ${pt.y}`, '')
  const areaD = points.length > 0
    ? `${pathD} L ${points[points.length - 1]!.x} ${height - padding} L ${points[0]!.x} ${height - padding} Z`
    : ''

  const handleAlert = () => {
    setAlertSet(true)
    onSetPriceAlert?.()
  }

  return (
    <div className={cn('space-y-4 rounded-2xl border border-border/80 bg-card p-5 shadow-xs', className)}>
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 border-b border-border/60 pb-4">
        <div>
          <div className="flex items-center gap-2">
            <TrendingDownIcon className="size-4 text-emerald-600" />
            <h4 className="text-sm font-bold text-foreground">Price History Tracker</h4>
            {isAtLowest && (
              <Badge variant="default" className="text-[10px] font-bold bg-emerald-600 hover:bg-emerald-700">
                All-Time Low!
              </Badge>
            )}
          </div>
          {productTitle && <p className="text-xs text-muted-foreground mt-0.5 truncate">{productTitle}</p>}
        </div>

        <Button
          size="sm"
          variant={alertSet ? 'secondary' : 'outline'}
          className="h-8 gap-1.5 text-xs self-start sm:self-auto"
          onClick={handleAlert}
        >
          {alertSet ? (
            <>
              <CheckIcon className="size-3.5 text-emerald-600" />
              <span>Alert Enabled</span>
            </>
          ) : (
            <>
              <BellIcon className="size-3.5 text-primary" />
              <span>Notify Price Drops</span>
            </>
          )}
        </Button>
      </div>

      {/* Stats row */}
      <div className="grid grid-cols-3 gap-3 rounded-xl border border-border/60 bg-muted/20 p-3 text-center text-xs">
        <div>
          <span className="text-muted-foreground text-[11px]">Current</span>
          <div className="font-bold text-foreground text-sm mt-0.5">{currencySymbol}{currentPrice}</div>
        </div>
        <div>
          <span className="text-muted-foreground text-[11px]">Lowest Recorded</span>
          <div className="font-bold text-emerald-600 text-sm mt-0.5">{currencySymbol}{lowest}</div>
        </div>
        <div>
          <span className="text-muted-foreground text-[11px]">Average</span>
          <div className="font-bold text-foreground text-sm mt-0.5">{currencySymbol}{avg}</div>
        </div>
      </div>

      {/* SVG Price Chart */}
      <div className="relative w-full overflow-hidden rounded-xl border border-border/40 bg-muted/10 p-2">
        <svg viewBox={`0 0 ${width} ${height}`} className="w-full h-40 overflow-visible">
          <defs>
            <linearGradient id="priceGrad" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="var(--primary, #3b82f6)" stopOpacity="0.25" />
              <stop offset="100%" stopColor="var(--primary, #3b82f6)" stopOpacity="0.0" />
            </linearGradient>
          </defs>

          {/* Grid lines */}
          <line x1={padding} y1={padding} x2={width - padding} y2={padding} stroke="currentColor" strokeOpacity="0.1" strokeDasharray="3 3" />
          <line x1={padding} y1={height / 2} x2={width - padding} y2={height / 2} stroke="currentColor" strokeOpacity="0.1" strokeDasharray="3 3" />
          <line x1={padding} y1={height - padding} x2={width - padding} y2={height - padding} stroke="currentColor" strokeOpacity="0.1" />

          {/* Gradient area */}
          {areaD && <path d={areaD} fill="url(#priceGrad)" />}

          {/* Path line */}
          {pathD && (
            <path
              d={pathD}
              fill="none"
              stroke="var(--primary, #3b82f6)"
              strokeWidth="2.5"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          )}

          {/* Data Points */}
          {points.map((pt, i) => (
            <g key={i}>
              <circle
                cx={pt.x}
                cy={pt.y}
                r="3.5"
                className="fill-background stroke-primary stroke-2 hover:r-5 transition-all"
              />
            </g>
          ))}
        </svg>

        {/* Date labels */}
        <div className="flex justify-between px-4 text-[10px] text-muted-foreground font-mono">
          <span>{history[0]?.date}</span>
          <span>{history[history.length - 1]?.date}</span>
        </div>
      </div>

      {savingsFromPeak > 0 && (
        <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
          <ArrowDownIcon className="size-3.5 text-emerald-600 font-bold" />
          <span>Currently <strong className="text-emerald-600">{currencySymbol}{savingsFromPeak} cheaper</strong> than its peak historical price of {currencySymbol}{peak}.</span>
        </div>
      )}
    </div>
  )
}
