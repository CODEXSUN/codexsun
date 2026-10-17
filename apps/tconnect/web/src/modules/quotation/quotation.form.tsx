import { useState, type FormEvent } from "react";
import { Button } from "@codexsun/ui/components/button";
import { Input } from "@codexsun/ui/components/input";
import { Textarea } from "@codexsun/ui/components/textarea";
import { WorkspaceFormPanel } from "@codexsun/ui/workspace";
import { WorkspaceFormBanner } from "@codexsun/ui/workspace/upsert";
import { quotationInput } from "./quotation.schema";
import type { QuotationInput } from "./quotation.types";
export function QuotationForm({
  conversationUuid,
  onSave,
  onCancel
}: {
  conversationUuid: string;
  onSave: (input: QuotationInput) => Promise<void>;
  onCancel: () => void;
}) {
  const [error, setError] = useState("");
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [busy, setBusy] = useState(false);
  const today = new Date().toISOString().slice(0, 10);
  const until = new Date(Date.now() + 14 * 86400000).toISOString().slice(0, 10);
  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    const input = {
      ...Object.fromEntries(form),
      conversationUuid,
      quantity: Number(form.get("quantity")),
      unitPrice: Number(form.get("unitPrice")),
      taxPercent: Number(form.get("taxPercent")),
      shipping: Number(form.get("shipping")),
      deliveryDays: Number(form.get("deliveryDays"))
    };
    const parsed = quotationInput.safeParse(input);
    if (!parsed.success) {
      setErrors(
        Object.fromEntries(
          parsed.error.issues.map((issue) => [String(issue.path[0]), issue.message])
        )
      );
      setError("Check the marked quotation fields.");
      return;
    }
    if (parsed.data.validUntil < today) {
      setErrors({ validUntil: "Choose today or a future UTC date." });
      setError("Check the validity date.");
      return;
    }
    setError("");
    setErrors({});
    setBusy(true);
    try {
      await onSave(parsed.data);
    } catch (error) {
      setError(error instanceof Error ? error.message : "Quotation could not be sent.");
    } finally {
      setBusy(false);
    }
  }
  return (
    <WorkspaceFormPanel title="Send quotation">
      <form onSubmit={submit} className="space-y-4">
        {error ? (
          <WorkspaceFormBanner title="Quotation not sent">{error}</WorkspaceFormBanner>
        ) : null}
        <p className="text-sm text-muted-foreground">
          Quote in INR. Tax applies to the goods subtotal; shipping is added afterwards. State any
          additional conditions in the notes. Sent prices remain in history; withdraw and send a new
          quote to revise an offer.
        </p>
        <div className="grid gap-4 md:grid-cols-2">
          <label className="space-y-1 text-sm">
            Quantity <span className="text-destructive">*</span>
            <Input
              name="quantity"
              type="number"
              required
              min={0.001}
              max={1000000}
              step="0.001"
              defaultValue={1}
              aria-invalid={!!errors.quantity}
            />
            <span className="text-destructive">{errors.quantity}</span>
          </label>
          <label className="space-y-1 text-sm">
            Unit <span className="text-destructive">*</span>
            <Input
              name="unit"
              required
              maxLength={40}
              defaultValue="piece"
              aria-invalid={!!errors.unit}
            />
            <span className="text-destructive">{errors.unit}</span>
          </label>
          <label className="space-y-1 text-sm">
            Unit price (INR) <span className="text-destructive">*</span>
            <Input
              name="unitPrice"
              type="number"
              required
              min={0}
              max={1000000000}
              step="0.01"
              aria-invalid={!!errors.unitPrice}
            />
            <span className="text-destructive">{errors.unitPrice}</span>
          </label>
          <label className="space-y-1 text-sm">
            Tax (%) <span className="text-destructive">*</span>
            <Input
              name="taxPercent"
              type="number"
              required
              min={0}
              max={100}
              step="0.01"
              defaultValue={0}
              aria-invalid={!!errors.taxPercent}
            />
            <span className="text-destructive">{errors.taxPercent}</span>
          </label>
          <label className="space-y-1 text-sm">
            Shipping (INR) <span className="text-destructive">*</span>
            <Input
              name="shipping"
              type="number"
              required
              min={0}
              max={1000000000}
              step="0.01"
              defaultValue={0}
              aria-invalid={!!errors.shipping}
            />
            <span className="text-destructive">{errors.shipping}</span>
          </label>
          <label className="space-y-1 text-sm">
            Delivery in days <span className="text-destructive">*</span>
            <Input
              name="deliveryDays"
              type="number"
              required
              min={1}
              max={3650}
              step={1}
              aria-invalid={!!errors.deliveryDays}
            />
            <span className="text-destructive">{errors.deliveryDays}</span>
          </label>
          <label className="space-y-1 text-sm">
            Valid through (UTC date) <span className="text-destructive">*</span>
            <Input
              name="validUntil"
              type="date"
              required
              min={today}
              defaultValue={until}
              aria-invalid={!!errors.validUntil}
            />
            <span className="text-destructive">{errors.validUntil}</span>
          </label>
        </div>
        <label className="block space-y-1 text-sm">
          Payment terms <span className="text-destructive">*</span>
          <Textarea
            name="paymentTerms"
            required
            minLength={3}
            maxLength={1000}
            placeholder="For example, 30% advance and balance before dispatch"
            aria-invalid={!!errors.paymentTerms}
          />
          <span className="text-destructive">{errors.paymentTerms}</span>
        </label>
        <label className="block space-y-1 text-sm">
          Specifications, exclusions and notes
          <Textarea name="notes" maxLength={4000} aria-invalid={!!errors.notes} />
          <span className="text-destructive">{errors.notes}</span>
        </label>
        <div className="flex gap-2">
          <Button disabled={busy}>{busy ? "Sending…" : "Send quotation"}</Button>
          <Button type="button" variant="outline" onClick={onCancel}>
            Cancel
          </Button>
        </div>
      </form>
    </WorkspaceFormPanel>
  );
}
