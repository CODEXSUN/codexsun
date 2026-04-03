import { useEffect, useMemo, useRef, useState } from "react"
import { createPortal } from "react-dom"
import { useNavigate } from "react-router-dom"
import { CheckIcon, ChevronsUpDownIcon, MoreHorizontalIcon, PencilLineIcon } from "lucide-react"

import {
  coreCommonModuleMenuGroups,
  getCoreCommonModuleMenuItem,
  deliveryChannels,
  navigationSections,
  productModules,
  type BootstrapSnapshot,
  type CommonModuleItem,
  type CommonModuleKey,
  type CommonModuleMetadataListResponse,
  type CommonModuleSummaryListResponse,
  type CompanyListResponse,
  type Contact,
  type ContactListResponse,
  type ContactResponse,
} from "@core/shared"
import type { BillingLedgerListResponse } from "@billing/shared"
import { getStoredAccessToken } from "@cxapp/web/src/auth/session-storage"
import { MasterList } from "@/components/blocks/master-list"
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Input } from "@/components/ui/input"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { Textarea } from "@/components/ui/textarea"
import { cn } from "@/lib/utils"

type ResourceState<T> = {
  data: T | null
  error: string | null
  isLoading: boolean
}

type ContactFormState = {
  addressLine1: string
  addressLine2: string
  balanceType: string
  creditLimit: string
  description: string
  gstState: string
  gstin: string
  isActive: boolean
  legalName: string
  ledgerId: string
  ledgerName: string
  name: string
  openingBalance: string
  pan: string
  primaryEmail: string
  primaryPhone: string
  website: string
}

type LookupOption = {
  label: string
  value: string
}

const defaultContactForm: ContactFormState = {
  addressLine1: "",
  addressLine2: "",
  balanceType: "",
  creditLimit: "0",
  description: "",
  gstState: "",
  gstin: "",
  isActive: true,
  legalName: "",
  ledgerId: "",
  ledgerName: "",
  name: "",
  openingBalance: "0",
  pan: "",
  primaryEmail: "",
  primaryPhone: "",
  website: "",
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

function useJsonResource<T>(path: string | null): ResourceState<T> {
  const [state, setState] = useState<ResourceState<T>>({
    data: null,
    error: null,
    isLoading: true,
  })

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
    return <StateCard message="Loading core workspace overview." />
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
      description="Shared companies, contacts, setup, and master-data readiness for the suite."
    >
      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <MetricCard
          label="Companies"
          value={state.companies.items.length}
          hint="Active organization roots available to the suite."
        />
        <MetricCard
          label="Contacts"
          value={state.contacts.items.length}
          hint="Reusable parties shared across operations and commerce."
        />
        <MetricCard
          label="Shared Masters"
          value={state.modules.items.length}
          hint="Common module registries staged for cross-app use."
        />
        <MetricCard
          label="Ready Modules"
          value={activeModules}
          hint="Foundation and active modules in the shared core roadmap."
        />
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Engineering Rules</CardTitle>
          <CardDescription>
            Delivery guardrails currently exposed by the core bootstrap snapshot.
          </CardDescription>
        </CardHeader>
        <CardContent className="grid gap-3 md:grid-cols-2">
          {state.bootstrap.engineeringRules.map((rule) => (
            <div
              key={rule}
              className="rounded-xl border border-border/70 bg-card/70 p-4 text-sm leading-6 text-muted-foreground"
            >
              {rule}
            </div>
          ))}
        </CardContent>
      </Card>
    </SectionShell>
  )
}

