import { useEffect, useMemo, useState } from "react";
import { KeyRoundIcon, ShieldCheckIcon, UsersIcon } from "lucide-react";
import { MainWorkspace, type MdiNavigationSection } from "../../layouts/main-workspace";
import { Button } from "../../components/button";
import { Input } from "../../components/input";
import { FormBlock } from "../form";
import { createDataTableColumnHelper, DataTableBlock } from "../table";
import type { AuthenticatedRequest } from "./session-boundary";

type IdentityUser = { id: string; login: string; name: string; roles: string[]; state: "active" | "disabled"; username: string };
type Identifier = { id: string };
type UserRole = { roleId: string; userId: string };
type RolePermission = { permissionId: string; roleId: string };
type Resource = "permissions" | "role-permissions" | "roles" | "user-roles" | "users";

const resources: { readonly label: string; readonly path: Resource }[] = [
  { label: "Users", path: "users" },
  { label: "Roles", path: "roles" },
  { label: "Permissions", path: "permissions" },
  { label: "User roles", path: "user-roles" },
  { label: "Role permissions", path: "role-permissions" },
];

export function IdentityManagementDesk({ applicationId, applicationName, logout, request }: { applicationId: string; applicationName: string; logout(): void; request: AuthenticatedRequest }) {
  const [location, setLocation] = useState(() => window.location.pathname);
  useEffect(() => {
    const update = () => setLocation(window.location.pathname);
    window.addEventListener("popstate", update);
    return () => window.removeEventListener("popstate", update);
  }, []);

  const resource = resourceFromPath(location);
  const navigation = useMemo(() => identityNavigation(location), [location]);
  const content = resource === "users"
    ? <UsersPage applicationId={applicationId} request={request} />
    : resource === "roles" || resource === "permissions"
      ? <IdentifiersPage applicationId={applicationId} request={request} resource={resource} />
      : <AssignmentsPage applicationId={applicationId} request={request} resource={resource} />;

  useEffect(() => { document.title = `${applicationName} | Identity`; }, [applicationName]);
  return <MainWorkspace applicationId={applicationId} applicationName={applicationName} navigation={navigation} primaryAction={null} user={{ initials: "SA", name: "Super administrator", onSignOut: logout }} workspaceTitle="Identity and access"><main className="p-6">{content}</main></MainWorkspace>;
}

function UsersPage({ applicationId, request }: { applicationId: string; request: AuthenticatedRequest }) {
  const [users, setUsers] = useState<IdentityUser[]>([]);
  const [editing, setEditing] = useState<IdentityUser>();
  const [error, setError] = useState<string>();
  const reload = () => void readJson<IdentityUser[]>(request, apiPath(applicationId, "users")).then(setUsers).catch((reason) => setError(messageOf(reason)));
  useEffect(reload, [applicationId]);
  if (editing) return <UserForm applicationId={applicationId} request={request} user={editing} onBack={() => setEditing(undefined)} onSaved={() => { setEditing(undefined); reload(); }} />;
  const column = createDataTableColumnHelper<IdentityUser>();
  return <DataTableBlock columns={[column.accessor("name", { header: "Name" }), column.accessor("username", { header: "Username" }), column.accessor("login", { header: "Email" }), column.accessor("roles", { header: "Roles", cell: ({ getValue }) => getValue().join(", ") || "—" }), column.accessor("state", { header: "State" }), column.display({ id: "actions", header: "", cell: ({ row }) => <Button onClick={() => setEditing(row.original)} size="xs" variant="outline">Edit</Button> })] as never} data={users} description="Create, update, and disable application-local accounts." emptyMessage="No users found." getRowId={(user) => user.id} getSearchText={(user) => `${user.name} ${user.username} ${user.login} ${user.roles.join(" ")}`} primaryAction={<Button onClick={() => setEditing({ id: "", login: "", name: "", roles: [], state: "active", username: "" })}>Add user</Button>} summary={error ? <p className="text-sm text-destructive">{error}</p> : undefined} title="Users" />;
}

