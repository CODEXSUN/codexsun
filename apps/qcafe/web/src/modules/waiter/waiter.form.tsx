import { useState } from "react";
import { Button } from "@codexsun/ui/components/button";
import { Input } from "@codexsun/ui/components/input";
import { waiterSchema } from "./waiter.schema";
import type { Waiter } from "./waiter.types";
export function WaiterForm({
  value,
  busy,
  onSave
}: {
  value: Waiter | null;
  busy: boolean;
  onSave: (input: Omit<Waiter, "uuid">) => Promise<void>;
}) {
  const [draft, setDraft] = useState<Omit<Waiter, "uuid">>(
    value ?? { code: "", name: "", status: "active" }
  );
  const [error, setError] = useState("");
  return (
    <form
      className="grid gap-3"
      onSubmit={(e) => {
        e.preventDefault();
        const parsed = waiterSchema.safeParse(draft);
        if (!parsed.success) {
          setError(parsed.error.issues[0]?.message ?? "Check waiter details.");
          return;
        }
        void onSave(parsed.data);
      }}
    >
      <label>
        Waiter code *
        <Input
          aria-label="Waiter code"
          required
          disabled={busy}
          value={draft.code}
          onChange={(e) => setDraft({ ...draft, code: e.target.value })}
        />
      </label>
      <label>
        Waiter name *
        <Input
          aria-label="Waiter name"
          required
          disabled={busy}
          value={draft.name}
          onChange={(e) => setDraft({ ...draft, name: e.target.value })}
        />
      </label>
      <label>
        Status
        <select
          aria-label="Waiter status"
          disabled={busy}
          value={draft.status}
          onChange={(e) =>
            setDraft({ ...draft, status: e.target.value === "active" ? "active" : "inactive" })
          }
        >
          <option value="active">Active</option>
          <option value="inactive">Inactive</option>
        </select>
      </label>
      {error && <p role="alert">{error}</p>}
      <Button disabled={busy}>Save waiter</Button>
    </form>
  );
}
