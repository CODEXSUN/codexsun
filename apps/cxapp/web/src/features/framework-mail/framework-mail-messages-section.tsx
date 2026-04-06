import { Archive, Inbox, MailCheck, MailPlus, ReceiptText, RotateCcw, Trash2 } from "lucide-react"
import { useEffect, useMemo, useState } from "react"
import { Link, useNavigate } from "react-router-dom"

import type { MailboxMessageListResponse } from "@cxapp/shared"

import { MasterList } from "@/components/blocks/master-list"
import { RecordActionMenu } from "@/components/blocks/record-action-menu"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { useGlobalLoading } from "@/features/dashboard/loading/global-loading-provider"

import { SectionShell, StateCard } from "../framework-users/user-shared"
import {
  archiveFrameworkMailboxMessage,
  archiveFrameworkMailboxMessages,
  deleteFrameworkMailboxMessage,
  deleteFrameworkMailboxMessages,
  listFrameworkMailboxMessages,
  restoreFrameworkMailboxMessage,
  restoreFrameworkMailboxMessages,
} from "./mail-api"

type StatusFilterValue = "all" | "queued" | "sent" | "failed"
type MailboxViewMode = "inbox" | "archive"

function buildStatusFilters(
  statusFilter: StatusFilterValue,
  onChange: (value: StatusFilterValue) => void
) {
  return {
    options: [
      {
        key: "all",
        label: "All messages",
        isActive: statusFilter === "all",
        onSelect: () => onChange("all"),
      },
      ...(["queued", "sent", "failed"] as const).map((status) => ({
        key: status,
        label: status.charAt(0).toUpperCase() + status.slice(1),
        isActive: statusFilter === status,
        onSelect: () => onChange(status),
      })),
    ],
    activeFilters:
      statusFilter === "all"
        ? []
        : [{ key: "status", label: "Status", value: statusFilter }],
    onRemoveFilter: () => onChange("all"),
    onClearAllFilters: () => onChange("all"),
  }
}

function getStatusBadgeClassName(status: string) {
  if (status === "sent") {
    return "border-emerald-200 bg-emerald-50 text-emerald-700"
  }

  if (status === "failed") {
    return "border-red-200 bg-red-50 text-red-700"
  }

  return "border-amber-200 bg-amber-50 text-amber-700"
}

