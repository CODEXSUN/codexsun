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

import type { LocalOption } from "./contact-form-state"

export function ContactFormMessage({ children }: { children: ReactNode }) {
  return (
    <Card className="border-amber-200/70 bg-amber-50/70 shadow-sm">
      <CardContent className="p-4 text-sm text-amber-950">{children}</CardContent>
    </Card>
  )
}

export function ContactFormSectionCard({
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

export function ContactCollectionRow({
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

export function ContactField({
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

export function ContactStatusField({
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
            {checked ? "This contact is available in the workspace." : "This contact is inactive."}
          </p>
        </div>
        <Switch id={id} checked={checked} onCheckedChange={onCheckedChange} />
      </label>
    </div>
  )
}

export function ContactSelectField({
  label,
  onValueChange,
  options,
  placeholder,
  value,
}: {
  label: string
  onValueChange: (value: string) => void
  options: LocalOption[]
  placeholder?: string
  value: string
}) {
  return (
    <ContactField label={label}>
      <Select value={value} onValueChange={onValueChange}>
        <SelectTrigger className="w-full">
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
    </ContactField>
  )
}

export function ContactLookupField({
  createActionLabel,
  items,
  label,
  onCreateNew,
  onValueChange,
  value,
}: {
  createActionLabel?: string
  items: CommonModuleItem[]
  label: string
  onCreateNew?: (query: string) => void
  onValueChange: (value: string) => void
  value: string
}) {
  const options: SearchableLookupOption[] = items.map((item) => {
    const preferredFields =
      label === "Pincode" ? [item.code, item.area_name, item.name, item.title] : [item.name, item.area_name, item.title, item.code]
    const primary =
      preferredFields.find(
        (entry) => typeof entry === "string" && entry.trim().length > 0
      ) ?? item.id

    return {
      label: String(primary),
      value: item.id,
    }
  })

  return (
    <ContactField label={label}>
      <SearchableLookupField
        value={value === "1" ? undefined : value}
        onValueChange={onValueChange}
        options={options}
        placeholder={`Select ${label.toLowerCase()}`}
        searchPlaceholder={`Search ${label.toLowerCase()}`}
        noResultsMessage={`No ${label.toLowerCase()} found.`}
        createActionLabel={createActionLabel}
        onCreateNew={onCreateNew}
      />
    </ContactField>
  )
}

export function ContactCheckboxField({
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

export function ContactTextField(props: React.ComponentProps<typeof Input>) {
  return <Input {...props} />
}
