import type { CafeOrder } from "./order.types";
export function OrderTabs({
  orders,
  activeId,
  disabled,
  onSelect,
  onClose
}: {
  orders: CafeOrder[];
  activeId: string;
  disabled: boolean;
  onSelect: (uuid: string) => void;
  onClose: (order: CafeOrder) => void;
}) {
  return (
    <div className="qcafe-order-tabs" role="tablist" aria-label="Orders">
      {orders.map((order) => (
        <div key={order.uuid} className={order.uuid === activeId ? "is-active" : ""}>
          <button
            role="tab"
            aria-label={order.name}
            aria-selected={order.uuid === activeId}
            disabled={disabled}
            onClick={() => onSelect(order.uuid)}
          >
            {order.name}
            <span>{order.lines.reduce((n, line) => n + line.quantity, 0)}</span>
          </button>
          <button
            aria-label={`Close ${order.name}`}
            disabled={disabled}
            onClick={() => onClose(order)}
          >
            ×
          </button>
        </div>
      ))}
    </div>
  );
}
