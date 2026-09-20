import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useEffect, useState, type ComponentProps, type FormEvent, type ReactNode } from "react";
import {
  AlertCircleIcon,
  CircleDollarSignIcon,
  ImageIcon,
  Layers3Icon,
  ListPlusIcon,
  PlusIcon,
  UploadIcon,
  UtensilsIcon,
} from "lucide-react";
import { Alert, AlertDescription, AlertTitle } from "@codexsun/ui/components/alert";
import { Badge } from "@codexsun/ui/components/badge";
import { Button } from "@codexsun/ui/components/button";
import { Input } from "@codexsun/ui/components/input";
import { Label } from "@codexsun/ui/components/label";
import { NativeSelect, NativeSelectOption } from "@codexsun/ui/components/native-select";
import { readFoundationSetup } from "./foundation-setup-api";
import { MenuAvailabilityPanel } from "./menu-availability-panel";
import { MenuCampaignPanel } from "./menu-campaign-panel";
import { MenuCustomizationPanel } from "./menu-customization-panel";
import { MenuSaleabilityPanel } from "./menu-saleability-panel";
import {
  assignItemAllergen,
  assignItemModifierGroup,
  createAllergenTag,
  createItemAvailability,
  createMenuCategory,
  createMenuItem,
  createMenuVariant,
  createModifierGroup,
  createModifierOption,
  createPriceBook,
  createSpecialCampaign,
  createSpecialPrice,
  readMenu,
  readMenuMediaContent,
  setMenuPrice,
  uploadMenuMedia,
  type AllergenTagInput,
  type ItemAllergenInput,
  type ItemAvailabilityInput,
  type ItemModifierGroupInput,
  type MenuCatalog,
  type MenuMediaUpload,
  type ModifierGroupInput,
  type ModifierOptionInput,
  type SpecialCampaignInput,
  type SpecialPriceInput,
} from "./menu-api";

