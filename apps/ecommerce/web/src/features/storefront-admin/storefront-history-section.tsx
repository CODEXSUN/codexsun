import { useEffect, useMemo, useState } from "react"
import { Link } from "react-router-dom"

import {
  type StorefrontSettingsVersionHistoryEntry,
  type StorefrontSettingsVersionHistoryResponse,
  type StorefrontSettingsWorkflowStatus,
} from "@ecommerce/shared"
import { getStoredAccessToken } from "@cxapp/web/src/auth/session-storage"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { useGlobalLoading } from "@/features/dashboard/loading/global-loading-provider"

import { storefrontApi } from "../../api/storefront-api"
import { storefrontPaths } from "../../lib/storefront-routes"
import {
  StorefrontDesignerPermissionCard,
  useStorefrontDesignerAccess,
} from "./storefront-designer-access"

function WorkflowMetric({
  label,
  value,
}: {
  label: string
  value: string | number
}) {
  return (
    <div className="space-y-1">
      <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-muted-foreground">
        {label}
      </p>
      <p className="text-sm text-foreground">{value}</p>
    </div>
  )
}

function HistoryEntryRow({
  entry,
}: {
  entry: StorefrontSettingsVersionHistoryEntry
}) {
  return (
    <div className="rounded-[1rem] border border-border/70 bg-card/60 px-4 py-3">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <p className="text-sm font-medium text-foreground">{entry.summary}</p>
        <Badge variant="outline" className="rounded-full px-2 py-0.5 text-[10px]">
          {entry.source.replaceAll("_", " ")}
        </Badge>
      </div>
      <p className="mt-1 text-xs text-muted-foreground">{entry.createdAt}</p>
    </div>
  )
}

function HistoryGroupCard({
  title,
  entries,
  emptyMessage,
}: {
  title: string
  entries: StorefrontSettingsVersionHistoryEntry[]
  emptyMessage: string
}) {
  return (
    <Card className="rounded-[1.5rem] border-border/70 py-0 shadow-sm">
      <CardContent className="space-y-3 p-5">
        <div className="flex items-center justify-between gap-3">
          <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-muted-foreground">
            {title}
          </p>
          <span className="text-xs text-muted-foreground">{entries.length} entries</span>
        </div>
        {entries.length > 0 ? (
          <div className="space-y-2">
            {entries.map((entry) => (
              <HistoryEntryRow key={entry.id} entry={entry} />
            ))}
          </div>
        ) : (
          <p className="text-sm text-muted-foreground">{emptyMessage}</p>
        )}
      </CardContent>
    </Card>
  )
}

export function StorefrontHistorySection() {
  const { canEditStorefrontDesigner, canApproveStorefrontDesigner } = useStorefrontDesignerAccess()
  const [workflow, setWorkflow] = useState<StorefrontSettingsWorkflowStatus | null>(null)
  const [history, setHistory] = useState<StorefrontSettingsVersionHistoryResponse | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const accessToken = getStoredAccessToken()

  useGlobalLoading(isLoading)

  useEffect(() => {
    let cancelled = false

    async function load() {
      if (!accessToken) {
        setError("Admin session is required.")
        setIsLoading(false)
        return
      }

      try {
        const [workflowState, historyState] = await Promise.all([
          storefrontApi.getStorefrontSettingsWorkflow(accessToken),
          storefrontApi.getStorefrontSettingsHistory(accessToken),
        ])

        if (!cancelled) {
          setWorkflow(workflowState)
          setHistory(historyState)
          setError(null)
        }
      } catch (loadError) {
        if (!cancelled) {
          setError(
            loadError instanceof Error ? loadError.message : "Failed to load storefront history."
          )
        }
      } finally {
        if (!cancelled) {
          setIsLoading(false)
        }
      }
    }

    void load()

    return () => {
      cancelled = true
    }
  }, [accessToken])

  const historyGroups = useMemo(
    () =>
      history
        ? [
            {
              id: "settings",
              title: "Settings version history",
              entries: history.settings,
              emptyMessage: "No storefront settings history is available yet.",
            },
            {
              id: "home-slider",
              title: "Home slider version history",
              entries: history.homeSlider,
              emptyMessage: "No home slider history is available yet.",
            },
            {
              id: "footer",
              title: "Footer version history",
              entries: history.footer,
              emptyMessage: "No footer history is available yet.",
            },
            {
              id: "campaign",
              title: "Campaign version history",
              entries: history.campaign,
              emptyMessage: "No campaign history is available yet.",
            },
          ]
        : [],
    [history]
  )

  if (isLoading) {
    return (
      <Card className="rounded-[1.5rem] border-border/70 py-0 shadow-sm">
        <CardContent className="p-5 text-sm text-muted-foreground">
          Loading storefront history...
        </CardContent>
      </Card>
    )
  }

  if (error || !workflow || !history) {
    return (
      <Card className="rounded-[1.5rem] border-destructive/20 bg-destructive/5 py-0 shadow-sm">
        <CardContent className="p-5 text-sm text-destructive">
          {error ?? "Storefront history is unavailable."}
        </CardContent>
      </Card>
    )
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center gap-3">
        <Badge variant="outline" className="rounded-full px-3 py-1 text-xs font-medium">
          {historyGroups.length} history streams
        </Badge>
        <Badge variant="outline" className="rounded-full px-3 py-1 text-xs font-medium">
          {workflow.hasUnpublishedChanges ? "Draft ahead of live" : "Draft matches live"}
        </Badge>
        <Button asChild variant="outline" className="rounded-full">
          <Link to="/dashboard/apps/ecommerce/storefront">Open storefront settings</Link>
        </Button>
        <Button asChild variant="outline" className="rounded-full">
          <Link to="/dashboard/apps/ecommerce/home-slider">Open home slider</Link>
        </Button>
        <Button asChild variant="outline" className="rounded-full">
          <a href={storefrontPaths.home()} target="_blank" rel="noreferrer">
            Open live storefront
          </a>
        </Button>
      </div>

      <Card className="rounded-[1.5rem] border-border/70 py-0 shadow-sm">
        <CardContent className="grid gap-3 p-5 md:grid-cols-3">
          <WorkflowMetric label="Live updated" value={workflow.liveSettings.updatedAt} />
          <WorkflowMetric
            label="Draft updated"
            value={workflow.draftSettings?.updatedAt ?? "No active draft"}
          />
          <WorkflowMetric label="Rollback snapshots" value={workflow.revisions.length} />
        </CardContent>
      </Card>

      <StorefrontDesignerPermissionCard
        canEdit={canEditStorefrontDesigner}
        canApprove={canApproveStorefrontDesigner}
      />

      <div className="grid gap-4 xl:grid-cols-2">
        {historyGroups.map((group) => (
          <HistoryGroupCard
            key={group.id}
            title={group.title}
            entries={group.entries}
            emptyMessage={group.emptyMessage}
          />
        ))}
      </div>
    </div>
  )
}
