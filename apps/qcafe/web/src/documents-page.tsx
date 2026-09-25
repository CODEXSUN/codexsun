import { Badge } from "@codexsun/ui/components/badge";
import { Button } from "@codexsun/ui/components/button";
import { Field } from "@codexsun/ui/components/field";
import { Input } from "@codexsun/ui/components/input";
import { NativeSelect, NativeSelectOption } from "@codexsun/ui/components/native-select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@codexsun/ui/components/table";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useEffect, useState } from "react";
import { readFoundationSetup } from "./foundation-setup-api";
import { changeDocuments, readDocuments, type DocumentsWorkspace } from "./documents-api";

type Mode = "documents" | "printers" | "jobs" | "delivery";
type Sender = (path: string, input?: Record<string, unknown>) => void;

export function DocumentsPage({ request }: { request: typeof fetch }) {
  const client = useQueryClient();
  const setup = useQuery({ queryKey: ["qcafe", "foundation", "setup"], queryFn: () => readFoundationSetup(request) });
  const business = setup.data?.businesses[0];
  const [locationId, setLocationId] = useState("");
  const [mode, setMode] = useState<Mode>("documents");
  useEffect(() => {
    if (!locationId && business?.locations[0]) setLocationId(business.locations[0].id);
  }, [business, locationId]);
  const key = ["qcafe", "documents", business?.id, locationId] as const;
  const documents = useQuery({
    enabled: Boolean(business && locationId),
    queryKey: key,
    queryFn: () => readDocuments(request, business!.id, locationId),
  });
  const change = useMutation({
    mutationFn: ({ input, path }: { input?: Record<string, unknown>; path: string }) => changeDocuments(request, path, input),
    onSuccess: async () => {
      await client.invalidateQueries({ queryKey: key });
    },
  });
  if (!business) return <p className="text-sm text-muted-foreground">Create the business and outlet first.</p>;
  const data = documents.data;
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
          <Badge>{data?.documents.filter((item) => item.status === "draft").length ?? 0} drafts</Badge>
          <Badge variant="outline">{data?.jobs.filter((item) => item.status === "pending").length ?? 0} pending jobs</Badge>
        </div>
      </div>
      <nav aria-label="Documents views" className="flex flex-wrap gap-1 border-b pb-3">
        {(["documents", "printers", "jobs", "delivery"] as const).map((item) => (
          <Button key={item} onClick={() => setMode(item)} size="sm" variant={mode === item ? "default" : "ghost"}>
            {item}
          </Button>
        ))}
      </nav>
      {mode === "documents" ? <DocumentPanel data={data} scope={scope} send={send} /> : null}
      {mode === "printers" ? <PrinterPanel data={data} scope={scope} send={send} /> : null}
      {mode === "jobs" ? <JobPanel data={data} send={send} /> : null}
      {mode === "delivery" ? <DeliveryPanel data={data} scope={scope} send={send} /> : null}
      {change.isPending ? <p className="text-sm text-muted-foreground">Recording print change...</p> : null}
      {change.error ? <p className="text-sm text-destructive">{change.error.message}</p> : null}
    </div>
  );
}