function CompaniesSection() {
  const { data, error, isLoading } =
    useJsonResource<CompanyListResponse>("/internal/v1/core/companies")

  if (isLoading) {
    return <StateCard message="Loading companies." />
  }

  if (error || !data) {
    return <StateCard message={error ?? "Company data is unavailable."} />
  }

  return (
    <SectionShell
      title="Companies"
      description="Shared organization records adopted into the current core app boundary."
    >
      <div className="grid gap-4 md:grid-cols-3">
        <MetricCard
          label="Companies"
          value={data.items.length}
          hint="Total organization roots currently loaded."
        />
        <MetricCard
          label="Active"
          value={data.items.filter((item) => item.isActive).length}
          hint="Companies available for live workspace use."
        />
        <MetricCard
          label="With Website"
          value={data.items.filter((item) => item.website).length}
          hint="Companies already carrying live web identity fields."
        />
      </div>

      <Card>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Company</TableHead>
                <TableHead>Primary contact</TableHead>
                <TableHead>Registration</TableHead>
                <TableHead>Status</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {data.items.map((company) => (
                <TableRow key={company.id}>
                  <TableCell>
                    <div>
                      <p className="font-medium text-foreground">{company.name}</p>
                      <p className="text-xs text-muted-foreground">
                        {company.legalName ?? "No legal name"}
                      </p>
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="space-y-1 text-sm text-muted-foreground">
                      <p>{company.primaryEmail ?? "No email"}</p>
                      <p>{company.primaryPhone ?? "No phone"}</p>
                    </div>
                  </TableCell>
                  <TableCell className="text-sm text-muted-foreground">
                    {company.registrationNumber ?? "Not set"}
                  </TableCell>
                  <TableCell>
                    <Badge variant={company.isActive ? "default" : "outline"}>
                      {company.isActive ? "Active" : "Inactive"}
                    </Badge>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </SectionShell>
  )
}

function toContactForm(contact?: Contact | null): ContactFormState {
  if (!contact) {
    return defaultContactForm
  }

  return {
    addressLine1: contact.addresses[0]?.addressLine1 ?? "",
    addressLine2: contact.addresses[0]?.addressLine2 ?? "",
    balanceType: contact.balanceType ?? "",
    creditLimit: String(contact.creditLimit),
    description: contact.description ?? "",
    gstState: contact.gstDetails[0]?.state ?? "",
    gstin: contact.gstin ?? "",
    isActive: contact.isActive,
    legalName: contact.legalName ?? "",
    ledgerId: contact.ledgerId ?? "",
    ledgerName: contact.ledgerName ?? "",
    name: contact.name,
    openingBalance: String(contact.openingBalance),
    pan: contact.pan ?? "",
    primaryEmail: contact.primaryEmail ?? "",
    primaryPhone: contact.primaryPhone ?? "",
    website: contact.website ?? "",
  }
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
  const [currentPage, setCurrentPage] = useState(1)
  const [pageSize, setPageSize] = useState(50)
  const { data, error, isLoading } =
    useJsonResource<ContactListResponse>("/internal/v1/core/contacts")

  if (isLoading) {
    return <StateCard message="Loading contacts." />
  }

  if (error || !data) {
    return <StateCard message={error ?? "Contact data is unavailable."} />
  }

  const normalizedSearch = searchValue.trim().toLowerCase()
  const filteredContacts = data.items.filter((contact) =>
    [
      contact.name,
      contact.ledgerName ?? "",
      contact.primaryEmail ?? "",
      contact.primaryPhone ?? "",
      contact.description ?? "",
    ].some((value) => value.toLowerCase().includes(normalizedSearch))
  )
  const totalRecords = filteredContacts.length
  const totalPages = Math.max(1, Math.ceil(totalRecords / pageSize))
  const safeCurrentPage = Math.min(currentPage, totalPages)
  const paginatedContacts = filteredContacts.slice(
    (safeCurrentPage - 1) * pageSize,
    safeCurrentPage * pageSize
  )

  return (
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
                  navigate(`/dashboard/apps/core/contacts/${encodeURIComponent(contact.id)}/edit`)
                }}
              >
                <p className="font-medium text-foreground">{contact.name}</p>
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
            cell: (contact) => (
              <Badge variant={contact.isActive ? "default" : "outline"}>
                {contact.isActive ? "Active" : "Inactive"}
              </Badge>
            ),
          },
          {
            id: "actions",
            header: "Actions",
            cell: (contact) => (
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button type="button" variant="ghost" size="icon" className="size-8 rounded-full">
                    <MoreHorizontalIcon className="size-4" />
                    <span className="sr-only">Open contact actions</span>
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-40">
                  <DropdownMenuItem className="gap-2" onSelect={() => onEdit(contact.id)}>
                    <PencilLineIcon className="size-4" />
                    Edit
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
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
  )
}

function buildContactPayload(form: ContactFormState) {
  return {
    ledgerId: form.ledgerId || null,
    ledgerName: form.ledgerName || null,
    name: form.name,
    legalName: form.legalName,
    pan: form.pan,
    gstin: form.gstin,
    msmeType: "",
    msmeNo: "",
    openingBalance: Number(form.openingBalance),
    balanceType: form.balanceType,
    creditLimit: Number(form.creditLimit),
    website: form.website,
    description: form.description,
    isActive: form.isActive,
    addresses: form.addressLine1
      ? [
          {
            addressType: "primary",
            addressLine1: form.addressLine1,
            addressLine2: form.addressLine2,
            cityId: null,
            stateId: null,
            countryId: null,
            pincodeId: null,
            latitude: null,
            longitude: null,
            isDefault: true,
          },
        ]
      : [],
    emails: form.primaryEmail
      ? [
          {
            email: form.primaryEmail,
            emailType: "primary",
            isPrimary: true,
          },
        ]
      : [],
    phones: form.primaryPhone
      ? [
          {
            phoneNumber: form.primaryPhone,
            phoneType: "primary",
            isPrimary: true,
          },
        ]
      : [],
    bankAccounts: [],
    gstDetails: form.gstin
      ? [
          {
            gstin: form.gstin,
            state: form.gstState || "Unknown",
            isDefault: true,
          },
        ]
      : [],
  }
}

function AutocompleteLookupField({
  value,
  onChange,
  options,
  placeholder,
  allowEmptyOption,
  emptyOptionLabel = "Select",
}: {
  value: string
  onChange: (value: string) => void
  options: LookupOption[]
  placeholder?: string
  allowEmptyOption?: boolean
  emptyOptionLabel?: string
}) {
  const lookupMenuHeight = 320
  const lookupViewportGap = 12
  const [open, setOpen] = useState(false)
  const [query, setQuery] = useState("")
  const [highlightedIndex, setHighlightedIndex] = useState(0)
  const [menuStyle, setMenuStyle] = useState<{
    top?: number
    left?: number
    width?: number
    maxHeight: number
    openUpward: boolean
    withinDialog: boolean
  } | null>(null)
  const rootRef = useRef<HTMLDivElement | null>(null)
  const menuRef = useRef<HTMLDivElement | null>(null)
  const triggerRef = useRef<HTMLButtonElement | null>(null)
  const inputRef = useRef<HTMLInputElement | null>(null)
  const resolvedValue = value || (allowEmptyOption ? "__empty__" : "")
  const selectedOption = options.find((option) => option.value === value)
  const filteredOptions = useMemo(() => {
    const normalizedQuery = query.trim().toLowerCase()
    if (!normalizedQuery) {
      return options
    }

    return options.filter((option) => option.label.toLowerCase().includes(normalizedQuery))
  }, [options, query])
  const showEmptyOption = Boolean(allowEmptyOption)

  useEffect(() => {
    let focusFrame = 0
    let focusTimeout: number | null = null

    function syncMenuPosition() {
      const trigger = triggerRef.current
      if (!trigger) {
        return
      }

      const withinDialog = Boolean(trigger.closest('[role="dialog"]'))
      const rect = trigger.getBoundingClientRect()
      const spaceBelow = window.innerHeight - rect.bottom - lookupViewportGap
      const spaceAbove = rect.top - lookupViewportGap
      const shouldOpenUpward = spaceBelow < lookupMenuHeight && spaceAbove > spaceBelow
      const availableHeight = shouldOpenUpward ? Math.max(spaceAbove, 180) : Math.max(spaceBelow, 180)
      const maxHeight = Math.min(lookupMenuHeight, availableHeight)
      const top = shouldOpenUpward
        ? Math.max(lookupViewportGap, rect.top - maxHeight - 8)
        : rect.bottom + 8

      setMenuStyle({
        maxHeight,
        openUpward: shouldOpenUpward,
        withinDialog,
        ...(withinDialog
          ? {}
          : {
              top,
              left: rect.left,
              width: rect.width,
            }),
      })
    }

    if (!open) {
      setQuery("")
      setHighlightedIndex(0)
      setMenuStyle(null)
      return
    }

    syncMenuPosition()
    setHighlightedIndex(showEmptyOption ? 1 : 0)
    focusFrame = window.requestAnimationFrame(() => {
      inputRef.current?.focus()
      inputRef.current?.select()
      focusTimeout = window.setTimeout(() => {
        inputRef.current?.focus()
        inputRef.current?.select()
      }, 0)
    })
    window.addEventListener("resize", syncMenuPosition)
    window.addEventListener("scroll", syncMenuPosition, true)

    return () => {
      window.cancelAnimationFrame(focusFrame)
      if (focusTimeout) {
        window.clearTimeout(focusTimeout)
      }
      window.removeEventListener("resize", syncMenuPosition)
      window.removeEventListener("scroll", syncMenuPosition, true)
    }
  }, [open, showEmptyOption])

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      const target = event.target as Node
      if (!rootRef.current?.contains(target) && !menuRef.current?.contains(target)) {
        setOpen(false)
      }
    }

    document.addEventListener("mousedown", handleClickOutside)
    return () => document.removeEventListener("mousedown", handleClickOutside)
  }, [])

  function closeMenu() {
    setOpen(false)
    setQuery("")
    triggerRef.current?.focus()
  }

  function selectOption(nextValue: string) {
    onChange(nextValue)
    closeMenu()
  }

  function moveHighlight(direction: 1 | -1) {
    const itemCount = filteredOptions.length + (showEmptyOption ? 1 : 0)
    if (itemCount <= 0) {
      return
    }

    setHighlightedIndex((current) => {
      const next = current + direction
      if (next < 0) {
        return itemCount - 1
      }
      if (next >= itemCount) {
        return 0
      }
      return next
    })
  }

  function handleKeyDown(event: React.KeyboardEvent<HTMLButtonElement | HTMLInputElement>) {
    if (!open && ["ArrowDown", "ArrowUp", "Enter", " "].includes(event.key)) {
      event.preventDefault()
      setOpen(true)
      return
    }

    if (!open) {
      return
    }

    if (event.key === "ArrowDown") {
      event.preventDefault()
      moveHighlight(1)
      return
    }

    if (event.key === "ArrowUp") {
      event.preventDefault()
      moveHighlight(-1)
      return
    }

    if (event.key === "Escape") {
      event.preventDefault()
      closeMenu()
      return
    }

    if (event.key === "Enter") {
      event.preventDefault()

      if (showEmptyOption && highlightedIndex === 0) {
        selectOption("")
        return
      }

      const optionIndex = highlightedIndex - (showEmptyOption ? 1 : 0)
      if (optionIndex >= 0 && optionIndex < filteredOptions.length) {
        selectOption(filteredOptions[optionIndex].value)
      }
    }
  }

  const menuContent = menuStyle ? (
    <>
      <input
        ref={inputRef}
        value={query}
        onChange={(event) => setQuery(event.target.value)}
        onKeyDown={handleKeyDown}
        placeholder={placeholder ?? "Search option"}
        className="mb-2 flex h-9 w-full rounded-md border border-input bg-background px-3 py-2 text-sm shadow-xs outline-none focus-visible:border-ring focus-visible:ring-2 focus-visible:ring-ring/30"
      />
      <div
        className="overflow-y-auto pr-1 [scrollbar-color:hsl(var(--border))_transparent] [scrollbar-width:thin] [&::-webkit-scrollbar-thumb]:rounded-full [&::-webkit-scrollbar-thumb]:bg-border/80 [&::-webkit-scrollbar-track]:bg-transparent [&::-webkit-scrollbar]:w-1.5"
        style={{ maxHeight: Math.max(menuStyle.maxHeight - 52, 128) }}
      >
        {showEmptyOption ? (
          <button
            type="button"
            className={cn(
              "flex w-full items-center justify-between rounded-sm px-2 py-2 text-left text-sm transition-colors hover:bg-muted/70",
              highlightedIndex === 0 ? "bg-muted/70" : undefined
            )}
            onClick={() => selectOption("")}
          >
            <span>{emptyOptionLabel}</span>
            {resolvedValue === "__empty__" ? <CheckIcon className="size-4" /> : null}
          </button>
        ) : null}
        {filteredOptions.map((option, index) => (
          <button
            key={option.value}
            type="button"
            className={cn(
              "flex w-full items-center justify-between rounded-sm px-2 py-2 text-left text-sm transition-colors hover:bg-muted/70",
              highlightedIndex === index + (showEmptyOption ? 1 : 0) ? "bg-muted/70" : undefined
            )}
            onClick={() => selectOption(option.value)}
          >
            <span>{option.label}</span>
            {option.value === value ? <CheckIcon className="size-4" /> : null}
          </button>
        ))}
        {filteredOptions.length === 0 ? (
          <div className="px-2 py-2 text-sm text-muted-foreground">No results found.</div>
        ) : null}
      </div>
    </>
  ) : null

  return (
    <div ref={rootRef} className={cn("relative", open ? "z-[230]" : undefined)}>
      <button
        type="button"
        ref={triggerRef}
        className="flex h-9 w-full items-center justify-between rounded-md border border-input bg-background px-3 py-2 text-sm shadow-xs outline-none focus-visible:border-ring focus-visible:ring-2 focus-visible:ring-ring/30"
        onClick={() => setOpen((current) => !current)}
        onKeyDown={handleKeyDown}
      >
        <span className={cn("truncate text-left", !selectedOption && !allowEmptyOption ? "text-muted-foreground" : undefined)}>
          {selectedOption?.label ??
            (showEmptyOption && resolvedValue === "__empty__"
              ? emptyOptionLabel
              : placeholder ?? "Select option")}
        </span>
        <ChevronsUpDownIcon className="ml-2 size-4 shrink-0 text-muted-foreground" />
      </button>

      {open && menuStyle
        ? menuStyle.withinDialog
          ? (
            <div
              ref={menuRef}
              className={cn(
                "absolute z-[220] w-full rounded-md border border-border bg-popover p-2 shadow-md",
                menuStyle.openUpward ? "bottom-full mb-2" : "top-full mt-2"
              )}
            >
              {menuContent}
            </div>
            )
          : typeof document !== "undefined"
            ? createPortal(
              <div
                ref={menuRef}
                className="fixed z-[200] rounded-md border border-border bg-popover p-2 shadow-md"
                style={{
                  top: menuStyle.top,
                  left: menuStyle.left,
                  width: menuStyle.width,
                }}
              >
                {menuContent}
              </div>,
              document.body
            )
            : null
        : null}
    </div>
  )
}

