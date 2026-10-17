import { Button } from "@codexsun/ui/components/button";
import { kitchenProgress } from "./order.kitchen";
import type { CafeOrder, KitchenTicket } from "./order.types";

export function OrderRunning({
  orders,
  locked,
  canSend,
  onSelect,
  onSend,
  onTicket
}: {
  orders: CafeOrder[];
  locked: boolean;
  canSend: boolean;
  onSelect: (order: CafeOrder) => void;
  onSend: (order: CafeOrder) => Promise<unknown>;
  onTicket: (order: CafeOrder, ticket: KitchenTicket) => void;
}) {
  return (
    <aside className="qcafe-running-orders" aria-label="Running kitchen orders">
      <div className="qcafe-running-heading">
        <h3>Running orders</h3>
        <b>{orders.length}</b>
      </div>
      <div className="qcafe-running-legend">
        <span>● To send</span>
        <span>● Sent to kitchen</span>
      </div>
      {!orders.length && (
        <p className="qcafe-running-empty">Select chairs and open a table to start an order.</p>
      )}
      {orders.map((order) => {
        const progress = kitchenProgress(order);
        const ticket = order.tickets.at(-1);
        return (
          <article
            key={order.uuid}
            className={progress.pending ? "is-pending" : progress.sent ? "is-sent" : ""}
          >
            <button
              className="qcafe-running-select"
              disabled={locked}
              onClick={() => onSelect(order)}
            >
              <strong>
                {order.tableName} · {order.name}
              </strong>
              <small>Chairs {order.seats.join(", ")}</small>
              <span>
                {progress.pending
                  ? `${progress.pending} to send`
                  : progress.sent
                    ? "Sent to kitchen"
                    : "Seated · add items"}
              </span>
            </button>
            <div className="qcafe-running-lines">
              {order.lines.map((line) => (
                <p key={line.menuUuid}>
                  <span>{line.name}</span>
                  <b>× {line.quantity}</b>
                </p>
              ))}
            </div>
            <div className="qcafe-running-total">
              <span>{ticket?.number || "Not sent yet"}</span>
              <strong>
                ₹{(order.lines.reduce((sum, line) => sum + line.amount, 0) / 100).toFixed(2)}
              </strong>
              <div className="qcafe-running-actions">
                <Button
                  disabled={locked || !canSend || !progress.pending}
                  onClick={() => void onSend(order)}
                >
                  Send to kitchen
                </Button>
                {ticket && (
                  <Button
                    variant="outline"
                    disabled={locked}
                    onClick={() => onTicket(order, ticket)}
                  >
                    View ticket
                  </Button>
                )}
              </div>
            </div>
          </article>
        );
      })}
    </aside>
  );
}
