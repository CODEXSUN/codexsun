import { Badge } from "@codexsun/ui/components/badge";
import { Button } from "@codexsun/ui/components/button";
import { Field } from "@codexsun/ui/components/field";
import { Input } from "@codexsun/ui/components/input";
import { NativeSelect, NativeSelectOption } from "@codexsun/ui/components/native-select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@codexsun/ui/components/table";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useEffect, useState } from "react";
import { readFoundationSetup } from "./foundation-setup-api";
import { changeMarketplace, readMarketplace, readReconciliation, type MarketplaceWorkspace } from "./marketplace-api";
import { readMenu } from "./menu-api";

type Sender = (path: string, input?: Record<string, unknown>) => void;

export function MarketplacePage({ request }: { request: typeof fetch }) {
  const client = useQueryClient();
  const setup = useQuery({ queryKey: ["qcafe", "foundation", "setup"], queryFn: () => readFoundationSetup(request) });
  const business = setup.data?.businesses[0];
  const [locationId, setLocationId] = useState("");
  useEffect(() => {
    if (!locationId && business?.locations[0]) setLocationId(business.locations[0].id);
  }, [business, locationId]);
  const key = ["qcafe", "marketplace", business?.id, locationId] as const;
  const marketplace = useQuery({
    enabled: Boolean(business && locationId),
    queryKey: key,
    queryFn: () => readMarketplace(request, business!.id, locationId),
  });
  const menu = useQuery({
    enabled: Boolean(business),
    queryKey: ["qcafe", "menu", business?.id],
    queryFn: () => readMenu(request, business!.id),
  });
  const change = useMutation({
    mutationFn: ({ input, path }: { input?: Record<string, unknown>; path: string }) => changeMarketplace(request, path, input),
    onSuccess: async () => {
      await client.invalidateQueries({ queryKey: key });
    },
  });
  if (!business) return <p className="text-sm text-muted-foreground">Create the business and outlet first.</p>;
  const data = marketplace.data;
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
          <Badge>{data?.partners.filter((item) => item.status === "active").length ?? 0} partners</Badge>
          <Badge variant="outline">{data?.intakes.filter((item) => item.status === "received").length ?? 0} unhandled intakes</Badge>
        </div>
      </div>
      <form
        className="grid max-w-xl gap-3"
        onSubmit={(event) => {
          event.preventDefault();
          const form = new FormData(event.currentTarget);
          send("partners", { adapterContract: form.get("adapterContract"), businessId: business.id, code: form.get("code"), name: form.get("name") });
          event.currentTarget.reset();
        }}
      >
        <h2 className="text-sm font-semibold">Register partner</h2>
        <Field label="Code" htmlFor="marketplace-partner-code"><Input id="marketplace-partner-code" name="code" required placeholder="ZOMATO" /></Field>
        <Field label="Name" htmlFor="marketplace-partner-name"><Input id="marketplace-partner-name" name="name" required placeholder="Zomato" /></Field>
        <Field label="Adapter contract" htmlFor="marketplace-partner-adapter">
          <NativeSelect className="w-full" id="marketplace-partner-adapter" name="adapterContract" required>
            <NativeSelectOption value="zomato.v1">zomato.v1</NativeSelectOption>
            <NativeSelectOption value="swiggy.v1">swiggy.v1</NativeSelectOption>
            <NativeSelectOption value="ubereats.v1">ubereats.v1</NativeSelectOption>
            <NativeSelectOption value="generic-webhook.v1">generic-webhook.v1</NativeSelectOption>
          </NativeSelect>
        </Field>
        <Button className="w-fit" type="submit" variant="outline">
          Register
        </Button>
      </form>
      {(data?.partners ?? []).map((partner) => (
        <div className="flex flex-wrap items-center gap-3 border-t pt-3" key={partner.id}>
          <strong className="text-sm">{partner.name}</strong>
          <Badge variant="outline">{partner.adapter_contract}</Badge>
          <Badge variant={partner.status === "active" ? "default" : "secondary"}>{partner.status}</Badge>
          {partner.status === "active" ? (
            <Button size="sm" variant="ghost" onClick={() => send(`partners/${partner.id}/suspend`)}>
              Suspend
            </Button>
          ) : (
            <Button size="sm" variant="ghost" onClick={() => send(`partners/${partner.id}/reactivate`)}>
              Reactivate
            </Button>
          )}
        </div>
      ))}
      <form
        className="grid max-w-xl gap-3"
        onSubmit={(event) => {
          event.preventDefault();
          const form = new FormData(event.currentTarget);
          send("menu-mappings", {
            ...scope,
            menuItemId: form.get("menuItemId"),
            partnerId: form.get("partnerId"),
            partnerItemRef: form.get("partnerItemRef"),
          });
          event.currentTarget.reset();
        }}
      >
        <h2 className="text-sm font-semibold">Map partner menu</h2>
        <Field label="Partner" htmlFor="marketplace-mapping-partner">
          <NativeSelect className="w-full" id="marketplace-mapping-partner" name="partnerId" required>
            {(data?.partners ?? []).map((partner) => (
              <NativeSelectOption key={partner.id} value={partner.id}>
                {partner.name}
              </NativeSelectOption>
            ))}
          </NativeSelect>
        </Field>
        <Field label="Partner item reference" htmlFor="marketplace-mapping-ref"><Input id="marketplace-mapping-ref" name="partnerItemRef" required placeholder="Z-MEAL" /></Field>
        <Field label="Menu item" htmlFor="marketplace-mapping-item">
          <NativeSelect className="w-full" id="marketplace-mapping-item" name="menuItemId" required>
            {(menu.data?.items ?? []).map((item) => (
              <NativeSelectOption key={item.id} value={item.id}>
                {item.name}
              </NativeSelectOption>
            ))}
          </NativeSelect>
        </Field>
        <Button className="w-fit" type="submit" variant="outline">
          Map item
        </Button>
      </form>
      <section className="grid gap-3">
        <h2 className="text-sm font-semibold">Order intake</h2>
        {(data?.intakes ?? []).map((intake) => (
          <IntakeCard key={intake.id} intake={intake} request={request} send={send} />
        ))}
        {!(data?.intakes ?? []).length ? <p className="text-sm text-muted-foreground">No partner orders yet.</p> : null}
      </section>
      <form
        className="grid max-w-xl gap-3"
        onSubmit={(event) => {
          event.preventDefault();
          const form = new FormData(event.currentTarget);
          send("settlements", {
            ...scope,
            feeMinor: Math.round(Number(form.get("fee")) * 100),
            grossMinor: Math.round(Number(form.get("gross")) * 100),
            partnerId: form.get("partnerId"),
            periodFrom: form.get("periodFrom"),
            periodTo: form.get("periodTo"),
          });
          event.currentTarget.reset();
        }}
      >
        <h2 className="text-sm font-semibold">Record settlement</h2>
        <Field label="Partner" htmlFor="marketplace-settlement-partner">
          <NativeSelect className="w-full" id="marketplace-settlement-partner" name="partnerId" required>
            {(data?.partners ?? []).map((partner) => (
              <NativeSelectOption key={partner.id} value={partner.id}>
                {partner.name}
              </NativeSelectOption>
            ))}
          </NativeSelect>
        </Field>
        <Field label="Period from" htmlFor="marketplace-settlement-from"><Input id="marketplace-settlement-from" name="periodFrom" required type="date" /></Field>
        <Field label="Period to" htmlFor="marketplace-settlement-to"><Input id="marketplace-settlement-to" name="periodTo" required type="date" /></Field>
        <Field label="Gross" htmlFor="marketplace-settlement-gross"><Input id="marketplace-settlement-gross" name="gross" required type="number" min="0" step="0.01" /></Field>
        <Field label="Fee" htmlFor="marketplace-settlement-fee"><Input id="marketplace-settlement-fee" name="fee" required type="number" min="0" step="0.01" /></Field>
        <Button className="w-fit" type="submit" variant="outline">
          Record settlement
        </Button>
      </form>
      <Table className="min-w-[640px]">
        <TableHeader>
          <TableRow>
            <TableHead>Period</TableHead>
            <TableHead>Gross</TableHead>
            <TableHead>Fee</TableHead>
            <TableHead>Net</TableHead>
            <TableHead>Status</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {(data?.settlements ?? []).map((settlement) => (
            <TableRow key={settlement.id}>
              <TableCell className="text-xs">
                {settlement.period_from} → {settlement.period_to}
              </TableCell>
              <TableCell>{(settlement.gross_minor / 100).toFixed(2)}</TableCell>
              <TableCell>{(settlement.fee_minor / 100).toFixed(2)}</TableCell>
              <TableCell>{(settlement.net_minor / 100).toFixed(2)}</TableCell>
              <TableCell>
                <div className="flex items-center gap-2">
                  <Badge variant={settlement.status === "posted" ? "default" : "secondary"}>{settlement.status}</Badge>
                  {settlement.status === "pending" ? (
                    <Button size="sm" variant="ghost" onClick={() => send(`settlements/${settlement.id}/post`)}>
                      Post
                    </Button>
                  ) : null}
                </div>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
      {change.isPending ? <p className="text-sm text-muted-foreground">Recording marketplace change...</p> : null}
      {change.error ? <p className="text-sm text-destructive">{change.error.message}</p> : null}
    </div>
  );
}

function IntakeCard({ intake, request, send }: { intake: MarketplaceWorkspace["intakes"][number]; request: typeof fetch; send: Sender }) {
  const [reconciliation, setReconciliation] = useState<Record<string, unknown> | null>(null);
  return (
    <div className="grid gap-2 border-t pt-3">
      <div className="flex flex-wrap items-center gap-2 text-sm">
        <strong>{intake.partner_order_ref}</strong>
        <Badge variant={intake.status === "accepted" ? "default" : "secondary"}>{intake.status}</Badge>
        <span className="text-xs text-muted-foreground">{(intake.total_minor / 100).toFixed(2)}</span>
      </div>
      <div className="flex flex-wrap gap-2">
        {intake.status === "received" ? (
          <>
            <Button size="sm" variant="outline" onClick={() => send(`intakes/${intake.id}/accept`)}>
              Accept
            </Button>
            <Button size="sm" variant="ghost" onClick={() => send(`intakes/${intake.id}/reject`, { reason: "Outlet cannot fulfill" })}>
              Reject
            </Button>
          </>
        ) : null}
        {intake.status === "accepted" && !intake.pos_order_id ? (
          <span className="text-xs text-muted-foreground">Link a POS order from the API to start fulfillment.</span>
        ) : null}
        <Button
          size="sm"
          variant="ghost"
          onClick={async () => {
            try {
              setReconciliation(await readReconciliation(request, intake.id));
            } catch {
              setReconciliation({ balanced: false, error: "Reconciliation needs a linked order and fulfillment." });
            }
          }}
        >
          Reconcile
        </Button>
      </div>
      {reconciliation ? (
        <p className="text-xs text-muted-foreground">
          Balanced: {String(reconciliation.balanced)} · variance {String(reconciliation.collectionVarianceMinor ?? "-")}
        </p>
      ) : null}
    </div>
  );
}
