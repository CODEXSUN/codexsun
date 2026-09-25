import { Badge } from "@codexsun/ui/components/badge";
import { Button } from "@codexsun/ui/components/button";
import { Checkbox } from "@codexsun/ui/components/checkbox";
import { Field } from "@codexsun/ui/components/field";
import { Input } from "@codexsun/ui/components/input";
import { NativeSelect, NativeSelectOption } from "@codexsun/ui/components/native-select";
import { CoffeeIcon, MinusIcon, PauseIcon, PlayIcon, PlusIcon, SearchIcon, SendIcon, Trash2Icon } from "lucide-react";
import { useEffect, useMemo, useRef, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { changeBilling, readBilling } from "./billing-api";
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
  type CreatePosOrder,
  type PosLine,
  type PosOrder,
  type PosWorkspace,
} from "./pos-api";

type MenuCatalog = Awaited<ReturnType<typeof readMenu>>;

type Billing = {
  bills: Array<{ balance_minor: number; id: string; number: string; order_id: string; paid_minor: number; status: string }>;
  cashShifts: Array<{ id: string; status: string }>;
  paymentMethods: Array<{ active: number; id: string; kind: string; name: string }>;
  payments: Array<{ amount_minor: number; bill_id: string | null; direction: string; id: string; status: string }>;
  receipts: Array<{ bill_id: string | null; id: string; number: string; payment_id: string }>;
};

