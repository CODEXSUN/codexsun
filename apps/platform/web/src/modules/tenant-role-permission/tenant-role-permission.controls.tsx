import { useRef, useState } from "react";
import { toast } from "sonner";
import { Button } from "@codexsun/ui/components/button";
import { cn } from "@codexsun/ui/lib/utils";
import { WorkspacePage } from "@codexsun/ui/workspace/page";
import {
  useTenantRolePermissionLookups,
  useTenantRolePermissionMutations,
  useTenantRolePermissionsQuery
} from "./tenant-role-permission.hooks";
import { TenantPermissionCards } from "./tenant-role-permission.cards";
import { permissionScope, TenantPermissionFilters } from "./tenant-role-permission.filters";
import type { TenantRolePermissionPermissionLookup } from "./tenant-role-permission.types";

export function TenantAccessControlWorkspace() {
  const assignments = useTenantRolePermissionsQuery();
  const lookups = useTenantRolePermissionLookups();
  const mutations = useTenantRolePermissionMutations();
  const [roleId, setRoleId] = useState<number>();
  const [appFilter, setAppFilter] = useState("");
  const [moduleFilter, setModuleFilter] = useState("");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const busy = useRef(false);
  const roles = lookups.data?.first ?? [];
  const permissions = lookups.data?.second ?? [];
  const visiblePermissions = permissions.filter((permission) => {
    const scope = permissionScope(permission.key);
    return (
      (!appFilter || scope.app === appFilter) && (!moduleFilter || scope.module === moduleFilter)
    );
  });
  const role = roles.find((item) => item.id === roleId) ?? roles[0];
  const assigned = new Map(
    (assignments.data ?? [])
      .filter((item) => item.roleId === role?.id)
      .map((item) => [item.permissionId, item])
  );
  const loading = assignments.isPending || lookups.isPending;
  const fetching = assignments.isFetching || lookups.isFetching;
  const loadError = assignments.error ?? lookups.error;
  const disabled = saving || fetching || !!loadError || !role || role.status !== "active";
  const editable = (permission: TenantRolePermissionPermissionLookup) =>
    permission.status === "active" && !assigned.get(permission.id)?.isProtected;

  async function refresh() {
    await Promise.all([assignments.refetch(), lookups.refetch()]);
  }

  async function save(entries: TenantRolePermissionPermissionLookup[], checked: boolean) {
    if (busy.current || disabled || !role) return;
    busy.current = true;
    setSaving(true);
    setError("");
    let updated = 0;
    try {
      for (const permission of entries) {
        if (!editable(permission)) continue;
        const current = assigned.get(permission.id);
        if ((current?.status === "active") === checked) continue;
        if (!current) {
          await mutations.create.mutateAsync({
            permissionId: permission.id,
            roleId: role.id,
            status: "active"
          });
        } else if (checked) {
          await mutations.activate.mutateAsync(current);
        } else {
          await mutations.deactivate.mutateAsync(current);
        }
        updated++;
      }
      if (updated) toast.success("Access controls saved");
    } catch (cause) {
      const message = `${updated ? `${updated} permission changes saved. ` : ""}${cause instanceof Error ? cause.message : "The permission could not be updated."}`;
      setError(message);
      toast.error(message);
    } finally {
      await refresh();
      busy.current = false;
      setSaving(false);
    }
  }

  return (
    <WorkspacePage title="" technicalName="page.application.access.controls">
      {loadError || error ? (
        <p
          role="alert"
          className="rounded-md border border-destructive p-3 text-sm text-destructive"
        >
          {error || loadError?.message}
        </p>
      ) : null}
      {loading ? (
        <p role="status" className="p-4 text-sm text-muted-foreground">
          Loading roles and permissions…
        </p>
      ) : !loadError ? (
        <section className="grid gap-5 lg:grid-cols-[14rem_minmax(0,1fr)]" aria-busy={saving}>
          <aside className="flex flex-col gap-2" aria-label="Roles">
            {roles.map((item) => (
              <Button
                key={item.id}
                type="button"
                variant="outline"
                disabled={saving}
                aria-pressed={role?.id === item.id}
                onClick={() => {
                  setRoleId(item.id);
                  setError("");
                }}
                className={cn(
                  "h-auto flex-col items-start gap-1 whitespace-normal px-4 py-3 text-left",
                  role?.id === item.id &&
                    "border-primary bg-primary text-primary-foreground hover:bg-primary/90 hover:text-primary-foreground"
                )}
              >
                <span className="font-semibold">{item.label}</span>
                <span className="text-xs">
                  {item.key} · {item.status}
                </span>
              </Button>
            ))}
            {!roles.length ? (
              <p className="text-sm text-muted-foreground">
                No roles available. Create a role first.
              </p>
            ) : null}
          </aside>
          <section className="min-w-0 rounded-md border bg-card">
            <TenantPermissionFilters
              app={appFilter}
              module={moduleFilter}
              permissions={permissions}
              disabled={saving || fetching}
              onAppChange={(value) => {
                setAppFilter(value);
                setModuleFilter("");
              }}
              onModuleChange={setModuleFilter}
            />
            <TenantPermissionCards
              permissions={visiblePermissions}
              assigned={assigned}
              disabled={disabled}
              roleLabel={role?.label ?? "Role"}
              onToggle={(permission, checked) => void save([permission], checked)}
              onToggleModule={(permissions, checked) => void save(permissions, checked)}
            />
            <p
              role="status"
              aria-live="polite"
              className="border-t px-5 py-3 text-sm text-muted-foreground"
            >
              {saving
                ? "Saving permissions…"
                : `${visiblePermissions.filter((item) => assigned.get(item.id)?.status === "active").length} of ${visiblePermissions.length} shown permissions enabled`}
            </p>
          </section>
        </section>
      ) : null}
    </WorkspacePage>
  );
}
