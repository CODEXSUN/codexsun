import { useEffect, useState } from "react"
import { useNavigate } from "react-router-dom"
import { ArrowLeftIcon, PencilLineIcon, Trash2Icon } from "lucide-react"

import {
  coreCommonModuleMenuGroups,
  getCoreCommonModuleMenuItem,
  deliveryChannels,
  navigationSections,
  productModules,
  type BootstrapSnapshot,
  type CommonModuleMetadata,
  type CommonModuleItem,
  type CommonModuleKey,
  type CommonModuleMetadataListResponse,
  type CommonModuleRecordResponse,
  type CommonModuleSummaryListResponse,
  type CompanyListResponse,
  type CompanyResponse,
  type ContactListResponse,
  type ContactResponse,
} from "@core/shared"
import { getStoredAccessToken } from "@cxapp/web/src/auth/session-storage"
import { MasterList } from "@/components/blocks/master-list"
import { RecordActionMenu } from "@/components/blocks/record-action-menu"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { useGlobalLoading } from "@/features/dashboard/loading/global-loading-provider"
import {
  ActivityStatusBadge,
  getActivityStatusPanelClassName,
} from "@/features/status/activity-status"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Switch } from "@/components/ui/switch"
import { Textarea } from "@/components/ui/textarea"
import { SearchableLookupField } from "@/features/forms/searchable-lookup-field"
import { toCompanyFormValues } from "@core/web/src/features/company/company-form-state"
import { CompanyUpsertSection as CompanyUpsertFeatureSection } from "@core/web/src/features/company/company-upsert-section"
import { toContactFormValues } from "@core/web/src/features/contact/contact-form-state"
import { ContactUpsertSection as ContactUpsertFeatureSection } from "@core/web/src/features/contact/contact-upsert-section"
import { cn } from "@/lib/utils"

type ResourceState<T> = {
  data: T | null
  error: string | null
  isLoading: boolean
}

type LookupOption = {
  label: string
  value: string
}

type CommonModuleFormState = Record<string, string | boolean>

type CommonModuleReferenceMap = Partial<Record<CommonModuleKey, CommonModuleItem[]>>

type StatusFilterValue = "all" | "active" | "inactive"

function matchesStatusFilter(statusFilter: StatusFilterValue, isActive: boolean) {
  if (statusFilter === "all") {
    return true
  }

  return statusFilter === "active" ? isActive : !isActive
}

function buildStatusFilters(
  statusFilter: StatusFilterValue,
  onChange: (value: StatusFilterValue) => void
) {
  return {
    options: [
      {
        key: "all",
        label: "All records",
        isActive: statusFilter === "all",
        onSelect: () => onChange("all"),
      },
      {
        key: "active",
        label: "Active only",
        isActive: statusFilter === "active",
        onSelect: () => onChange("active"),
      },
      {
        key: "inactive",
        label: "Inactive only",
        isActive: statusFilter === "inactive",
        onSelect: () => onChange("inactive"),
      },
    ],
    activeFilters:
      statusFilter === "all"
        ? []
        : [
            {
              key: "status",
              label: "Status",
              value: statusFilter === "active" ? "Active only" : "Inactive only",
            },
          ],
    onRemoveFilter: (key: string) => {
      if (key === "status") {
        onChange("all")
      }
    },
    onClearAllFilters: () => onChange("all"),
  }
}

async function requestJson<T>(path: string, init?: RequestInit): Promise<T> {
  const accessToken = getStoredAccessToken()
  const response = await fetch(path, {
    ...init,
    headers: accessToken
      ? {
          "content-type": "application/json",
          authorization: `Bearer ${accessToken}`,
          ...(init?.headers ?? {}),
        }
      : {
          "content-type": "application/json",
          ...(init?.headers ?? {}),
        },
  })

  if (!response.ok) {
    const payload = (await response.json().catch(() => null)) as
      | { error?: string; message?: string }
      | null
    const message =
      payload?.error ?? payload?.message ?? `Request failed with status ${response.status}.`
    throw new Error(message)
  }

  return (await response.json()) as T
}

function toSingularLabel(label: string) {
  if (label.endsWith("ies")) {
    return `${label.slice(0, -3)}y`
  }

  if (label.endsWith("s")) {
    return label.slice(0, -1)
  }

  return label
}

function getCommonModulePrimaryText(item: CommonModuleItem) {
  for (const candidateKey of ["name", "title", "code", "area_name"] as const) {
    const value = item[candidateKey]
    if (typeof value === "string" && value.trim().length > 0) {
      return value
    }
  }

  return item.id
}

function getCommonModuleOptionLabel(item: CommonModuleItem) {
  const primaryText = getCommonModulePrimaryText(item)
  const code = typeof item.code === "string" ? item.code.trim() : ""

  if (code.length > 0 && code !== primaryText) {
    return `${primaryText} (${code})`
  }

  return primaryText
}

function getCommonModulePrimaryColumn(
  columns: CommonModuleMetadata["columns"]
) {
  const primaryCandidates = ["name", "title", "area_name", "code"] as const

  for (const candidateKey of primaryCandidates) {
    const column = columns.find((entry) => entry.key === candidateKey)
    if (column) {
      return column
    }
  }

  return columns[0] ?? null
}

function getCommonModuleListColumns(
  moduleKey: CommonModuleKey,
  columns: CommonModuleMetadata["columns"]
) {
  if (moduleKey === "pincodes") {
    const preferredOrder = ["code", "area_name", "city_id", "district_id", "state_id"] as const
    const orderedColumns = preferredOrder
      .map((key) => columns.find((column) => column.key === key) ?? null)
      .filter((column): column is CommonModuleMetadata["columns"][number] => Boolean(column))

    return orderedColumns.slice(0, 4)
  }

  const primaryColumn = getCommonModulePrimaryColumn(columns)

  if (!primaryColumn) {
    return []
  }

  const remainingColumns = columns.filter((column) => column.key !== primaryColumn.key)
  const nonCodeColumns = remainingColumns.filter((column) => column.key !== "code")
  const codeColumns = remainingColumns.filter((column) => column.key === "code")

  return [primaryColumn, ...nonCodeColumns, ...codeColumns].slice(0, 4)
}

function getCommonModuleListHeader(
  column: CommonModuleMetadata["columns"][number],
  singularLabel: string
) {
  if (column.key === "name" && column.label === "Name") {
    return `${singularLabel} Name`
  }

  return column.label
}

function normalizeCommonModuleFormValue(value: unknown) {
  if (typeof value === "boolean") {
    return value
  }

  if (value === null || value === undefined) {
    return ""
  }

  return String(value)
}

function toCommonModuleFormState(
  metadata: CommonModuleMetadata,
  item?: CommonModuleItem | null
): CommonModuleFormState {
  const formState: CommonModuleFormState = {
    isActive: item?.isActive ?? true,
  }

  for (const column of metadata.columns) {
    formState[column.key] = normalizeCommonModuleFormValue(item?.[column.key])
  }

  return formState
}

function formatCommonModuleCellValue(
  item: CommonModuleItem,
  column: CommonModuleMetadata["columns"][number],
  references: CommonModuleReferenceMap
) {
  const value = item[column.key]

  if (column.referenceModule) {
    const referenceItem =
      references[column.referenceModule]?.find((entry) => entry.id === value) ?? null
    return referenceItem ? getCommonModuleOptionLabel(referenceItem) : "-"
  }

  if (column.type === "boolean") {
    return (
      <Badge variant={value ? "secondary" : "outline"}>
        {value ? "Yes" : "No"}
      </Badge>
    )
  }

  if (typeof value === "number") {
    return Number.isInteger(value) ? value.toString() : value.toFixed(2)
  }

  if (typeof value === "string" && value.trim().length > 0) {
    return value
  }

  return <span className="text-muted-foreground">-</span>
}

function useJsonResource<T>(path: string | null): ResourceState<T> {
  const [state, setState] = useState<ResourceState<T>>({
    data: null,
    error: null,
    isLoading: true,
  })
  useGlobalLoading(state.isLoading)

  useEffect(() => {
    if (!path) {
      setState({ data: null, error: null, isLoading: false })
      return
    }

    const resourcePath = path
    let cancelled = false

    async function load() {
      setState({ data: null, error: null, isLoading: true })

      try {
        const data = await requestJson<T>(resourcePath)
        if (!cancelled) {
          setState({ data, error: null, isLoading: false })
        }
      } catch (error) {
        if (!cancelled) {
          setState({
            data: null,
            error: error instanceof Error ? error.message : "Failed to load section data.",
            isLoading: false,
          })
        }
      }
    }

    void load()

    return () => {
      cancelled = true
    }
  }, [path])

  return state
}

function SectionShell({
  title,
  description,
  children,
}: {
  title: string
  description: string
  children: React.ReactNode
}) {
  return (
    <div className="space-y-4">
      <Card>
        <CardHeader>
          <CardTitle>{title}</CardTitle>
          <CardDescription>{description}</CardDescription>
        </CardHeader>
      </Card>
      {children}
    </div>
  )
}

function StateCard({
  message,
}: {
  message: string
}) {
  return (
    <Card>
      <CardContent className="p-5 text-sm text-muted-foreground">
        {message}
      </CardContent>
    </Card>
  )
}

function MetricCard({
  label,
  value,
  hint,
}: {
  label: string
  value: string | number
  hint: string
}) {
  return (
    <Card>
      <CardContent className="space-y-2 p-5">
        <p className="text-xs font-semibold uppercase tracking-[0.18em] text-muted-foreground">
          {label}
        </p>
        <p className="text-2xl font-semibold text-foreground">{value}</p>
        <p className="text-sm leading-6 text-muted-foreground">{hint}</p>
      </CardContent>
    </Card>
  )
}

