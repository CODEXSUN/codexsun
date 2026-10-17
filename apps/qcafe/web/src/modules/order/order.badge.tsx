import type { CafeOrder } from "./order.types";

export function OrderBadge({ order }: { order: Pick<CafeOrder, "uuid" | "name"> }) {
  const number = Number(order.name.match(/\d+$/u)?.[0] ?? Number.parseInt(order.uuid, 16));
  return (
    <span className="qcafe-order-badge" data-order-colour={number % 6}>
      {order.name}
    </span>
  );
}
