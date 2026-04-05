import { Bell, Mail, ShieldCheck, UserRound } from "lucide-react"

import { Badge } from "@/components/ui/badge"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"

import { useAuth } from "../auth/auth-context"
import { WebUserLayout } from "../layouts/web-user-layout"

function SummaryStat({
  label,
  value,
}: {
  label: string
  value: string
}) {
  return (
    <div className="rounded-[1.3rem] border border-border/70 bg-background/75 p-4 shadow-sm">
      <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-muted-foreground">
        {label}
      </p>
      <p className="mt-2 text-2xl font-semibold tracking-tight text-foreground">{value}</p>
    </div>
  )
}

export function WebUserDashboardPage() {
  const auth = useAuth()
  const user = auth.user

  if (!user) {
    return null
  }

  return (
    <WebUserLayout
      title={`Welcome, ${user.displayName}`}
      description="This dashboard is limited to your web access only. Administrative applications, framework settings, and operational modules are intentionally hidden on this surface."
    >
      <div className="grid gap-4 md:grid-cols-3">
        <SummaryStat label="Actor Type" value={user.actorType} />
        <SummaryStat label="Roles" value={String(user.roles.length)} />
        <SummaryStat label="Permissions" value={String(user.permissions.length)} />
      </div>

      <div className="grid gap-6 xl:grid-cols-[1.1fr_0.9fr]">
        <Card className="rounded-[1.8rem] border-border/70 py-0 shadow-sm">
          <CardHeader>
            <CardTitle>Account</CardTitle>
          </CardHeader>
          <CardContent className="grid gap-4">
            <div className="flex items-start gap-3 rounded-[1.2rem] border border-border/70 bg-background/75 p-4">
              <UserRound className="mt-0.5 size-5 text-primary" />
              <div className="min-w-0">
                <p className="font-medium text-foreground">{user.displayName}</p>
                <p className="text-sm text-muted-foreground">{user.email}</p>
              </div>
            </div>
            <div className="flex items-start gap-3 rounded-[1.2rem] border border-border/70 bg-background/75 p-4">
              <ShieldCheck className="mt-0.5 size-5 text-primary" />
              <div className="min-w-0">
                <p className="font-medium text-foreground">Assigned roles</p>
                <div className="mt-2 flex flex-wrap gap-2">
                  {user.roles.map((role) => (
                    <Badge key={role.key} variant="outline">
                      {role.name}
                    </Badge>
                  ))}
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="rounded-[1.8rem] border-border/70 py-0 shadow-sm">
          <CardHeader>
            <CardTitle>Available Access</CardTitle>
          </CardHeader>
          <CardContent className="grid gap-3">
            {user.permissions.map((permission) => {
              const Icon =
                permission.scopeType === "desk"
                  ? Bell
                  : permission.scopeType === "module-def"
                    ? Mail
                    : ShieldCheck

              return (
                <div
                  key={permission.key}
                  className="flex items-start gap-3 rounded-[1.2rem] border border-border/70 bg-background/75 p-4"
                >
                  <Icon className="mt-0.5 size-5 text-primary" />
                  <div className="min-w-0">
                    <p className="font-medium text-foreground">{permission.name}</p>
                    <p className="mt-1 text-sm leading-6 text-muted-foreground">
                      {permission.summary}
                    </p>
                  </div>
                </div>
              )
            })}
          </CardContent>
        </Card>
      </div>
    </WebUserLayout>
  )
}
