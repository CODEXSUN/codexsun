import { useEffect, useMemo, useState } from "react";
import { KeyRoundIcon, ShieldCheckIcon, UsersIcon } from "lucide-react";
import { MainWorkspace, useMdiTopology, type MdiNavigationSection } from "../../layouts/main-workspace";
import { Input } from "../../components/input";
import { FormBlock } from "../form";
import { MasterList, type MasterField, type MasterRecord } from "../master-list";
import { getStatusBadgeValue, StatusBadge } from "../../components/status-badge";
import type { AuthenticatedRequest } from "./session-boundary";

type IdentityUser = {
  id: string;
  login: string;
  name: string;
  protected: boolean;
  roles: string[];
  state: "active" | "disabled";
  username: string;
};
type Identifier = { id: string };
type UserRole = { roleId: string; userId: string };
type RolePermission = { permissionId: string; roleId: string };
type Resource = "permissions" | "role-permissions" | "roles" | "user-roles" | "users";

const identityStatusFields: MasterField[] = [
  {
    id: "state",
    label: "State",
    type: "select",
    options: [
      { label: "Active", value: "active" },
      { label: "Suspended", value: "disabled" },
    ],
    format: (value) => (
      <StatusBadge
        label={value === "disabled" ? "Suspended" : "Active"}
        status={getStatusBadgeValue(value === "disabled" ? "Suspended" : "Active")}
      />
    ),
  },
];

const masterListTopologyIds = {
  columnFilter: "27.1.2.2",
  content: "27.1.3",
  header: "27.1.1",
  pageNavigation: "27.1.4.2",
  pageSize: "27.1.4.1",
  pagination: "27.1.4",
  rowHeader: "27.1.3.1",
  rows: "27.1.3.2",
  search: "27.1.2",
  searchBar: "27.1.2.1",
};

const resources: { readonly label: string; readonly path: Resource }[] = [
  { label: "Users", path: "users" },
  { label: "Roles", path: "roles" },
  { label: "Permissions", path: "permissions" },
  { label: "User roles", path: "user-roles" },
  { label: "Role permissions", path: "role-permissions" },
];

export function IdentityManagementDesk({
  applicationId,
  applicationName,
  logout,
  request,
}: {
  applicationId: string;
  applicationName: string;
  logout(): void;
  request: AuthenticatedRequest;
}) {
  const [location, setLocation] = useState(() => window.location.pathname);
  useEffect(() => {
    const update = () => setLocation(window.location.pathname);
    window.addEventListener("popstate", update);
    return () => window.removeEventListener("popstate", update);
  }, []);

  const resource = resourceFromPath(location);
  const navigation = useMemo(() => identityNavigation(location), [location]);
  const content =
    resource === "users" ? (
      <UsersPage applicationId={applicationId} request={request} />
    ) : resource === "roles" || resource === "permissions" ? (
      <IdentifiersPage applicationId={applicationId} request={request} resource={resource} />
    ) : (
      <AssignmentsPage applicationId={applicationId} request={request} resource={resource} />
    );

  useEffect(() => {
    document.title = `${applicationName} | Identity`;
  }, [applicationName]);
  return (
    <MainWorkspace
      applicationId={applicationId}
      applicationName={applicationName}
      navigation={navigation}
      primaryAction={null}
      user={{ initials: "SA", name: "Super administrator", onSignOut: logout }}
      workspaceTitle="Identity and access"
    >
      <main className="p-6">{content}</main>
    </MainWorkspace>
  );
}

