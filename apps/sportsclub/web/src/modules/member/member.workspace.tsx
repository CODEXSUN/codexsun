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
import { useMasterDetails, useMasterLookups } from "../master/master.hooks";
import { useProgramDetails, useProgramLookups } from "../program/program.hooks";
import { MemberForm } from "./member.form";
import { memberQueryKeys, useMemberDetails, useMembersPage } from "./member.hooks";
import { MemberList } from "./member.list";
import { createMember, updateMember } from "./member.services";
import type { MemberColumnFilters, MemberRecord, MemberSavePayload } from "./member.types";

const columnOptions = [
  { id: "name", label: "Member / Student" },
  { id: "contact", label: "Contact Details" },
  { id: "guardian", label: "Guardian & Emergency" },
  { id: "program", label: "Curriculum" },
  { id: "master", label: "Assigned Asan" },
  { id: "status", label: "Status" }
];

export type MemberWorkspaceProps = {
  mode?: "list" | "new" | "view" | "edit" | undefined;
  uuid?: string | undefined;
  onNavigate?:
    | ((options: {
        mode?: "list" | "new" | "view" | "edit" | undefined;
        uuid?: string | undefined;
      }) => void)
    | undefined;
  initialCreate?: boolean | undefined;
  onCloseCreate?: (() => void) | undefined;
};

