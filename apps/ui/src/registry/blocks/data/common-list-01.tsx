import { useState } from "react"

import { Badge } from "@/components/ui/badge"
import { CommonList } from "@/components/blocks/master-list"
import { ListRowActions } from "@/registry/blocks/data/list-row-actions"

type QueueItem = {
  id: string
  owner: string
  priority: "low" | "medium" | "high"
  status: "open" | "in-progress" | "closed"
  subject: string
}

const items: QueueItem[] = [
  {
    id: "SR-201",
    owner: "Anika",
    priority: "high",
    status: "open",
    subject: "Bank reconciliation mismatch",
  },
  {
    id: "SR-202",
    owner: "Rohit",
    priority: "medium",
    status: "in-progress",
    subject: "Vendor GST update pending",
  },
  {
    id: "SR-203",
    owner: "Mira",
    priority: "low",
    status: "closed",
    subject: "Customer credit note reviewed",
  },
]

export default function CommonList01() {
  const [searchValue, setSearchValue] = useState("")
  const [statusFilter, setStatusFilter] = useState<"all" | QueueItem["status"]>("all")

  const filteredItems = items.filter((item) => {
    const normalizedSearch = searchValue.trim().toLowerCase()
    const matchesSearch =
      normalizedSearch.length === 0 ||
      [item.id, item.owner, item.subject].some((value) =>
        value.toLowerCase().includes(normalizedSearch)
      )
    const matchesStatus = statusFilter === "all" || item.status === statusFilter

    return matchesSearch && matchesStatus
  })

  return (
    <div className="mx-auto max-w-5xl rounded-[1.75rem] border border-border/70 bg-background p-5">
      <CommonList
        header={{
          pageTitle: "Support Queue Workspace",
          pageDescription:
            "Compact application-ready queue page for internal follow-ups, SLA work, and owned issue tracking.",
          addLabel: "New ticket",
          onAddClick: () => undefined,
        }}
        search={{
          value: searchValue,
          onChange: setSearchValue,
          placeholder: "Search records",
        }}
        filters={{
          buttonLabel: "Status",
          options: [
            {
              key: "all",
              label: "All",
              isActive: statusFilter === "all",
              onSelect: () => setStatusFilter("all"),
            },
            {
              key: "open",
              label: "Open",
              isActive: statusFilter === "open",
              onSelect: () => setStatusFilter("open"),
            },
            {
              key: "in-progress",
              label: "In progress",
              isActive: statusFilter === "in-progress",
              onSelect: () => setStatusFilter("in-progress"),
            },
            {
              key: "closed",
              label: "Closed",
              isActive: statusFilter === "closed",
              onSelect: () => setStatusFilter("closed"),
            },
          ],
          activeFilters:
            statusFilter === "all"
              ? []
              : [{ key: "status", label: "Status", value: statusFilter }],
          onRemoveFilter: () => setStatusFilter("all"),
          onClearAllFilters: () => setStatusFilter("all"),
        }}
        table={{
          columns: [
            {
              id: "id",
              header: "Reference",
              sortable: true,
              accessor: (item) => item.id,
              cell: (item) => <span className="font-medium text-foreground">{item.id}</span>,
            },
            {
              id: "subject",
              header: "Subject",
              sortable: true,
              accessor: (item) => item.subject,
              cell: (item) => item.subject,
            },
            {
              id: "owner",
              header: "Owner",
              sortable: true,
              accessor: (item) => item.owner,
              cell: (item) => item.owner,
            },
            {
              id: "priority",
              header: "Priority",
              sortable: true,
              accessor: (item) => item.priority,
              cell: (item) => <Badge variant="outline">{item.priority}</Badge>,
            },
            {
              id: "status",
              header: "Status",
              sortable: true,
              accessor: (item) => item.status,
              cell: (item) => (
                <Badge variant={item.status === "closed" ? "secondary" : "outline"}>
                  {item.status}
                </Badge>
              ),
            },
            {
              id: "actions",
              header: "Action",
              cell: (item) => <ListRowActions itemLabel={item.subject} />,
              className: "w-14 text-right",
              headerClassName: "w-14 text-right",
              sticky: "right",
            },
          ],
          data: filteredItems,
          emptyMessage: "No queue items match the current filters.",
          rowKey: (item) => item.id,
        }}
      />
    </div>
  )
}
