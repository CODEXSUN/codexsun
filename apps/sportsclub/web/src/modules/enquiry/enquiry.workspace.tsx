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
import { EnquiryForm } from "./enquiry.form";
import { enquiryQueryKeys, useEnquiriesPage } from "./enquiry.hooks";
import { EnquiryList } from "./enquiry.list";
import { createEnquiry, updateEnquiry } from "./enquiry.services";
import type { EnquiryRecord, EnquirySavePayload } from "./enquiry.types";

export function EnquiryWorkspace() {
  const queryClient = useQueryClient();
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(20);

  const deferredSearch = useDeferredValue(search);

  const { data, isLoading } = useEnquiriesPage({
    page,
    pageSize,
    search: deferredSearch.trim(),
    status: statusFilter
  });

  const [upsertState, setUpsertState] = useState<{
    open: boolean;
    record: EnquiryRecord | null;
  }>({
    open: false,
    record: null
  });

  const [viewRecord, setViewRecord] = useState<EnquiryRecord | null>(null);

  const createMutation = useMutation({
    mutationFn: (payload: EnquirySavePayload) => createEnquiry(payload),
    onSuccess: () => {
      toast.success("Enquiry recorded successfully");
      queryClient.invalidateQueries({ queryKey: enquiryQueryKeys.all });
      setUpsertState({ open: false, record: null });
    },
    onError: (err: Error) => {
      toast.error(err.message || "Failed to record enquiry");
    }
  });

  const updateMutation = useMutation({
    mutationFn: ({
      uuid,
      payload,
      revision
    }: {
      uuid: string;
      payload: EnquirySavePayload;
      revision: number;
    }) => updateEnquiry(uuid, payload, revision),
    onSuccess: () => {
      toast.success("Enquiry record updated");
      queryClient.invalidateQueries({ queryKey: enquiryQueryKeys.all });
      setUpsertState({ open: false, record: null });
    },
    onError: (err: Error) => {
      toast.error(err.message || "Failed to update enquiry");
    }
  });

  const handleSave = (payload: EnquirySavePayload) => {
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
      title="Member Enquiries / சேர்க்கை விசாரணைகள்"
      description="Public admissions interest, class trial requests, and prospective student follow-up inbox"
      action={
        <Button
          type="button"
          onClick={() => setUpsertState({ open: true, record: null })}
          className="flex items-center gap-1.5"
        >
          <Plus className="size-4" />
          <span>Record Enquiry</span>
        </Button>
      }
    >
      <WorkspaceFilters
        searchValue={search}
        onSearchValueChange={(val) => {
          setSearch(val);
          setPage(1);
        }}
        searchPlaceholder="Search visitor name or phone..."
        filterValue={statusFilter}
        onFilterValueChange={(val) => {
          setStatusFilter(val);
          setPage(1);
        }}
        filterOptions={[
          { id: "all", label: "All Enquiries" },
          { id: "new", label: "New Leads" },
          { id: "contacted", label: "Contacted" },
          { id: "enrolled", label: "Enrolled" },
          { id: "closed", label: "Closed" }
        ]}
      />

      <EnquiryList
        records={records}
        isLoading={isLoading}
        onView={(record) => setViewRecord(record)}
        onEdit={(record) => setUpsertState({ open: true, record })}
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
        singularLabel="enquiry"
        showingLabel={buildShowingLabel(page, pageSize, total)}
      />

      <WorkspaceUpsertDialog
        open={upsertState.open}
        onClose={() => setUpsertState({ open: false, record: null })}
        title={upsertState.record ? "Edit Enquiry Record" : "Record Inbound Enquiry"}
        description="Record prospect name, contact phone, program interest, and consultation notes."
      >
        <EnquiryForm
          initialRecord={upsertState.record}
          isSaving={createMutation.isPending || updateMutation.isPending}
          onSubmit={handleSave}
          onCancel={() => setUpsertState({ open: false, record: null })}
        />
      </WorkspaceUpsertDialog>

      <WorkspaceUpsertDialog
        open={Boolean(viewRecord)}
        onClose={() => setViewRecord(null)}
        title={viewRecord ? `Enquiry from ${viewRecord.name}` : "Enquiry Details"}
      >
        {viewRecord ? (
          <div className="space-y-4 py-2">
            <div className="grid grid-cols-2 gap-3 text-sm">
              <div>
                <span className="text-xs text-muted-foreground">Lead Name:</span>
                <p className="font-semibold text-foreground">{viewRecord.name}</p>
              </div>
              <div>
                <span className="text-xs text-muted-foreground">Phone:</span>
                <p className="font-mono text-foreground">{viewRecord.phone}</p>
              </div>
              <div>
                <span className="text-xs text-muted-foreground">Email:</span>
                <p className="text-foreground">{viewRecord.email ?? "—"}</p>
              </div>
              <div>
                <span className="text-xs text-muted-foreground">Program:</span>
                <p className="font-medium text-foreground">{viewRecord.programOfInterest ?? "—"}</p>
              </div>
              <div>
                <span className="text-xs text-muted-foreground">Preferred Timing:</span>
                <p className="text-foreground">{viewRecord.preferredTiming ?? "—"}</p>
              </div>
              <div>
                <span className="text-xs text-muted-foreground">Status:</span>
                <p className="font-medium capitalize text-foreground">{viewRecord.status}</p>
              </div>
            </div>

            <div className="rounded-md border border-border/80 bg-muted/20 p-3 text-sm">
              <span className="text-xs font-semibold text-foreground">Message / Query</span>
              <p className="mt-1 whitespace-pre-wrap text-foreground">{viewRecord.message}</p>
            </div>

            {viewRecord.adminNotes ? (
              <div className="rounded-md border border-amber-200 bg-amber-50/50 p-3 text-sm dark:border-amber-900 dark:bg-amber-950/20">
                <span className="text-xs font-semibold text-amber-900 dark:text-amber-200">
                  Follow-up Notes
                </span>
                <p className="mt-1 whitespace-pre-wrap text-foreground">{viewRecord.adminNotes}</p>
              </div>
            ) : null}

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