function LoadingStateCard({
  message = "Loading records...",
}: {
  message?: string
}) {
  return (
    <Card>
      <CardContent className="space-y-4 p-5">
        <div className="h-5 w-40 animate-pulse rounded-md bg-muted" />
        <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
          {Array.from({ length: 6 }).map((_, index) => (
            <div
              key={index}
              className="space-y-3 rounded-2xl border border-border/60 bg-card/60 p-4"
            >
              <div className="h-4 w-24 animate-pulse rounded bg-muted" />
              <div className="h-3 w-full animate-pulse rounded bg-muted/80" />
              <div className="h-3 w-3/4 animate-pulse rounded bg-muted/80" />
            </div>
          ))}
        </div>
        <p className="text-sm text-muted-foreground">{message}</p>
      </CardContent>
    </Card>
  )
}

function ActiveSwitchField({
  checked,
  id,
  onCheckedChange,
}: {
  checked: boolean
  id: string
  onCheckedChange: (checked: boolean) => void
}) {
  return (
    <div className="space-y-2">
      <label className="cursor-pointer text-sm font-medium text-foreground" htmlFor={id}>
        Status
      </label>
      <label
        className={cn(
          "flex cursor-pointer items-center justify-between rounded-xl px-3 py-2",
          getActivityStatusPanelClassName(checked ? "active" : "inactive")
        )}
        htmlFor={id}
      >
        <div className="space-y-0.5">
          <p className="text-sm font-medium text-foreground">
            {checked ? "Active" : "Inactive"}
          </p>
          <p className="text-xs text-muted-foreground">
            {checked
              ? "This record is available in the workspace."
              : "This record is hidden as inactive."}
          </p>
        </div>
        <Switch id={id} checked={checked} onCheckedChange={onCheckedChange} />
      </label>
    </div>
  )
}

function OverviewSection() {
  const [state, setState] = useState<{
    bootstrap: BootstrapSnapshot | null
    companies: CompanyListResponse | null
    contacts: ContactListResponse | null
    modules: CommonModuleSummaryListResponse | null
    error: string | null
    isLoading: boolean
  }>({
    bootstrap: null,
    companies: null,
    contacts: null,
    modules: null,
    error: null,
    isLoading: true,
  })
  useGlobalLoading(state.isLoading)

  useEffect(() => {
    let cancelled = false

    async function load() {
      setState((current) => ({ ...current, error: null, isLoading: true }))

      try {
        const [bootstrap, companies, contacts, modules] = await Promise.all([
          requestJson<BootstrapSnapshot>("/internal/v1/core/bootstrap"),
          requestJson<CompanyListResponse>("/internal/v1/core/companies"),
          requestJson<ContactListResponse>("/internal/v1/core/contacts"),
          requestJson<CommonModuleSummaryListResponse>(
            "/internal/v1/core/common-modules/summary"
          ),
        ])

        if (!cancelled) {
          setState({
            bootstrap,
            companies,
            contacts,
            modules,
            error: null,
            isLoading: false,
          })
        }
      } catch (error) {
        if (!cancelled) {
          setState({
            bootstrap: null,
            companies: null,
            contacts: null,
            modules: null,
            error:
              error instanceof Error
                ? error.message
                : "Failed to load the core workspace overview.",
            isLoading: false,
          })
        }
      }
    }

    void load()

    return () => {
      cancelled = true
    }
  }, [])

  if (state.isLoading) {
    return <LoadingStateCard message="Loading core overview..." />
  }

  if (state.error || !state.bootstrap || !state.companies || !state.contacts || !state.modules) {
    return <StateCard message={state.error ?? "Core overview data is unavailable."} />
  }

  const activeModules = state.bootstrap.modules.filter(
    (module) => module.readiness === "foundation" || module.readiness === "active"
  ).length

  return (
    <SectionShell
      title="Core Overview"
      description="Shared master data, organizations, contacts, and operational reference setup for the core system."
    >
      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <MetricCard
          label="Companies"
          value={state.companies.items.length}
          hint="Registered organizations maintained in the shared core master."
        />
        <MetricCard
          label="Contacts"
          value={state.contacts.items.length}
          hint="Reusable parties and business contacts available across modules."
        />
        <MetricCard
          label="Common Masters"
          value={state.modules.items.length}
          hint="Reference masters for address book, products, order flow, and other shared setup."
        />
        <MetricCard
          label="Ready Modules"
          value={activeModules}
          hint="Core modules currently active or foundation-ready in the running system."
        />
      </div>

      <div className="grid gap-4 xl:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Core Scope</CardTitle>
            <CardDescription>What this core application currently owns in the software.</CardDescription>
          </CardHeader>
          <CardContent className="grid gap-3">
            {[
              "Company masters and legal identity records.",
              "Contact masters with communication, address book, and finance details.",
              "Shared common modules like location, contact types, address types, and product references.",
              "Core bootstrap and shared setup records consumed by other applications.",
            ].map((item) => (
              <div key={item} className="rounded-xl border border-border/70 bg-card/70 p-4 text-sm leading-6 text-muted-foreground">
                {item}
              </div>
            ))}
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle>Current Focus</CardTitle>
            <CardDescription>Operational readiness areas currently represented in core.</CardDescription>
          </CardHeader>
          <CardContent className="grid gap-3">
            {[
              "Keep shared masters clean and reusable across business modules.",
              "Maintain structured address-book data for organizations and parties.",
              "Support controlled setup for contact identity, taxation, and communication.",
              "Provide stable reference data before downstream billing, ecommerce, and workflow actions.",
            ].map((item) => (
              <div key={item} className="rounded-xl border border-border/70 bg-card/70 p-4 text-sm leading-6 text-muted-foreground">
                {item}
              </div>
            ))}
          </CardContent>
        </Card>
      </div>
    </SectionShell>
  )
}

