import { WorkspaceHeaderActions, useWorkspaceQueryValue } from "@codexsun/ui/workspace/navigation";
import { useWorkspaceListTools } from "@codexsun/ui/workspace/list-tools";
import { useEffect, useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useLocation, useNavigate } from "@tanstack/react-router";
import { Plus } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@codexsun/ui/components/button";
import { WorkspaceFilters } from "@codexsun/ui/workspace/filters";
import { WorkspacePage } from "@codexsun/ui/workspace/page";
import { ProductForm } from "./product.form";
import {
  productLookupsQueryKey,
  productsQueryKey,
  useProductLookups,
  useProducts
} from "./product.hooks";
import { ProductList, productColumns } from "./product.list";
import {
  createProduct,
  createHsnCodeLookup,
  createProductCategoryLookup,
  createProductTypeLookup,
  createTaxLookup,
  createUnitLookup,
  forceDeleteProduct,
  setProductActive,
  updateProduct
} from "./product.services";
import type {
  ProductLookupCreate,
  ProductLookups,
  ProductRecord,
  ProductSavePayload
} from "./product.types";
const emptyLookups: ProductLookups = {
  productTypes: [],
  productCategories: [],
  hsnCodes: [],
  units: [],
  taxes: []
};
export function ProductWorkspace() {
  const [listStatus, setListStatus] = useWorkspaceQueryValue("status", "all");
  const listTools = useWorkspaceListTools(
    Object.fromEntries(productColumns.map((column) => [column.id, column.label]))
  );

  const client = useQueryClient(),
    [search, setSearch] = useWorkspaceQueryValue("q", ""),
    [editing, setLocalEditing] = useState<ProductRecord | null | undefined>(undefined),
    query = useProducts(search),
    lookupsQuery = useProductLookups();
  const location = useLocation();
  const navigate = useNavigate();
  const basePath = "/app/core/master/product";
  function setEditing(record: ProductRecord | null | undefined) {
    setLocalEditing(record);
    const path =
      record === undefined
        ? basePath
        : record === null
          ? `${basePath}/new`
          : `${basePath}/${encodeURIComponent(record.id)}/edit`;
    if (location.pathname !== path) void navigate({ to: path, search: location.search });
  }
  useEffect(() => {
    const tail = location.pathname.slice(basePath.length).split("/").filter(Boolean);
    if (tail.length === 0) {
      setLocalEditing(undefined);
      return;
    }
    if (tail[0] === "new" && tail.length === 1) {
      setLocalEditing(null);
      return;
    }
    if (tail.length > 2 || (tail[1] && tail[1] !== "edit")) return;
    let id: string;
    try {
      id = decodeURIComponent(tail[0]!);
    } catch {
      return;
    }
    const record = query.data?.find((entry) => String(entry.id) === id);
    setLocalEditing((current) =>
      current && record && current.id === record.id ? current : record
    );
  }, [location.pathname, query.data]);
  const save = useMutation({
    mutationFn: (payload: ProductSavePayload) =>
      editing ? updateProduct(editing.id, payload) : createProduct(payload),
    onSuccess: async () => {
      await client.invalidateQueries({ queryKey: productsQueryKey });
      toast.success("Product saved");
      setEditing(undefined);
    },
    onError: (error) => toast.error("Unable to save product", { description: error.message })
  });
  const action = useMutation({
    mutationFn: ({ record, type }: { record: ProductRecord; type: "delete" | "toggle" }) =>
      type === "delete"
        ? forceDeleteProduct(record.id)
        : setProductActive(record.id, !record.isActive),
    onSuccess: async () => {
      await client.invalidateQueries({ queryKey: productsQueryKey });
    },
    onError: (error) => toast.error("Unable to update product", { description: error.message })
  });
  const refreshLookups = async <Record,>(work: () => Promise<Record>) => {
    const result = await work();
    await client.invalidateQueries({ queryKey: productLookupsQueryKey });
    return result;
  };
  const createLookup: ProductLookupCreate = {
    productType: (name) => refreshLookups(() => createProductTypeLookup(name)),
    productCategory: (name) => refreshLookups(() => createProductCategoryLookup(name)),
    hsnCode: (code, description) => refreshLookups(() => createHsnCodeLookup(code, description)),
    unit: (name) => refreshLookups(() => createUnitLookup(name)),
    tax: (ratePercent) => refreshLookups(() => createTaxLookup(ratePercent))
  };
  if (editing !== undefined)
    return (
      <ProductForm
        createLookup={createLookup}
        error={save.error?.message ?? ""}
        loading={save.isPending}
        lookups={lookupsQuery.data ?? emptyLookups}
        lookupsLoading={lookupsQuery.isLoading}
        record={editing}
        onBack={() => setEditing(undefined)}
        onSubmit={(payload) => save.mutate(payload)}
      />
    );
  return (
    <WorkspacePage title="" className="w-full max-w-none py-0 lg:w-full lg:py-0">
      <WorkspaceHeaderActions>
        <Button onClick={() => setEditing(null)}>
          <Plus className="size-4" />
          New product
        </Button>
      </WorkspaceHeaderActions>
      <WorkspaceFilters
        filterValue={listStatus}
        onFilterValueChange={setListStatus}
        filterOptions={[
          { id: "all", label: "All records" },
          {
            id: "active",
            label: "Active",
            count: (query.data ?? []).filter((record) => record.isActive).length
          },
          {
            id: "inactive",
            label: "Inactive",
            count: (query.data ?? []).filter((record) => !record.isActive).length
          }
        ]}
        toolbarAction={listTools.toolbarAction}
        columnOptions={listTools.columnOptions}
        onShowAllColumns={listTools.onShowAllColumns}
        showSelectedFilterChip
        searchPlaceholder="Search products"
        searchValue={search}
        onSearchValueChange={setSearch}
      />
      <ProductList
        listTools={listTools}
        loading={query.isFetching && !query.data}
        records={(query.data ?? []).filter(
          (record) =>
            listTools.matches({
              ...record,
              isActive: record.isActive ? "active" : "inactive",
              status: record.isActive ? "active" : "inactive"
            }) &&
            (listStatus === "all" || (record.isActive ? "active" : "inactive") === listStatus)
        )}
        onEdit={setEditing}
        onForceDelete={(record) => {
          if (confirm(`Force delete ${record.name}?`)) action.mutate({ record, type: "delete" });
        }}
        onToggle={(record) => action.mutate({ record, type: "toggle" })}
      />
    </WorkspacePage>
  );
}
