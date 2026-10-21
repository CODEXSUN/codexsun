import { useState } from "react";
import { Save } from "lucide-react";
import { Input } from "@codexsun/ui/components/input";
import { WorkspaceLookup } from "@codexsun/ui/workspace/lookup";
import { WorkspaceSwitchCard } from "@codexsun/ui/workspace/status";
import {
  WorkspaceFormBanner,
  WorkspaceFormField,
  WorkspaceFormFooter,
  WorkspaceFormGrid,
  WorkspaceUpsertDialog
} from "@codexsun/ui/workspace/upsert";
import { tenantUserSchema } from "./tenant-user.schema";
import type { TenantUser, TenantUserRoleOption, TenantUserSavePayload } from "./tenant-user.types";

const emptyUser: TenantUserSavePayload = {
  username: "",
  email: "",
  name: "",
  password: "",
  roleId: 0,
  status: "active"
};

export function TenantUserForm({
  contextLabel,
  error,
  loading,
  onCancel,
  onSubmit,
  open,
  record,
  roleOptions,
  roleOptionsLoading
}: {
  contextLabel?: string;
  error?: string;
  loading: boolean;
  onCancel: () => void;
  onSubmit: (value: TenantUserSavePayload) => void;
  open: boolean;
  record: TenantUser | null;
  roleOptions: TenantUserRoleOption[];
  roleOptionsLoading: boolean;
}) {
  return (
    <WorkspaceUpsertDialog
      className="sm:max-w-xl"
      description={
        contextLabel
          ? `Manage this account in ${contextLabel}.`
          : "Enter the user details and save without leaving the list."
      }
      onClose={onCancel}
      open={open}
      title={`${record ? "Edit" : "New"} user`}
    >
      <TenantUserFormBody
        key={`${record?.id ?? "new"}:${open}`}
        {...(error ? { error } : {})}
        initialValue={
          record
            ? {
                email: record.email,
                username: record.username ?? "",
                name: record.name,
                password: "",
                roleId: record.roles[0]?.id ?? 0,
                status: record.status
              }
            : emptyUser
        }
        loading={loading}
        onCancel={onCancel}
        onSubmit={onSubmit}
        record={record}
        roleOptions={roleOptions}
        roleOptionsLoading={roleOptionsLoading}
      />
    </WorkspaceUpsertDialog>
  );
}

