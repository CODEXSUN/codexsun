import { useState } from "react"

import { Badge } from "@/components/ui/badge"
import { MasterList } from "@/components/blocks/master-list"
import { ListRowActions } from "@/registry/blocks/data/list-row-actions"

type LedgerRow = {
  balance: number
  group: string
  id: string
  name: string
  nature: "asset" | "liability" | "income" | "expense"
  side: "Dr" | "Cr"
}

const rows: LedgerRow[] = [
  {
    id: "LED-001",
    name: "Cash-in-Hand",
    group: "Cash-in-Hand",
    nature: "asset",
    balance: 228400,
    side: "Dr",
  },
  {
    id: "LED-002",
    name: "Sundry Debtors",
    group: "Current Assets",
    nature: "asset",
    balance: 362700,
    side: "Dr",
  },
  {
    id: "LED-003",
    name: "Output CGST",
    group: "Duties & Taxes",
    nature: "liability",
    balance: 38220,
    side: "Cr",
  },
  {
    id: "LED-004",
    name: "Sales Account",
    group: "Sales Accounts",
    nature: "income",
    balance: 954300,
    side: "Cr",
  },
]

function formatAmount(amount: number) {
  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 0,
  }).format(amount)
}

export default function MasterList01() {
  const [searchValue, setSearchValue] = useState("")
  const [natureFilter, setNatureFilter] = useState<
    "all" | LedgerRow["nature"]
  >("all")
  const [currentPage, setCurrentPage] = useState(1)
  const [pageSize, setPageSize] = useState(10)

  const filteredRows = rows.filter((row) => {
    const normalizedSearch = searchValue.trim().toLowerCase()
    const matchesSearch =
      normalizedSearch.length === 0 ||
      [row.id, row.name, row.group].some((value) =>
        value.toLowerCase().includes(normalizedSearch)
      )
    const matchesNature = natureFilter === "all" || row.nature === natureFilter

    return matchesSearch && matchesNature
  })

  return (
    <div className="mx-auto max-w-6xl rounded-[1.75rem] border border-border/70 bg-background p-5">
      <MasterList
        header={{
          pageTitle: "Ledger Master Workspace",
          pageDescription:
            "Operational accounting master page for ledgers, parties, and governed finance entities.",
          addLabel: "New ledger",
          onAddClick: () => undefined,
        }}
        search={{
          value: searchValue,
          onChange: (value) => {
            setSearchValue(value)
            setCurrentPage(1)
          },
          placeholder: "Search masters",
        }}
        filters={{
          buttonLabel: "Nature",
          options: [
            { key: "all", label: "All", isActive: natureFilter === "all", onSelect: () => setNatureFilter("all") },
            { key: "asset", label: "Assets", isActive: natureFilter === "asset", onSelect: () => setNatureFilter("asset") },
            { key: "liability", label: "Liabilities", isActive: natureFilter === "liability", onSelect: () => setNatureFilter("liability") },
            { key: "income", label: "Income", isActive: natureFilter === "income", onSelect: () => setNatureFilter("income") },
            { key: "expense", label: "Expenses", isActive: natureFilter === "expense", onSelect: () => setNatureFilter("expense") },
          ],
          activeFilters:
            natureFilter === "all"
              ? []
              : [{ key: "nature", label: "Nature", value: natureFilter }],
          onRemoveFilter: () => setNatureFilter("all"),
          onClearAllFilters: () => setNatureFilter("all"),
        }}
        table={{
          columns: [
            {
              id: "serial",
              header: "Sl.No",
              cell: (row) => filteredRows.findIndex((candidate) => candidate.id === row.id) + 1,
              className: "w-12 text-center",
              headerClassName: "w-12 text-center",
              sticky: "left",
            },
            {
              id: "name",
              header: "Master",
              sortable: true,
              accessor: (row) => row.name,
              cell: (row) => (
                <div>
                  <p className="font-medium text-foreground">{row.name}</p>
                  <p className="text-sm text-muted-foreground">{row.id}</p>
                </div>
              ),
            },
            {
              id: "group",
              header: "Group",
              sortable: true,
              accessor: (row) => row.group,
              cell: (row) => row.group,
            },
            {
              id: "nature",
              header: "Nature",
              sortable: true,
              accessor: (row) => row.nature,
              cell: (row) => (
                <Badge variant="outline" className="capitalize">
                  {row.nature}
                </Badge>
              ),
            },
            {
              id: "balance",
              header: "Closing",
              sortable: true,
              accessor: (row) => row.balance,
              cell: (row) => (
                <span className="font-medium text-foreground">
                  {formatAmount(row.balance)} {row.side}
                </span>
              ),
            },
            {
              id: "action",
              header: "Action",
              cell: (row) => <ListRowActions itemLabel={row.name} />,
              className: "w-14 text-right",
              headerClassName: "w-14 text-right",
              sticky: "right",
            },
          ],
          data: filteredRows.slice((currentPage - 1) * pageSize, currentPage * pageSize),
          emptyMessage: "No masters found for the current filters.",
          rowKey: (row) => row.id,
        }}
        footer={{
          content: (
            <div className="flex flex-wrap items-center gap-4">
              <span>
                Total records: <span className="font-medium text-foreground">{filteredRows.length}</span>
              </span>
              <span>
                Groups: <span className="font-medium text-foreground">{new Set(filteredRows.map((row) => row.group)).size}</span>
              </span>
            </div>
          ),
        }}
        pagination={{
          currentPage,
          pageSize,
          totalRecords: filteredRows.length,
          onPageChange: setCurrentPage,
          onPageSizeChange: (nextPageSize) => {
            setPageSize(nextPageSize)
            setCurrentPage(1)
          },
          pageSizeOptions: [10, 20, 50],
        }}
      />
    </div>
  )
}
