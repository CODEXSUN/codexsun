import { useEffect, useState } from "react"

import type {
  FrappeItem,
  FrappeObservabilityReport,
  FrappePurchaseReceipt,
  FrappeSettings,
  FrappeSyncPolicy,
  FrappeTodo,
} from "@frappe/shared"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { useDashboardShell } from "@/features/dashboard/dashboard-shell"
import { useGlobalLoading } from "@/features/dashboard/loading/global-loading-provider"

import {
  getFrappeObservabilityReport,
  getFrappeSettings,
  getFrappeSyncPolicy,
  listFrappeItems,
  listFrappePurchaseReceipts,
  listFrappeTodos,
} from "../api/frappe-api"
import { MetricCard, SectionShell, StateCard, toErrorMessage } from "./shared"

export function FrappeOverviewSection() {
  const { user } = useDashboardShell()
  const [state, setState] = useState<{
    settings: FrappeSettings | null
    syncPolicy: FrappeSyncPolicy | null
    observability: FrappeObservabilityReport | null
    todos: FrappeTodo[]
    items: FrappeItem[]
    receipts: FrappePurchaseReceipt[]
    error: string | null
    isLoading: boolean
  }>({
    settings: null,
    syncPolicy: null,
    observability: null,
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
        const [
          todoResult,
          itemResult,
          receiptResult,
          settingsResult,
          syncPolicyResult,
          observabilityResult,
        ] = await Promise.allSettled([
          listFrappeTodos(),
          listFrappeItems(),
          listFrappePurchaseReceipts(),
          user.isSuperAdmin ? getFrappeSettings() : Promise.resolve(null),
          getFrappeSyncPolicy(),
          getFrappeObservabilityReport(),
        ])

        const warnings = [
          todoResult.status === "rejected" ? toErrorMessage(todoResult.reason) : null,
          itemResult.status === "rejected" ? toErrorMessage(itemResult.reason) : null,
          receiptResult.status === "rejected" ? toErrorMessage(receiptResult.reason) : null,
          settingsResult.status === "rejected" ? toErrorMessage(settingsResult.reason) : null,
          syncPolicyResult.status === "rejected" ? toErrorMessage(syncPolicyResult.reason) : null,
          observabilityResult.status === "rejected"
            ? toErrorMessage(observabilityResult.reason)
            : null,
        ].filter(Boolean)

        if (!cancelled) {
          setState({
            settings:
              settingsResult.status === "fulfilled"
                ? settingsResult.value?.settings ?? null
                : null,
            syncPolicy:
              syncPolicyResult.status === "fulfilled"
                ? syncPolicyResult.value.policy
                : null,
            observability:
              observabilityResult.status === "fulfilled"
                ? observabilityResult.value.report
                : null,
            todos:
              todoResult.status === "fulfilled" ? todoResult.value.todos.items : [],
            items:
              itemResult.status === "fulfilled" ? itemResult.value.manager.items : [],
            receipts:
              receiptResult.status === "fulfilled"
                ? receiptResult.value.manager.items
                : [],
            error:
              warnings.length > 0
                ? `Some Frappe panels are unavailable right now: ${warnings.join(" | ")}`
                : null,
            isLoading: false,
          })
        }
      } catch (error) {
        if (!cancelled) {
          setState({
            settings: null,
            syncPolicy: null,
            observability: null,
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
  const erpReadPolicy = state.syncPolicy?.policies.find(
    (policy) => policy.operationKey === "erp-read"
  )
  const connectorFailures = state.observability?.summary.connectorFailureCount ?? 0

  return (
    <SectionShell
      title="Frappe Overview"
      description="ERPNext connector readiness, local snapshots, and rebuild-safe sync status inside the app-owned Frappe boundary."
    >
      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-5">
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
              ? state.settings.lastVerificationStatus === "passed"
                ? "Connected"
                : "Failed"
              : "Restricted"
          }
          hint={
            state.settings
              ? state.settings.enabled
                ? "Connector config is loaded from `.env` for ERPNext workflows."
                : "Connector is disabled in `.env`."
              : "Connection details are visible to super-admin only."
          }
        />
        <MetricCard
          label="Connector Health"
          value={
            state.observability?.summary.alertState === "breached"
              ? "Alert"
              : "Healthy"
          }
          hint={`${connectorFailures} connector failures recorded in the last 24 hours.`}
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
            <p>1. Load the live ERPNext connection contract strictly from `.env` on the backend.</p>
            <p>2. Verify the handshake through the internal Frappe API before running live connector work.</p>
            <p>3. Review or edit local Frappe ToDo and Item snapshots before syncing.</p>
            <p>4. Keep item and receipt snapshots local while downstream product ownership is being rebuilt.</p>
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
              <p className="font-medium text-foreground">ERP User</p>
              <p>{state.settings?.lastVerifiedUser || "Not verified"}</p>
            </div>
            <div className="rounded-xl border border-border/70 bg-card/70 p-4">
              <p className="font-medium text-foreground">Latency</p>
              <p>
                {state.settings?.lastVerifiedLatencyMs != null
                  ? `${state.settings.lastVerifiedLatencyMs} ms`
                  : "Not verified"}
              </p>
            </div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Sync Guardrails</CardTitle>
          <CardDescription>
            Production-safe retry, timeout, and failure behavior the connector must follow once live ERP sync jobs are enabled.
          </CardDescription>
        </CardHeader>
        <CardContent className="grid gap-4 xl:grid-cols-[0.95fr_1.05fr]">
          <div className="grid gap-3 text-sm text-muted-foreground">
            <div className="rounded-xl border border-border/70 bg-card/70 p-4">
              <p className="font-medium text-foreground">ERP read attempts</p>
              <p>
                {erpReadPolicy
                  ? `${erpReadPolicy.maxAttempts} attempts with ${erpReadPolicy.backoffSeconds.join(", ")} second backoff.`
                  : "Policy unavailable."}
              </p>
            </div>
            <div className="rounded-xl border border-border/70 bg-card/70 p-4">
              <p className="font-medium text-foreground">Timeout budget</p>
              <p>
                {erpReadPolicy
                  ? `${erpReadPolicy.timeoutSeconds}s per connector call, derived from the current env-backed connector settings.`
                  : "Policy unavailable."}
              </p>
            </div>
            <div className="rounded-xl border border-border/70 bg-card/70 p-4">
              <p className="font-medium text-foreground">Failure mode</p>
              <p>
                Connector syncs fail closed after the final retry; downstream projection writes stay manual-replay only.
              </p>
            </div>
          </div>
          <div className="space-y-3 text-sm leading-6 text-muted-foreground">
            {state.syncPolicy?.operatorRules.map((rule) => (
              <p key={rule}>{rule}</p>
            )) ?? <p>Sync guardrails are unavailable right now.</p>}
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Recent Connector Exceptions</CardTitle>
          <CardDescription>
            Latest verification and sync exceptions recorded into the shared monitoring and activity-log baseline.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-3 text-sm">
          {state.observability?.recentExceptions.length ? (
            state.observability.recentExceptions.map((item) => (
              <div
                key={item.id}
                className="rounded-xl border border-border/70 bg-card/70 p-4 text-muted-foreground"
              >
                <p className="font-medium text-foreground">{item.message}</p>
                <p>{item.action}</p>
                <p>
                  {new Date(item.createdAt).toLocaleString("en-IN")}
                  {item.referenceId ? ` | Ref: ${item.referenceId}` : ""}
                </p>
              </div>
            ))
          ) : (
            <p className="text-muted-foreground">
              No connector exceptions recorded recently.
            </p>
          )}
        </CardContent>
      </Card>
    </SectionShell>
  )
}
