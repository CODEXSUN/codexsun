import { useEffect, useMemo, useState } from "react"
import { Link, useNavigate } from "react-router-dom"
import { ArrowLeftIcon } from "lucide-react"

import type { CommonModuleItem, ContactResponse } from "@core/shared"
import { getStoredAccessToken } from "@cxapp/web/src/auth/session-storage"

import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { useGlobalLoading } from "@/features/dashboard/loading/global-loading-provider"
import { SearchableLookupField } from "@/features/forms/searchable-lookup-field"
import { AnimatedTabs, type AnimatedContentTab } from "@/registry/concerns/navigation/animated-tabs"

import {
  contactBalanceTypeOptions,
  contactEmailTypeOptions,
  contactMsmeTypeOptions,
  contactPhoneTypeOptions,
  createDefaultContactFormValues,
  createEmptyContactAddress,
  createEmptyContactBank,
  createEmptyContactEmail,
  createEmptyContactGst,
  createEmptyContactPhone,
  toContactFormValues,
  type ContactFormValues,
  type ContactLookupModuleKey,
} from "./contact-form-state"
import {
  ContactCheckboxField,
  ContactCollectionRow,
  ContactField,
  ContactFormMessage,
  ContactFormSectionCard,
  ContactLookupField,
  ContactSelectField,
  ContactStatusField,
  ContactTextField,
} from "./contact-form-sections"

type LookupState = Record<ContactLookupModuleKey, CommonModuleItem[]>
type ContactFieldErrors = Record<string, string>

const lookupModules: ContactLookupModuleKey[] = [
  "contactTypes",
  "addressTypes",
  "bankNames",
  "countries",
  "states",
  "districts",
  "cities",
  "pincodes",
]

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
      | {
          error?: string
          message?: string
          context?: {
            issues?: Array<{
              path?: Array<string | number>
              message?: string
            }>
          }
        }
      | null
    const issueMessage = payload?.context?.issues?.length
      ? payload.context.issues
          .map((issue) => {
            const pathLabel =
              issue.path && issue.path.length > 0
                ? issue.path
                    .map((segment) =>
                      typeof segment === "number" ? String(segment + 1) : String(segment)
                    )
                    .join(" > ")
                : null

            return pathLabel ? `${pathLabel}: ${issue.message ?? "Invalid value."}` : issue.message
          })
          .filter((value): value is string => Boolean(value))
          .join("\n")
      : null

    throw new Error(
      issueMessage ??
        payload?.error ??
        payload?.message ??
        `Request failed with status ${response.status}.`
    )
  }

  return (await response.json()) as T
}

function StateCard({ message }: { message: string }) {
  return (
    <Card>
      <CardContent className="p-5 text-sm text-muted-foreground">{message}</CardContent>
    </Card>
  )
}

function LoadingCard({ message }: { message: string }) {
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
        <p className="text-sm text-muted-foreground">{message}</p>
      </CardContent>
    </Card>
  )
}

function updateCollectionItem<T>(items: T[], index: number, recipe: (item: T) => T) {
  return items.map((item, itemIndex) => (itemIndex === index ? recipe(item) : item))
}

function normalizeUppercase(value: string) {
  return value.toUpperCase()
}

function normalizeFieldPath(path: Array<string | number>) {
  return path.map((segment) => String(segment)).join(".")
}

function humanizeServerIssue(path: string, message: string) {
  const segments = path.split(".")
  const [group, indexToken, field] = segments
  const index = indexToken ? Number(indexToken) + 1 : null
  const normalizedMessage =
    message.toLowerCase() === "invalid email address"
      ? "Enter a valid email address."
      : message

  switch (group) {
    case "name":
      return `Name: ${normalizedMessage}`
    case "gstin":
      return `GSTIN: ${normalizedMessage}`
    case "emails":
      return `Email ${index}: ${normalizedMessage}`
    case "phones":
      return `Phone ${index}: ${normalizedMessage}`
    case "addresses":
      if (field === "addressLine1") {
        return `Address ${index} Line 1: ${normalizedMessage}`
      }
      return `Address ${index}: ${normalizedMessage}`
    case "bankAccounts":
      if (field === "bankName") {
        return `Bank Account ${index} Bank Name: ${normalizedMessage}`
      }
      if (field === "accountNumber") {
        return `Bank Account ${index} Account Number: ${normalizedMessage}`
      }
      if (field === "accountHolderName") {
        return `Bank Account ${index} Account Holder Name: ${normalizedMessage}`
      }
      if (field === "ifsc") {
        return `Bank Account ${index} IFSC: ${normalizedMessage}`
      }
      return `Bank Account ${index}: ${normalizedMessage}`
    case "gstDetails":
      if (field === "gstin") {
        return `GST Detail ${index} GSTIN: ${normalizedMessage}`
      }
      if (field === "state") {
        return `GST Detail ${index} State: ${normalizedMessage}`
      }
      return `GST Detail ${index}: ${normalizedMessage}`
    default:
      return normalizedMessage
  }
}

