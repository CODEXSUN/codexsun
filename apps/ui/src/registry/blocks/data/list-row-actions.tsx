import { MoreHorizontalIcon, PencilLineIcon, Trash2Icon } from "lucide-react"

import { Button } from "@/components/ui/button"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"

export function ListRowActions({
  itemLabel,
}: {
  itemLabel: string
}) {
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          size="icon"
          variant="ghost"
          className="size-8 rounded-md"
          aria-label={`Open actions for ${itemLabel}`}
        >
          <MoreHorizontalIcon className="size-4" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-40">
        <DropdownMenuItem className="gap-2">
          <PencilLineIcon className="size-4" />
          <span>Edit</span>
        </DropdownMenuItem>
        <DropdownMenuItem className="gap-2 text-destructive focus:text-destructive">
          <Trash2Icon className="size-4" />
          <span>Delete</span>
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  )
}
