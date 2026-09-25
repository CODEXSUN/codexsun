import { Badge } from "@codexsun/ui/components/badge";
import { Button } from "@codexsun/ui/components/button";
import { Input } from "@codexsun/ui/components/input";
import { NativeSelect, NativeSelectOption } from "@codexsun/ui/components/native-select";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { CheckIcon, ChefHatIcon, PrinterIcon, RotateCcwIcon } from "lucide-react";
import { useEffect, useState } from "react";
import { readFoundationSetup } from "./foundation-setup-api";
import { readMenu } from "./menu-api";
import { changeKitchen, readKitchen, type KitchenWorkspace } from "./pos-api";

const lanes = ["fired", "accepted", "preparing", "ready", "served"] as const;

export function KotPage({ request }: { request: typeof fetch }) {
  const client = useQueryClient();
  const setup = useQuery({
    queryKey: ["qcafe", "foundation", "setup"],
    queryFn: () => readFoundationSetup(request),
  });
  const business = setup.data?.businesses[0];
  const [locationId, setLocationId] = useState("");
  useEffect(() => {
    if (!locationId && business?.locations[0]) setLocationId(business.locations[0].id);
  }, [business, locationId]);
  const key = ["qcafe", "kitchen", business?.id, locationId] as const;
  const kitchen = useQuery({
    enabled: Boolean(business && locationId),
    queryKey: key,
    queryFn: () => readKitchen(request, business!.id, locationId),
    refetchInterval: 15_000,
  });
  const menu = useQuery({
    enabled: Boolean(business),
    queryKey: ["qcafe", "menu", business?.id],
    queryFn: () => readMenu(request, business!.id),
  });
  const change = useMutation({
    mutationFn: (work: { input: Record<string, unknown>; path: string }) =>
      changeKitchen(request, work.path, work.input),
    onSuccess: () => client.invalidateQueries({ queryKey: key }),
  });
  if (!business) return <p className="text-sm text-muted-foreground">Create the business and outlet first.</p>;
  const data = kitchen.data;
  const scope = { businessId: business.id, locationId };
  const send = (path: string, input: Record<string, unknown>) => change.mutate({ input, path });
  return (
    <div className="grid gap-6">
      <div className="flex flex-wrap items-center justify-between gap-3 border-b pb-4">
        <NativeSelect
          aria-label="Outlet"
          value={locationId}
          onChange={(event) => setLocationId(event.currentTarget.value)}
        >
          {business.locations.map((location) => (
            <NativeSelectOption key={location.id} value={location.id}>
              {location.name}
            </NativeSelectOption>
          ))}
        </NativeSelect>
        <div className="flex gap-2">
          <Badge>
            {data?.tickets.filter((ticket) => !["served", "voided"].includes(ticket.status)).length ?? 0} live
          </Badge>
          <Badge variant="outline">Auto refresh 15s</Badge>
        </div>
      </div>
      <div className="grid gap-3 overflow-x-auto lg:grid-cols-5">
        {lanes.map((lane) => (
          <section className="grid min-w-52 content-start gap-3" key={lane}>
            <h2 className="flex items-center justify-between border-b pb-2 text-sm font-semibold capitalize">
              {lane}
              <span>{data?.tickets.filter((ticket) => ticket.status === lane).length ?? 0}</span>
            </h2>
            {data?.tickets
              .filter((ticket) => ticket.status === lane)
              .map((ticket) => (
                <TicketCard
                  data={data}
                  key={ticket.id}
                  onAction={(action, note) => send(`tickets/${ticket.id}/actions`, { action, note })}
                  onPrint={(routeRef) => send(`tickets/${ticket.id}/print`, { routeRef })}
                  ticket={ticket}
                />
              ))}
          </section>
        ))}
      </div>
      <KitchenSetup data={data} menu={menu.data} scope={scope} send={send} />
      {change.error ? <p className="text-sm text-destructive">{change.error.message}</p> : null}
    </div>
  );
}

