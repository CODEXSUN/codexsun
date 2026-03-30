import { useEffect, useState } from "react"

import {
  deliveryChannels,
  navigationSections,
  productModules,
  type BootstrapSnapshot,
  type CommonModuleItem,
  type CommonModuleKey,
  type CommonModuleMetadataListResponse,
  type CommonModuleSummaryListResponse,
  type CompanyListResponse,
  type ContactListResponse,
} from "@core/shared"
import { getStoredAccessToken } from "@cxapp/web/src/auth/session-storage"
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"

type ResourceState<T> = {
  data: T | null
  error: string | null
  isLoading: boolean
}

async function fetchJson<T>(path: string): Promise<T> {
  const accessToken = getStoredAccessToken()
  const response = await fetch(path, {
    headers: accessToken
      ? {
          authorization: `Bearer ${accessToken}`,
        }
      : undefined,
  })

  if (!response.ok) {
    throw new Error(`Request failed with status ${response.status}.`)
  }

  return (await response.json()) as T
}

function useJsonResource<T>(path: string): ResourceState<T> {
  const [state, setState] = useState<ResourceState<T>>({
    data: null,
    error: null,
    isLoading: true,
  })

  useEffect(() => {
    let cancelled = false

    async function load() {
      setState({ data: null, error: null, isLoading: true })

      try {
        const data = await fetchJson<T>(path)
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
          fetchJson<BootstrapSnapshot>("/internal/v1/core/bootstrap"),
          fetchJson<CompanyListResponse>("/internal/v1/core/companies"),
          fetchJson<ContactListResponse>("/internal/v1/core/contacts"),
          fetchJson<CommonModuleSummaryListResponse>(
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

function ContactsSection() {
  const { data, error, isLoading } =
    useJsonResource<ContactListResponse>("/internal/v1/core/contacts")

  if (isLoading) {
    return <StateCard message="Loading contacts." />
  }

  if (error || !data) {
    return <StateCard message={error ?? "Contact data is unavailable."} />
  }

  return (
    <SectionShell
      title="Contacts"
      description="Shared parties, suppliers, and partner records available across the suite."
    >
      <Card>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Name</TableHead>
                <TableHead>Type</TableHead>
                <TableHead>Contact</TableHead>
                <TableHead>Credit limit</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {data.items.map((contact) => (
                <TableRow key={contact.id}>
                  <TableCell>
                    <div>
                      <p className="font-medium text-foreground">{contact.name}</p>
                      <p className="text-xs text-muted-foreground">
                        {contact.description ?? "No description"}
                      </p>
                    </div>
                  </TableCell>
                  <TableCell className="text-sm text-muted-foreground">
                    {contact.contactTypeId}
                  </TableCell>
                  <TableCell>
                    <div className="space-y-1 text-sm text-muted-foreground">
                      <p>{contact.primaryEmail ?? "No email"}</p>
                      <p>{contact.primaryPhone ?? "No phone"}</p>
                    </div>
                  </TableCell>
                  <TableCell className="text-sm text-muted-foreground">
                    {contact.creditLimit.toLocaleString("en-IN")}
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

function CommonModulesSection() {
  const metadata = useJsonResource<CommonModuleMetadataListResponse>(
    "/internal/v1/core/common-modules/metadata"
  )
  const summaries = useJsonResource<CommonModuleSummaryListResponse>(
    "/internal/v1/core/common-modules/summary"
  )
  const [selectedModule, setSelectedModule] =
    useState<CommonModuleKey>("productCategories")
  const items = useJsonResource<{ module: CommonModuleKey; items: CommonModuleItem[] }>(
    `/internal/v1/core/common-modules/items?module=${selectedModule}`
  )

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
          <div className="flex flex-wrap gap-2">
            {metadata.data.modules.slice(0, 10).map((module) => (
              <button
                key={module.key}
                type="button"
                onClick={() => setSelectedModule(module.key)}
                className="rounded-full border border-border/70 px-3 py-1.5 text-sm transition hover:border-accent/40"
              >
                {module.label}
              </button>
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

export function CoreWorkspaceSection({ sectionId }: { sectionId?: string }) {
  switch (sectionId ?? "overview") {
    case "companies":
      return <CompaniesSection />
    case "contacts":
      return <ContactsSection />
    case "common-modules":
      return <CommonModulesSection />
    case "setup":
      return <SetupSection />
    case "core-settings":
      return <CoreSettingsSection />
    case "overview":
      return <OverviewSection />
    default:
      return null
  }
}
