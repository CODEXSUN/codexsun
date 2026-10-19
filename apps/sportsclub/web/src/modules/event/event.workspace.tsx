"use client";
import { useDeferredValue, useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { SlidersHorizontal } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@codexsun/ui/components/button";
import { WorkspacePage } from "@codexsun/ui/workspace/page";
import { WorkspaceFilters } from "@codexsun/ui/workspace/filters";
import { WorkspacePagination } from "@codexsun/ui/workspace/pagination";
import { buildShowingLabel } from "@codexsun/ui/workspace/utils";
import { EventForm } from "./event.form";
import { eventQueryKeys, useEventsPage, useEventDetails } from "./event.hooks";
import { EventList } from "./event.list";
import { createEvent, updateEvent, deleteEvent } from "./event.services";
import type { EventColumnFilters, EventRecord, EventSavePayload } from "./event.types";
const pageSize = 100;
export function EventWorkspace({
  mode = "list",
  uuid,
  onNavigate
}: {
  mode?: "list" | "new" | "edit";
  uuid?: string;
  onNavigate?: (options: { mode?: "list" | "new" | "view" | "edit"; uuid?: string }) => void;
} = {}) {
  const client = useQueryClient();
  const [localMode, setLocalMode] = useState<"list" | "new" | "edit">("list");
  const [localRecord, setLocalRecord] = useState<EventRecord | null>(null);
  const currentMode = onNavigate ? mode : localMode;
  const currentUuid = uuid ?? localRecord?.uuid;
  const [search, setSearch] = useState("");
  const [status, setStatus] = useState("all");
  const [page, setPage] = useState(1);
  const [showInlineFilters, setShowInlineFilters] = useState(false);
  const [visibleColumns, setVisibleColumns] = useState<Record<string, boolean>>({});
  const [columnFilters, setColumnFilters] = useState<EventColumnFilters>({});

  const deferredSearch = useDeferredValue(search);
  const deferredFilters = useDeferredValue(columnFilters);
  const query = useEventsPage({
    page,
    pageSize,
    search: deferredSearch.trim(),
    status,
    columnFilters: deferredFilters
  });
  const detail = useEventDetails(currentMode === "edit" ? currentUuid : undefined);
  const editing = currentMode === "edit" ? (detail.data ?? localRecord) : null;
  function navigate(next: "list" | "new" | "edit", record?: EventRecord) {
    if (onNavigate) onNavigate({ mode: next, ...(record ? { uuid: record.uuid } : {}) });
    else {
      setLocalMode(next);
      setLocalRecord(record ?? null);
    }
  }
  const create = useMutation({
    mutationFn: createEvent,
    onSuccess: () => {
      toast.success("Record created");
      void client.invalidateQueries({ queryKey: eventQueryKeys.all });
      navigate("list");
    },
    onError: (error: Error) => toast.error(error.message)
  });
  const update = useMutation({
    mutationFn: ({ record, payload }: { record: EventRecord; payload: EventSavePayload }) =>
      updateEvent(record.uuid, payload),
    onSuccess: () => {
      toast.success("Record updated");
      void client.invalidateQueries({ queryKey: eventQueryKeys.all });
      navigate("list");
    },
    onError: (error: Error) => toast.error(error.message)
  });
  const remove = useMutation({
    mutationFn: (record: EventRecord) => deleteEvent(record.uuid),
    onSuccess: () => {
      toast.success("Record deleted");
      void client.invalidateQueries({ queryKey: eventQueryKeys.all });
    },
    onError: (error: Error) => toast.error(error.message)
  });

  function changeColumnFilter(key: keyof EventColumnFilters, value: string) {
    setColumnFilters((current) => ({ ...current, [key]: value || undefined }));
    setPage(1);
  }
  if (currentMode === "edit" && !editing)
    return (
      <WorkspacePage title="" variant="list">
        <p role={detail.error ? "alert" : "status"} className="text-sm text-muted-foreground">
          {detail.error?.message ?? "Loading record…"}
        </p>
      </WorkspacePage>
    );
  if (currentMode !== "list")
    return (
      <WorkspacePage title="" variant="list">
        <EventForm
          key={editing?.uuid ?? "new"}
          formId="sportsclub-event-form"
          initialRecord={editing}
          isSaving={create.isPending || update.isPending}
          onSubmit={(payload) =>
            editing ? update.mutate({ record: editing, payload }) : create.mutate(payload)
          }
          onCancel={() => navigate("list")}
        />
      </WorkspacePage>
    );
  const total = query.data?.total ?? 0;
  return (
    <WorkspacePage title="" variant="list">
      <WorkspaceFilters
        searchValue={search}
        onSearchValueChange={(value) => {
          setSearch(value);
          setPage(1);
        }}
        searchPlaceholder="Search title, description or location"
        filterValue={status}
        onFilterValueChange={(value) => {
          setStatus(value);
          setPage(1);
        }}
        filterOptions={[
          { id: "all", label: "All statuses" },
          { id: "upcoming", label: "Upcoming" },
          { id: "ongoing", label: "Ongoing" },
          { id: "completed", label: "Completed" },
          { id: "cancelled", label: "Cancelled" }
        ]}
        toolbarAction={
          <Button
            type="button"
            variant={showInlineFilters ? "default" : "outline"}
            aria-label="Toggle column filters"
            aria-pressed={showInlineFilters}
            onClick={() => setShowInlineFilters(!showInlineFilters)}
          >
            <SlidersHorizontal className="size-4" />
          </Button>
        }
        columnOptions={[
          {
            id: "title",
            label: "Event",
            checked: visibleColumns.title !== false,
            onCheckedChange: (checked: boolean) =>
              setVisibleColumns((current) => ({ ...current, title: checked }))
          },
          {
            id: "eventType",
            label: "Type",
            checked: visibleColumns.eventType !== false,
            onCheckedChange: (checked: boolean) =>
              setVisibleColumns((current) => ({ ...current, eventType: checked }))
          },
          {
            id: "eventDate",
            label: "Date",
            checked: visibleColumns.eventDate !== false,
            onCheckedChange: (checked: boolean) =>
              setVisibleColumns((current) => ({ ...current, eventDate: checked }))
          },
          {
            id: "location",
            label: "Location",
            checked: visibleColumns.location !== false,
            onCheckedChange: (checked: boolean) =>
              setVisibleColumns((current) => ({ ...current, location: checked }))
          },
          {
            id: "status",
            label: "Status",
            checked: visibleColumns.status !== false,
            onCheckedChange: (checked: boolean) =>
              setVisibleColumns((current) => ({ ...current, status: checked }))
          },
          {
            id: "isApprovedPublic",
            label: "Public",
            checked: visibleColumns.isApprovedPublic !== false,
            onCheckedChange: (checked: boolean) =>
              setVisibleColumns((current) => ({ ...current, isApprovedPublic: checked }))
          }
        ]}
        onShowAllColumns={() => setVisibleColumns({})}
      />

      {query.error ? (
        <p role="alert" className="text-sm text-destructive">
          {query.error.message}
        </p>
      ) : null}
      <EventList
        records={query.data?.items ?? []}
        isLoading={query.isLoading}
        visibleColumns={visibleColumns}
        onView={(record) => navigate("edit", record)}
        onEdit={(record) => navigate("edit", record)}
        onDelete={(record) => remove.mutate(record)}
        filterRow={
          showInlineFilters
            ? (id) => {
                if (id === "eventType")
                  return (
                    <select
                      aria-label="Filter eventType"
                      value={columnFilters.eventType ?? ""}
                      onChange={(event) => changeColumnFilter("eventType", event.target.value)}
                      className="h-8 w-full rounded-md border bg-white px-2 text-sm"
                    >
                      <option value="">All</option>
                      <option value="demonstration">Demonstration</option>
                      <option value="tournament">Tournament</option>
                      <option value="workshop">Workshop</option>
                      <option value="camp">Camp</option>
                    </select>
                  );
                if (id === "status")
                  return (
                    <select
                      aria-label="Filter status"
                      value={columnFilters.status ?? ""}
                      onChange={(event) => changeColumnFilter("status", event.target.value)}
                      className="h-8 w-full rounded-md border bg-white px-2 text-sm"
                    >
                      <option value="">All</option>
                      <option value="upcoming">Upcoming</option>
                      <option value="ongoing">Ongoing</option>
                      <option value="completed">Completed</option>
                      <option value="cancelled">Cancelled</option>
                    </select>
                  );
                return null;
              }
            : undefined
        }
      />
      {total > pageSize ? (
        <WorkspacePagination
          page={page}
          totalPages={Math.ceil(total / pageSize)}
          totalCount={total}
          rowsPerPage={pageSize}
          onPageChange={setPage}
          onRowsPerPageChange={() => undefined}
          singularLabel="event"
          showingLabel={buildShowingLabel(page, pageSize, total)}
        />
      ) : null}
    </WorkspacePage>
  );
}
