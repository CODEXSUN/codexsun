import type { ReactNode } from 'react'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'
import {
  resolveSliderThemeStyles,
  type SliderThemeFormValues,
  type SliderThemeRecord,
} from '@/features/store/lib/slider-theme'

export function SliderThemeTableCard({
  children,
  className,
}: {
  children: ReactNode
  className?: string
}) {
  return (
    <div className={cn('overflow-hidden rounded-md border border-border/70 bg-background/70', className)}>
      <table className="w-full border-collapse">
        <tbody>{children}</tbody>
      </table>
    </div>
  )
}

export function SliderThemeDisplayRow({
  label,
  value,
}: {
  label: string
  value: ReactNode
}) {
  return (
    <tr className="border-b border-border/60 last:border-b-0">
      <th className="w-[176px] border-r border-border/70 px-3 py-3 text-left text-[11px] font-medium uppercase tracking-[0.18em] text-muted-foreground sm:w-[198px]">
        {label}
      </th>
      <td className="px-4 py-3 text-sm text-foreground">{value}</td>
    </tr>
  )
}

export function SliderThemeFieldRow({
  label,
  description,
  field,
  error,
}: {
  label: string
  description?: string
  field: ReactNode
  error?: string
}) {
  return (
    <tr className="border-b border-border/60 last:border-b-0">
      <th className="w-[176px] border-r border-border/70 px-3 py-3 text-left align-top text-[11px] font-medium uppercase tracking-[0.18em] text-muted-foreground sm:w-[198px]">
        <div className="space-y-1">
          <span>{label}</span>
          {description ? (
            <p className="text-[10px] font-normal normal-case tracking-normal text-muted-foreground">
              {description}
            </p>
          ) : null}
        </div>
      </th>
      <td className="px-4 py-3 align-top">
        <div className="grid gap-2">
          {field}
          {error ? <p className="text-[0.8rem] text-destructive">{error}</p> : null}
        </div>
      </td>
    </tr>
  )
}

function ColorChip({
  label,
  value,
}: {
  label: string
  value: string
}) {
  return (
    <div className="rounded-md border border-current/10 bg-background/20 px-3 py-2">
      <div className="flex items-center gap-2">
        <span
          className="size-4 rounded-full border border-black/10"
          style={{ backgroundColor: value }}
        />
        <span className="text-xs uppercase tracking-[0.16em] text-muted-foreground">{label}</span>
      </div>
      <p className="mt-1 font-mono text-xs">{value}</p>
    </div>
  )
}

export function SliderThemePreview({
  theme,
}: {
  theme: Pick<
    SliderThemeRecord | SliderThemeFormValues,
    | 'backgroundFrom'
    | 'backgroundVia'
    | 'backgroundTo'
    | 'textColor'
    | 'mutedTextColor'
    | 'badgeBackground'
    | 'badgeTextColor'
    | 'primaryButtonBackground'
    | 'primaryButtonTextColor'
    | 'secondaryButtonBackground'
    | 'secondaryButtonTextColor'
    | 'navBackground'
    | 'navTextColor'
    | 'addToCartLabel'
    | 'viewDetailsLabel'
  >
}) {
  const resolved = resolveSliderThemeStyles({
    id: 'preview',
    code: 'preview',
    name: 'Preview',
    sortOrder: 0,
    createdAt: '',
    updatedAt: '',
    isActive: true,
    addToCartLabel: theme.addToCartLabel,
    viewDetailsLabel: theme.viewDetailsLabel,
    backgroundFrom: theme.backgroundFrom,
    backgroundVia: theme.backgroundVia,
    backgroundTo: theme.backgroundTo,
    textColor: theme.textColor,
    mutedTextColor: theme.mutedTextColor,
    badgeBackground: theme.badgeBackground,
    badgeTextColor: theme.badgeTextColor,
    primaryButtonBackground: theme.primaryButtonBackground,
    primaryButtonTextColor: theme.primaryButtonTextColor,
    secondaryButtonBackground: theme.secondaryButtonBackground,
    secondaryButtonTextColor: theme.secondaryButtonTextColor,
    navBackground: theme.navBackground,
    navTextColor: theme.navTextColor,
  })

  return (
    <div
      className="overflow-hidden rounded-3xl border border-border/60 p-5 shadow-[0_24px_80px_-48px_rgba(36,18,10,0.55)]"
      style={{ background: resolved.background, color: resolved.textColor }}
    >
      <div className="flex items-center justify-between gap-3">
        <Badge
          variant="outline"
          className="rounded-full border-0 px-3 py-1 text-[11px] uppercase tracking-[0.18em]"
          style={{
            background: resolved.badgeBackground,
            color: resolved.badgeTextColor,
          }}
        >
          Featured drop
        </Badge>
        <div className="flex items-center gap-2">
          <button
            type="button"
            className="flex size-9 items-center justify-center rounded-full border text-sm"
            style={{
              background: resolved.navBackground,
              color: resolved.navTextColor,
              borderColor: resolved.isDark ? 'rgba(255,255,255,0.2)' : 'rgba(17,17,17,0.1)',
            }}
          >
            ‹
          </button>
          <button
            type="button"
            className="flex size-9 items-center justify-center rounded-full border text-sm"
            style={{
              background: resolved.navBackground,
              color: resolved.navTextColor,
              borderColor: resolved.isDark ? 'rgba(255,255,255,0.2)' : 'rgba(17,17,17,0.1)',
            }}
          >
            ›
          </button>
        </div>
      </div>

      <div className="mt-5 grid gap-4 lg:grid-cols-[1.1fr_180px] lg:items-end">
        <div className="space-y-4">
          <div>
            <p className="text-xs uppercase tracking-[0.18em]" style={{ color: resolved.mutedTextColor }}>
              Slider preview
            </p>
            <h3 className="mt-2 text-2xl font-semibold leading-tight">Refined hero surface for product storytelling</h3>
            <p className="mt-3 max-w-md text-sm leading-relaxed" style={{ color: resolved.mutedTextColor }}>
              This preview mirrors the storefront hero treatment, including adaptive text contrast and CTA styling.
            </p>
          </div>

          <div className="flex flex-wrap gap-2">
            <Button
              type="button"
              className="rounded-full px-5"
              style={{
                background: resolved.primaryButtonBackground,
                color: resolved.primaryButtonTextColor,
              }}
            >
              {resolved.addToCartLabel}
            </Button>
            <Button
              type="button"
              variant="outline"
              className="rounded-full px-5"
              style={{
                background: resolved.secondaryButtonBackground,
                color: resolved.secondaryButtonTextColor,
                borderColor: resolved.isDark ? 'rgba(255,255,255,0.2)' : 'rgba(17,17,17,0.12)',
              }}
            >
              {resolved.viewDetailsLabel}
            </Button>
          </div>
        </div>

        <div className="rounded-[1.8rem] border border-white/40 bg-white/20 p-4 backdrop-blur-sm">
          <div className="aspect-[4/5] rounded-[1.3rem] bg-[linear-gradient(160deg,rgba(255,255,255,0.35),rgba(255,255,255,0.08))]" />
        </div>
      </div>

      <div className="mt-5 grid gap-2 sm:grid-cols-2">
        <ColorChip label="Start" value={theme.backgroundFrom} />
        <ColorChip label="Middle" value={theme.backgroundVia} />
        <ColorChip label="End" value={theme.backgroundTo} />
        <ColorChip label="Text" value={resolved.textColor} />
      </div>
    </div>
  )
}
