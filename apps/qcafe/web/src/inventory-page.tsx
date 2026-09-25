import { Badge } from "@codexsun/ui/components/badge";
import { Button } from "@codexsun/ui/components/button";
import { Field } from "@codexsun/ui/components/field";
import { Input } from "@codexsun/ui/components/input";
import { NativeSelect, NativeSelectOption } from "@codexsun/ui/components/native-select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@codexsun/ui/components/table";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useEffect, useState } from "react";
import { readFoundationSetup } from "./foundation-setup-api";
import { changeInventory, readInventory, type InventoryWorkspace } from "./inventory-api";
import { readMenu } from "./menu-api";

type Mode = "stock" | "recipes" | "plans" | "procurement" | "consumption";
type Sender = (path: string, input?: Record<string, unknown>) => void;

export function InventoryPage({ request }: { request: typeof fetch }) {
  const client = useQueryClient();
  const setup = useQuery({ queryKey: ["qcafe", "foundation", "setup"], queryFn: () => readFoundationSetup(request) });
  const business = setup.data?.businesses[0];
  const [locationId, setLocationId] = useState("");
  const [mode, setMode] = useState<Mode>("stock");
  useEffect(() => {
    if (!locationId && business?.locations[0]) setLocationId(business.locations[0].id);
  }, [business, locationId]);
  const key = ["qcafe", "inventory", business?.id, locationId] as const;
  const inventory = useQuery({
    enabled: Boolean(business && locationId),
    queryKey: key,
    queryFn: () => readInventory(request, business!.id, locationId),
  });
  const menu = useQuery({
    enabled: Boolean(business),
    queryKey: ["qcafe", "menu", business?.id],
    queryFn: () => readMenu(request, business!.id),
  });
  const change = useMutation({
    mutationFn: ({ input, path }: { input?: Record<string, unknown>; path: string }) => changeInventory(request, path, input),
    onSuccess: async () => {
      await client.invalidateQueries({ queryKey: key });
    },
  });
  if (!business) return <p className="text-sm text-muted-foreground">Create the business and outlet first.</p>;
  const data = inventory.data;
  const send: Sender = (path, input) => change.mutate({ input, path });
  const scope = { businessId: business.id, locationId };
  return (
    <div className="grid gap-6">
      <div className="flex flex-wrap items-center justify-between gap-3 border-b pb-4">
        <NativeSelect aria-label="Outlet" value={locationId} onChange={(event) => setLocationId(event.currentTarget.value)}>
          {business.locations.map((item) => (
            <NativeSelectOption key={item.id} value={item.id}>
              {item.name}
            </NativeSelectOption>
          ))}
        </NativeSelect>
        <div className="flex flex-wrap gap-2">
          <Badge>{data?.items.filter((item) => item.active).length ?? 0} tracked items</Badge>
          <Badge variant="outline">{data?.reservations.filter((item) => item.status === "active").length ?? 0} active holds</Badge>
        </div>
      </div>
      <nav aria-label="Inventory views" className="flex flex-wrap gap-1 border-b pb-3">
        {(["stock", "recipes", "plans", "procurement", "consumption"] as const).map((item) => (
          <Button key={item} onClick={() => setMode(item)} size="sm" variant={mode === item ? "default" : "ghost"}>
            {item}
          </Button>
        ))}
      </nav>
      {mode === "stock" ? <StockPanel data={data} scope={scope} send={send} /> : null}
      {mode === "recipes" ? <RecipePanel businessId={business.id} data={data} menu={menu.data} scope={scope} send={send} /> : null}
      {mode === "plans" ? <PlanPanel businessId={business.id} data={data} menu={menu.data} scope={scope} send={send} /> : null}
      {mode === "procurement" ? <ProcurementPanel data={data} scope={scope} send={send} /> : null}
      {mode === "consumption" ? <ConsumptionPanel businessId={business.id} data={data} menu={menu.data} scope={scope} send={send} /> : null}
      {change.isPending ? <p className="text-sm text-muted-foreground">Recording stock change...</p> : null}
      {change.error ? <p className="text-sm text-destructive">{change.error.message}</p> : null}
    </div>
  );
}

