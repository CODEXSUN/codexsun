import { WorkspaceFilters } from "@codexsun/ui/workspace/filters";
import { useWorkspaceListTools } from "@codexsun/ui/workspace/list-tools";
import { useWorkspaceQueryValue } from "@codexsun/ui/workspace/navigation";
import type {
  GstStatement,
  GstStatementDocument,
  GstStatementHsnLine,
  GstStatementPanel
} from "./gst-statement.types";

const labels = Object.fromEntries(
  [
    "#",
    "GST No",
    "Contact name",
    "Taxable amount",
    "Tax %",
    "IGST",
    "CGST",
    "SGST",
    "Invoice total",
    "HSN code",
    "Product name",
    "Total qty"
  ].map((label) => [label, label])
);

export function useGstStatementControls(statement: GstStatement | undefined) {
  const tools = useWorkspaceListTools(labels);
  const [search, setSearch] = useWorkspaceQueryValue("search", "");
  const [filter, setFilter] = useWorkspaceQueryValue("filter", "all");
  const options = [
    { id: "all", label: "All tax lines" },
    { id: "taxed", label: "With GST" },
    { id: "untaxed", label: "Without GST" }
  ];
  const selected = options.some((option) => option.id === filter) ? filter : "all";
  function matches(entry: GstStatementDocument | GstStatementHsnLine, wanted = selected) {
    const values = gstStatementValues(entry);
    const taxed = entry.igstAmount + entry.cgstAmount + entry.sgstAmount !== 0;
    return (
      (wanted === "all" || (wanted === "taxed" ? taxed : !taxed)) &&
      Object.values(values)
        .join(" ")
        .toLocaleLowerCase()
        .includes(search.trim().toLocaleLowerCase()) &&
      tools.matches(values)
    );
  }
  function filterPanel(panel: GstStatementPanel | undefined) {
    return panel
      ? {
          ...panel,
          documents: panel.documents.filter((entry) => matches(entry)),
          hsn: panel.hsn.filter((entry) => matches(entry))
        }
      : undefined;
  }
  const toolbar = (
    <WorkspaceFilters
      searchPlaceholder="Search GST documents or HSN"
      searchValue={search}
      onSearchValueChange={setSearch}
      toolbarAction={tools.toolbarAction}
      columnOptions={tools.columnOptions}
      onShowAllColumns={tools.onShowAllColumns}
      filterOptions={options.map((option) => ({
        ...option,
        count: [
          ...(statement?.sales.documents ?? []),
          ...(statement?.purchases.documents ?? [])
        ].filter((entry) => matches(entry, option.id)).length
      }))}
      filterValue={selected}
      onFilterValueChange={setFilter}
    />
  );
  return { tools, toolbar, filterPanel };
}

function gstStatementValues(
  entry: GstStatementDocument | GstStatementHsnLine
): Record<string, unknown> {
  const common = {
    "Taxable amount": entry.taxableAmount,
    IGST: entry.igstAmount,
    CGST: entry.cgstAmount,
    SGST: entry.sgstAmount
  };
  return "documentNumber" in entry
    ? {
        ...common,
        "#": entry.serial,
        "GST No": entry.gstin || "Unregistered",
        "Contact name": `${entry.contactName} ${entry.documentNumber} ${entry.documentDate} ${entry.documentType}`,
        "Tax %": entry.taxRates.map((rate) => `${rate}%`).join(", "),
        "Invoice total": entry.invoiceTotal
      }
    : {
        ...common,
        "HSN code": entry.hsnCode,
        "Product name": entry.productName,
        "Total qty": entry.totalQuantity
      };
}
