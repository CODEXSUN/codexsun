import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import type { ComponentProps, FormEvent, ReactNode } from "react";
import { AlertCircleIcon, CircleDollarSignIcon, Layers3Icon, ListPlusIcon, PlusIcon, UtensilsIcon } from "lucide-react";
import { Alert, AlertDescription, AlertTitle } from "@codexsun/ui/components/alert";
import { Badge } from "@codexsun/ui/components/badge";
import { Button } from "@codexsun/ui/components/button";
import { Input } from "@codexsun/ui/components/input";
import { Label } from "@codexsun/ui/components/label";
import { NativeSelect, NativeSelectOption } from "@codexsun/ui/components/native-select";
import { readFoundationSetup } from "./foundation-setup-api";
import {
  createMenuCategory, createMenuItem, createMenuVariant, createPriceBook, readMenu, setMenuPrice, type MenuCatalog,
} from "./menu-api";

export function MenuPage({ request }: { request: typeof fetch }) {
  const client = useQueryClient();
  const setup = useQuery({ queryKey: ["qcafe", "foundation", "setup"], queryFn: () => readFoundationSetup(request) });
  const business = setup.data?.businesses[0];
  const menuKey = ["qcafe", "menu", business?.id] as const;
  const menu = useQuery({ enabled: Boolean(business), queryKey: menuKey, queryFn: () => readMenu(request, business!.id) });
  const save = (catalog: MenuCatalog) => client.setQueryData(menuKey, catalog);
  const category = useMutation({ mutationFn: (input: Parameters<typeof createMenuCategory>[1]) => createMenuCategory(request, input), onSuccess: save });
  const item = useMutation({ mutationFn: (input: Parameters<typeof createMenuItem>[1]) => createMenuItem(request, input), onSuccess: save });
  const variant = useMutation({ mutationFn: (input: Parameters<typeof createMenuVariant>[2]) => createMenuVariant(request, business!.id, input), onSuccess: save });
  const priceBook = useMutation({ mutationFn: (input: Parameters<typeof createPriceBook>[1]) => createPriceBook(request, input), onSuccess: save });
  const price = useMutation({ mutationFn: (input: Record<string, unknown>) => setMenuPrice(request, business!.id, input), onSuccess: save });

  if (setup.isPending || (business && menu.isPending)) return <p className="text-sm text-muted-foreground">Loading menu setup...</p>;
  if (setup.isError || menu.isError) return <ErrorNotice message={(setup.error ?? menu.error)?.message ?? "Menu could not be loaded."} />;
  if (!business) return <ErrorNotice message="Create the first business and outlet before building a menu." />;
  const catalog = menu.data ?? { categories: [], items: [], priceBooks: [], prices: [] };
  const mutationError = category.error ?? item.error ?? variant.error ?? priceBook.error ?? price.error;

  return (
    <div className="grid gap-8">
      <section className="flex flex-wrap items-center justify-between gap-3 border-b pb-5">
        <div><h2 className="text-lg font-semibold">{business.name}</h2><p className="text-sm text-muted-foreground">Catalog, variants, and effective prices</p></div>
        <div className="flex gap-2"><Badge variant="outline">{catalog.categories.length} categories</Badge><Badge variant="outline">{catalog.items.length} items</Badge></div>
      </section>
      {mutationError ? <ErrorNotice message={mutationError.message} /> : null}
      <div className="grid gap-8 2xl:grid-cols-[minmax(0,1fr)_360px]">
        <section className="grid content-start gap-6">
          <CatalogTable catalog={catalog} currency={business.currency} />
          <div className="grid gap-6 border-t pt-6 lg:grid-cols-2">
            <CategoryForm businessId={business.id} pending={category.isPending} submit={category.mutate} />
            <ItemForm businessId={business.id} catalog={catalog} pending={item.isPending} submit={item.mutate} />
            <VariantForm catalog={catalog} pending={variant.isPending} submit={variant.mutate} />
            <PriceBookForm businessId={business.id} currency={business.currency} pending={priceBook.isPending} submit={priceBook.mutate} />
          </div>
        </section>
        <PriceForm business={business} catalog={catalog} pending={price.isPending} submit={price.mutate} />
      </div>
    </div>
  );
}

