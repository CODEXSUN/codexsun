import { useMemo, useState, type FormEvent } from "react";
import { CalendarClockIcon, PlusIcon } from "lucide-react";
import { Badge } from "@codexsun/ui/components/badge";
import { Button } from "@codexsun/ui/components/button";
import { Field } from "@codexsun/ui/components/field";
import { Input } from "@codexsun/ui/components/input";
import { NativeSelect, NativeSelectOption } from "@codexsun/ui/components/native-select";
import type { ItemAvailabilityInput, MenuCatalog } from "./menu-api";
import { localDateTime, toOffsetDateTime } from "./local-date-time";

type Outlet = { id: string; name: string; serviceChannels: Array<{ id: string; name: string }> };

export function MenuAvailabilityPanel({
  businessId,
  catalog,
  locations,
  pending,
  submit,
}: {
  businessId: string;
  catalog: MenuCatalog;
  locations: Outlet[];
  pending: boolean;
  submit: (input: ItemAvailabilityInput) => void;
}) {
  const [itemId, setItemId] = useState("");
  const [locationId, setLocationId] = useState("");
  const [startsAtDefault] = useState(localDateTime);
  const item = catalog.items.find((entry) => entry.id === itemId);
  const location = locations.find((entry) => entry.id === locationId);
  const itemNames = useMemo(() => new Map(catalog.items.map((entry) => [entry.id, entry.name])), [catalog.items]);
  const outletNames = useMemo(() => new Map(locations.map((entry) => [entry.id, entry.name])), [locations]);

  return (
    <section className="grid gap-5 border-t pt-6">
      <div className="flex items-center gap-2">
        <CalendarClockIcon className="size-4" />
        <h3 className="font-semibold">Item availability</h3>
        <Badge variant="outline">{catalog.availability.length}</Badge>
      </div>
      <div className="grid gap-6 lg:grid-cols-[360px_minmax(0,1fr)]">
        <form
          className="grid content-start gap-4"
          onSubmit={(event: FormEvent<HTMLFormElement>) => {
            event.preventDefault();
            const form = event.currentTarget;
            const data = new FormData(form);
            const endsAt = value(data, "endsAt");
            submit({
              businessId,
              endsAt: endsAt ? toOffsetDateTime(endsAt) : undefined,
              itemId: value(data, "itemId"),
              locationId: value(data, "locationId"),
              reason: value(data, "reason") || undefined,
              serviceChannelId: value(data, "serviceChannelId") || undefined,
              startsAt: toOffsetDateTime(value(data, "startsAt")),
              status: value(data, "status") as ItemAvailabilityInput["status"],
              variantId: value(data, "variantId") || undefined,
            });
          }}
        >
          <Field label="Item" htmlFor="availability-itemId"><NativeSelect className="w-full" id="availability-itemId" name="itemId" required onChange={(event) => setItemId(event.currentTarget.value)}>{catalog.items.map((option) => (<NativeSelectOption key={option.id} value={option.id}>{option.name}</NativeSelectOption>))}</NativeSelect></Field>
          <Field label="Variant" htmlFor="availability-variantId"><NativeSelect className="w-full" id="availability-variantId" name="variantId"><NativeSelectOption value="">All</NativeSelectOption>{(item?.variants ?? []).map((option) => (<NativeSelectOption key={option.id} value={option.id}>{option.name}</NativeSelectOption>))}</NativeSelect></Field>
          <Field label="Outlet" htmlFor="availability-locationId"><NativeSelect className="w-full" id="availability-locationId" name="locationId" required onChange={(event) => setLocationId(event.currentTarget.value)}>{locations.map((option) => (<NativeSelectOption key={option.id} value={option.id}>{option.name}</NativeSelectOption>))}</NativeSelect></Field>
          <Field label="Service channel" htmlFor="availability-serviceChannelId"><NativeSelect className="w-full" id="availability-serviceChannelId" name="serviceChannelId"><NativeSelectOption value="">All</NativeSelectOption>{(location?.serviceChannels ?? []).map((option) => (<NativeSelectOption key={option.id} value={option.id}>{option.name}</NativeSelectOption>))}</NativeSelect></Field>
          <Field label="State" htmlFor="availability-status"><NativeSelect className="w-full" id="availability-status" name="status" required>{[
              { id: "unavailable", name: "Unavailable" },
              { id: "available", name: "Available override" },
            ].map((option) => (<NativeSelectOption key={option.id} value={option.id}>{option.name}</NativeSelectOption>))}</NativeSelect></Field>
          <Field label="Starts at" htmlFor="availability-startsAt"><Input id="availability-startsAt" name="startsAt" required type="datetime-local" defaultValue={startsAtDefault} /></Field>
          <Field label="Ends at" htmlFor="endsAt"><Input id="endsAt" name="endsAt" type="datetime-local"  /></Field>
          <Field label="Reason" htmlFor="availability-reason"><Input id="availability-reason" name="reason" placeholder="Sold out or scheduled maintenance" maxLength={255} /></Field>
          <Button
            className="w-fit"
            disabled={pending || !catalog.items.length || !locations.length}
            type="submit"
            variant="outline"
          >
            <PlusIcon />
            {pending ? "Saving..." : "Add availability rule"}
          </Button>
        </form>
        <div className="grid content-start gap-3">
          {catalog.availability.length ? (
            catalog.availability.map((rule) => (
              <div className="grid gap-1 border-b pb-3 text-sm" key={rule.id}>
                <div className="flex flex-wrap items-center gap-2">
                  <span className="font-medium">{itemNames.get(rule.itemId) ?? "Menu item"}</span>
                  <Badge variant={rule.status === "unavailable" ? "destructive" : "outline"}>{rule.status}</Badge>
                </div>
                <div className="text-xs text-muted-foreground">
                  {outletNames.get(rule.locationId) ?? "Outlet"}
                  {rule.serviceChannelId ? " · selected channel" : " · all channels"} · {formatDateTime(rule.startsAt)}
                  {rule.endsAt ? ` to ${formatDateTime(rule.endsAt)}` : " onward"}
                </div>
                {rule.reason ? <div className="text-xs text-muted-foreground">{rule.reason}</div> : null}
              </div>
            ))
          ) : (
            <div className="grid min-h-32 place-items-center border-y text-center text-sm text-muted-foreground">
              No availability rules. Items are available by default.
            </div>
          )}
        </div>
      </div>
    </section>
  );
}

function formatDateTime(value: string): string {
  return new Date(value).toLocaleString();
}
function value(data: FormData, key: string): string {
  return String(data.get(key) ?? "").trim();
}
