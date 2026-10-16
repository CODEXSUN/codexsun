import { useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Plus, RefreshCw } from "lucide-react";
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
import { ProductVariantList } from "./product-variant.list";
import {
  changeProductVariantStatus,
  createProductVariant,
  updateProductVariant
} from "./product-variant.services";
import type {
  ProductVariantPayload,
  ProductVariantRecord,
  VariantStatus
} from "./product-variant.types";
export function ProductVariantWorkspace() {
  const client = useQueryClient();
  const [search, setSearch] = useState("");
  const [status, setStatus] = useState<VariantStatus | undefined>();
  const [editing, setEditing] = useState<ProductVariantRecord | null | undefined>();
  const query = useProductVariants(search, status);
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
    <WorkspacePage
      title="Product Variants"
      description="Manage purchasable SKUs, option combinations, adjustments, and weights."
      actions={
        <div className="flex gap-2">
          <Button variant="outline" onClick={() => void query.refetch()}>
            <RefreshCw className="size-4" />
            Refresh
          </Button>
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
            searchPlaceholder="Search SKU, title, or product"
            searchValue={search}
            onSearchValueChange={setSearch}
          />
        </div>
        <select
          className="h-10 rounded-md border bg-background px-3"
          value={status ?? ""}
          onChange={(event) =>
            setStatus((event.target.value || undefined) as VariantStatus | undefined)
          }
        >
          <option value="">All states</option>
          <option value="active">Active</option>
          <option value="inactive">Inactive</option>
        </select>
      </div>
      <ProductVariantList
        loading={query.isLoading}
        records={query.data ?? []}
        onEdit={setEditing}
        onStatus={(record) => statusMutation.mutate(record)}
      />
    </WorkspacePage>
  );
}
