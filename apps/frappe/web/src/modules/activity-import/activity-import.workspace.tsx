import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { RefreshCw } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@codexsun/ui/components/button";
import { Checkbox } from "@codexsun/ui/components/checkbox";
import { WorkspacePage } from "@codexsun/ui/workspace/page";
import { WorkspaceTable } from "@codexsun/ui/workspace/table";
import { formatDateTime } from "@codexsun/ui/workspace/utils";
import type { LegacyColumnDef as ColumnDef } from "@tanstack/react-table/legacy";
import { getFrappeActivities, pullFrappeActivity } from "./activity-import.services";
import type { FrappeActivity } from "./activity-import.types";

export function FrappeActivityImportWorkspace() {
  const [page, setPage] = useState(1);
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [progress, setProgress] = useState(0);
  const client = useQueryClient();
  const preview = useQuery({
    queryKey: ["frappe", "activities", page],
    queryFn: () => getFrappeActivities(page)
  });
  const importSelected = useMutation({
    mutationFn: async (names: string[]) => {
      let imported = 0;
      const failures: string[] = [];
      setProgress(0);
      for (const name of names) {
        try {
          await pullFrappeActivity(name);
          imported += 1;
        } catch (error) {
          failures.push(`${name}: ${error instanceof Error ? error.message : "Import failed"}`);
        }
        setProgress((value) => value + 1);
      }
      return { imported, failures };
    },
    onSuccess: async ({ imported, failures }) => {
      await client.invalidateQueries({ queryKey: ["frappe", "activities"] });
      setSelected(new Set());
      if (failures.length)
        toast.warning(`${imported} activities imported`, {
          description: failures.slice(0, 3).join("; ")
        });
      else toast.success(`${imported} activities imported`);
    }
  });
  const records = preview.data?.items ?? [];
  const eligible = records.filter((item) => item.localEnquiryId && !item.localActivityId);
  const columns: ColumnDef<FrappeActivity>[] = [
    {
      id: "select",
      header: () => (
        <Checkbox
          aria-label="Select all activities on page"
          checked={eligible.length > 0 && eligible.every((item) => selected.has(item.name))}
          disabled={!eligible.length || importSelected.isPending}
          onCheckedChange={(checked) =>
            setSelected(checked === true ? new Set(eligible.map((item) => item.name)) : new Set())
          }
        />
      ),
      cell: ({ row }) => (
        <Checkbox
          aria-label={`Select activity ${row.original.name}`}
          checked={selected.has(row.original.name)}
          disabled={
            !row.original.localEnquiryId ||
            !!row.original.localActivityId ||
            importSelected.isPending
          }
          onCheckedChange={(checked) =>
            setSelected((current) => {
              const next = new Set(current);
              if (checked === true) next.add(row.original.name);
              else next.delete(row.original.name);
              return next;
            })
          }
        />
      )
    },
    { accessorKey: "name", header: "FRAPPE ID" },
    { accessorKey: "enquiry", header: "ENQUIRY" },
    { accessorKey: "mode", header: "ACTIVITY" },
    { accessorKey: "details", header: "DETAILS" },
    {
      id: "created",
      header: "CREATED",
      cell: ({ row }) => (row.original.createdAt ? formatDateTime(row.original.createdAt) : "—")
    },
    {
      id: "local",
      header: "LOCAL ACTIVITY",
      cell: ({ row }) =>
        row.original.localActivityId
          ? `#${row.original.localActivityId}`
          : row.original.localEnquiryId
            ? "Ready"
            : "Import enquiry first"
    },
    {
      id: "action",
      header: "ACTION",
      cell: ({ row }) => (
        <Button
          size="sm"
          variant="outline"
          disabled={
            importSelected.isPending ||
            !!row.original.localActivityId ||
            !row.original.localEnquiryId
          }
          onClick={() => importSelected.mutate([row.original.name])}
        >
          Import
        </Button>
      )
    }
  ];
  return (
    <WorkspacePage
      title="Import activities"
      description="Bring Frappe enquiry messages into local CRM activity. Import their enquiries first."
      technicalName="page.frappe.activities"
      actions={
        <Button
          variant="outline"
          disabled={preview.isFetching}
          onClick={() => void preview.refetch()}
        >
          <RefreshCw className="size-4" /> Refresh
        </Button>
      }
    >
      <div className="flex items-center justify-end gap-2">
        <span className="text-sm text-muted-foreground">{selected.size} selected</span>
        <Button
          disabled={!selected.size || importSelected.isPending}
          onClick={() => importSelected.mutate([...selected])}
        >
          {importSelected.isPending
            ? `Importing ${progress}/${importSelected.variables?.length ?? 0}…`
            : "Import selected"}
        </Button>
      </div>
      {preview.error ? (
        <p role="alert" className="text-sm text-destructive">
          {preview.error.message}
        </p>
      ) : null}
      <WorkspaceTable
        columns={columns}
        data={records}
        isLoading={preview.isLoading}
        emptyState="No Frappe enquiry activities found."
        minWidth="1000px"
      />
      <div className="flex items-center justify-end gap-2">
        <span className="text-sm">Page {page}</span>
        <Button
          variant="outline"
          disabled={page === 1 || preview.isFetching}
          onClick={() => {
            setPage(page - 1);
            setSelected(new Set());
          }}
        >
          Previous
        </Button>
        <Button
          variant="outline"
          disabled={!preview.data?.hasMore || preview.isFetching}
          onClick={() => {
            setPage(page + 1);
            setSelected(new Set());
          }}
        >
          Next
        </Button>
      </div>
    </WorkspacePage>
  );
}
