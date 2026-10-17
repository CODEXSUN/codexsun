import { useState } from "react";
import { Armchair, UtensilsCrossed, RotateCcw } from "lucide-react";
import { Button } from "@codexsun/ui/components/button";
import { OrderRunning } from "./order.running";
import { kitchenProgress } from "./order.kitchen";
import type { CafeOrder, TableOption, OccupiedSeat, KitchenTicket } from "./order.types";
import "./order.floor.css";

export function OrderFloor({
  tables,
  orders,
  occupied,
  locked,
  onOpen,
  onRefresh,
  canSend,
  onSelect,
  onSend,
  onTicket
}: {
  tables: TableOption[];
  orders: CafeOrder[];
  occupied: OccupiedSeat[];
  locked: boolean;
  onOpen: (table: TableOption, seats: number[], existing?: CafeOrder) => Promise<void>;
  onRefresh: () => Promise<void>;
  canSend: boolean;
  onSelect: (order: CafeOrder) => void;
  onSend: (order: CafeOrder) => Promise<unknown>;
  onTicket: (order: CafeOrder, ticket: KitchenTicket) => void;
}) {
  const [filter, setFilter] = useState("all");
  const [selection, setSelection] = useState<{
    tableUuid: string;
    seats: number[];
    orderUuid?: string;
  }>({ tableUuid: "", seats: [] });
  const [error, setError] = useState("");
  const floor = tables.filter(
    (t) => t.status === "active" || occupied.some((s) => s.tableUuid === t.uuid)
  );
  const taken = (uuid: string) => occupied.some((s) => s.tableUuid === uuid);
  const occupiedCount = floor.filter((t) => taken(t.uuid)).length;
  const running = orders.filter((order) => !!order.tableUuid && !order.booking);
  function choose(table: TableOption, seat: number) {
    setError("");
    const claim = occupied.find((s) => s.tableUuid === table.uuid && s.seat === seat);
    if (claim) {
      const existing = orders.find((o) => o.uuid === claim.orderUuid);
      if (!existing) {
        setError("This chair awaits payment. Open its bill from Recent bills.");
        return;
      }
      setSelection({ tableUuid: table.uuid, seats: existing.seats, orderUuid: existing.uuid });
      return;
    }
    const seats = selection.tableUuid === table.uuid && !selection.orderUuid ? selection.seats : [];
    setSelection({
      tableUuid: table.uuid,
      seats: seats.includes(seat)
        ? seats.filter((s) => s !== seat)
        : [...seats, seat].sort((a, b) => a - b)
    });
  }
  async function open(table: TableOption) {
    setError("");
    if (selection.tableUuid !== table.uuid || !selection.seats.length) {
      setError(`Select chairs on ${table.name}, then press the table.`);
      return;
    }
    await onOpen(
      table,
      selection.seats,
      orders.find((o) => o.uuid === selection.orderUuid)
    );
  }
  return (
    <section className="qcafe-floor" aria-label="KOT floor and guest tables">
      <div className="qcafe-floor-title">
        <div className="qcafe-floor-heading">
          <Armchair size={24} />
          <h2>
            Floor &amp; Guest Tables{" "}
            <small>
              {floor.length} {floor.length === 1 ? "table" : "tables"}
            </small>
          </h2>
        </div>
        <div className="qcafe-floor-filters" role="group" aria-label="Table availability">
          {[
            ["all", `All (${floor.length})`],
            ["available", `Available (${floor.length - occupiedCount})`],
            ["occupied", `Occupied (${occupiedCount})`]
          ].map(([value, label]) => (
            <Button
              key={value}
              variant={filter === value ? "default" : "outline"}
              onClick={() => setFilter(value!)}
            >
              {label}
            </Button>
          ))}
        </div>
        <div className="qcafe-floor-counts">
          <span>{floor.length - occupiedCount} Available</span>
          <span>{occupiedCount} Occupied</span>
          <Button
            variant="outline"
            size="icon"
            aria-label="Refresh floor"
            disabled={locked}
            onClick={() => void onRefresh()}
          >
            <RotateCcw size={15} />
          </Button>
        </div>
      </div>
      {error && (
        <p role="alert" className="qcafe-floor-error">
          {error}
        </p>
      )}
      <div className="qcafe-floor-content">
        <div className="qcafe-floor-grid">
          {floor
            .filter(
              (t) => filter === "all" || (filter === "occupied" ? taken(t.uuid) : !taken(t.uuid))
            )
            .map((table) => {
              const tableOrders = running.filter((order) => order.tableUuid === table.uuid);
              const pending = tableOrders.reduce(
                (sum, order) => sum + kitchenProgress(order).pending,
                0
              );
              const sent = tableOrders.some((order) => kitchenProgress(order).sent);
              const stage = pending
                ? "is-pending"
                : sent
                  ? "is-sent"
                  : taken(table.uuid) && !tableOrders.length
                    ? "is-payment"
                    : "";
              const flow = pending
                ? `${pending} to send`
                : sent
                  ? "Sent to kitchen"
                  : tableOrders.length
                    ? "Seated · add items"
                    : taken(table.uuid)
                      ? "Payment due"
                      : "Select chairs first";
              const seats = Array.from({ length: table.seats }, (_, i) => i + 1);
              const chair = (seat: number) => {
                const claim = occupied.find((s) => s.tableUuid === table.uuid && s.seat === seat);
                const selected =
                  selection.tableUuid === table.uuid && selection.seats.includes(seat);
                return (
                  <button
                    key={seat}
                    aria-label={`${table.name} chair ${seat}${claim ? " occupied" : " available"}`}
                    aria-pressed={selected}
                    className={`qcafe-floor-chair ${claim ? "is-occupied" : ""} ${selected ? "is-selected" : ""}`}
                    disabled={locked || (table.status !== "active" && !claim)}
                    onClick={() => choose(table, seat)}
                  >
                    <Armchair size={16} />
                    {seat}
                  </button>
                );
              };
              return (
                <article
                  key={table.uuid}
                  className={`qcafe-floor-card ${taken(table.uuid) ? "is-occupied" : ""} ${stage}`}
                >
                  <div className="qcafe-floor-card-title">
                    <strong>
                      {table.name} <small>({table.seats} seats)</small>
                    </strong>
                    <span>{taken(table.uuid) ? "Occupied" : "Available"}</span>
                  </div>
                  <div className="qcafe-floor-place">
                    <div className="qcafe-floor-chairs">
                      {seats.slice(0, Math.ceil(seats.length / 2)).map(chair)}
                    </div>
                    <button
                      className="qcafe-floor-table"
                      aria-label={`Open table ${table.name}`}
                      disabled={locked}
                      onClick={() => void open(table)}
                    >
                      <UtensilsCrossed size={24} />
                      <strong>{table.name}</strong>
                      <small>
                        {selection.tableUuid === table.uuid && selection.seats.length
                          ? `Chairs ${selection.seats.join(", ")}`
                          : flow}
                      </small>
                    </button>
                    <div className="qcafe-floor-chairs">
                      {seats.slice(Math.ceil(seats.length / 2)).map(chair)}
                    </div>
                  </div>
                </article>
              );
            })}
        </div>
        <OrderRunning
          orders={running}
          locked={locked}
          canSend={canSend}
          onSelect={onSelect}
          onSend={onSend}
          onTicket={onTicket}
        />
      </div>
      {!floor.length && (
        <p className="qcafe-floor-empty">Add restaurant tables in Master to start a KOT order.</p>
      )}
    </section>
  );
}