function UsersPage({ applicationId, request }: { applicationId: string; request: AuthenticatedRequest }) {
  const topology = useMdiTopology();
  const [users, setUsers] = useState<IdentityUser[]>([]);
  const [editing, setEditing] = useState<IdentityUser>();
  const [error, setError] = useState<string>();
  const reload = () =>
    void readJson<IdentityUser[]>(request, apiPath(applicationId, "users"))
      .then(setUsers)
      .catch((reason) => setError(messageOf(reason)));
  useEffect(reload, [applicationId]);
  if (editing)
    return (
      <UserForm
        applicationId={applicationId}
        request={request}
        user={editing}
        onBack={() => setEditing(undefined)}
        onSaved={() => {
          setEditing(undefined);
          reload();
        }}
      />
    );
  const suspend = (user: IdentityUser) =>
    void request(apiPath(applicationId, `users/${user.id}`), {
      body: JSON.stringify({ login: user.login, name: user.name, state: "disabled", username: user.username }),
      headers: { "content-type": "application/json" },
      method: "PUT",
    })
      .then(async (response) => {
        if (!response.ok)
          throw new Error(
            ((await response.json().catch(() => ({}))) as { error?: string }).error ?? "Could not suspend user.",
          );
        reload();
      })
      .catch((reason) => setError(messageOf(reason)));
  const forceDelete = (user: IdentityUser) =>
    void request(apiPath(applicationId, `users/${user.id}`), { method: "DELETE" })
      .then(async (response) => {
        if (!response.ok)
          throw new Error(
            ((await response.json().catch(() => ({}))) as { error?: string }).error ?? "Could not delete user.",
          );
        reload();
      })
      .catch((reason) => setError(messageOf(reason)));
  const fields: MasterField[] = [
    {
      id: "name",
      label: "Name",
      required: true,
      format: (value, record) => (
        <span className="inline-flex items-center gap-1.5">
          {String(value ?? "")}
          {record.protected ? (
            <ShieldCheckIcon aria-label="Default protected record" className="size-4 text-amber-600" />
          ) : null}
        </span>
      ),
    },
    { id: "username", label: "Username", required: true },
    { id: "login", label: "Email", type: "email", required: true },
    { id: "roles", label: "Roles", format: (value) => String(value ?? "") || "—" },
    ...identityStatusFields,
  ];
  const records: MasterRecord[] = users.map((user) => ({ ...user, roles: user.roles.join(", ") }));
  return (
    <>
      <MasterList
        createLabel="New user"
        description="Create, update, suspend, and remove application-local accounts."
        fields={fields}
        onCreate={() =>
          setEditing({ id: "", login: "", name: "", protected: false, roles: [], state: "active", username: "" })
        }
        onDelete={(record) => {
          const user = users.find((candidate) => candidate.id === record.id);
          if (user) forceDelete(user);
        }}
        onEdit={(record) => {
          const user = users.find((candidate) => candidate.id === record.id);
          if (user) setEditing(user);
        }}
        onSuspend={(record) => {
          const user = users.find((candidate) => candidate.id === record.id);
          if (user && user.state !== "disabled") suspend(user);
        }}
        records={records}
        searchTopSpacing
        showHeaderDivider={false}
        title="Users"
        topology={topology}
        topologyIds={masterListTopologyIds}
      />
      {error ? <p className="mt-3 text-sm text-destructive">{error}</p> : null}
    </>
  );
}

function UserForm({
  applicationId,
  onBack,
  onSaved,
  request,
  user,
}: {
  applicationId: string;
  onBack(): void;
  onSaved(): void;
  request: AuthenticatedRequest;
  user: IdentityUser;
}) {
  const [value, setValue] = useState({ ...user, password: "" });
  const [error, setError] = useState<string>();
  const isNew = !user.id;
  const submit = () =>
    void request(apiPath(applicationId, `users${isNew ? "" : `/${user.id}`}`), {
      body: JSON.stringify({
        login: value.login,
        name: value.name,
        password: value.password || undefined,
        state: value.state,
        username: value.username,
      }),
      headers: { "content-type": "application/json" },
      method: isNew ? "POST" : "PUT",
    })
      .then(async (response) => {
        if (!response.ok)
          throw new Error(
            ((await response.json().catch(() => ({}))) as { error?: string }).error ?? "Could not save user.",
          );
        onSaved();
      })
      .catch((reason) => setError(messageOf(reason)));
  return (
    <FormBlock
      active={value.state === "active"}
      activeLabel="Account active"
      description="A user must have a unique email and username."
      onActiveChange={(active) => setValue({ ...value, state: active ? "active" : "disabled" })}
      onBack={onBack}
      onCancel={onBack}
      onSubmit={submit}
      submitLabel={isNew ? "Create user" : "Save user"}
      tabs={[
        {
          id: "details",
          label: "Details",
          content: (
            <div className="grid gap-4 md:grid-cols-2">
              <Field label="Name" value={value.name} onChange={(name) => setValue({ ...value, name })} />
              <Field
                label="Username"
                value={value.username}
                onChange={(username) => setValue({ ...value, username })}
              />
              <Field
                label="Email"
                type="email"
                value={value.login}
                onChange={(login) => setValue({ ...value, login })}
              />
              <Field
                label={isNew ? "Password" : "New password (optional)"}
                type="password"
                value={value.password}
                onChange={(password) => setValue({ ...value, password })}
              />
              {error ? <p className="text-sm text-destructive md:col-span-2">{error}</p> : null}
            </div>
          ),
        },
      ]}
      title={isNew ? "New user" : `Edit ${user.name}`}
    />
  );
}

