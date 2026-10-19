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
import { ProgressForm } from "./progress.form";
import { progressQueryKeys, useProgressPage } from "./progress.hooks";
import { ProgressList } from "./progress.list";
import { recordProgress, updateProgress } from "./progress.services";
import type { ProgressRecord, ProgressSavePayload } from "./progress.types";

export function ProgressWorkspace({
  studentOptions = [],
  masterOptions = []
}: {
  studentOptions?: Array<{ label: string; value: string }>;
  masterOptions?: Array<{ label: string; value: string }>;
}) {
  const queryClient = useQueryClient();
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(20);

  const deferredSearch = useDeferredValue(search);

  const { data, isLoading } = useProgressPage({
    page,
    pageSize,
    search: deferredSearch.trim(),
    status: statusFilter
  });

  const [upsertState, setUpsertState] = useState<{
    open: boolean;
    record: ProgressRecord | null;
  }>({
    open: false,
    record: null
  });

  const [viewRecord, setViewRecord] = useState<ProgressRecord | null>(null);

  const createMutation = useMutation({
    mutationFn: (payload: ProgressSavePayload) => recordProgress(payload),
    onSuccess: () => {
      toast.success("Progress assessment recorded successfully");
      queryClient.invalidateQueries({ queryKey: progressQueryKeys.all });
      setUpsertState({ open: false, record: null });
    },
    onError: (err: Error) => {
      toast.error(err.message || "Failed to record assessment");
    }
  });

  const updateMutation = useMutation({
    mutationFn: ({
      uuid,
      payload,
      revision
    }: {
      uuid: string;
      payload: ProgressSavePayload;
      revision: number;
    }) => updateProgress(uuid, payload, revision),
    onSuccess: () => {
      toast.success("Assessment record updated");
      queryClient.invalidateQueries({ queryKey: progressQueryKeys.all });
      setUpsertState({ open: false, record: null });
    },
    onError: (err: Error) => {
      toast.error(err.message || "Failed to update assessment");
    }
  });

  const handleSave = (payload: ProgressSavePayload) => {
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
      title="Skill Assessments & Grading / தேர்ச்சி நிலைகள்"
      description="Official belt grading, stage advancement exams, and technical evaluations certified by active masters"
      action={
        <Button
          type="button"
          onClick={() => setUpsertState({ open: true, record: null })}
          className="flex items-center gap-1.5"
        >
          <Plus className="size-4" />
          <span>Record Assessment</span>
        </Button>
      }
    >
      <WorkspaceFilters
        searchValue={search}
        onSearchValueChange={(val) => {
          setSearch(val);
          setPage(1);
        }}
        searchPlaceholder="Search student, level, or certificate..."
        filterValue={statusFilter}
        onFilterValueChange={(val) => {
          setStatusFilter(val);
          setPage(1);
        }}
        filterOptions={[
          { id: "all", label: "All Results" },
          { id: "passed", label: "Passed" },
          { id: "in_progress", label: "In Progress" },
          { id: "eligible", label: "Eligible for Exam" },
          { id: "retry", label: "Retry Needed" }
        ]}
      />

      <ProgressList
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
        singularLabel="assessment"
        showingLabel={buildShowingLabel(page, pageSize, total)}
      />

      <WorkspaceUpsertDialog
        open={upsertState.open}
        onClose={() => setUpsertState({ open: false, record: null })}
        title={upsertState.record ? "Edit Assessment Entry" : "Record Skill Assessment"}
        description="Select student, evaluating asan, stage level, and technical evaluation feedback."
      >
        <ProgressForm
          initialRecord={upsertState.record}
          studentOptions={studentOptions}
          masterOptions={masterOptions}
          isSaving={createMutation.isPending || updateMutation.isPending}
          onSubmit={handleSave}
          onCancel={() => setUpsertState({ open: false, record: null })}
        />
      </WorkspaceUpsertDialog>

      <WorkspaceUpsertDialog
        open={Boolean(viewRecord)}
        onClose={() => setViewRecord(null)}
        title={viewRecord ? `Assessment: ${viewRecord.studentName ?? "Student"}` : "Assessment Details"}
      >
        {viewRecord ? (
          <div className="space-y-4 py-2">
            <div className="grid grid-cols-2 gap-3 text-sm">
              <div>
                <span className="text-xs text-muted-foreground">Student:</span>
                <p className="font-semibold text-foreground">{viewRecord.studentName ?? "—"}</p>
              </div>
              <div>
                <span className="text-xs text-muted-foreground">Evaluating Asan:</span>
                <p className="font-semibold text-foreground">{viewRecord.masterName ?? "—"}</p>
              </div>
              <div>
                <span className="text-xs text-muted-foreground">Stage / Level:</span>
                <p className="font-medium text-foreground">{viewRecord.stageLevel}</p>
              </div>
              <div>
                <span className="text-xs text-muted-foreground">Result:</span>
                <p className="font-medium capitalize text-foreground">{viewRecord.status}</p>
              </div>
              <div>
                <span className="text-xs text-muted-foreground">Date:</span>
                <p className="text-foreground">{viewRecord.assessmentDate}</p>
              </div>
              <div>
                <span className="text-xs text-muted-foreground">Certificate No:</span>
                <p className="font-mono text-foreground">{viewRecord.certificateNo ?? "—"}</p>
              </div>
            </div>

            {viewRecord.evaluationNotes ? (
              <div className="rounded-md border border-border/80 bg-muted/20 p-3 text-sm">
                <span className="text-xs font-semibold text-foreground">Asan Technical Notes</span>
                <p className="mt-1 whitespace-pre-wrap text-foreground">
                  {viewRecord.evaluationNotes}
                </p>
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
