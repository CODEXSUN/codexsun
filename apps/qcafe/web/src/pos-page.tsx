import { Badge } from "@codexsun/ui/components/badge";
import { Button } from "@codexsun/ui/components/button";
import { Input } from "@codexsun/ui/components/input";
import { Textarea } from "@codexsun/ui/components/textarea";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { MinusIcon, PauseIcon, PlayIcon, PlusIcon, SendIcon, Trash2Icon } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { readFoundationSetup } from "./foundation-setup-api";
import { readMenu } from "./menu-api";
import {
  addPosAdjustment,
  addPosLine,
  addPosNote,
  changePosLine,
  createPosOrder,
  readBooking,
  readPos,
  removePosLine,
  runPosAction,
  type PosOrder,
  type PosWorkspace,
  type CreatePosOrder,
} from "./pos-api";

type NewOrderInput = Omit<CreatePosOrder, "businessId" | "locationId">;

export function PosPage({ request }: { request: typeof fetch }) {
  const client = useQueryClient();
  const setup = useQuery({
    queryKey: ["qcafe", "foundation", "setup"],
    queryFn: () => readFoundationSetup(request),
  });
  const business = setup.data?.businesses[0];
  const [locationId, setLocationId] = useState("");
  const [selectedId, setSelectedId] = useState("");
  useEffect(() => {
    if (!locationId && business?.locations[0]) setLocationId(business.locations[0].id);
  }, [business, locationId]);
  const location = business?.locations.find((item) => item.id === locationId);
  const key = ["qcafe", "pos", business?.id, locationId] as const;
  const pos = useQuery({
    enabled: Boolean(business && location),
    queryKey: key,
    queryFn: () => readPos(request, business!.id, locationId),
  });
  const menu = useQuery({
    enabled: Boolean(business),
    queryKey: ["qcafe", "menu", business?.id],
    queryFn: () => readMenu(request, business!.id),
  });
  const booking = useQuery({
    enabled: Boolean(business && location),
    queryKey: ["qcafe", "booking", business?.id, locationId],
    queryFn: () => readBooking(request, business!.id, locationId),
  });
  const operate = useMutation({
    mutationFn: (work: () => Promise<PosWorkspace>) => work(),
    onSuccess: (data) => client.setQueryData(key, data),
  });
  const order = pos.data?.orders.find((item) => item.id === selectedId) ?? pos.data?.orders[0];
  useEffect(() => {
    if (!selectedId && pos.data?.orders[0]) setSelectedId(pos.data.orders[0].id);
  }, [pos.data?.orders, selectedId]);
  if (!business || !location) return <Message text="Create the business and outlet first." />;
  const run = (work: () => Promise<PosWorkspace>) => operate.mutate(work);
  return (
    <div className="grid min-h-[620px] gap-5 xl:grid-cols-[240px_minmax(340px,1fr)_350px]">
      <OrderRail
        data={pos.data}
        locationId={locationId}
        locations={business.locations}
        onLocation={setLocationId}
        onSelect={setSelectedId}
        selectedId={order?.id}
      />
      <ItemComposer
        disabled={!order || order.status !== "draft"}
        menu={menu.data}
        onAdd={(input) => run(() => addPosLine(request, order!.id, input))}
      />
      <OrderPanel
        booking={booking.data}
        channels={location.serviceChannels.filter((item) => item.enabled)}
        data={pos.data}
        loading={operate.isPending}
        onAction={(action) => run(() => runPosAction(request, order!.id, action))}
        onAdjust={(amountMinor, reason) =>
          run(() => addPosAdjustment(request, order!.id, { amountMinor, kind: "discount", reason }))
        }
        onChange={(lineId, quantity) => run(() => changePosLine(request, order!.id, lineId, { quantity }))}
        onCreate={(input) =>
          run(() =>
            createPosOrder(request, {
              ...input,
              businessId: business.id,
              locationId,
            }),
          )
        }
        onNote={(content) =>
          run(() =>
            addPosNote(request, order!.id, {
              content,
              noteKind: "internal",
              visibility: "internal",
            }),
          )
        }
        onRemove={(lineId) => run(() => removePosLine(request, order!.id, lineId))}
        order={order}
        priceBooks={menu.data?.priceBooks ?? []}
      />
      {operate.error ? <p className="text-sm text-destructive xl:col-span-3">{operate.error.message}</p> : null}
    </div>
  );
}

