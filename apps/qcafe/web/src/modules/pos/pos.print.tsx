import { useEffect } from "react";
import type { PosBill } from "./pos.types";
export function PosReceipt({ bill, restaurantName }: { bill: PosBill; restaurantName: string }) {
  useEffect(() => {
    document.body.dataset.qcafePrint = "bill";
  }, [bill.uuid]);
  const receipt = bill.receiptContext;
  return (
    <section
      className="qcafe-print-receipt"
      data-print-kind="bill"
      style={{ width: receipt?.receiptWidth ?? "80mm", maxWidth: "100%" }}
    >
      <h1>{receipt?.restaurantName || restaurantName}</h1>
      {receipt?.branchName && <p>{receipt.branchName}</p>}
      {receipt?.showReceiptContact && (
        <>
          <p>{receipt.address}</p>
          <p>{receipt.contactNumber}</p>
        </>
      )}
      {receipt?.gstin && <p>GSTIN: {receipt.gstin}</p>}
      {receipt?.fssai && <p>FSSAI: {receipt.fssai}</p>}
      {receipt?.receiptHeader && <p>{receipt.receiptHeader}</p>}
      <h2>{bill.number}</h2>
      {bill.serviceContext?.booking && (
        <>
          <p>Booking: {bill.serviceContext.booking.token}</p>
          <p>
            {bill.serviceContext.booking.customerName} · {bill.serviceContext.booking.mobile}
          </p>
          <p>Pickup: {new Date(bill.serviceContext.booking.pickupAt).toLocaleString("en-GB")}</p>
        </>
      )}
      {bill.serviceContext?.parcelToken && <p>Parcel token: {bill.serviceContext.parcelToken}</p>}
      <p>{new Date(bill.createdAt).toLocaleString("en-GB").replaceAll("/", "-")}</p>
      <p>
        {bill.serviceContext?.booking
          ? "Booking · Scheduled pickup"
          : bill.serviceContext
            ? `${bill.serviceContext.mode === "TAKE AWAY" ? "Parcel - Take away" : bill.serviceContext.mode} · ${bill.serviceContext.tableName || "Parcel"}${bill.serviceContext.seats.length ? ` · Seats ${bill.serviceContext.seats.join(", ")}` : ""}`
            : "Parcel - Take away"}
      </p>
      <hr />
      {bill.lines.map((line) => (
        <p key={line.menuUuid}>
          {line.name} × {line.quantity} — ₹{(line.amount / 100).toFixed(2)}
        </p>
      ))}
      <hr />
      {!!receipt?.gstRate && (
        <>
          <p>Net: ₹{(receipt.netAmount / 100).toFixed(2)}</p>
          <p>
            GST included ({receipt.gstRate}%): ₹{(receipt.taxAmount / 100).toFixed(2)}
          </p>
        </>
      )}
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
      {receipt?.receiptFooter && <p>{receipt.receiptFooter}</p>}
      {receipt?.receiptLegalNote && <p>{receipt.receiptLegalNote}</p>}
    </section>
  );
}
