import { useMemo, useState } from "react"

import { Badge } from "@/components/ui/badge"
import { MasterList } from "@/components/blocks/master-list"
import { ListRowActions } from "@/registry/blocks/data/list-row-actions"

type VendorRow = {
  city: string
  creditDays: number
  group: string
  id: string
  name: string
  state: string
  status: "active" | "review" | "hold"
}

const rows: VendorRow[] = [
  {
    id: "LED-201",
    name: "Aarav Industrial Suppliers",
    group: "Sundry Creditors",
    city: "Chennai",
    state: "Tamil Nadu",
    creditDays: 30,
    status: "active",
  },
  {
    id: "LED-202",
    name: "Metro Office Systems",
    group: "Sundry Creditors",
    city: "Bengaluru",
    state: "Karnataka",
    creditDays: 21,
    status: "review",
  },
  {
    id: "LED-203",
    name: "Northline Packaging LLP",
    group: "Stock-in-Hand",
    city: "Ahmedabad",
    state: "Gujarat",
    creditDays: 14,
    status: "active",
  },
  {
    id: "LED-204",
    name: "Starline Transport Co.",
    group: "Indirect Expenses",
    city: "Mumbai",
    state: "Maharashtra",
    creditDays: 7,
    status: "hold",
  },
]

const statusTone = {
  active: "default",
  hold: "destructive",
  review: "secondary",
} as const

export default function MasterListSelectable01() {
  const [searchValue, setSearchValue] = useState("")
  const [selectedRowIds, setSelectedRowIds] = useState<Array<string | number>>([])
  const [currentPage, setCurrentPage] = useState(1)
  const [pageSize, setPageSize] = useState(10)

  const filteredRows = useMemo(() => {
    const normalizedSearch = searchValue.trim().toLowerCase()

    return rows.filter((row) => {
      if (normalizedSearch.length === 0) {
        return true
      }

      return [row.id, row.name, row.group, row.city, row.state].some((value) =>
        value.toLowerCase().includes(normalizedSearch)
      )
    })
  }, [searchValue])

  const pagedRows = filteredRows.slice((currentPage - 1) * pageSize, currentPage * pageSize)

  return (
    <div className="mx-auto max-w-6xl rounded-[1.75rem] border border-border/70 bg-background p-5">
      <MasterList
        header={{
          pageTitle: "Bulk Ledger Management Workspace",
          pageDescription:
            "High-density ledger management page with row selection, column visibility controls, and bulk-ready operations.",
          addLabel: "Add ledger",
          onAddClick: () => undefined,
        }}
        search={{
          value: searchValue,
          onChange: (value) => {
            setSearchValue(value)
            setCurrentPage(1)
          },
          placeholder: "Search ledgers, vendors, or cities",
        }}
        rowSelection={{
          selectedRowIds,
          onSelectedRowIdsChange: setSelectedRowIds,
          selectionLabel: "Select all visible masters",
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
              header: "Ledger",
              sortable: true,
              accessor: (row) => row.name,
              cell: (row) => (
                <div className="space-y-1">
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
              id: "location",
              header: "Location",
              sortable: true,
              accessor: (row) => `${row.city} ${row.state}`,
              cell: (row) => (
                <div className="space-y-1">
                  <p className="text-foreground">{row.city}</p>
                  <p className="text-sm text-muted-foreground">{row.state}</p>
                </div>
              ),
            },
            {
              id: "credit-days",
              header: "Credit Days",
              sortable: true,
              accessor: (row) => row.creditDays,
              cell: (row) => <span className="font-medium text-foreground">{row.creditDays}</span>,
            },
            {
              id: "status",
              header: "Status",
              sortable: true,
              accessor: (row) => row.status,
              cell: (row) => (
                <Badge variant={statusTone[row.status]} className="capitalize">
                  {row.status}
                </Badge>
              ),
            },
            {
              id: "actions",
              header: "Action",
              cell: (row) => <ListRowActions itemLabel={row.name} />,
              className: "w-14 text-right",
              headerClassName: "w-14 text-right",
              sticky: "right",
            },
          ],
          data: pagedRows,
          emptyMessage: "No registry rows found for the current search.",
          rowKey: (row) => row.id,
        }}
        footer={{
          content: (
            <div className="flex flex-wrap items-center gap-4">
              <span>
                Selected: <span className="font-medium text-foreground">{selectedRowIds.length}</span>
              </span>
              <span>
                Total records: <span className="font-medium text-foreground">{filteredRows.length}</span>
              </span>
              <span>
                Column visibility: <span className="font-medium text-foreground">Enabled</span>
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