function UserForm({ applicationId, onBack, onSaved, request, user }: { applicationId: string; onBack(): void; onSaved(): void; request: AuthenticatedRequest; user: IdentityUser }) {
  const [value, setValue] = useState({ ...user, password: "" });
  const [error, setError] = useState<string>();
  const isNew = !user.id;
  const submit = () => void request(apiPath(applicationId, `users${isNew ? "" : `/${user.id}`}`), { body: JSON.stringify({ login: value.login, name: value.name, password: value.password || undefined, state: value.state, username: value.username }), headers: { "content-type": "application/json" }, method: isNew ? "POST" : "PUT" }).then(async (response) => { if (!response.ok) throw new Error((await response.json().catch(() => ({})) as { error?: string }).error ?? "Could not save user."); onSaved(); }).catch((reason) => setError(messageOf(reason)));
  return <FormBlock active={value.state === "active"} activeLabel="Account active" description="A user must have a unique email and username." onActiveChange={(active) => setValue({ ...value, state: active ? "active" : "disabled" })} onBack={onBack} onCancel={onBack} onSubmit={submit} submitLabel={isNew ? "Create user" : "Save user"} tabs={[{ id: "details", label: "Details", content: <div className="grid gap-4 md:grid-cols-2"><Field label="Name" value={value.name} onChange={(name) => setValue({ ...value, name })} /><Field label="Username" value={value.username} onChange={(username) => setValue({ ...value, username })} /><Field label="Email" type="email" value={value.login} onChange={(login) => setValue({ ...value, login })} /><Field label={isNew ? "Password" : "New password (optional)"} type="password" value={value.password} onChange={(password) => setValue({ ...value, password })} />{error ? <p className="text-sm text-destructive md:col-span-2">{error}</p> : null}</div> }]} title={isNew ? "New user" : `Edit ${user.name}`} />;
}

function IdentifiersPage({ applicationId, request, resource }: { applicationId: string; request: AuthenticatedRequest; resource: "permissions" | "roles" }) {
  const [records, setRecords] = useState<Identifier[]>([]);
  const [id, setId] = useState("");
  const [error, setError] = useState<string>();
  const reload = () => void readJson<Identifier[]>(request, apiPath(applicationId, resource)).then(setRecords).catch((reason) => setError(messageOf(reason)));
  useEffect(reload, [applicationId, resource]);
  const label = resource === "roles" ? "Role" : "Permission";
  const column = createDataTableColumnHelper<Identifier>();
  const create = () => void request(apiPath(applicationId, resource), { body: JSON.stringify({ id }), headers: { "content-type": "application/json" }, method: "POST" }).then(async (response) => { if (!response.ok) throw new Error((await response.json().catch(() => ({})) as { error?: string }).error ?? `Could not create ${label.toLowerCase()}.`); setId(""); reload(); }).catch((reason) => setError(messageOf(reason)));
  return <>{id ? <FormBlock active activeLabel="Available for assignment" description="Role and permission IDs are stable contracts." onActiveChange={() => undefined} onBack={() => setId("")} onCancel={() => setId("")} onSubmit={create} submitLabel={`Create ${label.toLowerCase()}`} tabs={[{ id: "details", label: "Details", content: <><Field label={`${label} ID`} value={id} onChange={setId} />{error ? <p className="mt-3 text-sm text-destructive">{error}</p> : null}</> }]} title={`New ${label.toLowerCase()}`} /> : <DataTableBlock columns={[column.accessor("id", { header: `${label} ID` })] as never} data={records} description={`Application-local ${resource} used by access policies.`} emptyMessage={`No ${resource} found.`} getRowId={(record) => record.id} getSearchText={(record) => record.id} primaryAction={<Button onClick={() => setId("new")}>Add {label.toLowerCase()}</Button>} title={label + "s"} />}</>;
}

