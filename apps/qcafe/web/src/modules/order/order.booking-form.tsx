import { useState } from "react";
import { Button } from "@codexsun/ui/components/button";
import { Input } from "@codexsun/ui/components/input";
import { WorkspaceFormBanner } from "@codexsun/ui/workspace/upsert";
import { bookingSchema } from "./order.schema";
import type { BookingDetails } from "./order.types";

export function BookingDetailsForm({
  value,
  busy,
  onSave,
  onCancel
}: {
  value: BookingDetails | null;
  busy: boolean;
  onSave: (details: BookingDetails) => Promise<void>;
  onCancel: () => void;
}) {
  const [customerName, setName] = useState(value?.customerName ?? "");
  const [mobile, setMobile] = useState(value?.mobile ?? "");
  const [pickup, setPickup] = useState(value ? localPickup(value.pickupAt) : "");
  const [error, setError] = useState("");
  const invalidName = !!error && !customerName.trim();
  const invalidMobile = !!error && !/^\+?[0-9]{7,15}$/u.test(mobile.trim());
  const invalidPickup =
    !!error &&
    (!pickup ||
      !Number.isFinite(new Date(pickup).getTime()) ||
      new Date(pickup).getTime() <= Date.now());
  async function submit(event: React.FormEvent) {
    event.preventDefault();
    const time = new Date(pickup).getTime();
    if (!Number.isFinite(time) || time <= Date.now()) {
      setError("Choose a pickup date and time in the future.");
      return;
    }
    const parsed = bookingSchema.safeParse({
      customerName,
      mobile,
      pickupAt: new Date(time).toISOString()
    });
    if (!parsed.success) {
      setError(parsed.error.issues[0]?.message ?? "Check booking details.");
      return;
    }
    setError("");
    await onSave(parsed.data);
  }
  return (
    <form noValidate className="grid gap-4" onSubmit={(event) => void submit(event)}>
      {error && (
        <WorkspaceFormBanner title="Check booking details" tone="error">
          {error}
        </WorkspaceFormBanner>
      )}
      <label className="grid gap-2 text-sm">
        <span>
          Customer name <span className="text-destructive">*</span>
        </span>
        <Input
          required
          aria-label="Booking customer name"
          aria-invalid={invalidName}
          maxLength={120}
          value={customerName}
          disabled={busy}
          onChange={(e) => setName(e.target.value)}
        />
        {invalidName && <small className="text-destructive">Enter the customer name.</small>}
      </label>
      <label className="grid gap-2 text-sm">
        <span>
          Mobile number <span className="text-destructive">*</span>
        </span>
        <Input
          required
          type="tel"
          aria-label="Booking mobile number"
          aria-invalid={invalidMobile}
          maxLength={16}
          placeholder="Mobile number with country code if needed"
          value={mobile}
          disabled={busy}
          onChange={(e) => setMobile(e.target.value)}
        />
        {invalidMobile && (
          <small className="text-destructive">Enter a mobile number with 7 to 15 digits.</small>
        )}
      </label>
      <label className="grid gap-2 text-sm">
        <span>
          Pickup date and time <span className="text-destructive">*</span>
        </span>
        <Input
          required
          type="datetime-local"
          aria-label="Booking pickup date and time"
          aria-invalid={invalidPickup}
          value={pickup}
          disabled={busy}
          onChange={(e) => setPickup(e.target.value)}
        />
        {invalidPickup && (
          <small className="text-destructive">Choose a future pickup date and time.</small>
        )}
        <small className="text-muted-foreground">Uses this device’s local time.</small>
      </label>
      <div className="flex justify-end gap-2">
        <Button type="button" variant="outline" disabled={busy} onClick={onCancel}>
          Cancel
        </Button>
        <Button disabled={busy}>{busy ? "Saving…" : "Save booking"}</Button>
      </div>
    </form>
  );
}
function localPickup(iso: string) {
  const date = new Date(iso);
  return new Date(date.getTime() - date.getTimezoneOffset() * 60000).toISOString().slice(0, 16);
}
