import { useRef, useState } from "react";
import { OrderEntry } from "./order.entry";
import type { LastBill, MenuOption, TableOption } from "./order.types";

export function OrderFloorEntry({
  tables,
  menu,
  locked,
  lastBill,
  onHistory,
  onAdd
}: {
  tables: TableOption[];
  menu: MenuOption[];
  locked: boolean;
  lastBill: LastBill | undefined;
  onHistory: () => void;
  onAdd: (tableUuid: string, seat: number, menuUuid: string, quantity: number) => Promise<boolean>;
}) {
  const [tableUuid, setTableUuid] = useState("");
  const [seat, setSeat] = useState("1");
  const [code, setCode] = useState("");
  const [quantity, setQuantity] = useState("1");
  const [error, setError] = useState("");
  const codeRef = useRef<HTMLInputElement>(null);
  const table = tables.find((row) => row.uuid === tableUuid);
  const available = menu.filter((item) => item.status === "active");
  async function add() {
    if (locked) return;
    const item = available.find((row) => row.code.toLowerCase() === code.trim().toLowerCase());
    const count = Number(quantity);
    if (!table || !item || !Number.isFinite(count) || count <= 0 || count > 999) {
      setError("Choose a table, item code, and quantity between 0.001 and 999.");
      return;
    }
    setError("");
    if (await onAdd(tableUuid, Number(seat), item.uuid, count)) {
      setCode("");
      setQuantity("1");
      codeRef.current?.focus();
    }
  }
  return (
    <div className="qcafe-floor-entry">
      {error && (
        <p role="alert" className="qcafe-floor-error">
          {error}
        </p>
      )}
      <OrderEntry
        available={available}
        code={code}
        setCode={setCode}
        quantity={quantity}
        setQuantity={setQuantity}
        codeRef={codeRef}
        locked={locked}
        enterCode={() => void add()}
        lastBill={lastBill}
        onHistory={onHistory}
        assignmentContent={
          <>
            <label>
              <span>Table</span>
              <select
                aria-label="Entry table"
                disabled={locked}
                value={tableUuid}
                onChange={(event) => {
                  setTableUuid(event.target.value);
                  setSeat("1");
                }}
              >
                <option value="">Select table</option>
                {tables
                  .filter((row) => row.status === "active")
                  .map((row) => (
                    <option key={row.uuid} value={row.uuid}>
                      {row.name}
                    </option>
                  ))}
              </select>
            </label>
            <label>
              <span>Row / Seat</span>
              <select
                aria-label="Entry row or seat"
                disabled={locked || !table}
                value={seat}
                onChange={(event) => setSeat(event.target.value)}
              >
                {Array.from({ length: table?.seats ?? 1 }, (_, index) => (
                  <option key={index} value={index + 1}>
                    {index + 1}
                  </option>
                ))}
              </select>
            </label>
          </>
        }
      />
    </div>
  );
}
