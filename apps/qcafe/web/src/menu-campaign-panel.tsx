import { useState, type ComponentProps } from "react";
import { BadgePercentIcon, PlusIcon } from "lucide-react";
import { Badge } from "@codexsun/ui/components/badge";
import { Button } from "@codexsun/ui/components/button";
import { Input } from "@codexsun/ui/components/input";
import { Label } from "@codexsun/ui/components/label";
import { NativeSelect, NativeSelectOption } from "@codexsun/ui/components/native-select";
import { localDateTime, toOffsetDateTime } from "./local-date-time";
import type { MenuCatalog, SpecialCampaignInput, SpecialPriceInput } from "./menu-api";

type Commands = {
  addCampaign: (input: SpecialCampaignInput) => void;
  addSpecialPrice: (input: SpecialPriceInput) => void;
};
type Outlet = { id: string; name: string };

export function MenuCampaignPanel({
  businessId,
  catalog,
  commands,
  currency,
  locations,
  pending,
}: {
  businessId: string;
  catalog: MenuCatalog;
  commands: Commands;
  currency: string;
  locations: Outlet[];
  pending: boolean;
}) {
  const [scope, setScope] = useState<SpecialCampaignInput["scope"]>("business");
  const [itemId, setItemId] = useState("");
  const [rule, setRule] = useState<"amount" | "discount">("amount");
  const item = catalog.items.find((entry) => entry.id === itemId);
  return (
    <section className="grid gap-5 border-t pt-6">
      <div className="flex items-center gap-2">
        <BadgePercentIcon className="size-4" />
        <h3 className="font-semibold">Campaign pricing</h3>
        <Badge variant="outline">{catalog.specialCampaigns.length}</Badge>
      </div>
      <div className="grid gap-7 lg:grid-cols-2">
        <form
          className="grid content-start gap-4"
          onSubmit={(event) => {
            event.preventDefault();
            const form = event.currentTarget;
            const data = new FormData(form);
            commands.addCampaign({
              businessId,
              endsAt: toOffsetDateTime(value(data, "endsAt")),
              locationId: scope === "location" ? value(data, "locationId") : undefined,
              name: value(data, "name"),
              priority: Number(data.get("priority") || 0),
              scope,
              startsAt: toOffsetDateTime(value(data, "startsAt")),
              status: value(data, "status") as SpecialCampaignInput["status"],
            });
          }}
        >
          <h4 className="font-medium">New campaign</h4>
          <Field label="Name" name="name" placeholder="Festival menu" required />
          <Select
            label="Scope"
            name="scope"
            onChange={(next) => setScope(next as SpecialCampaignInput["scope"])}
            options={[
              { id: "business", name: "All outlets" },
              { id: "location", name: "One outlet" },
            ]}
          />
          {scope === "location" ? <Select label="Outlet" name="locationId" options={locations} /> : null}
          <div className="grid grid-cols-2 gap-3">
            <Field defaultValue={localDateTime()} label="Starts at" name="startsAt" required type="datetime-local" />
            <Field defaultValue={localDateTime(60)} label="Ends at" name="endsAt" required type="datetime-local" />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <Field defaultValue="0" label="Priority" min="0" name="priority" required type="number" />
            <Select
              label="Status"
              name="status"
              options={[
                { id: "draft", name: "Draft" },
                { id: "active", name: "Active" },
                { id: "inactive", name: "Inactive" },
              ]}
            />
          </div>
          <Button className="w-fit" disabled={pending || !locations.length} type="submit" variant="outline">
            <PlusIcon />
            New campaign
          </Button>
        </form>
        <form
          className="grid content-start gap-4"
          onSubmit={(event) => {
            event.preventDefault();
            const form = event.currentTarget;
            const data = new FormData(form);
            const numericValue = Number(data.get("ruleValue"));
            commands.addSpecialPrice({
              amountMinor: rule === "amount" ? Math.round(numericValue * 100) : undefined,
              businessId,
              campaignId: value(data, "campaignId"),
              discountBasisPoints: rule === "discount" ? Math.round(numericValue * 100) : undefined,
              itemId: value(data, "itemId"),
              usageLimit: value(data, "usageLimit") ? Number(data.get("usageLimit")) : undefined,
              variantId: value(data, "variantId") || undefined,
            });
          }}
        >
          <h4 className="font-medium">New campaign price</h4>
          <Select label="Campaign" name="campaignId" options={catalog.specialCampaigns} />
          <Select label="Item" name="itemId" onChange={setItemId} options={catalog.items} />
          <Select label="Variant" name="variantId" optional options={item?.variants ?? []} />
          <Select
            label="Rule"
            name="rule"
            onChange={(next) => setRule(next as "amount" | "discount")}
            options={[
              { id: "amount", name: `Fixed amount (${currency})` },
              { id: "discount", name: "Discount (%)" },
            ]}
          />
          <Field
            label={rule === "amount" ? `Amount (${currency})` : "Discount (%)"}
            max={rule === "discount" ? 100 : undefined}
            min={rule === "discount" ? 0.01 : 0}
            name="ruleValue"
            required
            step="0.01"
            type="number"
          />
          <Field label="Usage limit" min="1" name="usageLimit" placeholder="Unlimited" type="number" />
          <Button
            className="w-fit"
            disabled={pending || !catalog.specialCampaigns.length || !catalog.items.length}
            type="submit"
            variant="outline"
          >
            <PlusIcon />
            New campaign price
          </Button>
        </form>
      </div>
      <div className="grid gap-3">
        {catalog.specialCampaigns.length ? (
          catalog.specialCampaigns.map((campaign) => {
            const prices = catalog.specialPrices.filter((price) => price.campaignId === campaign.id);
            return (
              <div className="grid gap-2 border-b pb-3" key={campaign.id}>
                <div className="flex flex-wrap items-center gap-2">
                  <span className="font-medium">{campaign.name}</span>
                  <Badge variant={campaign.status === "active" ? "outline" : "secondary"}>{campaign.status}</Badge>
                  <Badge variant="outline">priority {campaign.priority}</Badge>
                </div>
                <div className="text-xs text-muted-foreground">
                  {campaign.scope === "location"
                    ? (locations.find((location) => location.id === campaign.locationId)?.name ?? "Outlet")
                    : "All outlets"}{" "}
                  · {formatDateTime(campaign.startsAt)} to {formatDateTime(campaign.endsAt)}
                </div>
                <div className="text-xs text-muted-foreground">
                  {prices.map((price) => describePrice(price, catalog, currency)).join(" · ") || "No item prices yet"}
                </div>
              </div>
            );
          })
        ) : (
          <div className="grid min-h-24 place-items-center border-y text-center text-sm text-muted-foreground">
            No campaigns configured.
          </div>
        )}
      </div>
    </section>
  );
}

