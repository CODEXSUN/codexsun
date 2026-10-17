import type { Waiter } from "./waiter.types";
export function WaiterList({
  items,
  onSelect
}: {
  items: Waiter[];
  onSelect: (item: Waiter) => void;
}) {
  return (
    <div className="grid gap-2">
      {items.map((item) => (
        <button
          className="rounded border p-3 text-left"
          key={item.uuid}
          onClick={() => onSelect(item)}
        >
          {item.code} � {item.name} <small>{item.status}</small>
        </button>
      ))}
    </div>
  );
}
