import { Badge } from "@codexsun/ui/components/badge";
import { Button } from "@codexsun/ui/components/button";
import { Field } from "@codexsun/ui/components/field";
import { Input } from "@codexsun/ui/components/input";
import { NativeSelect, NativeSelectOption } from "@codexsun/ui/components/native-select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@codexsun/ui/components/table";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useEffect, useState } from "react";
import { readFoundationSetup } from "./foundation-setup-api";
import { changeSync, readPendingChanges, readSync, type SyncWorkspace } from "./sync-api";

type Sender = (path: string, input?: Record<string, unknown>) => void;

export function SyncPage({ request }: { request: typeof fetch }) {
  const client = useQueryClient();
  const setup = useQuery({ queryKey: ["qcafe", "foundation", "setup"], queryFn: () => readFoundationSetup(request) });
  const business = setup.data?.businesses[0];
  const [locationId, setLocationId] = useState("");
  useEffect(() => {
    if (!locationId && business?.locations[0]) setLocationId(business.locations[0].id);
  }, [business, locationId]);
  const key = ["qcafe", "sync", business?.id, locationId] as const;
  const sync = useQuery({
    enabled: Boolean(business && locationId),
    queryKey: key,
    queryFn: () => readSync(request, business!.id, locationId),
  });
  const change = useMutation({
    mutationFn: ({ input, path }: { input?: Record<string, unknown>; path: string }) => changeSync(request, path, input),
    onSuccess: async () => {
      await client.invalidateQueries({ queryKey: key });
    },
  });
  if (!business) return <p className="text-sm text-muted-foreground">Create the business and outlet first.</p>;
  const data = sync.data;
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
          <Badge>{data?.devices.filter((item) => item.status === "active").length ?? 0} devices</Badge>
          <Badge variant="outline">{data?.conflicts.filter((item) => item.status === "pending").length ?? 0} open conflicts</Badge>
        </div>
      </div>
      <form
        className="grid max-w-xl gap-3"
        onSubmit={(event) => {
          event.preventDefault();
          const form = new FormData(event.currentTarget);
          send("devices", { ...scope, deviceCode: form.get("deviceCode"), name: form.get("name"), platform: form.get("platform") });
          event.currentTarget.reset();
        }}
      >
        <h2 className="text-sm font-semibold">Register device</h2>
        <Field label="Device code" htmlFor="sync-device-code"><Input id="sync-device-code" name="deviceCode" required placeholder="POS-1" /></Field>
        <Field label="Name" htmlFor="sync-device-name"><Input id="sync-device-name" name="name" required placeholder="Counter POS" /></Field>
        <Field label="Platform" htmlFor="sync-device-platform">
          <NativeSelect className="w-full" id="sync-device-platform" name="platform" required>
            <NativeSelectOption value="web">Web</NativeSelectOption>
            <NativeSelectOption value="desktop">Desktop</NativeSelectOption>
            <NativeSelectOption value="mobile">Mobile</NativeSelectOption>
          </NativeSelect>
        </Field>
        <Button className="w-fit" type="submit" variant="outline">
          Register
        </Button>
      </form>
      <Table className="min-w-[640px]">
        <TableHeader>
          <TableRow>
            <TableHead>Device</TableHead>
            <TableHead>Platform</TableHead>
            <TableHead>Status</TableHead>
            <TableHead>Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {(data?.devices ?? []).map((device) => (
            <DeviceRow key={device.id} device={device} request={request} send={send} />
          ))}
        </TableBody>
      </Table>
      <section className="grid gap-3">
        <h2 className="text-sm font-semibold">Conflicts</h2>
        {(data?.conflicts ?? []).map((conflict) => (
          <div className="grid gap-2 border-b py-3" key={conflict.id}>
            <div className="flex flex-wrap items-center gap-2 text-sm">
              <Badge variant={conflict.status === "pending" ? "destructive" : "default"}>{conflict.status}</Badge>
              <strong>{conflict.entity_type}</strong>
              <span className="text-xs text-muted-foreground">{conflict.reason}</span>
            </div>
            {conflict.status === "pending" ? (
              <form
                className="flex max-w-xl flex-wrap gap-2"
                onSubmit={(event) => {
                  event.preventDefault();
                  const form = new FormData(event.currentTarget);
                  send(`conflicts/${conflict.id}/resolve`, {
                    decidedBy: form.get("decidedBy"),
                    reason: form.get("reason"),
                    resolution: form.get("resolution"),
                  });
                  event.currentTarget.reset();
                }}
              >
                <NativeSelect aria-label="Resolution" name="resolution" required>
                  <NativeSelectOption value="keep-local">Keep local</NativeSelectOption>
                  <NativeSelectOption value="keep-remote">Keep remote</NativeSelectOption>
                  <NativeSelectOption value="retry">Retry</NativeSelectOption>
                  <NativeSelectOption value="escalated">Escalate</NativeSelectOption>
                </NativeSelect>
                <Input aria-label="Decider" name="decidedBy" placeholder="Decider" required />
                <Input aria-label="Reason" name="reason" placeholder="Reason" required />
                <Button size="sm" type="submit" variant="outline">
                  Resolve
                </Button>
              </form>
            ) : (
              <p className="text-xs text-muted-foreground">
                {conflict.resolution} by {conflict.decided_by}
              </p>
            )}
          </div>
        ))}
      </section>
      {change.isPending ? <p className="text-sm text-muted-foreground">Recording sync change...</p> : null}
      {change.error ? <p className="text-sm text-destructive">{change.error.message}</p> : null}
    </div>
  );
}

function DeviceRow({ device, request, send }: { device: SyncWorkspace["devices"][number]; request: typeof fetch; send: Sender }) {
  const pending = useQuery({
    queryKey: ["qcafe", "sync", "pending", device.id],
    queryFn: () => readPendingChanges(request, device.id),
  });
  return (
    <TableRow>
      <TableCell>
        <div className="font-medium">{device.name}</div>
        <div className="text-xs text-muted-foreground">{device.device_code}</div>
      </TableCell>
      <TableCell>{device.platform}</TableCell>
      <TableCell>
        <Badge variant={device.status === "active" ? "default" : "secondary"}>{device.status}</Badge>
      </TableCell>
      <TableCell>
        <div className="flex flex-wrap items-center gap-2">
          <span className="text-xs text-muted-foreground">{pending.data?.changes.length ?? 0} pending</span>
          {device.status === "active" ? (
            <>
              <Button
                size="sm"
                variant="ghost"
                disabled={!pending.data || pending.data.changes.length === 0}
                onClick={() => send(`devices/${device.id}/cursor`, { lastSeq: pending.data?.lastSeq ?? 0 })}
              >
                Catch up
              </Button>
              <Button size="sm" variant="ghost" onClick={() => send(`devices/${device.id}/revoke`)}>
                Revoke
              </Button>
            </>
          ) : null}
        </div>
      </TableCell>
    </TableRow>
  );
}
