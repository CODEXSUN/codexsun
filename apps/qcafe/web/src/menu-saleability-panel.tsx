import { useMutation } from "@tanstack/react-query";
import { CircleCheckIcon, SearchCheckIcon, TriangleAlertIcon } from "lucide-react";
import { useState, type FormEvent } from "react";
import { Alert, AlertDescription, AlertTitle } from "@codexsun/ui/components/alert";
import { Badge } from "@codexsun/ui/components/badge";
import { Button } from "@codexsun/ui/components/button";
import { Input } from "@codexsun/ui/components/input";
import { Label } from "@codexsun/ui/components/label";
import { NativeSelect, NativeSelectOption } from "@codexsun/ui/components/native-select";
import type { FoundationLocation } from "./foundation-setup-api";
import { localDateTime, toOffsetDateTime } from "./local-date-time";
import { readEffectiveSaleability, type MenuCatalog, type SaleabilityInput, type SaleabilityReason } from "./menu-api";

const reasonLabels: Record<SaleabilityReason, string> = {
  category_inactive: "The item's category is inactive.",
  channel_invalid: "The service channel is disabled or does not belong to this outlet.",
  item_inactive: "The item is inactive.",
  item_not_found: "The item does not belong to this business.",
  item_unavailable: "An availability rule blocks this sale.",
  location_invalid: "The outlet is inactive or does not belong to this business.",
  modifier_configuration_invalid: "A required modifier group has too few active choices.",
  price_book_ineligible: "The price book is inactive, out of date, or outside this outlet/channel scope.",
  price_missing: "No effective price matches this item, variant, outlet, channel, and date.",
  variant_inactive: "The selected variant is inactive.",
  variant_invalid: "The selected variant does not belong to this item.",
};

export function MenuSaleabilityPanel({
  businessId,
  catalog,
  currency,
  locations,
  request,
}: {
  businessId: string;
  catalog: MenuCatalog;
  currency: string;
  locations: FoundationLocation[];
  request: typeof fetch;
}) {
  const [itemId, setItemId] = useState(catalog.items[0]?.id ?? "");
  const [locationId, setLocationId] = useState(locations[0]?.id ?? "");
  const item = catalog.items.find((entry) => entry.id === itemId);
  const location = locations.find((entry) => entry.id === locationId);
  const check = useMutation({ mutationFn: (input: SaleabilityInput) => readEffectiveSaleability(request, input) });

  function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const data = new FormData(event.currentTarget);
    check.mutate({
      at: toOffsetDateTime(value(data, "at")),
      businessId,
      itemId: value(data, "itemId"),
      locationId: value(data, "locationId"),
      priceBookId: value(data, "priceBookId"),
      serviceChannelId: value(data, "serviceChannelId") || undefined,
      variantId: value(data, "variantId") || undefined,
    });
  }

  return (
    <section className="grid gap-4 border-t pt-6">
      <div className="flex items-center gap-2">
        <SearchCheckIcon className="size-4" />
        <h3 className="font-semibold">Check saleability</h3>
      </div>
      <form className="grid gap-4" onSubmit={submit}>
        <Select label="Item" name="itemId" options={catalog.items} value={itemId} onChange={setItemId} />
        <Select label="Variant" name="variantId" optional options={item?.variants ?? []} />
        <Select label="Price book" name="priceBookId" options={catalog.priceBooks} />
        <Select label="Outlet" name="locationId" options={locations} value={locationId} onChange={setLocationId} />
        <Select
          label="Service channel"
          name="serviceChannelId"
          optional
          options={location?.serviceChannels.filter((channel) => channel.enabled) ?? []}
        />
        <div className="grid gap-2">
          <Label htmlFor="saleability-at">Sale time</Label>
          <Input defaultValue={localDateTime()} id="saleability-at" name="at" required type="datetime-local" />
        </div>
        <Button
          className="w-fit"
          disabled={check.isPending || !catalog.items.length || !catalog.priceBooks.length || !locations.length}
          type="submit"
          variant="outline"
        >
          <SearchCheckIcon />
          {check.isPending ? "Checking..." : "Check saleability"}
        </Button>
      </form>
      {check.isError ? (
        <Alert variant="destructive">
          <TriangleAlertIcon />
          <AlertTitle>Check failed</AlertTitle>
          <AlertDescription>{check.error.message}</AlertDescription>
        </Alert>
      ) : null}
      {check.data ? <SaleabilityResult catalog={catalog} currency={currency} result={check.data} /> : null}
    </section>
  );
}

function SaleabilityResult({
  catalog,
  currency,
  result,
}: {
  catalog: MenuCatalog;
  currency: string;
  result: Awaited<ReturnType<typeof readEffectiveSaleability>>;
}) {
  return (
    <div className="grid gap-3 border-y py-4" aria-live="polite">
      <div className="flex items-center justify-between gap-3">
        <div className="flex items-center gap-2 font-medium">
          {result.saleable ? (
            <CircleCheckIcon className="size-4 text-emerald-600" />
          ) : (
            <TriangleAlertIcon className="size-4 text-destructive" />
          )}
          {result.saleable ? "Ready for sale" : "Sale blocked"}
        </div>
        <Badge variant={result.saleable ? "outline" : "destructive"}>
          {result.effectiveAmountMinor !== null
            ? `${currency} ${(result.effectiveAmountMinor / 100).toFixed(2)}`
            : "No price"}
        </Badge>
      </div>
      {result.reasons.map((reason) => (
        <p className="text-sm text-muted-foreground" key={reason}>
          {reasonLabels[reason]}
        </p>
      ))}
      {result.invalidModifierGroupIds.map((groupId) => (
        <p className="text-xs text-muted-foreground" key={groupId}>
          Review {catalog.modifierGroups.find((group) => group.id === groupId)?.name ?? groupId}.
        </p>
      ))}
      {result.campaign ? (
        <p className="text-xs text-muted-foreground">Campaign applied: {result.campaign.name}.</p>
      ) : null}
      {result.availableRule?.reason ? (
        <p className="text-xs text-muted-foreground">Availability note: {result.availableRule.reason}</p>
      ) : null}
    </div>
  );
}

function Select({
  label,
  name,
  onChange,
  optional,
  options,
  value,
}: {
  label: string;
  name: string;
  onChange?: (value: string) => void;
  optional?: boolean;
  options: Array<{ id: string; name: string }>;
  value?: string;
}) {
  return (
    <div className="grid gap-2">
      <Label htmlFor={`saleability-${name}`}>{label}</Label>
      <NativeSelect
        className="w-full"
        id={`saleability-${name}`}
        name={name}
        onChange={onChange ? (event) => onChange(event.currentTarget.value) : undefined}
        required={!optional}
        value={value}
      >
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

function value(data: FormData, key: string): string {
  return String(data.get(key) ?? "").trim();
}
