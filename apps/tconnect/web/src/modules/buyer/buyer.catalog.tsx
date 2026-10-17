import { useState, type FormEvent } from "react";
import { useQuery } from "@tanstack/react-query";
import { Search, ArrowUpRight, Package } from "lucide-react";
import { Button } from "@codexsun/ui/components/button";
import { Input } from "@codexsun/ui/components/input";
import { WorkspaceFormBanner } from "@codexsun/ui/workspace/upsert";
import type { TconnectGateway } from "../../workspace.types";
import type { Buyer, CatalogProduct } from "./buyer.types";
import { BuyerEnquiry } from "./buyer.enquiry";
export function BuyerCatalog({ gateway, buyer }: { gateway: TconnectGateway; buyer: Buyer }) {
  const [term, setTerm] = useState("");
  const [search, setSearch] = useState("");
  const [selected, setSelected] = useState<CatalogProduct | null>(null);
  const [sent, setSent] = useState(false);
  const query = useQuery({
    queryKey: ["tconnect", "catalog", search],
    queryFn: () => gateway.buyer.search(search)
  });
  if (selected)
    return (
      <BuyerEnquiry
        gateway={gateway}
        buyer={buyer}
        product={selected}
        onCancel={() => setSelected(null)}
        onSent={() => {
          setSelected(null);
          setSent(true);
        }}
      />
    );
  function submit(event: FormEvent) {
    event.preventDefault();
    setSearch(term.trim());
  }
  return (
    <section className="space-y-5">
      <div className="rounded-xl border bg-muted/30 p-5">
        <p className="text-xs font-semibold uppercase tracking-widest text-muted-foreground">
          Your next sourcing partner
        </p>
        <h2 className="mt-2 text-2xl font-semibold">Discover products. Start a conversation.</h2>
        <p className="mt-2 text-sm text-muted-foreground">
          Search by product, category, industry, company or city.
        </p>
        <form onSubmit={submit} className="mt-4 flex gap-2">
          <Input
            aria-label="Search products"
            placeholder="Try cotton, packaging, machinery or Tirupur"
            maxLength={160}
            value={term}
            onChange={(event) => setTerm(event.target.value)}
          />
          <Button>
            <Search className="mr-2 size-4" />
            Search
          </Button>
        </form>
      </div>
      {sent ? (
        <p
          role="status"
          className="rounded-lg border border-emerald-200 bg-emerald-50 p-3 text-sm text-emerald-800"
        >
          Enquiry sent. Track the seller's status in Sent enquiries.
        </p>
      ) : null}
      {query.isError ? (
        <WorkspaceFormBanner title="Products could not load">
          {query.error.message}
        </WorkspaceFormBanner>
      ) : query.isPending ? (
        <p role="status">Finding products…</p>
      ) : !query.data?.length ? (
        <div className="rounded-xl border p-10 text-center">
          <Package className="mx-auto mb-3 size-8 text-muted-foreground" />
          <h3 className="font-semibold">No matching products yet</h3>
          <p className="mt-2 text-sm text-muted-foreground">
            Try a broader search or post a requirement for sellers.
          </p>
        </div>
      ) : (
        <>
          <p className="text-sm text-muted-foreground">
            {query.data.length} products · up to 100 matching results
          </p>
          <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
            {query.data.map((product) => (
              <article
                className="flex flex-col overflow-hidden rounded-xl border bg-card"
                key={product.uuid}
              >
                {product.imageDataUrl ? (
                  <img
                    src={product.imageDataUrl}
                    alt={product.name}
                    className="h-40 w-full object-cover"
                  />
                ) : (
                  <div className="flex h-28 items-center justify-center bg-muted/40">
                    <Package className="size-10 text-muted-foreground" />
                  </div>
                )}
                <div className="flex flex-1 flex-col p-4">
                  <span className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
                    {product.category}
                  </span>
                  <h3 className="mt-2 text-lg font-semibold">{product.name}</h3>
                  <p className="mt-1 text-sm text-muted-foreground">
                    {product.sellerName} · {product.city}
                  </p>
                  <p className="my-3 line-clamp-3 text-sm">{product.description}</p>
                  <p className="font-semibold">
                    {product.price === null
                      ? "Price on request"
                      : `₹${product.price.toLocaleString("en-IN")} / ${product.unit}`}
                  </p>
                  <p className="mt-1 text-xs text-muted-foreground">
                    Minimum order: {product.minimumOrder}
                  </p>
                  <div className="mt-auto flex flex-wrap gap-2 pt-4">
                    <Button
                      onClick={() => {
                        setSelected(product);
                        setSent(false);
                      }}
                    >
                      Send enquiry
                    </Button>
                    <Button variant="outline" asChild>
                      <a
                        href={`${gateway.publicPortalUrl}/companies/${product.sellerSlug}`}
                        target="_blank"
                        rel="noreferrer"
                      >
                        Company
                        <ArrowUpRight className="ml-1 size-4" />
                      </a>
                    </Button>
                  </div>
                </div>
              </article>
            ))}
          </div>
        </>
      )}
    </section>
  );
}
