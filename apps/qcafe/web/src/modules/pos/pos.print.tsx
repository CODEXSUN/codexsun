import { useEffect } from "react";
import type { PosBill } from "./pos.types";
export function PosReceipt({ bill, restaurantName }: { bill: PosBill; restaurantName: string }) {
  useEffect(() => {
    document.body.dataset.qcafePrint = "bill";
  }, [bill.uuid]);
  return (
    <section className="qcafe-print-receipt" data-print-kind="bill">
      <h1>{restaurantName}</h1>
      <h2>{bill.number}</h2>
      <p>{new Date(bill.createdAt).toLocaleString("en-GB").replaceAll("/", "-")}</p>
      <p>
        {bill.serviceContext
          ? `${bill.serviceContext.mode} · ${bill.serviceContext.tableName || "Parcel"}${bill.serviceContext.seats.length ? ` · Seats ${bill.serviceContext.seats.join(", ")}` : ""}`
          : "Takeaway"}
      </p>
      <hr />
      {bill.lines.map((line) => (
        <p key={line.menuUuid}>
          {line.name} × {line.quantity} — ₹{(line.amount / 100).toFixed(2)}
        </p>
      ))}
      <hr />
      <p>Total: ₹{(bill.total / 100).toFixed(2)}</p>
      <p>Paid: ₹{(bill.paid / 100).toFixed(2)}</p>
      <p>Due: ₹{((bill.total - bill.paid) / 100).toFixed(2)}</p>
      <p>{bill.status === "paid" ? "PAID" : "PAYMENT DUE"}</p>
      {bill.payments.map((payment) => (
        <p key={payment.uuid}>
          {payment.mode.toUpperCase()} ₹{(payment.amount / 100).toFixed(2)} · {payment.uuid}
          {payment.reference ? ` · ${payment.reference}` : ""}
        </p>
      ))}
    </section>
  );
}
