/* eslint-disable react-refresh/only-export-components */

import type { ReactNode } from "react"

import type {
  FrappeItemManager,
  FrappeItemUpsertPayload,
  FrappePurchaseReceiptManager,
  FrappeTodoUpsertPayload,
} from "@frappe/shared"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"

import { HttpError } from "../api/frappe-api"

export function toErrorMessage(error: unknown) {
  if (error instanceof HttpError) {
    return error.message
  }

  if (error instanceof Error) {
    return error.message
  }

  return "Request failed."
}

export function formatDateTime(value: string) {
  if (!value) {
    return "Not available"
  }

  const parsedDate = new Date(value)
  if (Number.isNaN(parsedDate.getTime())) {
    return value
  }

  return new Intl.DateTimeFormat("en-IN", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(parsedDate)
}

export function formatCurrency(value: number, currency = "INR") {
  try {
    return new Intl.NumberFormat("en-IN", {
      style: "currency",
      currency,
      maximumFractionDigits: 2,
    }).format(value)
  } catch {
    return `${currency} ${value.toFixed(2)}`
  }
}

export function createDefaultTodoValues(): FrappeTodoUpsertPayload {
  return {
    description: "",
    status: "Open",
    priority: "Medium",
    dueDate: "",
    allocatedTo: "",
  }
}

export function createDefaultItemValues(
  references: FrappeItemManager["references"] | null
): FrappeItemUpsertPayload {
  return {
    itemCode: "",
    itemName: "",
    description: "",
    itemGroup: "",
    stockUom: "Nos",
    brand: "",
    gstHsnCode: "",
    defaultWarehouse: references?.defaults.warehouse ?? "",
    disabled: false,
    isStockItem: true,
  }
}

export function getLeafOptions(
  options:
    | FrappeItemManager["references"]["itemGroups"]
    | FrappeItemManager["references"]["warehouses"]
) {
  return options.filter((option) => !option.disabled && !option.isGroup)
}

export function getActiveOptions(
  options:
    | FrappeItemManager["references"]["stockUoms"]
    | FrappeItemManager["references"]["brands"]
    | FrappeItemManager["references"]["gstHsnCodes"]
    | FrappePurchaseReceiptManager["references"]["statuses"]
) {
  return options.filter((option) => !option.disabled)
}

export function SectionShell({
  title,
  description,
  actions,
  children,
}: {
  title: string
  description: string
  actions?: ReactNode
  children: ReactNode
}) {
  return (
    <div className="space-y-4">
      <Card>
        <CardHeader className="gap-4 md:flex-row md:items-start md:justify-between">
          <div className="space-y-1.5">
            <CardTitle>{title}</CardTitle>
            <CardDescription>{description}</CardDescription>
          </div>
          {actions ? <div className="flex flex-wrap gap-2">{actions}</div> : null}
        </CardHeader>
      </Card>
      {children}
    </div>
  )
}

export function StateCard({ message }: { message: string }) {
  return (
    <Card>
      <CardContent className="p-5 text-sm text-muted-foreground">
        {message}
      </CardContent>
    </Card>
  )
}

export function MetricCard({
  label,
  value,
  hint,
}: {
  label: string
  value: string | number
  hint: string
}) {
  return (
    <Card>
      <CardContent className="space-y-2 p-5">
        <p className="text-xs font-semibold uppercase tracking-[0.18em] text-muted-foreground">
          {label}
        </p>
        <p className="text-2xl font-semibold text-foreground">{value}</p>
        <p className="text-sm leading-6 text-muted-foreground">{hint}</p>
      </CardContent>
    </Card>
  )
}

export function Field({
  label,
  hint,
  children,
}: {
  label: string
  hint?: string
  children: ReactNode
}) {
  return (
    <label className="grid gap-2 text-sm">
      <span className="font-medium text-foreground">{label}</span>
      {children}
      {hint ? <span className="text-xs text-muted-foreground">{hint}</span> : null}
    </label>
  )
}

export function NativeCheckbox({
  checked,
  disabled,
  onChange,
}: {
  checked: boolean
  disabled?: boolean
  onChange: (checked: boolean) => void
}) {
  return (
    <input
      type="checkbox"
      className="size-4 rounded border border-input accent-primary"
      checked={checked}
      disabled={disabled}
      onChange={(event) => onChange(event.target.checked)}
    />
  )
}
