import { useState } from "react";
import { ClipboardList, ShoppingBag } from "lucide-react";
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

export function OrderParcelFlow({
  order,
  orders,
  locked,
  canSend,
  error,
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
  onRefresh: () => Promise<void>;
  onSelect: (uuid: string) => void;
  onSend: (order: CafeOrder) => Promise<unknown>;
  onBill: (order: CafeOrder) => Promise<unknown>;
  onReprint: (order: CafeOrder, ticket: KitchenTicket) => void;
}) {
  const [open, setOpen] = useState(false);
  const state = kitchenProgress(order);
  return (
    <section
      className="qcafe-kitchen-flow qcafe-parcel-flow"
      aria-label="Parcel token and current orders"
    >
      <ShoppingBag size={22} />
      <div className="qcafe-kitchen-token">
        <small>Parcel token</small>
        <strong>{order.parcelToken}</strong>
      </div>
      <div className="qcafe-kitchen-state" role="status">
        <strong>{order.name}</strong>
        <span>
          {state.pending
            ? `${state.pending} to send`
            : state.sent
              ? "Parcel ticket sent"
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
        <SheetContent className="qcafe-kitchen-drawer qcafe-parcel-drawer sm:max-w-xl" side="right">
          <SheetHeader>
            <SheetTitle>Current parcel orders</SheetTitle>
            <SheetDescription>
              Send a parcel ticket, then bill and collect payment when ready.
            </SheetDescription>
          </SheetHeader>
          {error && (
            <p role="alert" className="text-destructive">
              {error}
            </p>
          )}
          <div className="qcafe-kitchen-order-list">
            {orders.map((current) => {
              const progress = kitchenProgress(current);
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
                      {current.parcelToken} · {current.name}
                    </strong>
                    <small>
                      {progress.pending
                        ? `${progress.pending} items to send`
                        : progress.sent
                          ? "Parcel ticket sent"
                          : "Empty parcel order"}
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
                      disabled={locked || !canSend || !progress.pending}
                      onClick={() => {
                        onSelect(current.uuid);
                        void onSend(current).then((result) => {
                          if (result) setOpen(false);
                        });
                      }}
                    >
                      Send parcel
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
                        Reprint parcel ticket
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
            {!orders.length && <p>No current parcel orders.</p>}
          </div>
        </SheetContent>
      </Sheet>
    </section>
  );
}
