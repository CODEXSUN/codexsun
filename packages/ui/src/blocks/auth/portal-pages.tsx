import type { ReactNode } from 'react'

function PortalPage({
  children,
  label,
  title,
}: {
  children?: ReactNode
  label: string
  title: string
}) {
  return (
    <div className="min-h-full bg-background p-8">
      <div className="mx-auto max-w-6xl space-y-3">
        <p className="text-sm font-medium text-muted-foreground">{label}</p>
        <h1 className="text-3xl font-semibold tracking-tight">{title}</h1>
        <p className="text-muted-foreground">Your authenticated workspace is ready.</p>
        {children}
      </div>
    </div>
  )
}

export function ClientPortalPage() {
  return <PortalPage label="Client portal" title="Workspace" />
}
export function AdminPortalPage() {
  return <PortalPage label="Administration" title="Administrator desk" />
}
export function SuperAdminPortalPage() {
  return <PortalPage label="System control" title="Super administrator desk" />
}
