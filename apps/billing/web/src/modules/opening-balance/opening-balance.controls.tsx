import { WorkspaceFilters } from "@codexsun/ui/workspace/filters";
import { useWorkspaceListTools } from "@codexsun/ui/workspace/list-tools";
import { useWorkspaceQueryValue } from "@codexsun/ui/workspace/navigation";
import type { OpeningBalance } from "./opening-balance.types";

const labels = { Party: "Party", Role: "Role", Opening: "Opening", Source: "Source" };

export function useOpeningBalanceControls(items: OpeningBalance[]) {
  const tools = useWorkspaceListTools(labels);
  const [search, setSearch] = useWorkspaceQueryValue("search", "");
  const [filter, setFilter] = useWorkspaceQueryValue("filter", "all");
  const options = [
    { id: "all", label: "All openings", matches: () => true },
    {
      id: "customer",
      label: "Customers",
      matches: (entry: OpeningBalance) => entry.partyRole === "customer"
    },
    {
      id: "supplier",
      label: "Suppliers",
      matches: (entry: OpeningBalance) => entry.partyRole === "supplier"
    },
    {
      id: "legacy",
      label: "Legacy assignments",
      matches: (entry: OpeningBalance) => entry.assignLegacy
    }
  ];
  const matches = (entry: OpeningBalance) => {
    const values = {
      Party: entry.contactName,
      Role: entry.partyRole,
      Opening: `${entry.currencyCode} ${entry.amount.toFixed(2)}`,
      Source: entry.assignLegacy ? "Reviewed legacy assignment" : "Manual opening"
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
      searchPlaceholder="Search opening balance"
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