function TicketCard({
  data,
  onAction,
  onPrint,
  ticket,
}: {
  data: KitchenWorkspace;
  onAction: (action: string, note?: string) => void;
  onPrint: (route: string) => void;
  ticket: KitchenWorkspace["tickets"][number];
}) {
  const [note, setNote] = useState("");
  const station = data.stations.find((item) => item.id === ticket.station_id);
  const lines = data.lines.filter((line) => line.ticket_id === ticket.id);
  const next = { fired: "accept", accepted: "prepare", preparing: "ready", ready: "serve" }[ticket.status];
  const prints = data.printAttempts.filter((attempt) => attempt.ticket_id === ticket.id).length;
  return (
    <article className="grid gap-3 border bg-card p-3">
      <div className="flex items-start justify-between gap-2">
        <div>
          <strong className="text-sm">{ticket.number}</strong>
          <p className="text-xs text-muted-foreground">{station?.name}</p>
        </div>
        <Badge variant="outline">{lines.length}</Badge>
      </div>
      <div className="grid gap-2 border-y py-2">
        {lines.map((line) => (
          <p className="text-sm" key={line.id}>
            {line.quantity_milli / 1000} × line {line.order_line_id.slice(0, 6)}
          </p>
        ))}
      </div>
      <Input onChange={(event) => setNote(event.target.value)} placeholder="Action note" value={note} />
      {next ? (
        <Button onClick={() => onAction(next, note || undefined)} size="sm">
          <CheckIcon />
          {next}
        </Button>
      ) : null}
      {ticket.status === "ready" ? (
        <Button disabled={!note.trim()} onClick={() => onAction("recall", note)} size="sm" variant="outline">
          <RotateCcwIcon />
          Recall
        </Button>
      ) : null}
      {["fired", "accepted", "preparing", "recalled"].includes(ticket.status) ? (
        <Button disabled={!note.trim()} onClick={() => onAction("void", note)} size="sm" variant="destructive">
          Void
        </Button>
      ) : null}
      <form
        className="flex gap-1"
        onSubmit={(event) => {
          event.preventDefault();
          onPrint(String(new FormData(event.currentTarget).get("route")));
        }}
      >
        <Input aria-label="Printer route" defaultValue="kitchen-default" name="route" />
        <Button aria-label="Print ticket" size="icon-sm" type="submit" variant="outline">
          <PrinterIcon />
        </Button>
      </form>
      {prints ? (
        <span className="text-xs text-muted-foreground">
          {prints} print attempt{prints === 1 ? "" : "s"}
        </span>
      ) : null}
    </article>
  );
}

function KitchenSetup({
  data,
  menu,
  scope,
  send,
}: {
  data?: KitchenWorkspace;
  menu?: Awaited<ReturnType<typeof readMenu>>;
  scope: Record<string, string>;
  send: (path: string, input: Record<string, unknown>) => void;
}) {
  return (
    <section className="grid gap-5 border-t pt-5 lg:grid-cols-2">
      <QuickForm
        label="Add station"
        submit={(form) =>
          send("stations", {
            ...scope,
            code: form.get("code"),
            name: form.get("name"),
          })
        }
      >
        <Input name="name" placeholder="Hot kitchen" required />
        <Input name="code" placeholder="HOT" required />
      </QuickForm>
      <QuickForm
        label="Route item"
        submit={(form) =>
          send("routes", {
            ...scope,
            itemId: form.get("item"),
            priority: 0,
            stationId: form.get("station"),
          })
        }
      >
        <NativeSelect aria-label="Menu item" name="item">
          {(menu?.items ?? []).map((item) => (
            <NativeSelectOption key={item.id} value={item.id}>
              {item.name}
            </NativeSelectOption>
          ))}
        </NativeSelect>
        <NativeSelect aria-label="Kitchen station" name="station">
          {(data?.stations ?? []).map((station) => (
            <NativeSelectOption key={station.id} value={station.id}>
              {station.name}
            </NativeSelectOption>
          ))}
        </NativeSelect>
      </QuickForm>
    </section>
  );
}

function QuickForm({
  children,
  label,
  submit,
}: {
  children: React.ReactNode;
  label: string;
  submit: (data: FormData) => void;
}) {
  return (
    <form
      className="flex flex-wrap items-end gap-2"
      onSubmit={(event) => {
        event.preventDefault();
        submit(new FormData(event.currentTarget));
        event.currentTarget.reset();
      }}
    >
      <span className="w-full text-sm font-semibold">
        <ChefHatIcon className="mr-2 inline size-4" />
        {label}
      </span>
      {children}
      <Button type="submit" variant="outline">
        {label}
      </Button>
    </form>
  );
}