function IdentifiersPage({
  applicationId,
  request,
  resource,
}: {
  applicationId: string;
  request: AuthenticatedRequest;
  resource: "permissions" | "roles";
}) {
  const topology = useMdiTopology();
  const [records, setRecords] = useState<Identifier[]>([]);
  const [draft, setDraft] = useState("");
  const [creating, setCreating] = useState(false);
  const [error, setError] = useState<string>();
  const reload = () =>
    void readJson<Identifier[]>(request, apiPath(applicationId, resource))
      .then(setRecords)
      .catch((reason) => setError(messageOf(reason)));
  useEffect(reload, [applicationId, resource]);
  const label = resource === "roles" ? "Role" : "Permission";
  const create = () =>
    void request(apiPath(applicationId, resource), {
      body: JSON.stringify({ id: draft }),
      headers: { "content-type": "application/json" },
      method: "POST",
    })
      .then(async (response) => {
        if (!response.ok)
          throw new Error(
            ((await response.json().catch(() => ({}))) as { error?: string }).error ??
              `Could not create ${label.toLowerCase()}.`,
          );
        setDraft("");
        setCreating(false);
        reload();
      })
      .catch((reason) => setError(messageOf(reason)));
  if (creating)
    return (
      <FormBlock
        active
        activeLabel="Available for assignment"
        description="Role and permission IDs are stable contracts."
        onActiveChange={() => undefined}
        onBack={() => setCreating(false)}
        onCancel={() => setCreating(false)}
        onSubmit={create}
        submitLabel={`Create ${label.toLowerCase()}`}
        tabs={[
          {
            id: "details",
            label: "Details",
            content: (
              <>
                <Field label={`${label} ID`} value={draft} onChange={setDraft} />
                {error ? <p className="mt-3 text-sm text-destructive">{error}</p> : null}
              </>
            ),
          },
        ]}
        title={`New ${label.toLowerCase()}`}
      />
    );
  const fields: MasterField[] = [{ id: "code", label: `${label} ID`, required: true }];
  const masterRecords: MasterRecord[] = records.map((record) => ({ id: record.id, code: record.id }));
  return (
    <MasterList
      createLabel={`New ${label.toLowerCase()}`}
      description={`Application-local ${resource} used by access policies.`}
      fields={fields}
      onCreate={() => setCreating(true)}
      records={masterRecords}
      searchTopSpacing
      showHeaderDivider={false}
      title={`${label}s`}
      topology={topology}
      topologyIds={masterListTopologyIds}
    />
  );
}