export function MenuPage({ request }: { request: typeof fetch }) {
  const client = useQueryClient();
  const setup = useQuery({ queryKey: ["qcafe", "foundation", "setup"], queryFn: () => readFoundationSetup(request) });
  const business = setup.data?.businesses[0];
  const menuKey = ["qcafe", "menu", business?.id] as const;
  const menu = useQuery({
    enabled: Boolean(business),
    queryKey: menuKey,
    queryFn: () => readMenu(request, business!.id),
  });
  const save = (catalog: MenuCatalog) => client.setQueryData(menuKey, catalog);
  const category = useMutation({
    mutationFn: (input: Parameters<typeof createMenuCategory>[1]) => createMenuCategory(request, input),
    onSuccess: save,
  });
  const item = useMutation({
    mutationFn: (input: Parameters<typeof createMenuItem>[1]) => createMenuItem(request, input),
    onSuccess: save,
  });
  const variant = useMutation({
    mutationFn: (input: Parameters<typeof createMenuVariant>[2]) => createMenuVariant(request, business!.id, input),
    onSuccess: save,
  });
  const priceBook = useMutation({
    mutationFn: (input: Parameters<typeof createPriceBook>[1]) => createPriceBook(request, input),
    onSuccess: save,
  });
  const price = useMutation({
    mutationFn: (input: Record<string, unknown>) => setMenuPrice(request, business!.id, input),
    onSuccess: save,
  });
  const campaign = useMutation({
    mutationFn: (input: SpecialCampaignInput) => createSpecialCampaign(request, input),
    onSuccess: save,
  });
  const specialPrice = useMutation({
    mutationFn: (input: SpecialPriceInput) => createSpecialPrice(request, input),
    onSuccess: save,
  });
  const media = useMutation({
    mutationFn: (input: MenuMediaUpload) => uploadMenuMedia(request, business!.id, input),
    onSuccess: save,
  });
  const availability = useMutation({
    mutationFn: (input: ItemAvailabilityInput) => createItemAvailability(request, input),
    onSuccess: save,
  });
  const modifierGroup = useMutation({
    mutationFn: (input: ModifierGroupInput) => createModifierGroup(request, input),
    onSuccess: save,
  });
  const modifierOption = useMutation({
    mutationFn: (input: ModifierOptionInput) => createModifierOption(request, input),
    onSuccess: save,
  });
  const itemModifierGroup = useMutation({
    mutationFn: (input: ItemModifierGroupInput) => assignItemModifierGroup(request, input),
    onSuccess: save,
  });
  const allergenTag = useMutation({
    mutationFn: (input: AllergenTagInput) => createAllergenTag(request, input),
    onSuccess: save,
  });
  const itemAllergen = useMutation({
    mutationFn: (input: ItemAllergenInput) => assignItemAllergen(request, input),
    onSuccess: save,
  });

  if (setup.isPending || (business && menu.isPending))
    return <p className="text-sm text-muted-foreground">Loading menu setup...</p>;
  if (setup.isError || menu.isError)
    return <ErrorNotice message={(setup.error ?? menu.error)?.message ?? "Menu could not be loaded."} />;
  if (!business) return <ErrorNotice message="Create the first business and outlet before building a menu." />;
  const catalog = menu.data
    ? {
        ...menu.data,
        allergenTags: menu.data.allergenTags ?? [],
        availability: menu.data.availability ?? [],
        itemAllergens: menu.data.itemAllergens ?? [],
        itemModifierGroups: menu.data.itemModifierGroups ?? [],
        media: menu.data.media ?? [],
        modifierGroups: menu.data.modifierGroups ?? [],
        specialCampaigns: menu.data.specialCampaigns ?? [],
        specialPrices: menu.data.specialPrices ?? [],
      }
    : {
        allergenTags: [],
        availability: [],
        categories: [],
        itemAllergens: [],
        itemModifierGroups: [],
        items: [],
        media: [],
        modifierGroups: [],
        priceBooks: [],
        prices: [],
        specialCampaigns: [],
        specialPrices: [],
      };
  const mutationError =
    category.error ??
    item.error ??
    variant.error ??
    priceBook.error ??
    price.error ??
    campaign.error ??
    specialPrice.error ??
    media.error ??
    availability.error ??
    modifierGroup.error ??
    modifierOption.error ??
    itemModifierGroup.error ??
    allergenTag.error ??
    itemAllergen.error;
  const customizationPending =
    modifierGroup.isPending ||
    modifierOption.isPending ||
    itemModifierGroup.isPending ||
    allergenTag.isPending ||
    itemAllergen.isPending;

  return (
    <div className="grid gap-8">
      <section className="flex flex-wrap items-center justify-between gap-3 border-b pb-5">
        <div>
          <h2 className="text-lg font-semibold">{business.name}</h2>
          <p className="text-sm text-muted-foreground">Catalog, variants, and effective prices</p>
        </div>
        <div className="flex gap-2">
          <Badge variant="outline">{catalog.categories.length} categories</Badge>
          <Badge variant="outline">{catalog.items.length} items</Badge>
        </div>
      </section>
      {mutationError ? <ErrorNotice message={mutationError.message} /> : null}
      <div className="grid gap-8 2xl:grid-cols-[minmax(0,1fr)_360px]">
        <section className="grid content-start gap-6">
          <CatalogTable catalog={catalog} currency={business.currency} />
          <MediaManager
            businessId={business.id}
            catalog={catalog}
            pending={media.isPending}
            request={request}
            submit={media.mutate}
          />
          <MenuCampaignPanel
            businessId={business.id}
            catalog={catalog}
            commands={{ addCampaign: campaign.mutate, addSpecialPrice: specialPrice.mutate }}
            currency={business.currency}
            locations={business.locations}
            pending={campaign.isPending || specialPrice.isPending}
          />
          <MenuAvailabilityPanel
            businessId={business.id}
            catalog={catalog}
            locations={business.locations}
            pending={availability.isPending}
            submit={availability.mutate}
          />
          <MenuCustomizationPanel
            businessId={business.id}
            catalog={catalog}
            commands={{
              addAllergen: allergenTag.mutate,
              addModifierGroup: modifierGroup.mutate,
              addModifierOption: modifierOption.mutate,
              assignAllergen: itemAllergen.mutate,
              assignModifierGroup: itemModifierGroup.mutate,
            }}
            pending={customizationPending}
          />
          <div className="grid gap-6 border-t pt-6 lg:grid-cols-2">
            <CategoryForm businessId={business.id} pending={category.isPending} submit={category.mutate} />
            <ItemForm businessId={business.id} catalog={catalog} pending={item.isPending} submit={item.mutate} />
            <VariantForm catalog={catalog} pending={variant.isPending} submit={variant.mutate} />
            <PriceBookForm
              businessId={business.id}
              currency={business.currency}
              pending={priceBook.isPending}
              submit={priceBook.mutate}
            />
          </div>
        </section>
        <aside className="grid content-start gap-8 2xl:border-l 2xl:pl-6">
          <PriceForm business={business} catalog={catalog} pending={price.isPending} submit={price.mutate} />
          <MenuSaleabilityPanel
            businessId={business.id}
            catalog={catalog}
            currency={business.currency}
            locations={business.locations}
            request={request}
          />
        </aside>
      </div>
    </div>
  );
}

