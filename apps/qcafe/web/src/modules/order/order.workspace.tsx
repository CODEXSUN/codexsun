import { useEffect, useRef, useState } from "react";
import { Search, Plus, Send, Printer } from "lucide-react";
import { Button } from "@codexsun/ui/components/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription
} from "@codexsun/ui/components/dialog";
import { TableWorkspace } from "../table";
import { useOrders } from "./order.hooks";
import { OrderTabs } from "./order.list";
import { OrderForm } from "./order.form";
import { OrderAssignment } from "./order.assignment";
import { KitchenPrint } from "./order.print";
import type { CafeOrder, KitchenTicket, LastBill } from "./order.types";
import "./order.css";
export function OrderWorkspace({
  canCreate,
  canKitchen,
  canManageTables,
  lastBill,
  onHistory,
  onBillSaved,
  restaurantName,
  active = true,
  serviceMode
}: {
  canCreate: boolean;
  canKitchen: boolean;
  canManageTables: boolean;
  lastBill: LastBill | undefined;
  onHistory: () => void;
  onBillSaved: (uuid: string, print: boolean) => Promise<void>;
  restaurantName: string;
  active?: boolean;
  serviceMode: CafeOrder["mode"];
}) {
  const [search, setSearch] = useState("");
  const [assignment, setAssignment] = useState(false);
  const [manage, setManage] = useState(false);
  const [closing, setClosing] = useState<CafeOrder | null>(null);
  const [printTicket, setPrintTicket] = useState<{
    order: CafeOrder;
    ticket: KitchenTicket;
  } | null>(null);
  const [notice, setNotice] = useState("");
  const root = useRef<HTMLDivElement>(null);
  const searchRef = useRef<HTMLInputElement>(null);
  const data = useOrders(async (order, action, print) => {
    if (action === "bill" && order.billUuid) {
      await onBillSaved(order.billUuid, print);
      setNotice(`Saved bill for ${order.name}.`);
    }
    if (action === "kitchen" || action === "cancel") {
      const ticket = order.tickets.at(-1);
      if (ticket) setPrintTicket({ order, ticket });
      setNotice(action === "cancel" ? "Order cancelled. Seats released." : "Kitchen ticket saved.");
    }
  });
  const visibleOrders = data.orders;
  const remembered = useRef<Partial<Record<CafeOrder["mode"], string>>>({});
  const initialized = useRef(false);
  useEffect(() => {
    if (
      data.loaded &&
      !visibleOrders.length &&
      !data.pending &&
      !data.busy &&
      canCreate &&
      !initialized.current
    ) {
      initialized.current = true;
      void data.create();
    }
  }, [serviceMode, data.loaded, visibleOrders.length, data.pending, data.busy, canCreate]);
  const order =
    visibleOrders.find((order) => order.uuid === data.activeId) ??
    visibleOrders.find((order) => order.uuid === remembered.current[serviceMode]) ??
    visibleOrders[0];
  useEffect(() => {
    if (order) remembered.current[serviceMode] = order.uuid;
  }, [serviceMode, order?.uuid]);
  const assignmentOrder = order;
  function createOrder() {
    void data.create();
  }

  const locked = data.busy || !!data.pending || !canCreate;
  async function kitchen() {
    if (order && !locked && canKitchen) await data.mutate(order, "kitchen", {}, true);
  }
  async function bill(print: boolean) {
    if (order && !locked) await data.mutate(order, "bill", {}, print);
  }
  useEffect(() => {
    if (!active) return;
    const shortcut = (event: KeyboardEvent) => {
      if (document.querySelector('[role="dialog"]')) return;
      if (event.key === "F2") {
        event.preventDefault();
        searchRef.current?.focus();
        searchRef.current?.select();
      }
      if (event.key === "F3") {
        event.preventDefault();
        root.current?.querySelector<HTMLInputElement>('[aria-label="Item code"]')?.focus();
      }
      if (event.key === "F4" && serviceMode === "KOT") {
        event.preventDefault();
        void kitchen();
      }
      if (event.key === "F7") {
        event.preventDefault();
        void bill(false);
      }
      if (event.key === "F8") {
        event.preventDefault();
        void bill(true);
      }
      if (event.key === "F9") {
        event.preventDefault();
        if (!locked) createOrder();
      }
    };
    window.addEventListener("keydown", shortcut);
    return () => window.removeEventListener("keydown", shortcut);
  });

  return (
    <div ref={root} className="qcafe-orders-workspace">
      <header className="qcafe-pos-toolbar">
        <span className="qcafe-page-mode">
          {serviceMode === "TAKE AWAY" ? "Take Away" : serviceMode} <kbd>F1</kbd>
        </span>
        <div className="qcafe-toolbar-search">
          <Search size={15} />
          <input
            ref={searchRef}
            aria-label="Search items"
            placeholder="Search items (e.g. Cappuccino) or scan…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
          <kbd>F2</kbd>
        </div>
        <OrderTabs
          orders={visibleOrders}
          activeId={order?.uuid ?? ""}
          disabled={data.busy || !!data.pending}
          onSelect={data.setActiveId}
          onClose={setClosing}
        />
        <button className="qcafe-new-order" disabled={locked} onClick={createOrder}>
          <Plus size={13} />
          New Order
        </button>
        <div className="qcafe-toolbar-actions">
          {serviceMode === "KOT" && (
            <>
              <button
                onClick={() => {
                  void data.refresh();
                }}
                disabled={data.busy}
              >
                Refresh
              </button>
              <button onClick={() => setManage(true)}>Tables</button>
              <button
                className="qcafe-kitchen"
                disabled={locked || !canKitchen || !order?.lines.length}
                onClick={() => void kitchen()}
              >
                <Send size={13} />
                Kitchen <kbd>F4</kbd>
              </button>
            </>
          )}
          <button
            className="qcafe-save-print"
            disabled={locked || !order?.lines.length}
            onClick={() => void bill(true)}
          >
            <Printer size={13} />
            Save & print <kbd>F8</kbd>
          </button>
        </div>
      </header>
      {data.error && (
        <div role="alert" className="qcafe-order-message text-red-700">
          {data.error}
        </div>
      )}
      {data.pending && (
        <div className="qcafe-order-message" role="status">
          Confirmation pending. Editing is locked to protect this order.{" "}
          <Button disabled={data.busy} onClick={() => void data.retry()}>
            Retry same operation
          </Button>
        </div>
      )}
      {!data.loaded ? (
        <p className="p-6">Loading saved orders…</p>
      ) : order ? (
        <OrderForm
          key={order.uuid}
          order={order}
          menu={data.menu}
          search={search}
          busy={data.busy}
          disabled={!!data.pending || !canCreate}
          onChange={(lines) => void data.mutate(order, "save", { lines })}
          onAssign={() => {
            void data.refresh();
            setAssignment(true);
          }}
          onBill={() => void bill(false)}
          lastBill={lastBill}
          onHistory={onHistory}
        />
      ) : (
        <div className="qcafe-order-empty">
          <p>{notice || "Start a new order to begin billing."}</p>
          <Button disabled={locked} onClick={createOrder}>
            New Order
          </Button>
          <Button variant="outline" onClick={onHistory}>
            Recent bills
          </Button>
        </div>
      )}
      {order?.tickets.length ? (
        <div className="qcafe-kot-reprint">
          <span>{order.tickets.at(-1)?.number}</span>
          <button onClick={() => setPrintTicket({ order, ticket: order.tickets.at(-1)! })}>
            Reprint last KOT
          </button>
        </div>
      ) : null}
      <Dialog open={assignment && !!assignmentOrder} onOpenChange={setAssignment}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Table and seats</DialogTitle>
            <DialogDescription>
              Choose the table and seats for this page’s order. Use F1 outside this dialog to switch
              service pages.
            </DialogDescription>
          </DialogHeader>
          {data.error && (
            <p role="alert" className="text-red-700">
              {data.error}
            </p>
          )}
          {assignmentOrder && (
            <OrderAssignment
              key={assignmentOrder.uuid + serviceMode}
              order={assignmentOrder}
              tables={data.tables}
              occupied={data.occupied}
              busy={data.busy}
              onSave={(patch) => {
                void data.mutate(assignmentOrder, "save", patch).then((result) => {
                  if (result) setAssignment(false);
                });
              }}
              onCancel={() => setAssignment(false)}
            />
          )}
        </DialogContent>
      </Dialog>
      <Dialog open={manage} onOpenChange={setManage}>
        <DialogContent className="max-h-[85vh] overflow-auto">
          <DialogHeader>
            <DialogTitle>Tables</DialogTitle>
            <DialogDescription>
              Restaurant table and seat configuration for this workspace.
            </DialogDescription>
          </DialogHeader>
          <TableWorkspace canManage={canManageTables} onChanged={() => void data.refresh()} />
        </DialogContent>
      </Dialog>
      <Dialog
        open={!!closing}
        onOpenChange={(open) => {
          if (!open) setClosing(null);
        }}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Close {closing?.name}?</DialogTitle>
            <DialogDescription>
              This cancels the saved order and releases its seats. If a KOT was sent, a cancellation
              KOT is saved and opened for printing.
            </DialogDescription>
          </DialogHeader>
          <Button variant="outline" onClick={() => setClosing(null)}>
            Keep order
          </Button>
          <Button
            disabled={locked || !canKitchen}
            onClick={() => {
              if (closing)
                void data.mutate(closing, "cancel").then((result) => {
                  if (result) setClosing(null);
                });
            }}
          >
            Cancel order
          </Button>
        </DialogContent>
      </Dialog>
      <Dialog
        open={!!printTicket}
        onOpenChange={(open) => {
          if (!open) setPrintTicket(null);
        }}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {printTicket?.ticket.kind === "cancel" ? "Cancellation KOT" : "Kitchen order"} ·{" "}
              {printTicket?.ticket.number}
            </DialogTitle>
            <DialogDescription>
              {printTicket?.order.name} · {printTicket?.order.tableName || "Parcel"} · Seats{" "}
              {printTicket?.order.seats.join(", ") || "—"}
            </DialogDescription>
          </DialogHeader>
          {printTicket?.ticket.lines.map((line) => (
            <div key={line.menuUuid} className="flex justify-between">
              <span>{line.name}</span>
              <b>× {line.quantity}</b>
            </div>
          ))}
          <Button
            onClick={() => {
              document.body.dataset.qcafePrint = "kot";
              window.print();
            }}
          >
            <Printer size={14} /> Print KOT
          </Button>
        </DialogContent>
      </Dialog>
      {printTicket && (
        <KitchenPrint
          key={printTicket.ticket.uuid}
          order={printTicket.order}
          ticket={printTicket.ticket}
          restaurantName={restaurantName}
        />
      )}
    </div>
  );
}
