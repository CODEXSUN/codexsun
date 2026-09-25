import { Badge } from "@codexsun/ui/components/badge";
import { Button } from "@codexsun/ui/components/button";
import { Input } from "@codexsun/ui/components/input";
import { NativeSelect, NativeSelectOption } from "@codexsun/ui/components/native-select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@codexsun/ui/components/tabs";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { DoorOpenIcon, PlusIcon, UsersIcon } from "lucide-react";
import { useEffect, useState } from "react";
import { readBilling } from "./billing-api";
import { BookingQrPanel } from "./booking-qr-panel";
import { EventSalesPanel } from "./event-sales-panel";
import { readFoundationSetup } from "./foundation-setup-api";
import { readMenu } from "./menu-api";
import { changeBooking, readBooking, readPos, type BookingWorkspace } from "./pos-api";
import { ReservationPanel } from "./reservation-panel";

export function DiningPage({ request }: { request: typeof fetch }) {
  const client = useQueryClient();
  const setup = useQuery({ queryKey: ["qcafe", "foundation", "setup"], queryFn: () => readFoundationSetup(request) });
  const business = setup.data?.businesses[0];
  const [locationId, setLocationId] = useState("");
  useEffect(() => {
    if (!locationId && business?.locations[0]) setLocationId(business.locations[0].id);
  }, [business, locationId]);
  const key = ["qcafe", "booking", business?.id, locationId] as const;
  const booking = useQuery({
    enabled: Boolean(business && locationId),
    queryKey: key,
    queryFn: () => readBooking(request, business!.id, locationId),
  });
  const menu = useQuery({
    enabled: Boolean(business),
    queryKey: ["qcafe", "menu", business?.id],
    queryFn: () => readMenu(request, business!.id),
  });
  const pos = useQuery({
    enabled: Boolean(business && locationId),
    queryKey: ["qcafe", "pos", business?.id, locationId],
    queryFn: () => readPos(request, business!.id, locationId),
  });
  const billing = useQuery({
    enabled: Boolean(business && locationId),
    queryKey: ["qcafe", "billing", business?.id, locationId],
    queryFn: () => readBilling(request, business!.id, locationId),
  });
  const change = useMutation({
    mutationFn: (work: { input: Record<string, unknown>; path: string }) =>
      changeBooking(request, work.path, work.input),
    onSuccess: (data: BookingWorkspace) => client.setQueryData(key, data),
  });
  if (!business) return <p className="text-sm text-muted-foreground">Create the business and outlet first.</p>;
  const location = business.locations.find((item) => item.id === locationId) ?? business.locations[0];
  const send = (path: string, input: Record<string, unknown>) => change.mutate({ input, path });

  return (
    <div className="grid gap-5">
      <div className="flex items-center justify-between border-b pb-4">
        <NativeSelect
          aria-label="Outlet"
          value={locationId}
          onChange={(event) => setLocationId(event.currentTarget.value)}
        >
          {business.locations.map((item) => (
            <NativeSelectOption key={item.id} value={item.id}>
              {item.name}
            </NativeSelectOption>
          ))}
        </NativeSelect>
        <Badge>{booking.data?.sessions.filter((item) => item.status === "open").length ?? 0} seated</Badge>
      </div>
      <Tabs defaultValue="floor">
        <TabsList className="w-full justify-start overflow-x-auto">
          <TabsTrigger value="floor">Floor</TabsTrigger>
          <TabsTrigger value="reservations">Reservations</TabsTrigger>
          <TabsTrigger value="qr">QR and scanners</TabsTrigger>
          <TabsTrigger value="functions">Functions</TabsTrigger>
        </TabsList>
        <TabsContent value="floor">
          <FloorPanel data={booking.data} scope={{ businessId: business.id, locationId }} send={send} />
        </TabsContent>
        <TabsContent value="reservations">
          <ReservationPanel
            booking={booking.data}
            businessId={business.id}
            channels={location?.serviceChannels ?? []}
            locationId={locationId}
            menu={menu.data}
            request={request}
          />
        </TabsContent>
        <TabsContent value="qr">
          <BookingQrPanel booking={booking.data} businessId={business.id} locationId={locationId} request={request} />
        </TabsContent>
        <TabsContent value="functions">
          <EventSalesPanel
            billing={billing.data}
            businessId={business.id}
            currency={business.currency}
            locationId={locationId}
            pos={pos.data}
            request={request}
          />
        </TabsContent>
      </Tabs>
      {change.error ? <p className="text-sm text-destructive">{change.error.message}</p> : null}
    </div>
  );
}

