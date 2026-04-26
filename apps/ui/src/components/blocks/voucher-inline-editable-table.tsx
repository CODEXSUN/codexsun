import type { ReactNode } from "react"
import { Plus, Trash2 } from "lucide-react"

import { Button } from "@/components/ui/button"
import {
  Table,
  TableBody,
  TableCell,
  TableFooter,
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
  width?: number | string
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
  summaryRow?: ReactNode
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
  summaryRow,
  title,
  fitToContainer = false,
  containerClassName,
}: VoucherInlineEditableTableProps<Row>) {
  const compactIndexColumnWidth = 30
  const compactActionColumnWidth = 38
  const compactIndexColumnStyle = {
    maxWidth: compactIndexColumnWidth,
    minWidth: compactIndexColumnWidth,
    width: compactIndexColumnWidth,
  }
  const compactActionColumnStyle = {
    maxWidth: compactActionColumnWidth,
    minWidth: compactActionColumnWidth,
    width: compactActionColumnWidth,
  }

  return (
    <section
      className={cn(
        "space-y-3 rounded-[1rem] border border-border/70 bg-card/70",
        fitToContainer ? "p-3" : "p-4",
        className
      )}
    >
      <div className={cn("flex items-center justify-between gap-3", fitToContainer && "gap-2")}>
        <div>
          <p className="font-semibold text-foreground">{title}</p>
          {description ? (
            <p className={cn("text-sm text-muted-foreground", fitToContainer && "text-xs")}>
              {description}
            </p>
          ) : null}
        </div>
        {onAddRow ? (
          <Button
            type="button"
            variant="outline"
            onClick={onAddRow}
            size={fitToContainer ? "sm" : "default"}
          >
            <Plus className="mr-2 size-4" />
            {addLabel}
          </Button>
        ) : null}
      </div>

      <div
        className={cn(
          "rounded-md border border-border/70 bg-background/95",
          fitToContainer ? "overflow-hidden" : "overflow-x-auto",
          containerClassName
        )}
      >
        <Table className={cn(fitToContainer ? "w-full table-fixed" : "min-w-240")}>
          {fitToContainer ? (
            <colgroup>
              <col style={{ width: `${compactIndexColumnWidth}px` }} />
              {columns.map((column) => (
                <col
                  key={column.id}
                  style={column.width !== undefined ? { width: column.width } : undefined}
                />
              ))}
              {onRemoveRow ? <col style={{ width: `${compactActionColumnWidth}px` }} /> : null}
            </colgroup>
          ) : null}
          <TableHeader>
            <TableRow
              className={cn(
                "border-border/60 bg-muted/30 hover:bg-muted/30",
                fitToContainer ? "h-8" : "h-9"
              )}
            >
              <TableHead
                style={fitToContainer ? compactIndexColumnStyle : undefined}
                className={cn(
                  "border-r border-border/60 text-center font-semibold uppercase tracking-[0.14em] text-muted-foreground whitespace-nowrap",
                  fitToContainer ? "px-1 text-[10px]" : "w-14 min-w-14 px-2 text-[11px]"
                )}
              >
                #
              </TableHead>
              {columns.map((column) => (
                <TableHead
                  key={column.id}
                  className={cn(
                    "border-r border-border/60 font-semibold uppercase tracking-[0.14em] text-muted-foreground last:border-r-0",
                    fitToContainer
                      ? "overflow-hidden text-ellipsis whitespace-nowrap px-1.5 text-[10px]"
                      : "px-2 text-[11px]",
                    column.headerClassName,
                    onRemoveRow && column.id === columns[columns.length - 1]?.id ? "border-r" : ""
                  )}
                >
                  {column.header}
                </TableHead>
              ))}
              {onRemoveRow ? (
                <TableHead
                  style={fitToContainer ? compactActionColumnStyle : undefined}
                  className={cn(
                    "text-center font-semibold uppercase tracking-[0.14em] text-muted-foreground whitespace-nowrap",
                    fitToContainer ? "px-1 text-[8px]" : "w-12 min-w-12 px-2 text-[11px]"
                  )}
                >
                  {fitToContainer ? (
                    <>
                      <span aria-hidden>Act</span>
                      <span className="sr-only">Action</span>
                    </>
                  ) : (
                    "Action"
                  )}
                </TableHead>
              ) : null}
            </TableRow>
          </TableHeader>
          <TableBody>
            {rows.length === 0 ? (
              <TableRow className="hover:bg-transparent">
                <TableCell
                  colSpan={columns.length + (onRemoveRow ? 2 : 1)}
                  className={cn(
                    "text-center text-muted-foreground",
                    fitToContainer ? "px-3 py-5 text-xs" : "px-4 py-6 text-sm"
                  )}
                >
                  {emptyMessage}
                </TableCell>
              </TableRow>
            ) : (
              rows.map((row, rowIndex) => (
                <TableRow
                  key={getRowKey ? getRowKey(row, rowIndex) : `voucher-inline-row:${rowIndex}`}
                  className={cn(
                    "border-border/50 align-middle hover:bg-transparent",
                    fitToContainer ? "h-9" : "h-10"
                  )}
                >
                  <TableCell
                    style={fitToContainer ? compactIndexColumnStyle : undefined}
                    className={cn(
                      "border-r border-border/50 text-center text-muted-foreground whitespace-nowrap",
                      fitToContainer ? "px-1 text-[11px]" : "px-2 text-sm"
                    )}
                  >
                    {rowIndex + 1}
                  </TableCell>
                  {columns.map((column) => (
                    <TableCell
                      key={column.id}
                      className={cn(
                        "border-r border-border/50 align-middle last:border-r-0",
                        fitToContainer
                          ? "min-w-0 overflow-hidden px-1.5 py-0.5 [&_*]:min-w-0"
                          : "px-2 py-1",
                        column.cellClassName,
                        onRemoveRow && column.id === columns[columns.length - 1]?.id ? "border-r" : ""
                      )}
                    >
                      {column.renderCell(row, rowIndex)}
                    </TableCell>
                  ))}
                  {onRemoveRow ? (
                    <TableCell
                      style={fitToContainer ? compactActionColumnStyle : undefined}
                      className={cn(
                        "text-center align-middle whitespace-nowrap",
                        fitToContainer ? "px-1 py-0.5" : "px-1 py-1"
                      )}
                    >
                      <Button
                        type="button"
                        variant="ghost"
                        size={removeButtonMode === "compact" ? "icon" : "sm"}
                        className={
                          removeButtonMode === "compact"
                            ? fitToContainer
                              ? "size-6 rounded-full"
                              : "size-7 rounded-full"
                            : undefined
                        }
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
          {summaryRow ? <TableFooter>{summaryRow}</TableFooter> : null}
        </Table>
      </div>

      {footer ? <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-4">{footer}</div> : null}
    </section>
  )
}
