import { WorkspaceLookup } from "@codexsun/ui/workspace/lookup";
import { WorkspaceFormField } from "@codexsun/ui/workspace/upsert";
import type { TenantRolePermissionPermissionLookup } from "./tenant-role-permission.types";

export function TenantPermissionFilters({
  app,
  module,
  permissions,
  disabled,
  onAppChange,
  onModuleChange
}: {
  app: string;
  module: string;
  permissions: TenantRolePermissionPermissionLookup[];
  disabled: boolean;
  onAppChange: (value: string) => void;
  onModuleChange: (value: string) => void;
}) {
  const apps = [...new Set(permissions.map((item) => permissionScope(item.key).app))].sort();
  const modules = [
    ...new Set(
      permissions
        .filter((item) => !app || permissionScope(item.key).app === app)
        .map((item) => permissionScope(item.key).module)
    )
  ].sort();
  return (
    <div className="grid gap-4 border-b px-5 py-4 sm:grid-cols-2">
      <WorkspaceFormField label="App">
        <WorkspaceLookup
          ariaLabel="Filter permissions by app"
          value={app}
          disabled={disabled}
          options={apps.map((value) => ({ value, label: scopeLabel(value) }))}
          placeholder="All apps"
          allowTextValue={false}
          showAllOptionsOnFocus
          onValueChange={onAppChange}
        />
      </WorkspaceFormField>
      <WorkspaceFormField label="Module">
        <WorkspaceLookup
          ariaLabel="Filter permissions by module"
          value={module}
          disabled={disabled}
          options={modules.map((value) => ({
            value,
            label: scopeLabel(value),
            description: value
          }))}
          placeholder="All modules"
          allowTextValue={false}
          showAllOptionsOnFocus
          onValueChange={onModuleChange}
        />
      </WorkspaceFormField>
    </div>
  );
}

export function permissionScope(key: string) {
  const parts = key.split(".");
  return { app: parts[0] ?? "other", module: parts.slice(0, -1).join(".") || key };
}

function scopeLabel(value: string) {
  return value
    .split(".")
    .map((part) => part.replace(/-/g, " ").replace(/^./, (letter) => letter.toUpperCase()))
    .join(" / ");
}
