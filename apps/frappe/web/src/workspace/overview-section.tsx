import { useEffect, useState } from "react"

import type { FrappeItem, FrappePurchaseReceipt, FrappeSettings, FrappeTodo } from "@frappe/shared"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { useDashboardShell } from "@/features/dashboard/dashboard-shell"
import { useGlobalLoading } from "@/features/dashboard/loading/global-loading-provider"

import {
  getFrappeSettings,
  listFrappeItems,
  listFrappePurchaseReceipts,
  listFrappeTodos,
} from "../api/frappe-api"
import { MetricCard, SectionShell, StateCard, toErrorMessage } from "./shared"

export function FrappeOverviewSection() {
  const { user } = useDashboardShell()
  const [state, setState] = useState<{
    settings: FrappeSettings | null
    todos: FrappeTodo[]
    items: FrappeItem[]
    receipts: FrappePurchaseReceipt[]
    error: string | null
    isLoading: boolean
  }>({
    settings: null,
    todos: [],
    items: [],
    receipts: [],
    error: null,
    isLoading: true,
  })
  useGlobalLoading(state.isLoading)

  useEffect(() => {
    let cancelled = false

    async function load() {
      setState((current) => ({ ...current, error: null, isLoading: true }))

      try {
        const [todoResponse, itemResponse, receiptResponse, settingsResponse] =
          await Promise.all([
            listFrappeTodos(),
            listFrappeItems(),
            listFrappePurchaseReceipts(),
            user.isSuperAdmin
              ? getFrappeSettings().catch(() => null)
              : Promise.resolve(null),
          ])

        if (!cancelled) {
          setState({
            settings: settingsResponse?.settings ?? null,
            todos: todoResponse.todos.items,
            items: itemResponse.manager.items,
            receipts: receiptResponse.manager.items,
            error: null,
            isLoading: false,
          })
        }
      } catch (error) {
        if (!cancelled) {
          setState({
            settings: null,
            todos: [],
            items: [],
            receipts: [],
            error: toErrorMessage(error),
            isLoading: false,
          })
        }
      }
    }

    void load()

    return () => {
      cancelled = true
    }
  }, [user.isSuperAdmin])

  if (state.isLoading) {
    return null
  }

  if (state.error) {
    return <StateCard message={state.error} />
  }

  const syncedItems = state.items.filter((item) => item.isSyncedToProduct).length
  const syncedReceipts = state.receipts.filter((item) => item.isSyncedLocally).length
  const openTodos = state.todos.filter((item) => item.status === "Open").length

  return (
    <SectionShell
      title="Frappe Overview"
      description="ERPNext connector readiness, local snapshots, and rebuild-safe sync status inside the app-owned Frappe boundary."
    >
      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <MetricCard
          label="ToDos"
          value={state.todos.length}
          hint={`${openTodos} open operator actions currently tracked.`}
        />
        <MetricCard
          label="Items"
          value={state.items.length}
          hint={`${syncedItems} item snapshots currently linked to a local product target.`}
        />
        <MetricCard
          label="Receipts"
          value={state.receipts.length}
          hint={`${syncedReceipts} purchase receipts already synced locally.`}
        />
        <MetricCard
          label="Connection"
          value={
            state.settings
              ? state.settings.isConfigured
                ? "Configured"
                : "Pending"
              : "Restricted"
          }
          hint={
            state.settings
              ? state.settings.enabled
                ? "Connector is enabled for ERPNext workflows."
                : "Connector is saved but not yet enabled."
              : "Connection details are visible to super-admin only."
          }
        />
      </div>

      <div className="grid gap-4 xl:grid-cols-[1.1fr_0.9fr]">
        <Card>
          <CardHeader>
            <CardTitle>Connector Flow</CardTitle>
          <CardDescription>
              The Frappe app owns ERPNext snapshots and sync orchestration without leaking target-app business logic into the connector boundary.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-3 text-sm leading-6 text-muted-foreground">
            <p>1. Save ERPNext connection settings and default mappings in the Frappe app.</p>
            <p>2. Review or edit local Frappe ToDo and Item snapshots before syncing.</p>
            <p>3. Keep item and receipt snapshots local while downstream product ownership is being rebuilt.</p>
            <p>4. Re-enable target-app sync only after the rebuilt commerce boundary is ready.</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Current Defaults</CardTitle>
            <CardDescription>
              ERPNext defaults currently staged for the connector.
            </CardDescription>
          </CardHeader>
          <CardContent className="grid gap-3 text-sm text-muted-foreground">
            <div className="rounded-xl border border-border/70 bg-card/70 p-4">
              <p className="font-medium text-foreground">Default Company</p>
              <p>{state.settings?.defaultCompany || "Not configured"}</p>
            </div>
            <div className="rounded-xl border border-border/70 bg-card/70 p-4">
              <p className="font-medium text-foreground">Default Warehouse</p>
              <p>{state.settings?.defaultWarehouse || "Not configured"}</p>
            </div>
            <div className="rounded-xl border border-border/70 bg-card/70 p-4">
              <p className="font-medium text-foreground">Default Price List</p>
              <p>{state.settings?.defaultPriceList || "Not configured"}</p>
            </div>
            <div className="rounded-xl border border-border/70 bg-card/70 p-4">
              <p className="font-medium text-foreground">Default Item Group</p>
              <p>{state.settings?.defaultItemGroup || "Not configured"}</p>
            </div>
          </CardContent>
        </Card>
      </div>
    </SectionShell>
  )
}
