import { Badge } from "@codexsun/ui/components/badge";
import { Button } from "@codexsun/ui/components/button";
import { Input } from "@codexsun/ui/components/input";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { BanknoteIcon, CalendarPlusIcon, CheckIcon, ClipboardPlusIcon, PlusIcon } from "lucide-react";
import { useEffect, useState } from "react";
import { changeEventSales, readEventSales, type EventSalesWorkspace } from "./booking-api";
import type { BillingWorkspace } from "./billing-api";
import type { PosWorkspace } from "./pos-api";

type Props = {
  billing?: BillingWorkspace;
  businessId: string;
  currency: string;
  locationId: string;
  pos?: PosWorkspace;
  request: typeof fetch;
};

export function EventSalesPanel({ billing, businessId, currency, locationId, pos, request }: Props) {
  const client = useQueryClient();
  const [leadId, setLeadId] = useState("");
  const [bookingId, setBookingId] = useState("");
  const key = ["qcafe", "event-sales", businessId, locationId] as const;
  const query = useQuery({ queryKey: key, queryFn: () => readEventSales(request, businessId, locationId) });
  const change = useMutation({
    mutationFn: ({ input, path }: { input: Record<string, unknown>; path: string }) =>
      changeEventSales(request, path, input),
    onSuccess: () => client.invalidateQueries({ queryKey: key }),
  });
  const data = query.data;
  useEffect(() => {
    if (!leadId && data?.leads[0]) setLeadId(data.leads[0].id);
    if (!bookingId && data?.bookings[0]) setBookingId(data.bookings[0].id);
  }, [bookingId, data, leadId]);
  const lead = data?.leads.find((item) => item.id === leadId);
  const booking = data?.bookings.find((item) => item.id === bookingId);
  const send = (path: string, input: Record<string, unknown>) => change.mutate({ input, path });

  return (
    <div className="grid gap-7 2xl:grid-cols-[280px_minmax(0,1fr)_340px]">
      <aside className="grid content-start gap-5 border-r pr-5">
        <form
          className="grid gap-3"
          onSubmit={(event) => {
            event.preventDefault();
            const form = new FormData(event.currentTarget);
            send("leads", {
              businessId,
              eventDate: form.get("eventDate"),
              guestCount: Number(form.get("guestCount")),
              occasionType: form.get("occasionType"),
              ownerRef: form.get("ownerRef"),
              source: form.get("source"),
            });
            event.currentTarget.reset();
          }}
        >
          <h2 className="font-semibold">New enquiry</h2>
          <Input name="occasionType" placeholder="Wedding, festival, meeting" required />
          <Input name="eventDate" required type="date" />
          <Input min="1" name="guestCount" placeholder="Guests" required type="number" />
          <Input defaultValue="Front desk" name="ownerRef" placeholder="Owner" required />
          <Input defaultValue="phone" name="source" placeholder="Source" required />
          <Button type="submit">
            <PlusIcon /> Add lead
          </Button>
        </form>
        <div className="grid gap-2 border-t pt-4">
          <h3 className="text-sm font-semibold">Lead pipeline</h3>
          {data?.leads.map((item) => (
            <button
              className={`grid gap-1 border p-3 text-left ${item.id === leadId ? "border-primary" : ""}`}
              key={item.id}
              onClick={() => setLeadId(item.id)}
            >
              <strong className="text-sm">{item.occasion_type}</strong>
              <span className="text-xs text-muted-foreground">
                {item.event_date} · {item.guest_count} guests
              </span>
              <Badge className="w-fit" variant="secondary">
                {item.status}
              </Badge>
            </button>
          ))}
        </div>
      </aside>

      <section className="grid content-start gap-5">
        <div className="flex flex-wrap items-center justify-between gap-2 border-b pb-3">
          <div>
            <h2 className="font-semibold">Function control</h2>
            <p className="text-sm text-muted-foreground">{lead?.occasion_type ?? "Select a lead"}</p>
          </div>
          {booking ? <Badge>{booking.status.replace("_", " ")}</Badge> : null}
        </div>
        {lead ? (
          <div className="grid gap-4 lg:grid-cols-2">
            <CommandForm
              button="Schedule follow-up"
              icon={<CalendarPlusIcon />}
              onSubmit={(form) =>
                send(`leads/${lead.id}/followups`, {
                  note: form.get("note"),
                  ownerRef: form.get("ownerRef"),
                  scheduledAt: localIso(form, "scheduledAt"),
                })
              }
              title="Follow-up"
            >
              <Input name="note" placeholder="Confirm menu and venue" required />
              <Input defaultValue={lead.owner_ref} name="ownerRef" required />
              <Input name="scheduledAt" required type="datetime-local" />
            </CommandForm>
            {!data?.bookings.some((item) => item.lead_id === lead.id) ? (
              <CommandForm
                button="Confirm function"
                icon={<CheckIcon />}
                onSubmit={(form) =>
                  send(`leads/${lead.id}/booking`, {
                    endsAt: localIso(form, "endsAt"),
                    locationId,
                    startsAt: localIso(form, "startsAt"),
                  })
                }
                title="Convert to booking"
              >
                <Input name="startsAt" required type="datetime-local" />
                <Input name="endsAt" required type="datetime-local" />
              </CommandForm>
            ) : null}
          </div>
        ) : null}

        <div className="grid gap-2 border-t pt-4">
          <h3 className="text-sm font-semibold">Confirmed functions</h3>
          <div className="flex flex-wrap gap-2">
            {data?.bookings.map((item) => (
              <Button
                key={item.id}
                onClick={() => setBookingId(item.id)}
                size="sm"
                variant={item.id === bookingId ? "default" : "outline"}
              >
                {data.leads.find((candidate) => candidate.id === item.lead_id)?.occasion_type ?? "Function"}
              </Button>
            ))}
          </div>
        </div>

        {booking ? <EventRunbook booking={booking} data={data!} send={send} /> : null}
      </section>

      <aside className="grid content-start gap-5 border-l pl-5">
        {booking ? (
          <>
            <CommandForm
              button="Add requirement"
              icon={<ClipboardPlusIcon />}
              onSubmit={(form) =>
                send(`bookings/${booking.id}/requirements`, {
                  category: form.get("category"),
                  details: form.get("details"),
                  responsibleRef: form.get("responsibleRef"),
                })
              }
              title="Requirement"
            >
              <Select
                name="category"
                options={[
                  ["dietary", "Dietary"],
                  ["decoration", "Decoration"],
                  ["equipment", "Equipment"],
                  ["seating", "Seating"],
                  ["venue", "Venue"],
                ]}
              />
              <Input name="details" placeholder="Requirement details" required />
              <Input defaultValue="Operations" name="responsibleRef" required />
            </CommandForm>
            <CommandForm
              button="Create quote"
              icon={<PlusIcon />}
              onSubmit={(form) =>
                send(`bookings/${booking.id}/quotes`, {
                  currency,
                  lines: [
                    {
                      description: form.get("description"),
                      quantity: Number(form.get("quantity")),
                      unitAmountMinor: money(form, "unitAmount"),
                    },
                  ],
                  validUntil: form.get("validUntil"),
                })
              }
              title="Quote"
            >
              <Input name="description" placeholder="Function package" required />
              <div className="grid grid-cols-2 gap-2">
                <Input defaultValue="1" min="0.001" name="quantity" step="0.001" type="number" />
                <Input min="0" name="unitAmount" placeholder="Unit amount" step="0.01" type="number" />
              </div>
              <Input name="validUntil" required type="date" />
            </CommandForm>
            <CommandForm
              button="Receive advance"
              icon={<BanknoteIcon />}
              onSubmit={(form) =>
                send(`bookings/${booking.id}/advances`, {
                  amountMinor: money(form, "amount"),
                  paymentMethodId: form.get("paymentMethodId"),
                  providerReference: form.get("providerReference") || undefined,
                })
              }
              title="Advance voucher"
            >
              <Input min="0.01" name="amount" placeholder="Amount" required step="0.01" type="number" />
              <Select
                name="paymentMethodId"
                options={(billing?.paymentMethods ?? [])
                  .filter((item) => item.kind !== "cash" && item.active)
                  .map((item) => [item.id, item.name])}
              />
              <Input name="providerReference" placeholder="Payment reference" />
            </CommandForm>
            <CommandForm
              button="Link order"
              icon={<PlusIcon />}
              onSubmit={(form) =>
                send(`bookings/${booking.id}/orders`, { orderId: form.get("orderId"), role: form.get("role") })
              }
              title="POS order"
            >
              <Select
                name="orderId"
                options={(pos?.orders ?? []).map((item) => [item.id, `${item.number} · ${item.status}`])}
              />
              <Select
                name="role"
                options={[
                  ["service", "Service"],
                  ["preparation", "Preparation"],
                  ["delivery", "Delivery"],
                  ["final", "Final"],
                ]}
              />
            </CommandForm>
          </>
        ) : (
          <p className="text-sm text-muted-foreground">Select a confirmed function to plan it.</p>
        )}
        {change.error ? <p className="text-sm text-destructive">{change.error.message}</p> : null}
      </aside>
    </div>
  );
}

