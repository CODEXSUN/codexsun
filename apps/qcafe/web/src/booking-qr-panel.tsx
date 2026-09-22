import { Badge } from "@codexsun/ui/components/badge";
import { Button } from "@codexsun/ui/components/button";
import { Input } from "@codexsun/ui/components/input";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { CopyIcon, QrCodeIcon, ScanLineIcon } from "lucide-react";
import { useState } from "react";
import { changeGuestBooking, readGuestBookings } from "./booking-api";
import type { BookingWorkspace } from "./pos-api";

export function BookingQrPanel({
  booking,
  businessId,
  locationId,
  request,
}: {
  booking?: BookingWorkspace;
  businessId: string;
  locationId: string;
  request: typeof fetch;
}) {
  const client = useQueryClient();
  const [freshPath, setFreshPath] = useState("");
  const key = ["qcafe", "guest-booking", businessId, locationId] as const;
  const query = useQuery({ queryKey: key, queryFn: () => readGuestBookings(request, businessId, locationId) });
  const change = useMutation({
    mutationFn: ({ input, path }: { input: Record<string, unknown>; path: string }) =>
      changeGuestBooking(request, path, input),
    onSuccess: async (value, variables) => {
      if (variables.path === "table-qr/rotate") setFreshPath((value as { path: string }).path);
      await client.invalidateQueries({ queryKey: key });
    },
  });
  const send = (path: string, input: Record<string, unknown>) => change.mutate({ input, path });
  const data = query.data;

  return (
    <div className="grid gap-7 xl:grid-cols-[minmax(0,1fr)_320px]">
      <section className="grid content-start gap-5">
        <div className="flex items-center justify-between border-b pb-3">
          <h2 className="font-semibold">Table entry QR</h2>
          <Badge variant="outline">Rotatable tokens</Badge>
        </div>
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {booking?.tables.map((table) => {
            const current = data?.qrTokens.find((token) => token.table_id === table.id && !token.revoked_at);
            return (
              <article className="grid gap-3 border p-4" key={table.id}>
                <div className="flex items-center justify-between">
                  <strong>{table.code}</strong>
                  <QrCodeIcon className="size-4" />
                </div>
                <p className="text-sm text-muted-foreground">
                  {current ? `Version ${current.version} · active` : "No active guest token"}
                </p>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => send("table-qr/rotate", { businessId, locationId, tableId: table.id })}
                >
                  Rotate token
                </Button>
              </article>
            );
          })}
        </div>
        {freshPath ? (
          <div className="grid gap-2 border-l-4 border-primary bg-muted/40 p-4">
            <strong className="text-sm">New guest link</strong>
            <code className="break-all text-xs">{`${window.location.origin}${freshPath}`}</code>
            <Button
              className="w-fit"
              size="sm"
              variant="outline"
              onClick={() => navigator.clipboard.writeText(`${window.location.origin}${freshPath}`)}
            >
              <CopyIcon /> Copy link
            </Button>
            <p className="text-xs text-muted-foreground">
              This raw token is shown once. Rotating it revokes the previous link.
            </p>
          </div>
        ) : null}
      </section>

      <aside className="grid content-start gap-5 border-l pl-5">
        <form
          className="grid gap-3"
          onSubmit={(event) => {
            event.preventDefault();
            const form = new FormData(event.currentTarget);
            send("scanners", {
              acceptedFormats: form.getAll("formats"),
              deviceRef: form.get("deviceRef"),
              locationId,
              scanPurpose: form.get("purpose"),
            });
          }}
        >
          <h2 className="font-semibold">Scanner profile</h2>
          <Input name="deviceRef" placeholder="Front desk tablet" required />
          <select className="h-9 rounded-md border bg-background px-3 text-sm" name="purpose">
            <option value="table_entry">Table entry</option>
            <option value="order">Order</option>
            <option value="inventory">Inventory</option>
          </select>
          <div className="flex flex-wrap gap-3 text-sm">
            {["qr", "code128", "data_matrix"].map((format) => (
              <label className="flex items-center gap-2" key={format}>
                <input defaultChecked={format === "qr"} name="formats" type="checkbox" value={format} /> {format}
              </label>
            ))}
          </div>
          <Button type="submit" variant="outline">
            <ScanLineIcon /> Save scanner
          </Button>
        </form>
        <div className="grid gap-2 border-t pt-4">
          <h3 className="text-sm font-semibold">Configured devices</h3>
          {data?.scannerProfiles.map((profile) => (
            <div className="text-sm" key={profile.id}>
              <strong>{profile.device_ref}</strong>
              <p className="text-xs text-muted-foreground">
                {profile.scan_purpose} · {JSON.parse(profile.accepted_formats_json).join(", ")}
              </p>
            </div>
          ))}
        </div>
        {change.error ? <p className="text-sm text-destructive">{change.error.message}</p> : null}
      </aside>
    </div>
  );
}
