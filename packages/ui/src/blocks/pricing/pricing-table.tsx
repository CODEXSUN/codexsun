import { Check, Sparkles, X } from 'lucide-react'
import { useState } from 'react'
import { Badge } from '../../components/badge'
import { Button } from '../../components/button'
import { cn } from '../../lib/utils'
import type {
  BillingInterval,
  PricingTableProps,
  PricingTierItem,
} from './pricing-types'

export function PricingTable({
  allowIntervalToggle = true,
  annualDiscountLabel = 'Save 20%',
  className,
  defaultInterval = 'monthly',
  onSelectTier,
  subtitle = 'Simple, transparent pricing. No hidden fees.',
  tiers,
  title = 'Choose your plan',
}: PricingTableProps) {
  const [interval, setInterval] = useState<BillingInterval>(defaultInterval)

  return (
    <div className={cn('flex flex-col items-center gap-8 py-4', className)}>
      {/* Header */}
      <div className="flex flex-col items-center text-center max-w-xl gap-2">
        <h3 className="text-2xl font-bold tracking-tight text-foreground sm:text-3xl">
          {title}
        </h3>
        {subtitle && <p className="text-sm text-muted-foreground">{subtitle}</p>}

        {/* Interval Switcher */}
        {allowIntervalToggle && (
          <div className="mt-4 flex items-center gap-1 rounded-xl border border-border/80 bg-muted/40 p-1">
            <button
              className={cn(
                'rounded-lg px-3 py-1.5 text-xs font-semibold transition-all',
                interval === 'monthly'
                  ? 'bg-background text-foreground shadow-2xs'
                  : 'text-muted-foreground hover:text-foreground',
              )}
              type="button"
              onClick={() => setInterval('monthly')}
            >
              Monthly billing
            </button>
            <button
              className={cn(
                'flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-semibold transition-all',
                interval === 'annual'
                  ? 'bg-background text-foreground shadow-2xs'
                  : 'text-muted-foreground hover:text-foreground',
              )}
              type="button"
              onClick={() => setInterval('annual')}
            >
              <span>Annual billing</span>
              <span className="rounded-full bg-emerald-500/15 px-1.5 py-0.2 text-[10px] font-bold text-emerald-600 dark:text-emerald-400">
                {annualDiscountLabel}
              </span>
            </button>
          </div>
        )}
      </div>

      {/* Tiers Grid */}
      <div className="grid w-full max-w-6xl grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3 items-stretch">
        {tiers.map((tier) => (
          <PricingTierCard
            interval={interval}
            key={tier.id}
            tier={tier}
            onSelect={() => onSelectTier?.(tier, interval)}
          />
        ))}
      </div>
    </div>
  )
}

function PricingTierCard({
  interval,
  onSelect,
  tier,
}: {
  interval: BillingInterval
  onSelect?: () => void
  tier: PricingTierItem
}) {
  const currency = tier.currency ?? '$'
  const isAnnual = interval === 'annual'
  const price = isAnnual && tier.annualPrice !== undefined ? tier.annualPrice : tier.monthlyPrice
  const period = tier.periodLabel ?? (isAnnual ? '/yr' : '/mo')

  return (
    <div
      className={cn(
        'relative flex flex-col justify-between rounded-2xl border bg-card p-6 shadow-2xs transition-all duration-200 hover:shadow-md',
        tier.isPopular
          ? 'border-primary ring-2 ring-primary/20 shadow-sm'
          : 'border-border/80 hover:border-foreground/25',
      )}
    >
      {tier.isPopular && (
        <div className="absolute -top-3 left-1/2 -translate-x-1/2">
          <Badge className="bg-primary text-primary-foreground font-bold shadow-xs px-3 py-0.5">
            <Sparkles className="size-3 mr-1" />
            {tier.badge ?? 'Most Popular'}
          </Badge>
        </div>
      )}

      <div>
        <div className="flex items-center justify-between gap-2">
          <h4 className="text-lg font-bold tracking-tight text-foreground">{tier.name}</h4>
          {!tier.isPopular && tier.badge && (
            <Badge variant="secondary">{tier.badge}</Badge>
          )}
        </div>

        <p className="mt-1 text-xs text-muted-foreground leading-relaxed">{tier.description}</p>

        {/* Price display */}
        <div className="mt-5 flex items-baseline gap-1">
          <span className="text-3xl font-extrabold text-foreground sm:text-4xl">
            {currency}
            {price}
          </span>
          <span className="text-xs font-medium text-muted-foreground">{period}</span>
        </div>

        {/* Features List */}
        <div className="mt-6 flex flex-col gap-2.5 border-t border-border/40 pt-5">
          <span className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider">
            Features included:
          </span>
          <ul className="flex flex-col gap-2">
            {tier.features.map((feat, idx) => (
              <li className="flex items-start gap-2 text-xs" key={idx}>
                {feat.excluded ? (
                  <X className="size-3.5 text-muted-foreground/50 shrink-0 mt-0.5" />
                ) : (
                  <Check
                    className={cn(
                      'size-3.5 shrink-0 mt-0.5',
                      feat.highlight ? 'text-primary font-bold' : 'text-emerald-500',
                    )}
                  />
                )}
                <span
                  className={cn(
                    feat.excluded
                      ? 'text-muted-foreground/60 line-through'
                      : feat.highlight
                        ? 'text-foreground font-semibold'
                        : 'text-foreground/90',
                  )}
                >
                  {feat.label}
                </span>
              </li>
            ))}
          </ul>
        </div>
      </div>

      {/* CTA Button */}
      <div className="mt-8 pt-2">
        <Button
          className="w-full rounded-xl font-semibold"
          render={tier.ctaHref ? <a href={tier.ctaHref} /> : undefined}
          variant={tier.ctaVariant ?? (tier.isPopular ? 'default' : 'outline')}
          onClick={onSelect}
        >
          {tier.ctaLabel ?? 'Get Started'}
        </Button>
      </div>
    </div>
  )
}
