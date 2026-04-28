import { useEffect, useMemo, useState } from "react"
import { Layers3, SaveIcon } from "lucide-react"

import type {
  TenantVisibilityAdminSnapshot,
  TenantVisibilityProfileUpdatePayload,
  TenantVisibilityTenantItem,
} from "@cxapp/shared"

import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Checkbox } from "@/components/ui/checkbox"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { useGlobalLoading } from "@/features/dashboard/loading/global-loading-provider"

import {
  getTenantVisibilityAdminSnapshot,
  saveTenantVisibilityProfile,
} from "./tenant-visibility-api"

type TenantVisibilityDraft = TenantVisibilityProfileUpdatePayload

function cloneDraftFromItem(item: TenantVisibilityTenantItem): TenantVisibilityDraft {
  return {
    companyId: item.companyId,
    industryId: item.industryId,
    clientOverlayId: item.clientOverlayId,
    enabledAppIds: [...item.enabledAppIds],
    enabledModuleIds: [...item.enabledModuleIds],
    featureFlags: [...item.featureFlags],
    inventoryMode: item.inventoryMode,
    productionPolicy: item.productionPolicy,
  }
}

function getCompatibleClientOverlays(
  snapshot: TenantVisibilityAdminSnapshot,
  industryId: string
) {
  return snapshot.clientOverlays.filter(
    (entry) => entry.industryId == null || entry.industryId === industryId
  )
}

function buildDefaultDraft(
  snapshot: TenantVisibilityAdminSnapshot,
  item: TenantVisibilityTenantItem,
  industryId: string,
  clientOverlayId?: string | null
) {
  const bundle = snapshot.bundles.find((entry) => entry.id === industryId)
  const clientOverlay = getCompatibleClientOverlays(snapshot, industryId).find(
    (entry) => entry.id === (clientOverlayId ?? item.clientOverlayId ?? "default")
  )

  if (!bundle) {
    return cloneDraftFromItem(item)
  }

  const appSet = new Set(bundle.enabledAppIds)
  const moduleSet = new Set(bundle.enabledModuleIds)

  for (const appId of clientOverlay?.enabledAppIds ?? []) {
    appSet.add(appId)
  }

  for (const appId of clientOverlay?.disabledAppIds ?? []) {
    appSet.delete(appId)
  }

  for (const moduleId of clientOverlay?.enabledModuleIds ?? []) {
    moduleSet.add(moduleId)
  }

  for (const moduleId of clientOverlay?.disabledModuleIds ?? []) {
    moduleSet.delete(moduleId)
  }

  return {
    companyId: item.companyId,
    industryId: bundle.id,
    clientOverlayId: clientOverlay?.id ?? "default",
    enabledAppIds: [...appSet],
    enabledModuleIds: [...moduleSet],
    featureFlags: [
      ...new Set([...(bundle.featureFlags ?? []), ...(clientOverlay?.featureFlags ?? [])]),
    ],
    inventoryMode: item.inventoryMode,
    productionPolicy: item.productionPolicy,
  } satisfies TenantVisibilityDraft
}

