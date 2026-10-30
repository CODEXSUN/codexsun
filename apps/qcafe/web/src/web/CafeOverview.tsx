import { useEffect, useState } from "react";
import { Coffee, UtensilsCrossed, ShoppingBag, CalendarDays } from "lucide-react";
import { Button } from "@codexsun/ui/components/button";
import { listOrders } from "../modules/order/order.services";
import type { CafeOrder } from "../modules/order/order.types";
export function CafeOverview({
  onOpen
}: {
  onOpen: (page: "pos" | "kot" | "take-away" | "booking") => void;
}) {
  const [orders, setOrders] = useState<CafeOrder[]>([]);
  const [error, setError] = useState("");
  useEffect(() => {
    void listOrders()
      .then(setOrders)
      .catch((e) => setError(e instanceof Error ? e.message : "Cannot load overview."));
  }, []);
  const pages = [
    {
      key: "pos",
      title: "POS",
      icon: Coffee,
      description: "Counter billing",
      count: orders.length
    },
    {
      key: "kot",
      title: "KOT",
      icon: UtensilsCrossed,
      description: "Table orders",
      count: orders.filter((o) => !!o.tableUuid).length
    },
    {
      key: "take-away",
      title: "Parcel - Take away",
      icon: ShoppingBag,
      description: "Parcel orders",
      count: orders.filter((o) => o.mode === "TAKE AWAY" && !o.booking).length
    },
    {
      key: "booking",
      title: "Booking",
      icon: CalendarDays,
      description: "Scheduled pickups",
      count: orders.filter((o) => !!o.booking).length
    }
  ] as const;
  return (
    <section className="p-6">
      <h1 className="text-xl font-semibold">Overview</h1>
      <p className="mt-1 text-sm text-muted-foreground">
        Restaurant workspaces and current saved orders.
      </p>
      {error && <p role="alert">{error}</p>}
      <div className="mt-5 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {pages.map((page) => (
          <article key={page.key} className="rounded-xl border bg-card p-5">
            <page.icon size={22} />
            <h2 className="mt-3 font-semibold">{page.title}</h2>
            <p className="text-sm text-muted-foreground">{page.description}</p>
            <p className="my-4 text-sm">
              {page.count} {page.key === "pos" ? "total running orders" : "running orders"}
            </p>
            <Button variant="outline" onClick={() => onOpen(page.key)}>
              Open {page.title}
            </Button>
          </article>
        ))}
      </div>
    </section>
  );
}