function OrderRail({
  data,
  locationId,
  locations,
  onLocation,
  onSelect,
  selectedId,
}: {
  data?: PosWorkspace;
  locationId: string;
  locations: Array<{ id: string; name: string }>;
  onLocation: (id: string) => void;
  onSelect: (id: string) => void;
  selectedId?: string;
}) {
  return (
    <aside className="grid content-start gap-4 border-r pr-4">
      <Select value={locationId} onChange={onLocation} options={locations.map((item) => [item.id, item.name])} />
      <h2 className="border-b pb-2 font-semibold">Orders</h2>
      {data?.orders.map((order) => (
        <button
          className={`grid gap-1 border-l-2 px-3 py-2 text-left ${selectedId === order.id ? "border-primary bg-muted" : "border-transparent"}`}
          key={order.id}
          onClick={() => onSelect(order.id)}
        >
          <span className="flex justify-between text-sm font-medium">
            {order.number}
            <Status value={order.status} />
          </span>
          <span className="text-xs text-muted-foreground">{money(order.total_minor, order.currency)}</span>
        </button>
      ))}
    </aside>
  );
}

function ItemComposer({
  disabled,
  menu,
  onAdd,
}: {
  disabled: boolean;
  menu?: Awaited<ReturnType<typeof readMenu>>;
  onAdd: (input: Record<string, unknown>) => void;
}) {
  const [itemId, setItemId] = useState("");
  const [variantId, setVariantId] = useState("");
  const [options, setOptions] = useState<string[]>([]);
  const item = menu?.items.find((entry) => entry.id === itemId) ?? menu?.items[0];
  useEffect(() => {
    if (!itemId && menu?.items[0]) setItemId(menu.items[0].id);
  }, [itemId, menu?.items]);
  useEffect(() => {
    setOptions([]);
    setVariantId("");
  }, [item?.id]);
  const groups = useMemo(
    () =>
      menu?.itemModifierGroups
        .filter((link) => link.itemId === item?.id && (!link.variantId || link.variantId === variantId))
        .map((link) => menu.modifierGroups.find((group) => group.id === link.groupId))
        .filter((group) => group !== undefined) ?? [],
    [item?.id, menu, variantId],
  );
  return (
    <form
      className="grid content-start gap-4"
      onSubmit={(event) => {
        event.preventDefault();
        const data = new FormData(event.currentTarget);
        onAdd({
          itemId: item!.id,
          modifiers: options.map((optionId) => ({ optionId, quantity: 1 })),
          note: String(data.get("note") || "") || undefined,
          quantity: Number(data.get("quantity")),
          variantId: variantId || undefined,
        });
      }}
    >
      <div className="flex justify-between border-b pb-3">
        <h2 className="font-semibold">Item composer</h2>
        <Badge variant="outline">Touch POS</Badge>
      </div>
      <Select
        value={item?.id ?? ""}
        onChange={setItemId}
        options={(menu?.items ?? []).map((entry) => [entry.id, entry.name])}
      />
      {item?.variants.length ? (
        <Select
          value={variantId}
          onChange={setVariantId}
          options={[["", "Standard"], ...item.variants.map((entry) => [entry.id, entry.name])]}
        />
      ) : null}
      {groups.map((group) => (
        <fieldset className="grid gap-2 border-y py-3" key={group.id}>
          <legend className="text-sm font-medium">
            {group.name} · choose {group.minSelections}-{group.maxSelections}
          </legend>
          {group.options
            .filter((option) => option.active)
            .map((option) => (
              <label className="flex justify-between text-sm" key={option.id}>
                <span>
                  <input
                    className="mr-2"
                    type="checkbox"
                    checked={options.includes(option.id)}
                    onChange={() => setOptions(toggle(options, option.id))}
                  />
                  {option.name}
                </span>
                <span>{signedMoney(option.priceAdjustmentMinor)}</span>
              </label>
            ))}
        </fieldset>
      ))}
      <Input defaultValue="1" min="0.001" name="quantity" step="0.001" type="number" />
      <Input name="note" placeholder="Kitchen note" />
      <Button disabled={disabled || !item} type="submit">
        <PlusIcon />
        Add item
      </Button>
    </form>
  );
}

