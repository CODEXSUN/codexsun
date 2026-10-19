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
import { MemberForm } from "./member.form";
import { memberQueryKeys, useMembersPage } from "./member.hooks";
import { MemberList } from "./member.list";
import {
  createMember,
  restoreMember,
  suspendMember,
  updateMember
} from "./member.services";
import type { MemberRecord, MemberSavePayload } from "./member.types";

export function MemberWorkspace({
  masterOptions = []
}: {
  masterOptions?: Array<{ label: string; value: string }>;
}) {
  const queryClient = useQueryClient();
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(20);

  const deferredSearch = useDeferredValue(search);

  const { data, isLoading } = useMembersPage({
    page,
    pageSize,
    search: deferredSearch.trim(),
    status: statusFilter
  });

  const [upsertState, setUpsertState] = useState<{
    open: boolean;
    record: MemberRecord | null;
  }>({
    open: false,
    record: null
  });

  const [viewRecord, setViewRecord] = useState<MemberRecord | null>(null);

  const createMutation = useMutation({
    mutationFn: (payload: MemberSavePayload) => createMember(payload),
    onSuccess: () => {
      toast.success("Student enrolled successfully");
      queryClient.invalidateQueries({ queryKey: memberQueryKeys.all });
      setUpsertState({ open: false, record: null });
    },
    onError: (err: Error) => {
      toast.error(err.message || "Failed to enroll student");
    }
  });

  const updateMutation = useMutation({
    mutationFn: ({
      uuid,
      payload,
      revision
    }: {
      uuid: string;
      payload: MemberSavePayload;
      revision: number;
    }) => updateMember(uuid, payload, revision),
    onSuccess: () => {
      toast.success("Student record updated");
      queryClient.invalidateQueries({ queryKey: memberQueryKeys.all });
      setUpsertState({ open: false, record: null });
    },
    onError: (err: Error) => {
      toast.error(err.message || "Failed to update student");
    }
  });

  const suspendMutation = useMutation({
    mutationFn: ({ uuid, revision }: { uuid: string; revision: number }) =>
      suspendMember(uuid, revision),
    onSuccess: () => {
      toast.success("Student membership suspended");
      queryClient.invalidateQueries({ queryKey: memberQueryKeys.all });
    },
    onError: (err: Error) => {
      toast.error(err.message || "Failed to suspend student");
    }
  });

  const restoreMutation = useMutation({
    mutationFn: ({ uuid, revision }: { uuid: string; revision: number }) =>
      restoreMember(uuid, revision),
    onSuccess: () => {
      toast.success("Student membership restored");
      queryClient.invalidateQueries({ queryKey: memberQueryKeys.all });
    },
    onError: (err: Error) => {
      toast.error(err.message || "Failed to restore student");
    }
  });

  const handleSave = (payload: MemberSavePayload) => {
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
      title="Students / உறுப்பினர்கள்"
      description="Enrollment roster, belt rankings, assigned masters, and emergency guardian contacts"
      action={
        <Button
          type="button"
          onClick={() => setUpsertState({ open: true, record: null })}
          className="flex items-center gap-1.5"
        >
          <Plus className="size-4" />
          <span>Enroll Student</span>
        </Button>
      }
    >
      <WorkspaceFilters
        searchValue={search}
        onSearchValueChange={(val) => {
          setSearch(val);
          setPage(1);
        }}
        searchPlaceholder="Search student name, ID, or level..."
        filterValue={statusFilter}
        onFilterValueChange={(val) => {
          setStatusFilter(val);
          setPage(1);
        }}
        filterOptions={[
          { id: "all", label: "All Members" },
          { id: "active", label: "Active" },
          { id: "pending", label: "Pending Approval" },
          { id: "suspended", label: "Suspended" }
        ]}
      />

      <MemberList
        records={records}
        isLoading={isLoading}
        onView={(record) => setViewRecord(record)}
        onEdit={(record) => setUpsertState({ open: true, record })}
        onSuspend={(record) =>
          suspendMutation.mutate({ uuid: record.uuid, revision: record.revision })
        }
        onRestore={(record) =>
          restoreMutation.mutate({ uuid: record.uuid, revision: record.revision })
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
        singularLabel="student"
        showingLabel={buildShowingLabel(page, pageSize, total)}
      />

      <WorkspaceUpsertDialog
        open={upsertState.open}
        onClose={() => setUpsertState({ open: false, record: null })}
        title={upsertState.record ? "Edit Student Details" : "Enroll New Student"}
        description="Fill in student details, ranking level, and guardian emergency contact."
      >
        <MemberForm
          initialRecord={upsertState.record}
          masterOptions={masterOptions}
          isSaving={createMutation.isPending || updateMutation.isPending}
          onSubmit={handleSave}
          onCancel={() => setUpsertState({ open: false, record: null })}
        />
      </WorkspaceUpsertDialog>

      <WorkspaceUpsertDialog
        open={Boolean(viewRecord)}
        onClose={() => setViewRecord(null)}
        title={viewRecord ? `${viewRecord.fullName} (#${viewRecord.memberNo})` : "Student Details"}
      >
        {viewRecord ? (
          <div className="space-y-4 py-2">
            <div className="grid grid-cols-2 gap-3 text-sm">
              <div>
                <span className="text-xs text-muted-foreground">Level / Belt:</span>
                <p className="font-semibold text-foreground">{viewRecord.currentLevel}</p>
              </div>
              <div>
                <span className="text-xs text-muted-foreground">Status:</span>
                <p className="font-semibold capitalize text-foreground">{viewRecord.status}</p>
              </div>
              <div>
                <span className="text-xs text-muted-foreground">Assigned Master / ஆசான்:</span>
                <p className="font-medium text-foreground">{viewRecord.masterName ?? "None"}</p>
              </div>
              <div>
                <span className="text-xs text-muted-foreground">Date of Birth:</span>
                <p className="text-foreground">{viewRecord.dateOfBirth ?? "Not recorded"}</p>
              </div>
              <div>
                <span className="text-xs text-muted-foreground">Blood Group:</span>
                <p className="text-foreground">{viewRecord.bloodGroup ?? "—"}</p>
              </div>
              <div>
                <span className="text-xs text-muted-foreground">Gender:</span>
                <p className="capitalize text-foreground">{viewRecord.gender}</p>
              </div>
            </div>

            <div className="rounded-md border border-border/80 bg-muted/20 p-3 text-sm">
              <span className="text-xs font-semibold text-foreground">Guardian & Emergency</span>
              <p className="mt-1 text-foreground">
                Guardian: {viewRecord.guardianName ?? "—"} (
                {viewRecord.guardianRelation ?? "Guardian"})
              </p>
              <p className="text-foreground">Phone: {viewRecord.guardianPhone ?? "—"}</p>
              <p className="text-foreground">
                Emergency Contact: {viewRecord.emergencyContact ?? "—"}
              </p>
            </div>

            {viewRecord.address ? (
              <div className="text-sm">
                <span className="text-xs text-muted-foreground">Address:</span>
                <p className="text-foreground">{viewRecord.address}</p>
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
