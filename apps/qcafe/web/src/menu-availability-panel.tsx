import { useMemo, useState, type FormEvent } from "react";
import { CalendarClockIcon, PlusIcon } from "lucide-react";
import { Badge } from "@codexsun/ui/components/badge";
import { Button } from "@codexsun/ui/components/button";
import { Input } from "@codexsun/ui/components/input";
import { Label } from "@codexsun/ui/components/label";
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
          <Select label="Item" name="itemId" options={catalog.items} onChange={setItemId} />
          <Select label="Variant" name="variantId" optional options={item?.variants ?? []} />
          <Select label="Outlet" name="locationId" options={locations} onChange={setLocationId} />
          <Select label="Service channel" name="serviceChannelId" optional options={location?.serviceChannels ?? []} />
          <Select
            label="State"
            name="status"
            options={[
              { id: "unavailable", name: "Unavailable" },
              { id: "available", name: "Available override" },
            ]}
          />
          <Field defaultValue={startsAtDefault} label="Starts at" name="startsAt" required type="datetime-local" />
          <Field label="Ends at" name="endsAt" type="datetime-local" />
          <Field label="Reason" maxLength={255} name="reason" placeholder="Sold out or scheduled maintenance" />
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

function Field({ label, name, ...props }: React.ComponentProps<typeof Input> & { label: string; name: string }) {
  return (
    <div className="grid gap-2">
      <Label htmlFor={`availability-${name}`}>{label}</Label>
      <Input id={`availability-${name}`} name={name} {...props} />
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
      <Label htmlFor={`availability-${name}`}>{label}</Label>
      <NativeSelect
        className="w-full"
        id={`availability-${name}`}
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