function OrderPanel(props: {
  booking?: Awaited<ReturnType<typeof readBooking>>;
  channels: Array<{ id: string; kind: string; name: string }>;
  data?: PosWorkspace;
  loading: boolean;
  onAction: (action: string) => void;
  onAdjust: (amount: number, reason: string) => void;
  onChange: (line: string, quantity: number) => void;
  onCreate: (input: NewOrderInput) => void;
  onNote: (note: string) => void;
  onRemove: (line: string) => void;
  order?: PosOrder;
  priceBooks: Array<{ currency: string; id: string; name: string }>;
}) {
  const { data, order } = props;
  if (!order) return <NewOrder {...props} />;
  const lines = data?.lines.filter((line) => line.order_id === order.id && line.status === "active") ?? [];
  const job = data?.fulfillments.find((item) => item.order_id === order.id);
  const pickup = data?.takeawayDetails.find((item) => item.fulfillment_job_id === job?.id);
  return (
    <aside className="grid content-start gap-4 border-l pl-4">
      <div className="flex justify-between border-b pb-3">
        <div>
          <h2 className="font-semibold">{order.number}</h2>
          <p className="text-xs text-muted-foreground">{order.customer_name ?? "Walk-in guest"}</p>
        </div>
        <Status value={order.status} />
      </div>
      {pickup ? (
        <div className="flex justify-between border-y py-3 text-sm">
          <span>{pickup.collection_name}</span>
          <strong>Pickup {pickup.pickup_code}</strong>
        </div>
      ) : null}
      <div className="divide-y border-y">
        {lines.map((line) => (
          <div className="grid gap-2 py-3" key={line.id}>
            <div className="flex justify-between text-sm">
              <strong>{line.item_name}</strong>
              <span>{money(line.line_total_minor, order.currency)}</span>
            </div>
            <div className="flex items-center gap-1">
              <Button
                disabled={line.quantity_milli <= 1000 || order.status !== "draft"}
                size="icon-sm"
                variant="outline"
                onClick={() => props.onChange(line.id, line.quantity_milli / 1000 - 1)}
              >
                <MinusIcon />
              </Button>
              <span className="w-9 text-center text-sm">{line.quantity_milli / 1000}</span>
              <Button
                disabled={order.status !== "draft"}
                size="icon-sm"
                variant="outline"
                onClick={() => props.onChange(line.id, line.quantity_milli / 1000 + 1)}
              >
                <PlusIcon />
              </Button>
              <Button
                className="ml-auto"
                disabled={order.status !== "draft"}
                size="icon-sm"
                variant="ghost"
                onClick={() => props.onRemove(line.id)}
              >
                <Trash2Icon />
              </Button>
            </div>
          </div>
        ))}
      </div>
      <div className="grid gap-1 text-sm">
        <Amount label="Subtotal" value={money(order.subtotal_minor, order.currency)} />
        <Amount label="Discount" value={`-${money(order.discount_minor, order.currency)}`} />
        <Amount label="Total" value={money(order.total_minor, order.currency)} strong />
      </div>
      {order.status === "draft" ? <DraftTools onAdjust={props.onAdjust} onNote={props.onNote} /> : null}
      <div className="flex flex-wrap gap-2">
        {order.status === "draft" ? (
          <>
            <Button onClick={() => props.onAction("confirm")}>
              <SendIcon />
              Send KOT
            </Button>
            <Button onClick={() => props.onAction("hold")} variant="outline">
              <PauseIcon />
              Hold
            </Button>
          </>
        ) : null}
        {order.status === "held" ? (
          <Button onClick={() => props.onAction("resume")}>
            <PlayIcon />
            Resume
          </Button>
        ) : null}
        {order.status === "confirmed" ? (
          <Button onClick={() => props.onAction("fulfill")}>
            <PlayIcon />
            Fulfill
          </Button>
        ) : null}
        {["draft", "held", "confirmed"].includes(order.status) ? (
          <Button onClick={() => props.onAction("cancel")} variant="destructive">
            Cancel
          </Button>
        ) : null}
      </div>
      <NewOrder {...props} compact />
    </aside>
  );
}