function TenantUserFormBody({
  error,
  initialValue,
  loading,
  onCancel,
  onSubmit,
  record,
  roleOptions,
  roleOptionsLoading
}: {
  error?: string;
  initialValue: TenantUserSavePayload;
  loading: boolean;
  onCancel: () => void;
  onSubmit: (value: TenantUserSavePayload) => void;
  record: TenantUser | null;
  roleOptions: TenantUserRoleOption[];
  roleOptionsLoading: boolean;
}) {
  const [value, setValue] = useState(initialValue);
  const [validationError, setValidationError] = useState("");
  const [fieldErrors, setFieldErrors] = useState<
    Partial<Record<keyof TenantUserSavePayload, string>>
  >({});
  const shownError = validationError || error;
  return (
    <form
      noValidate
      onSubmit={(event) => {
        event.preventDefault();
        const parsed = tenantUserSchema.safeParse(value);
        if (!parsed.success || (!record && !value.password)) {
          const errors = parsed.success
            ? {}
            : Object.fromEntries(
                Object.entries(parsed.error.flatten().fieldErrors).map(([key, messages]) => [
                  key,
                  messages?.[0]
                ])
              );
          if (!record && !value.password)
            errors.password = "Password must contain at least 8 characters.";
          setFieldErrors(errors);
          setValidationError(
            !record && !value.password
              ? "Password must contain at least 8 characters."
              : (parsed.error?.issues[0]?.message ?? "Check the user details.")
          );
          return;
        }
        setValidationError("");
        setFieldErrors({});
        const { password, ...payload } = parsed.data;
        onSubmit(password ? { ...payload, password } : payload);
      }}
    >
      {shownError ? (
        <WorkspaceFormBanner title="Unable to save">{shownError}</WorkspaceFormBanner>
      ) : null}
      <WorkspaceFormGrid columns={1}>
        <WorkspaceFormField label="Display name" required>
          <Input
            aria-invalid={Boolean(fieldErrors.name)}
            autoFocus
            className={fieldErrors.name ? "border-destructive" : undefined}
            maxLength={180}
            required
            value={value.name}
            onChange={(event) => {
              setValue((current) => ({ ...current, name: event.target.value }));
              setFieldErrors((current) => withoutFieldError(current, "name"));
            }}
          />
          {fieldErrors.name ? <p className="text-xs text-destructive">{fieldErrors.name}</p> : null}
        </WorkspaceFormField>
        <WorkspaceFormField label="Username (optional)">
          <Input
            aria-invalid={Boolean(fieldErrors.username)}
            autoComplete="off"
            maxLength={80}
            value={value.username ?? ""}
            onChange={(event) => {
              setValue((current) => ({ ...current, username: event.target.value }));
              setFieldErrors((current) => withoutFieldError(current, "username"));
            }}
          />
          <p className="text-xs text-muted-foreground">
            Unique within this tenant. Users can sign in with this or their email.
          </p>
          {fieldErrors.username ? (
            <p className="text-xs text-destructive">{fieldErrors.username}</p>
          ) : null}
        </WorkspaceFormField>
        <WorkspaceFormField label="Email" required>
          <Input
            aria-invalid={Boolean(fieldErrors.email)}
            className={fieldErrors.email ? "border-destructive" : undefined}
            maxLength={180}
            required
            type="email"
            value={value.email}
            onChange={(event) => {
              setValue((current) => ({ ...current, email: event.target.value }));
              setFieldErrors((current) => withoutFieldError(current, "email"));
            }}
          />
          {fieldErrors.email ? (
            <p className="text-xs text-destructive">{fieldErrors.email}</p>
          ) : null}
        </WorkspaceFormField>
        <WorkspaceFormField label={record ? "New password" : "Password"} required={!record}>
          <Input
            aria-invalid={Boolean(fieldErrors.password)}
            className={fieldErrors.password ? "border-destructive" : undefined}
            minLength={8}
            required={!record}
            type="password"
            value={value.password ?? ""}
            onChange={(event) => {
              setValue((current) => ({ ...current, password: event.target.value }));
              setFieldErrors((current) => withoutFieldError(current, "password"));
            }}
          />
          {fieldErrors.password ? (
            <p className="text-xs text-destructive">{fieldErrors.password}</p>
          ) : null}
        </WorkspaceFormField>
        <WorkspaceFormField label="Role" required>
          <WorkspaceLookup
            allowTextValue={false}
            invalid={Boolean(fieldErrors.roleId)}
            loading={roleOptionsLoading}
            options={roleOptions
              .filter((role) => role.status === "active" || role.id === value.roleId)
              .map((role) => ({
                description: role.key,
                label: role.label,
                value: String(role.id)
              }))}
            placeholder="Select a role"
            required
            showAllOptionsOnFocus
            value={value.roleId ? String(value.roleId) : ""}
            onValueChange={(roleId) => {
              setValue((current) => ({ ...current, roleId: Number(roleId) || 0 }));
              setFieldErrors((current) => withoutFieldError(current, "roleId"));
            }}
          />
          {fieldErrors.roleId ? (
            <p className="text-xs text-destructive">{fieldErrors.roleId}</p>
          ) : null}
        </WorkspaceFormField>
        <WorkspaceSwitchCard
          fieldLabel="Status"
          ariaLabel="User active status"
          checked={value.status === "active"}
          onCheckedChange={(checked) =>
            setValue((current) => ({ ...current, status: checked ? "active" : "inactive" }))
          }
        />
      </WorkspaceFormGrid>
      <WorkspaceFormFooter
        className="mt-6 border-t pt-4"
        onCancel={onCancel}
        primaryLabel={record ? "Update user" : "Save user"}
        primaryLoading={loading}
        primaryProps={{
          children: (
            <>
              <Save className="size-4" />
              {record ? "Update user" : "Save user"}
            </>
          )
        }}
      />
    </form>
  );
}

function withoutFieldError(
  current: Partial<Record<keyof TenantUserSavePayload, string>>,
  field: keyof TenantUserSavePayload
) {
  const next = { ...current };
  delete next[field];
  return next;
}
