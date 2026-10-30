import { useWorkspaceListTools } from "@codexsun/ui/workspace/list-tools";
import { useWorkspaceQueryValue, useWorkspaceRecordSelection } from "@codexsun/ui/workspace/navigation";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Plus } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@codexsun/ui/components/button";
import { WorkspaceFilters } from "@codexsun/ui/workspace/filters";
import { WorkspacePage } from "@codexsun/ui/workspace/page";
import { ProductImageForm } from "./product-image.form";
import { productImageQueryKey, useImageOptions, useProductImages } from "./product-image.hooks";
import { ProductImageList, productimageListColumns, productimageListValues } from "./product-image.list";
import {
  changeProductImageStatus,
  createProductImage,
  updateProductImage
} from "./product-image.services";
import type { ProductImagePayload, ProductImageRecord } from "./product-image.types";
export function ProductImageWorkspace() {
  const listTools = useWorkspaceListTools(productimageListColumns);
  const [statusFilter, setStatusFilter] = useWorkspaceQueryValue("status", "all");
  const client = useQueryClient();
  const [search, setSearch] = useWorkspaceQueryValue("q", "");


  const query = useProductImages(search);
  const records = (query.data ?? []).filter((record) => (statusFilter === "all" || record.status === statusFilter) && listTools.matches(productimageListValues(record)));
  const [editing, setEditing] = useWorkspaceRecordSelection<ProductImageRecord>(query.data ?? [], (record) => String(record.id));
  const options = useImageOptions();
  const refresh = () => client.invalidateQueries({ queryKey: productImageQueryKey });
  const save = useMutation({
    mutationFn: (value: ProductImagePayload) =>
      editing ? updateProductImage(editing.id, value) : createProductImage(value),
    onSuccess: async () => {
      await refresh();
      setEditing(undefined);
      toast.success("Product image saved");
    },
    onError: (error) => toast.error(error.message)
  });
  const statusMutation = useMutation({
    mutationFn: (record: ProductImageRecord) =>
      changeProductImageStatus(record.id, record.status === "active" ? "inactive" : "active"),
    onSuccess: refresh
  });
  if (editing !== undefined)
    return (
      <ProductImageForm
        loading={save.isPending}
        products={options.products.data ?? []}
        variants={options.variants.data ?? []}
        record={editing}
        onCancel={() => setEditing(undefined)}
        onSubmit={(value) => save.mutate(value)}
      />
    );
  return (
    <WorkspacePage variant="list"
      title="Product Images"
      description="Manage primary, gallery, and variant-specific storefront images."
      actions={
        <div className="flex gap-2">
          
          <Button onClick={() => setEditing(null)}>
            <Plus className="size-4" />
            New
          </Button>
        </div>
      }
    >
      <div className="flex gap-3">
        <div className="flex-1">
          <WorkspaceFilters
        toolbarAction={listTools.toolbarAction}
        columnOptions={listTools.columnOptions}
        onShowAllColumns={listTools.onShowAllColumns}
        filterValue={statusFilter}
        onFilterValueChange={setStatusFilter}
        filterOptions={[{ id: "all", label: "All statuses" },{ id: "active", label: "Active", count: (query.data ?? []).filter((record) => record.status === "active").length },{ id: "inactive", label: "Inactive", count: (query.data ?? []).filter((record) => record.status === "inactive").length }]} 
            searchPlaceholder="Search product, variant, or alternative text"
            searchValue={search}
            onSearchValueChange={setSearch}
          />
        </div>
      </div>
      <ProductImageList
        listTools={listTools}
        loading={query.isLoading}
        records={records}
        onEdit={setEditing}
        onStatus={(record) => statusMutation.mutate(record)}
      />
    </WorkspacePage>
  );
}