function CatalogTable({ catalog, currency }: { catalog: MenuCatalog; currency: string }) {
  if (!catalog.items.length) return <div className="grid min-h-48 place-items-center border-y text-center"><div><UtensilsIcon className="mx-auto mb-3 size-5 text-muted-foreground"/><h3 className="font-medium">No menu items yet</h3><p className="mt-1 text-sm text-muted-foreground">Create a category, then add the first sale item.</p></div></div>;
  return <div className="overflow-x-auto border-y"><table className="w-full min-w-[680px] text-sm"><thead className="border-b bg-muted/40 text-left text-xs text-muted-foreground"><tr><th className="px-3 py-3 font-medium">Item</th><th className="px-3 py-3 font-medium">Category</th><th className="px-3 py-3 font-medium">Variants</th><th className="px-3 py-3 font-medium">Current prices</th></tr></thead><tbody className="divide-y">{catalog.items.map((entry) => <tr key={entry.id}><td className="px-3 py-4"><div className="font-medium">{entry.name}</div><div className="text-xs text-muted-foreground">{entry.code} · {entry.itemType}</div></td><td className="px-3 py-4">{catalog.categories.find((value) => value.id === entry.categoryId)?.name ?? "Unknown"}</td><td className="px-3 py-4">{entry.variants.length ? entry.variants.map((value) => value.name).join(", ") : "Base item"}</td><td className="px-3 py-4">{catalog.prices.filter((value) => value.itemId === entry.id).map((value) => `${currency} ${(value.amountMinor / 100).toFixed(2)}`).join(", ") || "Not priced"}</td></tr>)}</tbody></table></div>;
}

function CategoryForm({ businessId, pending, submit }: { businessId: string; pending: boolean; submit: (value: { businessId: string; code: string; name: string; sortOrder: number }) => void }) {
  return <SetupForm icon={<Layers3Icon />} title="Add category" pending={pending} onSubmit={(data) => submit({ businessId, code: text(data, "code"), name: text(data, "name"), sortOrder: Number(data.get("sortOrder") || 0) })}><Field label="Name" name="name" placeholder="Hot beverages" required/><Field label="Code" name="code" placeholder="HOT" required/><Field label="Sort order" name="sortOrder" type="number" defaultValue="0" min="0"/></SetupForm>;
}
function ItemForm({ businessId, catalog, pending, submit }: { businessId: string; catalog: MenuCatalog; pending: boolean; submit: (value: Parameters<typeof createMenuItem>[1]) => void }) {
  return <SetupForm icon={<ListPlusIcon />} title="Add item" pending={pending} disabled={!catalog.categories.length} onSubmit={(data) => submit({ businessId, categoryId: text(data, "categoryId"), code: text(data, "code"), itemType: text(data, "itemType"), name: text(data, "name"), taxCode: text(data, "taxCode") || undefined })}><Field label="Name" name="name" placeholder="Filter coffee" required/><Field label="Code" name="code" placeholder="COFFEE" required/><SelectField label="Category" name="categoryId" options={catalog.categories}/><SelectField label="Type" name="itemType" options={[{ id: "food", name: "Food" }, { id: "beverage", name: "Beverage" }, { id: "service", name: "Service" }]}/><Field label="Tax code" name="taxCode" placeholder="GST5"/></SetupForm>;
}
function VariantForm({ catalog, pending, submit }: { catalog: MenuCatalog; pending: boolean; submit: (value: Parameters<typeof createMenuVariant>[2]) => void }) {
  return <SetupForm icon={<PlusIcon />} title="Add variant" pending={pending} disabled={!catalog.items.length} onSubmit={(data) => submit({ code: text(data, "code"), itemId: text(data, "itemId"), name: text(data, "name") })}><SelectField label="Item" name="itemId" options={catalog.items}/><Field label="Variant name" name="name" placeholder="Large" required/><Field label="Code" name="code" placeholder="LG" required/></SetupForm>;
}
function PriceBookForm({ businessId, currency, pending, submit }: { businessId: string; currency: string; pending: boolean; submit: (value: Parameters<typeof createPriceBook>[1]) => void }) {
  return <SetupForm icon={<CircleDollarSignIcon />} title="Add price book" pending={pending} onSubmit={(data) => submit({ businessId, code: text(data, "code"), currency: text(data, "currency"), name: text(data, "name") })}><Field label="Name" name="name" placeholder="Standard" required/><Field label="Code" name="code" placeholder="STANDARD" required/><Field label="Currency" name="currency" defaultValue={currency} maxLength={3} required/></SetupForm>;
}
function PriceForm({ business, catalog, pending, submit }: { business: Awaited<ReturnType<typeof readFoundationSetup>>["businesses"][number]; catalog: MenuCatalog; pending: boolean; submit: (value: Record<string, unknown>) => void }) {
  const channels = business.locations.flatMap((location) => location.serviceChannels.map((channel) => ({ id: channel.id, name: `${location.name} · ${channel.name}` })));
  return <SetupForm className="content-start border-l-0 2xl:border-l 2xl:pl-6" icon={<CircleDollarSignIcon />} title="Set effective price" pending={pending} disabled={!catalog.items.length || !catalog.priceBooks.length} onSubmit={(data) => { const amount = Number(text(data, "amount")); submit({ amountMinor: Math.round(amount * 100), itemId: text(data, "itemId"), locationId: text(data, "locationId") || undefined, priceBookId: text(data, "priceBookId"), serviceChannelId: text(data, "serviceChannelId") || undefined, validFrom: text(data, "validFrom"), validTo: text(data, "validTo") || undefined }); }}><SelectField label="Price book" name="priceBookId" options={catalog.priceBooks}/><SelectField label="Item" name="itemId" options={catalog.items}/><Field label={`Amount (${business.currency})`} name="amount" type="number" min="0" step="0.01" required/><SelectField label="Outlet" name="locationId" optional options={business.locations}/><SelectField label="Service channel" name="serviceChannelId" optional options={channels}/><Field label="Valid from" name="validFrom" type="date" defaultValue={localDate()} required/><Field label="Valid to" name="validTo" type="date"/></SetupForm>;
}

