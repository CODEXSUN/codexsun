import { useState } from "react";
import { ClipboardList, Table2 } from "lucide-react";
import { Button } from "@codexsun/ui/components/button";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription
} from "@codexsun/ui/components/sheet";
import type { CafeOrder, KitchenTicket } from "./order.types";

export function kitchenProgress(order: CafeOrder) {
  const sent = new Map<string, number>();
  for (const ticket of order.tickets.filter((ticket) => ticket.kind === "send"))
    for (const line of ticket.lines)
      sent.set(line.menuUuid, (sent.get(line.menuUuid) ?? 0) + line.quantity);
  const pending = order.lines.reduce(
    (sum, line) => sum + Math.max(0, line.quantity - (sent.get(line.menuUuid) ?? 0)),
    0
  );
  return { pending: Math.round(pending * 1000) / 1000, sent: sent.size > 0 };
}

export function OrderKitchenFlow({
  order,
  orders,
  locked,
  canKitchen,
  error,
  onRefresh,
  onAssign,
  onSelect,
  onSend,
  onBill,
  onReprint
}: {
  order: CafeOrder;
  orders: CafeOrder[];
  locked: boolean;
  canKitchen: boolean;
  error: string;
  onRefresh: () => Promise<void>;
  onAssign: () => void;
  onSelect: (uuid: string) => void;
  onSend: (order: CafeOrder) => Promise<unknown>;
  onBill: (order: CafeOrder) => Promise<unknown>;
  onReprint: (order: CafeOrder, ticket: KitchenTicket) => void;
}) {
  const [open, setOpen] = useState(false);
  const progress = kitchenProgress(order);
  return (
    <section className="qcafe-kitchen-flow" aria-label="KOT table and current orders">
      <button className="qcafe-kitchen-assignment" disabled={locked} onClick={onAssign}>
        <Table2 size={18} />
        <span>
          <small>Back to tables</small>
          <strong>{order.tableName || "Select table"}</strong>
        </span>
        <span>
          <small>Row / Seat no.</small>
          <strong>{order.seats.join(", ") || "Select seats"}</strong>
        </span>
      </button>
      <div className="qcafe-kitchen-token">
        <small>Kitchen token</small>
        <strong>{order.tickets.at(-1)?.number || "Assigned on send"}</strong>
      </div>
      <div className="qcafe-kitchen-state" role="status">
        <strong>{order.name}</strong>
        <span>
          {progress.pending
            ? `${progress.pending} to send`
            : progress.sent
              ? "Sent to kitchen"
              : "Add items to begin"}
        </span>
      </div>
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
        <SheetContent className="qcafe-kitchen-drawer sm:max-w-xl" side="right">
          <SheetHeader>
            <SheetTitle>Current orders</SheetTitle>
            <SheetDescription>
              Choose an order, send pending items to the kitchen, then bill when ready.
            </SheetDescription>
          </SheetHeader>
          {error && (
            <p role="alert" className="text-destructive">
              {error}
            </p>
          )}
          <div className="qcafe-kitchen-order-list">
            {orders.map((current) => {
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
                    <strong>{current.name}</strong>
                    <span>
                      {current.tableName || "Parcel / unassigned"}
                      {current.seats.length ? ` · Row / Seat ${current.seats.join(", ")}` : ""}
                    </span>
                    <small>
                      {state.pending
                        ? `${state.pending} items to send`
                        : state.sent
                          ? "Sent to kitchen"
                          : "Empty order"}
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
                      disabled={locked || !canKitchen || !state.pending || !current.tableUuid}
                      onClick={() => {
                        onSelect(current.uuid);
                        void onSend(current).then((result) => {
                          if (result) setOpen(false);
                        });
                      }}
                    >
                      Send KOT
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
                        Reprint KOT
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
                      Bill & pay
                    </Button>
                  </div>
                </article>
              );
            })}
            {!orders.length && <p>No current orders.</p>}
          </div>
        </SheetContent>
      </Sheet>
    </section>
  );
}
