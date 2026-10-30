import { WorkspaceFilters } from "@codexsun/ui/workspace/filters";
import { useWorkspaceListTools } from "@codexsun/ui/workspace/list-tools";
import { useWorkspaceQueryValue } from "@codexsun/ui/workspace/navigation";
import type { SupplierStatementLine } from "./supplier-statement.types";
import { formatSupplierStatementAge } from "./supplier-statement.age";

const labels = {
  Date: "Date",
  Voucher: "Voucher",
  Type: "Type",
  Narration: "Narration",
  Debit: "Debit",
  Credit: "Credit",
  Balance: "Balance",
  Age: "Age"
};

export function useSupplierStatementControls(items: SupplierStatementLine[]) {
  const tools = useWorkspaceListTools(labels);
  const [search, setSearch] = useWorkspaceQueryValue("search", "");
  const [, setPage] = useWorkspaceQueryValue("page", 1);
  const [filter, setFilter] = useWorkspaceQueryValue("filter", "all");
  const options = [
    { id: "all", label: "All movements", matches: () => true },
    {
      id: "purchase",
      label: "Purchases",
      matches: (entry: SupplierStatementLine) => entry.kind === "purchase"
    },
    {
      id: "payment",
      label: "Payments",
      matches: (entry: SupplierStatementLine) => entry.kind === "payment"
    }
  ];
  const matches = (entry: SupplierStatementLine) => {
    const values = {
      Date: entry.date,
      Voucher: entry.documentNumber,
      Type: entry.kind,
      Narration: entry.narration,
      Debit: entry.debit,
      Credit: entry.credit,
      Balance: entry.balance,
      Age: formatSupplierStatementAge(entry.date)
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
      searchPlaceholder="Search supplier statement"
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
  return { tools, entries, toolbar, search };
}
