import { useEffect, useState } from "react"
import { Link, useNavigate } from "react-router-dom"
import {
  ArrowLeftIcon,
  PencilLineIcon,
  RotateCcwIcon,
  ShieldCheckIcon,
  SlashIcon,
} from "lucide-react"

import type { AuthUserResponse } from "@cxapp/shared"

import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { useGlobalLoading } from "@/features/dashboard/loading/global-loading-provider"
import { ActivityStatusBadge } from "@/features/status/activity-status"

import { getFrameworkUser, updateFrameworkUser } from "./user-api"
import { DetailField, SectionShell, StateCard, toTitleCase } from "./user-shared"

function LoadingCard() {
  return (
    <Card>
      <CardContent className="space-y-4 p-5">
        <div className="h-5 w-48 animate-pulse rounded-md bg-muted" />
        <div className="grid gap-4 md:grid-cols-2">
          {Array.from({ length: 6 }).map((_, index) => (
            <div key={index} className="space-y-2">
              <div className="h-4 w-24 animate-pulse rounded bg-muted" />
              <div className="h-10 w-full animate-pulse rounded-md bg-muted/80" />
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  )
}

function DetailCard({
  children,
  description,
  title,
}: {
  children: React.ReactNode
  description: string
  title: string
}) {
  return (
    <Card className="border-border/70 bg-background/95 shadow-sm">
      <CardContent className="space-y-4 p-5">
        <div className="space-y-1">
          <h2 className="text-base font-semibold text-foreground">{title}</h2>
          <p className="text-sm text-muted-foreground">{description}</p>
        </div>
        {children}
      </CardContent>
    </Card>
  )
}

export function FrameworkUserDetailSection({ userId }: { userId: string }) {
  const navigate = useNavigate()
  const [user, setUser] = useState<AuthUserResponse["item"] | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [isMutating, setIsMutating] = useState(false)
  useGlobalLoading(isLoading || isMutating)

  async function loadUser() {
    setIsLoading(true)
    setError(null)

    try {
      const response = await getFrameworkUser(userId)
      setUser(response.item)
    } catch (loadError) {
      setError(loadError instanceof Error ? loadError.message : "Failed to load user.")
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    void loadUser()
  }, [userId])

  async function handleStatusChange(isActive: boolean) {
    if (!user) {
      return
    }

    setError(null)
    setIsMutating(true)

    try {
      const response = await updateFrameworkUser(userId, {
        actorType: user.actorType,
        avatarUrl: user.avatarUrl,
        displayName: user.displayName,
        email: user.email,
        isActive,
        isSuperAdmin: user.isSuperAdmin,
        organizationName: user.organizationName,
        password: null,
        phoneNumber: user.phoneNumber,
        roleKeys: user.roles.map((role) => role.key),
      })
      setUser(response.item)
    } catch (statusError) {
      setError(statusError instanceof Error ? statusError.message : "Failed to update user.")
    } finally {
      setIsMutating(false)
    }
  }

  if (isLoading) {
    return <LoadingCard />
  }

  if (error && !user) {
    return <StateCard message={error} />
  }

  if (!user) {
    return <StateCard message="User could not be found." />
  }

  return (
    <SectionShell
      title={user.displayName}
      description="Review sign-in identity, access profile, and role-derived permissions."
      actions={(
        <>
          <Button asChild variant="outline">
            <Link to="/dashboard/settings/users">
              <ArrowLeftIcon className="size-4" />
              Back
            </Link>
          </Button>
          <Button
            type="button"
            variant="outline"
            onClick={() =>
              void navigate(`/dashboard/settings/users/${encodeURIComponent(user.id)}/edit`)
            }
          >
            <PencilLineIcon className="size-4" />
            Edit
          </Button>
          <Button
            type="button"
            variant="outline"
            onClick={() => void handleStatusChange(!user.isActive)}
          >
            {user.isActive ? <SlashIcon className="size-4" /> : <RotateCcwIcon className="size-4" />}
            {user.isActive ? "Deactivate" : "Restore"}
          </Button>
        </>
      )}
    >
      {error ? (
        <div className="rounded-2xl border border-destructive/20 bg-destructive/5 px-4 py-3 text-sm text-destructive">
          {error}
        </div>
      ) : null}

      <DetailCard
        title="Details"
        description="Primary identity fields and business context used across the application."
      >
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          <DetailField label="User Name" value={user.displayName} />
          <DetailField label="Email" value={user.email} />
          <DetailField label="Phone Number" value={user.phoneNumber ?? "-"} />
          <DetailField label="Actor Type" value={toTitleCase(user.actorType)} />
          <DetailField label="Organization" value={user.organizationName ?? "-"} />
          <DetailField label="Avatar URL" value={user.avatarUrl ?? "-"} />
        </div>
      </DetailCard>

      <DetailCard
        title="Access"
        description="Status, role assignment, and permission mapping coming from the user-role pivot."
      >
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
          <div className="space-y-1">
            <p className="text-xs font-semibold uppercase tracking-[0.16em] text-muted-foreground">
              Status
            </p>
            <ActivityStatusBadge active={user.isActive} />
          </div>
          <div className="space-y-1">
            <p className="text-xs font-semibold uppercase tracking-[0.16em] text-muted-foreground">
              Super Admin
            </p>
            <Badge variant={user.isSuperAdmin ? "default" : "outline"}>
              {user.isSuperAdmin ? "Enabled" : "No"}
            </Badge>
          </div>
          <DetailField label="Created" value={new Date(user.createdAt).toLocaleString()} />
          <DetailField label="Updated" value={new Date(user.updatedAt).toLocaleString()} />
        </div>

        <div className="space-y-2 pt-2">
          <p className="text-xs font-semibold uppercase tracking-[0.16em] text-muted-foreground">
            Roles
          </p>
          <div className="flex flex-wrap gap-2">
            {user.roles.map((role) => (
              <Badge key={role.key} variant="secondary">
                {role.name}
              </Badge>
            ))}
          </div>
        </div>

        <div className="space-y-2 pt-2">
          <p className="text-xs font-semibold uppercase tracking-[0.16em] text-muted-foreground">
            Permissions
          </p>
          <div className="flex flex-wrap gap-2">
            {user.permissions.map((permission) => (
              <Badge key={permission.key} variant="outline" className="gap-1.5">
                <ShieldCheckIcon className="size-3.5" />
                {permission.name}
              </Badge>
            ))}
          </div>
        </div>
      </DetailCard>
    </SectionShell>
  )
}