export function FrameworkTenantVisibilitySection() {
  const [snapshot, setSnapshot] = useState<TenantVisibilityAdminSnapshot | null>(null)
  const [selectedCompanyId, setSelectedCompanyId] = useState<string | null>(null)
  const [draft, setDraft] = useState<TenantVisibilityDraft | null>(null)
  const [searchValue, setSearchValue] = useState("")
  const [error, setError] = useState<string | null>(null)
  const [notice, setNotice] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [isSaving, setIsSaving] = useState(false)
  useGlobalLoading(isLoading || isSaving)

  useEffect(() => {
    let isMounted = true

    async function loadSnapshot() {
      setIsLoading(true)
      setError(null)

      try {
        const response = await getTenantVisibilityAdminSnapshot()

        if (!isMounted) {
          return
        }

        setSnapshot(response.item)
        setSelectedCompanyId((current) => current ?? response.item.items[0]?.companyId ?? null)
      } catch (loadError) {
        if (isMounted) {
          setError(loadError instanceof Error ? loadError.message : "Failed to load tenant visibility.")
        }
      } finally {
        if (isMounted) {
          setIsLoading(false)
        }
      }
    }

    void loadSnapshot()

    return () => {
      isMounted = false
    }
  }, [])

  const filteredItems = useMemo(() => {
    const normalizedSearch = searchValue.trim().toLowerCase()

    return (snapshot?.items ?? []).filter((item) => {
      if (!normalizedSearch) {
        return true
      }

      return [item.tenantDisplayName, item.companyName, item.industryId]
        .join(" ")
        .toLowerCase()
        .includes(normalizedSearch)
    })
  }, [searchValue, snapshot?.items])

  const selectedItem = useMemo(
    () =>
      (snapshot?.items ?? []).find((item) => item.companyId === selectedCompanyId) ??
      filteredItems[0] ??
      null,
    [filteredItems, selectedCompanyId, snapshot?.items]
  )

  useEffect(() => {
    if (!selectedItem) {
      setDraft(null)
      return
    }

    setDraft(cloneDraftFromItem(selectedItem))
  }, [selectedItem])

  const apps = snapshot?.apps ?? []
  const compatibleClientOverlays = useMemo(
    () => (snapshot && draft ? getCompatibleClientOverlays(snapshot, draft.industryId) : []),
    [draft, snapshot]
  )

  function handleIndustryChange(industryId: string) {
    if (!snapshot || !selectedItem) {
      return
    }

    setDraft(buildDefaultDraft(snapshot, selectedItem, industryId))
    setNotice(null)
  }

  function handleClientOverlayChange(clientOverlayId: string) {
    if (!snapshot || !selectedItem || !draft) {
      return
    }

    setDraft(buildDefaultDraft(snapshot, selectedItem, draft.industryId, clientOverlayId))
    setNotice(null)
  }

  function handleAppToggle(appId: string, checked: boolean) {
    setDraft((current) => {
      if (!current) {
        return current
      }

      const nextAppIds = checked
        ? [...new Set([...current.enabledAppIds, appId])]
        : current.enabledAppIds.filter((candidate) => candidate !== appId)
      const nextModuleIds = checked
        ? current.enabledModuleIds
        : current.enabledModuleIds.filter(
            (moduleId) =>
              !apps.find((app) => app.appId === appId)?.modules.some((module) => module.id === moduleId)
          )

      return {
        ...current,
        enabledAppIds: nextAppIds,
        enabledModuleIds: nextModuleIds,
      }
    })
    setNotice(null)
  }

  function handleModuleToggle(appId: string, moduleId: string, checked: boolean) {
    setDraft((current) => {
      if (!current) {
        return current
      }

      const nextAppIds =
        checked && !current.enabledAppIds.includes(appId)
          ? [...current.enabledAppIds, appId]
          : current.enabledAppIds

      return {
        ...current,
        enabledAppIds: nextAppIds,
        enabledModuleIds: checked
          ? [...new Set([...current.enabledModuleIds, moduleId])]
          : current.enabledModuleIds.filter((candidate) => candidate !== moduleId),
      }
    })
    setNotice(null)
  }

  async function handleSave() {
    if (!draft) {
      return
    }

    setIsSaving(true)
    setError(null)
    setNotice(null)

    try {
      const response = await saveTenantVisibilityProfile(draft)

      setSnapshot((current) => {
        if (!current) {
          return current
        }

        return {
          ...current,
          current:
            current.current.companyId === response.item.companyId
              ? {
                  tenantId: response.item.tenantId,
                  companyId: response.item.companyId,
                  industryId: response.item.industryId,
                  clientOverlayId: response.item.clientOverlayId,
                  visibleAppIds: response.item.enabledAppIds,
                  visibleModuleIds: response.item.enabledModuleIds,
                }
              : current.current,
          items: current.items.map((item) =>
            item.companyId === response.item.companyId ? response.item : item
          ),
        }
      })
      setDraft(cloneDraftFromItem(response.item))
      setNotice("Tenant visibility saved.")
    } catch (saveError) {
      setError(saveError instanceof Error ? saveError.message : "Failed to save tenant visibility.")
    } finally {
      setIsSaving(false)
    }
  }

  return (
    <section className="space-y-6" data-technical-name="page.framework.tenant-visibility">
      <Card
        className="border-border/70 bg-background/95 shadow-sm"
        data-technical-name="section.framework.tenant-visibility.header"
      >
        <CardHeader className="space-y-3">
          <div className="space-y-2">
            <p className="text-xs font-semibold uppercase tracking-[0.24em] text-muted-foreground">
              Framework Tenancy
            </p>
            <CardTitle className="text-2xl font-semibold tracking-tight">
              Tenant visibility matrix
            </CardTitle>
            <p className="max-w-3xl text-sm leading-6 text-muted-foreground">
              Assign one industry bundle per tenant company, then refine which apps and sidebar
              module groups stay visible in the shared cxapp shell.
            </p>
          </div>
          <div className="grid gap-3 sm:grid-cols-4">
            <div className="rounded-xl border border-border/70 bg-muted/30 px-3 py-2">
              <p className="text-[11px] font-semibold uppercase tracking-[0.22em] text-muted-foreground">
                Tenants
              </p>
              <p className="mt-1 text-lg font-semibold text-foreground">
                {snapshot?.items.length ?? 0}
              </p>
            </div>
            <div className="rounded-xl border border-border/70 bg-muted/30 px-3 py-2">
              <p className="text-[11px] font-semibold uppercase tracking-[0.22em] text-muted-foreground">
                Bundles
              </p>
              <p className="mt-1 text-lg font-semibold text-foreground">
                {snapshot?.bundles.length ?? 0}
              </p>
            </div>
            <div className="rounded-xl border border-border/70 bg-muted/30 px-3 py-2">
              <p className="text-[11px] font-semibold uppercase tracking-[0.22em] text-muted-foreground">
                Active apps
              </p>
              <p className="mt-1 text-lg font-semibold text-foreground">
                {draft?.enabledAppIds.length ?? 0}
              </p>
            </div>
            <div className="rounded-xl border border-border/70 bg-muted/30 px-3 py-2">
              <p className="text-[11px] font-semibold uppercase tracking-[0.22em] text-muted-foreground">
                Active modules
              </p>
              <p className="mt-1 text-lg font-semibold text-foreground">
                {draft?.enabledModuleIds.length ?? 0}
              </p>
            </div>
          </div>
        </CardHeader>
      </Card>

      {error ? (
        <div className="rounded-2xl border border-destructive/20 bg-destructive/5 px-4 py-3 text-sm text-destructive">
          {error}
        </div>
      ) : null}

      {notice ? (
        <div className="rounded-2xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-700">
          {notice}
        </div>
      ) : null}

      <div
        className="grid gap-6 xl:grid-cols-[0.92fr_1.08fr]"
        data-technical-name="section.framework.tenant-visibility.matrix"
      >
        <Card className="border-border/70 bg-card/80 shadow-sm">
          <CardHeader className="space-y-3">
            <div className="space-y-2">
              <CardTitle className="text-lg font-semibold tracking-tight">
                Tenant companies
              </CardTitle>
              <p className="text-sm leading-6 text-muted-foreground">
                Choose the tenant company whose bundle and sidebar visibility should be edited.
              </p>
            </div>
            <Input
              value={searchValue}
              onChange={(event) => setSearchValue(event.target.value)}
              placeholder="Search tenant or company"
            />
          </CardHeader>
          <CardContent className="space-y-3">
            {filteredItems.map((item) => {
              const isActive = item.companyId === selectedItem?.companyId

              return (
                <button
                  key={item.companyId}
                  type="button"
                  onClick={() => setSelectedCompanyId(item.companyId)}
                  className={`w-full rounded-2xl border px-4 py-3 text-left transition ${
                    isActive
                      ? "border-primary/40 bg-primary/5"
                      : "border-border/70 bg-background hover:border-primary/20 hover:bg-muted/20"
                  }`}
                >
                  <div className="flex flex-wrap items-start justify-between gap-3">
                    <div className="space-y-1">
                      <p className="font-medium text-foreground">{item.tenantDisplayName}</p>
                      <p className="text-sm text-muted-foreground">{item.companyName}</p>
                    </div>
                    <div className="flex flex-wrap gap-2">
                      {item.isPrimaryCompany ? <Badge variant="secondary">Primary</Badge> : null}
                      <Badge variant="outline">{item.industryId}</Badge>
                    </div>
                  </div>
                  <p className="mt-3 text-xs uppercase tracking-[0.18em] text-muted-foreground">
                    {item.enabledAppIds.length} apps + {item.enabledModuleIds.length} modules
                  </p>
                </button>
              )
            })}
          </CardContent>
        </Card>

        <Card className="border-border/70 bg-card/80 shadow-sm">
          <CardHeader className="space-y-3">
            <div className="space-y-2">
              <CardTitle className="text-lg font-semibold tracking-tight">
                {selectedItem ? `${selectedItem.tenantDisplayName} visibility` : "Select a tenant"}
              </CardTitle>
              <p className="text-sm leading-6 text-muted-foreground">
                Apply one industry bundle, then refine which apps and business menu groups remain
                visible.
              </p>
            </div>
            {selectedItem ? (
              <div className="flex flex-wrap gap-2">
                <Badge variant="outline">{selectedItem.tenantSlug}</Badge>
                <Badge variant="secondary">{selectedItem.companyName}</Badge>
              </div>
            ) : null}
          </CardHeader>
          <CardContent className="space-y-6">
            {draft && snapshot && selectedItem ? (
              <>
                <div className="grid gap-4 md:grid-cols-2">
                  <div className="space-y-2">
                    <Label htmlFor="tenant-industry-bundle">Industry bundle</Label>
                    <Select value={draft.industryId} onValueChange={handleIndustryChange}>
                      <SelectTrigger id="tenant-industry-bundle" className="w-full">
                        <SelectValue placeholder="Select industry bundle" />
                      </SelectTrigger>
                      <SelectContent>
                        {snapshot.bundles.map((bundle) => (
                          <SelectItem key={bundle.id} value={bundle.id}>
                            {bundle.displayName}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="tenant-client-overlay">Client overlay</Label>
                    <Select
                      value={draft.clientOverlayId ?? "default"}
                      onValueChange={handleClientOverlayChange}
                    >
                      <SelectTrigger id="tenant-client-overlay" className="w-full">
                        <SelectValue placeholder="Select client overlay" />
                      </SelectTrigger>
                      <SelectContent>
                        {compatibleClientOverlays.map((clientOverlay) => (
                          <SelectItem key={clientOverlay.id} value={clientOverlay.id}>
                            {clientOverlay.displayName}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <p className="text-xs leading-5 text-muted-foreground">
                      Client overlays stay industry-aware and only show compatible options here.
                    </p>
                  </div>
                </div>

                <div className="grid gap-3 md:grid-cols-3">
                  <div className="rounded-xl border border-border/70 bg-muted/20 px-3 py-3">
                    <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-muted-foreground">
                      Overlay
                    </p>
                    <p className="mt-1 font-medium text-foreground">
                      {compatibleClientOverlays.find(
                        (entry) => entry.id === (draft.clientOverlayId ?? "default")
                      )?.displayName ?? "Default Overlay"}
                    </p>
                  </div>
                  <div className="rounded-xl border border-border/70 bg-muted/20 px-3 py-3">
                    <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-muted-foreground">
                      Visible apps
                    </p>
                    <p className="mt-1 font-medium text-foreground">{draft.enabledAppIds.length}</p>
                  </div>
                  <div className="rounded-xl border border-border/70 bg-muted/20 px-3 py-3">
                    <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-muted-foreground">
                      Visible modules
                    </p>
                    <p className="mt-1 font-medium text-foreground">{draft.enabledModuleIds.length}</p>
                  </div>
                </div>

                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <p className="text-sm font-semibold text-foreground">Enabled apps</p>
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() => setDraft(buildDefaultDraft(snapshot, selectedItem, draft.industryId))}
                    >
                      <Layers3 className="size-4" />
                      Reset to bundle defaults
                    </Button>
                  </div>
                  <div className="grid gap-3 md:grid-cols-2">
                    {apps.map((app) => {
                      const enabled = draft.enabledAppIds.includes(app.appId)

                      return (
                        <label
                          key={app.appId}
                          className={`flex items-start gap-3 rounded-2xl border px-4 py-3 ${
                            enabled ? "border-primary/30 bg-primary/5" : "border-border/70 bg-background"
                          }`}
                        >
                          <Checkbox
                            checked={enabled}
                            onCheckedChange={(checked) => handleAppToggle(app.appId, Boolean(checked))}
                          />
                          <div className="space-y-1">
                            <p className="font-medium text-foreground">{app.label}</p>
                            <p className="text-sm leading-6 text-muted-foreground">{app.summary}</p>
                          </div>
                        </label>
                      )
                    })}
                  </div>
                </div>

                <div className="space-y-3">
                  <p className="text-sm font-semibold text-foreground">Module visibility</p>
                  <div className="space-y-4">
                    {apps.map((app) => {
                      const appEnabled = draft.enabledAppIds.includes(app.appId)

                      return (
                        <div
                          key={app.appId}
                          className="rounded-2xl border border-border/70 bg-background p-4"
                        >
                          <div className="flex items-center justify-between gap-3">
                            <div>
                              <p className="font-medium text-foreground">{app.label}</p>
                              <p className="text-sm text-muted-foreground">{app.route}</p>
                            </div>
                            <Badge variant={appEnabled ? "default" : "outline"}>
                              {appEnabled ? "Visible" : "Hidden"}
                            </Badge>
                          </div>
                          <div className="mt-4 grid gap-3 md:grid-cols-2">
                            {app.modules.map((module) => {
                              const enabled = draft.enabledModuleIds.includes(module.id)

                              return (
                                <label
                                  key={module.id}
                                  className={`flex items-start gap-3 rounded-xl border px-3 py-3 ${
                                    enabled ? "border-primary/30 bg-primary/5" : "border-border/70 bg-muted/20"
                                  } ${appEnabled ? "" : "opacity-60"}`}
                                >
                                  <Checkbox
                                    checked={enabled}
                                    onCheckedChange={(checked) =>
                                      handleModuleToggle(app.appId, module.id, Boolean(checked))
                                    }
                                  />
                                  <div className="space-y-1">
                                    <p className="text-sm font-medium text-foreground">{module.label}</p>
                                    <p className="text-xs leading-5 text-muted-foreground">
                                      {module.summary}
                                    </p>
                                  </div>
                                </label>
                              )
                            })}
                          </div>
                        </div>
                      )
                    })}
                  </div>
                </div>

                <div className="flex justify-end">
                  <Button type="button" onClick={() => void handleSave()} disabled={isSaving}>
                    <SaveIcon className="size-4" />
                    {isSaving ? "Saving..." : "Save visibility"}
                  </Button>
                </div>
              </>
            ) : (
              <div className="rounded-2xl border border-dashed border-border/70 px-4 py-10 text-sm text-muted-foreground">
                Select a tenant company to edit its visibility matrix.
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </section>
  )
}
