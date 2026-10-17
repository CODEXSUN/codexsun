import { useEffect, useRef, useState } from "react";
import { Search, Plus, Printer } from "lucide-react";
import { Button } from "@codexsun/ui/components/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription
} from "@codexsun/ui/components/dialog";
import { useCafeSettings } from "../settings";
import { useOrders } from "./order.hooks";
import { OrderTabs } from "./order.list";
import { OrderForm } from "./order.form";
import { OrderAssignment } from "./order.assignment";
import { OrderKitchenFlow } from "./order.kitchen";
import { OrderParcelFlow } from "./order.parcel";
import { OrderFloor } from "./order.floor";
import { OrderFloorEntry } from "./order.floor-entry";
import { BookingDetailsForm } from "./order.booking-form";
import { OrderBookingFlow } from "./order.booking-flow";
import { KitchenPrint } from "./order.print";
import type {
  CafeOrder,
  KitchenTicket,
  LastBill,
  TableOption,
  BookingDetails
} from "./order.types";
import "./order.css";
export function OrderWorkspace({
  canCreate,
  canKitchen,
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
  serviceMode: CafeOrder["mode"] | "BOOKING";
}) {
  const { settings: preferences, loading: preferencesLoading } = useCafeSettings();
  const [defaultAssignment, setDefaultAssignment] = useState(false);
  const [search, setSearch] = useState("");
  const [assignment, setAssignment] = useState(false);
  const [bookingEditor, setBookingEditor] = useState<{ order: CafeOrder | null } | null>(null);
  const [kotItems, setKotItems] = useState(false);
  useEffect(() => {
    if (serviceMode === "KOT") {
      setKotItems(false);
      void data.refresh();
    }
  }, [serviceMode]);
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
      if (ticket && (action === "cancel" || order.mode !== "KOT"))
        setPrintTicket({ order, ticket });
      setNotice(action === "cancel" ? "Order cancelled. Seats released." : "Kitchen ticket saved.");
    }
  });
  const visibleOrders =
    serviceMode === "BOOKING"
      ? data.orders.filter((order) => !!order.booking)
      : serviceMode === "TAKE AWAY"
        ? data.orders.filter((order) => order.mode === "TAKE AWAY" && !order.booking)
        : data.orders;
  const preparationFlow =
    serviceMode === "KOT" || serviceMode === "TAKE AWAY" || serviceMode === "BOOKING";
  const remembered = useRef<Partial<Record<typeof serviceMode, string>>>({});
  const initialized = useRef(new Set<string>());
  useEffect(() => {
    if (
      data.loaded &&
      !preferencesLoading &&
      !visibleOrders.length &&
      !data.pending &&
      !data.busy &&
      canCreate &&
      serviceMode !== "KOT" &&
      !initialized.current.has(serviceMode)
    ) {
      initialized.current.add(serviceMode);
      createOrder();
    }
  }, [
    serviceMode,
    data.loaded,
    visibleOrders.length,
    data.pending,
    data.busy,
    canCreate,
    preferencesLoading
  ]);
  const order =
    visibleOrders.find((order) => order.uuid === data.activeId) ??
    visibleOrders.find((order) => order.uuid === remembered.current[serviceMode]) ??
    visibleOrders[0];
  useEffect(() => {
    if (order) remembered.current[serviceMode] = order.uuid;
  }, [serviceMode, order?.uuid]);
  const assignmentOrder = order;
  function createOrder() {
    if (serviceMode === "BOOKING") {
      setBookingEditor({ order: null });
      return;
    }
    if (serviceMode === "KOT") {
      setKotItems(false);
      void data.refresh();
      return;
    }
    void data.create().then((order) => {
      if (order && serviceMode !== "TAKE AWAY" && preferences.defaultServiceType === "POS") {
        setDefaultAssignment(true);
        setAssignment(true);
      }
    });
  }

  const locked = preferencesLoading || data.busy || data.queued || !!data.pending || !canCreate;
  async function saveBooking(details: BookingDetails) {
    if (locked || !bookingEditor) return;
    const result = bookingEditor.order
      ? await data.mutate(bookingEditor.order, "save", { booking: details })
      : await data.create({ mode: "TAKE AWAY", booking: details });
    if (result) setBookingEditor(null);
  }
  function selectOrder(uuid: string) {
    data.setActiveId(uuid);
    if (serviceMode === "KOT") setKotItems(!!data.orders.find((o) => o.uuid === uuid)?.tableUuid);
  }
  async function openFloorTable(table: TableOption, seats: number[], existing?: CafeOrder) {
    if (locked) return;
    if (existing) {
      selectOrder(existing.uuid);
      return;
    }
    const created = await data.create({ mode: "KOT", tableUuid: table.uuid, seats });
    if (created) setKotItems(true);
  }
  async function kitchen(target = order) {
    if (!target || locked || !canKitchen) return null;
    if (serviceMode === "KOT" && !kotItems) return null;
    if (serviceMode === "TAKE AWAY" && target.mode !== "TAKE AWAY") return null;
    if (serviceMode === "BOOKING" && !target.booking) return null;
    if (serviceMode === "KOT" && (!target.tableUuid || !target.seats.length)) {
      data.setActiveId(target.uuid);
      setDefaultAssignment(true);
      setAssignment(true);
      return null;
    }
    return data.mutate(target, "kitchen", {}, true);
  }
  async function addFloorItem(tableUuid: string, seat: number, menuUuid: string, quantity: number) {
    if (locked) return false;
    const claim = data.occupied.find((row) => row.tableUuid === tableUuid && row.seat === seat);
    const existing = claim && data.orders.find((row) => row.uuid === claim.orderUuid);
    if (claim && !existing) {
      setNotice("This chair awaits payment. Open its bill from Recent bills.");
      return false;
    }
    if (!existing)
      return !!(await data.create({
        mode: "KOT",
        tableUuid,
        seats: [seat],
        lines: [{ menuUuid, quantity }]
      }));
    const lines = existing.lines.map((line) => ({
      menuUuid: line.menuUuid,
      quantity: line.quantity
    }));
    const line = lines.find((row) => row.menuUuid === menuUuid);
    if (line) line.quantity += quantity;
    else lines.push({ menuUuid, quantity });
    return !!(await data.mutate(existing, "save", { lines }));
  }
  async function bill(print: boolean) {
    if (preparationFlow && print) return kitchen();
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
      if (event.key === "F4" && preparationFlow) {
        event.preventDefault();
        void kitchen();
      }
      if (event.key === "F7") {
        event.preventDefault();
        void (preparationFlow ? kitchen() : bill(false));
      }
      if (event.key === "F8") {
        event.preventDefault();
        void bill(true);
      }
      if (event.key === "F9" && preferences.showOrderTabs) {
        event.preventDefault();
        if (!locked) createOrder();
      }
    };
    window.addEventListener("keydown", shortcut);
    return () => window.removeEventListener("keydown", shortcut);
  });

  return (
    <div
      ref={root}
      className="qcafe-orders-workspace"
      data-page-theme={serviceMode}
      data-saving={data.busy || data.queued}
    >
      <header className="qcafe-pos-toolbar">
        <span className="qcafe-page-mode">
          {serviceMode === "BOOKING"
            ? "Booking"
            : serviceMode === "TAKE AWAY"
              ? "Parcel - Take away"
              : serviceMode}{" "}
          <kbd>F1</kbd>
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
        {preferences.showOrderTabs && (
          <>
            <OrderTabs
              orders={visibleOrders}
              activeId={order?.uuid ?? ""}
              disabled={data.busy || data.queued || !!data.pending}
              onSelect={selectOrder}
              onClose={setClosing}
            />
            <button className="qcafe-new-order" disabled={locked} onClick={createOrder}>
              <Plus size={13} />
              New Order
            </button>
          </>
        )}
        <div className="qcafe-toolbar-actions">
          <button
            className="qcafe-save-print"
            disabled={locked || !order?.lines.length || (serviceMode === "KOT" && !kotItems)}
            onClick={() => void bill(true)}
          >
            <Printer size={13} />
            {serviceMode === "KOT" ? "Send to kitchen" : "Save & print"} <kbd>F8</kbd>
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
      {data.queued && !data.busy && !data.pending && (
        <div className="qcafe-order-message" role="status">
          Item additions are waiting to save.
          <Button onClick={() => void data.retryAdditions()}>Retry item additions</Button>
        </div>
      )}
      {!data.loaded ? (
        <p className="p-6">Loading saved orders…</p>
      ) : serviceMode === "KOT" && !kotItems ? (
        <OrderFloor
          tables={data.tables}
          floorBills={data.floorBills}
          onBill={(uuid) => void onBillSaved(uuid, false)}
          orders={data.orders}
          occupied={data.occupied}
          locked={locked}
          onOpen={openFloorTable}
          onRefresh={data.refresh}
          canSend={canKitchen}
          onSelect={(target) => selectOrder(target.uuid)}
          onSend={(target) => data.mutate(target, "kitchen", {}, true)}
          onTicket={(order, ticket) => setPrintTicket({ order, ticket })}
        />
      ) : order ? (
        <OrderForm
          key={order.uuid}
          order={order}
          menu={data.menu}
          search={search}
          preferences={preferences}
          busy={data.busy || data.queued}
          disabled={(!!data.pending && !data.busy) || (data.busy && !data.queued) || !canCreate}
          onAdd={(menuUuid, quantity) => data.addItem(order, menuUuid, quantity)}
          onChange={(lines) => void data.mutate(order, "save", { lines })}
          onAssign={() => {
            if (serviceMode === "KOT") {
              setKotItems(false);
              void data.refresh();
              return;
            }
            setDefaultAssignment(false);
            void data.refresh();
            setAssignment(true);
          }}
          kitchenMode={preparationFlow}
          parcelMode={serviceMode === "TAKE AWAY" || serviceMode === "BOOKING"}
          bookingMode={serviceMode === "BOOKING"}
          actionDisabled={preparationFlow && !canKitchen}
          onBill={() => void (preparationFlow ? kitchen() : bill(false))}
          footerContent={
            serviceMode === "KOT" ? (
              <OrderKitchenFlow
                order={order}
                orders={visibleOrders}
                locked={locked}
                canKitchen={canKitchen}
                error={data.error}
                onRefresh={data.refresh}
                onAssign={() => {
                  setKotItems(false);
                  void data.refresh();
                }}
                onSelect={selectOrder}
                onSend={kitchen}
                onBill={(target) => data.mutate(target, "bill")}
                onReprint={(order, ticket) => setPrintTicket({ order, ticket })}
              />
            ) : serviceMode === "TAKE AWAY" ? (
              <OrderParcelFlow
                order={order}
                orders={visibleOrders}
                locked={locked}
                canSend={canKitchen}
                error={data.error}
                onRefresh={data.refresh}
                onSelect={data.setActiveId}
                onSend={kitchen}
                onBill={(target) => data.mutate(target, "bill")}
                onReprint={(order, ticket) => setPrintTicket({ order, ticket })}
              />
            ) : serviceMode === "BOOKING" ? (
              <OrderBookingFlow
                order={order}
                orders={visibleOrders}
                locked={locked}
                canSend={canKitchen}
                error={data.error}
                onEdit={() => setBookingEditor({ order })}
                onRefresh={data.refresh}
                onSelect={selectOrder}
                onSend={kitchen}
                onBill={(target) => data.mutate(target, "bill")}
                onReprint={(order, ticket) => setPrintTicket({ order, ticket })}
              />
            ) : undefined
          }
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
      {serviceMode === "KOT" && !kotItems && data.loaded && (
        <>
          {notice && (
            <p role="status" className="qcafe-order-message">
              {notice}
            </p>
          )}
          <OrderFloorEntry
            tables={data.tables}
            menu={data.menu}
            locked={locked}
            lastBill={lastBill}
            onHistory={onHistory}
            onAdd={addFloorItem}
          />
        </>
      )}
      <Dialog
        open={serviceMode === "BOOKING" && !!bookingEditor}
        onOpenChange={(open) => {
          if (!open) setBookingEditor(null);
        }}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{bookingEditor?.order ? "Edit booking" : "New booking"}</DialogTitle>
            <DialogDescription>
              Enter the customer and pickup details before adding items. Pickup uses this device’s
              local time.
            </DialogDescription>
          </DialogHeader>
          {data.error && (
            <p role="alert" className="text-destructive">
              {data.error}
            </p>
          )}
          {bookingEditor && (
            <BookingDetailsForm
              key={bookingEditor.order?.uuid ?? "new"}
              value={bookingEditor.order?.booking ?? null}
              busy={locked}
              onSave={saveBooking}
              onCancel={() => setBookingEditor(null)}
            />
          )}
        </DialogContent>
      </Dialog>
      {order?.tickets.length && (serviceMode !== "KOT" || kotItems) ? (
        <div className="qcafe-kot-reprint">
          <span>{order.tickets.at(-1)?.number}</span>
          <button onClick={() => setPrintTicket({ order, ticket: order.tickets.at(-1)! })}>
            {serviceMode === "BOOKING"
              ? "Reprint last booking ticket"
              : serviceMode === "TAKE AWAY"
                ? "Reprint last parcel ticket"
                : "Reprint last KOT"}
          </button>
        </div>
      ) : null}
      <Dialog
        open={
          serviceMode !== "TAKE AWAY" &&
          serviceMode !== "BOOKING" &&
          assignment &&
          !!assignmentOrder
        }
        onOpenChange={setAssignment}
      >
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
              initialMode={
                defaultAssignment ? (serviceMode === "KOT" ? "KOT" : "POS") : assignmentOrder.mode
              }
              fixedMode={
                serviceMode === "KOT" && !assignmentOrder.tickets.length ? "KOT" : undefined
              }
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
              {printTicket?.ticket.kind === "cancel"
                ? "Cancellation ticket"
                : printTicket?.order.booking
                  ? "Booking preparation ticket"
                  : printTicket?.order.mode === "TAKE AWAY"
                    ? "Parcel ticket"
                    : "Kitchen order"}{" "}
              · {printTicket?.ticket.number}
            </DialogTitle>
            <DialogDescription>
              {printTicket?.order.booking
                ? `${printTicket.order.bookingToken} · ${printTicket.order.booking.customerName} · ${printTicket.order.booking.mobile} · Pickup ${new Date(printTicket.order.booking.pickupAt).toLocaleString("en-GB")}`
                : printTicket?.order.mode === "TAKE AWAY"
                  ? `${printTicket.order.parcelToken} · ${printTicket.order.name}`
                  : `${printTicket?.order.name} · ${printTicket?.order.tableName} · Seats ${printTicket?.order.seats.join(", ")}`}
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
            <Printer size={14} />{" "}
            {printTicket?.order.booking
              ? "Print booking ticket"
              : printTicket?.order.mode === "TAKE AWAY"
                ? "Print parcel ticket"
                : "Print KOT"}
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
