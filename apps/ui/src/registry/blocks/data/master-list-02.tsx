"use client"

import { useState } from "react"

import { MasterList } from "@/components/blocks/master-list"
import { RecordActionMenu } from "@/components/blocks/record-action-menu"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { SearchableLookupField } from "@/features/forms/searchable-lookup-field"

type AddressTypeRow = {
  id: string
  name: string
  stateLabel: string
  stateValue: string
  notes: string
  active: boolean
}

const stateOptions = [
  { label: "Tamil Nadu", value: "state:tn" },
  { label: "Karnataka", value: "state:ka" },
  { label: "Kerala", value: "state:kl" },
]

const initialRows: AddressTypeRow[] = [
  {
    id: "ADT-001",
    name: "Billing Address",
    stateLabel: "Tamil Nadu",
    stateValue: "state:tn",
    notes: "Used as invoice address for tax documents.",
    active: true,
  },
  {
    id: "ADT-002",
    name: "Shipping Address",
    stateLabel: "Karnataka",
    stateValue: "state:ka",
    notes: "Used for delivery and dispatch handoff.",
    active: true,
  },
  {
    id: "ADT-003",
    name: "Branch Office",
    stateLabel: "Kerala",
    stateValue: "state:kl",
    notes: "Inactive custom branch address category.",
    active: false,
  },
]

