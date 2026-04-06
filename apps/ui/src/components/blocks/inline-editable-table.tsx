"use client";

import { useId, useRef, useState, type KeyboardEvent } from "react";
import { format } from "date-fns";
import {
  CalendarIcon,
  ChevronsDown,
  ChevronsUp,
  MoreHorizontal,
  PackageCheck,
  Plus,
  RotateCcw,
  Settings2,
  TextCursorInput,
} from "lucide-react";
import { Link } from "react-router-dom";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Input } from "@/components/ui/input";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Switch } from "@/components/ui/switch";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Textarea } from "@/components/ui/textarea";
import {
  buildEmptyRow,
  createLookupValue,
  createSampleRows,
  defaultCityOptionsByState,
  defaultStateOptions,
  getCityOptions,
  getNextRowId,
  type EditableTableRow,
  INLINE_TABLE_FIRST_COLUMN_WIDTH,
  INLINE_TABLE_LAST_COLUMN_WIDTH,
} from "@/components/blocks/inline-editable-table.utils";
import {
  SearchableLookupField,
  type SearchableLookupOption,
} from "@/features/forms/searchable-lookup-field";
import { cn } from "@/lib/utils";

type InlineEditableTableProps = {
  className?: string;
  cityOptionsByState?: Record<string, SearchableLookupOption[]>;
  defaultRows?: EditableTableRow[];
  layout?: "full" | "table-only";
  onRowsChange?: (rows: EditableTableRow[]) => void;
  showSideMenu?: boolean;
  showFullTableShortcut?: boolean;
  stateOptions?: SearchableLookupOption[];
  value?: EditableTableRow[];
};

type EditableColumnId =
  | "line"
  | "itemName"
  | "quantity"
  | "deliveryDate"
  | "state"
  | "city"
  | "notes"
  | "published";

type SpreadsheetColumnId =
  | "itemName"
  | "quantity"
  | "deliveryDate"
  | "state"
  | "city"
  | "notes"
  | "published";

const stackItems = [
  {
    description:
      "Column settings stay above the table instead of in a side-by-side preview.",
    href: "overview",
    icon: Settings2,
    label: "Settings stack",
  },
  {
    description:
      "Edits happen inline with text, date, lookup, textarea, and switch cells.",
    href: "table",
    icon: TextCursorInput,
    label: "Inline editing",
  },
  {
    description:
      "Each row exposes edit, duplicate, delete, and reorder actions from one menu.",
    href: "actions",
    icon: MoreHorizontal,
    label: "Row actions",
  },
];

const editableColumns: Array<{
  description: string;
  id: EditableColumnId;
  label: string;
}> = [
  { id: "line", label: "Line", description: "Line id and row status" },
  { id: "itemName", label: "Item name", description: "Inline text input" },
  { id: "quantity", label: "Quantity", description: "Number input" },
  {
    id: "deliveryDate",
    label: "Delivery date",
    description: "Calendar picker",
  },
  { id: "state", label: "State", description: "Searchable lookup" },
  { id: "city", label: "City", description: "Dependent lookup" },
  { id: "notes", label: "Notes", description: "Textarea editor" },
  { id: "published", label: "Publish", description: "Immediate toggle" },
];

const spreadsheetColumns: SpreadsheetColumnId[] = [
  "itemName",
  "quantity",
  "deliveryDate",
  "state",
  "city",
  "notes",
  "published",
];

const defaultVisibleColumns: Record<EditableColumnId, boolean> = {
  line: true,
  itemName: true,
  quantity: true,
  deliveryDate: true,
  state: true,
  city: true,
  notes: true,
  published: true,
};

function formatDateLabel(value?: Date) {
  return value ? format(value, "dd MMM yyyy") : "Pick date";
}

function formatDateInputValue(value?: Date) {
  return value ? format(value, "yyyy-MM-dd") : "";
}

function parseDateInputValue(value: string) {
  return value ? new Date(`${value}T00:00:00`) : undefined;
}

function EditableDateCell({
  onChange,
  value,
}: {
  onChange: (value?: Date) => void;
  value?: Date;
}) {
  const [open, setOpen] = useState(false);

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger
        render={
          <Button
            variant="outline"
            className="h-9 w-full justify-start rounded-lg px-3 text-left font-normal"
          />
        }
      >
        <CalendarIcon className="text-muted-foreground size-4" />
        <span className={cn(!value ? "text-muted-foreground" : undefined)}>
          {formatDateLabel(value)}
        </span>
      </PopoverTrigger>
      <PopoverContent className="w-auto p-0" align="start">
        <Calendar
          mode="single"
          selected={value}
          onSelect={(nextValue) => {
            onChange(nextValue);
            setOpen(false);
          }}
        />
      </PopoverContent>
    </Popover>
  );
}

function spreadsheetCellClass(isActive: boolean) {
  return cn(
    "h-9 w-full rounded-none border-0 bg-transparent px-2 text-sm shadow-none transition",
    "focus-visible:outline-none focus-visible:ring-0",
    isActive ? "bg-primary/5 inset-ring inset-ring-primary/40" : "",
  );
}