export function FrameworkMailMessagesSection() {
  const navigate = useNavigate()
  const [viewMode, setViewMode] = useState<MailboxViewMode>("inbox")
  const [items, setItems] = useState<MailboxMessageListResponse["items"]>([])
  const [searchValue, setSearchValue] = useState("")
  const [statusFilter, setStatusFilter] = useState<StatusFilterValue>("all")
  const [currentPage, setCurrentPage] = useState(1)
  const [pageSize, setPageSize] = useState(25)
  const [selectedRowIds, setSelectedRowIds] = useState<string[]>([])
  const [error, setError] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [isMutating, setIsMutating] = useState(false)
  useGlobalLoading(isLoading || isMutating)

  async function loadMessages(mode: MailboxViewMode = viewMode) {
    setIsLoading(true)
    setError(null)

    try {
      const response = await listFrameworkMailboxMessages({
        archived: mode === "archive",
      })
      setItems(response.items)
    } catch (loadError) {
      setError(
        loadError instanceof Error ? loadError.message : "Failed to load mailbox messages."
      )
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    void loadMessages(viewMode)
    setSelectedRowIds([])
    setCurrentPage(1)
  }, [viewMode])

  const filteredItems = useMemo(() => {
    const normalizedSearch = searchValue.trim().toLowerCase()

    return items.filter((item) => {
      if (statusFilter !== "all" && item.status !== statusFilter) {
        return false
      }

      if (!normalizedSearch) {
        return true
      }

      return [
        item.subject,
        item.recipientSummary,
        item.templateCode ?? "",
        item.referenceType ?? "",
        item.provider ?? "",
      ]
        .join(" ")
        .toLowerCase()
        .includes(normalizedSearch)
    })
  }, [items, searchValue, statusFilter])

  const paginatedItems = filteredItems.slice(
    (currentPage - 1) * pageSize,
    currentPage * pageSize
  )

  async function handleDeleteMessage(messageId: string) {
    setIsMutating(true)
    setError(null)

    try {
      await deleteFrameworkMailboxMessage(messageId)
      setSelectedRowIds((current) => current.filter((id) => id !== messageId))
      await loadMessages()
    } catch (deleteError) {
      setError(
        deleteError instanceof Error ? deleteError.message : "Failed to delete mailbox message."
      )
    } finally {
      setIsMutating(false)
    }
  }

  async function handleBulkDelete() {
    if (selectedRowIds.length === 0) {
      return
    }

    setIsMutating(true)
    setError(null)

    try {
      await deleteFrameworkMailboxMessages({ ids: selectedRowIds })
      setSelectedRowIds([])
      await loadMessages()
    } catch (deleteError) {
      setError(
        deleteError instanceof Error ? deleteError.message : "Failed to delete selected mail."
      )
    } finally {
      setIsMutating(false)
    }
  }

  async function handleArchiveMessage(messageId: string) {
    setIsMutating(true)
    setError(null)

    try {
      await archiveFrameworkMailboxMessage(messageId)
      setSelectedRowIds((current) => current.filter((id) => id !== messageId))
      await loadMessages()
    } catch (archiveError) {
      setError(
        archiveError instanceof Error ? archiveError.message : "Failed to archive mailbox message."
      )
    } finally {
      setIsMutating(false)
    }
  }

  async function handleRestoreMessage(messageId: string) {
    setIsMutating(true)
    setError(null)

    try {
      await restoreFrameworkMailboxMessage(messageId)
      setSelectedRowIds((current) => current.filter((id) => id !== messageId))
      await loadMessages()
    } catch (restoreError) {
      setError(
        restoreError instanceof Error ? restoreError.message : "Failed to restore mailbox message."
      )
    } finally {
      setIsMutating(false)
    }
  }

  async function handleBulkArchive() {
    if (selectedRowIds.length === 0) {
      return
    }

    setIsMutating(true)
    setError(null)

    try {
      await archiveFrameworkMailboxMessages({ ids: selectedRowIds })
      setSelectedRowIds([])
      await loadMessages()
    } catch (archiveError) {
      setError(
        archiveError instanceof Error ? archiveError.message : "Failed to archive selected mail."
      )
    } finally {
      setIsMutating(false)
    }
  }

  async function handleBulkRestore() {
    if (selectedRowIds.length === 0) {
      return
    }

    setIsMutating(true)
    setError(null)

    try {
      await restoreFrameworkMailboxMessages({ ids: selectedRowIds })
      setSelectedRowIds([])
      await loadMessages()
    } catch (restoreError) {
      setError(
        restoreError instanceof Error ? restoreError.message : "Failed to restore selected mail."
      )
    } finally {
      setIsMutating(false)
    }
  }

  if (isLoading && items.length === 0) {
    return <StateCard message="Loading mail service..." />
  }

  if (error && items.length === 0) {
    return <StateCard message={error} />
  }

  const selectedAction =
    selectedRowIds.length > 0 ? (
      <div className="flex flex-wrap items-center gap-2">
        {viewMode === "inbox" ? (
          <Button
            type="button"
            variant="outline"
            className="gap-2"
            onClick={() => void handleBulkArchive()}
            disabled={isMutating}
          >
            <Archive className="size-4" />
            Archive selected ({selectedRowIds.length})
          </Button>
        ) : (
          <Button
            type="button"
            variant="outline"
            className="gap-2"
            onClick={() => void handleBulkRestore()}
            disabled={isMutating}
          >
            <RotateCcw className="size-4" />
            Restore selected ({selectedRowIds.length})
          </Button>
        )}
        <Button
          type="button"
          variant="destructive"
          className="gap-2"
          onClick={() => void handleBulkDelete()}
          disabled={isMutating}
        >
          <Trash2 className="size-4" />
          Delete selected ({selectedRowIds.length})
        </Button>
      </div>
    ) : null

  return (
    <SectionShell
      title="Mail Service"
      description="Review outgoing OTP and transactional email, inspect provider results, and manage inbox versus archived mail without leaving the application shell."
      actions={
        <>
          <Button
            type="button"
            variant={viewMode === "inbox" ? "default" : "outline"}
            className="gap-2"
            onClick={() => setViewMode("inbox")}
          >
            <Inbox className="size-4" />
            Inbox
          </Button>
          <Button
            type="button"
            variant={viewMode === "archive" ? "default" : "outline"}
            className="gap-2"
            onClick={() => setViewMode("archive")}
          >
            <Archive className="size-4" />
            Archive
          </Button>
          <Button variant="outline" asChild>
            <Link to="/dashboard/mail-service/templates">
              <ReceiptText className="size-4" />
              Templates
            </Link>
          </Button>
          <Button asChild>
            <Link to="/dashboard/mail-service/compose">
              <MailPlus className="size-4" />
              Compose
            </Link>
          </Button>
        </>
      }
    >
      {error ? (
        <div className="rounded-2xl border border-destructive/20 bg-destructive/5 px-4 py-3 text-sm text-destructive">
          {error}
        </div>
      ) : null}

      <div className="grid gap-4 md:grid-cols-3">
        <Card className="border-border/70 bg-background/80">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              {viewMode === "inbox" ? "Inbox mail" : "Archived mail"}
            </CardTitle>
          </CardHeader>
          <CardContent className="flex items-end justify-between">
            <div>
              <p className="text-3xl font-semibold text-foreground">{filteredItems.length}</p>
              <p className="text-xs text-muted-foreground">
                {viewMode === "inbox" ? "Active message ledger entries" : "Archived message records"}
              </p>
            </div>
            {viewMode === "inbox" ? (
              <Inbox className="size-5 text-muted-foreground" />
            ) : (
              <Archive className="size-5 text-muted-foreground" />
            )}
          </CardContent>
        </Card>
        <Card className="border-emerald-200/60 bg-emerald-50/60">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-emerald-800">Delivered</CardTitle>
          </CardHeader>
          <CardContent className="flex items-end justify-between">
            <div>
              <p className="text-3xl font-semibold text-emerald-900">
                {filteredItems.filter((item) => item.status === "sent").length}
              </p>
              <p className="text-xs text-emerald-700/80">Successfully sent mail</p>
            </div>
            <MailCheck className="size-5 text-emerald-700" />
          </CardContent>
        </Card>
        <Card className="border-red-200/60 bg-red-50/60">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-red-800">Failed</CardTitle>
          </CardHeader>
          <CardContent className="flex items-end justify-between">
            <div>
              <p className="text-3xl font-semibold text-red-900">
                {filteredItems.filter((item) => item.status === "failed").length}
              </p>
              <p className="text-xs text-red-700/80">Needs retry or provider check</p>
            </div>
            <MailCheck className="size-5 text-red-700" />
          </CardContent>
        </Card>
      </div>

      <MasterList
        header={{
          pageTitle: viewMode === "inbox" ? "Inbox history" : "Archive history",
          pageDescription:
            viewMode === "inbox"
              ? "Includes registration OTP, password reset mail, and any manual send from the application."
              : "Archived mail leaves the inbox table and stays available here for review or restore.",
          actions: selectedAction,
          addLabel: "Compose email",
          onAddClick: () => {
            void navigate("/dashboard/mail-service/compose")
          },
        }}
        search={{
          value: searchValue,
          onChange: (value) => {
            setSearchValue(value)
            setCurrentPage(1)
          },
          placeholder: viewMode === "inbox" ? "Search inbox mail" : "Search archived mail",
        }}
        filters={buildStatusFilters(statusFilter, (value) => {
          setStatusFilter(value)
          setCurrentPage(1)
        })}
        table={{
          columns: [
            {
              id: "index",
              header: "Sl.No",
              cell: (row) => (
                <span className="text-sm text-foreground">
                  {(currentPage - 1) * pageSize + paginatedItems.indexOf(row) + 1}
                </span>
              ),
              className: "w-20",
            },
            {
              id: "subject",
              header: "Message",
              cell: (row) => (
                <div className="space-y-1">
                  <Link
                    to={`/dashboard/mail-service/messages/${encodeURIComponent(row.id)}`}
                    className="font-medium text-foreground transition hover:underline"
                  >
                    {row.subject}
                  </Link>
                  <p className="text-xs text-muted-foreground">
                    {row.templateCode ?? row.referenceType ?? "Direct compose"}
                  </p>
                </div>
              ),
              accessor: (row) => row.subject,
              sortable: true,
            },
            {
              id: "recipients",
              header: "Recipients",
              cell: (row) => (
                <div className="space-y-1">
                  <p className="text-sm text-foreground">{row.recipientSummary}</p>
                  <p className="text-xs text-muted-foreground">
                    {row.recipientCount} recipient{row.recipientCount === 1 ? "" : "s"}
                  </p>
                </div>
              ),
            },
            {
              id: "status",
              header: "Status",
              cell: (row) => (
                <Badge variant="outline" className={getStatusBadgeClassName(row.status)}>
                  {row.status}
                </Badge>
              ),
              accessor: (row) => row.status,
              sortable: true,
            },
            {
              id: "updatedAt",
              header: viewMode === "inbox" ? "Last update" : "Archived",
              cell: (row) => (
                <div className="space-y-1 text-sm">
                  <p className="text-foreground">
                    {new Date(
                      viewMode === "archive"
                        ? row.archivedAt ?? row.updatedAt
                        : row.sentAt ?? row.failedAt ?? row.createdAt
                    ).toLocaleString()}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    {viewMode === "archive"
                      ? "Archived message"
                      : row.providerMessageId ?? row.provider ?? "No provider id"}
                  </p>
                </div>
              ),
              accessor: (row) =>
                viewMode === "archive"
                  ? row.archivedAt ?? row.updatedAt
                  : row.sentAt ?? row.failedAt ?? row.createdAt,
              sortable: true,
            },
            {
              id: "actions",
              header: "Actions",
              cell: (row) => (
                <div className="flex justify-end">
                  <RecordActionMenu
                    itemLabel={row.subject}
                    customItems={
                      viewMode === "inbox"
                        ? [
                            {
                              key: "archive-mail",
                              label: "Archive mail",
                              icon: <Archive className="size-4" />,
                              onSelect: () => {
                                void handleArchiveMessage(String(row.id))
                              },
                            },
                          ]
                        : [
                            {
                              key: "restore-mail",
                              label: "Restore mail",
                              icon: <RotateCcw className="size-4" />,
                              onSelect: () => {
                                void handleRestoreMessage(String(row.id))
                              },
                            },
                          ]
                    }
                    onDelete={() => {
                      void handleDeleteMessage(String(row.id))
                    }}
                    deleteLabel="Delete mail"
                    disabled={isMutating}
                  />
                </div>
              ),
              className: "w-20 text-right",
            },
          ],
          data: paginatedItems,
          loading: isLoading,
          emptyMessage:
            viewMode === "inbox" ? "No inbox mail found." : "No archived mail found.",
          rowKey: (row) => row.id,
        }}
        rowSelection={{
          selectedRowIds,
          onSelectedRowIdsChange: (rowIds) => {
            setSelectedRowIds(rowIds.map((rowId) => String(rowId)))
          },
          selectionLabel: viewMode === "inbox" ? "Select inbox messages" : "Select archived messages",
        }}
        pagination={{
          currentPage,
          pageSize,
          totalRecords: filteredItems.length,
          onPageChange: setCurrentPage,
          onPageSizeChange: (nextPageSize) => {
            setPageSize(nextPageSize)
            setCurrentPage(1)
          },
        }}
      />
    </SectionShell>
  )
}
