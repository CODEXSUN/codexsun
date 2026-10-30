import { useState } from "react";
import { SlidersHorizontal } from "lucide-react";
import { Button } from "../components/button";
import { WorkspaceColumnFilter } from "./column-filter";
import { useWorkspaceNavigation } from "./navigation";

export function useWorkspaceListTools(labels: Record<string, string>) {
  const navigation = useWorkspaceNavigation();
  const [local, setLocal] = useState<Record<string, string>>({});
  const state = navigation?.search ?? local;
  function patch(value: Record<string, string | undefined>) {
    if (navigation) navigation.updateSearch(value);
    else
      setLocal((current) => ({
        ...current,
        ...Object.fromEntries(
          Object.entries(value).filter((entry): entry is [string, string] => entry[1] !== undefined)
        )
      }));
  }
  const hidden = String(state.hidden ?? "")
    .split(",")
    .filter(Boolean);
  const filters = Object.fromEntries(
    Object.keys(labels).map((key) => [key, String(state[`column.${key}`] ?? "")])
  );
  const showFilters = String(state.columnSearch ?? "") === "1";
  const active = Object.values(filters).filter(Boolean).length;
  const columnOptions = Object.entries(labels).map(([id, label]) => ({
    id,
    label,
    checked: !hidden.includes(id),
    onCheckedChange: (checked: boolean) =>
      patch({
        hidden: (checked ? hidden.filter((key) => key !== id) : [...hidden, id]).join(","),
        [`column.${id}`]: "",
        page: ""
      })
  }));
  return {
    filters,
    hidden,
    columnOptions,
    showFilters,
    setColumnFilter: (id: string, value: string) => patch({ [`column.${id}`]: value, page: "" }),
    hideFilters: () => patch({ columnSearch: "" }),
    onShowAllColumns: () => patch({ hidden: "" }),
    toolbarAction: (
      <Button
        aria-label="Toggle column search filters"
        aria-pressed={showFilters}
        title="Toggle column search filters"
        className="h-8 min-w-8 gap-1 px-2"
        type="button"
        variant={showFilters ? "default" : "outline"}
        onClick={() => patch({ columnSearch: showFilters ? "" : "1" })}
      >
        <SlidersHorizontal className="size-4" />
        {active ? <span className="text-xs">{active}</span> : null}
      </Button>
    ),
    filterRow: (id: string) =>
      labels[id] ? (
        <WorkspaceColumnFilter
          label={labels[id]}
          value={filters[id] ?? ""}
          onChange={(value) => patch({ [`column.${id}`]: value, page: "" })}
          onHide={() => patch({ columnSearch: "" })}
        />
      ) : null,
    matches: (values: Record<string, unknown>) =>
      Object.entries(filters).every(
        ([id, term]) =>
          !term ||
          String(values[id] ?? "")
            .toLowerCase()
            .includes(term.toLowerCase())
      )
  };
}

export type WorkspaceListTools = ReturnType<typeof useWorkspaceListTools>;
