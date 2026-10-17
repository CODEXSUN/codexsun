import { useEffect, useState } from "react";
import { Button } from "@codexsun/ui/components/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription
} from "@codexsun/ui/components/dialog";
import { WorkspaceFormBanner } from "@codexsun/ui/workspace/upsert";
import { useCafeSettings } from "../settings";
import { useMenu } from "../menu";
import { usePosBills } from "./pos.hooks";
import { OrderWorkspace } from "../order";
import { PosList } from "./pos.list";
import { PosPaymentForm } from "./pos.form";
import { PosReceipt } from "./pos.print";
import { getPosBill, collectPosPayment } from "./pos.services";
import { CloudApiError } from "../../web/transport";
import type { PosBill, PaymentInput } from "./pos.types";

export function PosWorkspace({
  canCreate,
  canPay,
  canKitchen,
  canManageTables,
  restaurantName,
  active = true,
  serviceMode
}: {
  canCreate: boolean;
  canPay: boolean;
  canKitchen: boolean;
  canManageTables: boolean;
  restaurantName: string;
  active?: boolean;
  serviceMode: "POS" | "KOT" | "TAKE AWAY" | "BOOKING";
}) {
  const menu = useMenu();
  const preferences = useCafeSettings();
  const history = usePosBills();
  const [view, setView] = useState<"sale" | "history">("sale");
  const [selected, setSelected] = useState<PosBill | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");
  useEffect(() => {
    setView("sale");
  }, [serviceMode]);
  const [printSaved, setPrintSaved] = useState(false);
  useEffect(() => {
    if (!selected || !printSaved) return;
    const frame = requestAnimationFrame(() =>
      requestAnimationFrame(() => {
        document.body.dataset.qcafePrint = "bill";
        window.print();
        setPrintSaved(false);
      })
    );
    return () => cancelAnimationFrame(frame);
  }, [selected, printSaved]);
  async function saved(uuid: string, print: boolean) {
    const bill = await getPosBill(uuid);
    history.remember(bill);
    setSelected(bill);
    setPrintSaved(print);
    setNotice(`Bill ${bill.number} saved.`);
  }
  async function pay(input: PaymentInput) {
    if (!selected) return false;
    setBusy(true);
    setError("");
    try {
      const bill = await collectPosPayment(selected.uuid, input);
      history.remember(bill);
      setSelected(bill);
      if (preferences.settings.autoPrintBill && bill.status === "paid") setPrintSaved(true);
      setNotice("Payment recorded.");
      return true;
    } catch (error) {
      setError(error instanceof Error ? error.message : "Payment could not be recorded.");
      if (error instanceof CloudApiError && error.status < 500) throw error;
      return false;
    } finally {
      setBusy(false);
    }
  }
  const pageError = menu.error || history.error || error;
  return (
    <section className="min-w-0">
      {view === "history" && (
        <div className="flex justify-end gap-2 px-3 pt-2">
          <div className="flex gap-2">
            <Button variant="outline" onClick={() => setView("sale")}>
              New sale
            </Button>
            <Button
              variant={view === "history" ? "default" : "outline"}
              onClick={() => setView("history")}
            >
              Recent bills
            </Button>
            <Button
              variant="outline"
              disabled={busy || menu.loading || history.loading}
              onClick={() => {
                void menu.refresh();
                void history.refresh();
              }}
            >
              Refresh
            </Button>
          </div>
        </div>
      )}
      {pageError && (
        <WorkspaceFormBanner title="Unable to continue" tone="error">
          {pageError}
        </WorkspaceFormBanner>
      )}
      {notice && view === "history" && (
        <p role="status" className="text-sm text-emerald-700">
          {notice}
        </p>
      )}
      {!canCreate && (
        <p className="text-sm text-muted-foreground">
          Your Platform role allows viewing bills. Ask an administrator for billing access.
        </p>
      )}
      <div className={view === "sale" ? "" : "hidden"}>
        {menu.loading && <p role="status">Loading restaurant menu…</p>}
        <OrderWorkspace
          serviceMode={serviceMode}
          canCreate={canCreate}
          canKitchen={canKitchen}
          canManageTables={canManageTables}
          restaurantName={restaurantName}
          active={active && view === "sale"}
          onBillSaved={saved}
          lastBill={history.bills[0]}
          onHistory={() => setView("history")}
        />
      </div>
      {view === "history" &&
        (history.loading ? (
          <p role="status">Loading bills…</p>
        ) : history.bills.length ? (
          <>
            <p className="text-sm text-muted-foreground">
              Latest 50 bills. Financial records cannot be edited or deleted.
            </p>
            <PosList
              bills={history.bills}
              onSelect={(bill) => {
                setSelected(bill);
                setError("");
              }}
            />
          </>
        ) : (
          <p className="py-16 text-center text-muted-foreground">No saved bills yet.</p>
        ))}
      <Dialog
        open={!!selected}
        onOpenChange={(open) => {
          if (!open && !busy) setSelected(null);
        }}
      >
        <DialogContent className="max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{selected?.number}</DialogTitle>
            <DialogDescription>
              Saved bill and payment ledger. Amounts are in rupees.
            </DialogDescription>
          </DialogHeader>
          {selected && (
            <>
              {selected.serviceContext && (
                <p className="text-sm text-muted-foreground">
                  {selected.serviceContext.mode} · {selected.serviceContext.tableName || "Parcel"}
                  {selected.serviceContext.seats.length
                    ? ` · Seats ${selected.serviceContext.seats.join(", ")}`
                    : ""}
                </p>
              )}
              <div className="grid gap-2">
                {selected.lines.map((line) => (
                  <div key={line.menuUuid} className="flex justify-between gap-4 text-sm">
                    <span>
                      {line.name} × {line.quantity}
                    </span>
                    <span>₹{(line.amount / 100).toFixed(2)}</span>
                  </div>
                ))}
                <div className="flex justify-between border-t pt-3 font-semibold">
                  <span>Total</span>
                  <span>₹{(selected.total / 100).toFixed(2)}</span>
                </div>
              </div>
              {error && (
                <WorkspaceFormBanner title="Unable to continue" tone="error">
                  {error}
                </WorkspaceFormBanner>
              )}
              <PosPaymentForm
                key={`${selected.uuid}:${selected.paid}`}
                bill={selected}
                busy={busy}
                canPay={canPay}
                onPay={pay}
              />
              {selected.payments.map((payment) => (
                <p key={payment.uuid} className="text-sm">
                  {payment.mode.toUpperCase()} · ₹{(payment.amount / 100).toFixed(2)} ·{" "}
                  {payment.uuid}
                </p>
              ))}
              <Button
                variant="outline"
                onClick={() => {
                  document.body.dataset.qcafePrint = "bill";
                  window.print();
                }}
              >
                Print {selected.status === "paid" ? "receipt" : "unpaid bill"}
              </Button>
            </>
          )}
        </DialogContent>
      </Dialog>
      {selected && <PosReceipt bill={selected} restaurantName={restaurantName} />}
    </section>
  );
}
