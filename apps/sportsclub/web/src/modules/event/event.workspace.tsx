"use client";

import { useDeferredValue, useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Plus } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@codexsun/ui/components/button";
import { WorkspacePage } from "@codexsun/ui/workspace/page";
import { WorkspaceFilters } from "@codexsun/ui/workspace/filters";
import { WorkspacePagination } from "@codexsun/ui/workspace/pagination";
import { WorkspaceUpsertDialog } from "@codexsun/ui/workspace/upsert";
import { buildShowingLabel } from "@codexsun/ui/workspace/utils";
import { EventForm } from "./event.form";
import { eventQueryKeys, useEventsPage } from "./event.hooks";
import { EventList } from "./event.list";
import { createEvent, deleteEvent, updateEvent } from "./event.services";
import type { EventRecord, EventSavePayload } from "./event.types";

export function EventWorkspace() {
  const queryClient = useQueryClient();
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(20);

  const deferredSearch = useDeferredValue(search);

  const { data, isLoading } = useEventsPage({
    page,
    pageSize,
    search: deferredSearch.trim(),
    status: statusFilter
  });

  const [upsertState, setUpsertState] = useState<{
    open: boolean;
    record: EventRecord | null;
  }>({
    open: false,
    record: null
  });

  const [viewRecord, setViewRecord] = useState<EventRecord | null>(null);

  const createMutation = useMutation({
    mutationFn: (payload: EventSavePayload) => createEvent(payload),
    onSuccess: () => {
      toast.success("Event created successfully");
      queryClient.invalidateQueries({ queryKey: eventQueryKeys.all });
      setUpsertState({ open: false, record: null });
    },
    onError: (err: Error) => {
      toast.error(err.message || "Failed to create event");
    }
  });

  const updateMutation = useMutation({
    mutationFn: ({
      uuid,
      payload,
      revision
    }: {
      uuid: string;
      payload: EventSavePayload;
      revision: number;
    }) => updateEvent(uuid, payload, revision),
    onSuccess: () => {
      toast.success("Event updated");
      queryClient.invalidateQueries({ queryKey: eventQueryKeys.all });
      setUpsertState({ open: false, record: null });
    },
    onError: (err: Error) => {
      toast.error(err.message || "Failed to update event");
    }
  });

  const deleteMutation = useMutation({
    mutationFn: ({ uuid, revision }: { uuid: string; revision: number }) =>
      deleteEvent(uuid, revision),
    onSuccess: () => {
      toast.success("Event deleted");
      queryClient.invalidateQueries({ queryKey: eventQueryKeys.all });
    },
    onError: (err: Error) => {
      toast.error(err.message || "Failed to delete event");
    }
  });

  const handleSave = (payload: EventSavePayload) => {
    if (upsertState.record) {
      updateMutation.mutate({
        uuid: upsertState.record.uuid,
        payload,
        revision: upsertState.record.revision
      });
    } else {
      createMutation.mutate(payload);
    }
  };

  const records = data?.items ?? [];
  const total = data?.total ?? 0;
  const totalPages = Math.max(1, Math.ceil(total / pageSize));

  return (
    <WorkspacePage
      title="Events & Tournaments / போட்டிகள் & நிகழ்வுகள்"
      description="Silambam tournaments, demonstrations, workshops, and gurukulam camps"
      action={
        <Button
          type="button"
          onClick={() => setUpsertState({ open: true, record: null })}
          className="flex items-center gap-1.5"
        >
          <Plus className="size-4" />
          <span>Create Event</span>
        </Button>
      }
    >
      <WorkspaceFilters
        searchValue={search}
        onSearchValueChange={(val) => {
          setSearch(val);
          setPage(1);
        }}
        searchPlaceholder="Search event title or venue..."
        filterValue={statusFilter}
        onFilterValueChange={(val) => {
          setStatusFilter(val);
          setPage(1);
        }}
        filterOptions={[
          { id: "all", label: "All Events" },
          { id: "upcoming", label: "Upcoming" },
          { id: "completed", label: "Completed" },
          { id: "cancelled", label: "Cancelled" }
        ]}
      />

      <EventList
        records={records}
        isLoading={isLoading}
        onView={(record) => setViewRecord(record)}
        onEdit={(record) => setUpsertState({ open: true, record })}
        onDelete={(record) =>
          deleteMutation.mutate({ uuid: record.uuid, revision: record.revision })
        }
      />

      <WorkspacePagination
        page={page}
        totalPages={totalPages}
        totalCount={total}
        rowsPerPage={pageSize}
        onPageChange={setPage}
        onRowsPerPageChange={(size) => {
          setPageSize(size);
          setPage(1);
        }}
        singularLabel="event"
        showingLabel={buildShowingLabel(page, pageSize, total)}
      />

      <WorkspaceUpsertDialog
        open={upsertState.open}
        onClose={() => setUpsertState({ open: false, record: null })}
        title={upsertState.record ? "Edit Event Details" : "Create New Event"}
        description="Configure event title, type, date, venue, and public portal visibility."
      >
        <EventForm
          initialRecord={upsertState.record}
          isSaving={createMutation.isPending || updateMutation.isPending}
          onSubmit={handleSave}
          onCancel={() => setUpsertState({ open: false, record: null })}
        />
      </WorkspaceUpsertDialog>

      <WorkspaceUpsertDialog
        open={Boolean(viewRecord)}
        onClose={() => setViewRecord(null)}
        title={viewRecord ? `${viewRecord.title}` : "Event Details"}
      >
        {viewRecord ? (
          <div className="space-y-4 py-2">
            <div className="grid grid-cols-2 gap-3 text-sm">
              <div>
                <span className="text-xs text-muted-foreground">Event Type:</span>
                <p className="font-semibold capitalize text-foreground">{viewRecord.eventType}</p>
              </div>
              <div>
                <span className="text-xs text-muted-foreground">Date:</span>
                <p className="font-semibold text-foreground">{viewRecord.eventDate}</p>
              </div>
              <div>
                <span className="text-xs text-muted-foreground">Venue:</span>
                <p className="text-foreground">{viewRecord.venue}</p>
              </div>
              <div>
                <span className="text-xs text-muted-foreground">Status:</span>
                <p className="font-medium capitalize text-foreground">{viewRecord.status}</p>
              </div>
            </div>

            <div className="rounded-md border border-border/80 bg-muted/20 p-3 text-sm">
              <span className="text-xs font-semibold text-foreground">Event Information</span>
              <p className="mt-1 whitespace-pre-wrap text-foreground">{viewRecord.description}</p>
            </div>

            <div className="flex justify-end pt-3">
              <Button type="button" variant="outline" onClick={() => setViewRecord(null)}>
                Close
              </Button>
            </div>
          </div>
        ) : null}
      </WorkspaceUpsertDialog>
    </WorkspacePage>
  );
}
