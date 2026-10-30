import { WorkspaceFilters } from "@codexsun/ui/workspace/filters";
import { useWorkspaceListTools } from "@codexsun/ui/workspace/list-tools";
import { useWorkspaceQueryValue } from "@codexsun/ui/workspace/navigation";
import type { CustomerSummaryItem } from "./customer-summary.types";

const labels = {
  Customer: "Customer",
  Code: "Code",
  Debit: "Debit",
  Credit: "Credit",
  Balance: "Balance"
};

export function useCustomerSummaryControls(items: CustomerSummaryItem[]) {
  const tools = useWorkspaceListTools(labels);
  const [search, setSearch] = useWorkspaceQueryValue("search", "");
  const [filter, setFilter] = useWorkspaceQueryValue("filter", "all");
  const options = [
    { id: "all", label: "All balances", matches: () => true },
    {
      id: "positive",
      label: "Debit balances",
      matches: (entry: CustomerSummaryItem) => entry.balance > 0
    },
    {
      id: "negative",
      label: "Credit balances",
      matches: (entry: CustomerSummaryItem) => entry.balance < 0
    },
    {
      id: "zero",
      label: "Zero balances",
      matches: (entry: CustomerSummaryItem) => entry.balance === 0
    }
  ];
  const matches = (entry: CustomerSummaryItem) => {
    const values = {
      Customer: entry.name,
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
      searchPlaceholder="Search customer summary"
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