export function InlineEditableTable({
  className,
  cityOptionsByState = defaultCityOptionsByState,
  defaultRows,
  layout = "full",
  onRowsChange,
  showSideMenu = false,
  showFullTableShortcut = false,
  stateOptions = defaultStateOptions,
  value,
}: InlineEditableTableProps) {
  const [internalRows, setInternalRows] = useState<EditableTableRow[]>(
    () => defaultRows ?? createSampleRows(),
  );
  const [visibleColumns, setVisibleColumns] = useState(defaultVisibleColumns);
  const [customStateOptions, setCustomStateOptions] = useState<
    SearchableLookupOption[]
  >([]);
  const [customCityOptionsByState, setCustomCityOptionsByState] = useState<
    Record<string, SearchableLookupOption[]>
  >({});
  const [activeCell, setActiveCell] = useState<{
    columnId: SpreadsheetColumnId;
    rowId: string;
  } | null>(null);
  const sectionId = useId().replace(/:/g, "");
  const cellRefs = useRef(new Map<string, HTMLElement>());
  const isTableOnly = layout === "table-only";
  const rows = value ?? internalRows;
  const publishedCount = rows.filter((row) => row.published).length;
  const scheduledCount = rows.filter((row) => row.deliveryDate).length;
  const totalQuantity = rows.reduce((total, row) => total + row.quantity, 0);
  const visibleColumnCount = editableColumns.filter(
    (column) => visibleColumns[column.id],
  ).length;
  const mergedStateOptions = [...stateOptions, ...customStateOptions];

  function setRows(
    nextRows:
      | EditableTableRow[]
      | ((rows: EditableTableRow[]) => EditableTableRow[]),
  ) {
    const resolvedRows =
      typeof nextRows === "function" ? nextRows(rows) : nextRows;

    if (value === undefined) {
      setInternalRows(resolvedRows);
    }

    onRowsChange?.(resolvedRows);
  }

  function getMergedCityOptions(state: string) {
    return [
      ...(cityOptionsByState[state] ?? []),
      ...(customCityOptionsByState[state] ?? []),
    ];
  }

  function getCellKey(rowId: string, columnId: SpreadsheetColumnId) {
    return `${rowId}:${columnId}`;
  }

  function registerCellRef(
    rowId: string,
    columnId: SpreadsheetColumnId,
    node: HTMLElement | null,
  ) {
    const key = getCellKey(rowId, columnId);

    if (node) {
      cellRefs.current.set(key, node);
      return;
    }

    cellRefs.current.delete(key);
  }

  function focusCellByPosition(
    rowIndex: number,
    columnId: SpreadsheetColumnId,
  ) {
    const row = rows[rowIndex];

    if (!row) {
      return;
    }

    requestAnimationFrame(() => {
      const target = cellRefs.current.get(getCellKey(row.id, columnId));
      target?.focus();
    });
  }

  function appendRowAndFocus() {
    setRows((current) => {
      const nextRow = buildEmptyRow(current, stateOptions, cityOptionsByState);

      requestAnimationFrame(() => {
        const target = cellRefs.current.get(getCellKey(nextRow.id, "itemName"));
        target?.focus();
      });

      return [...current, nextRow];
    });
  }

  function moveSpreadsheetFocus(
    rowId: string,
    columnId: SpreadsheetColumnId,
    direction: "up" | "down" | "left" | "right" | "next" | "previous",
  ) {
    const rowIndex = rows.findIndex((row) => row.id === rowId);
    const columnIndex = spreadsheetColumns.indexOf(columnId);

    if (rowIndex === -1 || columnIndex === -1) {
      return;
    }

    let nextRowIndex = rowIndex;
    let nextColumnIndex = columnIndex;

    if (direction === "up") nextRowIndex -= 1;
    if (direction === "down") nextRowIndex += 1;
    if (direction === "left") nextColumnIndex -= 1;
    if (direction === "right") nextColumnIndex += 1;
    if (direction === "previous") {
      nextColumnIndex -= 1;
      if (nextColumnIndex < 0) {
        nextRowIndex -= 1;
        nextColumnIndex = spreadsheetColumns.length - 1;
      }
    }
    if (direction === "next") {
      nextColumnIndex += 1;
      if (nextColumnIndex >= spreadsheetColumns.length) {
        nextRowIndex += 1;
        nextColumnIndex = 0;
      }
    }

    if (
      direction === "next" &&
      rowIndex === rows.length - 1 &&
      columnIndex === spreadsheetColumns.length - 1
    ) {
      appendRowAndFocus();
      return;
    }

    if (
      nextRowIndex < 0 ||
      nextRowIndex >= rows.length ||
      nextColumnIndex < 0 ||
      nextColumnIndex >= spreadsheetColumns.length
    ) {
      return;
    }

    focusCellByPosition(nextRowIndex, spreadsheetColumns[nextColumnIndex]);
  }

  function handleSpreadsheetKeyDown(
    event: KeyboardEvent<HTMLElement>,
    rowId: string,
    columnId: SpreadsheetColumnId,
  ) {
    if (event.key === "Escape") {
      event.preventDefault();
      (event.currentTarget as HTMLElement).blur();
      setActiveCell(null);
      return;
    }

    if (event.key === "Enter") {
      event.preventDefault();
      moveSpreadsheetFocus(
        rowId,
        columnId,
        event.shiftKey ? "previous" : "next",
      );
      return;
    }

    if (event.key === "Tab") {
      event.preventDefault();
      moveSpreadsheetFocus(
        rowId,
        columnId,
        event.shiftKey ? "previous" : "next",
      );
      return;
    }

    if (event.key === "ArrowLeft") {
      const element = event.currentTarget as HTMLInputElement;
      if (
        "selectionStart" in element &&
        "selectionEnd" in element &&
        element.selectionStart === 0 &&
        element.selectionEnd === 0
      ) {
        event.preventDefault();
        moveSpreadsheetFocus(rowId, columnId, "left");
      }
      return;
    }

    if (event.key === "ArrowRight") {
      const element = event.currentTarget as HTMLInputElement;
      if (
        "selectionStart" in element &&
        "selectionEnd" in element &&
        element.selectionStart === element.value.length &&
        element.selectionEnd === element.value.length
      ) {
        event.preventDefault();
        moveSpreadsheetFocus(rowId, columnId, "right");
      }
    }
  }

  function updateRow(
    rowId: string,
    updater: (row: EditableTableRow) => EditableTableRow,
  ) {
    setRows((current) =>
      current.map((row) => (row.id === rowId ? updater(row) : row)),
    );
  }

  function addRow() {
    setRows((current) => [
      ...current,
      buildEmptyRow(current, stateOptions, cityOptionsByState),
    ]);
  }

  function duplicateRow(rowId: string) {
    setRows((current) => {
      const source = current.find((row) => row.id === rowId);

      if (!source) {
        return current;
      }

      return [
        ...current,
        {
          ...source,
          id: getNextRowId(current),
          itemName: source.itemName ? `${source.itemName} copy` : "Copied line",
        },
      ];
    });
  }

  function deleteRow(rowId: string) {
    setRows((current) => {
      if (current.length <= 1) {
        return current;
      }

      return current.filter((row) => row.id !== rowId);
    });
  }

  function moveRow(rowId: string, direction: "up" | "down") {
    setRows((current) => {
      const index = current.findIndex((row) => row.id === rowId);

      if (index === -1) {
        return current;
      }

      const nextIndex = direction === "up" ? index - 1 : index + 1;

      if (nextIndex < 0 || nextIndex >= current.length) {
        return current;
      }

      const nextRows = [...current];
      const [row] = nextRows.splice(index, 1);
      nextRows.splice(nextIndex, 0, row);
      return nextRows;
    });
  }

  function resetRows() {
    setRows(createSampleRows());
  }

  function resetColumns() {
    setVisibleColumns(defaultVisibleColumns);
  }

  function toggleColumn(columnId: EditableColumnId, checked: boolean) {
    setVisibleColumns((current) => ({
      ...current,
      [columnId]: checked,
    }));
  }

  const tableSection = isTableOnly ? (
    <div className="theme-preview-surface border-border/60 min-h-[calc(100vh-10rem)] rounded-sm border bg-[radial-gradient(circle_at_top_left,rgba(255,255,255,0.8),transparent_28%),linear-gradient(180deg,rgba(249,249,247,0.98),rgba(239,239,236,0.94))] p-3 shadow-sm">
      <div className="border-border/60 bg-background/95 overflow-hidden rounded-sm border shadow-[0_1px_2px_rgba(0,0,0,0.04)]">
        <div className="[&::-webkit-scrollbar-thumb]:bg-border/80 overflow-auto [scrollbar-color:hsl(var(--border))_transparent] [scrollbar-width:thin] [&::-webkit-scrollbar]:h-1 [&::-webkit-scrollbar]:w-1 [&::-webkit-scrollbar-thumb]:rounded-full [&::-webkit-scrollbar-track]:bg-transparent">
          <Table className="min-w-[1240px]">
            <TableHeader>
              <TableRow className="border-border/60 bg-muted/40 hover:bg-muted/40 h-10">
                <TableHead
                  className={cn(
                    "border-border/60 text-muted-foreground h-10 border-r px-2 text-center text-[11px] font-semibold tracking-[0.14em] uppercase",
                    INLINE_TABLE_FIRST_COLUMN_WIDTH,
                  )}
                >
                  #
                </TableHead>
                <TableHead className="border-border/60 text-muted-foreground h-10 min-w-[220px] border-r px-2 text-[11px] font-semibold tracking-[0.14em] uppercase">
                  Item
                </TableHead>
                <TableHead className="border-border/60 text-muted-foreground h-10 w-[100px] border-r px-2 text-[11px] font-semibold tracking-[0.14em] uppercase">
                  Qty
                </TableHead>
                <TableHead className="border-border/60 text-muted-foreground h-10 w-[132px] border-r px-2 text-[11px] font-semibold tracking-[0.14em] uppercase">
                  Date
                </TableHead>
                <TableHead className="border-border/60 text-muted-foreground h-10 w-[132px] border-r px-2 text-[11px] font-semibold tracking-[0.14em] uppercase">
                  State
                </TableHead>
                <TableHead className="border-border/60 text-muted-foreground h-10 w-[132px] border-r px-2 text-[11px] font-semibold tracking-[0.14em] uppercase">
                  City
                </TableHead>
                <TableHead className="border-border/60 text-muted-foreground h-10 min-w-[220px] border-r px-2 text-[11px] font-semibold tracking-[0.14em] uppercase">
                  Notes
                </TableHead>
                <TableHead className="border-border/60 text-muted-foreground h-10 w-[92px] border-r px-2 text-center text-[11px] font-semibold tracking-[0.14em] uppercase">
                  Live
                </TableHead>
                <TableHead
                  className={cn(
                    "text-muted-foreground h-10 px-1 text-center text-[11px] font-semibold tracking-[0.14em] uppercase",
                    INLINE_TABLE_LAST_COLUMN_WIDTH,
                  )}
                >
                  ...
                </TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {rows.map((row, rowIndex) => (
                <TableRow
                  key={row.id}
                  className="border-border/50 h-9 hover:bg-transparent"
                >
                  <TableCell
                    className={cn(
                      "border-border/50 h-9 border-r px-2 py-0 align-middle",
                      INLINE_TABLE_FIRST_COLUMN_WIDTH,
                    )}
                  >
                    <div className="flex h-full flex-col items-center justify-center space-y-0.5 text-center">
                      <p className="text-foreground text-[12px] font-medium">
                        {rowIndex + 1}
                      </p>
                      <p className="text-muted-foreground text-[10px] tracking-[0.1em] uppercase">
                        {row.published ? "Live" : "Draft"}
                      </p>
                    </div>
                  </TableCell>
                  <TableCell className="border-border/50 h-9 border-r p-0 align-middle">
                    <input
                      ref={(node) => registerCellRef(row.id, "itemName", node)}
                      value={row.itemName}
                      onChange={(event) =>
                        updateRow(row.id, (current) => ({
                          ...current,
                          itemName: event.target.value,
                        }))
                      }
                      onFocus={() =>
                        setActiveCell({ rowId: row.id, columnId: "itemName" })
                      }
                      onKeyDown={(event) =>
                        handleSpreadsheetKeyDown(event, row.id, "itemName")
                      }
                      className={spreadsheetCellClass(
                        activeCell?.rowId === row.id &&
                          activeCell.columnId === "itemName",
                      )}
                    />
                  </TableCell>
                  <TableCell className="border-border/50 h-9 border-r p-0 align-middle">
                    <input
                      ref={(node) => registerCellRef(row.id, "quantity", node)}
                      type="number"
                      value={String(row.quantity)}
                      onChange={(event) =>
                        updateRow(row.id, (current) => ({
                          ...current,
                          quantity: Math.max(
                            1,
                            Number(event.target.value || "1"),
                          ),
                        }))
                      }
                      onFocus={() =>
                        setActiveCell({ rowId: row.id, columnId: "quantity" })
                      }
                      onKeyDown={(event) =>
                        handleSpreadsheetKeyDown(event, row.id, "quantity")
                      }
                      className={spreadsheetCellClass(
                        activeCell?.rowId === row.id &&
                          activeCell.columnId === "quantity",
                      )}
                    />
                  </TableCell>
                  <TableCell className="border-border/50 h-9 border-r p-0 align-middle">
                    <input
                      ref={(node) =>
                        registerCellRef(row.id, "deliveryDate", node)
                      }
                      type="date"
                      value={formatDateInputValue(row.deliveryDate)}
                      onChange={(event) =>
                        updateRow(row.id, (current) => ({
                          ...current,
                          deliveryDate: parseDateInputValue(event.target.value),
                        }))
                      }
                      onFocus={() =>
                        setActiveCell({
                          rowId: row.id,
                          columnId: "deliveryDate",
                        })
                      }
                      onKeyDown={(event) =>
                        handleSpreadsheetKeyDown(event, row.id, "deliveryDate")
                      }
                      className={spreadsheetCellClass(
                        activeCell?.rowId === row.id &&
                          activeCell.columnId === "deliveryDate",
                      )}
                    />
                  </TableCell>
                  <TableCell className="border-border/50 h-9 border-r p-0 align-middle">
                    <div
                      ref={(node) => registerCellRef(row.id, "state", node)}
                      onFocus={() =>
                        setActiveCell({ rowId: row.id, columnId: "state" })
                      }
                      onKeyDown={(event) =>
                        handleSpreadsheetKeyDown(event, row.id, "state")
                      }
                      className={cn(
                        "h-9",
                        activeCell?.rowId === row.id &&
                          activeCell.columnId === "state"
                          ? "bg-primary/5 inset-ring-primary/40 inset-ring"
                          : "",
                      )}
                      tabIndex={-1}
                    >
                      <SearchableLookupField
                        value={row.state}
                        options={mergedStateOptions}
                        placeholder="Select state"
                        searchPlaceholder="Search state"
                        triggerClassName="h-9 rounded-none border-0 bg-transparent px-2 shadow-none focus-visible:ring-0"
                        searchInputClassName="rounded-none"
                        createActionLabel="Create state"
                        onAdvanceAfterSelection={() =>
                          moveSpreadsheetFocus(row.id, "state", "next")
                        }
                        onCreateNew={(query) => {
                          const option = {
                            label: query,
                            value: createLookupValue("state", query),
                          };

                          setCustomStateOptions((current) => [
                            ...current,
                            option,
                          ]);
                          updateRow(row.id, (current) => ({
                            ...current,
                            state: option.value,
                            city: "",
                          }));
                        }}
                        onValueChange={(state) =>
                          updateRow(row.id, (current) => {
                            const nextCityOptions = getMergedCityOptions(state);
                            const nextCity = nextCityOptions.some(
                              (option) => option.value === current.city,
                            )
                              ? current.city
                              : (nextCityOptions[0]?.value ?? "");

                            return {
                              ...current,
                              state,
                              city: nextCity,
                            };
                          })
                        }
                      />
                    </div>
                  </TableCell>
                  <TableCell className="border-border/50 h-9 border-r p-0 align-middle">
                    <div
                      ref={(node) => registerCellRef(row.id, "city", node)}
                      onFocus={() =>
                        setActiveCell({ rowId: row.id, columnId: "city" })
                      }
                      onKeyDown={(event) =>
                        handleSpreadsheetKeyDown(event, row.id, "city")
                      }
                      className={cn(
                        "h-9",
                        activeCell?.rowId === row.id &&
                          activeCell.columnId === "city"
                          ? "bg-primary/5 inset-ring-primary/40 inset-ring"
                          : "",
                      )}
                      tabIndex={-1}
                    >
                      <SearchableLookupField
                        value={row.city}
                        options={getMergedCityOptions(row.state)}
                        placeholder="Select city"
                        searchPlaceholder="Search city"
                        triggerClassName="h-9 rounded-none border-0 bg-transparent px-2 shadow-none focus-visible:ring-0"
                        searchInputClassName="rounded-none"
                        createActionLabel="Create city"
                        onAdvanceAfterSelection={() =>
                          moveSpreadsheetFocus(row.id, "city", "next")
                        }
                        onCreateNew={(query) => {
                          const option = {
                            label: query,
                            value: createLookupValue("city", query),
                          };

                          setCustomCityOptionsByState((current) => ({
                            ...current,
                            [row.state]: [
                              ...(current[row.state] ?? []),
                              option,
                            ],
                          }));
                          updateRow(row.id, (current) => ({
                            ...current,
                            city: option.value,
                          }));
                        }}
                        onValueChange={(city) =>
                          updateRow(row.id, (current) => ({
                            ...current,
                            city,
                          }))
                        }
                      />
                    </div>
                  </TableCell>
                  <TableCell className="border-border/50 h-9 border-r p-0 align-middle">
                    <input
                      ref={(node) => registerCellRef(row.id, "notes", node)}
                      value={row.notes}
                      onChange={(event) =>
                        updateRow(row.id, (current) => ({
                          ...current,
                          notes: event.target.value,
                        }))
                      }
                      onFocus={() =>
                        setActiveCell({ rowId: row.id, columnId: "notes" })
                      }
                      onKeyDown={(event) =>
                        handleSpreadsheetKeyDown(event, row.id, "notes")
                      }
                      className={spreadsheetCellClass(
                        activeCell?.rowId === row.id &&
                          activeCell.columnId === "notes",
                      )}
                    />
                  </TableCell>
                  <TableCell className="border-border/50 h-9 border-r px-0 py-0 align-middle">
                    <div
                      className={cn(
                        "flex h-9 items-center justify-center",
                        activeCell?.rowId === row.id &&
                          activeCell.columnId === "published"
                          ? "bg-primary/5 inset-ring-primary/40 inset-ring"
                          : "",
                      )}
                    >
                      <input
                        ref={(node) =>
                          registerCellRef(row.id, "published", node)
                        }
                        type="checkbox"
                        checked={row.published}
                        onChange={(event) =>
                          updateRow(row.id, (current) => ({
                            ...current,
                            published: event.target.checked,
                          }))
                        }
                        onFocus={() =>
                          setActiveCell({
                            rowId: row.id,
                            columnId: "published",
                          })
                        }
                        onKeyDown={(event) =>
                          handleSpreadsheetKeyDown(event, row.id, "published")
                        }
                        className="border-border/70 size-4 rounded border"
                      />
                    </div>
                  </TableCell>
                  <TableCell
                    className={cn(
                      "h-9 px-1 py-0 align-middle",
                      INLINE_TABLE_LAST_COLUMN_WIDTH,
                    )}
                  >
                    <div className="flex items-center justify-center">
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button
                            variant="ghost"
                            size="icon-sm"
                            className="size-7 rounded-md"
                            aria-label={`Open row actions for ${row.id}`}
                          >
                            <MoreHorizontal className="size-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end" className="w-48">
                          <DropdownMenuLabel>Row actions</DropdownMenuLabel>
                          <DropdownMenuSeparator />
                          <DropdownMenuItem
                            onClick={() =>
                              cellRefs.current
                                .get(getCellKey(row.id, "itemName"))
                                ?.focus()
                            }
                          >
                            <TextCursorInput className="size-4" />
                            Edit inline
                          </DropdownMenuItem>
                          <DropdownMenuItem
                            onClick={() => duplicateRow(row.id)}
                          >
                            <Plus className="size-4" />
                            Duplicate row
                          </DropdownMenuItem>
                          <DropdownMenuSeparator />
                          <DropdownMenuItem
                            onClick={() => moveRow(row.id, "up")}
                            disabled={rowIndex === 0}
                          >
                            <ChevronsUp className="size-4" />
                            Move up
                          </DropdownMenuItem>
                          <DropdownMenuItem
                            onClick={() => moveRow(row.id, "down")}
                            disabled={rowIndex === rows.length - 1}
                          >
                            <ChevronsDown className="size-4" />
                            Move down
                          </DropdownMenuItem>
                          <DropdownMenuSeparator />
                          <DropdownMenuItem
                            onClick={() => deleteRow(row.id)}
                            disabled={rows.length <= 1}
                            className="text-destructive focus:text-destructive"
                          >
                            Delete row
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      </div>
    </div>
  ) : null;

  if (isTableOnly) {
    return <div className={cn("w-full", className)}>{tableSection}</div>;
  }

  return (
    <div className={cn("space-y-4", className)}>
      {showSideMenu ? (
        <section className="border-border/70 bg-card/90 space-y-4 rounded-[1.5rem] border p-4">
          <div className="space-y-2">
            <Badge variant="outline">Data block</Badge>
            <div className="space-y-1">
              <h3 className="text-foreground text-lg font-semibold tracking-tight">
                Inline editable table
              </h3>
              <p className="text-muted-foreground text-sm leading-6">
                The preview stays stacked so the settings lead and the table
                keeps the full row width.
              </p>
            </div>
          </div>

          <div className="grid gap-3 lg:grid-cols-[minmax(0,1fr)_280px]">
            <div className="grid gap-2 md:grid-cols-3">
              {stackItems.map((item) => {
                const ItemIcon = item.icon;

                return (
                  <a
                    key={item.label}
                    href={`#${sectionId}-${item.href}`}
                    className="border-border/60 bg-background/70 hover:border-accent/40 hover:bg-accent/5 rounded-xl border px-3 py-3 transition"
                  >
                    <div className="flex items-start gap-3">
                      <div className="border-border/70 bg-background mt-0.5 flex size-8 items-center justify-center rounded-lg border">
                        <ItemIcon className="size-4" />
                      </div>
                      <div className="space-y-1">
                        <p className="text-foreground text-sm font-medium">
                          {item.label}
                        </p>
                        <p className="text-muted-foreground text-xs leading-5">
                          {item.description}
                        </p>
                      </div>
                    </div>
                  </a>
                );
              })}
            </div>

            <div className="grid gap-2 sm:grid-cols-3 lg:grid-cols-1">
              <div className="border-border/60 bg-background/70 rounded-xl border p-3">
                <p className="text-muted-foreground text-xs font-semibold tracking-[0.18em] uppercase">
                  Rows
                </p>
                <p className="text-foreground mt-2 text-xl font-semibold">
                  {rows.length}
                </p>
              </div>
              <div className="border-border/60 bg-background/70 rounded-xl border p-3">
                <p className="text-muted-foreground text-xs font-semibold tracking-[0.18em] uppercase">
                  Published
                </p>
                <p className="text-foreground mt-2 text-xl font-semibold">
                  {publishedCount}
                </p>
              </div>
              <div className="border-border/60 bg-background/70 rounded-xl border p-3">
                <p className="text-muted-foreground text-xs font-semibold tracking-[0.18em] uppercase">
                  Quantity
                </p>
                <p className="text-foreground mt-2 text-xl font-semibold">
                  {totalQuantity}
                </p>
              </div>
            </div>
          </div>
        </section>
      ) : null}

      <div className="space-y-4">
        <div
          id={`${sectionId}-overview`}
          className="border-border/70 bg-card/90 flex flex-wrap items-start justify-between gap-3 rounded-[1.5rem] border px-4 py-4"
        >
          <div className="space-y-1">
            <div className="flex flex-wrap items-center gap-2">
              <Badge variant="outline">Table / data-grid</Badge>
              <Badge variant="secondary">Inline editing</Badge>
            </div>
            <h3 className="text-foreground text-lg font-semibold tracking-tight">
              Mixed cell editing without leaving the table
            </h3>
            <p className="text-muted-foreground max-w-3xl text-sm leading-6">
              Use this for operator workflows where settings sit above the grid
              and the table remains full width.
            </p>
          </div>

          <div className="flex flex-wrap gap-2">
            {showFullTableShortcut ? (
              <Button asChild variant="outline" size="sm">
                <Link to="/dashboard/apps/ui/table-12-full">
                  Show full table
                </Link>
              </Button>
            ) : null}
            <Button variant="outline" size="sm" onClick={resetRows}>
              <RotateCcw className="size-4" />
              Reset sample
            </Button>
          </div>
        </div>
        <div className="grid gap-3 md:grid-cols-3">
          <div className="border-border/70 bg-background/80 rounded-[1.25rem] border p-4">
            <p className="text-muted-foreground text-xs font-semibold tracking-[0.18em] uppercase">
              Total lines
            </p>
            <p className="text-foreground mt-2 text-2xl font-semibold tracking-tight">
              {rows.length}
            </p>
          </div>
          <div className="border-border/70 bg-background/80 rounded-[1.25rem] border p-4">
            <p className="text-muted-foreground text-xs font-semibold tracking-[0.18em] uppercase">
              Scheduled dates
            </p>
            <p className="text-foreground mt-2 text-2xl font-semibold tracking-tight">
              {scheduledCount}
            </p>
          </div>
          <div className="border-border/70 bg-background/80 rounded-[1.25rem] border p-4">
            <p className="text-muted-foreground text-xs font-semibold tracking-[0.18em] uppercase">
              Ready to publish
            </p>
            <p className="text-foreground mt-2 text-2xl font-semibold tracking-tight">
              {publishedCount}
            </p>
          </div>
        </div>

        <section className="border-border/70 bg-card/90 rounded-[1.5rem] border p-4">
          <div className="flex flex-col gap-4">
            <div className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
              <div className="space-y-1">
                <div className="flex flex-wrap items-center gap-2">
                  <Badge variant="outline">11. Columns Visibility</Badge>
                  <Badge variant="secondary">Settings above table</Badge>
                </div>
                <h4 className="text-foreground text-base font-semibold tracking-tight">
                  Column visibility for the inline editable grid
                </h4>
                <p className="text-muted-foreground max-w-3xl text-sm leading-6">
                  Toggle columns here instead of collapsing the experience into
                  a side preview.
                </p>
              </div>
              <div className="flex flex-wrap gap-2">
                <Badge variant="outline">
                  {visibleColumnCount} of {editableColumns.length} columns
                  visible
                </Badge>
                <Button variant="outline" size="sm" onClick={resetColumns}>
                  <RotateCcw className="size-4" />
                  Reset columns
                </Button>
              </div>
            </div>

            <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-4">
              {editableColumns.map((column) => (
                <label
                  key={column.id}
                  className="border-border/60 bg-background/80 flex items-start gap-3 rounded-[1rem] border px-3 py-3"
                >
                  <input
                    type="checkbox"
                    className="mt-1 size-4 accent-current"
                    checked={visibleColumns[column.id]}
                    onChange={(event) =>
                      toggleColumn(column.id, event.target.checked)
                    }
                  />
                  <span className="space-y-1">
                    <span className="text-foreground block text-sm font-medium">
                      {column.label}
                    </span>
                    <span className="text-muted-foreground block text-xs leading-5">
                      {column.description}
                    </span>
                  </span>
                </label>
              ))}
            </div>
          </div>
        </section>

        <div
          id={`${sectionId}-table`}
          className="border-border/70 bg-background overflow-hidden rounded-[1.5rem] border"
        >
          <Table className="min-w-[1120px]">
            <TableHeader>
              <TableRow className="hover:bg-transparent">
                {visibleColumns.line ? (
                  <TableHead
                    className={cn(
                      INLINE_TABLE_FIRST_COLUMN_WIDTH,
                      "text-center",
                    )}
                  >
                    #
                  </TableHead>
                ) : null}
                {visibleColumns.itemName ? (
                  <TableHead className="min-w-[210px]">Item name</TableHead>
                ) : null}
                {visibleColumns.quantity ? (
                  <TableHead className="w-[110px]">Quantity</TableHead>
                ) : null}
                {visibleColumns.deliveryDate ? (
                  <TableHead className="min-w-[170px]">Delivery date</TableHead>
                ) : null}
                {visibleColumns.state ? (
                  <TableHead className="min-w-[170px]">State</TableHead>
                ) : null}
                {visibleColumns.city ? (
                  <TableHead className="min-w-[170px]">City</TableHead>
                ) : null}
                {visibleColumns.notes ? (
                  <TableHead className="min-w-[250px]">Notes</TableHead>
                ) : null}
                {visibleColumns.published ? (
                  <TableHead className="w-[120px] text-center">
                    Publish
                  </TableHead>
                ) : null}
                <TableHead
                  className={cn(INLINE_TABLE_LAST_COLUMN_WIDTH, "text-center")}
                >
                  Actions
                </TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {rows.map((row, rowIndex) => {
                const cityOptions = getCityOptions(
                  row.state,
                  cityOptionsByState,
                );

                return (
                  <TableRow key={row.id} className="align-top">
                    {visibleColumns.line ? (
                      <TableCell
                        className={cn(
                          INLINE_TABLE_FIRST_COLUMN_WIDTH,
                          "space-y-1 text-center",
                        )}
                      >
                        <p className="text-foreground font-medium">
                          {rowIndex + 1}
                        </p>
                        <p className="text-muted-foreground text-xs">
                          {row.published ? "Live" : "Draft"}
                        </p>
                      </TableCell>
                    ) : null}
                    {visibleColumns.itemName ? (
                      <TableCell>
                        <Input
                          value={row.itemName}
                          onChange={(event) =>
                            updateRow(row.id, (current) => ({
                              ...current,
                              itemName: event.target.value,
                            }))
                          }
                          placeholder="Enter line label"
                        />
                      </TableCell>
                    ) : null}
                    {visibleColumns.quantity ? (
                      <TableCell>
                        <Input
                          min={1}
                          type="number"
                          value={String(row.quantity)}
                          onChange={(event) =>
                            updateRow(row.id, (current) => ({
                              ...current,
                              quantity: Math.max(
                                1,
                                Number(event.target.value || "1"),
                              ),
                            }))
                          }
                        />
                      </TableCell>
                    ) : null}
                    {visibleColumns.deliveryDate ? (
                      <TableCell>
                        <EditableDateCell
                          value={row.deliveryDate}
                          onChange={(deliveryDate) =>
                            updateRow(row.id, (current) => ({
                              ...current,
                              deliveryDate,
                            }))
                          }
                        />
                      </TableCell>
                    ) : null}
                    {visibleColumns.state ? (
                      <TableCell>
                        <SearchableLookupField
                          value={row.state}
                          options={stateOptions}
                          placeholder="Select state"
                          searchPlaceholder="Search state"
                          onValueChange={(state) =>
                            updateRow(row.id, (current) => {
                              const nextCityOptions = getCityOptions(
                                state,
                                cityOptionsByState,
                              );
                              const nextCity = nextCityOptions.some(
                                (option) => option.value === current.city,
                              )
                                ? current.city
                                : (nextCityOptions[0]?.value ?? "");

                              return {
                                ...current,
                                state,
                                city: nextCity,
                              };
                            })
                          }
                        />
                      </TableCell>
                    ) : null}
                    {visibleColumns.city ? (
                      <TableCell>
                        <SearchableLookupField
                          value={row.city}
                          options={cityOptions}
                          placeholder="Select city"
                          searchPlaceholder="Search city"
                          onValueChange={(city) =>
                            updateRow(row.id, (current) => ({
                              ...current,
                              city,
                            }))
                          }
                        />
                      </TableCell>
                    ) : null}
                    {visibleColumns.notes ? (
                      <TableCell>
                        <Textarea
                          rows={3}
                          value={row.notes}
                          onChange={(event) =>
                            updateRow(row.id, (current) => ({
                              ...current,
                              notes: event.target.value,
                            }))
                          }
                          placeholder="Add operator note"
                          className="min-h-24 resize-none"
                        />
                      </TableCell>
                    ) : null}
                    {visibleColumns.published ? (
                      <TableCell className="text-center">
                        <div className="flex h-full min-h-24 flex-col items-center justify-center gap-2">
                          <Switch
                            checked={row.published}
                            onCheckedChange={(published) =>
                              updateRow(row.id, (current) => ({
                                ...current,
                                published: Boolean(published),
                              }))
                            }
                          />
                          <span className="text-muted-foreground text-xs">
                            {row.published ? "Enabled" : "Disabled"}
                          </span>
                        </div>
                      </TableCell>
                    ) : null}
                    <TableCell
                      className={cn(
                        INLINE_TABLE_LAST_COLUMN_WIDTH,
                        "text-center",
                      )}
                    >
                      <div className="flex items-center justify-center">
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button
                              variant="ghost"
                              size="icon-sm"
                              aria-label={`Open row actions for ${row.id}`}
                            >
                              <MoreHorizontal className="size-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end" className="w-48">
                            <DropdownMenuLabel>Row actions</DropdownMenuLabel>
                            <DropdownMenuSeparator />
                            <DropdownMenuItem
                              onClick={() => duplicateRow(row.id)}
                            >
                              <Plus className="size-4" />
                              Duplicate row
                            </DropdownMenuItem>
                            <DropdownMenuItem
                              onClick={() => moveRow(row.id, "up")}
                              disabled={rowIndex === 0}
                            >
                              <ChevronsUp className="size-4" />
                              Move up
                            </DropdownMenuItem>
                            <DropdownMenuItem
                              onClick={() => moveRow(row.id, "down")}
                              disabled={rowIndex === rows.length - 1}
                            >
                              <ChevronsDown className="size-4" />
                              Move down
                            </DropdownMenuItem>
                            <DropdownMenuSeparator />
                            <DropdownMenuItem
                              onClick={() => deleteRow(row.id)}
                              disabled={rows.length <= 1}
                              className="text-destructive focus:text-destructive"
                            >
                              Delete row
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </div>
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </div>

        <div
          id={`${sectionId}-actions`}
          className="border-border/80 bg-card/70 flex flex-wrap items-center justify-between gap-3 rounded-[1.25rem] border border-dashed px-4 py-4"
        >
          <div className="space-y-1">
            <p className="text-foreground text-sm font-medium">
              Inline workflow guidance
            </p>
            <p className="text-muted-foreground text-sm leading-6">
              Keep fast edits in the grid, use the settings row for visibility
              control, and reserve full forms for heavier validation.
            </p>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <Button size="sm" onClick={addRow}>
              <Plus className="size-4" />
              Add row
            </Button>
            <Badge variant="outline">
              <PackageCheck className="size-3.5" />
              Input, lookup, date, notes, switch, row menu
            </Badge>
          </div>
        </div>
      </div>
    </div>
  );
}