export function MemberWorkspace({
  mode = "list",
  uuid,
  onNavigate,
  initialCreate = false,
  onCloseCreate
}: MemberWorkspaceProps) {
  const queryClient = useQueryClient();
  const [internalEditing, setInternalEditing] = useState<MemberRecord | null | undefined>(
    initialCreate || mode === "new" ? null : undefined
  );
  const [internalViewRecord, setInternalViewRecord] = useState<MemberRecord | null>(null);

  const [search, setSearch] = useState("");
  const [programSearch, setProgramSearch] = useState("");
  const [masterSearch, setMasterSearch] = useState("");
  const [showInlineFilters, setShowInlineFilters] = useState(false);
  const [columnFilters, setColumnFilters] = useState<MemberColumnFilters>({});
  const [statusFilter, setStatusFilter] = useState("all");
  const [page, setPage] = useState(1);
  const rowsPerPage = 100;
  const [visibleColumns, setVisibleColumns] = useState<Record<string, boolean>>({});

  const deferredSearch = useDeferredValue(search);
  const deferredColumnFilters = useDeferredValue(columnFilters);

  // Load programs and masters for lookup selections
  const { data: programLookups = [] } = useProgramLookups(useDeferredValue(programSearch));
  const { data: masterLookups = [] } = useMasterLookups(useDeferredValue(masterSearch));

  const programOptions = programLookups.map((p) => ({
    label: `${p.name} (${p.discipline})`,
    value: p.uuid
  }));

  const masterOptions = masterLookups.map((m) => ({
    label: `${m.name} (${m.primaryDiscipline})`,
    value: m.uuid
  }));

  const { data, isLoading } = useMembersPage({
    page,
    pageSize: rowsPerPage,
    search: deferredSearch.trim(),
    status: statusFilter,
    columnFilters: deferredColumnFilters
  });

  const records = data?.items ?? [];

  // Support routed edit / view by uuid
  const targetMemberUuid = mode === "edit" || mode === "view" ? uuid : undefined;
  const { data: fetchedMember } = useMemberDetails(targetMemberUuid);
  const routedRecord =
    records.find((r) => r.uuid === targetMemberUuid) ?? fetchedMember ?? null;
  const selectedRecord = routedRecord ?? internalEditing ?? null;
  const { data: selectedProgram } = useProgramDetails(selectedRecord?.programUuid);
  const { data: selectedMaster } = useMasterDetails(selectedRecord?.masterUuid);

  const editing =
    mode === "new"
      ? null
      : mode === "edit" && routedRecord
        ? routedRecord
        : internalEditing;

  const viewRecord =
    mode === "view" && routedRecord ? routedRecord : internalViewRecord;

  const createMutation = useMutation({
    mutationFn: (payload: MemberSavePayload) => createMember(payload),
    onSuccess: () => {
      toast.success("Student member registered successfully");
      queryClient.invalidateQueries({ queryKey: memberQueryKeys.all });
      setInternalEditing(undefined);
      if (onNavigate) {
        onNavigate({ mode: "list" });
      }
      if (initialCreate) onCloseCreate?.();
    },
    onError: (err: Error) => {
      toast.error(err.message || "Failed to register member");
    }
  });

  const updateMutation = useMutation({
    mutationFn: ({
      targetUuid,
      payload,
      revision
    }: {
      targetUuid: string;
      payload: MemberSavePayload;
      revision: number;
    }) => updateMember(targetUuid, payload, revision),
    onSuccess: () => {
      toast.success("Member record updated");
      queryClient.invalidateQueries({ queryKey: memberQueryKeys.all });
      setInternalEditing(undefined);
      if (onNavigate) {
        onNavigate({ mode: "list" });
      }
    },
    onError: (err: Error) => {
      toast.error(err.message || "Failed to update member");
    }
  });

  const handleSave = (payload: MemberSavePayload) => {
    if (editing) {
      updateMutation.mutate({
        targetUuid: editing.uuid,
        payload,
        revision: editing.revision
      });
    } else {
      createMutation.mutate(payload);
    }
  };

  const handleToggleStatus = (record: MemberRecord) => {
    const nextStatus = record.status === "suspended" ? "active" : "suspended";
    const label = nextStatus === "active" ? "activate" : "suspend";
    if (confirm(`Are you sure you want to ${label} member "${record.name}"?`)) {
      updateMutation.mutate({
        targetUuid: record.uuid,
        payload: {
          email: record.email,
          name: record.name,
          phone: record.phone,
          dateOfBirth: record.dateOfBirth,
          gender: record.gender,
          guardianName: record.guardianName,
          guardianPhone: record.guardianPhone,
          emergencyContact: record.emergencyContact,
          medicalNotes: record.medicalNotes,
          address: record.address,
          programUuid: record.programUuid,
          masterUuid: record.masterUuid,
          role: record.role,
          status: nextStatus,
          progressNote: record.progressNote,
          revision: record.revision
        },
        revision: record.revision
      });
    }
  };


  const handleOpenEdit = (record: MemberRecord) => {
    if (onNavigate) {
      onNavigate({ mode: "edit", uuid: record.uuid });
    } else {
      setInternalEditing(record);
    }
  };

  const handleOpenView = (record: MemberRecord) => {
    if (onNavigate) {
      onNavigate({ mode: "view", uuid: record.uuid });
    } else {
      setInternalViewRecord(record);
    }
  };

  const handleCloseUpsert = () => {
    setInternalEditing(undefined);
    if (onNavigate) {
      onNavigate({ mode: "list" });
    }
    if (initialCreate) onCloseCreate?.();
  };

  const total = data?.total ?? 0;
  const totalPages = Math.max(1, Math.ceil(total / rowsPerPage));
  const currentPage = Math.min(page, totalPages);
  const activeColumnFilters = Object.values(columnFilters).filter((v) => v?.trim()).length;

  // FULL-PAGE UPSERT (NO POPUP)
  if (editing !== undefined) {
    return (
      <MemberForm
        key={editing?.uuid ?? "new"}
        initialRecord={editing}
        programOptions={selectedProgram && !programOptions.some((option) => option.value === selectedProgram.uuid) ? [{ label: selectedProgram.name, value: selectedProgram.uuid }, ...programOptions] : programOptions}
        masterOptions={selectedMaster && !masterOptions.some((option) => option.value === selectedMaster.uuid) ? [{ label: selectedMaster.name, value: selectedMaster.uuid }, ...masterOptions] : masterOptions}
        programSearch={programSearch}
        onProgramSearchChange={setProgramSearch}
        masterSearch={masterSearch}
        onMasterSearchChange={setMasterSearch}
        isSaving={createMutation.isPending || updateMutation.isPending}
        error={createMutation.error?.message ?? updateMutation.error?.message ?? null}
        onSubmit={handleSave}
        onBack={handleCloseUpsert}
      />
    );
  }

  // LIST VIEW: Headerless canvas, actions portalled to Platform header
  return (
    <WorkspacePage variant="list" title="" technicalName="page.sportsclub.members.list">
      {/* Platform Header Action Binding */}

      {/* CRM Filter & Column Toolbar */}
      <WorkspaceFilters
        toolbarAction={
          <Button
            aria-label="Toggle column search filters"
            aria-pressed={showInlineFilters}
            className="h-8 min-w-8 gap-1 px-2"
            title="Toggle column search filters"
            type="button"
            variant={showInlineFilters ? "default" : "outline"}
            onClick={() => setShowInlineFilters((open) => !open)}
          >
            <SlidersHorizontal className="size-4" aria-hidden="true" />
            {activeColumnFilters > 0 ? (
              <span className="text-xs">{activeColumnFilters}</span>
            ) : null}
          </Button>
        }
        searchValue={search}
        onSearchValueChange={(val) => {
          setSearch(val);
          setPage(1);
        }}
        searchPlaceholder="Search member name, email, phone, or guardian..."
        filterValue={statusFilter}
        onFilterValueChange={(val) => {
          setStatusFilter(val);
          setPage(1);
        }}
        filterOptions={[
          { id: "all", label: "All Members" },
          { id: "active", label: "Active" },
          { id: "pending", label: "Pending Approval" },
          { id: "suspended", label: "Suspended" },
          { id: "graduated", label: "Graduated" }
        ]}
        columnOptions={columnOptions.map((column) => ({
          id: column.id,
          label: column.label,
          checked: visibleColumns[column.id] !== false,
          onCheckedChange: (checked: boolean) => {
            setVisibleColumns((current) => ({ ...current, [column.id]: checked }));
            if (!checked) {
              setColumnFilters((current) => {
                const next = { ...current };
                delete next[column.id as keyof MemberColumnFilters];
                return next;
              });
              setPage(1);
            }
          }
        }))}
        onShowAllColumns={() => setVisibleColumns({})}
      />

      {/* Member Data List */}
      <MemberList
        records={records}
        isLoading={isLoading}
        visibleColumns={visibleColumns}
        showInlineFilters={showInlineFilters}
        columnFilters={columnFilters}
        onColumnFilterChange={(column, val) => {
          setColumnFilters((prev) => ({ ...prev, [column]: val }));
          setPage(1);
        }}
        onView={handleOpenView}
        onEdit={handleOpenEdit}
        onToggleStatus={handleToggleStatus}
      />

      {/* Conditional Server Pagination: Only rendered when total > 100 */}
      {total > 100 ? (
        <WorkspacePagination
          page={currentPage}
          rowsPerPage={rowsPerPage}
          showingLabel={buildShowingLabel(currentPage, rowsPerPage, total)}
          singularLabel="member"
          totalCount={total}
          totalPages={totalPages}
          onNextPage={() => setPage((v) => Math.min(totalPages, v + 1))}
          onPageChange={setPage}
          onPreviousPage={() => setPage((v) => Math.max(1, v - 1))} onRowsPerPageChange={() => undefined}
        />
      ) : null}

      {/* Detail Drawer */}
      {viewRecord ? (
        <div className="fixed inset-y-0 right-0 z-50 flex w-full max-w-md flex-col border-l border-border bg-background p-6 shadow-xl">
          <div className="flex items-center justify-between border-b pb-4">
            <div>
              <h3 className="text-lg font-bold text-foreground">{viewRecord.name}</h3>
              <p className="text-xs text-muted-foreground capitalize">
                {viewRecord.role} • Status: {viewRecord.status}
              </p>
            </div>
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={() => {
                setInternalViewRecord(null);
                if (onNavigate) onNavigate({ mode: "list" });
              }}
            >
              Close
            </Button>
          </div>
          <div className="mt-4 space-y-3 text-sm">
            <div>
              <span className="text-xs text-muted-foreground">Email:</span>
              <p className="text-foreground">{viewRecord.email}</p>
            </div>
            <div>
              <span className="text-xs text-muted-foreground">Phone:</span>
              <p className="font-mono text-foreground">{viewRecord.phone || "—"}</p>
            </div>
            <div className="grid grid-cols-2 gap-2">
              <div>
                <span className="text-xs text-muted-foreground">Gender:</span>
                <p className="capitalize text-foreground">{viewRecord.gender || "—"}</p>
              </div>
              <div>
                <span className="text-xs text-muted-foreground">Date of Birth:</span>
                <p className="text-foreground">{viewRecord.dateOfBirth || "—"}</p>
              </div>
            </div>
            <div className="rounded border bg-muted/20 p-2.5 text-xs">
              <span className="font-semibold text-foreground">Guardian & Emergency:</span>
              <p className="mt-1 text-foreground">
                Guardian: {viewRecord.guardianName || "—"} ({viewRecord.guardianPhone || "No phone"})
              </p>
              <p className="text-foreground">
                Emergency: {viewRecord.emergencyContact || "—"}
              </p>
            </div>
            {viewRecord.medicalNotes ? (
              <div className="rounded border bg-muted/20 p-2.5 text-xs">
                <span className="font-semibold text-foreground">Medical Notes:</span>
                <p className="mt-1 text-muted-foreground">{viewRecord.medicalNotes}</p>
              </div>
            ) : null}
            {viewRecord.progressNote ? (
              <div className="rounded border bg-muted/20 p-2.5 text-xs">
                <span className="font-semibold text-foreground">Belt Rank / Syllabus Note:</span>
                <p className="mt-1 text-muted-foreground">{viewRecord.progressNote}</p>
              </div>
            ) : null}
            {viewRecord.address ? (
              <div>
                <span className="text-xs text-muted-foreground">Address:</span>
                <p className="text-muted-foreground">{viewRecord.address}</p>
              </div>
            ) : null}
          </div>
          <div className="mt-auto flex justify-end gap-2 pt-4 border-t">
            <Button
              type="button"
              variant="outline"
              onClick={() => {
                const rec = viewRecord;
                setInternalViewRecord(null);
                handleOpenEdit(rec);
              }}
            >
              Edit Member
            </Button>
          </div>
        </div>
      ) : null}
    </WorkspacePage>
  );
}