export default function MasterList02() {
  const [rows, setRows] = useState(initialRows)
  const [currentPage, setCurrentPage] = useState(1)
  const [pageSize, setPageSize] = useState(10)
  const [searchValue, setSearchValue] = useState("")
  const [dialogOpen, setDialogOpen] = useState(false)
  const [statusFilter, setStatusFilter] = useState<"all" | "active" | "inactive">("all")
  const [formName, setFormName] = useState("")
  const [formState, setFormState] = useState("state:tn")
  const [formNotes, setFormNotes] = useState("")
  const [formActive, setFormActive] = useState(true)

  const filteredRows = rows.filter((row) => {
    const normalizedSearch = searchValue.trim().toLowerCase()
    const matchesSearch =
      normalizedSearch.length === 0 ||
      [row.id, row.name, row.notes, row.stateLabel].some((value) =>
        value.toLowerCase().includes(normalizedSearch)
      )
    const matchesStatus =
      statusFilter === "all" ||
      (statusFilter === "active" ? row.active : !row.active)

    return matchesSearch && matchesStatus
  })

  return (
    <div className="mx-auto max-w-6xl rounded-[1.75rem] border border-border/70 bg-background p-5">
      <MasterList
        header={{
          pageTitle: "Address Type Master",
          pageDescription:
            "Common master page with search, filters, row actions, and popup upsert flow for shared setup tables.",
          addLabel: "New address type",
          onAddClick: () => setDialogOpen(true),
        }}
        search={{
          value: searchValue,
          onChange: (value) => {
            setSearchValue(value)
            setCurrentPage(1)
          },
          placeholder: "Search address types",
        }}
        filters={{
          buttonLabel: "Status",
          options: [
            { key: "all", label: "All records", isActive: statusFilter === "all", onSelect: () => setStatusFilter("all") },
            { key: "active", label: "Active only", isActive: statusFilter === "active", onSelect: () => setStatusFilter("active") },
            { key: "inactive", label: "Inactive only", isActive: statusFilter === "inactive", onSelect: () => setStatusFilter("inactive") },
          ],
          activeFilters:
            statusFilter === "all"
              ? []
              : [
                  {
                    key: "status",
                    label: "Status",
                    value: statusFilter === "active" ? "Active only" : "Inactive only",
                  },
                ],
          onRemoveFilter: () => setStatusFilter("all"),
          onClearAllFilters: () => setStatusFilter("all"),
        }}
        table={{
          columns: [
            {
              id: "serial",
              header: "Sl.No",
              cell: (row) => filteredRows.findIndex((entry) => entry.id === row.id) + 1,
              className: "w-12 text-center",
              headerClassName: "w-12 text-center",
              sticky: "left",
            },
            {
              id: "name",
              header: "Address Type Name",
              sortable: true,
              accessor: (row) => row.name,
              cell: (row) => (
                <div>
                  <p className="font-medium text-foreground">{row.name}</p>
                  <p className="text-xs text-muted-foreground">{row.id}</p>
                </div>
              ),
            },
            {
              id: "state",
              header: "Default State",
              sortable: true,
              accessor: (row) => row.stateLabel,
              cell: (row) => row.stateLabel,
            },
            {
              id: "notes",
              header: "Notes",
              sortable: true,
              accessor: (row) => row.notes,
              cell: (row) => row.notes,
            },
            {
              id: "status",
              header: "Status",
              sortable: true,
              accessor: (row) => (row.active ? "active" : "inactive"),
              cell: (row) => (
                <Badge variant={row.active ? "secondary" : "outline"}>
                  {row.active ? "Active" : "Inactive"}
                </Badge>
              ),
            },
            {
              id: "actions",
              header: "Action",
              cell: (row) => (
                <RecordActionMenu
                  active={row.active}
                  itemLabel={row.name}
                  onEdit={() => undefined}
                  onDelete={() => undefined}
                  onToggleActive={() =>
                    setRows((current) =>
                      current.map((entry) =>
                        entry.id === row.id ? { ...entry, active: !entry.active } : entry
                      )
                    )
                  }
                />
              ),
              className: "w-14 text-right",
              headerClassName: "w-14 text-right",
              sticky: "right",
            },
          ],
          data: filteredRows.slice((currentPage - 1) * pageSize, currentPage * pageSize),
          emptyMessage: "No address types found for the current filters.",
          rowKey: (row) => row.id,
        }}
        footer={{
          content: (
            <div className="flex flex-wrap items-center gap-4">
              <span>
                Total records: <span className="font-medium text-foreground">{filteredRows.length}</span>
              </span>
              <span>
                Active records:{" "}
                <span className="font-medium text-foreground">
                  {filteredRows.filter((row) => row.active).length}
                </span>
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

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-xl">
          <DialogHeader>
            <DialogTitle>Create Address Type</DialogTitle>
            <DialogDescription>
              Popup upsert form reference for common master screens.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <label className="text-sm font-medium text-foreground" htmlFor="address-type-name">
                Address Type Name
              </label>
              <Input
                id="address-type-name"
                value={formName}
                onChange={(event) => setFormName(event.target.value)}
                placeholder="Enter address type"
              />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium text-foreground">Default State</label>
              <SearchableLookupField
                value={formState}
                options={stateOptions}
                placeholder="Select state"
                searchPlaceholder="Search state"
                createActionLabel="Create new state"
                onValueChange={setFormState}
                onCreateNew={() => undefined}
              />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium text-foreground" htmlFor="address-type-notes">
                Notes
              </label>
              <Input
                id="address-type-notes"
                value={formNotes}
                onChange={(event) => setFormNotes(event.target.value)}
                placeholder="Operational note"
              />
            </div>
            <div className="rounded-xl border border-border/70 px-3 py-2 text-sm text-foreground">
              Status: <span className="font-medium">{formActive ? "Active" : "Inactive"}</span>
            </div>
          </div>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => setDialogOpen(false)}>
              Cancel
            </Button>
            <Button
              type="button"
              onClick={() => {
                const stateLabel =
                  stateOptions.find((option) => option.value === formState)?.label ?? "Tamil Nadu"
                setRows((current) => [
                  {
                    id: `ADT-${String(current.length + 1).padStart(3, "0")}`,
                    name: formName || "Custom Address Type",
                    stateLabel,
                    stateValue: formState,
                    notes: formNotes || "Newly created custom address type.",
                    active: formActive,
                  },
                  ...current,
                ])
                setDialogOpen(false)
                setFormName("")
                setFormState("state:tn")
                setFormNotes("")
                setFormActive(true)
              }}
            >
              Create Address Type
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