function ContactUpsertSection({ contactId }: { contactId?: string }) {
  const navigate = useNavigate()
  const [form, setForm] = useState<ContactFormState>(defaultContactForm)
  const [formError, setFormError] = useState<string | null>(null)
  const [isSaving, setIsSaving] = useState(false)
  const contactResource = useJsonResource<ContactResponse>(
    contactId ? `/internal/v1/core/contact?id=${encodeURIComponent(contactId)}` : null
  )
  const ledgerResource =
    useJsonResource<BillingLedgerListResponse>("/internal/v1/billing/ledgers")

  useEffect(() => {
    if (!contactId) {
      setForm(defaultContactForm)
      return
    }

    if (contactResource.data?.item) {
      setForm(toContactForm(contactResource.data.item))
    }
  }, [contactId, contactResource.data])

  function handleChange(field: keyof ContactFormState, value: string | boolean) {
    setForm((current) => ({
      ...current,
      [field]: value,
    }))
  }

  async function handleSave() {
    setFormError(null)
    setIsSaving(true)

    try {
      const payload = buildContactPayload(form)

      if (contactId) {
        await requestJson<ContactResponse>(
          `/internal/v1/core/contact?id=${encodeURIComponent(contactId)}`,
          {
            method: "PATCH",
            body: JSON.stringify(payload),
          }
        )
      } else {
        await requestJson<ContactResponse>("/internal/v1/core/contacts", {
          method: "POST",
          body: JSON.stringify(payload),
        })
      }

      void navigate("/dashboard/apps/core/contacts")
    } catch (error) {
      setFormError(error instanceof Error ? error.message : "Failed to save contact.")
    } finally {
      setIsSaving(false)
    }
  }

  async function handleDelete() {
    if (!contactId) {
      return
    }

    setFormError(null)
    setIsSaving(true)

    try {
      await requestJson<{ deleted: true; id: string }>(
        `/internal/v1/core/contact?id=${encodeURIComponent(contactId)}`,
        {
          method: "DELETE",
        }
      )
      void navigate("/dashboard/apps/core/contacts")
    } catch (error) {
      setFormError(error instanceof Error ? error.message : "Failed to delete contact.")
    } finally {
      setIsSaving(false)
    }
  }

  if (contactId && contactResource.isLoading) {
    return <StateCard message="Loading contact." />
  }

  if (contactId && (contactResource.error || !contactResource.data)) {
    return <StateCard message={contactResource.error ?? "Contact data is unavailable."} />
  }

  if (ledgerResource.isLoading) {
    return <StateCard message="Loading ledgers." />
  }

  if (ledgerResource.error || !ledgerResource.data) {
    return <StateCard message={ledgerResource.error ?? "Ledger data is unavailable."} />
  }

  const ledgerOptions: LookupOption[] = ledgerResource.data.items.map((ledger) => ({
    label: `${ledger.name} (${ledger.categoryName})`,
    value: ledger.id,
  }))

  return (
    <div className="space-y-4">
      <Card>
        <CardContent className="space-y-4 p-5">
          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <label className="text-sm font-medium text-foreground">Contact name</label>
              <Input value={form.name} onChange={(event) => handleChange("name", event.target.value)} />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium text-foreground">Legal name</label>
              <Input value={form.legalName} onChange={(event) => handleChange("legalName", event.target.value)} />
            </div>
          </div>

          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <label className="text-sm font-medium text-foreground">Linked ledger</label>
              <AutocompleteLookupField
                value={form.ledgerId}
                onChange={(nextLedgerId) => {
                  const ledger = ledgerResource.data?.items.find((item) => item.id === nextLedgerId) ?? null
                  handleChange("ledgerId", ledger?.id ?? "")
                  handleChange("ledgerName", ledger?.name ?? "")
                }}
                options={ledgerOptions}
                placeholder="Search ledger"
                allowEmptyOption
                emptyOptionLabel="No linked ledger"
              />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium text-foreground">Status</label>
              <select
                className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                value={form.isActive ? "active" : "inactive"}
                onChange={(event) => handleChange("isActive", event.target.value === "active")}
              >
                <option value="active">Active</option>
                <option value="inactive">Inactive</option>
              </select>
            </div>
          </div>

          <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
            <div className="space-y-2">
              <label className="text-sm font-medium text-foreground">Primary email</label>
              <Input value={form.primaryEmail} onChange={(event) => handleChange("primaryEmail", event.target.value)} />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium text-foreground">Primary phone</label>
              <Input value={form.primaryPhone} onChange={(event) => handleChange("primaryPhone", event.target.value)} />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium text-foreground">PAN</label>
              <Input value={form.pan} onChange={(event) => handleChange("pan", event.target.value)} />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium text-foreground">Website</label>
              <Input value={form.website} onChange={(event) => handleChange("website", event.target.value)} />
            </div>
          </div>

          <div className="grid gap-4 md:grid-cols-3">
            <div className="space-y-2">
              <label className="text-sm font-medium text-foreground">GSTIN</label>
              <Input value={form.gstin} onChange={(event) => handleChange("gstin", event.target.value)} />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium text-foreground">GST State</label>
              <Input value={form.gstState} onChange={(event) => handleChange("gstState", event.target.value)} />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium text-foreground">Credit limit</label>
              <Input type="number" min="0" step="0.01" value={form.creditLimit} onChange={(event) => handleChange("creditLimit", event.target.value)} />
            </div>
          </div>

          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <label className="text-sm font-medium text-foreground">Opening balance</label>
              <Input type="number" step="0.01" value={form.openingBalance} onChange={(event) => handleChange("openingBalance", event.target.value)} />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium text-foreground">Balance type</label>
              <select
                className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                value={form.balanceType}
                onChange={(event) => handleChange("balanceType", event.target.value)}
              >
                <option value="">Not set</option>
                <option value="debit">Debit</option>
                <option value="credit">Credit</option>
              </select>
            </div>
          </div>

          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <label className="text-sm font-medium text-foreground">Address line 1</label>
              <Textarea value={form.addressLine1} onChange={(event) => handleChange("addressLine1", event.target.value)} />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium text-foreground">Address line 2</label>
              <Textarea value={form.addressLine2} onChange={(event) => handleChange("addressLine2", event.target.value)} />
            </div>
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium text-foreground">Description</label>
            <Textarea value={form.description} onChange={(event) => handleChange("description", event.target.value)} />
          </div>

          {formError ? (
            <div className="rounded-2xl border border-destructive/20 bg-destructive/5 px-4 py-3 text-sm text-destructive">
              {formError}
            </div>
          ) : null}

          <div className="flex flex-wrap gap-3">
            <Button type="button" onClick={handleSave} disabled={isSaving}>
              {isSaving ? "Saving..." : contactId ? "Update Contact" : "Create Contact"}
            </Button>
            <Button type="button" variant="outline" onClick={() => void navigate("/dashboard/apps/core/contacts")} disabled={isSaving}>
              Back to List
            </Button>
            {contactId ? (
              <Button type="button" variant="destructive" onClick={handleDelete} disabled={isSaving}>
                Delete Contact
              </Button>
            ) : null}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}

function CommonModulesSection({ moduleKey }: { moduleKey?: CommonModuleKey }) {
  const metadata = useJsonResource<CommonModuleMetadataListResponse>(
    "/internal/v1/core/common-modules/metadata"
  )
  const summaries = useJsonResource<CommonModuleSummaryListResponse>(
    "/internal/v1/core/common-modules/summary"
  )
  const [selectedModule, setSelectedModule] = useState<CommonModuleKey>(
    moduleKey ?? "productCategories"
  )
  const items = useJsonResource<{ module: CommonModuleKey; items: CommonModuleItem[] }>(
    `/internal/v1/core/common-modules/items?module=${selectedModule}`
  )

  useEffect(() => {
    if (moduleKey) {
      setSelectedModule(moduleKey)
    }
  }, [moduleKey])

  if (metadata.isLoading || summaries.isLoading) {
    return <StateCard message="Loading common modules." />
  }

  if (metadata.error || summaries.error || !metadata.data || !summaries.data) {
    return (
      <StateCard
        message={metadata.error ?? summaries.error ?? "Common module data is unavailable."}
      />
    )
  }

  const selectedMetadata =
    metadata.data.modules.find((module) => module.key === selectedModule) ?? null

  return (
    <SectionShell
      title="Common Modules"
      description="Shared master registries kept in core for cross-app dependency management."
    >
      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        {summaries.data.items.slice(0, 8).map((item) => (
          <MetricCard
            key={item.key}
            label={item.label}
            value={item.itemCount}
            hint={`${item.activeCount} active records in the shared registry.`}
          />
        ))}
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Module Preview</CardTitle>
          <CardDescription>
            Review columns and sample records for a selected shared master.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-3">
            {coreCommonModuleMenuGroups.map((group) => (
              <div key={group.id} className="space-y-2">
                <p className="text-xs font-semibold uppercase tracking-[0.18em] text-muted-foreground">
                  {group.label}
                </p>
                <div className="flex flex-wrap gap-2">
                  {group.items.map((item) => (
                    <button
                      key={item.id}
                      type="button"
                      onClick={() => setSelectedModule(item.key)}
                      className={cn(
                        "rounded-full border border-border/70 px-3 py-1.5 text-sm transition hover:border-accent/40",
                        selectedModule === item.key
                          ? "border-accent/60 bg-accent/10 text-foreground"
                          : undefined
                      )}
                    >
                      {item.name}
                    </button>
                  ))}
                </div>
              </div>
            ))}
          </div>

          {selectedMetadata ? (
            <Accordion type="single" collapsible defaultValue="columns">
              <AccordionItem value="columns">
                <AccordionTrigger>Columns for {selectedMetadata.label}</AccordionTrigger>
                <AccordionContent className="space-y-2">
                  {selectedMetadata.columns.map((column) => (
                    <div
                      key={column.key}
                      className="rounded-xl border border-border/70 bg-card/70 p-3 text-sm"
                    >
                      <p className="font-medium text-foreground">{column.label}</p>
                      <p className="text-muted-foreground">
                        {column.key} · {column.type}
                        {column.referenceModule ? ` · ${column.referenceModule}` : ""}
                      </p>
                    </div>
                  ))}
                </AccordionContent>
              </AccordionItem>
            </Accordion>
          ) : null}

          {items.isLoading ? (
            <StateCard message="Loading module items." />
          ) : items.error || !items.data ? (
            <StateCard message={items.error ?? "Module items are unavailable."} />
          ) : (
            <Card className="border border-border/70 shadow-none">
              <CardContent className="p-0">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Record</TableHead>
                      <TableHead>Status</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {items.data.items.slice(0, 6).map((item) => (
                      <TableRow key={item.id}>
                        <TableCell className="text-sm text-muted-foreground">
                          <pre className="whitespace-pre-wrap font-mono text-xs">
                            {JSON.stringify(item, null, 2)}
                          </pre>
                        </TableCell>
                        <TableCell>
                          <Badge variant={item.isActive ? "default" : "outline"}>
                            {item.isActive ? "Active" : "Inactive"}
                          </Badge>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          )}
        </CardContent>
      </Card>
    </SectionShell>
  )
}

function SetupSection() {
  const { data, error, isLoading } =
    useJsonResource<BootstrapSnapshot>("/internal/v1/core/bootstrap")

  if (isLoading) {
    return <StateCard message="Loading setup snapshot." />
  }

  if (error || !data) {
    return <StateCard message={error ?? "Setup data is unavailable."} />
  }

  return (
    <SectionShell
      title="Setup"
      description="Bootstrap guidance exposed through the shared core foundation."
    >
      <div className="grid gap-4 md:grid-cols-3">
        <MetricCard
          label="Product"
          value={data.productName}
          hint={data.mission}
        />
        <MetricCard
          label="Channels"
          value={data.channels.length}
          hint="Delivery targets currently covered by the bootstrap record."
        />
        <MetricCard
          label="Modules"
          value={data.modules.length}
          hint="Foundation module backlog and readiness baseline."
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
  contactId,
  sectionId,
}: {
  contactId?: string
  sectionId?: string
}) {
  const navigate = useNavigate()
  const commonModuleMenuItem = sectionId ? getCoreCommonModuleMenuItem(sectionId) : null

  switch (sectionId ?? "overview") {
    case "companies":
      return <CompaniesSection />
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
