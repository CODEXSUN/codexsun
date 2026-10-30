import { WorkspaceFilters } from "@codexsun/ui/workspace/filters";
import { useWorkspaceListTools } from "@codexsun/ui/workspace/list-tools";
import { useWorkspaceQueryValue } from "@codexsun/ui/workspace/navigation";
import type { StockStatementLine } from "./stock-statement.types";

const labels = {
  Product: "Product",
  HSN: "HSN",
  Unit: "Unit",
  Opening: "Opening",
  Inward: "Inward",
  Outward: "Outward",
  Closing: "Closing",
  "Purchase value": "Purchase value",
  "Sales value": "Sales value"
};

export function useStockStatementControls(items: StockStatementLine[]) {
  const tools = useWorkspaceListTools(labels);
  const [search, setSearch] = useWorkspaceQueryValue("search", "");
  const [, setPage] = useWorkspaceQueryValue("page", 1);
  const [filter, setFilter] = useWorkspaceQueryValue("filter", "all");
  const options = [
    { id: "all", label: "All stock", matches: () => true },
    {
      id: "positive",
      label: "In stock",
      matches: (entry: StockStatementLine) => entry.closingQuantity > 0
    },
    {
      id: "zero",
      label: "Zero stock",
      matches: (entry: StockStatementLine) => entry.closingQuantity === 0
    },
    {
      id: "negative",
      label: "Negative stock",
      matches: (entry: StockStatementLine) => entry.closingQuantity < 0
    }
  ];
  const matches = (entry: StockStatementLine) => {
    const values = {
      Product: entry.productName,
      HSN: entry.hsnCode,
      Unit: entry.unitName,
      Opening: entry.openingQuantity,
      Inward: entry.inwardQuantity,
      Outward: entry.outwardQuantity,
      Closing: entry.closingQuantity,
      "Purchase value": entry.purchaseValue,
      "Sales value": entry.salesValue
    };
    return (
      Object.values(values)
        .join(" ")
        .toLocaleLowerCase()
        .includes(search.trim().toLocaleLowerCase()) && tools.matches(values)
    );
  };
  const searched = items.filter(matches);
  const selected = options.find((option) => option.id === filter) ?? options[0]!;
  const entries = searched.filter(selected.matches);
  const toolbar = (
    <WorkspaceFilters
      searchPlaceholder="Search stock statement"
      searchValue={search}
      onSearchValueChange={(value) => {
        setSearch(value);
        setPage(1);
      }}
      filterValue={selected.id}
      onFilterValueChange={(value) => {
        setFilter(value);
        setPage(1);
      }}
      filterOptions={options.map((option) => ({
        id: option.id,
        label: option.label,
        count: searched.filter(option.matches).length
      }))}
      toolbarAction={tools.toolbarAction}
      columnOptions={tools.columnOptions}
      onShowAllColumns={tools.onShowAllColumns}
    />
  );
  const totals = entries.reduce(
    (total, entry) => ({
      openingQuantity: total.openingQuantity + entry.openingQuantity,
      inwardQuantity: total.inwardQuantity + entry.inwardQuantity,
      outwardQuantity: total.outwardQuantity + entry.outwardQuantity,
      closingQuantity: total.closingQuantity + entry.closingQuantity,
      purchaseValue: total.purchaseValue + entry.purchaseValue,
      salesValue: total.salesValue + entry.salesValue
    }),
    {
      openingQuantity: 0,
      inwardQuantity: 0,
      outwardQuantity: 0,
      closingQuantity: 0,
      purchaseValue: 0,
      salesValue: 0
    }
  );
  return { tools, entries, toolbar, search, totals };
}
