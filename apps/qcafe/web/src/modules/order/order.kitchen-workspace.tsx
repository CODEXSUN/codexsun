import { useOrders } from "./order.hooks";
import type { CafeOrder } from "./order.types";
import { useEffect, useState } from "react";
import { Button } from "@codexsun/ui/components/button";
import { Input } from "@codexsun/ui/components/input";
import { cloudRequest } from "../../web/transport";
import { listWaiters, type Waiter } from "../waiter";
import { useCafeSettings } from "../settings";
import type { OrderLine } from "./order.types";
type Job = {
  uuid: string;
  number: string;
  orderUuid: string;
  orderName: string;
  tableName: string;
  seats: number[];
  status: "queued" | "ready" | "delivered";
  waiterUuid: string | null;
  printStatus: string;
  printError: string;
  lines: OrderLine[];
};
export function OrderKitchenWorkspace({
  canKitchen,
  canDeliver,
  onBill
}: {
  canKitchen: boolean;
  canDeliver: boolean;
  onBill: (uuid: string) => void;
}) {
  const billing = useOrders(async (order, action) => {
    if (action === "bill" && order.billUuid) {
      onBill(order.billUuid);
    }
  });
  const [jobs, setJobs] = useState<Job[]>([]);
  const [waiters, setWaiters] = useState<Waiter[]>([]);
  const [waiter, setWaiter] = useState("");
  const [scan, setScan] = useState("");
  const [scanVersion, setScanVersion] = useState(0);
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  const { settings } = useCafeSettings();
  async function refresh() {
    try {
      const [items, staff] = await Promise.all([
        cloudRequest<Job[]>("/api/app/qcafe/kitchen"),
        listWaiters()
      ]);
      setJobs(items);
      setWaiters(staff);
      setError("");
      if (canKitchen && items.some((item) => item.printStatus === "pending"))
        await cloudRequest("/api/app/qcafe/kitchen/dispatch", { method: "POST", body: "{}" });
    } catch (e) {
      setError(e instanceof Error ? e.message : "Cannot load kitchen queue.");
    }
  }
  useEffect(() => {
    void refresh();
    const timer = window.setInterval(() => void refresh(), 5000);
    return () => clearInterval(timer);
  }, []);
  async function confirm(token: string, action: "ready" | "delivered") {
    if (busy) return;
    setBusy(true);
    setError("");
    try {
      setJobs(
        await cloudRequest<Job[]>("/api/app/qcafe/kitchen/confirm", {
          method: "POST",
          body: JSON.stringify({
            token,
            action,
            waiterUuid: action === "delivered" ? waiter : null
          })
        })
      );
      setScan("");
      setScanVersion((version) => version + 1);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Cannot confirm token.");
    } finally {
      setBusy(false);
    }
  }
  const queued = jobs.find((job) => job.status === "queued");
  const next = jobs.find((job) => job.status !== "delivered");
  return (
    <section className="qcafe-kitchen-screen">
      <header>
        <h1>Kitchen preparation queue</h1>
        <span>KOT printer: {settings.kotPrinterTarget}</span>
        <Button variant="outline" onClick={() => void refresh()}>
          Refresh queue
        </Button>
      </header>
      <form
        key={scanVersion}
        className="flex flex-wrap gap-3"
        onSubmit={(e) => {
          e.preventDefault();
          const job = jobs.find(
            (row) => row.uuid === scan.trim() || row.number === scan.trim().toUpperCase()
          );
          if (!job) {
            setError("Scan or enter a current kitchen token.");
            return;
          }
          void confirm(job.number, job.status === "queued" ? "ready" : "delivered");
        }}
      >
        <label>
          Waiter
          <select
            aria-label="Delivery waiter"
            value={waiter}
            onChange={(e) => setWaiter(e.target.value)}
          >
            <option value="">Select waiter</option>
            {waiters
              .filter((row) => row.status === "active")
              .map((row) => (
                <option key={row.uuid} value={row.uuid}>
                  {row.code} · {row.name}
                </option>
              ))}
          </select>
        </label>
        <label>
          Scan kitchen token
          <Input
            aria-label="Scan kitchen token"
            placeholder="KOT-000001"
            value={scan}
            onChange={(e) => setScan(e.target.value)}
          />
        </label>
        <Button disabled={busy}>Confirm scan</Button>
      </form>
      {(error || billing.error) && (
        <p role="alert" className="text-destructive">
          {error || billing.error}
        </p>
      )}
      {billing.pending && (
        <Button disabled={billing.busy} onClick={() => void billing.retry()}>
          Retry same bill operation
        </Button>
      )}
      <div className="qcafe-kitchen-queue">
        {jobs.map((job) => (
          <article key={job.uuid} data-status={job.status}>
            <header>
              <strong>{job.number}</strong>
              <b>{job.status}</b>
            </header>
            <p>
              {job.tableName} · Chairs {job.seats.join(", ")} · {job.orderName}
            </p>
            {job.lines.map((line) => (
              <p key={line.menuUuid} className="flex justify-between">
                <span>{line.name}</span>
                <b>× {line.quantity}</b>
              </p>
            ))}
            <p>Printer: {job.printStatus}</p>
            {job.printError && <p className="text-destructive">{job.printError}</p>}
            <footer>
              {job.status === "queued" ? (
                <Button
                  disabled={busy || !canKitchen || queued?.uuid !== job.uuid}
                  onClick={() => void confirm(job.number, "ready")}
                >
                  Ready for waiter
                </Button>
              ) : job.status === "ready" ? (
                <Button
                  disabled={busy || !canDeliver || !waiter || next?.uuid !== job.uuid}
                  onClick={() => void confirm(job.number, "delivered")}
                >
                  Confirm delivered
                </Button>
              ) : (
                <div className="flex flex-wrap items-center gap-2">
                  <Button
                    disabled={
                      !canDeliver ||
                      billing.busy ||
                      !!billing.pending ||
                      jobs.some(
                        (row) => row.orderUuid === job.orderUuid && row.status !== "delivered"
                      )
                    }
                    onClick={() => {
                      void cloudRequest<CafeOrder>(`/api/app/qcafe/orders/${job.orderUuid}`)
                        .then((order) => billing.mutate(order, "bill"))
                        .catch((e) =>
                          setError(e instanceof Error ? e.message : "Cannot open bill.")
                        );
                    }}
                  >
                    Get customer bill
                  </Button>
                  <span>
                    Delivered ·{" "}
                    {waiters.find((row) => row.uuid === job.waiterUuid)?.name || "Previous service"}
                  </span>
                </div>
              )}
            </footer>
          </article>
        ))}
      </div>
      {!jobs.length && <p>No kitchen orders. Send a table order from KOT.</p>}
    </section>
  );
}