function DocumentPanel({ data, scope, send }: { data?: DocumentsWorkspace; scope: { businessId: string; locationId: string }; send: Sender }) {
  return (
    <div className="grid gap-6">
      <form
        className="grid max-w-xl gap-3"
        onSubmit={(event) => {
          event.preventDefault();
          const form = new FormData(event.currentTarget);
          send("", { ...scope, kind: form.get("kind"), title: form.get("title") });
          event.currentTarget.reset();
        }}
      >
        <h2 className="text-sm font-semibold">New document</h2>
        <Field label="Kind" htmlFor="documents-kind">
          <NativeSelect className="w-full" id="documents-kind" name="kind" required>
            <NativeSelectOption value="receipt">Receipt</NativeSelectOption>
            <NativeSelectOption value="kot">KOT</NativeSelectOption>
            <NativeSelectOption value="report">Report</NativeSelectOption>
            <NativeSelectOption value="voucher">Voucher</NativeSelectOption>
            <NativeSelectOption value="label">Label</NativeSelectOption>
          </NativeSelect>
        </Field>
        <Field label="Title" htmlFor="documents-title"><Input id="documents-title" name="title" required placeholder="Bill RCT-000001" /></Field>
        <Button className="w-fit" type="submit" variant="outline">
          Create document
        </Button>
      </form>
      <Table className="min-w-[640px]">
        <TableHeader>
          <TableRow>
            <TableHead>Title</TableHead>
            <TableHead>Kind</TableHead>
            <TableHead>Status</TableHead>
            <TableHead>Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {(data?.documents ?? []).map((document) => (
            <TableRow key={document.id}>
              <TableCell className="font-medium">{document.title}</TableCell>
              <TableCell>{document.kind}</TableCell>
              <TableCell>
                <Badge variant={document.status === "rendered" ? "default" : "secondary"}>{document.status}</Badge>
              </TableCell>
              <TableCell>
                <div className="flex flex-wrap gap-2">
                  {document.status === "draft" ? (
                    <Button size="sm" variant="outline" onClick={() => send(`${document.id}/render`)}>
                      Render
                    </Button>
                  ) : null}
                  <Button size="sm" variant="ghost" onClick={() => send("print-jobs", { ...scope, documentId: document.id, preview: false })}>
                    Queue print
                  </Button>
                  <Button size="sm" variant="ghost" onClick={() => send("print-jobs", { ...scope, documentId: document.id, preview: true })}>
                    Preview
                  </Button>
                </div>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}

function PrinterPanel({ data, scope, send }: { data?: DocumentsWorkspace; scope: { businessId: string; locationId: string }; send: Sender }) {
  return (
    <div className="grid gap-6">
      <form
        className="grid max-w-xl gap-3"
        onSubmit={(event) => {
          event.preventDefault();
          const form = new FormData(event.currentTarget);
          send("printers", { ...scope, code: form.get("code"), configRef: String(form.get("configRef") ?? "").trim() || undefined, kind: form.get("kind"), name: form.get("name") });
          event.currentTarget.reset();
        }}
      >
        <h2 className="text-sm font-semibold">New printer profile</h2>
        <Field label="Code" htmlFor="documents-printer-code"><Input id="documents-printer-code" name="code" required placeholder="COUNTER" /></Field>
        <Field label="Name" htmlFor="documents-printer-name"><Input id="documents-printer-name" name="name" required placeholder="Counter printer" /></Field>
        <Field label="Kind" htmlFor="documents-printer-kind">
          <NativeSelect className="w-full" id="documents-printer-kind" name="kind" required>
            <NativeSelectOption value="browser">Browser</NativeSelectOption>
            <NativeSelectOption value="direct">Direct</NativeSelectOption>
            <NativeSelectOption value="gateway">Gateway</NativeSelectOption>
            <NativeSelectOption value="bluetooth">Bluetooth</NativeSelectOption>
            <NativeSelectOption value="network">Network</NativeSelectOption>
          </NativeSelect>
        </Field>
        <Field label="Endpoint reference" htmlFor="documents-printer-config"><Input id="documents-printer-config" name="configRef" placeholder="Required for gateway, Bluetooth, and network" /></Field>
        <Button className="w-fit" type="submit" variant="outline">
          Add printer
        </Button>
      </form>
      <form
        className="grid max-w-xl gap-3"
        onSubmit={(event) => {
          event.preventDefault();
          const form = new FormData(event.currentTarget);
          send("printer-routes", {
            documentKind: form.get("documentKind"),
            fallbackProfileId: String(form.get("fallbackProfileId") ?? "").trim() || undefined,
            locationId: scope.locationId,
            printerProfileId: form.get("printerProfileId"),
          });
          event.currentTarget.reset();
        }}
      >
        <h2 className="text-sm font-semibold">New print route</h2>
        <Field label="Document kind" htmlFor="documents-route-kind">
          <NativeSelect className="w-full" id="documents-route-kind" name="documentKind" required>
            <NativeSelectOption value="receipt">Receipt</NativeSelectOption>
            <NativeSelectOption value="kot">KOT</NativeSelectOption>
            <NativeSelectOption value="report">Report</NativeSelectOption>
            <NativeSelectOption value="voucher">Voucher</NativeSelectOption>
            <NativeSelectOption value="label">Label</NativeSelectOption>
          </NativeSelect>
        </Field>
        <Field label="Printer" htmlFor="documents-route-printer">
          <NativeSelect className="w-full" id="documents-route-printer" name="printerProfileId" required>
            {(data?.printerProfiles ?? []).map((profile) => (
              <NativeSelectOption key={profile.id} value={profile.id}>
                {profile.name}
              </NativeSelectOption>
            ))}
          </NativeSelect>
        </Field>
        <Field label="Fallback printer" htmlFor="documents-route-fallback">
          <NativeSelect className="w-full" id="documents-route-fallback" name="fallbackProfileId">
            <NativeSelectOption value="">None</NativeSelectOption>
            {(data?.printerProfiles ?? []).map((profile) => (
              <NativeSelectOption key={profile.id} value={profile.id}>
                {profile.name}
              </NativeSelectOption>
            ))}
          </NativeSelect>
        </Field>
        <Button className="w-fit" type="submit" variant="outline">
          Add route
        </Button>
      </form>
      <Table className="min-w-[640px]">
        <TableHeader>
          <TableRow>
            <TableHead>Printer</TableHead>
            <TableHead>Kind</TableHead>
            <TableHead>Active</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {(data?.printerProfiles ?? []).map((profile) => (
            <TableRow key={profile.id}>
              <TableCell>
                <div className="font-medium">{profile.name}</div>
                <div className="text-xs text-muted-foreground">{profile.code}</div>
              </TableCell>
              <TableCell>{profile.kind}</TableCell>
              <TableCell>{profile.active ? "Yes" : "No"}</TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}

function JobPanel({ data, send }: { data?: DocumentsWorkspace; send: Sender }) {
  return (
    <div className="grid gap-6">
      <Table className="min-w-[680px]">
        <TableHeader>
          <TableRow>
            <TableHead>Job</TableHead>
            <TableHead>Status</TableHead>
            <TableHead>Attempts</TableHead>
            <TableHead>Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {(data?.jobs ?? []).map((job) => {
            const attempts = (data?.attempts ?? []).filter((attempt) => attempt.job_id === job.id);
            const document = (data?.documents ?? []).find((item) => item.id === job.document_id);
            return (
              <TableRow key={job.id}>
                <TableCell>
                  <div className="font-medium">{document?.title ?? job.id.slice(0, 8)}</div>
                  <div className="text-xs text-muted-foreground">
                    {attempts.map((attempt) => `${attempt.attempt_number}:${attempt.status}`).join(" · ")}
                  </div>
                </TableCell>
                <TableCell>
                  <Badge variant={job.status === "acknowledged" ? "default" : job.status === "failed" ? "destructive" : "secondary"}>
                    {job.status}
                  </Badge>
                </TableCell>
                <TableCell>{job.attempt_count}</TableCell>
                <TableCell>
                  <div className="flex flex-wrap gap-2">
                    {job.status === "preview" ? (
                      <Button size="sm" variant="outline" onClick={() => send(`print-jobs/${job.id}/preview-confirm`)}>
                        Confirm preview
                      </Button>
                    ) : null}
                    <Button size="sm" variant="ghost" onClick={() => send(`print-jobs/${job.id}/dispatch`)}>
                      Dispatch
                    </Button>
                    {job.status !== "acknowledged" && job.status !== "preview" ? (
                      <Button size="sm" variant="ghost" onClick={() => send(`print-jobs/${job.id}/attempts`, { status: "acknowledged" })}>
                        Acknowledge
                      </Button>
                    ) : null}
                    {job.status !== "acknowledged" && job.status !== "preview" ? (
                      <Button size="sm" variant="ghost" onClick={() => send(`print-jobs/${job.id}/reprints`)}>
                        Reprint
                      </Button>
                    ) : null}
                  </div>
                  {job.status !== "acknowledged" && job.status !== "preview" ? (
                    <form
                      className="mt-2 flex gap-2"
                      onSubmit={(event) => {
                        event.preventDefault();
                        const form = new FormData(event.currentTarget);
                        send(`print-jobs/${job.id}/attempts`, { error: form.get("error"), status: "failed" });
                        event.currentTarget.reset();
                      }}
                    >
                      <Input aria-label="Failure reason" name="error" placeholder="Failure reason" required />
                      <Button size="sm" type="submit" variant="outline">
                        Fail
                      </Button>
                    </form>
                  ) : null}
                </TableCell>
              </TableRow>
            );
          })}
        </TableBody>
      </Table>
    </div>
  );
}

function DeliveryPanel({ data, scope, send }: { data?: DocumentsWorkspace; scope: { businessId: string; locationId: string }; send: Sender }) {
  return (
    <div className="grid gap-6">
      <form
        className="grid max-w-xl gap-3"
        onSubmit={(event) => {
          event.preventDefault();
          const form = new FormData(event.currentTarget);
          send("delivery-consents", { ...scope, channel: form.get("channel"), customerRef: form.get("customerRef") });
          event.currentTarget.reset();
        }}
      >
        <h2 className="text-sm font-semibold">Record customer consent</h2>
        <Field label="Customer reference" htmlFor="documents-consent-customer"><Input id="documents-consent-customer" name="customerRef" required placeholder="C-1" /></Field>
        <Field label="Channel" htmlFor="documents-consent-channel">
          <NativeSelect className="w-full" id="documents-consent-channel" name="channel" required>
            <NativeSelectOption value="email">Email</NativeSelectOption>
            <NativeSelectOption value="whatsapp">WhatsApp</NativeSelectOption>
          </NativeSelect>
        </Field>
        <Button className="w-fit" type="submit" variant="outline">
          Grant consent
        </Button>
      </form>
      <form
        className="grid max-w-xl gap-3"
        onSubmit={(event) => {
          event.preventDefault();
          const form = new FormData(event.currentTarget);
          send("deliveries", {
            ...scope,
            channel: form.get("channel"),
            customerRef: form.get("customerRef"),
            destination: form.get("destination"),
            documentId: form.get("documentId"),
          });
          event.currentTarget.reset();
        }}
      >
        <h2 className="text-sm font-semibold">Queue delivery</h2>
        <Field label="Document" htmlFor="documents-delivery-document">
          <NativeSelect className="w-full" id="documents-delivery-document" name="documentId" required>
            {(data?.documents ?? [])
              .filter((document) => document.status === "rendered")
              .map((document) => (
                <NativeSelectOption key={document.id} value={document.id}>
                  {document.title}
                </NativeSelectOption>
              ))}
          </NativeSelect>
        </Field>
        <Field label="Channel" htmlFor="documents-delivery-channel">
          <NativeSelect className="w-full" id="documents-delivery-channel" name="channel" required>
            <NativeSelectOption value="email">Email</NativeSelectOption>
            <NativeSelectOption value="whatsapp">WhatsApp</NativeSelectOption>
          </NativeSelect>
        </Field>
        <Field label="Customer reference" htmlFor="documents-delivery-customer"><Input id="documents-delivery-customer" name="customerRef" required placeholder="C-1" /></Field>
        <Field label="Destination" htmlFor="documents-delivery-destination"><Input id="documents-delivery-destination" name="destination" required placeholder="a@example.com or +919876543210" /></Field>
        <Button className="w-fit" type="submit" variant="outline">
          Queue delivery
        </Button>
      </form>
      <Table className="min-w-[640px]">
        <TableHeader>
          <TableRow>
            <TableHead>Destination</TableHead>
            <TableHead>Channel</TableHead>
            <TableHead>Status</TableHead>
            <TableHead>Provider</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {(data?.deliveries ?? []).map((delivery) => (
            <TableRow key={delivery.id}>
              <TableCell className="font-medium">{delivery.destination}</TableCell>
              <TableCell>{delivery.channel}</TableCell>
              <TableCell>
                <Badge variant={delivery.status === "sent" ? "default" : delivery.status === "failed" ? "destructive" : "secondary"}>
                  {delivery.status}
                </Badge>
              </TableCell>
              <TableCell className="text-xs text-muted-foreground">{delivery.provider_reference ?? "-"}</TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
      {(data?.deliveries ?? [])
        .filter((delivery) => delivery.status === "queued")
        .map((delivery) => (
          <form
            className="flex max-w-xl flex-wrap items-end gap-3 border-t pt-3 text-sm"
            key={delivery.id}
            onSubmit={(event) => {
              event.preventDefault();
              const form = new FormData(event.currentTarget);
              send(`deliveries/${delivery.id}/result`, {
                error: String(form.get("error") ?? "").trim() || undefined,
                providerReference: String(form.get("providerReference") ?? "").trim() || undefined,
                status: form.get("action"),
              });
              event.currentTarget.reset();
            }}
          >
            <span className="text-muted-foreground">
              {delivery.destination} · {delivery.channel}
            </span>
            <Field label="Provider reference" htmlFor={`documents-delivery-provider-${delivery.id}`}>
              <Input id={`documents-delivery-provider-${delivery.id}`} name="providerReference" placeholder="Required when sent" />
            </Field>
            <Field label="Error" htmlFor={`documents-delivery-error-${delivery.id}`}>
              <Input id={`documents-delivery-error-${delivery.id}`} name="error" placeholder="Required when failed" />
            </Field>
            <Field label="Outcome" htmlFor={`documents-delivery-action-${delivery.id}`}>
              <NativeSelect className="w-full" id={`documents-delivery-action-${delivery.id}`} name="action" required>
                <NativeSelectOption value="sent">Sent</NativeSelectOption>
                <NativeSelectOption value="failed">Failed</NativeSelectOption>
              </NativeSelect>
            </Field>
            <Button size="sm" type="submit" variant="outline">
              Resolve
            </Button>
          </form>
        ))}
    </div>
  );
}
