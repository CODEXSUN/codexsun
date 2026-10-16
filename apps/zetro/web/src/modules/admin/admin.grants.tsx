import { useState, type FormEvent } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { ZetroGrantForm } from "./admin.form";
import { useZetroAdminGrants, useZetroAdminRoles, zetroAdminGrantsKey } from "./admin.hooks";
import { ZetroGrantList } from "./admin.list";
import { zetroGrantChangeSchema } from "./admin.schema";
import { saveZetroGrant } from "./admin.services";
import type { ZetroGrantChange } from "./admin.types";

export function ZetroGrantSection({ tenantId }: { tenantId: string }) {
  const client = useQueryClient();
  const [change, setChange] = useState<ZetroGrantChange>({
    roleKey: "",
    capabilityKey: "billing.daily-summary.read",
    status: "active",
    reason: ""
  });
  const grants = useZetroAdminGrants(tenantId);
  const roles = useZetroAdminRoles(tenantId);
  const save = useMutation({
    mutationFn: (value: ZetroGrantChange) => saveZetroGrant(tenantId, value),
    onSuccess: () => {
      void client.invalidateQueries({ queryKey: zetroAdminGrantsKey(tenantId) });
      void client.invalidateQueries({ queryKey: ["zetro", "admin", tenantId, "grant-events"] });
      setChange((value) => ({ ...value, reason: "" }));
      toast.success("Role access updated");
    },
    onError: (error) => toast.error("Could not update role access", { description: error.message })
  });
  const submit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const result = zetroGrantChangeSchema.safeParse(change);
    if (!result.success) {
      toast.error(result.error.issues[0]?.message ?? "Invalid role access decision");
      return;
    }
    save.mutate(result.data);
  };

  return (
    <section className="rounded-lg border bg-card p-4">
      <h2 className="text-lg font-semibold">Business read permissions</h2>
      <p className="mt-1 text-sm text-muted-foreground">
        A role needs this grant and Billing records permission. No report grant is active by
        default.
      </p>
      {grants.error ? <p role="alert">{grants.error.message}</p> : null}
      {roles.error ? <p role="alert">{roles.error.message}</p> : null}
      <ZetroGrantList grants={grants.data} />
      <ZetroGrantForm
        change={change}
        setChange={setChange}
        roles={roles.data}
        pending={save.isPending}
        onSubmit={submit}
      />
    </section>
  );
}
