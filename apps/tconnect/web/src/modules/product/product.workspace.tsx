import { useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { Button } from "@codexsun/ui/components/button";
import { Input } from "@codexsun/ui/components/input";
import { WorkspacePagination } from "@codexsun/ui/workspace";
import { WorkspaceFormBanner } from "@codexsun/ui/workspace/upsert";
import type { TconnectGateway } from "../../workspace.types";
import type { Product } from "./product.types";
import { ProductForm } from "./product.form";
import { ProductList } from "./product.list";
import { useProducts } from "./product.hooks";
export function ProductWorkspace({ gateway }: { gateway: TconnectGateway }) {
  const query = useProducts(gateway);
  const companies = useQuery({
    queryKey: ["tconnect", "product-companies"],
    queryFn: gateway.company.list
  });
  const client = useQueryClient();
  const [record, setRecord] = useState<Product | null | undefined>(undefined);
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const [saved, setSaved] = useState(false);
  if (record !== undefined)
    return (
      <ProductForm
        record={record}
        companies={companies.data ?? []}
        onCancel={() => setRecord(undefined)}
        onSave={async (input, uuid) => {
          await gateway.product.save(input, uuid);
          await client.invalidateQueries({ queryKey: ["tconnect"] });
          setRecord(undefined);
          setSaved(true);
        }}
      />
    );
  const filtered = (query.data ?? []).filter((product) =>
    `${product.name} ${product.category}`.toLowerCase().includes(search.toLowerCase())
  );
  return (
    <section className="space-y-4">
      <div className="flex gap-3">
        <Input
          value={search}
          placeholder="Search products"
          aria-label="Search products"
          onChange={(event) => {
            setSearch(event.target.value);
            setPage(1);
          }}
        />
        <Button disabled={!companies.data?.length} onClick={() => setRecord(null)}>
          New product
        </Button>
        <Button variant="outline" onClick={() => void query.refetch()}>
          Refresh
        </Button>
      </div>
      {saved ? (
        <p role="status" className="text-sm text-emerald-700">
          Product saved.
        </p>
      ) : null}
      {query.isError ? (
        <WorkspaceFormBanner title="Products could not load">
          {query.error.message}
        </WorkspaceFormBanner>
      ) : query.isPending ? (
        <p role="status">Loading products…</p>
      ) : (
        <ProductList records={filtered.slice((page - 1) * 20, page * 20)} onEdit={setRecord} />
      )}
      <WorkspacePagination
        page={page}
        rowsPerPage={20}
        totalCount={filtered.length}
        totalPages={Math.max(1, Math.ceil(filtered.length / 20))}
        onPageChange={setPage}
        singularLabel="product"
        showingLabel={`${filtered.length} products`}
      />
    </section>
  );
}
