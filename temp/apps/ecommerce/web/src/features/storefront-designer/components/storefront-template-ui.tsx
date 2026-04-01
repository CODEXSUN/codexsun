import type { ReactNode } from 'react'
import { ShieldCheckIcon, SparklesIcon, TruckIcon } from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'
import {
  formatStorefrontTemplateIcon,
  formatStorefrontTemplateTheme,
  getStorefrontTemplateSlotMeta,
  type StorefrontTemplateFormValues,
  type StorefrontTemplateRecord,
} from '../lib/storefront-template'

const iconByKey = {
  sparkles: SparklesIcon,
  truck: TruckIcon,
  shield: ShieldCheckIcon,
} as const

function previewSurface(themeKey: string | null | undefined) {
  switch (themeKey) {
    case 'sand':
      return 'bg-[linear-gradient(135deg,rgba(255,249,242,0.98)_0%,rgba(244,233,218,0.96)_100%)]'
    case 'mist':
      return 'bg-[linear-gradient(135deg,rgba(245,244,251,0.98)_0%,rgba(228,220,247,0.96)_100%)]'
    case 'cta':
      return 'bg-[linear-gradient(135deg,rgba(16,24,40,0.98)_0%,rgba(56,72,96,0.94)_100%)] text-white'
    default:
      return 'bg-background/70'
  }
}

function textOrFallback(value: string | null | undefined, fallback: string) {
  if (!value || value.trim().length === 0) {
    return fallback
  }

  return value
}

export function StorefrontTemplateTableCard({
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

export function StorefrontTemplateDisplayRow({
  label,
  value,
}: {
  label: string
  value: ReactNode
}) {
  return (
    <tr className="border-b border-border/60 last:border-b-0">
      <th className="w-[168px] border-r border-border/70 px-3 py-3 text-left text-[11px] font-medium uppercase tracking-[0.18em] text-muted-foreground sm:w-[188px]">
        {label}
      </th>
      <td className="px-4 py-3 text-sm text-foreground">{value}</td>
    </tr>
  )
}

export function StorefrontTemplateFieldRow({
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
          {description ? <p className="text-[10px] font-normal normal-case tracking-normal text-muted-foreground">{description}</p> : null}
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

export function StorefrontTemplatePreview({
  template,
}: {
  template: Pick<
    StorefrontTemplateRecord | StorefrontTemplateFormValues,
    | 'code'
    | 'badge_text'
    | 'title'
    | 'description'
    | 'cta_primary_label'
    | 'cta_secondary_label'
    | 'icon_key'
    | 'theme_key'
  >
}) {
  const slotMeta = getStorefrontTemplateSlotMeta(template.code)
  const Icon = template.icon_key ? iconByKey[template.icon_key as keyof typeof iconByKey] : null

  return (
    <div className={cn('rounded-md border border-border/70 p-4', previewSurface(template.theme_key || null))}>
      <div className="flex flex-wrap items-center gap-2">
        <Badge variant="secondary" className="rounded-md">
          {slotMeta.kind}
        </Badge>
        {template.badge_text ? (
          <Badge variant="outline" className="rounded-md border-current/20 bg-background/30">
            {template.badge_text}
          </Badge>
        ) : null}
      </div>
      <div className="mt-4 space-y-3">
        <div className="flex items-start justify-between gap-3">
          <div>
            <p className="text-xs uppercase tracking-[0.18em] text-muted-foreground">{slotMeta.label}</p>
            <h3 className="mt-2 text-xl font-semibold">{textOrFallback(template.title, 'Section title')}</h3>
          </div>
          {Icon ? (
            <div className="flex size-10 items-center justify-center rounded-full border border-current/10 bg-background/30">
              <Icon className="size-5" />
            </div>
          ) : null}
        </div>
        <p className="text-sm text-muted-foreground">{textOrFallback(template.description, slotMeta.description)}</p>
        <div className="flex flex-wrap gap-2">
          {template.cta_primary_label ? <Button type="button" size="sm">{template.cta_primary_label}</Button> : null}
          {template.cta_secondary_label ? <Button type="button" size="sm" variant="outline">{template.cta_secondary_label}</Button> : null}
          {!template.cta_primary_label && !template.cta_secondary_label ? (
            <span className="text-sm text-muted-foreground">No CTAs configured.</span>
          ) : null}
        </div>
      </div>
      <div className="mt-4 flex flex-wrap gap-2 text-xs text-muted-foreground">
        <span>Theme: <span className="font-medium text-foreground">{formatStorefrontTemplateTheme(template.theme_key)}</span></span>
        <span>Icon: <span className="font-medium text-foreground">{formatStorefrontTemplateIcon(template.icon_key)}</span></span>
      </div>
    </div>
  )
}
