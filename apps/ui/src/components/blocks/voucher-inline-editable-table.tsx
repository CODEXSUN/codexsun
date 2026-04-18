import type { ReactNode } from "react"
import { Plus, Trash2 } from "lucide-react"

import { Button } from "@/components/ui/button"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { cn } from "@/lib/utils"

export type VoucherInlineEditableTableColumn<Row> = {
  cellClassName?: string
  header: ReactNode
  headerClassName?: string
  id: string
  renderCell: (row: Row, rowIndex: number) => ReactNode
}

export type VoucherInlineEditableTableProps<Row> = {
  addLabel?: string
  className?: string
  fitToContainer?: boolean
  columns: VoucherInlineEditableTableColumn<Row>[]
  containerClassName?: string
  description?: ReactNode
  emptyMessage?: ReactNode
  footer?: ReactNode
  getRowKey?: (row: Row, rowIndex: number) => string
  onAddRow?: () => void
  onRemoveRow?: (rowIndex: number) => void
  removeButtonLabel?: string
  removeButtonMode?: "compact" | "full"
  rows: Row[]
  title: ReactNode
}

export function VoucherInlineEditableTable<Row>({
  addLabel = "Add row",
  className,
  columns,
  description,
  emptyMessage = "No rows added yet.",
  footer,
  getRowKey,
  onAddRow,
  onRemoveRow,
  removeButtonLabel = "Remove",
  removeButtonMode = "compact",
  rows,
  title,
  fitToContainer = false,
  containerClassName,
}: VoucherInlineEditableTableProps<Row>) {
  return (
    <section className={cn("space-y-3 rounded-[1rem] border border-border/70 bg-card/70 p-4", className)}>
      <div className="flex items-center justify-between gap-3">
        <div>
          <p className="font-semibold text-foreground">{title}</p>
          {description ? <p className="text-sm text-muted-foreground">{description}</p> : null}
        </div>
        {onAddRow ? (
          <Button type="button" variant="outline" onClick={onAddRow}>
            <Plus className="mr-2 size-4" />
            {addLabel}
          </Button>
        ) : null}
      </div>

      <div
        className={cn(
          "rounded-[0.9rem] border border-border/70 bg-background/95",
          fitToContainer ? "overflow-hidden" : "overflow-x-auto",
          containerClassName
        )}
      >
        <Table className={cn(fitToContainer ? "w-full table-fixed" : "min-w-[960px]")}>
          <TableHeader>
            <TableRow className="h-9 border-border/60 bg-muted/30 hover:bg-muted/30">
              <TableHead className="w-14 min-w-14 border-r border-border/60 px-2 text-center text-[11px] font-semibold uppercase tracking-[0.14em] text-muted-foreground">
                #
              </TableHead>
              {columns.map((column) => (
                <TableHead
                  key={column.id}
                  className={cn(
                    "border-r border-border/60 px-2 text-[11px] font-semibold uppercase tracking-[0.14em] text-muted-foreground last:border-r-0",
                    column.headerClassName,
                    onRemoveRow && column.id === columns[columns.length - 1]?.id ? "border-r" : ""
                  )}
                >
                  {column.header}
                </TableHead>
              ))}
              {onRemoveRow ? (
                <TableHead className="w-12 min-w-12 px-2 text-center text-[11px] font-semibold uppercase tracking-[0.14em] text-muted-foreground">
                  Action
                </TableHead>
              ) : null}
            </TableRow>
          </TableHeader>
          <TableBody>
            {rows.length === 0 ? (
              <TableRow className="hover:bg-transparent">
                <TableCell
                  colSpan={columns.length + (onRemoveRow ? 2 : 1)}
                  className="px-4 py-6 text-center text-sm text-muted-foreground"
                >
                  {emptyMessage}
                </TableCell>
              </TableRow>
            ) : (
              rows.map((row, rowIndex) => (
                <TableRow
                  key={getRowKey ? getRowKey(row, rowIndex) : `voucher-inline-row:${rowIndex}`}
                  className="h-10 border-border/50 align-top hover:bg-transparent"
                >
                  <TableCell className="border-r border-border/50 px-2 text-center text-sm text-muted-foreground">
                    {rowIndex + 1}
                  </TableCell>
                  {columns.map((column) => (
                    <TableCell
                      key={column.id}
                      className={cn(
                        "border-r border-border/50 px-2 py-1 align-top last:border-r-0",
                        column.cellClassName,
                        onRemoveRow && column.id === columns[columns.length - 1]?.id ? "border-r" : ""
                      )}
                    >
                      {column.renderCell(row, rowIndex)}
                    </TableCell>
                  ))}
                  {onRemoveRow ? (
                    <TableCell className="px-1 py-1 text-center align-top">
                      <Button
                        type="button"
                        variant="ghost"
                        size={removeButtonMode === "compact" ? "icon" : "sm"}
                        className={removeButtonMode === "compact" ? "size-7 rounded-full" : undefined}
                        onClick={() => onRemoveRow(rowIndex)}
                      >
                        <Trash2 className={removeButtonMode === "compact" ? "size-4" : "mr-2 size-4"} />
                        <span className={removeButtonMode === "compact" ? "sr-only" : undefined}>
                          {removeButtonLabel}
                        </span>
                      </Button>
                    </TableCell>
                  ) : null}
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>

      {footer ? <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-4">{footer}</div> : null}
    </section>
  )
}
