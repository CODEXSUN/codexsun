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
type ContactFieldErrors = Partial<Record<"name" | "gstin", string>>

const lookupModules: ContactLookupModuleKey[] = [
  "contactTypes",
  "addressTypes",
  "countries",
  "states",
  "districts",
  "cities",
  "pincodes",
]

function getCommonModuleRoute(moduleKey: ContactLookupModuleKey) {
  return `/dashboard/apps/core/common-${moduleKey}`
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
    throw new Error(
      payload?.error ?? payload?.message ?? `Request failed with status ${response.status}.`
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

function validateContactForm(values: ContactFormValues) {
  const errors: ContactFieldErrors = {}
  if (values.name.trim().length < 2) {
    errors.name = "Contact name is required."
  }
  if (values.contactTypeId === "contact-type:company" && values.gstin.trim().length === 0) {
    errors.gstin = "GSTIN is required for company contacts."
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

  function openCommonModule(moduleKey: ContactLookupModuleKey) {
    navigate(getCommonModuleRoute(moduleKey))
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
                  <ContactTextField value={form.name} onChange={(event) => setForm((current) => ({ ...current, name: event.target.value }))} />
                </ContactField>
                <ContactLookupField
                  label="Contact Type"
                  items={lookupState.contactTypes}
                  value={form.contactTypeId ?? ""}
                  onValueChange={(value) => setForm((current) => ({ ...current, contactTypeId: value }))}
                  createActionLabel='Create new "Contact Type"'
                  onCreateNew={() => openCommonModule("contactTypes")}
                />
                <ContactField label="Legal Name">
                  <ContactTextField value={form.legalName} onChange={(event) => setForm((current) => ({ ...current, legalName: event.target.value }))} />
                </ContactField>
                <div className="hidden md:block" aria-hidden="true" />
                <ContactField label="GSTIN" error={fieldErrors.gstin}>
                  <ContactTextField value={form.gstin} onChange={(event) => setForm((current) => ({ ...current, gstin: event.target.value }))} />
                </ContactField>
                <ContactField label="PAN">
                  <ContactTextField value={form.pan} onChange={(event) => setForm((current) => ({ ...current, pan: event.target.value }))} />
                </ContactField>
                <ContactSelectField label="MSME Type" value={form.msmeType} options={contactMsmeTypeOptions} onValueChange={(value) => setForm((current) => ({ ...current, msmeType: value }))} />
                <ContactField label="MSME Number">
                  <ContactTextField value={form.msmeNo} onChange={(event) => setForm((current) => ({ ...current, msmeNo: event.target.value }))} />
                </ContactField>
                <ContactField label="Opening Balance">
                  <Input type="number" step="0.01" value={form.openingBalance} onChange={(event) => setForm((current) => ({ ...current, openingBalance: Number(event.target.value || 0) }))} />
                </ContactField>
                <ContactSelectField label="Balance Type" value={form.balanceType} options={contactBalanceTypeOptions} onValueChange={(value) => setForm((current) => ({ ...current, balanceType: value }))} />
                <ContactField label="Credit Limit">
                  <Input type="number" step="0.01" value={form.creditLimit} onChange={(event) => setForm((current) => ({ ...current, creditLimit: Number(event.target.value || 0) }))} />
                </ContactField>
                <ContactField label="Website">
                  <ContactTextField value={form.website} onChange={(event) => setForm((current) => ({ ...current, website: event.target.value }))} />
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
                      <ContactField label="Email"><Input type="email" value={email.email} onChange={(event) => setForm((current) => ({ ...current, emails: updateCollectionItem(current.emails, index, (item) => ({ ...item, email: event.target.value })) }))} /></ContactField>
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
                      <ContactField label="Phone Number"><ContactTextField value={phone.phoneNumber} onChange={(event) => setForm((current) => ({ ...current, phones: updateCollectionItem(current.phones, index, (item) => ({ ...item, phoneNumber: event.target.value })) }))} /></ContactField>
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
                    <ContactLookupField label="Address Type" items={lookupState.addressTypes} value={address.addressTypeId} onValueChange={(value) => setForm((current) => ({ ...current, addresses: updateCollectionItem(current.addresses, index, (item) => ({ ...item, addressTypeId: value })) }))} createActionLabel='Create new "Address Type"' onCreateNew={() => openCommonModule("addressTypes")} />
                    <ContactCheckboxField checked={address.isDefault} label="Default address" onCheckedChange={(checked) => setForm((current) => ({ ...current, addresses: updateCollectionItem(current.addresses, index, (item) => ({ ...item, isDefault: checked })) }))} />
                    <ContactField label="Address Line 1" className="md:col-span-2"><ContactTextField value={address.addressLine1} onChange={(event) => setForm((current) => ({ ...current, addresses: updateCollectionItem(current.addresses, index, (item) => ({ ...item, addressLine1: event.target.value })) }))} /></ContactField>
                    <ContactField label="Address Line 2" className="md:col-span-2"><ContactTextField value={address.addressLine2} onChange={(event) => setForm((current) => ({ ...current, addresses: updateCollectionItem(current.addresses, index, (item) => ({ ...item, addressLine2: event.target.value })) }))} /></ContactField>
                    <ContactLookupField label="Country" items={lookupState.countries} value={address.countryId} onValueChange={(value) => setForm((current) => ({ ...current, addresses: updateCollectionItem(current.addresses, index, (item) => ({ ...item, countryId: value })) }))} createActionLabel='Create new "Country"' onCreateNew={() => openCommonModule("countries")} />
                    <ContactLookupField label="State" items={lookupState.states} value={address.stateId} onValueChange={(value) => setForm((current) => ({ ...current, addresses: updateCollectionItem(current.addresses, index, (item) => ({ ...item, stateId: value })) }))} createActionLabel='Create new "State"' onCreateNew={() => openCommonModule("states")} />
                    <ContactLookupField label="District" items={lookupState.districts} value={address.districtId} onValueChange={(value) => setForm((current) => ({ ...current, addresses: updateCollectionItem(current.addresses, index, (item) => ({ ...item, districtId: value })) }))} createActionLabel='Create new "District"' onCreateNew={() => openCommonModule("districts")} />
                    <ContactLookupField label="City" items={lookupState.cities} value={address.cityId} onValueChange={(value) => setForm((current) => ({ ...current, addresses: updateCollectionItem(current.addresses, index, (item) => ({ ...item, cityId: value })) }))} createActionLabel='Create new "City"' onCreateNew={() => openCommonModule("cities")} />
                    <ContactLookupField label="Pincode" items={lookupState.pincodes} value={address.pincodeId} onValueChange={(value) => setForm((current) => ({ ...current, addresses: updateCollectionItem(current.addresses, index, (item) => ({ ...item, pincodeId: value })) }))} createActionLabel='Create new "Pincode"' onCreateNew={() => openCommonModule("pincodes")} />
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
                      <ContactField label="Bank Name"><ContactTextField value={account.bankName} onChange={(event) => setForm((current) => ({ ...current, bankAccounts: updateCollectionItem(current.bankAccounts, index, (item) => ({ ...item, bankName: event.target.value })) }))} /></ContactField>
                      <ContactField label="Branch"><ContactTextField value={account.branch} onChange={(event) => setForm((current) => ({ ...current, bankAccounts: updateCollectionItem(current.bankAccounts, index, (item) => ({ ...item, branch: event.target.value })) }))} /></ContactField>
                      <ContactField label="Account Number"><ContactTextField value={account.accountNumber} onChange={(event) => setForm((current) => ({ ...current, bankAccounts: updateCollectionItem(current.bankAccounts, index, (item) => ({ ...item, accountNumber: event.target.value })) }))} /></ContactField>
                      <ContactField label="Account Holder Name"><ContactTextField value={account.accountHolderName} onChange={(event) => setForm((current) => ({ ...current, bankAccounts: updateCollectionItem(current.bankAccounts, index, (item) => ({ ...item, accountHolderName: event.target.value })) }))} /></ContactField>
                      <ContactField label="IFSC"><ContactTextField value={account.ifsc} onChange={(event) => setForm((current) => ({ ...current, bankAccounts: updateCollectionItem(current.bankAccounts, index, (item) => ({ ...item, ifsc: event.target.value })) }))} /></ContactField>
                      <ContactCheckboxField checked={account.isPrimary} label="Primary account" onCheckedChange={(checked) => setForm((current) => ({ ...current, bankAccounts: updateCollectionItem(current.bankAccounts, index, (item) => ({ ...item, isPrimary: checked })) }))} />
                    </div>
                  </ContactCollectionRow>
                ))}
              </ContactFormSectionCard>
              <ContactFormSectionCard title="GST Details" description="GST registrations for the contact." onAdd={() => setForm((current) => ({ ...current, gstDetails: [...current.gstDetails, createEmptyContactGst()] }))}>
                {form.gstDetails.map((detail, index) => (
                  <ContactCollectionRow key={`gst-${index}`} onRemove={() => setForm((current) => ({ ...current, gstDetails: current.gstDetails.filter((_, itemIndex) => itemIndex !== index) }))}>
                    <div className="grid gap-4 md:grid-cols-3">
                      <ContactField label="GSTIN"><ContactTextField value={detail.gstin} onChange={(event) => setForm((current) => ({ ...current, gstDetails: updateCollectionItem(current.gstDetails, index, (item) => ({ ...item, gstin: event.target.value })) }))} /></ContactField>
                      <ContactField label="State"><ContactTextField value={detail.state} onChange={(event) => setForm((current) => ({ ...current, gstDetails: updateCollectionItem(current.gstDetails, index, (item) => ({ ...item, state: event.target.value })) }))} /></ContactField>
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
    const nextFieldErrors = validateContactForm(form)
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
