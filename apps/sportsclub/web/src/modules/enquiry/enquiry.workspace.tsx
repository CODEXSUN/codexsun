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
import { EnquiryForm } from "./enquiry.form";
import { enquiryQueryKeys, useEnquiriesPage, useEnquiryDetails } from "./enquiry.hooks";
import { EnquiryList } from "./enquiry.list";
import { createEnquiry, updateEnquiry, deleteEnquiry } from "./enquiry.services";
import type { EnquiryColumnFilters, EnquiryRecord, EnquirySavePayload } from "./enquiry.types";
const pageSize = 100;
export function EnquiryWorkspace({
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
  const [localRecord, setLocalRecord] = useState<EnquiryRecord | null>(null);
  const currentMode = onNavigate ? mode : localMode;
  const currentUuid = uuid ?? localRecord?.uuid;
  const [search, setSearch] = useState("");
  const [status, setStatus] = useState("all");
  const [page, setPage] = useState(1);
  const [showInlineFilters, setShowInlineFilters] = useState(false);
  const [visibleColumns, setVisibleColumns] = useState<Record<string, boolean>>({});
  const [columnFilters, setColumnFilters] = useState<EnquiryColumnFilters>({});

  const deferredSearch = useDeferredValue(search);
  const deferredFilters = useDeferredValue(columnFilters);
  const query = useEnquiriesPage({
    page,
    pageSize,
    search: deferredSearch.trim(),
    status,
    columnFilters: deferredFilters
  });
  const detail = useEnquiryDetails(currentMode === "edit" ? currentUuid : undefined);
  const editing = currentMode === "edit" ? (detail.data ?? localRecord) : null;
  function navigate(next: "list" | "new" | "edit", record?: EnquiryRecord) {
    if (onNavigate) onNavigate({ mode: next, ...(record ? { uuid: record.uuid } : {}) });
    else {
      setLocalMode(next);
      setLocalRecord(record ?? null);
    }
  }
  const create = useMutation({
    mutationFn: createEnquiry,
    onSuccess: () => {
      toast.success("Record created");
      void client.invalidateQueries({ queryKey: enquiryQueryKeys.all });
      navigate("list");
    },
    onError: (error: Error) => toast.error(error.message)
  });
  const update = useMutation({
    mutationFn: ({ record, payload }: { record: EnquiryRecord; payload: EnquirySavePayload }) =>
      updateEnquiry(record.uuid, payload),
    onSuccess: () => {
      toast.success("Record updated");
      void client.invalidateQueries({ queryKey: enquiryQueryKeys.all });
      navigate("list");
    },
    onError: (error: Error) => toast.error(error.message)
  });
  const remove = useMutation({
    mutationFn: (record: EnquiryRecord) => deleteEnquiry(record.uuid),
    onSuccess: () => {
      toast.success("Record deleted");
      void client.invalidateQueries({ queryKey: enquiryQueryKeys.all });
    },
    onError: (error: Error) => toast.error(error.message)
  });

  function changeColumnFilter(key: keyof EnquiryColumnFilters, value: string) {
    setColumnFilters(
      (current) => ({ ...current, [key]: value || undefined }) as EnquiryColumnFilters
    );
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
        <EnquiryForm
          key={editing?.uuid ?? "new"}
          formId="sportsclub-enquiry-form"
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
        searchPlaceholder="Search name, email, phone, interest or message"
        filterValue={status}
        onFilterValueChange={(value) => {
          setStatus(value);
          setPage(1);
        }}
        filterOptions={[
          { id: "all", label: "All except trash" },
          { id: "new", label: "New" },
          { id: "in_progress", label: "In progress" },
          { id: "resolved", label: "Resolved" },
          { id: "spam", label: "Spam" },
          { id: "trash", label: "Trash" }
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
            id: "name",
            label: "Name",
            checked: visibleColumns.name !== false,
            onCheckedChange: (checked: boolean) =>
              setVisibleColumns((current) => ({ ...current, name: checked }))
          },
          {
            id: "email",
            label: "Email",
            checked: visibleColumns.email !== false,
            onCheckedChange: (checked: boolean) =>
              setVisibleColumns((current) => ({ ...current, email: checked }))
          },
          {
            id: "phone",
            label: "Phone",
            checked: visibleColumns.phone !== false,
            onCheckedChange: (checked: boolean) =>
              setVisibleColumns((current) => ({ ...current, phone: checked }))
          },
          {
            id: "interest",
            label: "Interest",
            checked: visibleColumns.interest !== false,
            onCheckedChange: (checked: boolean) =>
              setVisibleColumns((current) => ({ ...current, interest: checked }))
          },
          {
            id: "status",
            label: "Status",
            checked: visibleColumns.status !== false,
            onCheckedChange: (checked: boolean) =>
              setVisibleColumns((current) => ({ ...current, status: checked }))
          },
          {
            id: "createdAt",
            label: "Created",
            checked: visibleColumns.createdAt !== false,
            onCheckedChange: (checked: boolean) =>
              setVisibleColumns((current) => ({ ...current, createdAt: checked }))
          }
        ]}
        onShowAllColumns={() => setVisibleColumns({})}
      />

      {query.error ? (
        <p role="alert" className="text-sm text-destructive">
          {query.error.message}
        </p>
      ) : null}
      <EnquiryList
        records={query.data?.items ?? []}
        isLoading={query.isLoading}
        visibleColumns={visibleColumns}
        onView={(record) => navigate("edit", record)}
        onEdit={(record) => navigate("edit", record)}
        onDelete={(record) => remove.mutate(record)}
        filterRow={
          showInlineFilters
            ? (id) => {
                if (id === "status")
                  return (
                    <select
                      aria-label="Filter status"
                      value={columnFilters.status ?? ""}
                      onChange={(event) => changeColumnFilter("status", event.target.value)}
                      className="h-8 w-full rounded-md border bg-white px-2 text-sm"
                    >
                      <option value="">All</option>
                      <option value="new">New</option>
                      <option value="in_progress">In progress</option>
                      <option value="resolved">Resolved</option>
                      <option value="spam">Spam</option>
                      <option value="trash">Trash</option>
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
          singularLabel="enquiry"
          showingLabel={buildShowingLabel(page, pageSize, total)}
        />
      ) : null}
    </WorkspacePage>
  );
}
