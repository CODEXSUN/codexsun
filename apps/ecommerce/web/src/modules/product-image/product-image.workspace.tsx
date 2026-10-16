import { useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Plus, RefreshCw } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@codexsun/ui/components/button";
import { WorkspaceFilters } from "@codexsun/ui/workspace/filters";
import { WorkspacePage } from "@codexsun/ui/workspace/page";
import { ProductImageForm } from "./product-image.form";
import { productImageQueryKey, useImageOptions, useProductImages } from "./product-image.hooks";
import { ProductImageList } from "./product-image.list";
import {
  changeProductImageStatus,
  createProductImage,
  updateProductImage
} from "./product-image.services";
import type { ImageStatus, ProductImagePayload, ProductImageRecord } from "./product-image.types";
export function ProductImageWorkspace() {
  const client = useQueryClient();
  const [search, setSearch] = useState("");
  const [status, setStatus] = useState<ImageStatus | undefined>();
  const [editing, setEditing] = useState<ProductImageRecord | null | undefined>();
  const query = useProductImages(search, status);
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
    <WorkspacePage
      title="Product Images"
      description="Manage primary, gallery, and variant-specific storefront images."
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
            searchPlaceholder="Search product, variant, or alternative text"
            searchValue={search}
            onSearchValueChange={setSearch}
          />
        </div>
        <select
          className="h-10 rounded-md border bg-background px-3"
          value={status ?? ""}
          onChange={(event) =>
            setStatus((event.target.value || undefined) as ImageStatus | undefined)
          }
        >
          <option value="">All states</option>
          <option value="active">Active</option>
          <option value="inactive">Inactive</option>
        </select>
      </div>
      <ProductImageList
        loading={query.isLoading}
        records={query.data ?? []}
        onEdit={setEditing}
        onStatus={(record) => statusMutation.mutate(record)}
      />
    </WorkspacePage>
  );
}
