"use client";
import { useDeferredValue, useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { SlidersHorizontal } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@codexsun/ui/components/button";
import { Input } from "@codexsun/ui/components/input";
import { WorkspacePage } from "@codexsun/ui/workspace/page";
import { WorkspaceFilters } from "@codexsun/ui/workspace/filters";
import { WorkspacePagination } from "@codexsun/ui/workspace/pagination";
import { buildShowingLabel } from "@codexsun/ui/workspace/utils";
import { ProgressForm } from "./progress.form";
import { progressQueryKeys, useProgressPage, useProgressDetails } from "./progress.hooks";
import { ProgressList } from "./progress.list";
import { recordProgress, updateProgress } from "./progress.services";
import type { ProgressColumnFilters, ProgressRecord, ProgressSavePayload } from "./progress.types";
const pageSize = 100;
export function ProgressWorkspace({
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
  const [localRecord, setLocalRecord] = useState<ProgressRecord | null>(null);
  const currentMode = onNavigate ? mode : localMode;
  const currentUuid = uuid ?? localRecord?.uuid;
  const [search, setSearch] = useState("");
  const [status, setStatus] = useState("all");
  const [page, setPage] = useState(1);
  const [showInlineFilters, setShowInlineFilters] = useState(false);
  const [visibleColumns, setVisibleColumns] = useState<Record<string, boolean>>({});
  const [columnFilters, setColumnFilters] = useState<ProgressColumnFilters>({});

  const deferredSearch = useDeferredValue(search);
  const deferredFilters = useDeferredValue(columnFilters);
  const query = useProgressPage({
    page,
    pageSize,
    search: deferredSearch.trim(),
    status,
    columnFilters: deferredFilters
  });
  const detail = useProgressDetails(currentMode === "edit" ? currentUuid : undefined);
  const editing = currentMode === "edit" ? (detail.data ?? localRecord) : null;
  function navigate(next: "list" | "new" | "edit", record?: ProgressRecord) {
    if (onNavigate) onNavigate({ mode: next, ...(record ? { uuid: record.uuid } : {}) });
    else {
      setLocalMode(next);
      setLocalRecord(record ?? null);
    }
  }
  const create = useMutation({
    mutationFn: recordProgress,
    onSuccess: () => {
      toast.success("Record created");
      void client.invalidateQueries({ queryKey: progressQueryKeys.all });
      navigate("list");
    },
    onError: (error: Error) => toast.error(error.message)
  });
  const update = useMutation({
    mutationFn: ({ record, payload }: { record: ProgressRecord; payload: ProgressSavePayload }) =>
      updateProgress(record.uuid, payload),
    onSuccess: () => {
      toast.success("Record updated");
      void client.invalidateQueries({ queryKey: progressQueryKeys.all });
      navigate("list");
    },
    onError: (error: Error) => toast.error(error.message)
  });

  function changeColumnFilter(key: keyof ProgressColumnFilters, value: string) {
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
        <ProgressForm
          key={editing?.uuid ?? "new"}
          formId="sportsclub-progress-form"
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
        searchPlaceholder="Search stage, assessment or notes"
        filterValue={status}
        onFilterValueChange={(value) => {
          setStatus(value);
          setPage(1);
        }}
        filterOptions={[
          { id: "all", label: "All statuses" },
          { id: "in_progress", label: "In progress" },
          { id: "passed", label: "Passed" },
          { id: "recommended", label: "Recommended" }
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
            id: "memberUuid",
            label: "Student ID",
            checked: visibleColumns.memberUuid !== false,
            onCheckedChange: (checked: boolean) =>
              setVisibleColumns((current) => ({ ...current, memberUuid: checked }))
          },
          {
            id: "masterUuid",
            label: "Master ID",
            checked: visibleColumns.masterUuid !== false,
            onCheckedChange: (checked: boolean) =>
              setVisibleColumns((current) => ({ ...current, masterUuid: checked }))
          },
          {
            id: "stageLevel",
            label: "Stage",
            checked: visibleColumns.stageLevel !== false,
            onCheckedChange: (checked: boolean) =>
              setVisibleColumns((current) => ({ ...current, stageLevel: checked }))
          },
          {
            id: "score",
            label: "Score",
            checked: visibleColumns.score !== false,
            onCheckedChange: (checked: boolean) =>
              setVisibleColumns((current) => ({ ...current, score: checked }))
          },
          {
            id: "status",
            label: "Status",
            checked: visibleColumns.status !== false,
            onCheckedChange: (checked: boolean) =>
              setVisibleColumns((current) => ({ ...current, status: checked }))
          },
          {
            id: "gradedAt",
            label: "Graded at",
            checked: visibleColumns.gradedAt !== false,
            onCheckedChange: (checked: boolean) =>
              setVisibleColumns((current) => ({ ...current, gradedAt: checked }))
          }
        ]}
        onShowAllColumns={() => setVisibleColumns({})}
      />

      {query.error ? (
        <p role="alert" className="text-sm text-destructive">
          {query.error.message}
        </p>
      ) : null}
      <ProgressList
        records={query.data?.items ?? []}
        isLoading={query.isLoading}
        visibleColumns={visibleColumns}
        onView={(record) => navigate("edit", record)}
        onEdit={(record) => navigate("edit", record)}
        filterRow={
          showInlineFilters
            ? (id) => {
                if (id === "stageLevel")
                  return (
                    <Input
                      aria-label="Filter stageLevel"
                      value={columnFilters.stageLevel ?? ""}
                      onChange={(event) => changeColumnFilter("stageLevel", event.target.value)}
                      className="h-8"
                    />
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
                      <option value="in_progress">In progress</option>
                      <option value="passed">Passed</option>
                      <option value="recommended">Recommended</option>
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
          singularLabel="assessment"
          showingLabel={buildShowingLabel(page, pageSize, total)}
        />
      ) : null}
    </WorkspacePage>
  );
}
