import { useRef, useState, type ReactNode } from "react";
import { Minus, Plus, Trash2 } from "lucide-react";
import type { CafeOrder, MenuOption, LastBill } from "./order.types";
import { MenuImage } from "../menu";
import { OrderEntry } from "./order.entry";
import "./order.css";
export function OrderForm({
  order,
  menu,
  busy,
  disabled,
  onChange,
  onBill,
  onAssign,
  onHistory,
  lastBill,
  search,
  preferences,
  kitchenMode = false,
  parcelMode = false,
  bookingMode = false,
  actionDisabled = false,
  footerContent
}: {
  order: CafeOrder;
  menu: MenuOption[];
  busy: boolean;
  disabled: boolean;
  onChange: (lines: { menuUuid: string; quantity: number }[]) => void;
  onBill: () => void;
  onAssign: () => void;
  onHistory: () => void;
  lastBill: LastBill | undefined;
  search: string;
  preferences: { showItemImages: boolean; showItemCodes: boolean; showSpecialLabels: boolean };
  kitchenMode?: boolean;
  parcelMode?: boolean;
  bookingMode?: boolean;
  actionDisabled?: boolean;
  footerContent?: ReactNode;
}) {
  const lines = order.lines;
  const [category, setCategory] = useState("");
  const [selected, setSelected] = useState("");
  const [code, setCode] = useState("");
  const [quantity, setQuantity] = useState("1");
  const [error, setError] = useState("");
  const codeRef = useRef<HTMLInputElement>(null);
  const payRef = useRef<HTMLButtonElement>(null);
  const available = menu.filter((item) => item.status === "active");
  const visible = available.filter(
    (item) =>
      (!category || item.category === category) &&
      `${item.name} ${item.code}`.toLowerCase().includes(search.toLowerCase())
  );
  const total = lines.reduce((sum, line) => sum + line.amount, 0);
  const locked = busy || disabled;
  function change(next: { menuUuid: string; quantity: number }[]) {
    setError("");
    onChange(next.map(({ menuUuid, quantity }) => ({ menuUuid, quantity })));
  }
  function add(uuid: string, amount = 1) {
    if (locked) return;
    setSelected(uuid);
    const existing = lines.find((line) => line.menuUuid === uuid);
    change(
      existing
        ? lines.map((line) =>
            line.menuUuid === uuid
              ? {
                  ...line,
                  quantity: Math.min(999, Math.round((line.quantity + amount) * 1000) / 1000)
                }
              : line
          )
        : [...lines, { menuUuid: uuid, quantity: amount }]
    );
  }
  function adjust(uuid: string, amount: number) {
    change(
      lines.map((line) =>
        line.menuUuid === uuid
          ? {
              ...line,
              quantity: Math.max(
                0.001,
                Math.min(999, Math.round((line.quantity + amount) * 1000) / 1000)
              )
            }
          : line
      )
    );
  }
  function enterCode() {
    const item = available.find((row) => row.code.toLowerCase() === code.trim().toLowerCase());
    const count = Number(quantity);
    if (
      !item ||
      !Number.isFinite(count) ||
      count <= 0 ||
      count > 999 ||
      Math.abs(count * 1000 - Math.round(count * 1000)) > 0.00001
    ) {
      setError("Choose a valid item code and quantity (up to 999).");
      return;
    }
    add(item.uuid, count);
    codeRef.current?.focus();
    codeRef.current?.select();
  }
  return (
    <div className="qcafe-desktop-pos">
      <div className="qcafe-pos-body">
        <section className="qcafe-products" aria-label="Restaurant items">
          <div className="qcafe-categories">
            {["", ...new Set(available.map((item) => item.category))].map((name) => (
              <button
                key={name}
                className={category === name ? "is-active" : ""}
                onClick={() => setCategory(name)}
              >
                {name || "All"}
              </button>
            ))}
          </div>
          <div className="qcafe-product-grid">
            {visible.map((item) => (
              <button
                key={item.uuid}
                className={`qcafe-product ${selected === item.uuid ? "is-selected" : ""}`}
                disabled={locked}
                onClick={() => {
                  setCode(item.code);
                  add(item.uuid);
                }}
              >
                <div className="qcafe-product-image">
                  {preferences.showItemImages && <MenuImage src={item.imageUrl} alt={item.name} />}
                  {preferences.showItemCodes && <span>{item.code}</span>}
                </div>
                <strong title={item.name}>{item.name}</strong>
                <b>₹{(item.price / 100).toFixed(2)}</b>
                {preferences.showSpecialLabels && item.activeSpecial && (
                  <small className="qcafe-product-special" title={item.activeSpecial.name}>
                    {item.activeSpecial.prefix} · {item.activeSpecial.name}
                  </small>
                )}
              </button>
            ))}
          </div>
          {!visible.length && (
            <p className="qcafe-pos-empty">
              {available.length ? "No matching items." : "Add items in Master to start billing."}
            </p>
          )}
        </section>
        <section className="qcafe-bill" aria-label="Current order">
          <header className="qcafe-bill-heading">
            <div>
              {!parcelMode && order.mode !== "TAKE AWAY" && (
                <button
                  className="qcafe-assignment-button"
                  onClick={onAssign}
                  disabled={locked || (!kitchenMode && order.tickets.length > 0)}
                >
                  {order.mode} · {order.tableName}
                  {order.seats.length ? ` · Seat ${order.seats.join(", ")}` : ""}
                </button>
              )}
              <strong>{order.name}</strong>
            </div>
            <div>
              <span>{lines.reduce((sum, line) => sum + line.quantity, 0)} items</span>
              <button
                aria-label="Clear current order"
                disabled={locked || !lines.length || order.tickets.length > 0}
                onClick={() => change([])}
              >
                <Trash2 size={14} />
              </button>
            </div>
          </header>
          <div className="qcafe-bill-lines">
            <table>
              <thead>
                <tr>
                  <th>#</th>
                  <th>Item name</th>
                  <th>Qty</th>
                  <th>Rate</th>
                  <th>Amount</th>
                  <th />
                </tr>
              </thead>
              <tbody>
                {lines.map((line, index) => {
                  const item = line;
                  const sent = order.tickets
                    .filter((ticket) => ticket.kind === "send")
                    .flatMap((ticket) => ticket.lines)
                    .filter((row) => row.menuUuid === line.menuUuid)
                    .reduce((sum, row) => sum + row.quantity, 0);
                  return (
                    <tr key={line.menuUuid}>
                      <td>{index + 1}</td>
                      <td>
                        <strong>{item?.name ?? "Unavailable item"}</strong>
                      </td>
                      <td>
                        <div className="qcafe-stepper">
                          <button
                            aria-label={`Decrease ${item?.name}`}
                            disabled={locked || line.quantity <= Math.max(1, sent)}
                            onClick={() => adjust(line.menuUuid, -1)}
                          >
                            <Minus size={11} />
                          </button>
                          <span>{line.quantity}</span>
                          <button
                            aria-label={`Increase ${item?.name}`}
                            disabled={locked || line.quantity >= 999}
                            onClick={() => adjust(line.menuUuid, 1)}
                          >
                            <Plus size={11} />
                          </button>
                        </div>
                      </td>
                      <td>₹{((item?.rate ?? 0) / 100).toFixed(2)}</td>
                      <td>
                        <b>₹{(Math.round((item?.rate ?? 0) * line.quantity) / 100).toFixed(2)}</b>
                      </td>
                      <td>
                        <button
                          aria-label={`Remove ${item?.name ?? "item"}`}
                          disabled={locked || sent > 0}
                          onClick={() =>
                            change(lines.filter((row) => row.menuUuid !== line.menuUuid))
                          }
                        >
                          <Trash2 size={13} />
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
          {error && (
            <p role="alert" className="qcafe-pos-error">
              {error}
            </p>
          )}

          <footer className="qcafe-bill-total">
            <button
              ref={payRef}
              disabled={busy || disabled || actionDisabled || !lines.length}
              onClick={onBill}
            >
              {busy
                ? "Saving…"
                : bookingMode
                  ? "Send for preparation"
                  : parcelMode
                    ? "Send parcel"
                    : kitchenMode
                      ? "Send KOT"
                      : "Pay"}{" "}
              <kbd>{kitchenMode ? "F4" : "F7"}</kbd>
            </button>
            <div>
              <span>TOTAL</span>
              <strong>₹{(total / 100).toFixed(2)}</strong>
            </div>
          </footer>
        </section>
      </div>
      <OrderEntry
        available={available}
        code={code}
        setCode={setCode}
        quantity={quantity}
        setQuantity={setQuantity}
        codeRef={codeRef}
        locked={locked}
        enterCode={enterCode}
        lastBill={lastBill}
        onHistory={onHistory}
        leadingContent={footerContent}
      />
    </div>
  );
}