function requiresGstinForContactType(
  items: CommonModuleItem[],
  contactTypeId: string | null | undefined
) {
  if (!contactTypeId || contactTypeId === "1") {
    return false
  }

  const selectedType = items.find((item) => item.id === contactTypeId)
  if (!selectedType) {
    return false
  }

  const code = String(selectedType.code ?? "").trim().toLowerCase()
  const name = String(selectedType.name ?? "").trim().toLowerCase()

  return (
    code === "registered-customer-b2b" ||
    code === "customer-registered-b2b" ||
    name === "registered customer (b2b)"
  )
}

function buildInlineCommonModuleCode(value: string) {
  const normalized = value
    .trim()
    .toUpperCase()
    .replace(/[^A-Z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")

  return normalized.length > 0 ? normalized.slice(0, 20) : "NEW"
}

function buildInlineCommonModulePayload(moduleKey: ContactLookupModuleKey, query: string) {
  const value = query.trim()
  const code = buildInlineCommonModuleCode(value)

  switch (moduleKey) {
    case "contactTypes":
    case "addressTypes":
    case "bankNames":
      return { code, name: value, description: "-", isActive: true }
    case "countries":
      return { code: code.slice(0, 3), name: value, phone_code: "-", isActive: true }
    case "states":
      return { country_id: "1", code, name: value, isActive: true }
    case "districts":
      return { state_id: "1", code, name: value, isActive: true }
    case "cities":
      return { state_id: "1", district_id: "1", code, name: value, isActive: true }
    case "pincodes":
      return {
        country_id: "1",
        state_id: "1",
        district_id: "1",
        city_id: "1",
        code: value,
        area_name: "-",
        isActive: true,
      }
  }
}

function validateContactForm(values: ContactFormValues, lookupState: LookupState) {
  const errors: ContactFieldErrors = {}
  if (values.name.trim().length < 2) {
    errors.name = "Contact name is required."
  }
  if (
    requiresGstinForContactType(lookupState.contactTypes, values.contactTypeId) &&
    values.gstin.trim().length === 0
  ) {
    errors.gstin = "GSTIN is required for Registered Customer (B2B)."
  }
  return errors
}

export function ContactUpsertSection({ contactId }: { contactId?: string }) {
  const navigate = useNavigate()
  const isEditing = Boolean(contactId)
  const [form, setForm] = useState<ContactFormValues>(createDefaultContactFormValues())
  const [lookupState, setLookupState] = useState<LookupState>({
    contactTypes: [],
    addressTypes: [],
    bankNames: [],
    countries: [],
    states: [],
    districts: [],
    cities: [],
    pincodes: [],
  })
  const [isLoading, setIsLoading] = useState(isEditing)
  const [isSaving, setIsSaving] = useState(false)
  const [loadError, setLoadError] = useState<string | null>(null)
  const [formError, setFormError] = useState<string | null>(null)
  const [fieldErrors, setFieldErrors] = useState<ContactFieldErrors>({})
  useGlobalLoading(isLoading || isSaving)

  function getFieldError(path: string) {
    return fieldErrors[path] ?? null
  }

  async function createLookupItem(moduleKey: ContactLookupModuleKey, query: string) {
    const normalizedQuery = query.trim()
    if (!normalizedQuery) {
      return null
    }

    const existingItem = lookupState[moduleKey].find((item) => {
      const label =
        moduleKey === "pincodes"
          ? String(item.code ?? item.name ?? item.id)
          : String(item.name ?? item.area_name ?? item.code ?? item.id)

      return label.trim().toLowerCase() === normalizedQuery.toLowerCase()
    })

    if (existingItem) {
      return existingItem
    }

    const response = await requestJson<{ module: ContactLookupModuleKey; item: CommonModuleItem }>(
      `/internal/v1/core/common-modules/items?module=${moduleKey}`,
      {
        method: "POST",
        body: JSON.stringify(buildInlineCommonModulePayload(moduleKey, normalizedQuery)),
      }
    )

    setLookupState((current) => ({
      ...current,
      [moduleKey]: [...current[moduleKey], response.item],
    }))

    return response.item
  }

  useEffect(() => {
    let cancelled = false
    async function loadWorkspaceData() {
      setIsLoading(true)
      setLoadError(null)
      setFormError(null)
      try {
        const lookupEntries = await Promise.all(
          lookupModules.map(async (moduleKey) => {
            const response = await requestJson<{ items: CommonModuleItem[]; module: ContactLookupModuleKey }>(
              `/internal/v1/core/common-modules/items?module=${moduleKey}`
            )
            return [moduleKey, response.items] as const
          })
        )
        if (cancelled) return
        setLookupState(Object.fromEntries(lookupEntries) as LookupState)
        if (!contactId) {
          setForm(createDefaultContactFormValues())
          setIsLoading(false)
          return
        }
        const contact = await requestJson<ContactResponse>(
          `/internal/v1/core/contact?id=${encodeURIComponent(contactId)}`
        )
        if (!cancelled) {
          setForm(toContactFormValues(contact.item))
          setIsLoading(false)
        }
      } catch (error) {
        if (!cancelled) {
          setLoadError(error instanceof Error ? error.message : "Failed to load contact workspace data.")
          setIsLoading(false)
        }
      }
    }
    void loadWorkspaceData()
    return () => {
      cancelled = true
    }
  }, [contactId])

  useEffect(() => {
    setForm((current) => {
      if (current.gstDetails.length === 0) {
        return {
          ...current,
          gstDetails: [{ ...createEmptyContactGst(), gstin: current.gstin }],
        }
      }

      if (current.gstDetails[0]?.gstin === current.gstin) {
        return current
      }

      return {
        ...current,
        gstDetails: updateCollectionItem(current.gstDetails, 0, (item) => ({
          ...item,
          gstin: current.gstin,
        })),
      }
    })
  }, [form.gstin])

  const tabs = useMemo(
    () =>
      [
        {
          label: "Details",
          value: "details",
          content: (
            <ContactFormSectionCard>
              <div className="grid gap-4 md:grid-cols-2">
                <ContactField label="Name" error={fieldErrors.name}>
                  <ContactTextField error={getFieldError("name")} value={form.name} onChange={(event) => setForm((current) => ({ ...current, name: event.target.value }))} />
                </ContactField>
                <ContactField label="Contact Code" error={getFieldError("code")}>
                  <ContactTextField
                    error={getFieldError("code")}
                    value={form.code ?? ""}
                    onChange={(event) =>
                      setForm((current) => ({ ...current, code: event.target.value.toUpperCase() }))
                    }
                    placeholder="Auto generated if left blank"
                  />
                </ContactField>
                <ContactLookupField
                  label="Contact Type"
                  items={lookupState.contactTypes}
                  value={form.contactTypeId ?? ""}
                  onValueChange={(value) => setForm((current) => ({ ...current, contactTypeId: value }))}
                  createActionLabel='Create new "Contact Type"'
                  error={getFieldError("contactTypeId")}
                  onCreateNew={(query) => {
                    void createLookupItem("contactTypes", query).then((item) => {
                      if (!item) return
                      setForm((current) => ({ ...current, contactTypeId: item.id }))
                    })
                  }}
                />
                <ContactField label="Legal Name">
                  <ContactTextField error={getFieldError("legalName")} value={form.legalName} onChange={(event) => setForm((current) => ({ ...current, legalName: event.target.value }))} />
                </ContactField>
                <ContactField label="GSTIN" error={fieldErrors.gstin}>
                  <ContactTextField error={getFieldError("gstin")} value={form.gstin} onChange={(event) => setForm((current) => ({ ...current, gstin: normalizeUppercase(event.target.value) }))} />
                </ContactField>
                <ContactField label="PAN">
                  <ContactTextField error={getFieldError("pan")} value={form.pan} onChange={(event) => setForm((current) => ({ ...current, pan: event.target.value }))} />
                </ContactField>
                <ContactSelectField label="MSME Type" error={getFieldError("msmeType")} value={form.msmeType} options={contactMsmeTypeOptions} onValueChange={(value) => setForm((current) => ({ ...current, msmeType: value }))} />
                <ContactField label="MSME Number">
                  <ContactTextField error={getFieldError("msmeNo")} value={form.msmeNo} onChange={(event) => setForm((current) => ({ ...current, msmeNo: event.target.value }))} />
                </ContactField>
                <ContactField label="Opening Balance">
                  <Input type="number" step="0.01" value={form.openingBalance} onChange={(event) => setForm((current) => ({ ...current, openingBalance: Number(event.target.value || 0) }))} />
                </ContactField>
                <ContactSelectField label="Balance Type" error={getFieldError("balanceType")} value={form.balanceType} options={contactBalanceTypeOptions} onValueChange={(value) => setForm((current) => ({ ...current, balanceType: value }))} />
                <ContactField label="Credit Limit">
                  <Input type="number" step="0.01" value={form.creditLimit} onChange={(event) => setForm((current) => ({ ...current, creditLimit: Number(event.target.value || 0) }))} />
                </ContactField>
                <ContactField label="Website">
                  <ContactTextField error={getFieldError("website")} value={form.website} onChange={(event) => setForm((current) => ({ ...current, website: event.target.value }))} />
                </ContactField>
                <ContactField label="Description" className="md:col-span-2">
                  <Textarea rows={4} value={form.description} onChange={(event) => setForm((current) => ({ ...current, description: event.target.value }))} />
                </ContactField>
                <div className="md:col-span-2">
                  <ContactStatusField id="contact-status" checked={form.isActive} onCheckedChange={(checked) => setForm((current) => ({ ...current, isActive: checked }))} />
                </div>
              </div>
            </ContactFormSectionCard>
          ),
        },
        {
          label: "Communication",
          value: "communication",
          content: (
            <div className="space-y-4">
              <ContactFormSectionCard title="Emails" description="Primary and supporting email channels." onAdd={() => setForm((current) => ({ ...current, emails: [...current.emails, createEmptyContactEmail()] }))}>
                {form.emails.map((email, index) => (
                  <ContactCollectionRow key={`email-${index}`} onRemove={() => setForm((current) => ({ ...current, emails: current.emails.filter((_, itemIndex) => itemIndex !== index) }))}>
                    <div className="grid gap-4 md:grid-cols-3">
                      <ContactField label="Email" error={getFieldError(`emails.${index}.email`)}><ContactTextField type="email" error={getFieldError(`emails.${index}.email`)} value={email.email} onChange={(event) => setForm((current) => ({ ...current, emails: updateCollectionItem(current.emails, index, (item) => ({ ...item, email: event.target.value })) }))} /></ContactField>
                      <ContactSelectField label="Email Type" value={email.emailType} options={contactEmailTypeOptions} onValueChange={(value) => setForm((current) => ({ ...current, emails: updateCollectionItem(current.emails, index, (item) => ({ ...item, emailType: value })) }))} />
                      <ContactCheckboxField checked={email.isPrimary} label="Primary" onCheckedChange={(checked) => setForm((current) => ({ ...current, emails: updateCollectionItem(current.emails, index, (item) => ({ ...item, isPrimary: checked })) }))} />
                    </div>
                  </ContactCollectionRow>
                ))}
              </ContactFormSectionCard>
              <ContactFormSectionCard title="Phones" description="Phone and messaging channels." onAdd={() => setForm((current) => ({ ...current, phones: [...current.phones, createEmptyContactPhone()] }))}>
                {form.phones.map((phone, index) => (
                  <ContactCollectionRow key={`phone-${index}`} onRemove={() => setForm((current) => ({ ...current, phones: current.phones.filter((_, itemIndex) => itemIndex !== index) }))}>
                    <div className="grid gap-4 md:grid-cols-3">
                      <ContactField label="Phone Number" error={getFieldError(`phones.${index}.phoneNumber`)}><ContactTextField error={getFieldError(`phones.${index}.phoneNumber`)} value={phone.phoneNumber} onChange={(event) => setForm((current) => ({ ...current, phones: updateCollectionItem(current.phones, index, (item) => ({ ...item, phoneNumber: event.target.value })) }))} /></ContactField>
                      <ContactSelectField label="Phone Type" value={phone.phoneType} options={contactPhoneTypeOptions} onValueChange={(value) => setForm((current) => ({ ...current, phones: updateCollectionItem(current.phones, index, (item) => ({ ...item, phoneType: value })) }))} />
                      <ContactCheckboxField checked={phone.isPrimary} label="Primary" onCheckedChange={(checked) => setForm((current) => ({ ...current, phones: updateCollectionItem(current.phones, index, (item) => ({ ...item, isPrimary: checked })) }))} />
                    </div>
                  </ContactCollectionRow>
                ))}
              </ContactFormSectionCard>
            </div>
          ),
        },
        {
          label: "Addressing",
          value: "addressing",
          content: (
            <ContactFormSectionCard title="Addresses" description="Billing, shipping, office, and branch locations." onAdd={() => setForm((current) => ({ ...current, addresses: [...current.addresses, createEmptyContactAddress()] }))}>
              {form.addresses.map((address, index) => (
                <ContactCollectionRow key={`address-${index}`} onRemove={() => setForm((current) => ({ ...current, addresses: current.addresses.filter((_, itemIndex) => itemIndex !== index) }))}>
                  <div className="grid gap-4 md:grid-cols-2">
                    <ContactLookupField label="Address Type" items={lookupState.addressTypes} value={address.addressTypeId} onValueChange={(value) => setForm((current) => ({ ...current, addresses: updateCollectionItem(current.addresses, index, (item) => ({ ...item, addressTypeId: value })) }))} createActionLabel='Create new "Address Type"' onCreateNew={(query) => { void createLookupItem("addressTypes", query).then((item) => { if (!item) return; setForm((current) => ({ ...current, addresses: updateCollectionItem(current.addresses, index, (entry) => ({ ...entry, addressTypeId: item.id })) })) }) }} />
                    <ContactCheckboxField checked={address.isDefault} label="Default address" onCheckedChange={(checked) => setForm((current) => ({ ...current, addresses: updateCollectionItem(current.addresses, index, (item) => ({ ...item, isDefault: checked })) }))} />
                    <ContactField label="Address Line 1" error={getFieldError(`addresses.${index}.addressLine1`)} className="md:col-span-2"><ContactTextField error={getFieldError(`addresses.${index}.addressLine1`)} value={address.addressLine1} onChange={(event) => setForm((current) => ({ ...current, addresses: updateCollectionItem(current.addresses, index, (item) => ({ ...item, addressLine1: event.target.value })) }))} /></ContactField>
                    <ContactField label="Address Line 2" className="md:col-span-2"><ContactTextField value={address.addressLine2} onChange={(event) => setForm((current) => ({ ...current, addresses: updateCollectionItem(current.addresses, index, (item) => ({ ...item, addressLine2: event.target.value })) }))} /></ContactField>
                    <ContactLookupField label="Country" items={lookupState.countries} value={address.countryId} onValueChange={(value) => setForm((current) => ({ ...current, addresses: updateCollectionItem(current.addresses, index, (item) => ({ ...item, countryId: value })) }))} createActionLabel='Create new "Country"' onCreateNew={(query) => { void createLookupItem("countries", query).then((item) => { if (!item) return; setForm((current) => ({ ...current, addresses: updateCollectionItem(current.addresses, index, (entry) => ({ ...entry, countryId: item.id })) })) }) }} />
                    <ContactLookupField label="State" items={lookupState.states} value={address.stateId} onValueChange={(value) => setForm((current) => ({ ...current, addresses: updateCollectionItem(current.addresses, index, (item) => ({ ...item, stateId: value })) }))} createActionLabel='Create new "State"' onCreateNew={(query) => { void createLookupItem("states", query).then((item) => { if (!item) return; setForm((current) => ({ ...current, addresses: updateCollectionItem(current.addresses, index, (entry) => ({ ...entry, stateId: item.id })) })) }) }} />
                    <ContactLookupField label="District" items={lookupState.districts} value={address.districtId} onValueChange={(value) => setForm((current) => ({ ...current, addresses: updateCollectionItem(current.addresses, index, (item) => ({ ...item, districtId: value })) }))} createActionLabel='Create new "District"' onCreateNew={(query) => { void createLookupItem("districts", query).then((item) => { if (!item) return; setForm((current) => ({ ...current, addresses: updateCollectionItem(current.addresses, index, (entry) => ({ ...entry, districtId: item.id })) })) }) }} />
                    <ContactLookupField label="City" items={lookupState.cities} value={address.cityId} onValueChange={(value) => setForm((current) => ({ ...current, addresses: updateCollectionItem(current.addresses, index, (item) => ({ ...item, cityId: value })) }))} createActionLabel='Create new "City"' onCreateNew={(query) => { void createLookupItem("cities", query).then((item) => { if (!item) return; setForm((current) => ({ ...current, addresses: updateCollectionItem(current.addresses, index, (entry) => ({ ...entry, cityId: item.id })) })) }) }} />
                    <ContactLookupField label="Pincode" items={lookupState.pincodes} value={address.pincodeId} onValueChange={(value) => setForm((current) => ({ ...current, addresses: updateCollectionItem(current.addresses, index, (item) => ({ ...item, pincodeId: value })) }))} createActionLabel='Create new "Pincode"' onCreateNew={(query) => { void createLookupItem("pincodes", query).then((item) => { if (!item) return; setForm((current) => ({ ...current, addresses: updateCollectionItem(current.addresses, index, (entry) => ({ ...entry, pincodeId: item.id })) })) }) }} />
                    <div className="hidden md:block" aria-hidden="true" />
                    <ContactField label="Latitude" className="md:col-span-1"><Input type="number" step="0.0000001" value={address.latitude ?? ""} onChange={(event) => setForm((current) => ({ ...current, addresses: updateCollectionItem(current.addresses, index, (item) => ({ ...item, latitude: event.target.value ? Number(event.target.value) : null })) }))} /></ContactField>
                    <ContactField label="Longitude" className="md:col-span-1"><Input type="number" step="0.0000001" value={address.longitude ?? ""} onChange={(event) => setForm((current) => ({ ...current, addresses: updateCollectionItem(current.addresses, index, (item) => ({ ...item, longitude: event.target.value ? Number(event.target.value) : null })) }))} /></ContactField>
                  </div>
                </ContactCollectionRow>
              ))}
            </ContactFormSectionCard>
          ),
        },
        {
          label: "Finance",
          value: "finance",
          content: (
            <div className="space-y-4">
              <ContactFormSectionCard title="Bank Accounts" description="Settlement accounts and payment banking details." onAdd={() => setForm((current) => ({ ...current, bankAccounts: [...current.bankAccounts, createEmptyContactBank()] }))}>
                {form.bankAccounts.map((account, index) => (
                  <ContactCollectionRow key={`bank-${index}`} onRemove={() => setForm((current) => ({ ...current, bankAccounts: current.bankAccounts.filter((_, itemIndex) => itemIndex !== index) }))}>
                    <div className="grid gap-4 md:grid-cols-2">
                      <ContactField label="Bank Name">
                        <SearchableLookupField
                          error={getFieldError(`bankAccounts.${index}.bankName`)}
                          value={account.bankName || undefined}
                          onValueChange={(value) =>
                            setForm((current) => ({
                              ...current,
                              bankAccounts: updateCollectionItem(current.bankAccounts, index, (item) => ({
                                ...item,
                                bankName: value,
                              })),
                            }))
                          }
                          options={lookupState.bankNames.map((item) => ({
                            value: String(item.name ?? item.code ?? item.id),
                            label: String(item.name ?? item.code ?? item.id),
                          }))}
                          placeholder="Select bank name"
                          searchPlaceholder="Search bank name"
                          noResultsMessage="No bank name found."
                          createActionLabel='Create new "Bank Name"'
                          onCreateNew={(query) => {
                            void createLookupItem("bankNames", query).then((item) => {
                              const nextBankName = String(item?.name ?? query).trim()
                              setForm((current) => ({
                                ...current,
                                bankAccounts: updateCollectionItem(current.bankAccounts, index, (entry) => ({
                                  ...entry,
                                  bankName: nextBankName,
                                })),
                              }))
                            })
                          }}
                        />
                      </ContactField>
                      <ContactField label="Branch"><ContactTextField value={account.branch} onChange={(event) => setForm((current) => ({ ...current, bankAccounts: updateCollectionItem(current.bankAccounts, index, (item) => ({ ...item, branch: event.target.value })) }))} /></ContactField>
                      <ContactField label="Account Number" error={getFieldError(`bankAccounts.${index}.accountNumber`)}><ContactTextField error={getFieldError(`bankAccounts.${index}.accountNumber`)} value={account.accountNumber} onChange={(event) => setForm((current) => ({ ...current, bankAccounts: updateCollectionItem(current.bankAccounts, index, (item) => ({ ...item, accountNumber: event.target.value })) }))} /></ContactField>
                      <ContactField label="Account Holder Name" error={getFieldError(`bankAccounts.${index}.accountHolderName`)}><ContactTextField error={getFieldError(`bankAccounts.${index}.accountHolderName`)} value={account.accountHolderName} onChange={(event) => setForm((current) => ({ ...current, bankAccounts: updateCollectionItem(current.bankAccounts, index, (item) => ({ ...item, accountHolderName: event.target.value })) }))} /></ContactField>
                      <ContactField label="IFSC" error={getFieldError(`bankAccounts.${index}.ifsc`)}><ContactTextField error={getFieldError(`bankAccounts.${index}.ifsc`)} value={account.ifsc} onChange={(event) => setForm((current) => ({ ...current, bankAccounts: updateCollectionItem(current.bankAccounts, index, (item) => ({ ...item, ifsc: event.target.value })) }))} /></ContactField>
                      <ContactCheckboxField checked={account.isPrimary} label="Primary account" onCheckedChange={(checked) => setForm((current) => ({ ...current, bankAccounts: updateCollectionItem(current.bankAccounts, index, (item) => ({ ...item, isPrimary: checked })) }))} />
                    </div>
                  </ContactCollectionRow>
                ))}
              </ContactFormSectionCard>
              <ContactFormSectionCard title="GST Details" description="GST registrations for the contact." onAdd={() => setForm((current) => ({ ...current, gstDetails: [...current.gstDetails, createEmptyContactGst()] }))}>
                {form.gstDetails.map((detail, index) => (
                  <ContactCollectionRow key={`gst-${index}`} onRemove={() => setForm((current) => ({ ...current, gstDetails: current.gstDetails.filter((_, itemIndex) => itemIndex !== index) }))}>
                    <div className="grid gap-4 md:grid-cols-3">
                      <ContactField label="GSTIN" error={getFieldError(`gstDetails.${index}.gstin`)}><ContactTextField error={getFieldError(`gstDetails.${index}.gstin`)} value={detail.gstin} onChange={(event) => setForm((current) => ({ ...current, gstDetails: updateCollectionItem(current.gstDetails, index, (item) => ({ ...item, gstin: normalizeUppercase(event.target.value) })) }))} /></ContactField>
                      <ContactField label="State">
                        <SearchableLookupField
                          error={getFieldError(`gstDetails.${index}.state`)}
                          value={detail.state || undefined}
                          onValueChange={(value) =>
                            setForm((current) => ({
                              ...current,
                              gstDetails: updateCollectionItem(current.gstDetails, index, (item) => ({
                                ...item,
                                state: value,
                              })),
                            }))
                          }
                          options={lookupState.states.map((item) => ({
                            value: String(item.name ?? item.code ?? item.id),
                            label: String(item.name ?? item.code ?? item.id),
                          }))}
                          placeholder="Select state"
                          searchPlaceholder="Search state"
                          noResultsMessage="No state found."
                          createActionLabel='Create new "State"'
                          onCreateNew={(query) => {
                            void createLookupItem("states", query).then((item) => {
                              const nextState = String(item?.name ?? query).trim()
                              setForm((current) => ({
                                ...current,
                                gstDetails: updateCollectionItem(current.gstDetails, index, (entry) => ({
                                  ...entry,
                                  state: nextState,
                                })),
                              }))
                            })
                          }}
                        />
                      </ContactField>
                      <ContactCheckboxField checked={detail.isDefault} label="Default" onCheckedChange={(checked) => setForm((current) => ({ ...current, gstDetails: updateCollectionItem(current.gstDetails, index, (item) => ({ ...item, isDefault: checked })) }))} />
                    </div>
                  </ContactCollectionRow>
                ))}
              </ContactFormSectionCard>
            </div>
          ),
        },
      ] satisfies AnimatedContentTab[],
    [fieldErrors.gstin, fieldErrors.name, form, lookupState]
  )

  async function handleSave() {
    const nextFieldErrors = validateContactForm(form, lookupState)
    setFieldErrors(nextFieldErrors)
    if (Object.keys(nextFieldErrors).length > 0) {
      setFormError("Validation failed. Fix the highlighted fields and save again.")
      return
    }
    setIsSaving(true)
    setFormError(null)
    try {
      if (contactId) {
        await requestJson<ContactResponse>(`/internal/v1/core/contact?id=${encodeURIComponent(contactId)}`, {
          method: "PATCH",
          body: JSON.stringify(form),
        })
      } else {
        await requestJson<ContactResponse>("/internal/v1/core/contacts", {
          method: "POST",
          body: JSON.stringify(form),
        })
      }
      void navigate("/dashboard/apps/core/contacts")
    } catch (error) {
      if (error instanceof Error) {
        const nextServerFieldErrors: ContactFieldErrors = {}
        for (const line of error.message.split("\n")) {
          const separatorIndex = line.indexOf(": ")
          if (separatorIndex <= 0) {
            continue
          }
          const rawPath = line.slice(0, separatorIndex).trim()
          const message = line.slice(separatorIndex + 2).trim()
          if (!rawPath || !message) {
            continue
          }
          nextServerFieldErrors[normalizeFieldPath(rawPath.split(" > "))] = message
        }
        if (Object.keys(nextServerFieldErrors).length > 0) {
          setFieldErrors((current) => ({ ...current, ...nextServerFieldErrors }))
          setFormError(
            Object.entries(nextServerFieldErrors)
              .map(([path, message]) => humanizeServerIssue(path, message))
              .join("\n")
          )
          return
        }
      }
      setFormError(error instanceof Error ? error.message : `Failed to save ${form.name || "contact"}.`)
    } finally {
      setIsSaving(false)
    }
  }

  if (isLoading) return <LoadingCard message="Loading contact form..." />
  if (loadError) return <StateCard message={loadError} />

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
        <div className="space-y-2">
          <Button variant="ghost" size="sm" asChild className="-ml-3 w-fit">
            <Link to="/dashboard/apps/core/contacts">
              <ArrowLeftIcon className="size-4" />
              Back to contacts
            </Link>
          </Button>
          <div className="space-y-1">
            <h1 className="text-2xl font-semibold tracking-tight text-foreground">
              {isEditing ? "Update Contact" : "Create Contact"}
            </h1>
            <p className="max-w-3xl text-sm leading-6 text-muted-foreground">
              Capture contact identity, tax, addresses, communication channels, and banking details in one structured workspace.
            </p>
          </div>
        </div>
        <div className="flex flex-wrap items-center gap-3">
          <Button type="button" variant="outline" onClick={() => { void navigate("/dashboard/apps/core/contacts") }} disabled={isSaving}>
            Cancel
          </Button>
          <Button type="button" onClick={() => void handleSave()} disabled={isSaving}>
            {isSaving ? "Saving..." : isEditing ? "Update Contact" : "Save Contact"}
          </Button>
        </div>
      </div>

      {formError ? <ContactFormMessage>{formError}</ContactFormMessage> : null}

      <AnimatedTabs defaultTabValue="details" tabs={tabs} />
    </div>
  )
}
