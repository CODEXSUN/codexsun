import { useRef, useState } from "react";
import { Button } from "@codexsun/ui/components/button";
import { Input } from "@codexsun/ui/components/input";
import { WorkspaceSelect } from "@codexsun/ui/workspace/select";
import { WorkspaceFormBanner } from "@codexsun/ui/workspace/upsert";
import { paymentSchema } from "./pos.schema";
import type { PosBill, PaymentInput, PaymentMode } from "./pos.types";

export function PosPaymentForm({
  bill,
  busy,
  canPay,
  onPay
}: {
  bill: PosBill;
  busy: boolean;
  canPay: boolean;
  onPay: (input: PaymentInput) => Promise<boolean>;
}) {
  const [amount, setAmount] = useState(((bill.total - bill.paid) / 100).toFixed(2));
  const [mode, setMode] = useState<PaymentMode>("cash");
  const [reference, setReference] = useState("");
  const [error, setError] = useState("");
  const pendingKey = `codexsun.qcafe.payment.pending:${sessionStorage.getItem("codexsun.auth.slot") ?? "unbound"}:${bill.uuid}`;
  const [pending, setPending] = useState<PaymentInput | null>(() => {
    try {
      const result = paymentSchema.safeParse(
        JSON.parse(sessionStorage.getItem(pendingKey) ?? "null")
      );
      return result.success ? result.data : null;
    } catch {
      return null;
    }
  });
  const requestId = useRef(crypto.randomUUID());
  const outstanding = bill.total - bill.paid;
  async function submit(event: React.FormEvent) {
    event.preventDefault();
    const parsed = paymentSchema.safeParse(
      pending ?? {
        requestId: requestId.current,
        amount: /^\d+(\.\d{1,2})?$/u.test(amount) ? Math.round(Number(amount) * 100) : 0,
        mode,
        reference
      }
    );
    if (!parsed.success) {
      setError(parsed.error.issues[0]?.message ?? "Check payment details.");
      return;
    }
    if (!pending && parsed.data.amount > outstanding) {
      setError("Payment exceeds the outstanding amount.");
      return;
    }
    setError("");
    setPending(parsed.data);
    try {
      sessionStorage.setItem(pendingKey, JSON.stringify(parsed.data));
      if (await onPay(parsed.data)) {
        sessionStorage.removeItem(pendingKey);
        setPending(null);
        requestId.current = crypto.randomUUID();
      }
    } catch (error) {
      sessionStorage.removeItem(pendingKey);
      setPending(null);
      setError(error instanceof Error ? error.message : "Check the payment.");
    }
  }
  if (!outstanding)
    return (
      <p role="status" className="font-medium text-emerald-700">
        Payment complete.
      </p>
    );
  if (!canPay) return <p>Your Platform role cannot collect payments.</p>;
  return (
    <form className="grid gap-3 border-t pt-4" onSubmit={(event) => void submit(event)}>
      <h3 className="font-semibold">Collect payment · ₹{(outstanding / 100).toFixed(2)} due</h3>
      {error && (
        <WorkspaceFormBanner title="Unable to continue" tone="error">
          {error}
        </WorkspaceFormBanner>
      )}
      {pending && (
        <p className="text-sm text-amber-700">
          Confirmation pending. Retry the same payment to avoid duplicates.
        </p>
      )}
      <label className="grid gap-1 text-sm">
        Amount (₹) <span className="text-red-600">*</span>
        <Input
          value={pending ? (pending.amount / 100).toFixed(2) : amount}
          inputMode="decimal"
          aria-invalid={!!error}
          disabled={busy || !!pending}
          onChange={(event) => setAmount(event.target.value)}
        />
        {error && <span className="text-red-600">{error}</span>}
      </label>
      <WorkspaceSelect
        ariaLabel="Payment method"
        value={pending?.mode ?? mode}
        onValueChange={(value) => setMode(value as PaymentMode)}
        options={[
          { value: "cash", label: "Cash" },
          { value: "card", label: "Card" },
          { value: "upi", label: "UPI" },
          { value: "bank", label: "Bank" },
          { value: "other", label: "Other" }
        ]}
        disabled={busy || !!pending}
      />
      <label className="grid gap-1 text-sm">
        Reference (optional)
        <Input
          value={pending?.reference ?? reference}
          maxLength={120}
          disabled={busy || !!pending}
          onChange={(event) => setReference(event.target.value)}
        />
      </label>
      <Button disabled={busy}>
        {busy ? "Recording…" : pending ? "Retry / confirm payment" : "Record payment"}
      </Button>
    </form>
  );
}
