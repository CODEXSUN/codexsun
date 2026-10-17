import type { RefObject, ReactNode } from "react";
import { Barcode, Minus, Plus, PlusCircle } from "lucide-react";
import type { LastBill, MenuOption } from "./order.types";

export function OrderEntry({
  available,
  code,
  setCode,
  quantity,
  setQuantity,
  codeRef,
  locked,
  enterCode,
  lastBill,
  onHistory,
  leadingContent
}: {
  available: MenuOption[];
  code: string;
  setCode: (value: string) => void;
  quantity: string;
  setQuantity: (value: string) => void;
  codeRef: RefObject<HTMLInputElement | null>;
  locked: boolean;
  enterCode: () => void;
  lastBill: LastBill | undefined;
  onHistory: () => void;
  leadingContent?: ReactNode;
}) {
  return (
    <footer className="qcafe-pos-entry">
      {leadingContent ?? (
        <section
          className={`qcafe-last-bill ${lastBill?.status === "paid" ? "is-paid" : ""}`}
          aria-label="Last bill notification"
        >
          {lastBill ? (
            <>
              <p>{lastBill.status === "paid" ? "✓ Paid" : "Amount pending"}</p>
              <p>
                Last billed no. {lastBill.number} · ₹{(lastBill.total / 100).toFixed(2)}
              </p>
            </>
          ) : (
            <p>No billed receipt yet</p>
          )}
          <button onClick={onHistory} className="qcafe-recent-bills">
            Recent bills
          </button>
        </section>
      )}
      <section className="qcafe-fast-entry" aria-label="Fast item entry">
        <label>
          <span>
            {available.find((item) => item.code.toLowerCase() === code.toLowerCase())?.name ||
              "Enter item code"}
          </span>
          <div className="qcafe-code-input">
            <Barcode size={15} />
            <input
              ref={codeRef}
              list="qcafe-item-codes"
              aria-label="Item code"
              placeholder="Code · F3"
              value={code}
              disabled={locked}
              onChange={(event) => setCode(event.target.value)}
              onKeyDown={(event) => {
                if (event.key === "Enter") {
                  event.preventDefault();
                  enterCode();
                }
              }}
            />
            <datalist id="qcafe-item-codes">
              {available.map((item) => (
                <option key={item.uuid} value={item.code}>
                  {item.name}
                </option>
              ))}
            </datalist>
          </div>
        </label>
        <label>
          <span>Qty</span>
          <div className="qcafe-stepper">
            <button
              disabled={locked}
              aria-label="Decrease entry quantity"
              onClick={() => setQuantity(String(Math.max(1, Number(quantity) - 1)))}
            >
              <Minus size={12} />
            </button>
            <input
              aria-label="Order quantity"
              inputMode="decimal"
              value={quantity}
              disabled={locked}
              onChange={(event) => setQuantity(event.target.value)}
              onKeyDown={(event) => {
                if (event.key === "Enter") {
                  event.preventDefault();
                  enterCode();
                }
              }}
            />
            <button
              disabled={locked}
              aria-label="Increase entry quantity"
              onClick={() => setQuantity(String(Math.min(999, Number(quantity) + 1)))}
            >
              <Plus size={12} />
            </button>
          </div>
        </label>
        <button className="qcafe-add" disabled={locked} onClick={enterCode}>
          <PlusCircle size={16} /> Add
        </button>
      </section>
    </footer>
  );
}
