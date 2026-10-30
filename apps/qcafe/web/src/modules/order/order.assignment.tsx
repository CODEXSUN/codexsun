import { useState } from "react";
import { Button } from "@codexsun/ui/components/button";
import type { CafeOrder, OrderPatch, TableOption, OccupiedSeat } from "./order.types";
export function OrderAssignment({
  order,
  tables,
  occupied,
  busy,
  onSave,
  onCancel,
  fixedMode,
  initialMode
}: {
  order: CafeOrder;
  fixedMode?: CafeOrder["mode"] | undefined;
  initialMode?: CafeOrder["mode"];
  tables: TableOption[];
  occupied: OccupiedSeat[];
  busy: boolean;
  onSave: (patch: Partial<OrderPatch>) => void;
  onCancel: () => void;
}) {
  const [mode, setMode] = useState(initialMode ?? order.mode);
  const [tableUuid, setTable] = useState(order.tableUuid ?? "");
  const [seats, setSeats] = useState(order.seats);
  const table = tables.find((table) => table.uuid === tableUuid);
  return (
    <form
      className="grid gap-4"
      onSubmit={(event) => {
        event.preventDefault();
        onSave({
          mode,
          tableUuid: mode === "TAKE AWAY" ? null : tableUuid,
          seats: mode === "TAKE AWAY" ? [] : [...seats].sort((a, b) => a - b)
        });
      }}
    >
      <label>
        Order mode
        <select
          aria-label="Assignment mode"
          disabled={!!fixedMode}
          value={mode}
          onChange={(e) => setMode(e.target.value as CafeOrder["mode"])}
          className="ml-3 rounded border p-2"
        >
          <option>POS</option>
          <option>KOT</option>
          <option value="TAKE AWAY">Parcel - Take away</option>
        </select>
      </label>
      {mode !== "TAKE AWAY" && (
        <>
          <label>
            Table
            <select
              required
              aria-label="Restaurant table"
              value={tableUuid}
              onChange={(e) => {
                setTable(e.target.value);
                setSeats([]);
              }}
              className="ml-3 rounded border p-2"
            >
              <option value="">Choose table</option>
              {tables
                .filter((t) => t.status === "active" || t.uuid === order.tableUuid)
                .map((t) => (
                  <option key={t.uuid} value={t.uuid}>
                    {t.name} · {t.seats} seats
                  </option>
                ))}
            </select>
          </label>
          <div className="flex flex-wrap gap-2" role="group" aria-label="Select seats">
            {Array.from({ length: table?.seats ?? 0 }, (_, i) => i + 1).map((seat) => {
              const taken = occupied.some(
                (s) => s.tableUuid === tableUuid && s.seat === seat && s.orderUuid !== order.uuid
              );
              return (
                <label key={seat} className={`rounded border p-3 ${taken ? "opacity-40" : ""}`}>
                  <input
                    type="checkbox"
                    aria-label={`Seat ${seat}`}
                    checked={seats.includes(seat)}
                    disabled={taken || busy}
                    onChange={() =>
                      setSeats((current) =>
                        current.includes(seat)
                          ? current.filter((s) => s !== seat)
                          : [...current, seat]
                      )
                    }
                  />{" "}
                  {seat}
                  {taken ? " · occupied" : ""}
                </label>
              );
            })}
          </div>
        </>
      )}
      <div className="flex justify-end gap-2">
        <Button type="button" variant="outline" onClick={onCancel} disabled={busy}>
          Cancel
        </Button>
        <Button disabled={busy || (mode !== "TAKE AWAY" && (!tableUuid || !seats.length))}>
          Assign order
        </Button>
      </div>
    </form>
  );
}
