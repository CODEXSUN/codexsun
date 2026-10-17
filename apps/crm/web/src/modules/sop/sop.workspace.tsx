import { useEffect, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { ArrowLeft, Plus, RefreshCw, SlidersHorizontal } from "lucide-react";
import {
  AlertDialog,
  AlertDialogContent,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogCancel,
  AlertDialogAction
} from "@codexsun/ui/components/alert-dialog";
import { toast } from "sonner";
import { Button } from "@codexsun/ui/components/button";
import { WorkspacePage } from "@codexsun/ui/workspace/page";
import { WorkspaceFilters } from "@codexsun/ui/workspace/filters";
import { WorkspacePagination } from "@codexsun/ui/workspace/pagination";
import { SopStatusBadge } from "./sop.status";
import { buildShowingLabel } from "@codexsun/ui/workspace/utils";
import { createSop, updateSop, setSopActive, listSops, type Sop } from "./sop.services";
import { SopForm } from "./sop.form";
import { SopList, sopColumns } from "./sop.list";
import { SopDetails } from "./sop.details";

const queryKey = ["crm", "sops"] as const;
export function SopWorkspace() {
  const client = useQueryClient();
  const query = useQuery({ queryKey, queryFn: listSops, refetchInterval: 15000 });
  const [editing, setEditing] = useState<Sop | null | undefined>();
  const [selected, setSelected] = useState<Sop | null>(null);
  const [search, setSearch] = useState("");
  const [status, setStatus] = useState("all");
  const [page, setPage] = useState(1);
  const [size, setSize] = useState(20);
  const [visible, setVisible] = useState<Record<string, boolean>>({});
  const [inlineFilters, setInlineFilters] = useState(false);
  const [columnFilters, setColumnFilters] = useState<Record<string, string>>({});
  const [confirmLeave, setConfirmLeave] = useState(false);
  const save = useMutation({
    mutationFn: (input: { code: string; title: string; purpose: string }) =>
      editing ? updateSop(editing.id, input) : createSop(input),
    onSuccess: async (record) => {
      await client.invalidateQueries({ queryKey });
      setEditing(undefined);
      setSelected(record);
      toast.success("SOP saved");
    }
  });
  const toggle = useMutation({
    mutationFn: (sop: Sop) => setSopActive(sop.id, sop.status !== "active"),
    onSuccess: () => client.invalidateQueries({ queryKey }),
    onError: (error) => toast.error(error.message)
  });
  const all = query.data ?? [];
  const filtered = all.filter(
    (sop) =>
      (status === "all" || sop.status === status) &&
      [sop.code, sop.title, sop.purpose].some((value) =>
        value.toLowerCase().includes(search.trim().toLowerCase())
      ) &&
      Object.entries(columnFilters).every(([key, value]) =>
        String(sop[key as keyof Sop] ?? "")
          .toLowerCase()
          .includes(value.trim().toLowerCase())
      )
  );
  const pages = Math.max(1, Math.ceil(filtered.length / size));
  useEffect(() => {
    if (page > pages) setPage(pages);
  }, [page, pages]);
  const current = selected ? (all.find((sop) => sop.id === selected.id) ?? selected) : null;
  if (editing !== undefined)
    return (
      <>
        <SopForm
          key={editing?.id ?? "new"}
          record={editing}
          saving={save.isPending}
          error={save.error?.message ?? ""}
          onSave={(input) => save.mutate(input)}
          onCancel={() => setConfirmLeave(true)}
        />
        <AlertDialog open={confirmLeave} onOpenChange={setConfirmLeave}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Keep or discard changes?</AlertDialogTitle>
              <AlertDialogDescription>Your changes have not been saved.</AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Keep editing</AlertDialogCancel>
              <AlertDialogAction
                onClick={() => {
                  setEditing(undefined);
                  save.reset();
                }}
              >
                Discard changes
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </>
    );
  if (current)
    return (
      <WorkspacePage title="" technicalName="page.crm.sops.show">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <Button variant="outline" onClick={() => setSelected(null)}>
            <ArrowLeft className="size-4" />
            All SOPs
          </Button>
          <Button
            onClick={() => {
              save.reset();
              setEditing(current);
            }}
          >
            Edit SOP
          </Button>
        </div>
        <div className="space-y-2 py-2">
          <div className="flex items-center gap-3">
            <h1 className="text-xl font-semibold">{current.title}</h1>
            <SopStatusBadge status={current.status} />
          </div>
          <p className="text-sm text-muted-foreground">{current.code}</p>
          <p className="whitespace-pre-wrap text-sm">{current.purpose}</p>
        </div>
        <SopDetails key={current.id} sop={current} />
      </WorkspacePage>
    );
  return (
    <WorkspacePage
      title="SOPs"
      variant="list"
      technicalName="page.crm.sops"
      actions={
        <Button
          onClick={() => {
            save.reset();
            setEditing(null);
          }}
        >
          <Plus className="size-4" />
          New SOP
        </Button>
      }
    >
      <WorkspaceFilters
        searchValue={search}
        searchPlaceholder="Search code, SOP name, or purpose"
        onSearchValueChange={(value) => {
          setSearch(value);
          setPage(1);
        }}
        filterValue={status}
        onFilterValueChange={(value) => {
          setStatus(value);
          setPage(1);
        }}
        filterOptions={[
          { id: "all", label: "All SOPs", count: all.length },
          {
            id: "active",
            label: "Active",
            count: all.filter((sop) => sop.status === "active").length
          },
          {
            id: "inactive",
            label: "Inactive",
            count: all.filter((sop) => sop.status === "inactive").length
          }
        ]}
        columnOptions={sopColumns.map((column) => ({
          ...column,
          checked: visible[column.id] !== false,
          onCheckedChange: (checked: boolean) => {
            setVisible({ ...visible, [column.id]: checked });
            if (!checked) setColumnFilters((current) => ({ ...current, [column.id]: "" }));
          }
        }))}
        onShowAllColumns={() => setVisible({})}
        toolbarAction={
          <>
            <Button
              variant="outline"
              size="sm"
              aria-label="Refresh SOPs"
              disabled={query.isFetching}
              onClick={() => void query.refetch()}
            >
              <RefreshCw className="size-4" />
            </Button>
            <Button
              variant="outline"
              size="sm"
              aria-label="Toggle column search filters"
              aria-pressed={inlineFilters}
              onClick={() => setInlineFilters(!inlineFilters)}
            >
              <SlidersHorizontal className="size-4" />
            </Button>
          </>
        }
      />
      {query.error ? (
        <p role="alert" className="text-sm text-destructive">
          {query.error.message}
        </p>
      ) : null}
      <SopList
        items={filtered.slice((page - 1) * size, page * size)}
        loading={query.isLoading}
        visible={visible}
        inlineFilters={inlineFilters}
        columnFilters={columnFilters}
        onFilter={(column, value) => {
          setColumnFilters({ ...columnFilters, [column]: value });
          setPage(1);
        }}
        onOpen={setSelected}
        onEdit={(sop) => {
          save.reset();
          setEditing(sop);
        }}
        onToggle={(sop) => toggle.mutate(sop)}
      />
      <WorkspacePagination
        page={page}
        rowsPerPage={size}
        totalCount={filtered.length}
        totalPages={pages}
        singularLabel="SOP"
        showingLabel={buildShowingLabel(page, size, filtered.length)}
        onPageChange={setPage}
        onNextPage={() => setPage(Math.min(pages, page + 1))}
        onPreviousPage={() => setPage(Math.max(1, page - 1))}
        onRowsPerPageChange={(value) => {
          setSize(value);
          setPage(1);
        }}
      />
    </WorkspacePage>
  );
}
