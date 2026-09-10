import { ClientPortalPage } from '@codexsun/ui/blocks/auth'
import { Button } from '@codexsun/ui/components/button'
import { Input } from '@codexsun/ui/components/input'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@codexsun/ui/components/table'
import type {
  IdentityManagedUser,
  IdentityRole,
  IdentitySecurityEvent,
} from '@codexsun/platform-contracts'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { useState, type ReactNode } from 'react'
import { usePortalSession } from './identity.hooks'
import {
  assignRegularUserRoles,
  createRegularRole,
  listManagedUsers,
  listRegularRoles,
  listSecurityEvents,
  requestManagedPasswordReset,
  updateRegularUserStatus,
} from './identity.services'

export function ClientIdentityPortal() {
  const session = usePortalSession('regular', '/login')
  return session.data ? <ClientPortalPage /> : null
}

export function AdminIdentityPortal() {
  const session = usePortalSession('administrator', '/admin/login')
  const users = useQuery({
    enabled: Boolean(session.data),
    queryFn: () => listManagedUsers('administrator'),
    queryKey: ['identity', 'administrator', 'users'],
  })
  const roles = useQuery({
    enabled: Boolean(session.data),
    queryFn: listRegularRoles,
    queryKey: ['identity', 'administrator', 'roles'],
  })
  return session.data ? (
    <IdentityDesk label="Administration" title="User management">
      <Section title="Regular users">
        <UserTable users={users.data ?? []} editable roles={roles.data ?? []} />
      </Section>
      <Section title="Product roles and permissions">
        <RoleManager roles={roles.data ?? []} />
      </Section>
    </IdentityDesk>
  ) : null
}

export function SuperAdminIdentityPortal() {
  const session = usePortalSession('super-admin', '/sa/login')
  const users = useQuery({
    enabled: Boolean(session.data),
    queryFn: () => listManagedUsers('super-admin'),
    queryKey: ['identity', 'super-admin', 'users'],
  })
  const events = useQuery({
    enabled: Boolean(session.data),
    queryFn: listSecurityEvents,
    queryKey: ['identity', 'super-admin', 'security-events'],
    refetchInterval: 30_000,
  })
  return session.data ? (
    <IdentityDesk label="System control" title="Identity and security">
      <Section title="All users">
        <UserTable users={users.data ?? []} />
      </Section>
      <Section title="Recent security activity">
        <SecurityTable events={events.data ?? []} />
      </Section>
    </IdentityDesk>
  ) : null
}

function IdentityDesk({
  children,
  label,
  title,
}: {
  children: ReactNode
  label: string
  title: string
}) {
  return (
    <div className="min-h-full bg-background p-6 lg:p-8">
      <div className="mx-auto max-w-7xl space-y-6">
        <div>
          <p className="text-sm font-medium text-muted-foreground">{label}</p>
          <h1 className="text-3xl font-semibold tracking-tight">{title}</h1>
        </div>
        {children}
      </div>
    </div>
  )
}

function Section({ children, title }: { children: ReactNode; title: string }) {
  return (
    <section className="overflow-hidden rounded-lg border bg-card">
      <h2 className="border-b px-5 py-4 text-base font-semibold">{title}</h2>
      <div className="overflow-x-auto">{children}</div>
    </section>
  )
}

