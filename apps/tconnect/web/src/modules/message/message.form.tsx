import { useState, type FormEvent } from "react";
import { Button } from "@codexsun/ui/components/button";
import { Textarea } from "@codexsun/ui/components/textarea";
import { WorkspaceFormBanner } from "@codexsun/ui/workspace/upsert";
import { messageInput } from "./message.schema";
export function MessageForm({ onSend }: { onSend: (body: string) => Promise<void> }) {
  const [body, setBody] = useState("");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  async function submit(event: FormEvent) {
    event.preventDefault();
    const parsed = messageInput.safeParse({ body });
    if (!parsed.success) {
      setError("Write a message of 1 to 4,000 characters.");
      return;
    }
    setError("");
    setBusy(true);
    try {
      await onSend(parsed.data.body);
      setBody("");
    } catch (error) {
      setError(error instanceof Error ? error.message : "Message could not be sent.");
    } finally {
      setBusy(false);
    }
  }
  return (
    <form onSubmit={submit} className="space-y-3">
      {error ? <WorkspaceFormBanner title="Message not sent">{error}</WorkspaceFormBanner> : null}
      <label className="block space-y-1 text-sm">
        Your message <span className="text-destructive">*</span>
        <Textarea
          name="message"
          required
          maxLength={4000}
          value={body}
          aria-invalid={!!error}
          onChange={(event) => setBody(event.target.value)}
          placeholder="Ask about specifications, pricing, delivery or payment terms…"
        />
      </label>
      <div className="flex flex-wrap items-center justify-between gap-3">
        <p className="text-xs text-muted-foreground">
          Visible only to this buyer and seller. Messages remain in the conversation history.
        </p>
        <Button disabled={busy}>{busy ? "Sending…" : "Send message"}</Button>
      </div>
    </form>
  );
}
