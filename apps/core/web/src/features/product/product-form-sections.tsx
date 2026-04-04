import type { ReactNode } from "react"

import type { CommonModuleItem } from "@core/shared"
import { PlusIcon, Trash2Icon } from "lucide-react"

import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Checkbox } from "@/components/ui/checkbox"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Switch } from "@/components/ui/switch"
import {
  SearchableLookupField,
  type SearchableLookupOption,
} from "@/features/forms/searchable-lookup-field"
import { getActivityStatusPanelClassName } from "@/features/status/activity-status"
import { cn } from "@/lib/utils"

import type { LocalOption } from "./product-form-state"

export function ProductFormMessage({ children }: { children: ReactNode }) {
  return (
    <Card className="border-amber-200/70 bg-amber-50/70 shadow-sm">
      <CardContent className="whitespace-pre-line p-4 text-sm text-amber-950">
        {children}
      </CardContent>
    </Card>
  )
}

export function ProductFormSectionCard({
  children,
  description,
  onAdd,
  title,
}: {
  children: ReactNode
  description?: string
  onAdd?: () => void
  title?: string
}) {
  const hasHeader = Boolean(title || description || onAdd)

  return (
    <Card className="rounded-[1.5rem] border-border/70 bg-card/80 shadow-sm">
      {hasHeader ? (
        <CardHeader className="flex flex-row items-start justify-between gap-4">
          <div className="space-y-1">
            {title ? <CardTitle className="text-base">{title}</CardTitle> : null}
            {description ? <CardDescription>{description}</CardDescription> : null}
          </div>
          {onAdd ? (
            <Button type="button" variant="outline" size="sm" onClick={onAdd}>
              <PlusIcon className="size-4" />
              Add
            </Button>
          ) : null}
        </CardHeader>
      ) : null}
      <CardContent className="grid gap-4">{children}</CardContent>
    </Card>
  )
}

export function ProductCollectionRow({
  children,
  onRemove,
}: {
  children: ReactNode
  onRemove: () => void
}) {
  return (
    <div className="rounded-[1.25rem] border border-border/70 bg-background/70 p-5">
      <div className="mb-3 flex justify-end">
        <Button type="button" variant="ghost" size="sm" onClick={onRemove}>
          <Trash2Icon className="size-4" />
          Remove
        </Button>
      </div>
      {children}
    </div>
  )
}

export function ProductField({
  children,
  className,
  error,
  label,
}: {
  children: ReactNode
  className?: string
  error?: string | null
  label: string
}) {
  return (
    <div className={cn("grid gap-3", className)}>
      <Label className={error ? "text-destructive" : undefined}>{label}</Label>
      {children}
      {error ? <p className="text-xs text-destructive">{error}</p> : null}
    </div>
  )
}

export function ProductStatusField({
  checked,
  id,
  onCheckedChange,
}: {
  checked: boolean
  id: string
  onCheckedChange: (checked: boolean) => void
}) {
  return (
    <div className="space-y-2">
      <Label htmlFor={id}>Status</Label>
      <label
        htmlFor={id}
        className={cn(
          "flex cursor-pointer items-center justify-between rounded-xl px-3 py-2",
          getActivityStatusPanelClassName(checked ? "active" : "inactive")
        )}
      >
        <div className="space-y-0.5">
          <p className="text-sm font-medium text-foreground">{checked ? "Active" : "Inactive"}</p>
          <p className="text-xs text-muted-foreground">
            {checked
              ? "This product is available across the application."
              : "This product is hidden as inactive."}
          </p>
        </div>
        <Switch id={id} checked={checked} onCheckedChange={onCheckedChange} />
      </label>
    </div>
  )
}

export function ProductSelectField({
  error,
  label,
  onValueChange,
  options,
  placeholder,
  value,
}: {
  error?: string | null
  label: string
  onValueChange: (value: string) => void
  options: LocalOption[]
  placeholder?: string
  value: string
}) {
  return (
    <ProductField label={label} error={error}>
      <Select value={value} onValueChange={onValueChange}>
        <SelectTrigger className={cn("w-full", error ? "border-destructive" : undefined)}>
          <SelectValue placeholder={placeholder ?? `Select ${label.toLowerCase()}`} />
        </SelectTrigger>
        <SelectContent>
          {options.map((option) => (
            <SelectItem key={option.value} value={option.value}>
              {option.label}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </ProductField>
  )
}

export function ProductLookupField({
  createActionLabel,
  error,
  items,
  label,
  onCreateNew,
  onValueChange,
  placeholder,
  value,
}: {
  createActionLabel?: string
  error?: string | null
  items: CommonModuleItem[]
  label: string
  onCreateNew?: (query: string) => void
  onValueChange: (value: string) => void
  placeholder?: string
  value: string
}) {
  const options: SearchableLookupOption[] = items.map((item) => {
    const primary =
      [item.name, item.title, item.code].find(
        (entry) => typeof entry === "string" && entry.trim().length > 0
      ) ?? item.id

    return {
      label: String(primary),
      value: item.id,
    }
  })

  return (
    <ProductField label={label} error={error}>
      <SearchableLookupField
        error={error}
        value={value === "1" || !value ? undefined : value}
        onValueChange={onValueChange}
        options={options}
        placeholder={placeholder ?? `Select ${label.toLowerCase()}`}
        searchPlaceholder={`Search ${label.toLowerCase()}`}
        noResultsMessage={`No ${label.toLowerCase()} found.`}
        createActionLabel={createActionLabel}
        onCreateNew={onCreateNew}
      />
    </ProductField>
  )
}

export function ProductCheckboxField({
  checked,
  label,
  onCheckedChange,
}: {
  checked: boolean
  label: string
  onCheckedChange: (checked: boolean) => void
}) {
  return (
    <label className="flex min-h-10 items-center gap-3 pt-6 text-sm font-medium text-foreground">
      <Checkbox checked={checked} onCheckedChange={(value) => onCheckedChange(Boolean(value))} />
      <span>{label}</span>
    </label>
  )
}

export function ProductTextField(props: React.ComponentProps<typeof Input>) {
  return <Input {...props} />
}