function FloorPanel({
  data,
  scope,
  send,
}: {
  data?: BookingWorkspace;
  scope: Record<string, string>;
  send: (path: string, input: Record<string, unknown>) => void;
}) {
  const [selected, setSelected] = useState<string[]>([]);
  const occupied = new Set(
    data?.sessionTables
      .filter((link) => data.sessions.some((session) => session.id === link.session_id && session.status === "open"))
      .map((link) => link.table_id),
  );
  return (
    <div className="grid gap-7 pt-5 xl:grid-cols-[1fr_300px]">
      <section className="grid content-start gap-4">
        <h2 className="font-semibold">Floor service</h2>
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {data?.tables.map((table) => {
            const busy = occupied.has(table.id);
            return (
              <Button
                className={`h-auto min-h-24 grid gap-2 border p-4 text-left font-normal ${selected.includes(table.id) ? "border-primary" : ""}`}
                disabled={busy}
                key={table.id}
                onClick={() => setSelected(toggle(selected, table.id))}
                variant="ghost"
              >
                <strong>{table.code}</strong>
                <span className="text-sm text-muted-foreground">{table.capacity} seats</span>
                <Badge className="w-fit" variant={busy ? "secondary" : "outline"}>
                  {busy ? "Occupied" : "Free"}
                </Badge>
              </Button>
            );
          })}
        </div>
        <form
          className="flex max-w-xs gap-2"
          onSubmit={(event) => {
            event.preventDefault();
            send("sessions", {
              ...scope,
              guestCount: Number(new FormData(event.currentTarget).get("guests")),
              tableIds: selected,
            });
            setSelected([]);
          }}
        >
          <Input min="1" name="guests" placeholder="Guests" required type="number" />
          <Button disabled={!selected.length} type="submit">
            <UsersIcon /> Seat
          </Button>
        </form>
        {data?.sessions
          .filter((item) => item.status === "open")
          .map((session) => (
            <div className="flex items-center justify-between border-t pt-3" key={session.id}>
              <span className="text-sm">
                {session.guest_count} guests · {session.primary_order_id ? "Order linked" : "Awaiting order"}
              </span>
              <Button onClick={() => send(`sessions/${session.id}/close`, {})} size="sm" variant="outline">
                <DoorOpenIcon /> Release
              </Button>
            </div>
          ))}
      </section>
      <aside className="grid content-start gap-5 border-l pl-5">
        <QuickForm
          label="Add area"
          onSubmit={(form) =>
            send("areas", { ...scope, kind: "dining", name: form.get("name"), sortOrder: data?.areas.length ?? 0 })
          }
        >
          <Input name="name" placeholder="Main dining" required />
        </QuickForm>
        <QuickForm
          label="Add table"
          onSubmit={(form) =>
            send("tables", {
              ...scope,
              areaId: form.get("area"),
              capacity: Number(form.get("capacity")),
              code: form.get("code"),
            })
          }
        >
          <NativeSelect aria-label="Dining area" name="area">
            {(data?.areas ?? []).map((item) => (
              <NativeSelectOption key={item.id} value={item.id}>
                {item.name}
              </NativeSelectOption>
            ))}
          </NativeSelect>
          <Input name="code" placeholder="T01" required />
          <Input min="1" name="capacity" placeholder="Capacity" required type="number" />
        </QuickForm>
      </aside>
    </div>
  );
}

function QuickForm({
  children,
  label,
  onSubmit,
}: {
  children: React.ReactNode;
  label: string;
  onSubmit: (data: FormData) => void;
}) {
  return (
    <form
      className="grid gap-3"
      onSubmit={(event) => {
        event.preventDefault();
        onSubmit(new FormData(event.currentTarget));
        event.currentTarget.reset();
      }}
    >
      <h2 className="font-semibold">{label}</h2>
      {children}
      <Button type="submit" variant="outline">
        <PlusIcon />
        {label}
      </Button>
    </form>
  );
}

function toggle(values: string[], value: string) {
  return values.includes(value) ? values.filter((item) => item !== value) : [...values, value];
}
