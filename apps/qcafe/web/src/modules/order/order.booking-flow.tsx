import { useState } from "react";
import { CalendarDays, ClipboardList } from "lucide-react";
import { Button } from "@codexsun/ui/components/button";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription
} from "@codexsun/ui/components/sheet";
import { kitchenProgress } from "./order.kitchen";
import type { CafeOrder, KitchenTicket } from "./order.types";

export function OrderBookingFlow({
  order,
  orders,
  locked,
  canSend,
  error,
  onEdit,
  onRefresh,
  onSelect,
  onSend,
  onBill,
  onReprint
}: {
  order: CafeOrder;
  orders: CafeOrder[];
  locked: boolean;
  canSend: boolean;
  error: string;
  onEdit: () => void;
  onRefresh: () => Promise<void>;
  onSelect: (uuid: string) => void;
  onSend: (order: CafeOrder) => Promise<unknown>;
  onBill: (order: CafeOrder) => Promise<unknown>;
  onReprint: (order: CafeOrder, ticket: KitchenTicket) => void;
}) {
  const [open, setOpen] = useState(false);
  return (
    <section
      className="qcafe-kitchen-flow qcafe-booking-flow"
      aria-label="Booking details and current orders"
    >
      <CalendarDays size={22} />
      <div className="qcafe-kitchen-token">
        <small>Booking token</small>
        <strong>{order.bookingToken}</strong>
      </div>
      <div className="qcafe-booking-customer">
        <strong>{order.booking?.customerName}</strong>
        <span>{order.booking?.mobile}</span>
        <small>Pickup {pickupLabel(order)}</small>
      </div>
      <Button
        variant="outline"
        disabled={locked || !!order.tickets.length}
        title={
          order.tickets.length
            ? "Details are fixed after the preparation ticket."
            : "Edit customer and pickup details"
        }
        onClick={onEdit}
      >
        Edit booking
      </Button>
      <Button
        variant="outline"
        onClick={() => {
          setOpen(true);
          void onRefresh();
        }}
      >
        <ClipboardList size={16} /> Current orders <b>{orders.length}</b>
      </Button>
      <Sheet open={open} onOpenChange={setOpen}>
        <SheetContent
          className="qcafe-kitchen-drawer qcafe-booking-drawer sm:max-w-xl"
          side="right"
        >
          <SheetHeader>
            <SheetTitle>Current bookings</SheetTitle>
            <SheetDescription>
              Bookings are listed by pickup time. Send preparation tickets, then bill when ready.
            </SheetDescription>
          </SheetHeader>
          {error && (
            <p role="alert" className="text-destructive">
              {error}
            </p>
          )}
          <div className="qcafe-kitchen-order-list">
            {[...orders]
              .sort((a, b) => (a.booking?.pickupAt ?? "").localeCompare(b.booking?.pickupAt ?? ""))
              .map((current) => {
                const state = kitchenProgress(current);
                const ticket = current.tickets.at(-1);
                return (
                  <article
                    key={current.uuid}
                    className={current.uuid === order.uuid ? "is-current" : ""}
                  >
                    <button
                      className="qcafe-kitchen-order-select"
                      disabled={locked}
                      onClick={() => {
                        onSelect(current.uuid);
                        setOpen(false);
                      }}
                    >
                      <strong>
                        {current.bookingToken} · {current.booking?.customerName}
                      </strong>
                      <span>
                        {current.booking?.mobile} · Pickup {pickupLabel(current)}
                      </span>
                      <small>
                        {state.pending
                          ? `${state.pending} items to send`
                          : state.sent
                            ? "Preparation ticket sent"
                            : "Add items"}
                      </small>
                    </button>
                    <div className="qcafe-kitchen-order-lines">
                      {current.lines.map((line) => (
                        <p key={line.menuUuid}>
                          <span>{line.name}</span>
                          <b>× {line.quantity}</b>
                        </p>
                      ))}
                    </div>
                    <div className="qcafe-kitchen-order-actions">
                      <Button
                        disabled={locked || !canSend || !state.pending}
                        onClick={() => {
                          onSelect(current.uuid);
                          void onSend(current).then((result) => {
                            if (result) setOpen(false);
                          });
                        }}
                      >
                        Send for preparation
                      </Button>
                      {ticket && (
                        <Button
                          variant="outline"
                          disabled={locked}
                          onClick={() => {
                            setOpen(false);
                            onReprint(current, ticket);
                          }}
                        >
                          Reprint booking ticket
                        </Button>
                      )}
                      <Button
                        variant="outline"
                        disabled={locked || !current.lines.length}
                        onClick={() => {
                          onSelect(current.uuid);
                          void onBill(current).then((result) => {
                            if (result) setOpen(false);
                          });
                        }}
                      >
                        Bill &amp; pay
                      </Button>
                    </div>
                  </article>
                );
              })}
          </div>
        </SheetContent>
      </Sheet>
    </section>
  );
}
function pickupLabel(order: CafeOrder) {
  return order.booking
    ? new Date(order.booking.pickupAt).toLocaleString("en-GB", {
        dateStyle: "medium",
        timeStyle: "short"
      })
    : "—";
}
