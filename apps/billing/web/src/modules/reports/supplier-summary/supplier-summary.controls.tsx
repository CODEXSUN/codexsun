import { WorkspaceFilters } from "@codexsun/ui/workspace/filters";
import { useWorkspaceListTools } from "@codexsun/ui/workspace/list-tools";
import { useWorkspaceQueryValue } from "@codexsun/ui/workspace/navigation";
import type { SupplierSummaryItem } from "./supplier-summary.types";

const labels = {
  Supplier: "Supplier",
  Code: "Code",
  Debit: "Debit",
  Credit: "Credit",
  Balance: "Balance"
};

export function useSupplierSummaryControls(items: SupplierSummaryItem[]) {
  const tools = useWorkspaceListTools(labels);
  const [search, setSearch] = useWorkspaceQueryValue("search", "");
  const [filter, setFilter] = useWorkspaceQueryValue("filter", "all");
  const options = [
    { id: "all", label: "All balances", matches: () => true },
    {
      id: "positive",
      label: "Positive balances",
      matches: (entry: SupplierSummaryItem) => entry.balance > 0
    },
    {
      id: "negative",
      label: "Negative balances",
      matches: (entry: SupplierSummaryItem) => entry.balance < 0
    },
    {
      id: "zero",
      label: "Zero balances",
      matches: (entry: SupplierSummaryItem) => entry.balance === 0
    }
  ];
  const matches = (entry: SupplierSummaryItem) => {
    const values = {
      Supplier: entry.name,
      Code: entry.code,
      Debit: entry.debit,
      Credit: entry.credit,
      Balance: entry.balance
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
      searchPlaceholder="Search supplier summary"
      searchValue={search}
      onSearchValueChange={setSearch}
      filterValue={selected.id}
      onFilterValueChange={setFilter}
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