function EventRunbook({
  booking,
  data,
  send,
}: {
  booking: EventSalesWorkspace["bookings"][number];
  data: EventSalesWorkspace;
  send: (path: string, input: Record<string, unknown>) => void;
}) {
  const tasks = data.tasks.filter((item) => item.event_booking_id === booking.id);
  const schedule = data.schedules.filter((item) => item.event_booking_id === booking.id);
  const quotes = data.quotes.filter((item) => item.event_booking_id === booking.id);
  return (
    <div className="grid gap-5 border-t pt-5">
      <div className="flex flex-wrap gap-2">
        {booking.status === "confirmed" ? (
          <Button size="sm" onClick={() => send(`bookings/${booking.id}/actions`, { action: "plan" })}>
            Start planning
          </Button>
        ) : null}
        {booking.status === "planning" ? (
          <Button size="sm" onClick={() => send(`bookings/${booking.id}/actions`, { action: "start" })}>
            Start service
          </Button>
        ) : null}
        {booking.status === "in_service" ? (
          <Button size="sm" onClick={() => send(`bookings/${booking.id}/actions`, { action: "complete" })}>
            Complete and collect
          </Button>
        ) : null}
      </div>
      <div className="grid gap-4 lg:grid-cols-2">
        <CommandForm
          button="Add task"
          icon={<PlusIcon />}
          onSubmit={(form) =>
            send(`bookings/${booking.id}/tasks`, {
              dueAt: localIso(form, "dueAt"),
              ownerRef: form.get("ownerRef"),
              task: form.get("task"),
            })
          }
          title="Preparation tasks"
        >
          <Input name="task" placeholder="Prepare banquet layout" required />
          <Input defaultValue="Operations" name="ownerRef" required />
          <Input name="dueAt" required type="datetime-local" />
        </CommandForm>
        <CommandForm
          button="Add schedule"
          icon={<CalendarPlusIcon />}
          onSubmit={(form) =>
            send(`bookings/${booking.id}/schedule`, {
              activity: form.get("activity"),
              endsAt: localIso(form, "endsAt"),
              ownerRef: form.get("ownerRef"),
              startsAt: localIso(form, "startsAt"),
            })
          }
          title="Service schedule"
        >
          <Input name="activity" placeholder="Guest arrival" required />
          <Input defaultValue="Floor team" name="ownerRef" required />
          <div className="grid grid-cols-2 gap-2">
            <Input name="startsAt" required type="datetime-local" />
            <Input name="endsAt" required type="datetime-local" />
          </div>
        </CommandForm>
      </div>
      <RecordList
        title="Tasks"
        items={tasks.map((item) => ({ id: item.id, label: item.task, status: item.status }))}
        onComplete={(id) => send(`tasks/${id}/complete`, {})}
      />
      <RecordList
        title="Schedule"
        items={schedule.map((item) => ({ id: item.id, label: item.activity, status: item.status }))}
        onComplete={(id) => send(`schedule/${id}/actions`, { action: "complete" })}
      />
      <div className="grid gap-2">
        <h3 className="text-sm font-semibold">Quotes and advances</h3>
        {quotes.map((quote) => (
          <div className="flex items-center justify-between border-b py-2 text-sm" key={quote.id}>
            <span>
              {quote.number} · {(quote.total_minor / 100).toFixed(2)} {quote.currency}
            </span>
            <span className="flex gap-2">
              <Badge variant="secondary">{quote.status}</Badge>
              {quote.status === "draft" ? (
                <Button
                  size="xs"
                  variant="outline"
                  onClick={() => send(`quotes/${quote.id}/actions`, { action: "send" })}
                >
                  Send
                </Button>
              ) : null}
              {["draft", "sent"].includes(quote.status) ? (
                <Button size="xs" onClick={() => send(`quotes/${quote.id}/actions`, { action: "accept" })}>
                  Accept
                </Button>
              ) : null}
            </span>
          </div>
        ))}
      </div>
      <p className="text-xs text-muted-foreground">
        {data.advances.filter((item) => item.event_ref === booking.id).length} advance voucher(s) ·{" "}
        {data.orders.filter((item) => item.event_booking_id === booking.id).length} linked order(s)
      </p>
    </div>
  );
}

