import { useState } from "react";
import { Button } from "@codexsun/ui/components/button";
import { useWaiters } from "./waiter.hooks";
import { WaiterList } from "./waiter.list";
import { WaiterForm } from "./waiter.form";
import { saveWaiter } from "./waiter.services";
import type { Waiter } from "./waiter.types";
export function WaiterWorkspace({ canManage }: { canManage: boolean }) {
  const data = useWaiters();
  const [selected, setSelected] = useState<Waiter | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  return (
    <section className="grid gap-4">
      <h2>Waiter registration</h2>
      <p>
        Register restaurant staff for kitchen pickup and delivery. Inactivate former staff to
        preserve delivery history.
      </p>
      <Button variant="outline" onClick={() => setSelected(null)}>
        New waiter
      </Button>
      {(error || data.error) && <p role="alert">{error || data.error}</p>}
      <WaiterList items={data.items} onSelect={setSelected} />
      <WaiterForm
        key={selected?.uuid ?? "new"}
        value={selected}
        busy={busy || !canManage}
        onSave={async (input) => {
          setBusy(true);
          setError("");
          try {
            setSelected(await saveWaiter(input, selected?.uuid));
            await data.refresh();
          } catch (e) {
            setError(e instanceof Error ? e.message : "Cannot save waiter.");
          } finally {
            setBusy(false);
          }
        }}
      />
    </section>
  );
}