function SetupForm({ children, className = "", disabled, icon, onSubmit, pending, title }: { children: ReactNode; className?: string; disabled?: boolean; icon: ReactNode; onSubmit: (data: FormData) => void; pending: boolean; title: string }) {
  return <form className={`grid gap-4 ${className}`} onSubmit={(event: FormEvent<HTMLFormElement>) => { event.preventDefault(); const form = event.currentTarget; onSubmit(new FormData(form)); form.reset(); }}><div className="flex items-center gap-2 font-semibold"><span className="[&_svg]:size-4">{icon}</span><h3>{title}</h3></div>{children}<Button className="w-fit" disabled={disabled || pending} type="submit" variant="outline"><PlusIcon/>{pending ? "Saving..." : title}</Button></form>;
}
function Field({ label, name, ...props }: ComponentProps<typeof Input> & { label: string; name: string }) { return <div className="grid gap-2"><Label htmlFor={name}>{label}</Label><Input id={name} name={name} {...props}/></div>; }
function SelectField({ label, name, optional, options }: { label: string; name: string; optional?: boolean; options: Array<{ id: string; name: string }> }) { return <div className="grid gap-2"><Label htmlFor={name}>{label}</Label><NativeSelect className="w-full" id={name} name={name} required={!optional}>{optional ? <NativeSelectOption value="">All</NativeSelectOption> : null}{options.map((option) => <NativeSelectOption key={option.id} value={option.id}>{option.name}</NativeSelectOption>)}</NativeSelect></div>; }
function ErrorNotice({ message }: { message: string }) { return <Alert variant="destructive"><AlertCircleIcon/><AlertTitle>Menu setup needs attention</AlertTitle><AlertDescription>{message}</AlertDescription></Alert>; }
function text(data: FormData, key: string): string { return String(data.get(key) ?? "").trim(); }
function localDate(): string { return new Date().toLocaleDateString("en-CA"); }
