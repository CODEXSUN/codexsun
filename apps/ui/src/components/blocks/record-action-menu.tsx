"use client"

import {
  CircleOffIcon,
  MoreHorizontalIcon,
  PencilLineIcon,
  RotateCcwIcon,
  Trash2Icon,
} from "lucide-react"
import type { ReactNode } from "react"

import { Button } from "@/components/ui/button"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"

export function RecordActionMenu({
  active = true,
  ariaLabel,
  className,
  customItems,
  deleteLabel = "Delete",
  disabled = false,
  editLabel = "Edit",
  itemLabel,
  onDelete,
  onEdit,
  onToggleActive,
}: {
  active?: boolean
  ariaLabel?: string
  className?: string
  customItems?: Array<{
    icon?: ReactNode
    key: string
    label: string
    onSelect: () => void
    destructive?: boolean
  }>
  deleteLabel?: string
  disabled?: boolean
  editLabel?: string
  itemLabel: string
  onDelete?: () => void
  onEdit?: () => void
  onToggleActive?: () => void
}) {
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          type="button"
          size="icon"
          variant="ghost"
          className={className ?? "size-8 rounded-full"}
          aria-label={ariaLabel ?? `Open actions for ${itemLabel}`}
          disabled={disabled}
        >
          <MoreHorizontalIcon className="size-4" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-44">
        {onEdit ? (
          <DropdownMenuItem className="gap-2" onSelect={onEdit}>
            <PencilLineIcon className="size-4" />
            {editLabel}
          </DropdownMenuItem>
        ) : null}
        {customItems?.map((item) => (
          <DropdownMenuItem
            key={item.key}
            className={item.destructive ? "gap-2 text-destructive focus:text-destructive" : "gap-2"}
            onSelect={item.onSelect}
          >
            {item.icon}
            {item.label}
          </DropdownMenuItem>
        ))}
        {onToggleActive ? (
          <DropdownMenuItem className="gap-2" onSelect={onToggleActive}>
            {active ? <CircleOffIcon className="size-4" /> : <RotateCcwIcon className="size-4" />}
            {active ? "Deactivate" : "Restore"}
          </DropdownMenuItem>
        ) : null}
        {onDelete ? (
          <DropdownMenuItem
            className="gap-2 text-destructive focus:text-destructive"
            onSelect={onDelete}
          >
            <Trash2Icon className="size-4" />
            {deleteLabel}
          </DropdownMenuItem>
        ) : null}
      </DropdownMenuContent>
    </DropdownMenu>
  )
}