function AssignmentsPage({ applicationId, request, resource }: { applicationId: string; request: AuthenticatedRequest; resource: "role-permissions" | "user-roles" }) {
  const [records, setRecords] = useState<(UserRole | RolePermission)[]>([]);
  const [target, setTarget] = useState("");
  const [ids, setIds] = useState("");
  const [error, setError] = useState<string>();
  const reload = () => void readJson<(UserRole | RolePermission)[]>(request, apiPath(applicationId, resource)).then(setRecords).catch((reason) => setError(messageOf(reason)));
  useEffect(reload, [applicationId, resource]);
  const isUserRoles = resource === "user-roles";
  const rows = records.map((record) => isUserRoles ? { id: `${(record as UserRole).userId}:${(record as UserRole).roleId}`, left: (record as UserRole).userId, right: (record as UserRole).roleId } : { id: `${(record as RolePermission).roleId}:${(record as RolePermission).permissionId}`, left: (record as RolePermission).roleId, right: (record as RolePermission).permissionId });
  const column = createDataTableColumnHelper<{ id: string; left: string; right: string }>();
  const save = () => void request(apiPath(applicationId, `${resource}/${target}`), { body: JSON.stringify({ ids: ids.split(",").map((item) => item.trim()).filter(Boolean) }), headers: { "content-type": "application/json" }, method: "PUT" }).then(async (response) => { if (!response.ok) throw new Error((await response.json().catch(() => ({})) as { error?: string }).error ?? "Could not save assignments."); setTarget(""); setIds(""); reload(); }).catch((reason) => setError(messageOf(reason)));
  const title = isUserRoles ? "User roles" : "Role permissions";
  const targetLabel = isUserRoles ? "User ID" : "Role ID";
  const idsLabel = isUserRoles ? "Role IDs" : "Permission IDs";
  return target ? <FormBlock active activeLabel="Assignment enabled" description="Saving replaces all assignments for this target." onActiveChange={() => undefined} onBack={() => setTarget("")} onCancel={() => setTarget("")} onSubmit={save} submitLabel="Save assignments" tabs={[{ id: "assignments", label: "Assignments", content: <div className="grid gap-4"><Field label={targetLabel} value={target === "new" ? "" : target} onChange={setTarget} /><Field label={`${idsLabel} (comma separated)`} value={ids} onChange={setIds} />{error ? <p className="text-sm text-destructive">{error}</p> : null}</div> }]} title={`Edit ${title.toLowerCase()}`} /> : <DataTableBlock columns={[column.accessor("left", { header: targetLabel }), column.accessor("right", { header: idsLabel.slice(0, -1) })] as never} data={rows} description="Assign roles to users and permissions to roles." emptyMessage={`No ${title.toLowerCase()} found.`} getRowId={(row) => row.id} getSearchText={(row) => `${row.left} ${row.right}`} primaryAction={<Button onClick={() => setTarget("new")}>Edit assignments</Button>} title={title} />;
}

function Field({ label, onChange, type = "text", value }: { label: string; onChange(value: string): void; type?: string; value: string }) {
  return <label className="grid gap-1.5 text-sm font-medium"><span>{label}</span><Input onChange={(event) => onChange(event.target.value)} required={label !== "New password (optional)"} type={type} value={value} /></label>;
}

function identityNavigation(pathname: string): MdiNavigationSection[] {
  return [{ label: "Identity", icon: ShieldCheckIcon, defaultOpen: true, items: resources.map((resource) => ({ active: pathname.includes(`/identity/${resource.path}`), href: `/sa/identity/${resource.path}`, icon: resource.path === "users" ? UsersIcon : KeyRoundIcon, label: resource.label })) }];
}

function resourceFromPath(pathname: string): Resource {
  return resources.find((resource) => pathname.includes(`/identity/${resource.path}`))?.path ?? "users";
}

function apiPath(applicationId: string, path: string): string { return `/api/v1/${applicationId}/identity/${path}`; }
async function readJson<T>(request: AuthenticatedRequest, path: string): Promise<T> { const response = await request(path); if (!response.ok) throw new Error("Could not load identity data."); return response.json() as Promise<T>; }
function messageOf(reason: unknown): string { return reason instanceof Error ? reason.message : "An unexpected error occurred."; }