function CommandForm({
  button,
  children,
  icon,
  onSubmit,
  title,
}: {
  button: string;
  children: React.ReactNode;
  icon: React.ReactNode;
  onSubmit: (form: FormData) => void;
  title: string;
}) {
  return (
    <form
      className="grid content-start gap-2 border p-3"
      onSubmit={(event) => {
        event.preventDefault();
        onSubmit(new FormData(event.currentTarget));
      }}
    >
      <h3 className="text-sm font-semibold">{title}</h3>
      {children}
      <Button size="sm" type="submit" variant="outline">
        {icon}
        {button}
      </Button>
    </form>
  );
}

function RecordList({
  items,
  onComplete,
  title,
}: {
  items: Array<{ id: string; label: string; status: string }>;
  onComplete: (id: string) => void;
  title: string;
}) {
  return (
    <div className="grid gap-2">
      <h3 className="text-sm font-semibold">{title}</h3>
      {items.map((item) => (
        <div className="flex items-center justify-between border-b py-2 text-sm" key={item.id}>
          <span>{item.label}</span>
          <span className="flex items-center gap-2">
            <Badge variant="secondary">{item.status}</Badge>
            {item.status !== "done" ? (
              <Button size="xs" variant="outline" onClick={() => onComplete(item.id)}>
                Done
              </Button>
            ) : null}
          </span>
        </div>
      ))}
    </div>
  );
}

function Select({ name, options }: { name: string; options: string[][] }) {
  return (
    <select className="h-9 rounded-md border bg-background px-3 text-sm" name={name} required>
      {options.map(([value, label]) => (
        <option key={value} value={value}>
          {label}
        </option>
      ))}
    </select>
  );
}

function localIso(form: FormData, name: string) {
  return new Date(String(form.get(name))).toISOString();
}
function money(form: FormData, name: string) {
  return Math.round(Number(form.get(name)) * 100);
}
