import { Badge } from "@codexsun/ui/components/badge";
import { Button } from "@codexsun/ui/components/button";
import { Input } from "@codexsun/ui/components/input";
import { NativeSelect, NativeSelectOption } from "@codexsun/ui/components/native-select";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { CalendarPlusIcon, CheckIcon, LogInIcon, UserPlusIcon, XIcon } from "lucide-react";
import { changeGuestBooking, readGuestBookings } from "./booking-api";
import type { FoundationServiceChannel } from "./foundation-setup-api";
import type { MenuCatalog } from "./menu-api";
import type { BookingWorkspace } from "./pos-api";

type Props = {
  booking?: BookingWorkspace;
  businessId: string;
  channels: FoundationServiceChannel[];
  locationId: string;
  menu?: MenuCatalog;
  request: typeof fetch;
};

export function ReservationPanel({ booking, businessId, channels, locationId, menu, request }: Props) {
  const client = useQueryClient();
  const key = ["qcafe", "guest-booking", businessId, locationId] as const;
  const query = useQuery({ queryKey: key, queryFn: () => readGuestBookings(request, businessId, locationId) });
  const change = useMutation({
    mutationFn: ({ input, path }: { input: Record<string, unknown>; path: string }) =>
      changeGuestBooking(request, path, input),
    onSuccess: async () => {
      await Promise.all([
        client.invalidateQueries({ queryKey: key }),
        client.invalidateQueries({ queryKey: ["qcafe", "booking"] }),
        client.invalidateQueries({ queryKey: ["qcafe", "pos"] }),
      ]);
    },
  });
  const data = query.data;
  const send = (path: string, input: Record<string, unknown>) => change.mutate({ input, path });
  const dineIn = channels.find((channel) => channel.kind === "dine_in" && channel.enabled);
  const priceBook = menu?.priceBooks.find((item) => item.active);

  return (
    <div className="grid gap-7 xl:grid-cols-[minmax(0,1fr)_320px]">
      <section className="grid content-start gap-4">
        <div className="flex items-center justify-between border-b pb-3">
          <h2 className="font-semibold">Reservation book</h2>
          <Badge variant="outline">{data?.reservations.length ?? 0} bookings</Badge>
        </div>
        {data?.reservations.length ? (
          data.reservations.map((reservation) => {
            const customer = data.customers.find((item) => item.id === reservation.customer_id);
            const tableCodes = data.reservationTables
              .filter((item) => item.reservation_id === reservation.id)
              .map((item) => booking?.tables.find((table) => table.id === item.table_id)?.code)
              .filter(Boolean)
              .join(", ");
            return (
              <article className="grid gap-3 border-b pb-4" key={reservation.id}>
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div>
                    <strong>{customer?.name ?? "Guest"}</strong>
                    <p className="text-sm text-muted-foreground">
                      {formatDate(reservation.arrival_at)} · {reservation.party_size} guests · {tableCodes}
                    </p>
                  </div>
                  <Badge variant={reservation.status === "confirmed" ? "default" : "secondary"}>
                    {reservation.status.replace("_", " ")}
                  </Badge>
                </div>
                <div className="flex flex-wrap gap-2">
                  {reservation.status === "requested" ? (
                    <Button
                      size="sm"
                      onClick={() => send(`reservations/${reservation.id}/actions`, { action: "confirm" })}
                    >
                      <CheckIcon /> Confirm
                    </Button>
                  ) : null}
                  {reservation.status === "confirmed" ? (
                    <Button
                      disabled={!dineIn || !priceBook}
                      size="sm"
                      onClick={() =>
                        send(`reservations/${reservation.id}/seat`, {
                          priceBookId: priceBook?.id,
                          serviceChannelId: dineIn?.id,
                        })
                      }
                    >
                      <LogInIcon /> Seat and open order
                    </Button>
                  ) : null}
                  {reservation.status === "seated" ? (
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => send(`reservations/${reservation.id}/actions`, { action: "complete" })}
                    >
                      Complete visit
                    </Button>
                  ) : null}
                  {["requested", "confirmed"].includes(reservation.status) ? (
                    <>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() =>
                          send(`reservations/${reservation.id}/actions`, {
                            action: "no_show",
                            note: "Marked no-show by operator",
                          })
                        }
                      >
                        No-show
                      </Button>
                      <Button
                        size="icon-sm"
                        title="Cancel reservation"
                        variant="ghost"
                        onClick={() =>
                          send(`reservations/${reservation.id}/actions`, {
                            action: "cancel",
                            note: "Canceled by operator",
                          })
                        }
                      >
                        <XIcon />
                      </Button>
                    </>
                  ) : null}
                </div>
                {reservation.order_id ? (
                  <p className="text-xs text-muted-foreground">
                    Linked order ·{" "}
                    {data.reservationBills.find((bill) => bill.order_id === reservation.order_id)?.number ??
                      "not billed"}
                  </p>
                ) : null}
              </article>
            );
          })
        ) : (
          <p className="text-sm text-muted-foreground">No reservations for this outlet.</p>
        )}
      </section>

      <aside className="grid content-start gap-6 border-l pl-5">
        <form
          className="grid gap-3"
          onSubmit={(event) => {
            event.preventDefault();
            const form = new FormData(event.currentTarget);
            send("customers", {
              businessId,
              email: optional(form, "email"),
              emailConsent: Boolean(form.get("emailConsent")),
              marketingConsent: false,
              name: form.get("name"),
              phone: optional(form, "phone"),
              whatsappConsent: Boolean(form.get("whatsappConsent")),
            });
            event.currentTarget.reset();
          }}
        >
          <h2 className="font-semibold">New guest</h2>
          <Input name="name" placeholder="Guest name" required />
          <Input name="phone" placeholder="Phone" />
          <Input name="email" placeholder="Email" type="email" />
          <label className="flex items-center gap-2 text-sm">
            <input className="size-4 accent-primary" name="whatsappConsent" type="checkbox" /> WhatsApp consent
          </label>
          <label className="flex items-center gap-2 text-sm">
            <input className="size-4 accent-primary" name="emailConsent" type="checkbox" /> Email consent
          </label>
          <Button type="submit" variant="outline">
            <UserPlusIcon /> Add guest
          </Button>
        </form>

        <form
          className="grid gap-3 border-t pt-5"
          onSubmit={(event) => {
            event.preventDefault();
            const form = new FormData(event.currentTarget);
            send("reservations", {
              arrivalAt: new Date(String(form.get("arrivalAt"))).toISOString(),
              businessId,
              customerId: form.get("customerId"),
              durationMinutes: Number(form.get("durationMinutes")),
              locationId,
              partySize: Number(form.get("partySize")),
              source: form.get("source"),
              tableIds: form.getAll("tableIds"),
            });
          }}
        >
          <h2 className="font-semibold">New reservation</h2>
          <NativeSelect aria-label="customerId" name="customerId">{(data?.customers ?? []).map((item) => (<NativeSelectOption key={item.id} value={item.id}>{item.name}</NativeSelectOption>))}</NativeSelect>
          <Input name="arrivalAt" required type="datetime-local" />
          <div className="grid grid-cols-2 gap-2">
            <Input defaultValue="90" min="15" name="durationMinutes" required type="number" />
            <Input min="1" name="partySize" placeholder="Guests" required type="number" />
          </div>
          <NativeSelect aria-label="source" name="source">{[
              ["phone", "Phone"],
              ["walk_in", "Walk-in"],
              ["web", "Web"],
              ["qr", "QR"],
            ].map(([value, label]) => (<NativeSelectOption key={value} value={value}>{label}</NativeSelectOption>))}</NativeSelect>
          <div className="grid grid-cols-2 gap-2">
            {booking?.tables.map((table) => (
              <label className="flex items-center gap-2 border p-2 text-sm" key={table.id}>
                <input className="size-4 accent-primary" name="tableIds" type="checkbox" value={table.id} /> {table.code} ({table.capacity})
              </label>
            ))}
          </div>
          <Button disabled={!data?.customers.length || !booking?.tables.length} type="submit">
            <CalendarPlusIcon /> Reserve
          </Button>
        </form>
        {change.error ? <p className="text-sm text-destructive">{change.error.message}</p> : null}
      </aside>
    </div>
  );
}

function optional(form: FormData, name: string) {
  return String(form.get(name) ?? "").trim() || undefined;
}

function formatDate(value: string) {
  return new Intl.DateTimeFormat(undefined, { dateStyle: "medium", timeStyle: "short" }).format(new Date(value));
}
