import { useWorkspaceListTools } from "@codexsun/ui/workspace/list-tools";
import { useWorkspaceQueryValue, useWorkspaceRecordSelection } from "@codexsun/ui/workspace/navigation";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Plus } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@codexsun/ui/components/button";
import { WorkspaceFilters } from "@codexsun/ui/workspace/filters";
import { WorkspacePage } from "@codexsun/ui/workspace/page";
import { ProductVariantForm } from "./product-variant.form";
import {
  productVariantQueryKey,
  useProductVariants,
  useVariantProducts
} from "./product-variant.hooks";
import { ProductVariantList, productvariantListColumns, productvariantListValues } from "./product-variant.list";
import {
  changeProductVariantStatus,
  createProductVariant,
  updateProductVariant
} from "./product-variant.services";
import type {
  ProductVariantPayload,
  ProductVariantRecord
} from "./product-variant.types";
export function ProductVariantWorkspace() {
  const listTools = useWorkspaceListTools(productvariantListColumns);
  const [statusFilter, setStatusFilter] = useWorkspaceQueryValue("status", "all");
  const client = useQueryClient();
  const [search, setSearch] = useWorkspaceQueryValue("q", "");


  const query = useProductVariants(search);
  const records = (query.data ?? []).filter((record) => (statusFilter === "all" || record.status === statusFilter) && listTools.matches(productvariantListValues(record)));
  const [editing, setEditing] = useWorkspaceRecordSelection<ProductVariantRecord>(query.data ?? [], (record) => String(record.id));
  const products = useVariantProducts();
  const refresh = () => client.invalidateQueries({ queryKey: productVariantQueryKey });
  const save = useMutation({
    mutationFn: (value: ProductVariantPayload) =>
      editing ? updateProductVariant(editing.id, value) : createProductVariant(value),
    onSuccess: async () => {
      await refresh();
      setEditing(undefined);
      toast.success("Variant saved");
    },
    onError: (error) => toast.error(error.message)
  });
  const statusMutation = useMutation({
    mutationFn: (record: ProductVariantRecord) =>
      changeProductVariantStatus(record.id, record.status === "active" ? "inactive" : "active"),
    onSuccess: refresh
  });
  if (editing !== undefined)
    return (
      <ProductVariantForm
        loading={save.isPending}
        products={products.data ?? []}
        record={editing}
        onCancel={() => setEditing(undefined)}
        onSubmit={(value) => save.mutate(value)}
      />
    );
  return (
    <WorkspacePage variant="list"
      title="Product Variants"
      description="Manage purchasable SKUs, option combinations, adjustments, and weights."
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
            searchPlaceholder="Search SKU, title, or product"
            searchValue={search}
            onSearchValueChange={setSearch}
          />
        </div>
      </div>
      <ProductVariantList
        listTools={listTools}
        loading={query.isLoading}
        records={records}
        onEdit={setEditing}
        onStatus={(record) => statusMutation.mutate(record)}
      />
    </WorkspacePage>
  );
}
