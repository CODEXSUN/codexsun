import { useEffect, useRef, useState } from "react";
import { CloudApiError } from "../../web/transport";
import {
  listOrders,
  updateOrder,
  orderMenuLookup,
  orderTableLookup,
  orderSeatLookup
} from "./order.services";
import { orderInputSchema } from "./order.schema";
import type {
  CafeOrder,
  OrderInput,
  OrderPatch,
  MenuOption,
  TableOption,
  OccupiedSeat
} from "./order.types";
type Pending = { uuid: string; input: OrderInput; print: boolean };
export function useOrders(
  onCompleted: (order: CafeOrder, action: OrderInput["action"], print: boolean) => Promise<void>
) {
  const key = `codexsun.qcafe.orders.pending:${sessionStorage.getItem("codexsun.auth.slot") ?? "unbound"}`;
  const [orders, setOrders] = useState<CafeOrder[]>([]);
  const [menu, setMenu] = useState<MenuOption[]>([]);
  const [tables, setTables] = useState<TableOption[]>([]);
  const [occupied, setOccupied] = useState<OccupiedSeat[]>([]);
  const [loaded, setLoaded] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [activeId, setActiveId] = useState("");
  const [pending, setPending] = useState<Pending | null>(() => {
    try {
      const value = JSON.parse(sessionStorage.getItem(key) ?? "null");
      if (
        !value ||
        !orderInputSchema.safeParse(value.input).success ||
        !/^[a-f0-9]{8}$/u.test(value.uuid)
      )
        return null;
      return value as Pending;
    } catch {
      return null;
    }
  });
  const sending = useRef(false);
  const completed = useRef(onCompleted);
  completed.current = onCompleted;
  async function refresh() {
    try {
      const [o, m, t, s] = await Promise.all([
        listOrders(),
        orderMenuLookup(),
        orderTableLookup(),
        orderSeatLookup()
      ]);
      setOrders(o);
      setMenu(m);
      setTables(t);
      setOccupied(s);
      setActiveId((current) =>
        o.some((item) => item.uuid === current) ? current : (o[0]?.uuid ?? "")
      );
      setError("");
      setLoaded(true);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Cannot load orders.");
    }
  }
  useEffect(() => {
    void refresh();
    const changed = () => {
      void refresh();
    };
    window.addEventListener("qcafe-menu-updated", changed);
    return () => window.removeEventListener("qcafe-menu-updated", changed);
  }, []);
  async function send(operation: Pending) {
    if (sending.current) return null;
    sending.current = true;
    setBusy(true);
    setError("");
    try {
      sessionStorage.setItem(key, JSON.stringify(operation));
      setPending(operation);
      const result = await updateOrder(operation.uuid, operation.input);
      sessionStorage.removeItem(key);
      setPending(null);
      setOrders((current) =>
        result.status === "draft"
          ? [...current.filter((item) => item.uuid !== result.uuid), result].sort((a, b) =>
              a.name.localeCompare(b.name, undefined, { numeric: true })
            )
          : current.filter((item) => item.uuid !== result.uuid)
      );
      setActiveId(result.uuid);
      setOccupied(await orderSeatLookup());
      await completed.current(result, operation.input.action, operation.print);
      return result;
    } catch (e) {
      if (e instanceof CloudApiError && e.status < 500) {
        sessionStorage.removeItem(key);
        setPending(null);
      }
      setError(e instanceof Error ? e.message : "Cannot save order.");
      return null;
    } finally {
      sending.current = false;
      setBusy(false);
    }
  }
  async function mutate(
    order: CafeOrder,
    action: OrderInput["action"],
    patch: Partial<OrderPatch> = {},
    print = false
  ) {
    if (pending) return null;
    const parsed = orderInputSchema.safeParse({
      name: order.name,
      booking: order.booking ?? null,
      mode: order.mode,
      tableUuid: order.tableUuid,
      seats: order.seats,
      lines: order.lines.map(({ menuUuid, quantity }) => ({ menuUuid, quantity })),
      ...patch,
      requestId: crypto.randomUUID(),
      revision: order.revision,
      action
    });
    if (!parsed.success) {
      setError(parsed.error.issues[0]?.message ?? "Check the order.");
      return null;
    }
    return send({ uuid: order.uuid, input: parsed.data, print });
  }
  async function create(patch: Partial<OrderPatch> = {}) {
    if (pending || sending.current) return null;
    const uuid = Array.from(crypto.getRandomValues(new Uint8Array(4)), (n) =>
      n.toString(16).padStart(2, "0")
    ).join("");
    const next =
      Math.max(0, ...orders.map((order) => Number(order.name.match(/\d+$/u)?.[0] ?? 0))) + 1;
    return send({
      uuid,
      print: false,
      input: {
        requestId: crypto.randomUUID(),
        revision: 0,
        action: "save",
        name: `Order ${next}`,
        booking: null,
        mode: "TAKE AWAY",
        tableUuid: null,
        seats: [],
        lines: [],
        ...patch
      }
    });
  }
  return {
    orders,
    menu,
    tables,
    occupied,
    loaded,
    busy,
    error,
    pending,
    activeId,
    setActiveId,
    refresh,
    mutate,
    create,
    retry: () => (pending ? send(pending) : Promise.resolve(null))
  };
}