function AssignmentsPage({
  applicationId,
  request,
  resource,
}: {
  applicationId: string;
  request: AuthenticatedRequest;
  resource: "role-permissions" | "user-roles";
}) {
  const topology = useMdiTopology();
  const [records, setRecords] = useState<(UserRole | RolePermission)[]>([]);
  const [target, setTarget] = useState("");
  const [ids, setIds] = useState("");
  const [editing, setEditing] = useState(false);
  const [error, setError] = useState<string>();
  const reload = () =>
    void readJson<(UserRole | RolePermission)[]>(request, apiPath(applicationId, resource))
      .then(setRecords)
      .catch((reason) => setError(messageOf(reason)));
  useEffect(reload, [applicationId, resource]);
  const isUserRoles = resource === "user-roles";
  const rows: MasterRecord[] = records.map((record) =>
    isUserRoles
      ? {
          id: `${(record as UserRole).userId}:${(record as UserRole).roleId}`,
          target: (record as UserRole).userId,
          assignment: (record as UserRole).roleId,
        }
      : {
          id: `${(record as RolePermission).roleId}:${(record as RolePermission).permissionId}`,
          target: (record as RolePermission).roleId,
          assignment: (record as RolePermission).permissionId,
        },
  );
  const save = () =>
    void request(apiPath(applicationId, `${resource}/${target}`), {
      body: JSON.stringify({
        ids: ids
          .split(",")
          .map((item) => item.trim())
          .filter(Boolean),
      }),
      headers: { "content-type": "application/json" },
      method: "PUT",
    })
      .then(async (response) => {
        if (!response.ok)
          throw new Error(
            ((await response.json().catch(() => ({}))) as { error?: string }).error ?? "Could not save assignments.",
          );
        setTarget("");
        setIds("");
        setEditing(false);
        reload();
      })
      .catch((reason) => setError(messageOf(reason)));
  const title = isUserRoles ? "User roles" : "Role permissions";
  const targetLabel = isUserRoles ? "User ID" : "Role ID";
  const assignmentLabel = isUserRoles ? "Role ID" : "Permission ID";
  if (editing)
    return (
      <FormBlock
        active
        activeLabel="Assignment enabled"
        description="Saving replaces all assignments for this target."
        onActiveChange={() => undefined}
        onBack={() => setEditing(false)}
        onCancel={() => setEditing(false)}
        onSubmit={save}
        submitLabel="Save assignments"
        tabs={[
          {
            id: "assignments",
            label: "Assignments",
            content: (
              <div className="grid gap-4">
                <Field label={targetLabel} value={target} onChange={setTarget} />
                <Field label={`${assignmentLabel}s (comma separated)`} value={ids} onChange={setIds} />
                {error ? <p className="text-sm text-destructive">{error}</p> : null}
              </div>
            ),
          },
        ]}
        title={`Edit ${title.toLowerCase()}`}
      />
    );
  const fields: MasterField[] = [
    { id: "target", label: targetLabel },
    { id: "assignment", label: assignmentLabel },
  ];
  return (
    <MasterList
      createLabel="Edit assignments"
      description="Assign roles to users and permissions to roles."
      fields={fields}
      onCreate={() => setEditing(true)}
      records={rows}
      searchTopSpacing
      showHeaderDivider={false}
      title={title}
      topology={topology}
      topologyIds={masterListTopologyIds}
    />
  );
}

function Field({
  label,
  onChange,
  type = "text",
  value,
}: {
  label: string;
  onChange(value: string): void;
  type?: string;
  value: string;
}) {
  return (
    <label className="grid gap-1.5 text-sm font-medium">
      <span>{label}</span>
      <Input
        onChange={(event) => onChange(event.target.value)}
        required={label !== "New password (optional)"}
        type={type}
        value={value}
      />
    </label>
  );
}

function identityNavigation(pathname: string): MdiNavigationSection[] {
  return [
    {
      label: "Identity",
      icon: ShieldCheckIcon,
      defaultOpen: true,
      items: resources.map((resource) => ({
        active: pathname.includes(`/identity/${resource.path}`),
        href: `/sa/identity/${resource.path}`,
        icon: resource.path === "users" ? UsersIcon : KeyRoundIcon,
        label: resource.label,
      })),
    },
  ];
}

function resourceFromPath(pathname: string): Resource {
  return resources.find((resource) => pathname.includes(`/identity/${resource.path}`))?.path ?? "users";
}

function apiPath(applicationId: string, path: string): string {
  return `/api/v1/${applicationId}/identity/${path}`;
}
async function readJson<T>(request: AuthenticatedRequest, path: string): Promise<T> {
  const response = await request(path);
  if (!response.ok) throw new Error("Could not load identity data.");
  return response.json() as Promise<T>;
}
function messageOf(reason: unknown): string {
  return reason instanceof Error ? reason.message : "An unexpected error occurred.";
}
