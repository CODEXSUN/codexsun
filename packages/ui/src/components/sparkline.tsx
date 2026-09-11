import { useId } from 'react'
import { cn } from '../lib/utils'

export type SparklineTone = 'primary' | 'positive' | 'negative' | 'neutral' | 'warning'
export type SparklineType = 'line' | 'area' | 'bar' | 'trend'

export interface SparklineDatum {
  value: number
}

export interface SparklineProps {
  ariaLabel?: string
  className?: string
  data: readonly number[] | readonly SparklineDatum[]
  height?: number
  showDot?: boolean
  showMinMax?: boolean
  showTrendBadge?: boolean
  strokeWidth?: number
  tone?: SparklineTone
  trendLabel?: string
  type?: SparklineType
  width?: number
}

const toneStyles: Record<
  SparklineTone,
  {
    badge: string
    bar: string
    dot: string
    stopColor: string
    stroke: string
  }
> = {
  primary: {
    badge: 'bg-primary/10 text-primary',
    bar: 'fill-primary',
    dot: 'fill-primary stroke-background',
    stopColor: 'currentColor',
    stroke: 'stroke-primary text-primary',
  },
  positive: {
    badge: 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400',
    bar: 'fill-emerald-500',
    dot: 'fill-emerald-500 stroke-background',
    stopColor: '#10b981',
    stroke: 'stroke-emerald-600 dark:stroke-emerald-400',
  },
  negative: {
    badge: 'bg-destructive/10 text-destructive',
    bar: 'fill-destructive',
    dot: 'fill-destructive stroke-background',
    stopColor: '#ef4444',
    stroke: 'stroke-destructive',
  },
  neutral: {
    badge: 'bg-muted text-muted-foreground',
    bar: 'fill-muted-foreground/60',
    dot: 'fill-muted-foreground stroke-background',
    stopColor: '#9ca3af',
    stroke: 'stroke-muted-foreground',
  },
  warning: {
    badge: 'bg-amber-500/10 text-amber-600 dark:text-amber-400',
    bar: 'fill-amber-500',
    dot: 'fill-amber-500 stroke-background',
    stopColor: '#f59e0b',
    stroke: 'stroke-amber-600 dark:stroke-amber-400',
  },
}

export function Sparkline({
  ariaLabel = 'Data trend sparkline',
  className,
  data,
  height = 32,
  showDot = true,
  showMinMax = false,
  showTrendBadge = false,
  strokeWidth = 2,
  tone = 'primary',
  trendLabel,
  type = 'line',
  width = 120,
}: SparklineProps) {
  const gradientId = useId()
  const rawValues = data.map((d) => (typeof d === 'number' ? d : d.value))

  if (rawValues.length === 0) {
    return (
      <div
        aria-label="Empty sparkline"
        className={cn('inline-flex items-center text-xs text-muted-foreground', className)}
        style={{ height, width }}
      >
        --
      </div>
    )
  }

  const min = Math.min(...rawValues)
  const max = Math.max(...rawValues)
  const range = max - min === 0 ? 1 : max - min
  const padding = strokeWidth + 2
  const innerWidth = Math.max(10, width - padding * 2)
  const innerHeight = Math.max(10, height - padding * 2)

  const points = rawValues.map((val, idx) => {
    const x = padding + (idx / Math.max(1, rawValues.length - 1)) * innerWidth
    const y = padding + innerHeight - ((val - min) / range) * innerHeight
    return { val, x, y }
  })

  const firstVal = rawValues[0]
  const lastVal = rawValues[rawValues.length - 1]
  const calculatedDelta =
    firstVal !== 0 ? (((lastVal - firstVal) / Math.abs(firstVal)) * 100).toFixed(1) : '0'
  const isPositive = lastVal >= firstVal
  const deltaBadgeText =
    trendLabel ?? (isPositive ? `+${calculatedDelta}%` : `${calculatedDelta}%`)

  const pathD = points.reduce((acc, pt, idx) => {
    if (idx === 0) return `M ${pt.x.toFixed(1)} ${pt.y.toFixed(1)}`
    return `${acc} L ${pt.x.toFixed(1)} ${pt.y.toFixed(1)}`
  }, '')

  const lastPoint = points[points.length - 1]
  const firstPoint = points[0]
  const areaD = `${pathD} L ${lastPoint.x.toFixed(1)} ${(height - padding / 2).toFixed(1)} L ${firstPoint.x.toFixed(1)} ${(height - padding / 2).toFixed(1)} Z`

  const selectedTone = toneStyles[tone]

  return (
    <div
      aria-label={ariaLabel}
      className={cn('inline-flex items-center gap-2', className)}
      role="img"
    >
      <svg
        className="overflow-visible"
        height={height}
        viewBox={`0 0 ${width} ${height}`}
        width={width}
      >
        <defs>
          <linearGradient id={gradientId} x1="0" x2="0" y1="0" y2="1">
            <stop offset="0%" stopColor={selectedTone.stopColor} stopOpacity={0.35} />
            <stop offset="100%" stopColor={selectedTone.stopColor} stopOpacity={0.0} />
          </linearGradient>
        </defs>

        {type === 'bar' ? (
          <g>
            {points.map((pt, idx) => {
              const barWidth = Math.max(2, (innerWidth / rawValues.length) * 0.7)
              const barHeight = Math.max(2, innerHeight - (pt.y - padding))
              const barX = pt.x - barWidth / 2
              const barY = pt.y
              return (
                <rect
                  className={selectedTone.bar}
                  height={barHeight}
                  key={idx}
                  rx={1.5}
                  width={barWidth}
                  x={barX}
                  y={barY}
                />
              )
            })}
          </g>
        ) : (
          <g>
            {(type === 'area' || type === 'trend') && (
              <path d={areaD} fill={`url(#${gradientId})`} />
            )}
            <path
              className={cn(selectedTone.stroke, 'fill-none')}
              d={pathD}
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={strokeWidth}
            />
            {showDot && (
              <circle
                className={selectedTone.dot}
                cx={lastPoint.x}
                cy={lastPoint.y}
                r={strokeWidth + 1.5}
                strokeWidth={1.5}
              />
            )}
            {showMinMax && (
              <>
                {points.find((p) => p.val === max) && (
                  <circle
                    className="fill-emerald-500 stroke-background"
                    cx={points.find((p) => p.val === max)!.x}
                    cy={points.find((p) => p.val === max)!.y}
                    r={2.5}
                    strokeWidth={1}
                  />
                )}
                {points.find((p) => p.val === min) && (
                  <circle
                    className="fill-destructive stroke-background"
                    cx={points.find((p) => p.val === min)!.x}
                    cy={points.find((p) => p.val === min)!.y}
                    r={2.5}
                    strokeWidth={1}
                  />
                )}
              </>
            )}
          </g>
        )}
      </svg>

      {showTrendBadge && (
        <span
          className={cn(
            'inline-flex items-center rounded-md px-1.5 py-0.5 text-[11px] font-semibold tracking-tight',
            selectedTone.badge,
          )}
        >
          {deltaBadgeText}
        </span>
      )}
    </div>
  )
}
