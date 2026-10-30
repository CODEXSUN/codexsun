import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { RefreshCw } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@codexsun/ui/components/button";
import { Checkbox } from "@codexsun/ui/components/checkbox";
import { WorkspacePage } from "@codexsun/ui/workspace/page";
import { WorkspaceStatusBadge } from "@codexsun/ui/workspace/status";
import { WorkspaceTable } from "@codexsun/ui/workspace/table";
import type { LegacyColumnDef as ColumnDef } from "@tanstack/react-table/legacy";
import { useFrappeConnectionSettings } from "../connection/connection.hooks";
import { getFrappeContacts, pullFrappeContact } from "./contact-import.services";
import type { FrappeContact } from "./contact-import.types";

export function FrappeContactImportWorkspace() {
  const [page, setPage] = useState(1);
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [progress, setProgress] = useState(0);
  const client = useQueryClient();
  const connection = useFrappeConnectionSettings();
  const connectionUsable = Boolean(connection.data?.usable);
  const preview = useQuery({
    queryKey: ["frappe", "mobile-customers", page],
    queryFn: () => getFrappeContacts(page)
  });
  const importSelected = useMutation({
    mutationFn: async (names: string[]) => {
      let imported = 0;
      const failures: string[] = [];
      setProgress(0);
      for (const name of names) {
        try {
          await pullFrappeContact(name);
          imported += 1;
        } catch (error) {
          failures.push(`${name}: ${error instanceof Error ? error.message : "Import failed"}`);
        }
        setProgress((value) => value + 1);
      }
      return { imported, failures };
    },
    onSuccess: async ({ imported, failures }) => {
      await client.invalidateQueries({ queryKey: ["frappe", "mobile-customers"] });
      await Promise.all([
        client.invalidateQueries({ queryKey: ["core", "master", "contacts"] }),
        client.invalidateQueries({ queryKey: ["crm", "contacts"] }),
        client.invalidateQueries({ queryKey: ["crm", "enquiries", "options"] })
      ]);
      setSelected(new Set());
      if (failures.length)
        toast.warning(`${imported} customer associations imported`, {
          description: failures.slice(0, 3).join("; ")
        });
      else toast.success(`${imported} customer associations imported`);
    }
  });
  const records = preview.data?.items ?? [];
  const eligible = records.filter((item) => item.identityStatus !== "matched");
  const columns: ColumnDef<FrappeContact>[] = [
    {
      id: "select",
      header: () => (
        <Checkbox
          aria-label="Select all contacts on page"
          checked={eligible.length > 0 && eligible.every((item) => selected.has(item.name))}
          disabled={!eligible.length || importSelected.isPending || !connectionUsable}
          onCheckedChange={(checked) =>
            setSelected(checked === true ? new Set(eligible.map((item) => item.name)) : new Set())
          }
        />
      ),
      cell: ({ row }) => (
        <Checkbox
          aria-label={`Select ${row.original.displayName}`}
          checked={selected.has(row.original.name)}
          disabled={
            row.original.identityStatus === "matched" ||
            importSelected.isPending ||
            !connectionUsable
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
    { accessorKey: "customerId", header: "FRAPPE CUSTOMER" },
    { accessorKey: "displayName", header: "CUSTOMER" },
    { accessorKey: "phone", header: "PHONE" },
    {
      id: "local",
      header: "LOCAL CONTACT",
      cell: ({ row }) => {
        const { identityStatus, localContactCode, localContactId } = row.original;
        const tone =
          identityStatus === "matched"
            ? "success"
            : identityStatus === "mismatch"
              ? "danger"
              : "neutral";
        const label =
          identityStatus === "matched"
            ? "Matched"
            : identityStatus === "mismatch"
              ? "Mismatch"
              : "New";
        return (
          <div className="flex flex-col items-start gap-1">
            <span>
              {localContactId
                ? `${localContactCode ?? "Code missing"} · #${localContactId}`
                : "Not imported"}
            </span>
            <WorkspaceStatusBadge label={label} tone={tone} />
          </div>
        );
      }
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
            row.original.identityStatus === "matched" ||
            !connectionUsable
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
      title="Import mobile customers"
      description="Frappe → Core customer import. Uses Mobile Contact Customer associations and preserves local identity."
      technicalName="page.frappe.contacts"
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
      {connection.error ? (
        <p role="alert" className="text-sm text-destructive">
          {connection.error.message}
        </p>
      ) : connection.data && !connectionUsable ? (
        <p role="alert" className="text-sm text-amber-700">
          Verify and enable the Frappe connection before importing.
        </p>
      ) : null}
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
        emptyState="No Frappe mobile/customer associations found."
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
