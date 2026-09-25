import { useState } from "react";
import { BadgePercentIcon, PlusIcon } from "lucide-react";
import { Badge } from "@codexsun/ui/components/badge";
import { Button } from "@codexsun/ui/components/button";
import { Field } from "@codexsun/ui/components/field";
import { Input } from "@codexsun/ui/components/input";
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
          <Field label="Name" htmlFor="name"><Input id="name" name="name" placeholder="Festival menu" required  /></Field>
          <Field label="Scope" htmlFor="campaign-scope"><NativeSelect className="w-full" id="campaign-scope" name="scope" required onChange={(event) => setScope(event.currentTarget.value as SpecialCampaignInput["scope"])}>{[
              { id: "business", name: "All outlets" },
              { id: "location", name: "One outlet" },
            ].map((option) => (<NativeSelectOption key={option.id} value={option.id}>{option.name}</NativeSelectOption>))}</NativeSelect></Field>
          {scope === "location" ? <Field label="Outlet" htmlFor="campaign-locationId"><NativeSelect className="w-full" id="campaign-locationId" name="locationId" required>{locations.map((option) => (<NativeSelectOption key={option.id} value={option.id}>{option.name}</NativeSelectOption>))}</NativeSelect></Field> : null}
          <div className="grid grid-cols-2 gap-3">
            <Field label="Starts at" htmlFor="campaign-startsAt"><Input id="campaign-startsAt" name="startsAt" required type="datetime-local" defaultValue={localDateTime()} /></Field>
            <Field label="Ends at" htmlFor="campaign-endsAt"><Input id="campaign-endsAt" name="endsAt" required type="datetime-local" defaultValue={localDateTime(60)} /></Field>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <Field label="Priority" htmlFor="campaign-priority"><Input id="campaign-priority" name="priority" required type="number" defaultValue="0" min="0" /></Field>
            <Field label="Status" htmlFor="campaign-status"><NativeSelect className="w-full" id="campaign-status" name="status" required>{[
                { id: "draft", name: "Draft" },
                { id: "active", name: "Active" },
                { id: "inactive", name: "Inactive" },
              ].map((option) => (<NativeSelectOption key={option.id} value={option.id}>{option.name}</NativeSelectOption>))}</NativeSelect></Field>
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
          <Field label="Campaign" htmlFor="campaign-campaignId"><NativeSelect className="w-full" id="campaign-campaignId" name="campaignId" required>{catalog.specialCampaigns.map((option) => (<NativeSelectOption key={option.id} value={option.id}>{option.name}</NativeSelectOption>))}</NativeSelect></Field>
          <Field label="Item" htmlFor="campaign-itemId"><NativeSelect className="w-full" id="campaign-itemId" name="itemId" required onChange={(event) => setItemId(event.currentTarget.value)}>{catalog.items.map((option) => (<NativeSelectOption key={option.id} value={option.id}>{option.name}</NativeSelectOption>))}</NativeSelect></Field>
          <Field label="Variant" htmlFor="campaign-variantId"><NativeSelect className="w-full" id="campaign-variantId" name="variantId"><NativeSelectOption value="">All</NativeSelectOption>{(item?.variants ?? []).map((option) => (<NativeSelectOption key={option.id} value={option.id}>{option.name}</NativeSelectOption>))}</NativeSelect></Field>
          <Field label="Rule" htmlFor="campaign-rule"><NativeSelect className="w-full" id="campaign-rule" name="rule" required onChange={(event) => setRule(event.currentTarget.value as "amount" | "discount")}>{[
              { id: "amount", name: `Fixed amount (${currency})` },
              { id: "discount", name: "Discount (%)" },
            ].map((option) => (<NativeSelectOption key={option.id} value={option.id}>{option.name}</NativeSelectOption>))}</NativeSelect></Field>
          <Field label={rule === "amount" ? `Amount (${currency})` : "Discount (%)"} htmlFor="campaign-ruleValue">
            <Input
              id="campaign-ruleValue"
              max={rule === "discount" ? 100 : undefined}
              min={rule === "discount" ? 0.01 : 0}
              name="ruleValue"
              required
              step="0.01"
              type="number"
            />
          </Field>
          <Field label="Usage limit" htmlFor="campaign-usageLimit"><Input id="campaign-usageLimit" min="1" name="usageLimit" placeholder="Unlimited" type="number" /></Field>
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
function formatDateTime(value: string): string {
  return new Date(value).toLocaleString();
}
function value(data: FormData, key: string): string {
  return String(data.get(key) ?? "").trim();
}