function CompaniesSection() {
  const navigate = useNavigate()
  const [searchValue, setSearchValue] = useState("")
  const [statusFilter, setStatusFilter] = useState<StatusFilterValue>("all")
  const [currentPage, setCurrentPage] = useState(1)
  const [pageSize, setPageSize] = useState(50)
  const [deleteTargetCompany, setDeleteTargetCompany] = useState<CompanyListResponse["items"][number] | null>(null)
  const [listError, setListError] = useState<string | null>(null)
  const [refreshKey, setRefreshKey] = useState(0)
  const [isDeleting, setIsDeleting] = useState(false)
  const [mutatingCompanyId, setMutatingCompanyId] = useState<string | null>(null)
  const { data, error, isLoading } =
    useJsonResource<CompanyListResponse>(`/internal/v1/core/companies?refresh=${refreshKey}`)

  async function handleCompanyStatusChange(companyId: string, isActive: boolean) {
    setListError(null)
    setMutatingCompanyId(companyId)

    try {
      const detail = await requestJson<CompanyResponse>(
        `/internal/v1/core/company?id=${encodeURIComponent(companyId)}`
      )

      await requestJson<CompanyResponse>(
        `/internal/v1/core/company?id=${encodeURIComponent(companyId)}`,
        {
          method: "PATCH",
          body: JSON.stringify({
            ...toCompanyFormValues(detail.item),
            isActive,
          }),
        }
      )

      setRefreshKey((current) => current + 1)
    } catch (statusError) {
      setListError(
        statusError instanceof Error ? statusError.message : "Failed to update company status."
      )
    } finally {
      setMutatingCompanyId(null)
    }
  }

  async function handleCompanyDelete(companyId: string) {
    setListError(null)
    setIsDeleting(true)

    try {
      await requestJson<{ deleted: true; id: string }>(
        `/internal/v1/core/company?id=${encodeURIComponent(companyId)}`,
        {
          method: "DELETE",
        }
      )
      setDeleteTargetCompany(null)
      setRefreshKey((current) => current + 1)
    } catch (deleteError) {
      setListError(
        deleteError instanceof Error ? deleteError.message : "Failed to delete company."
      )
    } finally {
      setIsDeleting(false)
    }
  }

  if (isLoading) {
    return <LoadingStateCard message="Loading companies..." />
  }

  if (error || !data) {
    return <StateCard message={error ?? "Company data is unavailable."} />
  }

  const normalizedSearch = searchValue.trim().toLowerCase()
  const filteredCompanies = data.items.filter((company) => {
    const matchesSearch = [
      company.name,
      company.legalName ?? "",
      company.primaryEmail ?? "",
      company.primaryPhone ?? "",
      company.registrationNumber ?? "",
      company.description ?? "",
    ].some((value) => value.toLowerCase().includes(normalizedSearch))

    return matchesSearch && matchesStatusFilter(statusFilter, company.isActive)
  })
  const totalRecords = filteredCompanies.length
  const totalPages = Math.max(1, Math.ceil(totalRecords / pageSize))
  const safeCurrentPage = Math.min(currentPage, totalPages)
  const paginatedCompanies = filteredCompanies.slice(
    (safeCurrentPage - 1) * pageSize,
    safeCurrentPage * pageSize
  )

  return (
    <>
      {listError ? (
        <div className="mb-4 rounded-2xl border border-destructive/20 bg-destructive/5 px-4 py-3 text-sm text-destructive">
          {listError}
        </div>
      ) : null}
      <MasterList
      header={{
        pageTitle: "Companies",
        pageDescription:
          "Create and manage shared organization records, registration details, and primary communication channels used across the suite.",
        addLabel: "New Company",
        onAddClick: () => {
          void navigate("/dashboard/apps/core/companies/new")
        },
      }}
      search={{
        value: searchValue,
        onChange: (value) => {
          setSearchValue(value)
          setCurrentPage(1)
        },
        placeholder: "Search companies",
      }}
      filters={buildStatusFilters(statusFilter, (value) => {
        setStatusFilter(value)
        setCurrentPage(1)
      })}
      table={{
        columns: [
          {
            id: "name",
            header: "Company",
            sortable: true,
            accessor: (company) => company.name,
            cell: (company) => (
              <button
                type="button"
                className="text-left"
                onClick={() => {
                  void navigate(`/dashboard/apps/core/companies/${encodeURIComponent(company.id)}`)
                }}
              >
                <p className="font-medium text-foreground hover:underline hover:underline-offset-2">
                  {company.name}
                </p>
                <p className="text-xs text-muted-foreground">
                  {company.legalName ?? "No legal name"}
                </p>
              </button>
            ),
          },
          {
            id: "contact",
            header: "Primary Contact",
            sortable: true,
            accessor: (company) => `${company.primaryEmail ?? ""} ${company.primaryPhone ?? ""}`,
            cell: (company) => (
              <div className="space-y-1 text-sm text-muted-foreground">
                <p>{company.primaryEmail ?? "No email"}</p>
                <p>{company.primaryPhone ?? "No phone"}</p>
              </div>
            ),
          },
          {
            id: "registration",
            header: "Registration",
            sortable: true,
            accessor: (company) => company.registrationNumber ?? "",
            cell: (company) => company.registrationNumber ?? "Not set",
          },
          {
            id: "status",
            header: "Status",
            sortable: true,
            accessor: (company) => (company.isActive ? "active" : "inactive"),
            cell: (company) => <ActivityStatusBadge active={company.isActive} />,
          },
          {
            id: "actions",
            header: "Actions",
            cell: (company) => (
              <RecordActionMenu
                active={company.isActive}
                itemLabel={company.name}
                disabled={mutatingCompanyId === company.id}
                onDelete={() => {
                  setListError(null)
                  setDeleteTargetCompany(company)
                }}
                onEdit={() => {
                  void navigate(`/dashboard/apps/core/companies/${encodeURIComponent(company.id)}/edit`)
                }}
                onToggleActive={() => {
                  void handleCompanyStatusChange(company.id, !company.isActive)
                }}
              />
            ),
            className: "w-20 min-w-20 text-right",
            headerClassName: "w-20 min-w-20 text-right",
          },
        ],
        data: paginatedCompanies,
        emptyMessage: "No companies found.",
        rowKey: (company) => company.id,
      }}
      footer={{
        content: (
          <div className="flex flex-wrap items-center gap-4">
            <span>
              Total companies: <span className="font-medium text-foreground">{totalRecords}</span>
            </span>
            <span>
              Active companies:{" "}
              <span className="font-medium text-foreground">
                {filteredCompanies.filter((item) => item.isActive).length}
              </span>
            </span>
          </div>
        ),
      }}
      pagination={{
        currentPage: safeCurrentPage,
        pageSize,
        totalRecords,
        onPageChange: setCurrentPage,
        onPageSizeChange: (nextPageSize) => {
          setPageSize(nextPageSize)
          setCurrentPage(1)
        },
        pageSizeOptions: [10, 20, 50, 100, 200, 500],
      }}
      />
      <AlertDialog
        open={Boolean(deleteTargetCompany)}
        onOpenChange={(open) => {
          if (!open && !isDeleting) {
            setDeleteTargetCompany(null)
          }
        }}
      >
        <AlertDialogContent size="default">
          <AlertDialogHeader>
            <AlertDialogTitle className="text-destructive">Delete Company</AlertDialogTitle>
            <AlertDialogDescription>
              <span>
                This will permanently delete{" "}
                <span className="font-semibold text-foreground">
                  {deleteTargetCompany?.name ?? "company"}
                </span>
                .
              </span>
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter className="border-destructive/15 bg-destructive/5">
            <AlertDialogCancel disabled={isDeleting}>Cancel</AlertDialogCancel>
            <AlertDialogAction
              className="bg-destructive text-white hover:bg-destructive/90 focus-visible:ring-destructive/20"
              disabled={isDeleting || !deleteTargetCompany}
              onClick={() => {
                if (deleteTargetCompany) {
                  void handleCompanyDelete(deleteTargetCompany.id)
                }
              }}
            >
              {isDeleting ? "Deleting..." : "Delete"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  )
}

function CompanyUpsertSection({ companyId }: { companyId?: string }) {
  return <CompanyUpsertFeatureSection companyId={companyId} />
}

function DetailField({
  label,
  value,
}: {
  label: string
  value: string
}) {
  return (
    <div className="space-y-1">
      <p className="text-xs font-semibold uppercase tracking-[0.16em] text-muted-foreground">
        {label}
      </p>
      <p className="text-sm text-foreground">{value.trim().length > 0 ? value : "-"}</p>
    </div>
  )
}

function formatNumberDetail(value: number) {
  return value.toLocaleString("en-IN")
}

function formatNullableDetail(value: string | null | undefined) {
  return value ?? ""
}

function RecordShowActions({
  deleteLabel,
  description,
  isDeleting,
  onDelete,
}: {
  deleteLabel: string
  description: React.ReactNode
  isDeleting: boolean
  onDelete: () => void
}) {
  return (
    <AlertDialog>
      <AlertDialogTrigger>
        <Button type="button" className="gap-2 bg-destructive text-white hover:bg-destructive/90">
          <Trash2Icon className="size-4" />
          Delete
        </Button>
      </AlertDialogTrigger>
      <AlertDialogContent size="default">
        <AlertDialogHeader>
          <AlertDialogTitle className="text-destructive">{deleteLabel}</AlertDialogTitle>
          <AlertDialogDescription>{description}</AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter className="border-destructive/15 bg-destructive/5">
          <AlertDialogCancel disabled={isDeleting}>Cancel</AlertDialogCancel>
          <AlertDialogAction
            className="bg-destructive text-white hover:bg-destructive/90 focus-visible:ring-destructive/20"
            disabled={isDeleting}
            onClick={onDelete}
          >
            {isDeleting ? "Deleting..." : "Delete"}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  )
}

function CompanyShowSection({ companyId }: { companyId: string }) {
  const navigate = useNavigate()
  const companyResource = useJsonResource<CompanyResponse>(
    `/internal/v1/core/company?id=${encodeURIComponent(companyId)}`
  )
  const [isDeleting, setIsDeleting] = useState(false)
  const [deleteError, setDeleteError] = useState<string | null>(null)

  if (companyResource.isLoading) {
    return <LoadingStateCard message="Loading company details..." />
  }

  if (companyResource.error || !companyResource.data) {
    return <StateCard message={companyResource.error ?? "Company data is unavailable."} />
  }

  const company = companyResource.data.item

  async function handleDelete() {
    setDeleteError(null)
    setIsDeleting(true)

    try {
      await requestJson<{ deleted: true; id: string }>(
        `/internal/v1/core/company?id=${encodeURIComponent(company.id)}`,
        {
          method: "DELETE",
        }
      )

      void navigate("/dashboard/apps/core/companies")
    } catch (error) {
      setDeleteError(error instanceof Error ? error.message : "Failed to delete company.")
    } finally {
      setIsDeleting(false)
    }
  }

  return (
    <SectionShell
      title={company.name}
      description="Company master details used across the shared core workspace."
    >
      <div className="flex flex-wrap items-center justify-between gap-3">
        <Button
          type="button"
          variant="outline"
          className="gap-2"
          onClick={() => {
            void navigate("/dashboard/apps/core/companies")
          }}
        >
          <ArrowLeftIcon className="size-4" />
          Back
        </Button>
        <div className="flex flex-wrap items-center gap-2">
          <Button
            type="button"
            variant="outline"
            className="gap-2"
            onClick={() => {
              void navigate(`/dashboard/apps/core/companies/${encodeURIComponent(company.id)}/edit`)
            }}
          >
            <PencilLineIcon className="size-4" />
            Edit
          </Button>
          <RecordShowActions
            deleteLabel="Delete Company"
            description={
              <>
                This will permanently delete{" "}
                <span className="font-semibold text-foreground">{company.name}</span>.
              </>
            }
            isDeleting={isDeleting}
            onDelete={() => {
              void handleDelete()
            }}
          />
        </div>
      </div>
      {deleteError ? (
        <div className="rounded-2xl border border-destructive/20 bg-destructive/5 px-4 py-3 text-sm text-destructive">
          {deleteError}
        </div>
      ) : null}
      <Card>
        <CardHeader>
          <CardTitle>Details</CardTitle>
          <CardDescription>Primary company identity, registration, and brand details.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-5 p-5">
          <div className="grid gap-6 md:grid-cols-2 xl:grid-cols-4">
            <DetailField label="Company Name" value={company.name} />
            <DetailField label="Legal Name" value={formatNullableDetail(company.legalName)} />
            <DetailField label="Tagline" value={formatNullableDetail(company.tagline)} />
            <DetailField label="Primary Company" value={company.isPrimary ? "Yes" : "No"} />
            <DetailField label="Registration Number" value={formatNullableDetail(company.registrationNumber)} />
            <DetailField label="PAN" value={formatNullableDetail(company.pan)} />
            <DetailField label="Financial Year Start" value={formatNullableDetail(company.financialYearStart)} />
            <DetailField label="Books Start" value={formatNullableDetail(company.booksStart)} />
            <DetailField label="Website" value={formatNullableDetail(company.website)} />
            <DetailField label="Status" value={company.isActive ? "Active" : "Inactive"} />
            <DetailField label="Created At" value={company.createdAt} />
            <DetailField label="Updated At" value={company.updatedAt} />
            <DetailField label="Description" value={formatNullableDetail(company.description)} />
          </div>
          <div className="space-y-3">
            <p className="text-xs font-semibold uppercase tracking-[0.16em] text-muted-foreground">
              Logos
            </p>
            {company.logos.length > 0 ? (
              <div className="grid gap-3">
                {company.logos.map((logo) => (
                  <div key={logo.id} className="rounded-2xl border border-border/70 bg-card/60 p-4">
                    <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
                      <DetailField label="Logo Url" value={logo.logoUrl} />
                      <DetailField label="Logo Type" value={logo.logoType} />
                      <DetailField label="Status" value={logo.isActive ? "Active" : "Inactive"} />
                      <DetailField label="Updated At" value={logo.updatedAt} />
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-sm text-muted-foreground">-</p>
            )}
          </div>
        </CardContent>
      </Card>
      <Card>
        <CardHeader>
          <CardTitle>Content</CardTitle>
          <CardDescription>Brand copy used across shell, billing, and public website surfaces.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-5 p-5">
          <div className="grid gap-6 xl:grid-cols-2">
            <DetailField label="Short About" value={formatNullableDetail(company.shortAbout)} />
            <DetailField label="Long About" value={formatNullableDetail(company.longAbout)} />
          </div>
        </CardContent>
      </Card>
      <Card>
        <CardHeader>
          <CardTitle>Communication</CardTitle>
          <CardDescription>Email, phone, and social channel data for the company.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-5 p-5">
          <div className="grid gap-6 md:grid-cols-2 xl:grid-cols-4">
            <DetailField label="Primary Email" value={formatNullableDetail(company.primaryEmail)} />
            <DetailField label="Primary Phone" value={formatNullableDetail(company.primaryPhone)} />
            <DetailField label="Facebook Url" value={formatNullableDetail(company.facebookUrl)} />
            <DetailField label="Twitter Url" value={formatNullableDetail(company.twitterUrl)} />
            <DetailField label="Instagram Url" value={formatNullableDetail(company.instagramUrl)} />
            <DetailField label="Youtube Url" value={formatNullableDetail(company.youtubeUrl)} />
          </div>
          <div className="space-y-3">
            <p className="text-xs font-semibold uppercase tracking-[0.16em] text-muted-foreground">
              Emails
            </p>
            {company.emails.length > 0 ? (
              <div className="grid gap-3">
                {company.emails.map((email) => (
                  <div key={email.id} className="rounded-2xl border border-border/70 bg-card/60 p-4">
                    <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
                      <DetailField label="Email" value={email.email} />
                      <DetailField label="Email Type" value={email.emailType} />
                      <DetailField label="Status" value={email.isActive ? "Active" : "Inactive"} />
                      <DetailField label="Updated At" value={email.updatedAt} />
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-sm text-muted-foreground">-</p>
            )}
          </div>
          <div className="space-y-3">
            <p className="text-xs font-semibold uppercase tracking-[0.16em] text-muted-foreground">
              Phones
            </p>
            {company.phones.length > 0 ? (
              <div className="grid gap-3">
                {company.phones.map((phone) => (
                  <div key={phone.id} className="rounded-2xl border border-border/70 bg-card/60 p-4">
                    <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
                      <DetailField label="Phone Number" value={phone.phoneNumber} />
                      <DetailField label="Phone Type" value={phone.phoneType} />
                      <DetailField label="Primary" value={phone.isPrimary ? "Yes" : "No"} />
                      <DetailField label="Status" value={phone.isActive ? "Active" : "Inactive"} />
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-sm text-muted-foreground">-</p>
            )}
          </div>
        </CardContent>
      </Card>
      <Card>
        <CardHeader>
          <CardTitle>Address</CardTitle>
          <CardDescription>Stored company address records.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-3 p-5">
          {company.addresses.length > 0 ? (
            <div className="grid gap-3">
              {company.addresses.map((address) => (
                <div key={address.id} className="rounded-2xl border border-border/70 bg-card/60 p-4">
                  <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
                    <DetailField label="Address Type Id" value={formatNullableDetail(address.addressTypeId)} />
                    <DetailField label="Address Line 1" value={address.addressLine1} />
                    <DetailField label="Address Line 2" value={formatNullableDetail(address.addressLine2)} />
                    <DetailField label="City Id" value={formatNullableDetail(address.cityId)} />
                    <DetailField label="District Id" value={formatNullableDetail(address.districtId)} />
                    <DetailField label="State Id" value={formatNullableDetail(address.stateId)} />
                    <DetailField label="Country Id" value={formatNullableDetail(address.countryId)} />
                    <DetailField label="Pincode Id" value={formatNullableDetail(address.pincodeId)} />
                    <DetailField label="Latitude" value={address.latitude == null ? "" : String(address.latitude)} />
                    <DetailField label="Longitude" value={address.longitude == null ? "" : String(address.longitude)} />
                    <DetailField label="Default" value={address.isDefault ? "Yes" : "No"} />
                    <DetailField label="Status" value={address.isActive ? "Active" : "Inactive"} />
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-sm text-muted-foreground">-</p>
          )}
        </CardContent>
      </Card>
      <Card>
        <CardHeader>
          <CardTitle>Finance</CardTitle>
          <CardDescription>Company bank account information.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-3 p-5">
          {company.bankAccounts.length > 0 ? (
            <div className="grid gap-3">
              {company.bankAccounts.map((account) => (
                <div key={account.id} className="rounded-2xl border border-border/70 bg-card/60 p-4">
                  <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
                    <DetailField label="Bank Name" value={account.bankName} />
                    <DetailField label="Account Number" value={account.accountNumber} />
                    <DetailField label="Account Holder Name" value={account.accountHolderName} />
                    <DetailField label="IFSC" value={account.ifsc} />
                    <DetailField label="Branch" value={formatNullableDetail(account.branch)} />
                    <DetailField label="Primary" value={account.isPrimary ? "Yes" : "No"} />
                    <DetailField label="Status" value={account.isActive ? "Active" : "Inactive"} />
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-sm text-muted-foreground">-</p>
          )}
        </CardContent>
      </Card>
    </SectionShell>
  )
}

function ContactShowSection({ contactId }: { contactId: string }) {
  const navigate = useNavigate()
  const contactResource = useJsonResource<ContactResponse>(
    `/internal/v1/core/contact?id=${encodeURIComponent(contactId)}`
  )
  const [isDeleting, setIsDeleting] = useState(false)
  const [deleteError, setDeleteError] = useState<string | null>(null)

  if (contactResource.isLoading) {
    return <LoadingStateCard message="Loading contact details..." />
  }

  if (contactResource.error || !contactResource.data) {
    return <StateCard message={contactResource.error ?? "Contact data is unavailable."} />
  }

  const contact = contactResource.data.item

  async function handleDelete() {
    setDeleteError(null)
    setIsDeleting(true)

    try {
      await requestJson<{ deleted: true; id: string }>(
        `/internal/v1/core/contact?id=${encodeURIComponent(contact.id)}`,
        {
          method: "DELETE",
        }
      )

      void navigate("/dashboard/apps/core/contacts")
    } catch (error) {
      setDeleteError(error instanceof Error ? error.message : "Failed to delete contact.")
    } finally {
      setIsDeleting(false)
    }
  }

  return (
    <SectionShell
      title={contact.name}
      description="Contact master details shared across the operational workspace."
    >
      <div className="flex flex-wrap items-center justify-between gap-3">
        <Button
          type="button"
          variant="outline"
          className="gap-2"
          onClick={() => {
            void navigate("/dashboard/apps/core/contacts")
          }}
        >
          <ArrowLeftIcon className="size-4" />
          Back
        </Button>
        <div className="flex flex-wrap items-center gap-2">
          <Button
            type="button"
            variant="outline"
            className="gap-2"
            onClick={() => {
              void navigate(`/dashboard/apps/core/contacts/${encodeURIComponent(contact.id)}/edit`)
            }}
          >
            <PencilLineIcon className="size-4" />
            Edit
          </Button>
          <RecordShowActions
            deleteLabel="Delete Contact"
            description={
              <>
                This will permanently delete{" "}
                <span className="font-semibold text-foreground">{contact.name}</span>.
              </>
            }
            isDeleting={isDeleting}
            onDelete={() => {
              void handleDelete()
            }}
          />
        </div>
      </div>
      {deleteError ? (
        <div className="rounded-2xl border border-destructive/20 bg-destructive/5 px-4 py-3 text-sm text-destructive">
          {deleteError}
        </div>
      ) : null}
      <Card>
        <CardHeader>
          <CardTitle>Details</CardTitle>
          <CardDescription>Primary identity and master-level contact details.</CardDescription>
        </CardHeader>
        <CardContent className="grid gap-6 p-5 md:grid-cols-2 xl:grid-cols-4">
          <DetailField label="Contact Name" value={contact.name} />
          <DetailField label="Legal Name" value={formatNullableDetail(contact.legalName)} />
          <DetailField label="Contact Type Id" value={formatNullableDetail(contact.contactTypeId)} />
          <DetailField label="Ledger Id" value={formatNullableDetail(contact.ledgerId)} />
          <DetailField label="Ledger Name" value={formatNullableDetail(contact.ledgerName)} />
          <DetailField label="PAN" value={formatNullableDetail(contact.pan)} />
          <DetailField label="GSTIN" value={formatNullableDetail(contact.gstin)} />
          <DetailField label="MSME Type" value={formatNullableDetail(contact.msmeType)} />
          <DetailField label="MSME Number" value={formatNullableDetail(contact.msmeNo)} />
          <DetailField label="Website" value={formatNullableDetail(contact.website)} />
          <DetailField label="Status" value={contact.isActive ? "Active" : "Inactive"} />
          <DetailField label="Created At" value={contact.createdAt} />
          <DetailField label="Updated At" value={contact.updatedAt} />
        </CardContent>
      </Card>
      <Card>
        <CardHeader>
          <CardTitle>Communication</CardTitle>
          <CardDescription>Email and phone records stored for this contact.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-5 p-5">
          <div className="grid gap-6 md:grid-cols-2 xl:grid-cols-4">
            <DetailField label="Primary Email" value={formatNullableDetail(contact.primaryEmail)} />
            <DetailField label="Primary Phone" value={formatNullableDetail(contact.primaryPhone)} />
            <DetailField label="Description" value={formatNullableDetail(contact.description)} />
          </div>
          <div className="space-y-3">
            <p className="text-xs font-semibold uppercase tracking-[0.16em] text-muted-foreground">
              Emails
            </p>
            {contact.emails.length > 0 ? (
              <div className="grid gap-3">
                {contact.emails.map((email) => (
                  <div key={email.id} className="rounded-2xl border border-border/70 bg-card/60 p-4">
                    <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
                      <DetailField label="Email" value={email.email} />
                      <DetailField label="Email Type" value={email.emailType} />
                      <DetailField label="Primary" value={email.isPrimary ? "Yes" : "No"} />
                      <DetailField label="Status" value={email.isActive ? "Active" : "Inactive"} />
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-sm text-muted-foreground">-</p>
            )}
          </div>
          <div className="space-y-3">
            <p className="text-xs font-semibold uppercase tracking-[0.16em] text-muted-foreground">
              Phones
            </p>
            {contact.phones.length > 0 ? (
              <div className="grid gap-3">
                {contact.phones.map((phone) => (
                  <div key={phone.id} className="rounded-2xl border border-border/70 bg-card/60 p-4">
                    <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
                      <DetailField label="Phone Number" value={phone.phoneNumber} />
                      <DetailField label="Phone Type" value={phone.phoneType} />
                      <DetailField label="Primary" value={phone.isPrimary ? "Yes" : "No"} />
                      <DetailField label="Status" value={phone.isActive ? "Active" : "Inactive"} />
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-sm text-muted-foreground">-</p>
            )}
          </div>
        </CardContent>
      </Card>
      <Card>
        <CardHeader>
          <CardTitle>Address</CardTitle>
          <CardDescription>Stored address records for billing, shipping, and other uses.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-3 p-5">
          {contact.addresses.length > 0 ? (
            <div className="grid gap-3">
              {contact.addresses.map((address) => (
                <div key={address.id} className="rounded-2xl border border-border/70 bg-card/60 p-4">
                  <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
                    <DetailField label="Address Type Id" value={formatNullableDetail(address.addressTypeId)} />
                    <DetailField label="Address Line 1" value={address.addressLine1} />
                    <DetailField label="Address Line 2" value={formatNullableDetail(address.addressLine2)} />
                    <DetailField label="City Id" value={formatNullableDetail(address.cityId)} />
                    <DetailField label="District Id" value={formatNullableDetail(address.districtId)} />
                    <DetailField label="State Id" value={formatNullableDetail(address.stateId)} />
                    <DetailField label="Country Id" value={formatNullableDetail(address.countryId)} />
                    <DetailField label="Pincode Id" value={formatNullableDetail(address.pincodeId)} />
                    <DetailField label="Latitude" value={address.latitude == null ? "" : String(address.latitude)} />
                    <DetailField label="Longitude" value={address.longitude == null ? "" : String(address.longitude)} />
                    <DetailField label="Default" value={address.isDefault ? "Yes" : "No"} />
                    <DetailField label="Status" value={address.isActive ? "Active" : "Inactive"} />
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-sm text-muted-foreground">-</p>
          )}
        </CardContent>
      </Card>
      <Card>
        <CardHeader>
          <CardTitle>Finance</CardTitle>
          <CardDescription>Balance settings, bank accounts, and GST registrations.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-5 p-5">
          <div className="grid gap-6 md:grid-cols-2 xl:grid-cols-4">
            <DetailField label="Opening Balance" value={formatNumberDetail(contact.openingBalance)} />
            <DetailField label="Balance Type" value={formatNullableDetail(contact.balanceType)} />
            <DetailField label="Credit Limit" value={formatNumberDetail(contact.creditLimit)} />
          </div>
          <div className="space-y-3">
            <p className="text-xs font-semibold uppercase tracking-[0.16em] text-muted-foreground">
              Bank Accounts
            </p>
            {contact.bankAccounts.length > 0 ? (
              <div className="grid gap-3">
                {contact.bankAccounts.map((account) => (
                  <div key={account.id} className="rounded-2xl border border-border/70 bg-card/60 p-4">
                    <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
                      <DetailField label="Bank Name" value={account.bankName} />
                      <DetailField label="Account Number" value={account.accountNumber} />
                      <DetailField label="Account Holder Name" value={account.accountHolderName} />
                      <DetailField label="IFSC" value={account.ifsc} />
                      <DetailField label="Branch" value={formatNullableDetail(account.branch)} />
                      <DetailField label="Primary" value={account.isPrimary ? "Yes" : "No"} />
                      <DetailField label="Status" value={account.isActive ? "Active" : "Inactive"} />
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-sm text-muted-foreground">-</p>
            )}
          </div>
          <div className="space-y-3">
            <p className="text-xs font-semibold uppercase tracking-[0.16em] text-muted-foreground">
              GST Details
            </p>
            {contact.gstDetails.length > 0 ? (
              <div className="grid gap-3">
                {contact.gstDetails.map((detail) => (
                  <div key={detail.id} className="rounded-2xl border border-border/70 bg-card/60 p-4">
                    <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
                      <DetailField label="GSTIN" value={detail.gstin} />
                      <DetailField label="State" value={detail.state} />
                      <DetailField label="Default" value={detail.isDefault ? "Yes" : "No"} />
                      <DetailField label="Status" value={detail.isActive ? "Active" : "Inactive"} />
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-sm text-muted-foreground">-</p>
            )}
          </div>
        </CardContent>
      </Card>
    </SectionShell>
  )
}

function ContactsSection({
  onCreate,
  onEdit,
}: {
  onCreate: () => void
  onEdit: (contactId: string) => void
}) {
  const navigate = useNavigate()
  const [searchValue, setSearchValue] = useState("")
  const [statusFilter, setStatusFilter] = useState<StatusFilterValue>("all")
  const [currentPage, setCurrentPage] = useState(1)
  const [pageSize, setPageSize] = useState(50)
  const [deleteTargetContact, setDeleteTargetContact] = useState<ContactListResponse["items"][number] | null>(null)
  const [listError, setListError] = useState<string | null>(null)
  const [refreshKey, setRefreshKey] = useState(0)
  const [isDeleting, setIsDeleting] = useState(false)
  const [mutatingContactId, setMutatingContactId] = useState<string | null>(null)
  const { data, error, isLoading } =
    useJsonResource<ContactListResponse>(`/internal/v1/core/contacts?refresh=${refreshKey}`)

  async function handleContactStatusChange(contactId: string, isActive: boolean) {
    setListError(null)
    setMutatingContactId(contactId)

    try {
      const detail = await requestJson<ContactResponse>(
        `/internal/v1/core/contact?id=${encodeURIComponent(contactId)}`
      )

      await requestJson<ContactResponse>(
        `/internal/v1/core/contact?id=${encodeURIComponent(contactId)}`,
        {
          method: "PATCH",
          body: JSON.stringify({
            ...toContactFormValues(detail.item),
            isActive,
          }),
        }
      )

      setRefreshKey((current) => current + 1)
    } catch (statusError) {
      setListError(
        statusError instanceof Error ? statusError.message : "Failed to update contact status."
      )
    } finally {
      setMutatingContactId(null)
    }
  }

  async function handleContactDelete(contactId: string) {
    setListError(null)
    setIsDeleting(true)

    try {
      await requestJson<{ deleted: true; id: string }>(
        `/internal/v1/core/contact?id=${encodeURIComponent(contactId)}`,
        {
          method: "DELETE",
        }
      )
      setDeleteTargetContact(null)
      setRefreshKey((current) => current + 1)
    } catch (deleteError) {
      setListError(
        deleteError instanceof Error ? deleteError.message : "Failed to delete contact."
      )
    } finally {
      setIsDeleting(false)
    }
  }

  if (isLoading) {
    return <LoadingStateCard message="Loading contacts..." />
  }

  if (error || !data) {
    return <StateCard message={error ?? "Contact data is unavailable."} />
  }

  const normalizedSearch = searchValue.trim().toLowerCase()
  const filteredContacts = data.items.filter((contact) => {
    const matchesSearch = [
      contact.name,
      contact.ledgerName ?? "",
      contact.primaryEmail ?? "",
      contact.primaryPhone ?? "",
      contact.description ?? "",
    ].some((value) => value.toLowerCase().includes(normalizedSearch))

    return matchesSearch && matchesStatusFilter(statusFilter, contact.isActive)
  })
  const totalRecords = filteredContacts.length
  const totalPages = Math.max(1, Math.ceil(totalRecords / pageSize))
  const safeCurrentPage = Math.min(currentPage, totalPages)
  const paginatedContacts = filteredContacts.slice(
    (safeCurrentPage - 1) * pageSize,
    safeCurrentPage * pageSize
  )

  return (
    <>
      {listError ? (
        <div className="mb-4 rounded-2xl border border-destructive/20 bg-destructive/5 px-4 py-3 text-sm text-destructive">
          {listError}
        </div>
      ) : null}
      <MasterList
      header={{
        pageTitle: "Contacts",
        pageDescription:
          "Create and manage primary contact masters for parties, staff, web contacts, and other people or organizations, with debtor or creditor ledger linkage where accounting is required.",
        addLabel: "New Contact",
        onAddClick: onCreate,
      }}
      search={{
        value: searchValue,
        onChange: (value) => {
          setSearchValue(value)
          setCurrentPage(1)
        },
        placeholder: "Search contacts",
      }}
      filters={buildStatusFilters(statusFilter, (value) => {
        setStatusFilter(value)
        setCurrentPage(1)
      })}
      table={{
        columns: [
          {
            id: "name",
            header: "Contact",
            sortable: true,
            accessor: (contact) => contact.name,
            cell: (contact) => (
              <button
                type="button"
                className="text-left"
                onClick={() => {
                  navigate(`/dashboard/apps/core/contacts/${encodeURIComponent(contact.id)}`)
                }}
              >
                <p className="font-medium text-foreground hover:underline hover:underline-offset-2">
                  {contact.name}
                </p>
                <p className="text-xs text-muted-foreground">
                  {contact.description ?? "No description"}
                </p>
              </button>
            ),
          },
          {
            id: "ledger",
            header: "Ledger",
            sortable: true,
            accessor: (contact) => contact.ledgerName ?? "",
            cell: (contact) => contact.ledgerName ?? "No linked ledger",
          },
          {
            id: "contact",
            header: "Contact",
            sortable: true,
            accessor: (contact) => `${contact.primaryEmail ?? ""} ${contact.primaryPhone ?? ""}`,
            cell: (contact) => (
              <div className="space-y-1 text-sm text-muted-foreground">
                <p>{contact.primaryEmail ?? "No email"}</p>
                <p>{contact.primaryPhone ?? "No phone"}</p>
              </div>
            ),
          },
          {
            id: "creditLimit",
            header: "Credit Limit",
            sortable: true,
            accessor: (contact) => contact.creditLimit,
            cell: (contact) => contact.creditLimit.toLocaleString("en-IN"),
          },
          {
            id: "status",
            header: "Status",
            sortable: true,
            accessor: (contact) => (contact.isActive ? "active" : "inactive"),
            cell: (contact) => <ActivityStatusBadge active={contact.isActive} />,
          },
          {
            id: "actions",
            header: "Actions",
            cell: (contact) => (
              <RecordActionMenu
                active={contact.isActive}
                itemLabel={contact.name}
                disabled={mutatingContactId === contact.id}
                onDelete={() => {
                  setListError(null)
                  setDeleteTargetContact(contact)
                }}
                onEdit={() => onEdit(contact.id)}
                onToggleActive={() => {
                  void handleContactStatusChange(contact.id, !contact.isActive)
                }}
              />
            ),
            className: "w-20 min-w-20 text-right",
            headerClassName: "w-20 min-w-20 text-right",
          },
        ],
        data: paginatedContacts,
        emptyMessage: "No contacts found.",
        rowKey: (contact) => contact.id,
      }}
      footer={{
        content: (
          <div className="flex flex-wrap items-center gap-4">
            <span>
              Total contacts: <span className="font-medium text-foreground">{totalRecords}</span>
            </span>
          </div>
        ),
      }}
      pagination={{
        currentPage: safeCurrentPage,
        pageSize,
        totalRecords,
        onPageChange: setCurrentPage,
        onPageSizeChange: (nextPageSize) => {
          setPageSize(nextPageSize)
          setCurrentPage(1)
        },
        pageSizeOptions: [10, 20, 50, 100, 200, 500],
      }}
      />
      <AlertDialog
        open={Boolean(deleteTargetContact)}
        onOpenChange={(open) => {
          if (!open && !isDeleting) {
            setDeleteTargetContact(null)
          }
        }}
      >
        <AlertDialogContent size="default">
          <AlertDialogHeader>
            <AlertDialogTitle className="text-destructive">Delete Contact</AlertDialogTitle>
            <AlertDialogDescription>
              <span>
                This will permanently delete{" "}
                <span className="font-semibold text-foreground">
                  {deleteTargetContact?.name ?? "contact"}
                </span>
                .
              </span>
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter className="border-destructive/15 bg-destructive/5">
            <AlertDialogCancel disabled={isDeleting}>Cancel</AlertDialogCancel>
            <AlertDialogAction
              className="bg-destructive text-white hover:bg-destructive/90 focus-visible:ring-destructive/20"
              disabled={isDeleting || !deleteTargetContact}
              onClick={() => {
                if (deleteTargetContact) {
                  void handleContactDelete(deleteTargetContact.id)
                }
              }}
            >
              {isDeleting ? "Deleting..." : "Delete"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  )
}

function ContactUpsertSection({ contactId }: { contactId?: string }) {
  return <ContactUpsertFeatureSection contactId={contactId} />
}

function AutocompleteLookupField({
  createActionLabel,
  value,
  onChange,
  onCreateNew,
  options,
  placeholder,
  allowEmptyOption,
  emptyOptionLabel = "Select",
}: {
  createActionLabel?: string
  value: string
  onChange: (value: string) => void
  onCreateNew?: (query: string) => void
  options: LookupOption[]
  placeholder?: string
  allowEmptyOption?: boolean
  emptyOptionLabel?: string
}) {
  return (
    <SearchableLookupField
      value={value}
      onValueChange={onChange}
      options={options}
      placeholder={placeholder ?? "Select option"}
      searchPlaceholder={placeholder ?? "Search option"}
      allowEmptyOption={allowEmptyOption}
      emptyOptionLabel={emptyOptionLabel}
      noResultsMessage="No records found."
      createActionLabel={createActionLabel}
      onCreateNew={onCreateNew}
    />
  )
}

function CommonModulesSection({ moduleKey }: { moduleKey?: CommonModuleKey }) {
  const navigate = useNavigate()
  const metadata = useJsonResource<CommonModuleMetadataListResponse>(
    "/internal/v1/core/common-modules/metadata"
  )
  const summaries = useJsonResource<CommonModuleSummaryListResponse>(
    "/internal/v1/core/common-modules/summary"
  )
  const [refreshKey, setRefreshKey] = useState(0)
  const [searchValue, setSearchValue] = useState("")
  const [statusFilter, setStatusFilter] = useState<StatusFilterValue>("all")
  const [currentPage, setCurrentPage] = useState(1)
  const [pageSize, setPageSize] = useState(10)
  const [referenceState, setReferenceState] = useState<{
    data: CommonModuleReferenceMap
    error: string | null
    isLoading: boolean
  }>({
    data: {},
    error: null,
    isLoading: false,
  })
  const [dialogOpen, setDialogOpen] = useState(false)
  const [activeItem, setActiveItem] = useState<CommonModuleItem | null>(null)
  const [deleteTargetItem, setDeleteTargetItem] = useState<CommonModuleItem | null>(null)
  const [form, setForm] = useState<CommonModuleFormState>({ isActive: true })
  const [formError, setFormError] = useState<string | null>(null)
  const [listError, setListError] = useState<string | null>(null)
  const [isSaving, setIsSaving] = useState(false)
  const [isDeleting, setIsDeleting] = useState(false)
  const items = useJsonResource<{ module: CommonModuleKey; items: CommonModuleItem[] }>(
    moduleKey ? `/internal/v1/core/common-modules/items?module=${moduleKey}&refresh=${refreshKey}` : null
  )
  useGlobalLoading(
    metadata.isLoading || summaries.isLoading || items.isLoading || referenceState.isLoading
  )

  const metadataData = metadata.data
  const summariesData = summaries.data
  const itemsData = items.data
  const activeMetadata =
    moduleKey && metadataData
      ? metadataData.modules.find((module) => module.key === moduleKey) ?? null
      : null
  const selectedMenuItem = moduleKey
    ? coreCommonModuleMenuGroups.flatMap((group) => group.items).find((item) => item.key === moduleKey) ?? null
    : null
  const selectedSummary =
    moduleKey && summariesData
      ? summariesData.items.find((item) => item.key === moduleKey) ?? null
      : null

  useEffect(() => {
    if (!activeMetadata) {
      setReferenceState({ data: {}, error: null, isLoading: false })
      return
    }

    const referenceModules = Array.from(
      new Set(
        activeMetadata.columns
          .map((column) => column.referenceModule)
          .filter((value): value is CommonModuleKey => Boolean(value))
      )
    )

    if (referenceModules.length === 0) {
      setReferenceState({ data: {}, error: null, isLoading: false })
      return
    }

    let cancelled = false

    async function loadReferenceModules() {
      setReferenceState({ data: {}, error: null, isLoading: true })

      try {
        const referenceItems = await Promise.all(
          referenceModules.map(async (referenceModule) => {
            const response = await requestJson<{ module: CommonModuleKey; items: CommonModuleItem[] }>(
              `/internal/v1/core/common-modules/items?module=${referenceModule}`
            )
            return [referenceModule, response.items] as const
          })
        )

        if (!cancelled) {
          setReferenceState({
            data: Object.fromEntries(referenceItems) as CommonModuleReferenceMap,
            error: null,
            isLoading: false,
          })
        }
      } catch (error) {
        if (!cancelled) {
          setReferenceState({
            data: {},
            error: error instanceof Error ? error.message : "Failed to load lookup records.",
            isLoading: false,
          })
        }
      }
    }

    void loadReferenceModules()

    return () => {
      cancelled = true
    }
  }, [activeMetadata])

  useEffect(() => {
    if (!activeMetadata) {
      return
    }

    setForm(toCommonModuleFormState(activeMetadata))
    setActiveItem(null)
    setDialogOpen(false)
    setFormError(null)
    setSearchValue("")
    setStatusFilter("all")
    setCurrentPage(1)
  }, [activeMetadata])

  if (metadata.isLoading || summaries.isLoading) {
    return <LoadingStateCard message="Loading common modules..." />
  }

  if (metadata.error || summaries.error || !metadataData || !summariesData) {
    return (
      <StateCard
        message={metadata.error ?? summaries.error ?? "Common module data is unavailable."}
      />
    )
  }

  if (!moduleKey) {
    return (
      <SectionShell
        title="Common Modules"
        description="Shared master registries kept in core for cross-app dependency management."
      >
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
          {summariesData.items.slice(0, 8).map((item) => (
            <MetricCard
              key={item.key}
              label={item.label}
              value={item.itemCount}
              hint={`${item.activeCount} active records in the shared registry.`}
            />
          ))}
        </div>

        <div className="grid gap-4 xl:grid-cols-2">
          {coreCommonModuleMenuGroups.map((group) => (
            <Card key={group.id}>
              <CardHeader>
                <CardTitle>{group.label}</CardTitle>
                <CardDescription>
                  Shared core masters grouped for the operational sidebar layout.
                </CardDescription>
              </CardHeader>
              <CardContent className="grid gap-3 sm:grid-cols-2">
                {group.items.map((item) => {
                  const summary = summariesData.items.find((entry) => entry.key === item.key)

                  return (
                    <a
                      key={item.id}
                      href={item.route}
                      className="rounded-xl border border-border/70 bg-card/70 p-4 transition hover:border-accent/40 hover:bg-card"
                    >
                      <p className="font-medium text-foreground">{item.name}</p>
                      <p className="mt-2 text-sm leading-6 text-muted-foreground">{item.summary}</p>
                      <p className="mt-3 text-xs font-medium uppercase tracking-[0.16em] text-muted-foreground">
                        {summary?.itemCount ?? 0} records
                      </p>
                    </a>
                  )
                })}
              </CardContent>
            </Card>
          ))}
        </div>
      </SectionShell>
    )
  }

  if (!activeMetadata) {
    return <StateCard message="Common module metadata is unavailable." />
  }

  if (items.isLoading || referenceState.isLoading) {
    return <LoadingStateCard message={`Loading ${activeMetadata.label.toLowerCase()}...`} />
  }

  if (items.error || !itemsData) {
    return <StateCard message={items.error ?? "Module items are unavailable."} />
  }

  if (referenceState.error) {
    return <StateCard message={referenceState.error} />
  }

  const resolvedMetadata = activeMetadata
  const normalizedSearch = searchValue.trim().toLowerCase()
  const filteredItems = itemsData.items.filter((item) => {
    const matchesSearch = [
      getCommonModulePrimaryText(item),
      ...resolvedMetadata.columns.map((column) => {
        const value = item[column.key]

        if (column.referenceModule) {
          const referenceItem =
            referenceState.data[column.referenceModule]?.find((entry) => entry.id === value) ?? null
          return referenceItem ? getCommonModuleOptionLabel(referenceItem) : ""
        }

        return value == null ? "" : String(value)
      }),
    ].some((value) => value.toLowerCase().includes(normalizedSearch))

    return matchesSearch && matchesStatusFilter(statusFilter, item.isActive)
  })
  const totalRecords = filteredItems.length
  const totalPages = Math.max(1, Math.ceil(totalRecords / pageSize))
  const safeCurrentPage = Math.min(currentPage, totalPages)
  const paginatedItems = filteredItems.slice(
    (safeCurrentPage - 1) * pageSize,
    safeCurrentPage * pageSize
  )
  const singularLabel = toSingularLabel(resolvedMetadata.label)
  const visibleColumns = getCommonModuleListColumns(moduleKey, resolvedMetadata.columns)

  function handleFormChange(field: string, value: string | boolean) {
    setForm((current) => ({
      ...current,
      [field]: value,
    }))
  }

  function openCreateDialog() {
    setActiveItem(null)
    setForm(toCommonModuleFormState(resolvedMetadata))
    setFormError(null)
    setListError(null)
    setDialogOpen(true)
  }

  function openEditDialog(item: CommonModuleItem) {
    setActiveItem(item)
    setForm(toCommonModuleFormState(resolvedMetadata, item))
    setFormError(null)
    setListError(null)
    setDialogOpen(true)
  }

  async function handleSave() {
    setFormError(null)
    setIsSaving(true)

    try {
      const payload = Object.fromEntries(
        resolvedMetadata.columns.map((column) => [column.key, form[column.key]])
      )

      if (activeItem) {
        await requestJson<CommonModuleRecordResponse>(
          `/internal/v1/core/common-modules/item?module=${moduleKey}&id=${encodeURIComponent(activeItem.id)}`,
          {
            method: "PATCH",
            body: JSON.stringify({
              ...payload,
              isActive: Boolean(form.isActive),
            }),
          }
        )
      } else {
        await requestJson<CommonModuleRecordResponse>(
          `/internal/v1/core/common-modules/items?module=${moduleKey}`,
          {
            method: "POST",
            body: JSON.stringify({
              ...payload,
              isActive: Boolean(form.isActive),
            }),
          }
        )
      }

      setDialogOpen(false)
      setActiveItem(null)
      setRefreshKey((current) => current + 1)
    } catch (error) {
      setFormError(
        error instanceof Error ? error.message : `Failed to save ${singularLabel.toLowerCase()}.`
      )
    } finally {
      setIsSaving(false)
    }
  }

  async function handleDelete(itemId: string) {
    setListError(null)
    setIsDeleting(true)

    try {
      await requestJson<{ deleted: true; id: string }>(
        `/internal/v1/core/common-modules/item?module=${moduleKey}&id=${encodeURIComponent(itemId)}`,
        {
          method: "DELETE",
        }
      )
      setDeleteTargetItem(null)
      setRefreshKey((current) => current + 1)
    } catch (error) {
      setListError(
        error instanceof Error ? error.message : `Failed to delete ${singularLabel.toLowerCase()}.`
      )
    } finally {
      setIsDeleting(false)
    }
  }

  return (
    <>
      {listError ? (
        <div className="mb-4 rounded-2xl border border-destructive/20 bg-destructive/5 px-4 py-3 text-sm text-destructive">
          {listError}
        </div>
      ) : null}
      <MasterList
        header={{
          pageTitle: resolvedMetadata.label,
          pageDescription:
            selectedMenuItem?.summary ??
            `${resolvedMetadata.label} shared master records maintained in the core workspace.`,
          addLabel: `New ${singularLabel}`,
          onAddClick: openCreateDialog,
        }}
        search={{
          value: searchValue,
          onChange: (value) => {
            setSearchValue(value)
            setCurrentPage(1)
          },
          placeholder: `Search ${resolvedMetadata.label.toLowerCase()}`,
        }}
        filters={buildStatusFilters(statusFilter, (value) => {
          setStatusFilter(value)
          setCurrentPage(1)
        })}
        table={{
          columns: [
            {
              id: "serial",
              header: "Sl.No",
              cell: (item) =>
                (safeCurrentPage - 1) * pageSize +
                paginatedItems.findIndex((entry) => entry.id === item.id) +
                1,
              className: "w-12 min-w-12 px-2 text-center",
              headerClassName: "w-12 min-w-12 px-2 text-center",
              sticky: "left",
            },
            ...visibleColumns.map((column) => ({
              id: column.key,
              header: getCommonModuleListHeader(column, singularLabel),
              sortable: true,
              accessor: (item: CommonModuleItem) => {
                const value = item[column.key]

                if (column.referenceModule) {
                  const referenceItem =
                    referenceState.data[column.referenceModule]?.find((entry) => entry.id === value) ?? null
                  return referenceItem ? getCommonModuleOptionLabel(referenceItem) : ""
                }

                return typeof value === "boolean" ? (value ? "yes" : "no") : value
              },
              cell: (item: CommonModuleItem) =>
                formatCommonModuleCellValue(item, column, referenceState.data),
            })),
            {
              id: "status",
              header: "Status",
              sortable: true,
              accessor: (item: CommonModuleItem) => (item.isActive ? "active" : "inactive"),
              cell: (item: CommonModuleItem) => <ActivityStatusBadge active={item.isActive} />,
            },
            {
              id: "actions",
              header: "Actions",
              cell: (item: CommonModuleItem) => (
                <RecordActionMenu
                  active={item.isActive}
                  itemLabel={getCommonModuleOptionLabel(item)}
                  disabled={isDeleting}
                  onDelete={
                    item.id === "1"
                      ? undefined
                      : () => {
                          setListError(null)
                          setDeleteTargetItem(item)
                        }
                  }
                  onEdit={() => openEditDialog(item)}
                  onToggleActive={
                    item.id === "1"
                      ? undefined
                      : () => {
                          void (async () => {
                            setListError(null)
                            try {
                              await requestJson<CommonModuleRecordResponse>(
                                `/internal/v1/core/common-modules/item?module=${moduleKey}&id=${encodeURIComponent(item.id)}`,
                                {
                                  method: "PATCH",
                                  body: JSON.stringify({ isActive: !item.isActive }),
                                }
                              )
                              setRefreshKey((current) => current + 1)
                            } catch (statusError) {
                              setListError(
                                statusError instanceof Error
                                  ? statusError.message
                                  : `Failed to update ${singularLabel.toLowerCase()} status.`
                              )
                            }
                          })()
                        }
                  }
                />
              ),
              className: "w-20 min-w-20 text-right",
              headerClassName: "w-20 min-w-20 text-right",
            },
          ],
          data: paginatedItems,
          emptyMessage: `No ${resolvedMetadata.label.toLowerCase()} found.`,
          rowKey: (item) => item.id,
        }}
        footer={{
          content: (
            <div className="flex flex-wrap items-center gap-4">
              <span>
                Total records: <span className="font-medium text-foreground">{totalRecords}</span>
              </span>
              <span>
                Active records:{" "}
                <span className="font-medium text-foreground">
                  {filteredItems.filter((item) => item.isActive).length}
                </span>
              </span>
              {selectedSummary ? (
                <span>
                  Seeded baseline:{" "}
                  <span className="font-medium text-foreground">{selectedSummary.itemCount}</span>
                </span>
              ) : null}
            </div>
          ),
        }}
        pagination={{
          currentPage: safeCurrentPage,
          pageSize,
          totalRecords,
          onPageChange: setCurrentPage,
          onPageSizeChange: (nextPageSize) => {
            setPageSize(nextPageSize)
            setCurrentPage(1)
          },
          pageSizeOptions: [10, 20, 50, 100, 200, 500],
        }}
      />
      <Dialog
        open={dialogOpen}
        onOpenChange={(nextOpen) => {
          setDialogOpen(nextOpen)
          if (!nextOpen) {
            setFormError(null)
          }
        }}
      >
        <DialogContent className="max-h-[90vh] max-w-2xl overflow-y-auto">
          <DialogHeader>
            <DialogTitle>
              {activeItem ? `Update ${singularLabel}` : `Create ${singularLabel}`}
            </DialogTitle>
            <DialogDescription>
              {selectedMenuItem?.summary ??
                `Maintain ${resolvedMetadata.label.toLowerCase()} from the shared core workspace.`}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            {resolvedMetadata.columns.map((column) => {
              const value = form[column.key]
              const isDescriptionField =
                column.key.includes("description") || column.key.includes("address")

              return (
                <div key={column.key} className="space-y-2">
                  <label className="text-sm font-medium text-foreground" htmlFor={`common-module-${column.key}`}>
                    {column.label}
                  </label>
                  {column.referenceModule ? (
                    <AutocompleteLookupField
                      value={typeof value === "string" ? value : ""}
                      onChange={(nextValue) => handleFormChange(column.key, nextValue)}
                      onCreateNew={() =>
                        navigate(`/dashboard/apps/core/common-${column.referenceModule}`)
                      }
                      options={(referenceState.data[column.referenceModule] ?? []).map((item) => ({
                        label: getCommonModuleOptionLabel(item),
                        value: item.id,
                      }))}
                      placeholder={`Search ${column.label.toLowerCase()}`}
                      allowEmptyOption={column.nullable}
                      emptyOptionLabel={column.nullable ? "-" : "Select option"}
                      createActionLabel={`Create new ${column.label}`}
                    />
                  ) : column.type === "boolean" ? (
                    <label className="flex items-center gap-3 rounded-xl border border-border/70 px-3 py-2">
                      <input
                        id={`common-module-${column.key}`}
                        type="checkbox"
                        checked={Boolean(value)}
                        onChange={(event) => handleFormChange(column.key, event.target.checked)}
                      />
                      <span className="text-sm text-foreground">{column.label}</span>
                    </label>
                  ) : isDescriptionField ? (
                    <Textarea
                      id={`common-module-${column.key}`}
                      value={typeof value === "string" ? value : ""}
                      onChange={(event) => handleFormChange(column.key, event.target.value)}
                      rows={4}
                    />
                  ) : (
                    <Input
                      id={`common-module-${column.key}`}
                      type={column.type === "number" ? "number" : "text"}
                      step={column.type === "number" ? "any" : undefined}
                      value={typeof value === "string" ? value : ""}
                      onChange={(event) => handleFormChange(column.key, event.target.value)}
                    />
                  )}
                </div>
              )
            })}

            <ActiveSwitchField
              id="common-module-status"
              checked={Boolean(form.isActive)}
              onCheckedChange={(checked) => handleFormChange("isActive", checked)}
            />

            {formError ? (
              <div className="rounded-2xl border border-destructive/20 bg-destructive/5 px-4 py-3 text-sm text-destructive">
                {formError}
              </div>
            ) : null}
          </div>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => setDialogOpen(false)} disabled={isSaving}>
              Cancel
            </Button>
            <Button type="button" onClick={() => void handleSave()} disabled={isSaving}>
              {isSaving
                ? "Saving..."
                : activeItem
                  ? `Update ${singularLabel}`
                  : `Create ${singularLabel}`}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
      <AlertDialog
        open={Boolean(deleteTargetItem)}
        onOpenChange={(open) => {
          if (!open && !isDeleting) {
            setDeleteTargetItem(null)
          }
        }}
      >
        <AlertDialogContent size="default">
          <AlertDialogHeader>
            <AlertDialogTitle className="text-destructive">
              Delete {singularLabel}
            </AlertDialogTitle>
            <AlertDialogDescription>
              <span>
                This will permanently delete{" "}
                <span className="font-semibold text-foreground">
                  {deleteTargetItem
                    ? getCommonModuleOptionLabel(deleteTargetItem)
                    : singularLabel.toLowerCase()}
                </span>
                .
              </span>
              <br />
              Referenced records cannot be deleted until dependent records are removed.
            </AlertDialogDescription>
          </AlertDialogHeader>
          {deleteTargetItem && listError ? (
            <div className="rounded-2xl border border-destructive/20 bg-destructive/5 px-4 py-3 text-sm text-destructive">
              {listError}
            </div>
          ) : null}
          <AlertDialogFooter className="border-destructive/15 bg-destructive/5">
            <AlertDialogCancel disabled={isDeleting}>Cancel</AlertDialogCancel>
            <AlertDialogAction
              className="bg-destructive text-white hover:bg-destructive/90 focus-visible:ring-destructive/20"
              disabled={isDeleting || !deleteTargetItem}
              onClick={() => {
                if (deleteTargetItem) {
                  void handleDelete(deleteTargetItem.id)
                }
              }}
            >
              {isDeleting ? "Deleting..." : "Delete"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  )
}

function SetupSection() {
  const { data, error, isLoading } =
    useJsonResource<BootstrapSnapshot>("/internal/v1/core/bootstrap")

  if (isLoading) {
    return <LoadingStateCard message="Loading setup..." />
  }

  if (error || !data) {
    return <StateCard message={error ?? "Setup data is unavailable."} />
  }

  return (
    <SectionShell
      title="Setup"
      description="System baseline and shared setup status for the running core software."
    >
      <div className="grid gap-4 md:grid-cols-3">
        <MetricCard
          label="Core System"
          value={data.productName}
          hint="Shared business foundation currently loaded into the workspace."
        />
        <MetricCard
          label="Channels"
          value={data.channels.length}
          hint="Runtime delivery surfaces recognized by the system baseline."
        />
        <MetricCard
          label="Modules"
          value={data.modules.length}
          hint="Configured module set currently registered in the core bootstrap."
        />
      </div>
    </SectionShell>
  )
}

function CoreSettingsSection() {
  return (
    <SectionShell
      title="Core Settings"
      description="Shared navigation and foundation defaults currently staged in the core boundary."
    >
      <div className="grid gap-4 xl:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Navigation Lanes</CardTitle>
            <CardDescription>Module groupings used for staged delivery planning.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {navigationSections.map((section) => (
              <div key={section.title} className="space-y-2">
                <p className="font-medium text-foreground">{section.title}</p>
                <div className="flex flex-wrap gap-2">
                  {section.moduleIds.map((moduleId) => (
                    <Badge key={moduleId} variant="outline">
                      {moduleId}
                    </Badge>
                  ))}
                </div>
              </div>
            ))}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Delivery Channels</CardTitle>
            <CardDescription>Targets currently modeled in the shared core workspace.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            {deliveryChannels.map((channel) => (
              <div
                key={channel.id}
                className="rounded-xl border border-border/70 bg-card/70 p-4"
              >
                <p className="font-medium text-foreground">{channel.name}</p>
                <p className="mt-1 text-sm leading-6 text-muted-foreground">
                  {channel.summary}
                </p>
              </div>
            ))}
          </CardContent>
        </Card>

        <Card className="xl:col-span-2">
          <CardHeader>
            <CardTitle>Foundation Module Registry</CardTitle>
            <CardDescription>Current shared module roadmap across the core app boundary.</CardDescription>
          </CardHeader>
          <CardContent className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
            {productModules.map((module) => (
              <div
                key={module.id}
                className="rounded-xl border border-border/70 bg-card/70 p-4"
              >
                <div className="flex items-center justify-between gap-3">
                  <p className="font-medium text-foreground">{module.name}</p>
                  <Badge variant="outline">{module.readiness}</Badge>
                </div>
                <p className="mt-2 text-sm leading-6 text-muted-foreground">
                  {module.summary}
                </p>
              </div>
            ))}
          </CardContent>
        </Card>
      </div>
    </SectionShell>
  )
}

export function CoreWorkspaceSection({
  companyId,
  contactId,
  sectionId,
}: {
  companyId?: string
  contactId?: string
  sectionId?: string
}) {
  const navigate = useNavigate()
  const commonModuleMenuItem = sectionId ? getCoreCommonModuleMenuItem(sectionId) : null

  switch (sectionId ?? "overview") {
    case "companies":
      return <CompaniesSection />
    case "companies-show":
      return companyId ? <CompanyShowSection companyId={companyId} /> : null
    case "companies-upsert":
      return <CompanyUpsertSection companyId={companyId} />
    case "contacts":
      return (
        <ContactsSection
          onCreate={() => {
            void navigate("/dashboard/apps/core/contacts/new")
          }}
          onEdit={(nextContactId) => {
            void navigate(`/dashboard/apps/core/contacts/${encodeURIComponent(nextContactId)}/edit`)
          }}
        />
      )
    case "contacts-show":
      return contactId ? <ContactShowSection contactId={contactId} /> : null
    case "contacts-upsert":
      return <ContactUpsertSection contactId={contactId} />
    case "common-modules":
      return <CommonModulesSection />
    case "setup":
      return <SetupSection />
    case "core-settings":
      return <CoreSettingsSection />
    case "overview":
      return <OverviewSection />
    default:
      return commonModuleMenuItem ? (
        <CommonModulesSection moduleKey={commonModuleMenuItem.key} />
      ) : null
  }
}
