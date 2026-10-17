import { useWorkspaceListTools } from "@codexsun/ui/workspace/list-tools";
import { useWorkspaceQueryValue, useWorkspaceRecordSelection } from "@codexsun/ui/workspace/navigation";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Plus } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@codexsun/ui/components/button";
import { WorkspaceFilters } from "@codexsun/ui/workspace/filters";
import { WorkspacePage } from "@codexsun/ui/workspace/page";
import { ProductInformationForm } from "./product-information.form";
import {
  useCoreBrandOptions,
  useCoreProductOptions,
  useProductInformation,
  productInformationQueryKey
} from "./product-information.hooks";
import { ProductInformationList, productinformationListColumns, productinformationListValues } from "./product-information.list";
import {
  archiveProductInformation,
  createProductInformation,
  updateProductInformation
} from "./product-information.services";
import type {
  ProductInformationPayload,
  ProductInformationRecord
} from "./product-information.types";
export function ProductInformationWorkspace({ onOpenAi }: { onOpenAi: (draft: string) => void }) {
  const listTools = useWorkspaceListTools(productinformationListColumns);
  const [statusFilter, setStatusFilter] = useWorkspaceQueryValue("status", "all");
  const client = useQueryClient();
  const [search, setSearch] = useWorkspaceQueryValue("q", "");


  const query = useProductInformation(search);
  const records = (query.data ?? []).filter((record) => (statusFilter === "all" || record.publicationStatus === statusFilter) && listTools.matches(productinformationListValues(record)));
  const [editing, setEditing] = useWorkspaceRecordSelection<ProductInformationRecord>(query.data ?? [], (record) => String(record.id));
  const coreProducts = useCoreProductOptions();
  const brands = useCoreBrandOptions();
  const save = useMutation({
    mutationFn: (payload: ProductInformationPayload) =>
      editing ? updateProductInformation(editing.id, payload) : createProductInformation(payload),
    onSuccess: async () => {
      await client.invalidateQueries({ queryKey: productInformationQueryKey });
      setEditing(undefined);
      toast.success("Product information saved");
    },
    onError: (error) =>
      toast.error("Product information could not be saved", { description: error.message })
  });
  const archive = useMutation({
    mutationFn: (record: ProductInformationRecord) => archiveProductInformation(record.id),
    onSuccess: async () => {
      await client.invalidateQueries({ queryKey: productInformationQueryKey });
      toast.success("Product information archived");
    },
    onError: (error) =>
      toast.error("Product information could not be archived", { description: error.message })
  });
  if (editing !== undefined)
    return (
      <ProductInformationForm
        brands={brands.data ?? []}
        coreProducts={coreProducts.data ?? []}
        loading={save.isPending}
        record={editing}
        onCancel={() => setEditing(undefined)}
        onOpenAi={onOpenAi}
        onSubmit={(payload) => save.mutate(payload)}
      />
    );
  return (
    <WorkspacePage variant="list"
      title="Items"
      description="Manage Frappe-linked items and their complete storefront content."
      actions={
        <div className="flex gap-2">
          
          <Button onClick={() => setEditing(null)}>
            <Plus className="size-4" />
            New item
          </Button>
        </div>
      }
    >
      <div className="flex flex-wrap gap-3">
        <div className="min-w-72 flex-1">
          <WorkspaceFilters
        toolbarAction={listTools.toolbarAction}
        columnOptions={listTools.columnOptions}
        onShowAllColumns={listTools.onShowAllColumns}
        filterValue={statusFilter}
        onFilterValueChange={setStatusFilter}
        filterOptions={[{ id: "all", label: "All statuses" },{ id: "draft", label: "Draft", count: (query.data ?? []).filter((record) => record.publicationStatus === "draft").length },{ id: "published", label: "Published", count: (query.data ?? []).filter((record) => record.publicationStatus === "published").length },{ id: "archived", label: "Archived", count: (query.data ?? []).filter((record) => record.publicationStatus === "archived").length }]} 
            searchPlaceholder="Search ecommerce products"
            searchValue={search}
            onSearchValueChange={setSearch}
          />
        </div>
      </div>
      <ProductInformationList
        listTools={listTools}
        loading={query.isLoading}
        records={records}
        onEdit={setEditing}
        onArchive={(record) => archive.mutate(record)}
      />
    </WorkspacePage>
  );
}