function NewOrder({
  booking,
  channels,
  compact,
  onCreate,
  priceBooks,
}: Parameters<typeof OrderPanel>[0] & { compact?: boolean }) {
  return (
    <form
      className="grid content-start gap-3 border-t pt-4"
      onSubmit={(event) => {
        event.preventDefault();
        const data = new FormData(event.currentTarget);
        const channel = channels.find((item) => item.id === data.get("channel"));
        onCreate({
          collectionName: channel?.kind === "takeaway" ? String(data.get("customer") || "") || undefined : undefined,
          contactRef: String(data.get("contact") || "") || undefined,
          customerName: String(data.get("customer") || "") || undefined,
          priceBookId: String(data.get("priceBook")),
          serviceChannelId: String(data.get("channel")),
          tableSessionId: String(data.get("table") || "") || undefined,
        });
      }}
    >
      <h3 className="font-semibold">{compact ? "Start another order" : "Start order"}</h3>
      <Select name="channel" options={channels.map((item) => [item.id, item.name])} />
      <Select name="priceBook" options={priceBooks.map((item) => [item.id, `${item.name} · ${item.currency}`])} />
      <Select
        name="table"
        options={[
          ["", "No table"],
          ...(booking?.sessions ?? [])
            .filter((item) => item.status === "open")
            .map((item) => [item.id, `${item.guest_count} guests`]),
        ]}
      />
      <Input name="customer" placeholder="Guest / collection name" />
      <Input name="contact" placeholder="Contact" />
      <Button
        disabled={!channels.length || !priceBooks.length}
        type="submit"
        variant={compact ? "outline" : "default"}
      >
        <PlusIcon />
        New order
      </Button>
    </form>
  );
}

function DraftTools({
  onAdjust,
  onNote,
}: {
  onAdjust: (amount: number, reason: string) => void;
  onNote: (note: string) => void;
}) {
  return (
    <div className="grid gap-2 border-t pt-3">
      <form
        className="flex gap-1"
        onSubmit={(event) => {
          event.preventDefault();
          const data = new FormData(event.currentTarget);
          onAdjust(Math.round(Number(data.get("amount")) * 100), String(data.get("reason")));
        }}
      >
        <Input name="amount" placeholder="Discount" required type="number" />
        <Input name="reason" placeholder="Approval reason" required />
        <Button type="submit" variant="outline">Apply</Button>
      </form>
      <form
        className="flex gap-1"
        onSubmit={(event) => {
          event.preventDefault();
          onNote(String(new FormData(event.currentTarget).get("note")));
        }}
      >
        <Textarea className="min-h-9" name="note" placeholder="Order note" required />
        <Button type="submit" variant="outline">Add</Button>
      </form>
    </div>
  );
}

function Select({
  onChange,
  options,
  ...props
}: {
  name?: string;
  onChange?: (value: string) => void;
  options: string[][];
  value?: string;
}) {
  return (
    <select
      className="h-9 rounded-md border bg-background px-3 text-sm"
      onChange={onChange ? (event) => onChange(event.target.value) : undefined}
      {...props}
    >
      {options.map(([value, label]) => (
        <option key={value} value={value}>
          {label}
        </option>
      ))}
    </select>
  );
}
function Status({ value }: { value: string }) {
  return (
    <Badge variant={value === "cancelled" ? "destructive" : value === "confirmed" ? "default" : "secondary"}>
      {value}
    </Badge>
  );
}
function Message({ text }: { text: string }) {
  return <p className="text-sm text-muted-foreground">{text}</p>;
}
function Amount({ label, strong, value }: { label: string; strong?: boolean; value: string }) {
  return (
    <div className={`flex justify-between ${strong ? "border-t pt-2 font-semibold" : ""}`}>
      <span>{label}</span>
      <span>{value}</span>
    </div>
  );
}
function money(value: number, currency: string) {
  return new Intl.NumberFormat(undefined, { currency, style: "currency" }).format(value / 100);
}
function signedMoney(value: number) {
  return `${value >= 0 ? "+" : ""}${money(value, "INR")}`;
}
function toggle(values: string[], value: string) {
  return values.includes(value) ? values.filter((item) => item !== value) : [...values, value];
}