function CatalogTable({ catalog, currency }: { catalog: MenuCatalog; currency: string }) {
  if (!catalog.items.length)
    return (
      <div className="grid min-h-48 place-items-center border-y text-center">
        <div>
          <UtensilsIcon className="mx-auto mb-3 size-5 text-muted-foreground" />
          <h3 className="font-medium">No menu items yet</h3>
          <p className="mt-1 text-sm text-muted-foreground">Create a category, then add the first sale item.</p>
        </div>
      </div>
    );
  return (
    <div className="overflow-x-auto border-y">
      <table className="w-full min-w-[680px] text-sm">
        <thead className="border-b bg-muted/40 text-left text-xs text-muted-foreground">
          <tr>
            <th className="px-3 py-3 font-medium">Item</th>
            <th className="px-3 py-3 font-medium">Category</th>
            <th className="px-3 py-3 font-medium">Variants</th>
            <th className="px-3 py-3 font-medium">Current prices</th>
          </tr>
        </thead>
        <tbody className="divide-y">
          {catalog.items.map((entry) => (
            <tr key={entry.id}>
              <td className="px-3 py-4">
                <div className="font-medium">{entry.name}</div>
                <div className="text-xs text-muted-foreground">
                  {entry.code} · {entry.itemType}
                </div>
              </td>
              <td className="px-3 py-4">
                {catalog.categories.find((value) => value.id === entry.categoryId)?.name ?? "Unknown"}
              </td>
              <td className="px-3 py-4">
                {entry.variants.length ? entry.variants.map((value) => value.name).join(", ") : "Base item"}
              </td>
              <td className="px-3 py-4">
                {catalog.prices
                  .filter((value) => value.itemId === entry.id)
                  .map((value) => `${currency} ${(value.amountMinor / 100).toFixed(2)}`)
                  .join(", ") || "Not priced"}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function CategoryForm({
  businessId,
  pending,
  submit,
}: {
  businessId: string;
  pending: boolean;
  submit: (value: { businessId: string; code: string; name: string; sortOrder: number }) => void;
}) {
  return (
    <SetupForm
      icon={<Layers3Icon />}
      title="Add category"
      pending={pending}
      onSubmit={(data) =>
        submit({
          businessId,
          code: text(data, "code"),
          name: text(data, "name"),
          sortOrder: Number(data.get("sortOrder") || 0),
        })
      }
    >
      <Field label="Name" name="name" placeholder="Hot beverages" required />
      <Field label="Code" name="code" placeholder="HOT" required />
      <Field label="Sort order" name="sortOrder" type="number" defaultValue="0" min="0" />
    </SetupForm>
  );
}
function ItemForm({
  businessId,
  catalog,
  pending,
  submit,
}: {
  businessId: string;
  catalog: MenuCatalog;
  pending: boolean;
  submit: (value: Parameters<typeof createMenuItem>[1]) => void;
}) {
  return (
    <SetupForm
      icon={<ListPlusIcon />}
      title="Add item"
      pending={pending}
      disabled={!catalog.categories.length}
      onSubmit={(data) =>
        submit({
          businessId,
          categoryId: text(data, "categoryId"),
          code: text(data, "code"),
          itemType: text(data, "itemType"),
          name: text(data, "name"),
          taxCode: text(data, "taxCode") || undefined,
        })
      }
    >
      <Field label="Name" name="name" placeholder="Filter coffee" required />
      <Field label="Code" name="code" placeholder="COFFEE" required />
      <SelectField label="Category" name="categoryId" options={catalog.categories} />
      <SelectField
        label="Type"
        name="itemType"
        options={[
          { id: "food", name: "Food" },
          { id: "beverage", name: "Beverage" },
          { id: "packaged", name: "Packaged" },
          { id: "service", name: "Service" },
        ]}
      />
      <Field label="Tax code" name="taxCode" placeholder="GST5" />
    </SetupForm>
  );
}

function MediaManager({
  businessId,
  catalog,
  pending,
  request,
  submit,
}: {
  businessId: string;
  catalog: MenuCatalog;
  pending: boolean;
  request: typeof fetch;
  submit: (value: MenuMediaUpload) => void;
}) {
  return (
    <section className="grid gap-5 border-t pt-6">
      <div className="flex items-center gap-2">
        <ImageIcon className="size-4" />
        <h3 className="font-semibold">Menu images</h3>
        <Badge variant="outline">{catalog.media.length}</Badge>
      </div>
      <div className="grid gap-6 lg:grid-cols-[320px_minmax(0,1fr)]">
        <form
          className="grid content-start gap-4"
          onSubmit={async (event) => {
            event.preventDefault();
            const form = event.currentTarget;
            const data = new FormData(form);
            const file = data.get("file");
            if (!(file instanceof File) || !file.size) return;
            if (file.size > 5 * 1024 * 1024) return;
            const dimensions = await readImageDimensions(file);
            submit({
              file,
              itemId: text(data, "itemId"),
              sortOrder: Number(data.get("sortOrder") || 0),
              usage: text(data, "usage") as MenuMediaUpload["usage"],
              ...dimensions,
            });
            form.reset();
          }}
        >
          <SelectField label="Item" name="itemId" options={catalog.items} />
          <SelectField
            label="Usage"
            name="usage"
            options={[
              { id: "menu", name: "Menu" },
              { id: "qr", name: "QR ordering" },
              { id: "delivery", name: "Delivery" },
            ]}
          />
          <Field accept="image/png,image/jpeg,image/webp,image/gif" label="Image" name="file" type="file" required />
          <Field defaultValue="0" label="Display order" min="0" name="sortOrder" type="number" />
          <Button className="w-fit" disabled={pending || !catalog.items.length} type="submit" variant="outline">
            <UploadIcon />
            {pending ? "Uploading..." : "Upload image"}
          </Button>
          <p className="text-xs text-muted-foreground">PNG, JPEG, WebP, or GIF. Maximum 5 MB.</p>
        </form>
        <div className="grid content-start gap-3">
          {catalog.media.length ? (
            catalog.media.map((entry) => (
              <div className="grid grid-cols-[72px_minmax(0,1fr)] items-center gap-3 border-b pb-3" key={entry.id}>
                <MenuMediaThumbnail assetId={entry.assetId} businessId={businessId} request={request} />
                <div className="min-w-0">
                  <div className="font-medium">
                    {catalog.items.find((item) => item.id === entry.itemId)?.name ?? "Menu item"}
                  </div>
                  <div className="mt-1 flex flex-wrap gap-2 text-xs text-muted-foreground">
                    <span>{entry.usage}</span>
                    <span>
                      {entry.width && entry.height ? `${entry.width} x ${entry.height}` : "Dimensions unavailable"}
                    </span>
                    <span>{entry.checksum.slice(0, 10)}</span>
                  </div>
                </div>
              </div>
            ))
          ) : (
            <div className="grid min-h-32 place-items-center border-y text-center text-sm text-muted-foreground">
              No menu images uploaded.
            </div>
          )}
        </div>
      </div>
    </section>
  );
}

function MenuMediaThumbnail({
  assetId,
  businessId,
  request,
}: {
  assetId: string;
  businessId: string;
  request: typeof fetch;
}) {
  const [source, setSource] = useState<string>();
  useEffect(() => {
    let active = true;
    let objectUrl: string | undefined;
    void readMenuMediaContent(request, businessId, assetId).then((blob) => {
      if (!active) return;
      objectUrl = URL.createObjectURL(blob);
      setSource(objectUrl);
    });
    return () => {
      active = false;
      if (objectUrl) URL.revokeObjectURL(objectUrl);
    };
  }, [assetId, businessId, request]);
  return source ? (
    <img alt="" className="aspect-square size-[72px] object-cover" src={source} />
  ) : (
    <div className="grid aspect-square size-[72px] place-items-center bg-muted">
      <ImageIcon className="size-5 text-muted-foreground" />
    </div>
  );
}

async function readImageDimensions(file: File): Promise<{ height?: number; width?: number }> {
  try {
    const bitmap = await createImageBitmap(file);
    const dimensions = { height: bitmap.height, width: bitmap.width };
    bitmap.close();
    return dimensions;
  } catch {
    return {};
  }
}
function VariantForm({
  catalog,
  pending,
  submit,
}: {
  catalog: MenuCatalog;
  pending: boolean;
  submit: (value: Parameters<typeof createMenuVariant>[2]) => void;
}) {
  return (
    <SetupForm
      icon={<PlusIcon />}
      title="Add variant"
      pending={pending}
      disabled={!catalog.items.length}
      onSubmit={(data) => submit({ code: text(data, "code"), itemId: text(data, "itemId"), name: text(data, "name") })}
    >
      <SelectField label="Item" name="itemId" options={catalog.items} />
      <Field label="Variant name" name="name" placeholder="Large" required />
      <Field label="Code" name="code" placeholder="LG" required />
    </SetupForm>
  );
}
function PriceBookForm({
  businessId,
  currency,
  pending,
  submit,
}: {
  businessId: string;
  currency: string;
  pending: boolean;
  submit: (value: Parameters<typeof createPriceBook>[1]) => void;
}) {
  return (
    <SetupForm
      icon={<CircleDollarSignIcon />}
      title="Add price book"
      pending={pending}
      onSubmit={(data) =>
        submit({ businessId, code: text(data, "code"), currency: text(data, "currency"), name: text(data, "name") })
      }
    >
      <Field label="Name" name="name" placeholder="Standard" required />
      <Field label="Code" name="code" placeholder="STANDARD" required />
      <Field label="Currency" name="currency" defaultValue={currency} maxLength={3} required />
    </SetupForm>
  );
}
function PriceForm({
  business,
  catalog,
  pending,
  submit,
}: {
  business: Awaited<ReturnType<typeof readFoundationSetup>>["businesses"][number];
  catalog: MenuCatalog;
  pending: boolean;
  submit: (value: Record<string, unknown>) => void;
}) {
  const channels = business.locations.flatMap((location) =>
    location.serviceChannels.map((channel) => ({ id: channel.id, name: `${location.name} · ${channel.name}` })),
  );
  return (
    <SetupForm
      icon={<CircleDollarSignIcon />}
      title="Set effective price"
      pending={pending}
      disabled={!catalog.items.length || !catalog.priceBooks.length}
      onSubmit={(data) => {
        const amount = Number(text(data, "amount"));
        submit({
          amountMinor: Math.round(amount * 100),
          itemId: text(data, "itemId"),
          locationId: text(data, "locationId") || undefined,
          priceBookId: text(data, "priceBookId"),
          serviceChannelId: text(data, "serviceChannelId") || undefined,
          validFrom: text(data, "validFrom"),
          validTo: text(data, "validTo") || undefined,
        });
      }}
    >
      <SelectField label="Price book" name="priceBookId" options={catalog.priceBooks} />
      <SelectField label="Item" name="itemId" options={catalog.items} />
      <Field label={`Amount (${business.currency})`} name="amount" type="number" min="0" step="0.01" required />
      <SelectField label="Outlet" name="locationId" optional options={business.locations} />
      <SelectField label="Service channel" name="serviceChannelId" optional options={channels} />
      <Field label="Valid from" name="validFrom" type="date" defaultValue={localDate()} required />
      <Field label="Valid to" name="validTo" type="date" />
    </SetupForm>
  );
}

function SetupForm({
  children,
  className = "",
  disabled,
  icon,
  onSubmit,
  pending,
  title,
}: {
  children: ReactNode;
  className?: string;
  disabled?: boolean;
  icon: ReactNode;
  onSubmit: (data: FormData) => void;
  pending: boolean;
  title: string;
}) {
  return (
    <form
      className={`grid gap-4 ${className}`}
      onSubmit={(event: FormEvent<HTMLFormElement>) => {
        event.preventDefault();
        const form = event.currentTarget;
        onSubmit(new FormData(form));
        form.reset();
      }}
    >
      <div className="flex items-center gap-2 font-semibold">
        <span className="[&_svg]:size-4">{icon}</span>
        <h3>{title}</h3>
      </div>
      {children}
      <Button className="w-fit" disabled={disabled || pending} type="submit" variant="outline">
        <PlusIcon />
        {pending ? "Saving..." : title}
      </Button>
    </form>
  );
}
function Field({ label, name, ...props }: ComponentProps<typeof Input> & { label: string; name: string }) {
  return (
    <div className="grid gap-2">
      <Label htmlFor={name}>{label}</Label>
      <Input id={name} name={name} {...props} />
    </div>
  );
}
function SelectField({
  label,
  name,
  optional,
  options,
}: {
  label: string;
  name: string;
  optional?: boolean;
  options: Array<{ id: string; name: string }>;
}) {
  return (
    <div className="grid gap-2">
      <Label htmlFor={name}>{label}</Label>
      <NativeSelect className="w-full" id={name} name={name} required={!optional}>
        {optional ? <NativeSelectOption value="">All</NativeSelectOption> : null}
        {options.map((option) => (
          <NativeSelectOption key={option.id} value={option.id}>
            {option.name}
          </NativeSelectOption>
        ))}
      </NativeSelect>
    </div>
  );
}
function ErrorNotice({ message }: { message: string }) {
  return (
    <Alert variant="destructive">
      <AlertCircleIcon />
      <AlertTitle>Menu setup needs attention</AlertTitle>
      <AlertDescription>{message}</AlertDescription>
    </Alert>
  );
}
function text(data: FormData, key: string): string {
  return String(data.get(key) ?? "").trim();
}
function localDate(): string {
  return new Date().toLocaleDateString("en-CA");
}
