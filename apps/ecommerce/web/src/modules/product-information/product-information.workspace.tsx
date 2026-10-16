import { useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Plus, RefreshCw } from "lucide-react";
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
import { ProductInformationList } from "./product-information.list";
import {
  archiveProductInformation,
  createProductInformation,
  updateProductInformation
} from "./product-information.services";
import type {
  ProductInformationPayload,
  ProductInformationRecord,
  PublicationStatus
} from "./product-information.types";
export function ProductInformationWorkspace({ onOpenAi }: { onOpenAi: (draft: string) => void }) {
  const client = useQueryClient();
  const [search, setSearch] = useState("");
  const [status, setStatus] = useState<PublicationStatus | undefined>();
  const [editing, setEditing] = useState<ProductInformationRecord | null | undefined>();
  const query = useProductInformation(search, status);
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
    <WorkspacePage
      title="Items"
      description="Manage Frappe-linked items and their complete storefront content."
      actions={
        <div className="flex gap-2">
          <Button variant="outline" onClick={() => void query.refetch()}>
            <RefreshCw className="size-4" />
            Refresh
          </Button>
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
            searchPlaceholder="Search ecommerce products"
            searchValue={search}
            onSearchValueChange={setSearch}
          />
        </div>
        <select
          className="h-10 rounded-md border bg-background px-3 text-sm"
          value={status ?? ""}
          onChange={(event) =>
            setStatus((event.target.value || undefined) as PublicationStatus | undefined)
          }
        >
          <option value="">All states</option>
          <option value="draft">Draft</option>
          <option value="published">Published</option>
          <option value="archived">Archived</option>
        </select>
      </div>
      <ProductInformationList
        loading={query.isLoading}
        records={query.data ?? []}
        onEdit={setEditing}
        onArchive={(record) => archive.mutate(record)}
      />
    </WorkspacePage>
  );
}