function describePrice(price: MenuCatalog["specialPrices"][number], catalog: MenuCatalog, currency: string): string {
  const item = catalog.items.find((entry) => entry.id === price.itemId);
  const variant = item?.variants.find((entry) => entry.id === price.variantId);
  const rule =
    price.amountMinor !== null
      ? `${currency} ${(price.amountMinor / 100).toFixed(2)}`
      : `${((price.discountBasisPoints ?? 0) / 100).toFixed(2)}% off`;
  const usage =
    price.usageLimit === null ? "unlimited" : `${Math.max(0, price.usageLimit - price.usedCount)} remaining`;
  return `${item?.name ?? "Item"}${variant ? ` / ${variant.name}` : ""}: ${rule}, ${usage}`;
}
function Field({ label, name, ...props }: ComponentProps<typeof Input> & { label: string; name: string }) {
  return (
    <div className="grid gap-2">
      <Label htmlFor={`campaign-${name}`}>{label}</Label>
      <Input id={`campaign-${name}`} name={name} {...props} />
    </div>
  );
}
function Select({
  label,
  name,
  onChange,
  optional,
  options,
}: {
  label: string;
  name: string;
  onChange?: (value: string) => void;
  optional?: boolean;
  options: Array<{ id: string; name: string }>;
}) {
  return (
    <div className="grid gap-2">
      <Label htmlFor={`campaign-${name}`}>{label}</Label>
      <NativeSelect
        className="w-full"
        id={`campaign-${name}`}
        name={name}
        onChange={(event) => onChange?.(event.currentTarget.value)}
        required={!optional}
      >
        <NativeSelectOption value="">{optional ? "All" : "Select"}</NativeSelectOption>
        {options.map((option) => (
          <NativeSelectOption key={option.id} value={option.id}>
            {option.name}
          </NativeSelectOption>
        ))}
      </NativeSelect>
    </div>
  );
}
function formatDateTime(value: string): string {
  return new Date(value).toLocaleString();
}
function value(data: FormData, key: string): string {
  return String(data.get(key) ?? "").trim();
}