function StockPanel({ data, scope, send }: { data?: InventoryWorkspace; scope: { businessId: string; locationId: string }; send: Sender }) {
  const balanceOf = (stockItemId: string) => data?.balances.find((entry) => entry.stockItemId === stockItemId)?.quantityMilli ?? 0;
  return (
    <div className="grid gap-6">
      <section className="grid gap-3">
        <h2 className="text-sm font-semibold">Stock on hand</h2>
        <Table className="min-w-[640px]">
          <TableHeader>
            <TableRow>
              <TableHead>Item</TableHead>
              <TableHead>Unit</TableHead>
              <TableHead>On hand</TableHead>
              <TableHead>Reorder at</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {(data?.items ?? []).map((item) => (
              <TableRow key={item.id}>
                <TableCell>
                  <div className="font-medium">{item.name}</div>
                  <div className="text-xs text-muted-foreground">{item.code}</div>
                </TableCell>
                <TableCell>{data?.units.find((unit) => unit.id === item.unit_id)?.code ?? "-"}</TableCell>
                <TableCell>{(balanceOf(item.id) / 1000).toFixed(3)}</TableCell>
                <TableCell>{(item.reorder_level_milli / 1000).toFixed(3)}</TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </section>
      <form
        className="grid max-w-xl gap-3"
        onSubmit={(event) => {
          event.preventDefault();
          const form = new FormData(event.currentTarget);
          send("adjustments", {
            ...scope,
            approvedBy: String(form.get("approvedBy") ?? "").trim() || undefined,
            lines: [{ quantityMilli: Math.round(Number(form.get("quantity")) * 1000), stockItemId: form.get("stockItemId") }],
            reason: form.get("reason"),
          });
          event.currentTarget.reset();
        }}
      >
        <h2 className="text-sm font-semibold">Record adjustment</h2>
        <Field label="Item" htmlFor="inventory-adjust-item">
          <NativeSelect className="w-full" id="inventory-adjust-item" name="stockItemId" required>
            {(data?.items ?? []).map((item) => (
              <NativeSelectOption key={item.id} value={item.id}>
                {item.name}
              </NativeSelectOption>
            ))}
          </NativeSelect>
        </Field>
        <Field label="Quantity (negative reduces stock)" htmlFor="inventory-adjust-quantity">
          <Input id="inventory-adjust-quantity" name="quantity" required type="number" step="0.001" />
        </Field>
        <Field label="Reason" htmlFor="inventory-adjust-reason">
          <Input id="inventory-adjust-reason" name="reason" required placeholder="Count correction" />
        </Field>
        <Field label="Approver (required for reductions)" htmlFor="inventory-adjust-approver">
          <Input id="inventory-adjust-approver" name="approvedBy" placeholder="owner-1" />
        </Field>
        <Button className="w-fit" type="submit" variant="outline">
          Post adjustment
        </Button>
      </form>
      <section className="grid gap-3">
        <h2 className="text-sm font-semibold">Ledger movements</h2>
        <Table className="min-w-[640px]">
          <TableHeader>
            <TableRow>
              <TableHead>When</TableHead>
              <TableHead>Type</TableHead>
              <TableHead>Quantity</TableHead>
              <TableHead>Source</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {(data?.movements ?? []).slice(0, 25).map((movement) => (
              <TableRow key={movement.id}>
                <TableCell>{movement.occurred_at}</TableCell>
                <TableCell>
                  <Badge variant="outline">{movement.movement_type}</Badge>
                </TableCell>
                <TableCell>{(movement.quantity_milli / 1000).toFixed(3)}</TableCell>
                <TableCell className="text-xs text-muted-foreground">
                  {movement.source_type} · {movement.source_id.slice(0, 8)}
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </section>
      <form
        className="grid max-w-xl gap-3"
        onSubmit={(event) => {
          event.preventDefault();
          const form = new FormData(event.currentTarget);
          send("reservations", {
            ...scope,
            quantityMilli: Math.round(Number(form.get("quantity")) * 1000),
            sourceId: String(form.get("sourceId") ?? "").trim(),
            sourceType: form.get("sourceType"),
            stockItemId: form.get("stockItemId"),
          });
          event.currentTarget.reset();
        }}
      >
        <h2 className="text-sm font-semibold">Reserve stock</h2>
        <Field label="Item" htmlFor="inventory-reserve-item">
          <NativeSelect className="w-full" id="inventory-reserve-item" name="stockItemId" required>
            {(data?.items ?? []).map((item) => (
              <NativeSelectOption key={item.id} value={item.id}>
                {item.name}
              </NativeSelectOption>
            ))}
          </NativeSelect>
        </Field>
        <Field label="Source" htmlFor="inventory-reserve-source">
          <NativeSelect className="w-full" id="inventory-reserve-source" name="sourceType" required>
            <NativeSelectOption value="event">Event</NativeSelectOption>
            <NativeSelectOption value="daily_plan">Daily plan</NativeSelectOption>
            <NativeSelectOption value="special">Special</NativeSelectOption>
            <NativeSelectOption value="order">Order</NativeSelectOption>
          </NativeSelect>
        </Field>
        <Field label="Source reference" htmlFor="inventory-reserve-ref">
          <Input id="inventory-reserve-ref" name="sourceId" required placeholder="EVT-101" />
        </Field>
        <Field label="Quantity" htmlFor="inventory-reserve-quantity">
          <Input id="inventory-reserve-quantity" name="quantity" required type="number" min="0" step="0.001" />
        </Field>
        <Button className="w-fit" type="submit" variant="outline">
          Hold stock
        </Button>
      </form>
      {(data?.reservations ?? [])
        .filter((reservation) => reservation.status === "active")
        .map((reservation) => (
          <div className="flex flex-wrap items-center gap-3 border-b py-2 text-sm" key={reservation.id}>
            <Badge variant="secondary">hold</Badge>
            <span>
              {(reservation.quantity_milli / 1000).toFixed(3)} for {reservation.source_type} {reservation.source_id}
            </span>
            <Button size="sm" variant="ghost" onClick={() => send(`reservations/${reservation.id}/release`)}>
              Release
            </Button>
            <Button size="sm" variant="ghost" onClick={() => send(`reservations/${reservation.id}/consume`)}>
              Consume
            </Button>
          </div>
        ))}
    </div>
  );
}

function RecipePanel({ businessId, data, menu, scope, send }: { businessId: string; data?: InventoryWorkspace; menu?: { items: Array<{ id: string; name: string; variants: Array<{ id: string; name: string }> }> }; scope: { businessId: string; locationId: string }; send: Sender }) {
  return (
    <div className="grid gap-6">
      <form
        className="grid max-w-xl gap-3"
        onSubmit={(event) => {
          event.preventDefault();
          const form = new FormData(event.currentTarget);
          send("recipes", {
            ...scope,
            code: form.get("code"),
            components: [{ quantityMilli: Math.round(Number(form.get("componentQuantity")) * 1000), stockItemId: form.get("stockItemId") }],
            effectiveFrom: form.get("effectiveFrom"),
            menuItemId: form.get("menuItemId"),
            menuVariantId: String(form.get("menuVariantId") ?? "").trim() || undefined,
            name: form.get("name"),
          });
          event.currentTarget.reset();
        }}
      >
        <h2 className="text-sm font-semibold">New recipe</h2>
        <Field label="Code" htmlFor="inventory-recipe-code"><Input id="inventory-recipe-code" name="code" required placeholder="MEAL-STD" /></Field>
        <Field label="Name" htmlFor="inventory-recipe-name"><Input id="inventory-recipe-name" name="name" required placeholder="Standard meal" /></Field>
        <Field label="Menu item" htmlFor="inventory-recipe-item">
          <NativeSelect className="w-full" id="inventory-recipe-item" name="menuItemId" required>
            {(menu?.items ?? []).map((item) => (
              <NativeSelectOption key={item.id} value={item.id}>
                {item.name}
              </NativeSelectOption>
            ))}
          </NativeSelect>
        </Field>
        <Field label="Effective from" htmlFor="inventory-recipe-from"><Input id="inventory-recipe-from" name="effectiveFrom" required type="date" /></Field>
        <Field label="Component item" htmlFor="inventory-recipe-component">
          <NativeSelect className="w-full" id="inventory-recipe-component" name="stockItemId" required>
            {(data?.items ?? []).map((item) => (
              <NativeSelectOption key={item.id} value={item.id}>
                {item.name}
              </NativeSelectOption>
            ))}
          </NativeSelect>
        </Field>
        <Field label="Component quantity" htmlFor="inventory-recipe-quantity"><Input id="inventory-recipe-quantity" name="componentQuantity" required type="number" min="0" step="0.001" /></Field>
        <Button className="w-fit" type="submit" variant="outline">
          Create recipe
        </Button>
      </form>
      <section className="grid gap-3">
        <h2 className="text-sm font-semibold">Recipes</h2>
        <Table className="min-w-[640px]">
          <TableHeader>
            <TableRow>
              <TableHead>Code</TableHead>
              <TableHead>Revision</TableHead>
              <TableHead>Effective</TableHead>
              <TableHead>Status</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {(data?.recipes ?? []).map((recipe) => (
              <TableRow key={recipe.id}>
                <TableCell>
                  <div className="font-medium">{recipe.code}</div>
                  <div className="text-xs text-muted-foreground">{recipe.name}</div>
                </TableCell>
                <TableCell>r{recipe.revision_no}</TableCell>
                <TableCell className="text-xs">{recipe.effective_from}{recipe.effective_to ? ` → ${recipe.effective_to}` : ""}</TableCell>
                <TableCell>
                  <Badge variant={recipe.status === "active" ? "default" : "secondary"}>{recipe.status}</Badge>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </section>
      <p className="max-w-2xl text-xs leading-5 text-muted-foreground">
        Revisions with new effective dates, daily plans, purchase orders, counts, waste events, and sale consumption run through the same workspace API. Business key: {businessId}.
      </p>
    </div>
  );
}

function PlanPanel({ businessId, data, menu, scope, send }: { businessId: string; data?: InventoryWorkspace; menu?: { items: Array<{ id: string; name: string }> }; scope: { businessId: string; locationId: string }; send: Sender }) {
  return (
    <div className="grid gap-6">
      <form
        className="grid max-w-xl gap-3"
        onSubmit={(event) => {
          event.preventDefault();
          const form = new FormData(event.currentTarget);
          send("daily-plans", { ...scope, note: String(form.get("note") ?? "").trim() || undefined, planDate: form.get("planDate") });
          event.currentTarget.reset();
        }}
      >
        <h2 className="text-sm font-semibold">New daily plan</h2>
        <Field label="Plan date" htmlFor="inventory-plan-date"><Input id="inventory-plan-date" name="planDate" required type="date" /></Field>
        <Field label="Note" htmlFor="inventory-plan-note"><Input id="inventory-plan-note" name="note" placeholder="Weekday service" /></Field>
        <Button className="w-fit" type="submit" variant="outline">
          Create plan
        </Button>
      </form>
      {(data?.plans ?? []).map((plan) => (
        <section className="grid gap-3 border-t pt-4" key={plan.id}>
          <div className="flex flex-wrap items-center gap-3">
            <h3 className="text-sm font-semibold">{plan.plan_date}</h3>
            <Badge variant={plan.status === "confirmed" ? "default" : "secondary"}>{plan.status}</Badge>
            {plan.status === "draft" ? (
              <Button size="sm" variant="outline" onClick={() => send(`daily-plans/${plan.id}/confirm`)}>
                Confirm
              </Button>
            ) : null}
          </div>
          <form
            className="grid max-w-xl gap-3"
            onSubmit={(event) => {
              event.preventDefault();
              const form = new FormData(event.currentTarget);
              send(`daily-plans/${plan.id}/lines`, {
                demandRef: String(form.get("demandRef") ?? "").trim() || undefined,
                demandSource: form.get("demandSource"),
                menuItemId: form.get("menuItemId"),
                quantityMilli: Math.round(Number(form.get("quantity")) * 1000),
              });
              event.currentTarget.reset();
            }}
          >
            <Field label="Demand source" htmlFor={`inventory-line-source-${plan.id}`}>
              <NativeSelect className="w-full" id={`inventory-line-source-${plan.id}`} name="demandSource" required>
                <NativeSelectOption value="regular">Regular</NativeSelectOption>
                <NativeSelectOption value="special">Special</NativeSelectOption>
                <NativeSelectOption value="booking">Booking</NativeSelectOption>
                <NativeSelectOption value="event">Event</NativeSelectOption>
              </NativeSelect>
            </Field>
            <Field label="Menu item" htmlFor={`inventory-line-item-${plan.id}`}>
              <NativeSelect className="w-full" id={`inventory-line-item-${plan.id}`} name="menuItemId" required>
                {(menu?.items ?? []).map((item) => (
                  <NativeSelectOption key={item.id} value={item.id}>
                    {item.name}
                  </NativeSelectOption>
                ))}
              </NativeSelect>
            </Field>
            <Field label="Quantity" htmlFor={`inventory-line-quantity-${plan.id}`}><Input id={`inventory-line-quantity-${plan.id}`} name="quantity" required type="number" min="0" step="0.001" /></Field>
            <Button className="w-fit" type="submit" variant="outline">
              Add line
            </Button>
          </form>
          {(data?.planLines ?? [])
            .filter((line) => line.plan_id === plan.id)
            .map((line) => (
              <p className="text-sm text-muted-foreground" key={line.id}>
                {line.demand_source} · {(line.quantity_milli / 1000).toFixed(3)}
                {line.demand_ref ? ` · ${line.demand_ref}` : ""}
              </p>
            ))}
        </section>
      ))}
      <p className="max-w-2xl text-xs leading-5 text-muted-foreground">Business key: {businessId}.</p>
    </div>
  );
}

function ProcurementPanel({ data, scope, send }: { data?: InventoryWorkspace; scope: { businessId: string; locationId: string }; send: Sender }) {
  return (
    <div className="grid gap-6">
      <form
        className="grid max-w-xl gap-3"
        onSubmit={(event) => {
          event.preventDefault();
          const form = new FormData(event.currentTarget);
          send("purchase-orders", {
            ...scope,
            lines: [{ quantityMilli: Math.round(Number(form.get("quantity")) * 1000), stockItemId: form.get("stockItemId"), unitPriceMinor: Math.round(Number(form.get("unitPrice") || 0) * 100) }],
            supplierRef: String(form.get("supplierRef") ?? "").trim() || undefined,
          });
          event.currentTarget.reset();
        }}
      >
        <h2 className="text-sm font-semibold">New purchase order</h2>
        <Field label="Item" htmlFor="inventory-po-item">
          <NativeSelect className="w-full" id="inventory-po-item" name="stockItemId" required>
            {(data?.items ?? []).map((item) => (
              <NativeSelectOption key={item.id} value={item.id}>
                {item.name}
              </NativeSelectOption>
            ))}
          </NativeSelect>
        </Field>
        <Field label="Quantity" htmlFor="inventory-po-quantity"><Input id="inventory-po-quantity" name="quantity" required type="number" min="0" step="0.001" /></Field>
        <Field label="Unit price" htmlFor="inventory-po-price"><Input id="inventory-po-price" name="unitPrice" type="number" min="0" step="0.01" placeholder="0.00" /></Field>
        <Field label="Supplier reference" htmlFor="inventory-po-supplier"><Input id="inventory-po-supplier" name="supplierRef" placeholder="SUP-1" /></Field>
        <Button className="w-fit" type="submit" variant="outline">
          Create order
        </Button>
      </form>
      {(data?.purchaseOrders ?? []).map((order) => (
        <section className="grid gap-3 border-t pt-4" key={order.id}>
          <div className="flex flex-wrap items-center gap-3">
            <h3 className="text-sm font-semibold">{order.supplier_ref ?? "Purchase order"}</h3>
            <Badge variant={order.status === "received" ? "default" : "secondary"}>{order.status}</Badge>
            {order.status === "draft" ? (
              <Button size="sm" variant="outline" onClick={() => send(`purchase-orders/${order.id}/send`)}>
                Send
              </Button>
            ) : null}
          </div>
          {(data?.purchaseOrderLines ?? [])
            .filter((line) => line.po_id === order.id)
            .map((line) => (
              <form
                className="flex flex-wrap items-end gap-3 text-sm"
                key={line.id}
                onSubmit={(event) => {
                  event.preventDefault();
                  const form = new FormData(event.currentTarget);
                  send(`purchase-orders/${order.id}/receipts`, {
                    lines: [{ lotCode: String(form.get("lotCode") ?? "").trim() || undefined, poLineId: line.id, quantityMilli: Math.round(Number(form.get("quantity")) * 1000), unitPriceMinor: Math.round(Number(form.get("unitPrice") || 0) * 100) }],
                  });
                  event.currentTarget.reset();
                }}
              >
                <span className="text-muted-foreground">
                  {(line.quantity_milli / 1000).toFixed(3)} ordered · {(line.received_milli / 1000).toFixed(3)} received
                </span>
                <Field label="Receive quantity" htmlFor={`inventory-receive-${line.id}`}><Input id={`inventory-receive-${line.id}`} name="quantity" required type="number" min="0" step="0.001" /></Field>
                <Field label="Unit price" htmlFor={`inventory-receive-price-${line.id}`}><Input id={`inventory-receive-price-${line.id}`} name="unitPrice" type="number" min="0" step="0.01" placeholder="Falls back to order price" /></Field>
                <Field label="Lot code" htmlFor={`inventory-lot-${line.id}`}><Input id={`inventory-lot-${line.id}`} name="lotCode" placeholder="LOT-A" /></Field>
                <Button size="sm" type="submit" variant="outline">
                  Receive
                </Button>
              </form>
            ))}
        </section>
      ))}
      <form
        className="grid max-w-xl gap-3"
        onSubmit={(event) => {
          event.preventDefault();
          const form = new FormData(event.currentTarget);
          send("counts", {
            ...scope,
            approvedBy: String(form.get("approvedBy") ?? "").trim() || undefined,
            lines: [{ countedMilli: Math.round(Number(form.get("counted")) * 1000), stockItemId: form.get("stockItemId") }],
            reason: form.get("reason"),
          });
          event.currentTarget.reset();
        }}
      >
        <h2 className="text-sm font-semibold">Submit stock count</h2>
        <Field label="Item" htmlFor="inventory-count-item">
          <NativeSelect className="w-full" id="inventory-count-item" name="stockItemId" required>
            {(data?.items ?? []).map((item) => (
              <NativeSelectOption key={item.id} value={item.id}>
                {item.name}
              </NativeSelectOption>
            ))}
          </NativeSelect>
        </Field>
        <Field label="Counted quantity" htmlFor="inventory-count-quantity"><Input id="inventory-count-quantity" name="counted" required type="number" min="0" step="0.001" /></Field>
        <Field label="Reason" htmlFor="inventory-count-reason"><Input id="inventory-count-reason" name="reason" required placeholder="Cycle count" /></Field>
        <Field label="Approver" htmlFor="inventory-count-approver"><Input id="inventory-count-approver" name="approvedBy" placeholder="Required when the count differs" /></Field>
        <Button className="w-fit" type="submit" variant="outline">
          Submit count
        </Button>
      </form>
      <form
        className="grid max-w-xl gap-3"
        onSubmit={(event) => {
          event.preventDefault();
          const form = new FormData(event.currentTarget);
          send("waste", {
            ...scope,
            approvedBy: form.get("approvedBy"),
            quantityMilli: Math.round(Number(form.get("quantity")) * 1000),
            reason: form.get("reason"),
            stockItemId: form.get("stockItemId"),
          });
          event.currentTarget.reset();
        }}
      >
        <h2 className="text-sm font-semibold">Record waste</h2>
        <Field label="Item" htmlFor="inventory-waste-item">
          <NativeSelect className="w-full" id="inventory-waste-item" name="stockItemId" required>
            {(data?.items ?? []).map((item) => (
              <NativeSelectOption key={item.id} value={item.id}>
                {item.name}
              </NativeSelectOption>
            ))}
          </NativeSelect>
        </Field>
        <Field label="Quantity" htmlFor="inventory-waste-quantity"><Input id="inventory-waste-quantity" name="quantity" required type="number" min="0" step="0.001" /></Field>
        <Field label="Reason" htmlFor="inventory-waste-reason"><Input id="inventory-waste-reason" name="reason" required placeholder="Spoiled" /></Field>
        <Field label="Approver" htmlFor="inventory-waste-approver"><Input id="inventory-waste-approver" name="approvedBy" required placeholder="owner-1" /></Field>
        <Button className="w-fit" type="submit" variant="outline">
          Record waste
        </Button>
      </form>
    </div>
  );
}

function ConsumptionPanel({ businessId, data, menu, scope, send }: { businessId: string; data?: InventoryWorkspace; menu?: { items: Array<{ id: string; name: string }> }; scope: { businessId: string; locationId: string }; send: Sender }) {
  return (
    <div className="grid gap-6">
      <form
        className="grid max-w-xl gap-3"
        onSubmit={(event) => {
          event.preventDefault();
          const form = new FormData(event.currentTarget);
          send("consumptions", {
            ...scope,
            menuItemId: form.get("menuItemId"),
            portions: Number(form.get("portions")),
            sourceId: String(form.get("sourceId") ?? "").trim(),
            sourceType: form.get("sourceType"),
          });
          event.currentTarget.reset();
        }}
      >
        <h2 className="text-sm font-semibold">Consume recipe for sale or event</h2>
        <Field label="Menu item" htmlFor="inventory-consume-item">
          <NativeSelect className="w-full" id="inventory-consume-item" name="menuItemId" required>
            {(menu?.items ?? []).map((item) => (
              <NativeSelectOption key={item.id} value={item.id}>
                {item.name}
              </NativeSelectOption>
            ))}
          </NativeSelect>
        </Field>
        <Field label="Source" htmlFor="inventory-consume-source">
          <NativeSelect className="w-full" id="inventory-consume-source" name="sourceType" required>
            <NativeSelectOption value="sale">Sale</NativeSelectOption>
            <NativeSelectOption value="event">Event</NativeSelectOption>
          </NativeSelect>
        </Field>
        <Field label="Source reference" htmlFor="inventory-consume-ref"><Input id="inventory-consume-ref" name="sourceId" required placeholder="ORD-101" /></Field>
        <Field label="Portions" htmlFor="inventory-consume-portions"><Input id="inventory-consume-portions" name="portions" required type="number" min="1" /></Field>
        <Button className="w-fit" type="submit" variant="outline">
          Consume
        </Button>
      </form>
      <section className="grid gap-3">
        <h2 className="text-sm font-semibold">Consumption records</h2>
        {(data?.consumptions ?? []).map((entry) => (
          <p className="text-sm text-muted-foreground" key={entry.id}>
            {entry.source_type} {entry.source_id} · {entry.portions} portions · {entry.occurred_at}
          </p>
        ))}
      </section>
      <p className="max-w-2xl text-xs leading-5 text-muted-foreground">Business key: {businessId}.</p>
    </div>
  );
}
