import { useEffect } from "react";
import type { CafeOrder, KitchenTicket } from "./order.types";
export function KitchenPrint({
  order,
  ticket,
  restaurantName
}: {
  order: CafeOrder;
  ticket: KitchenTicket;
  restaurantName: string;
}) {
  useEffect(() => {
    document.body.dataset.qcafePrint = "kot";
  }, [ticket.uuid]);
  return (
    <section className="qcafe-print-receipt" data-print-kind="kot">
      <h1>{restaurantName}</h1>
      <h2>
        {ticket.kind === "cancel"
          ? "CANCEL TICKET"
          : order.booking
            ? "BOOKING PREPARATION"
            : order.mode === "TAKE AWAY"
              ? "PARCEL TICKET"
              : "KITCHEN ORDER"}{" "}
        · {ticket.number}
      </h2>
      <p>{new Date(ticket.createdAt).toLocaleString("en-GB")}</p>
      {order.booking && (
        <>
          <p>Booking: {order.bookingToken}</p>
          <p>
            {order.booking.customerName} · {order.booking.mobile}
          </p>
          <p>Pickup: {new Date(order.booking.pickupAt).toLocaleString("en-GB")}</p>
        </>
      )}
      {order.parcelToken && <p>Parcel token: {order.parcelToken}</p>}
      <p>
        {order.name} ·{" "}
        {order.booking ? "Booking" : order.mode === "TAKE AWAY" ? "Parcel - Take away" : order.mode}
      </p>
      <p>
        {order.tableName
          ? `Table ${order.tableName} · Seats ${order.seats.join(", ")}`
          : order.booking
            ? "Scheduled pickup"
            : "Parcel - Take away"}
      </p>
      <hr />
      {ticket.lines.map((line) => (
        <p key={line.menuUuid}>
          {line.name} × {line.quantity}
        </p>
      ))}
      <hr />
      <p>
        Ticket {ticket.uuid} · Order {order.uuid}
      </p>
    </section>
  );
}
