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
        {ticket.kind === "cancel" ? "CANCEL KOT" : "KITCHEN ORDER"} · {ticket.number}
      </h2>
      <p>{new Date(ticket.createdAt).toLocaleString("en-GB")}</p>
      <p>
        {order.name} · {order.mode}
      </p>
      <p>
        {order.tableName
          ? `Table ${order.tableName} · Seats ${order.seats.join(", ")}`
          : "Take away"}
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
