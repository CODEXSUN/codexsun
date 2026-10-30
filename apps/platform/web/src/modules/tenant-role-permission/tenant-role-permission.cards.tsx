import { Checkbox } from "@codexsun/ui/components/checkbox";
import { cn } from "@codexsun/ui/lib/utils";
import { permissionScope } from "./tenant-role-permission.filters";
import type {
  TenantRolePermission,
  TenantRolePermissionPermissionLookup
} from "./tenant-role-permission.types";

export function TenantPermissionCards({
  permissions,
  assigned,
  disabled,
  roleLabel,
  onToggle,
  onToggleModule
}: {
  permissions: TenantRolePermissionPermissionLookup[];
  assigned: Map<number, TenantRolePermission>;
  disabled: boolean;
  roleLabel: string;
  onToggle: (permission: TenantRolePermissionPermissionLookup, checked: boolean) => void;
  onToggleModule: (permissions: TenantRolePermissionPermissionLookup[], checked: boolean) => void;
}) {
  const groups = new Map<string, TenantRolePermissionPermissionLookup[]>();
  for (const permission of permissions) {
    const module = permissionScope(permission.key).module;
    const entries = groups.get(module) ?? [];
    entries.push(permission);
    groups.set(module, entries);
  }
  return (
    <div className="grid grid-cols-1 items-start gap-4 p-5 xl:grid-cols-2 2xl:grid-cols-3">
      {Array.from(groups)
        .sort(([a], [b]) => a.localeCompare(b))
        .map(([module, entries]) => {
          const editable = entries.filter(
            (permission) =>
              permission.status === "active" && !assigned.get(permission.id)?.isProtected
          );
          const stateEntries = editable.length ? editable : entries;
          const enabled = stateEntries.filter(
            (permission) => assigned.get(permission.id)?.status === "active"
          ).length;
          const checked =
            enabled === stateEntries.length ? true : enabled ? "indeterminate" : false;
          return (
            <section
              key={module}
              className="min-w-0 rounded-md border"
              aria-label={`${moduleTitle(module)} permissions`}
            >
              <header className="flex items-center justify-between gap-3 border-b bg-muted/30 px-4 py-3">
                <h3 className="min-w-0 text-sm font-semibold">{moduleTitle(module)}</h3>
                <label
                  className={cn(
                    "ml-auto flex shrink-0 items-center text-xs",
                    disabled || !editable.length
                      ? "cursor-not-allowed text-muted-foreground"
                      : "cursor-pointer"
                  )}
                  title="Enable or disable all editable permissions in this module. Protected permissions stay locked."
                >
                  <Checkbox
                    className="cursor-pointer"
                    checked={checked}
                    disabled={disabled || !editable.length}
                    aria-label={`${roleLabel}: Select all ${moduleTitle(module)} permissions`}
                    onCheckedChange={(value) => onToggleModule(editable, value === true)}
                  />
                </label>
              </header>
              <div className="flex flex-wrap gap-x-5 gap-y-4 p-4">
                {entries
                  .sort(
                    (a, b) => actionOrder(a.key) - actionOrder(b.key) || a.key.localeCompare(b.key)
                  )
                  .map((permission) => {
                    const current = assigned.get(permission.id);
                    const locked =
                      disabled || permission.status !== "active" || !!current?.isProtected;
                    return (
                      <label
                        key={permission.id}
                        title={permission.key}
                        className={cn(
                          "flex items-start gap-2 text-sm",
                          locked ? "cursor-not-allowed text-muted-foreground" : "cursor-pointer"
                        )}
                      >
                        <Checkbox
                          className="mt-0.5 cursor-pointer"
                          checked={current?.status === "active"}
                          disabled={locked}
                          aria-label={`${roleLabel}: ${permission.label}`}
                          onCheckedChange={(checked) => onToggle(permission, checked === true)}
                        />
                        <span>
                          <span className="block">{actionLabel(permission.key)}</span>
                          {current?.isProtected ? (
                            <span className="block text-xs text-muted-foreground">Protected</span>
                          ) : permission.status !== "active" ? (
                            <span className="block text-xs text-muted-foreground">Inactive</span>
                          ) : null}
                        </span>
                      </label>
                    );
                  })}
              </div>
            </section>
          );
        })}
      {!permissions.length ? (
        <p className="text-sm text-muted-foreground">
          No permissions match the selected app and module.
        </p>
      ) : null}
    </div>
  );
}

function moduleTitle(module: string) {
  return module
    .replace(/[.-]/g, " ")
    .split(" ")
    .map((word) =>
      ["crm", "hrms", "api", "gst"].includes(word)
        ? word.toUpperCase()
        : word.charAt(0).toUpperCase() + word.slice(1)
    )
    .join(" ");
}

function actionLabel(key: string) {
  const action = key.split(".").at(-1) ?? key;
  if (action === "update") return "Edit";
  return action.replace(/-/g, " ").replace(/^./, (letter) => letter.toUpperCase());
}

function actionOrder(key: string) {
  const order = ["Create", "View", "Edit", "Delete", "Force delete", "Suspend", "Restore"];
  const index = order.indexOf(actionLabel(key));
  return index < 0 ? order.length : index;
}