function UserTable({
  users,
  editable = false,
  roles = [],
}: {
  users: readonly IdentityManagedUser[]
  editable?: boolean
  roles?: readonly IdentityRole[]
}) {
  const queryClient = useQueryClient()
  const status = useMutation({
    mutationFn: ({ id, value }: { id: string; value: 'active' | 'disabled' }) =>
      updateRegularUserStatus(id, value),
    onSuccess: () =>
      queryClient.invalidateQueries({ queryKey: ['identity', 'administrator', 'users'] }),
  })
  const reset = useMutation({ mutationFn: requestManagedPasswordReset })
  const assignments = useMutation({
    mutationFn: ({ roleIds, userId }: { roleIds: readonly string[]; userId: string }) =>
      assignRegularUserRoles(userId, roleIds),
    onSuccess: () =>
      queryClient.invalidateQueries({ queryKey: ['identity', 'administrator', 'users'] }),
  })
  return (
    <Table>
      <TableHeader className="bg-muted/40 text-left">
        <TableRow>
          <TableHead className="px-5 py-3">Name</TableHead>
          <TableHead className="px-5 py-3">Email</TableHead>
          <TableHead className="px-5 py-3">Portal</TableHead>
          <TableHead className="px-5 py-3">Status</TableHead>
          {editable ? <TableHead className="px-5 py-3 text-right">Actions</TableHead> : null}
        </TableRow>
      </TableHeader>
      <TableBody>
        {users.map((user) => (
          <TableRow key={user.id}>
            <TableCell className="px-5 py-3 font-medium">{user.displayName}</TableCell>
            <TableCell className="px-5 py-3">{user.email}</TableCell>
            <TableCell className="px-5 py-3">{user.portal}</TableCell>
            <TableCell className="px-5 py-3">{user.status}</TableCell>
            {editable ? (
              <TableCell className="space-x-2 px-5 py-3 text-right">
                {roles.map((role) => (
                  <Button
                    key={role.id}
                    size="sm"
                    variant={user.roleIds.includes(role.id) ? 'default' : 'outline'}
                    onClick={() =>
                      assignments.mutate({
                        userId: user.id,
                        roleIds: user.roleIds.includes(role.id)
                          ? user.roleIds.filter((id) => id !== role.id)
                          : [...user.roleIds, role.id],
                      })
                    }
                  >
                    {role.name}
                  </Button>
                ))}
                <Button size="sm" variant="outline" onClick={() => reset.mutate(user.id)}>
                  Request reset
                </Button>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() =>
                    status.mutate({
                      id: user.id,
                      value: user.status === 'active' ? 'disabled' : 'active',
                    })
                  }
                >
                  {user.status === 'active' ? 'Disable' : 'Enable'}
                </Button>
              </TableCell>
            ) : null}
          </TableRow>
        ))}
      </TableBody>
    </Table>
  )
}

function RoleManager({ roles }: { roles: readonly IdentityRole[] }) {
  const queryClient = useQueryClient()
  const [name, setName] = useState('')
  const [permissions, setPermissions] = useState('')
  const create = useMutation({
    mutationFn: () =>
      createRegularRole(
        name,
        permissions
          .split(',')
          .map((value) => value.trim())
          .filter(Boolean),
      ),
    onSuccess: () => {
      setName('')
      setPermissions('')
      return queryClient.invalidateQueries({ queryKey: ['identity', 'administrator', 'roles'] })
    },
  })
  return (
    <div className="space-y-4 p-5">
      <div className="flex flex-wrap gap-3">
        <Input
          className="h-10 w-56"
          placeholder="Role name"
          value={name}
          onChange={(event) => setName(event.target.value)}
        />
        <Input
          className="h-10 min-w-80 flex-1"
          placeholder="Permissions, comma separated"
          value={permissions}
          onChange={(event) => setPermissions(event.target.value)}
        />
        <Button disabled={!name.trim() || create.isPending} onClick={() => create.mutate()}>
          Add role
        </Button>
      </div>
      <div className="grid gap-3 md:grid-cols-2">
        {roles.map((role) => (
          <div className="rounded-md border p-4" key={role.id}>
            <p className="font-medium">{role.name}</p>
            <p className="mt-1 text-sm text-muted-foreground">
              {role.permissions.join(', ') || 'No permissions'}
            </p>
          </div>
        ))}
      </div>
    </div>
  )
}

function SecurityTable({ events }: { events: readonly IdentitySecurityEvent[] }) {
  return (
    <Table>
      <TableHeader className="bg-muted/40 text-left">
        <TableRow>
          <TableHead className="px-5 py-3">Time</TableHead>
          <TableHead className="px-5 py-3">Event</TableHead>
          <TableHead className="px-5 py-3">Outcome</TableHead>
          <TableHead className="px-5 py-3">Risk</TableHead>
          <TableHead className="px-5 py-3">Client</TableHead>
          <TableHead className="px-5 py-3">Address</TableHead>
          <TableHead className="px-5 py-3">Path</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {events.map((event) => (
          <TableRow key={event.id}>
            <TableCell className="px-5 py-3 whitespace-nowrap">
              {new Date(event.createdAt).toLocaleString()}
            </TableCell>
            <TableCell className="px-5 py-3">{event.eventType}</TableCell>
            <TableCell className="px-5 py-3">{event.outcome}</TableCell>
            <TableCell className="px-5 py-3">{event.risk}</TableCell>
            <TableCell className="px-5 py-3">{event.clientType ?? 'unknown'}</TableCell>
            <TableCell className="px-5 py-3">{event.ipAddress ?? 'unknown'}</TableCell>
            <TableCell className="max-w-72 truncate px-5 py-3">{event.path ?? '—'}</TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  )
}