export function PosPage({ request }: { request: typeof fetch }) {
  const client = useQueryClient();
  const setup = useQuery({
    queryKey: ["qcafe", "foundation", "setup"],
    queryFn: () => readFoundationSetup(request),
  });
  const business = setup.data?.businesses[0];
  const [locationId, setLocationId] = useState("");
  const [selectedId, setSelectedId] = useState("");
  const [search, setSearch] = useState("");
  const [categoryId, setCategoryId] = useState("all");
  const [customizeId, setCustomizeId] = useState<string | null>(null);
  const searchRef = useRef<HTMLInputElement>(null);
  const payRef = useRef<HTMLDivElement>(null);
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
  const billingKey = ["qcafe", "billing", business?.id, locationId] as const;
  const billing = useQuery({
    enabled: Boolean(business && locationId),
    queryKey: billingKey,
    queryFn: () => readBilling(request, business!.id, locationId),
  });
  const operate = useMutation({
    mutationFn: (work: () => Promise<unknown>) => work(),
    onSuccess: async () => {
      await client.invalidateQueries({ queryKey: key });
      await client.invalidateQueries({ queryKey: billingKey });
    },
  });
  const order = pos.data?.orders.find((item) => item.id === selectedId) ?? pos.data?.orders[0];
  useEffect(() => {
    if (!selectedId && pos.data?.orders[0]) setSelectedId(pos.data.orders[0].id);
  }, [pos.data?.orders, selectedId]);
  useEffect(() => {
    const onKey = (event: KeyboardEvent) => {
      const target = event.target as HTMLElement | null;
      if (target && (target.tagName === "INPUT" || target.tagName === "TEXTAREA" || target.tagName === "SELECT")) return;
      if (event.key === "F2") {
        event.preventDefault();
        searchRef.current?.focus();
      } else if (event.key === "F8") {
        event.preventDefault();
        if (order && order.status === "draft") operate.mutate(() => runPosAction(request, order.id, "hold"));
      } else if (event.key === "F7") {
        event.preventDefault();
        payRef.current?.scrollIntoView({ behavior: "smooth", block: "center" });
      } else if (event.key === "F3") {
        event.preventDefault();
        const orders = pos.data?.orders ?? [];
        const index = orders.findIndex((entry) => entry.id === (order?.id ?? selectedId));
        const next = orders[(index + 1) % Math.max(orders.length, 1)];
        if (next) setSelectedId(next.id);
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [operate, order, request]);
  if (!business || !location) return <Message text="Create the business and outlet first." />;
  const run = (work: () => Promise<unknown>) => operate.mutate(work);
  const draftOrder = order && order.status === "draft" ? order : undefined;
  const ensureDraftOrder = async (): Promise<PosOrder> => {
    if (draftOrder) return draftOrder;
    const channel = location.serviceChannels.find((entry) => entry.enabled);
    const priceBook = menu.data?.priceBooks[0];
    if (!channel || !priceBook) throw new Error("Configure a service channel and a price book first.");
    const created = (await createPosOrder(request, {
      businessId: business.id,
      locationId,
      priceBookId: priceBook.id,
      serviceChannelId: channel.id,
    } as CreatePosOrder)) as PosWorkspace;
    const createdOrder =
      created.orders.find((entry) => !pos.data?.orders.some((old) => old.id === entry.id)) ?? created.orders[0];
    if (!createdOrder) throw new Error("Order was not created.");
    setSelectedId(createdOrder.id);
    return createdOrder;
  };
  const addItem = (itemId: string, variantId?: string, modifiers: Array<{ optionId: string; quantity: number }> = [], quantity = 1) => {
    run(async () => {
      const target = await ensureDraftOrder();
      return addPosLine(request, target.id, { itemId, modifiers, quantity, variantId });
    });
  };
  const visibleItems = (menu.data?.items ?? []).filter((item) => {
    if (categoryId !== "all" && item.categoryId !== categoryId) return false;
    const query = search.trim().toLowerCase();
    if (!query) return true;
    return item.name.toLowerCase().includes(query) || item.code.toLowerCase().includes(query);
  });
  const priceBookId = order?.price_book_id ?? menu.data?.priceBooks[0]?.id;
  const priceOf = (itemId: string) =>
    menu.data?.prices.find((price) => price.itemId === itemId && (!priceBookId || price.priceBookId === priceBookId))?.amountMinor;
  return (
    <div className="flex min-h-0 flex-1 flex-col bg-background text-foreground select-none">
      <header className="relative z-30 flex shrink-0 items-center justify-between gap-3 border-b border-border bg-card px-3.5 py-2 shadow-2xs">
        <div className="flex min-w-0 flex-1 items-center gap-2.5">
          <div className="relative flex w-60 shrink-0 items-center gap-2 rounded-xl border border-border bg-background px-3 py-1.5 shadow-2xs sm:w-72 md:w-80">
            <SearchIcon className="size-4 shrink-0 text-muted-foreground" />
            <input
              aria-label="Search items (e.g. Cappuccino) or scan (F2)"
              className="flex-1 bg-transparent text-xs outline-none placeholder:text-muted-foreground"
              placeholder="Search items (e.g. Cappuccino) or scan..."
              ref={searchRef}
              value={search}
              onChange={(event) => setSearch(event.currentTarget.value)}
              onFocus={(event) => event.currentTarget.select()}
            />
            <kbd className="font-mono text-[10px] font-semibold bg-muted text-muted-foreground px-1.5 py-0.5 rounded border border-border select-none">
              F2
            </kbd>
          </div>
          <NativeSelect aria-label="Outlet" value={locationId} onChange={(event) => setLocationId(event.currentTarget.value)} className="h-8 max-w-40 text-xs">
            {business.locations.map((item) => (
              <NativeSelectOption key={item.id} value={item.id}>
                {item.name}
              </NativeSelectOption>
            ))}
          </NativeSelect>
          <Badge variant="outline">{pos.data?.orders.filter((entry) => entry.status === "draft").length ?? 0} open</Badge>
        </div>
        <div className="flex shrink-0 items-center gap-2">
          <Button
            disabled={!draftOrder}
            variant="outline"
            type="button"
            className="gap-1.5 rounded-xl px-3 py-1.5 text-xs font-semibold shadow-2xs"
            onClick={() => draftOrder && run(() => runPosAction(request, draftOrder.id, "hold"))}
          >
            <SendIcon size={13} />
            <span>Save</span>
            <kbd className="font-mono text-[10px] font-semibold bg-muted text-muted-foreground px-1.5 py-0.5 rounded border border-border select-none">F8</kbd>
          </Button>
        </div>
      </header>
      <div className="flex h-13 shrink-0 items-center gap-2 overflow-x-auto px-3 scrollbar-slim">
        <button
          type="button"
          onClick={() => setCategoryId("all")}
          className={`flex h-8 shrink-0 cursor-pointer select-none items-center rounded-xl px-4 text-xs font-semibold transition-all duration-150 active:scale-95 ${categoryId === "all" ? "bg-neutral-900 text-white shadow-xs dark:bg-neutral-100 dark:text-neutral-900" : "border border-border bg-card text-foreground hover:bg-muted/70"}`}
        >
          All
        </button>
        {(menu.data?.categories ?? []).map((category) => {
          const active = categoryId === category.id;
          return (
            <button
              key={category.id}
              type="button"
              onClick={() => setCategoryId(category.id)}
              className={`flex h-8 shrink-0 cursor-pointer select-none items-center rounded-xl px-4 text-xs font-semibold transition-all duration-150 active:scale-95 ${active ? "bg-neutral-900 text-white shadow-xs dark:bg-neutral-100 dark:text-neutral-900" : "border border-border bg-card text-foreground hover:bg-muted/70"}`}
            >
              {category.name}
            </button>
          );
        })}
      </div>
      <div className="flex min-h-0 flex-1 gap-4 p-3">
        <div className="flex min-w-0 flex-1 flex-col">
          <div className="grid min-h-0 flex-1 auto-rows-fr grid-cols-2 gap-2.5 overflow-y-auto px-1 pt-2.5 pb-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 scrollbar-slim">
          {visibleItems.map((item) => (
            <ProductCard
              key={item.id}
              businessId={business.id}
              item={item}
              priceMinor={priceOf(item.id)}
              request={request}
              selected={customizeId === item.id}
              onSelect={() => {
                if (item.variants.length > 0) setCustomizeId(customizeId === item.id ? null : item.id);
                else addItem(item.id);
              }}
            />
          ))}
          {!visibleItems.length ? <p className="grid h-48 place-items-center text-sm text-muted-foreground">No menu items match your search or filter.</p> : null}
          </div>
        </div>
        <OrderPanel
          billing={billing.data}
          channels={location.serviceChannels}
          lines={(pos.data?.lines ?? []).filter((line) => line.order_id === order?.id && line.status === "active")}
          onAdjust={(amountMinor, reason) =>
            order && run(() => addPosAdjustment(request, order.id, { amountMinor, kind: "discount", reason }))
          }
          onChange={(lineId, quantity) => order && run(() => changePosLine(request, order.id, lineId, { quantity }))}
          onCollect={(path, body) => run(() => changeBilling(request, path, body))}
          onCreate={(input) => run(() => createPosOrder(request, { ...input, businessId: business.id, locationId } as CreatePosOrder))}
          onNote={(content) =>
            order && run(() => addPosNote(request, order.id, { content, noteKind: "internal", visibility: "internal" }))
          }
          onPostBill={(orderId) => run(() => changeBilling(request, "bills", { orderId }))}
          onRemove={(lineId) => order && run(() => removePosLine(request, order.id, lineId))}
          onRunAction={(action) => order && run(() => runPosAction(request, order.id, action))}
          order={order}
          orders={pos.data?.orders ?? []}
          onSelectOrder={setSelectedId}
          payRef={payRef}
          priceBooks={menu.data?.priceBooks ?? []}
          sessions={(booking.data?.sessions ?? []).map((session) => ({ guest_count: session.guest_count, id: session.id, status: session.status }))}
        />
      </div>
      {customizeId ? (
        <CustomizePanel
          item={(menu.data?.items ?? []).find((entry) => entry.id === customizeId)}
          menu={menu.data}
          onAdd={(payload) => {
            addItem(customizeId, payload.variantId, payload.modifiers, payload.quantity);
            setCustomizeId(null);
          }}
          onClose={() => setCustomizeId(null)}
        />
      ) : null}
      <BottomStrip
        billing={billing.data}
        menu={menu.data}
        onQuickAdd={(itemId, quantity) => addItem(itemId, undefined, [], quantity)}
      />
      {operate.error ? <p className="text-sm text-destructive">{operate.error.message}</p> : null}
    </div>
  );
}

function useMenuImage(request: typeof fetch, businessId: string, assetId: string | null): string | null {
  const [url, setUrl] = useState<string | null>(null);
  useEffect(() => {
    let live = true;
    let objectUrl: string | null = null;
    if (!assetId) {
      setUrl(null);
      return;
    }
    request(`/api/v1/qcafe/menu/media/${assetId}/content?businessId=${encodeURIComponent(businessId)}`)
      .then(async (response) => {
        if (!response.ok) return;
        objectUrl = URL.createObjectURL(await response.blob());
        if (live) setUrl(objectUrl);
      })
      .catch(() => undefined);
    return () => {
      live = false;
      if (objectUrl) URL.revokeObjectURL(objectUrl);
    };
  }, [request, businessId, assetId]);
  return url;
}

function ProductCard({ businessId, item, priceMinor, request, selected, onSelect }: {
  businessId: string;
  item: { code: string; id: string; name: string };
  priceMinor?: number;
  request: typeof fetch;
  selected: boolean;
  onSelect: () => void;
}) {
  const [mediaAssetId, setMediaAssetId] = useState<string | null>(null);
  useEffect(() => {
    let live = true;
    request(`/api/v1/qcafe/menu?businessId=${encodeURIComponent(businessId)}`)
      .then(async (response) => {
        if (!response.ok) return;
        const catalog = (await response.json()) as {
          media?: Array<{ assetId: string; itemId: string; status: string; usage: string }>;
        };
        const asset = catalog.media?.find((entry) => entry.itemId === item.id && entry.usage === "menu" && entry.status === "active");
        if (live) setMediaAssetId(asset?.assetId ?? null);
      })
      .catch(() => undefined);
    return () => {
      live = false;
    };
  }, [request, businessId, item.id]);
  const imageUrl = useMenuImage(request, businessId, mediaAssetId);
  return (
    <button
      className={`group relative flex cursor-pointer touch-manipulation flex-col justify-between rounded-2xl border bg-card p-2 text-left select-none transition-all duration-150 hover:border-primary/50 hover:shadow-md active:scale-[0.96] active:translate-y-0.5 ${selected ? "border-blue-500 bg-blue-50/40 ring-2 ring-blue-500 dark:bg-blue-950/25" : "border-border/80"}`}
      onClick={onSelect}
      type="button"
    >
      <span className="relative mb-2 block aspect-[4/3] w-full overflow-hidden rounded-xl bg-muted shadow-2xs">
        {imageUrl ? (
          <img alt={item.name} className="h-full w-full object-cover transition-transform duration-200 group-hover:scale-105" src={imageUrl} loading="lazy" />
        ) : (
          <span className="grid size-full place-items-center text-muted-foreground">
            <CoffeeIcon className="size-8" />
          </span>
        )}
        <span className="pointer-events-none absolute right-1.5 bottom-1.5 rounded-md bg-background/90 px-1.5 py-0.5 text-sm leading-none font-bold text-blue-600 shadow-xs dark:text-blue-400">
          {item.code}
        </span>
      </span>
      <span className="flex w-full flex-col px-0.5">
        <span className="truncate text-xs leading-tight font-semibold text-foreground" title={item.name}>{item.name}</span>
        <span className="mt-0.5 text-xs font-bold text-foreground/90">{priceMinor !== undefined ? money(priceMinor, "INR") : "Not priced"}</span>
      </span>
    </button>
  );
}

function CustomizePanel({ item, menu, onAdd, onClose }: {
  item?: { id: string; name: string; variants: Array<{ id: string; name: string }> };
  menu?: MenuCatalog;
  onAdd: (payload: { modifiers: Array<{ optionId: string; quantity: number }>; quantity: number; variantId?: string }) => void;
  onClose: () => void;
}) {
  const [variantId, setVariantId] = useState("");
  const [options, setOptions] = useState<string[]>([]);
  const [quantity, setQuantity] = useState(1);
  useEffect(() => {
    setVariantId("");
    setOptions([]);
    setQuantity(1);
  }, [item?.id]);
  const groups = useMemo(() => {
    if (!item || !menu) return [];
    return (
      menu.itemModifierGroups
        .filter((link) => link.itemId === item.id && (!link.variantId || link.variantId === variantId))
        .map((link) => menu.modifierGroups.find((group) => group.id === link.groupId))
        .filter((group) => group !== undefined)
    );
  }, [item, menu, variantId]);
  if (!item) return null;
  return (
    <section aria-label={`Customize ${item.name}`} className="grid gap-3 rounded-xl border bg-card p-4">
      <div className="flex items-center justify-between">
        <h2 className="font-semibold">{item.name}</h2>
        <Button size="sm" variant="ghost" onClick={onClose}>
          Close
        </Button>
      </div>
      {item.variants.length ? (
        <Field label="Variant" htmlFor="pos-customize-variant">
          <NativeSelect className="w-full" id="pos-customize-variant" value={variantId} onChange={(event) => setVariantId(event.currentTarget.value)}>
            <NativeSelectOption value="">Standard</NativeSelectOption>
            {item.variants.map((entry) => (
              <NativeSelectOption key={entry.id} value={entry.id}>
                {entry.name}
              </NativeSelectOption>
            ))}
          </NativeSelect>
        </Field>
      ) : null}
      {groups.map((group) => (
        <fieldset className="grid gap-2 border-t pt-3" key={group.id}>
          <legend className="text-sm font-medium">
            {group.name} · choose {group.minSelections}-{group.maxSelections}
          </legend>
          {group.options
            .filter((option) => option.active)
            .map((option) => (
              <label className="flex justify-between text-sm" key={option.id}>
                <span>
                  <Checkbox
                    aria-label={option.name}
                    className="mr-2"
                    checked={options.includes(option.id)}
                    onCheckedChange={() => setOptions(toggle(options, option.id))}
                  />
                  {option.name}
                </span>
                <span>{signedMoney(option.priceAdjustmentMinor)}</span>
              </label>
            ))}
        </fieldset>
      ))}
      <div className="flex items-center gap-2">
        <Button disabled={quantity <= 1} size="icon-sm" variant="outline" onClick={() => setQuantity(quantity - 1)}>
          <MinusIcon />
        </Button>
        <span className="w-9 text-center text-sm">{quantity}</span>
        <Button size="icon-sm" variant="outline" onClick={() => setQuantity(quantity + 1)}>
          <PlusIcon />
        </Button>
        <Button
          className="ml-auto"
          onClick={() => onAdd({ modifiers: options.map((optionId) => ({ optionId, quantity: 1 })), quantity, variantId: variantId || undefined })}
        >
          <PlusIcon />
          Add {quantity}
        </Button>
      </div>
    </section>
  );
}

function OrderPanel(props: {
  billing?: Billing;
  channels: Array<{ enabled: boolean; id: string; kind: string; name: string }>;
  lines: PosLine[];
  onAdjust: (amount: number, reason: string) => void;
  onChange: (line: string, quantity: number) => void;
  onCollect: (path: string, body: Record<string, unknown>) => void;
  onCreate: (input: Omit<CreatePosOrder, "businessId" | "locationId">) => void;
  onNote: (note: string) => void;
  onPostBill: (orderId: string) => void;
  onRemove: (line: string) => void;
  onRunAction: (action: string) => void;
  order?: PosOrder;
  orders: PosOrder[];
  onSelectOrder: (id: string) => void;
  payRef: React.RefObject<HTMLDivElement | null>;
  priceBooks: Array<{ currency: string; id: string; name: string }>;
  sessions: Array<{ guest_count: number; id: string; status: string }>;
}) {
  const { order } = props;
  if (!order) {
    return (
      <aside className="relative flex w-[410px] shrink-0 flex-col overflow-hidden rounded-2xl border border-border bg-card shadow-sm lg:w-[440px]">
        <h2 className="font-semibold">No active order</h2>
        <p className="text-sm text-muted-foreground">Select an item to start a new order.</p>
        <NewOrderForm
          channels={props.channels}
          onCreate={props.onCreate}
          priceBooks={props.priceBooks}
          sessions={props.sessions}
        />
      </aside>
    );
  }
  return <OrderBody {...props} order={order} />;
}

function OrderBody({ billing, lines, onAdjust, onChange, onCollect, onNote, onPostBill, onRemove, onRunAction, order, orders, onSelectOrder, payRef }: {
  billing?: Billing;
  lines: PosLine[];
  onAdjust: (amount: number, reason: string) => void;
  onChange: (line: string, quantity: number) => void;
  onCollect: (path: string, body: Record<string, unknown>) => void;
  onNote: (note: string) => void;
  onPostBill: (orderId: string) => void;
  onRemove: (line: string) => void;
  onRunAction: (action: string) => void;
  order: PosOrder;
  orders: PosOrder[];
  onSelectOrder: (id: string) => void;
  payRef: React.RefObject<HTMLDivElement | null>;
}) {
  const tableSession = order.table_session_id;
  const total = money(order.total_minor, order.currency);
  return (
    <aside className="relative flex w-[410px] shrink-0 flex-col overflow-hidden rounded-2xl border border-border bg-card shadow-sm lg:w-[440px]">
      <div className="flex h-13 items-center justify-between border-b border-border bg-muted/20 px-3.5">
        <div className="flex min-w-0 items-center gap-2">
          <NativeSelect aria-label="Order mode (F3)" value={order.id} onChange={(event) => onSelectOrder(event.currentTarget.value)} className="h-7 max-w-28 text-[11px] font-bold">
            {orders.map((entry) => (
              <NativeSelectOption key={entry.id} value={entry.id}>
                {`${entry.number} · ${entry.status}`}
              </NativeSelectOption>
            ))}
          </NativeSelect>
          <kbd className="rounded border border-border bg-background px-1 py-0.5 font-mono text-[10px] font-semibold text-muted-foreground">F3</kbd>
          <span className="truncate text-xs font-bold text-foreground">{order.number}</span>
          <span className="text-xs text-muted-foreground">•</span>
          <span className="truncate text-xs font-semibold text-muted-foreground">{tableSession ? `Table ${tableSession.slice(0, 4)}` : "Counter"}</span>
          <span className="text-[11px] font-semibold text-muted-foreground">{lines.length} {lines.length === 1 ? "item" : "items"}</span>
        </div>
        <button
          type="button"
          disabled={order.status !== "draft"}
          onClick={() => onRunAction("cancel")}
          aria-label="Clear current order"
          title="Clear current order"
          className="grid size-7 cursor-pointer place-items-center rounded-md text-muted-foreground transition-colors hover:bg-destructive/10 hover:text-destructive disabled:cursor-not-allowed disabled:opacity-35"
        >
          <Trash2Icon size={14} />
        </button>
      </div>
      <div className="min-h-0 flex-1 overflow-y-auto scrollbar-slim">
        {lines.length > 0 ? (
        <table className="w-full border-collapse text-left text-xs">
          <thead className="sticky top-0 z-10 border-b border-border/80 bg-card text-[11px] font-semibold tracking-wider text-muted-foreground uppercase">
            <tr>
              <th className="w-7 px-2.5 py-2.5 text-center">#</th>
              <th className="px-2.5 py-2.5">Item Name</th>
              <th className="w-24 px-1.5 py-2.5 text-center">Qty</th>
              <th className="w-16 px-1.5 py-2.5 text-right">Rate</th>
              <th className="w-20 px-2.5 py-2.5 text-right">Amount</th>
              <th className="w-8 px-2 py-2.5 text-right" />
            </tr>
          </thead>
          <tbody className="divide-y divide-border/60">
        {lines.map((line, index) => (
          <tr key={line.id} className="transition-colors hover:bg-muted/30">
            <td className="px-2.5 py-2.5 text-center font-mono text-muted-foreground">{index + 1}</td>
            <td className="min-w-0 px-2.5 py-2.5"><div className="truncate font-semibold text-foreground" title={line.item_name}>{line.item_name}</div></td>
            <td className="px-1.5 py-2.5 text-center">
              <span className="inline-flex items-center justify-center gap-1.5 rounded-lg border border-border bg-background px-1 py-0.5 shadow-2xs">
                <button type="button" disabled={line.quantity_milli <= 1000 || order.status !== "draft"} onClick={() => onChange(line.id, line.quantity_milli / 1000 - 1)} aria-label="Decrease quantity" className="grid size-5 cursor-pointer place-items-center rounded text-muted-foreground transition-colors hover:bg-muted hover:text-foreground disabled:cursor-not-allowed disabled:opacity-35"><MinusIcon size={11} /></button>
                <span className="w-4 text-center text-xs font-bold text-foreground select-none">{line.quantity_milli / 1000}</span>
                <button type="button" disabled={order.status !== "draft"} onClick={() => onChange(line.id, line.quantity_milli / 1000 + 1)} aria-label="Increase quantity" className="grid size-5 cursor-pointer place-items-center rounded text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"><PlusIcon size={11} /></button>
              </span>
            </td>
            <td className="px-1.5 py-2.5 text-right font-medium whitespace-nowrap text-muted-foreground">{money(line.unit_price_minor + line.modifier_total_minor, order.currency)}</td>
            <td className="px-2.5 py-2.5 text-right font-bold whitespace-nowrap text-foreground">{money(line.line_total_minor, order.currency)}</td>
            <td className="px-2 py-2.5 text-right">
              <button type="button" disabled={order.status !== "draft"} onClick={() => onRemove(line.id)} aria-label={`Remove ${line.item_name}`} className="grid size-6 cursor-pointer place-items-center rounded text-muted-foreground transition-colors hover:bg-destructive/10 hover:text-destructive"><Trash2Icon size={13} /></button>
            </td>
          </tr>
        ))}
          </tbody>
        </table>
        ) : <div className="min-h-40 flex-1" aria-label="Empty order" />}
      </div>
      <div className="relative z-20 flex justify-end border-t border-border bg-muted/20 p-3">
        <div className="flex w-full items-center justify-between gap-3">
          <div>
            <button type="button" disabled={!lines.length} onClick={() => payRef.current?.scrollIntoView({ behavior: "smooth", block: "center" })} className="inline-flex cursor-pointer items-center gap-1 rounded-lg border border-border bg-background px-2.5 py-1 text-xs font-medium text-muted-foreground transition-colors hover:bg-accent hover:text-foreground disabled:cursor-not-allowed disabled:opacity-40" aria-label="Choose payment method">
              <span>Pay</span>
              <kbd className="font-mono text-[9px] bg-muted px-1 py-0.5 rounded border border-border">F7</kbd>
            </button>
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-xs font-bold tracking-wider text-muted-foreground uppercase">Total</span>
            <span className="text-2xl font-black tracking-tight text-blue-600 dark:text-blue-400">{total}</span>
          </div>
        </div>
      </div>
      <div className="grid gap-1 border-t px-3.5 py-2 text-sm">
        <Amount label="Subtotal" value={money(order.subtotal_minor, order.currency)} />
        <Amount label="Discount" value={`-${money(order.discount_minor, order.currency)}`} />
      </div>
      {order.status === "draft" ? (
        <div className="flex flex-wrap gap-2 px-3.5 pb-2">
          <Button onClick={() => onRunAction("confirm")} size="sm">
            <SendIcon />
            Send KOT
          </Button>
          <Button onClick={() => onRunAction("hold")} size="sm" variant="outline">
            <PauseIcon />
            Hold
          </Button>
        </div>
      ) : null}
      {order.status === "held" ? (
        <div className="px-3.5 pb-2"><Button onClick={() => onRunAction("resume")} size="sm">
          <PlayIcon />
          Resume
        </Button></div>
      ) : null}
      {order.status === "confirmed" ? (
        <div className="px-3.5 pb-2"><Button onClick={() => onRunAction("fulfill")} size="sm">
          <PlayIcon />
          Fulfill
        </Button></div>
      ) : null}
      <div ref={payRef} className="grid scroll-mt-4 gap-3 border-t px-3.5 pt-3 pb-2">
        <PaySection billing={billing} onCollect={onCollect} onPostBill={onPostBill} order={order} />
      </div>
      <details className="grid gap-2 border-t px-3.5 pt-3 pb-3 text-sm">
        <summary className="cursor-pointer font-medium">Discount and note</summary>
        <DiscountNoteForm onAdjust={onAdjust} onNote={onNote} />
      </details>
    </aside>
  );
}

function PaySection({ billing, onCollect, onPostBill, order }: {
  billing?: Billing;
  onCollect: (path: string, body: Record<string, unknown>) => void;
  onPostBill: (orderId: string) => void;
  order: PosOrder;
}) {
  const [methodId, setMethodId] = useState("");
  const bill = billing?.bills.find((entry) => entry.order_id === order.id);
  const methods = (billing?.paymentMethods ?? []).filter((entry) => entry.active);
  const method = methods.find((entry) => entry.id === methodId) ?? methods.find((entry) => entry.kind === "cash") ?? methods[0];
  const openShift = (billing?.cashShifts ?? []).find((entry) => entry.status === "open");
  useEffect(() => {
    if (!methodId && method) setMethodId(method.id);
  }, [method, methodId]);
  if (order.status !== "confirmed" && order.status !== "fulfilled") {
    return <p className="text-xs text-muted-foreground">Confirm the order to collect payment.</p>;
  }
  if (!bill) {
    return (
      <Button onClick={() => onPostBill(order.id)} size="sm">
        <PlusIcon />
        Post bill
      </Button>
    );
  }
  const receipt = billing?.receipts.find((entry) => entry.bill_id === bill.id);
  const needsShift = method?.kind === "cash" && !openShift;
  return (
    <div className="grid gap-3">
      <div className="flex items-center justify-between">
        <span className="text-sm text-muted-foreground">Bill {bill.number}</span>
        <Status value={bill.status} />
      </div>
      {bill.balance_minor > 0 ? (
        <form
          className="grid gap-2"
          onSubmit={(event) => {
            event.preventDefault();
            const form = new FormData(event.currentTarget);
            onCollect(`bills/${bill.id}/payments`, {
              amountMinor: Math.round(Number(form.get("amount")) * 100),
              cashShiftId: method?.kind === "cash" ? openShift?.id : undefined,
              paymentMethodId: method?.id,
              receivedMinor: Math.round(Number(form.get("received") ?? form.get("amount")) * 100),
              status: "posted",
            });
            event.currentTarget.reset();
          }}
        >
          <div className="grid grid-cols-2 gap-2">
            <Field label="Method" htmlFor={`pay-method-${bill.id}`}>
              <NativeSelect
                className="w-full"
                id={`pay-method-${bill.id}`}
                value={method?.id ?? ""}
                onChange={(event) => setMethodId(event.currentTarget.value)}
              >
                {methods.map((entry) => (
                  <NativeSelectOption key={entry.id} value={entry.id}>
                    {entry.name}
                  </NativeSelectOption>
                ))}
              </NativeSelect>
            </Field>
            <Field label="Amount" htmlFor={`pay-amount-${bill.id}`}>
              <Input id={`pay-amount-${bill.id}`} name="amount" required type="number" min="0" step="0.01" defaultValue={(bill.balance_minor / 100).toFixed(2)} />
            </Field>
          </div>
          {method?.kind === "cash" ? (
            openShift ? (
              <Field label="Tendered" htmlFor={`pay-received-${bill.id}`}>
                <Input id={`pay-received-${bill.id}`} name="received" type="number" min="0" step="0.01" defaultValue={(bill.balance_minor / 100).toFixed(2)} />
              </Field>
            ) : (
              <p className="text-xs text-muted-foreground">Open a cash shift in Billing to collect cash.</p>
            )
          ) : null}
          <div className="flex items-center justify-between gap-2">
            <Button type="submit" disabled={needsShift}>
              Pay <kbd className="rounded border bg-muted px-1 text-[10px]">F7</kbd>
            </Button>
            <span className="text-sm text-muted-foreground">
              Total <strong className="text-base text-foreground">{money(order.total_minor, order.currency)}</strong>
            </span>
          </div>
        </form>
      ) : (
        <p className="text-sm text-muted-foreground">
          ✓ Paid{receipt ? ` · ${receipt.number}` : ""}
        </p>
      )}
    </div>
  );
}

function DiscountNoteForm({ onAdjust, onNote }: {
  onAdjust: (amount: number, reason: string) => void;
  onNote: (note: string) => void;
}) {
  return (
    <div className="grid gap-2">
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
        <Input name="note" placeholder="Order note" required />
        <Button type="submit" variant="outline">Add</Button>
      </form>
    </div>
  );
}

function NewOrderForm({ channels, onCreate, priceBooks, sessions }: {
  channels: Array<{ enabled: boolean; id: string; kind: string; name: string }>;
  onCreate: (input: Omit<CreatePosOrder, "businessId" | "locationId">) => void;
  priceBooks: Array<{ currency: string; id: string; name: string }>;
  sessions: Array<{ guest_count: number; id: string; status: string }>;
}) {
  return (
    <form
      className="grid gap-2 border-t pt-3"
      onSubmit={(event) => {
        event.preventDefault();
        const data = new FormData(event.currentTarget);
        onCreate({
          customerName: String(data.get("customer") || "") || undefined,
          contactRef: String(data.get("contact") || "") || undefined,
          priceBookId: String(data.get("priceBook")),
          serviceChannelId: String(data.get("channel")),
          tableSessionId: String(data.get("table") || "") || undefined,
        });
        event.currentTarget.reset();
      }}
    >
      <h3 className="text-sm font-semibold">Start order</h3>
      <Field label="Channel" htmlFor="pos-new-channel">
        <NativeSelect className="w-full" id="pos-new-channel" name="channel" required>
          {channels
            .filter((item) => item.enabled)
            .map((item) => (
              <NativeSelectOption key={item.id} value={item.id}>
                {item.name}
              </NativeSelectOption>
            ))}
        </NativeSelect>
      </Field>
      <Field label="Price book" htmlFor="pos-new-pricebook">
        <NativeSelect className="w-full" id="pos-new-pricebook" name="priceBook" required>
          {priceBooks.map((item) => (
            <NativeSelectOption key={item.id} value={item.id}>
              {`${item.name} · ${item.currency}`}
            </NativeSelectOption>
          ))}
        </NativeSelect>
      </Field>
      <Field label="Table" htmlFor="pos-new-table">
        <NativeSelect className="w-full" id="pos-new-table" name="table">
          <NativeSelectOption value="">No table</NativeSelectOption>
          {sessions
            .filter((item) => item.status === "open")
            .map((item) => (
              <NativeSelectOption key={item.id} value={item.id}>
                {`${item.guest_count} guests`}
              </NativeSelectOption>
            ))}
        </NativeSelect>
      </Field>
      <Input name="customer" placeholder="Guest / collection name" />
      <Input name="contact" placeholder="Contact" />
      <Button disabled={!channels.length || !priceBooks.length} type="submit">
        <PlusIcon />
        New order
      </Button>
    </form>
  );
}

function BottomStrip({ billing, menu, onQuickAdd }: {
  billing?: Billing;
  menu?: MenuCatalog;
  onQuickAdd: (itemId: string, quantity: number) => void;
}) {
  const [itemId, setItemId] = useState("");
  const [quantity, setQuantity] = useState(1);
  const paid = (billing?.bills ?? [])
    .filter((bill) => bill.status === "paid")
    .sort((a, b) => (a.id < b.id ? 1 : -1))[0];
  return (
    <div className="flex shrink-0 items-stretch gap-3 border-t border-border bg-accent p-3 shadow-sm dark:bg-card">
      <section className="min-h-16 min-w-0 flex-1 rounded-xl border border-border bg-background/60 p-3" aria-label="Last bill notification">
        {paid ? (
          <div className="text-emerald-700">
            <p className="text-xs font-semibold">✓ Paid</p>
            <p className="mt-1 text-sm">Last billed no. {paid.number} · {(paid.paid_minor / 100).toFixed(2)}</p>
          </div>
        ) : (
          <p className="text-sm text-muted-foreground">No billed receipt yet</p>
        )}
      </section>
      <section className="w-[410px] shrink-0 rounded-xl border border-border bg-background p-2.5 lg:w-[440px]" aria-label="Fast item entry">
        <form
          className="grid grid-cols-[minmax(0,1fr)_7rem_auto] items-end gap-2"
          onSubmit={(event) => {
            event.preventDefault();
            if (!itemId) return;
            onQuickAdd(itemId, quantity);
            setQuantity(1);
          }}
        >
          <div className="min-w-0">
            <p className="mb-1 min-h-4 truncate px-1 text-xs font-semibold text-foreground">
              {(menu?.items ?? []).find((entry) => entry.id === itemId)?.name ?? "Enter item code"}
            </p>
            <NativeSelect className="h-10 w-full font-mono text-xs" id="pos-quick-item" value={itemId} onChange={(event) => setItemId(event.currentTarget.value)}>
              <NativeSelectOption value="">Select item…</NativeSelectOption>
              {(menu?.items ?? []).map((item) => (
                <NativeSelectOption key={item.id} value={item.id}>
                  {item.name}
                </NativeSelectOption>
              ))}
            </NativeSelect>
          </div>
          <div>
            <p className="mb-1 px-1 text-xs font-medium text-muted-foreground">Qty</p>
            <div className="flex h-10 items-center justify-between gap-1 rounded-xl border border-border bg-background px-1.5 focus-within:border-primary focus-within:ring-1 focus-within:ring-primary">
              <button type="button" disabled={quantity <= 1} onClick={() => setQuantity(quantity - 1)} className="grid size-6 cursor-pointer place-items-center rounded-lg text-muted-foreground hover:bg-muted hover:text-foreground" aria-label="Decrease quantity">
                <MinusIcon size={12} />
              </button>
              <span className="w-8 bg-transparent text-center text-xs font-bold outline-none">{quantity}</span>
              <button type="button" onClick={() => setQuantity(quantity + 1)} className="grid size-6 cursor-pointer place-items-center rounded-lg text-muted-foreground hover:bg-muted hover:text-foreground" aria-label="Increase quantity">
                <PlusIcon size={12} />
              </button>
            </div>
          </div>
          <button type="submit" disabled={!itemId} className="flex h-10 cursor-pointer items-center gap-2 rounded-xl bg-blue-600 px-4 text-xs font-semibold text-white shadow-md transition-all hover:bg-blue-700 active:scale-[0.98] disabled:opacity-40">
            <PlusIcon size={16} />
            <span>Add</span>
          </button>
        </form>
      </section>
    </div>
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
