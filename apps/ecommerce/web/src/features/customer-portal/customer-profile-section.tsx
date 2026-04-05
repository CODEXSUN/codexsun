import { useEffect, useMemo, useState } from "react"

import type {
  CommonModuleItem,
  ContactAddressInput,
  ContactBankAccountInput,
  ContactEmailInput,
  ContactGstDetailInput,
  ContactPhoneInput,
} from "@core/shared"
import type {
  CustomerProfile,
  CustomerProfileLookupResponse,
  CustomerProfileUpdatePayload,
} from "@ecommerce/shared"

import { showRecordToast } from "@/components/ui/app-toast"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { useGlobalLoading } from "@/features/dashboard/loading/global-loading-provider"
import { SearchableLookupField } from "@/features/forms/searchable-lookup-field"
import { getActivityStatusPanelClassName } from "@/features/status/activity-status"
import { cn } from "@/lib/utils"
import { AnimatedTabs, type AnimatedContentTab } from "@/registry/concerns/navigation/animated-tabs"
import { storefrontApi } from "../../api/storefront-api"
import {
  contactEmailTypeOptions,
  contactPhoneTypeOptions,
  createEmptyContactAddress,
  createEmptyContactBank,
  createEmptyContactEmail,
  createEmptyContactGst,
  createEmptyContactPhone,
  type ContactLookupModuleKey,
} from "@core/web/src/features/contact/contact-form-state"
import {
  ContactCheckboxField,
  ContactCollectionRow,
  ContactField,
  ContactFormSectionCard,
  ContactLookupField,
  ContactSelectField,
  ContactTextField,
} from "@core/web/src/features/contact/contact-form-sections"

type CustomerProfileSectionProps = {
  accessToken: string
  profile: CustomerProfile
  onSave: (payload: CustomerProfileUpdatePayload) => Promise<void>
}

type LookupState = Record<ContactLookupModuleKey, CommonModuleItem[]>

type CustomerProfileFormState = {
  displayName: string
  companyName: string
  legalName: string
  website: string
  emails: ContactEmailInput[]
  phones: ContactPhoneInput[]
  addresses: ContactAddressInput[]
  bankAccounts: ContactBankAccountInput[]
  gstDetails: ContactGstDetailInput[]
}

const lookupModules: ContactLookupModuleKey[] = [
  "addressTypes",
  "bankNames",
  "countries",
  "states",
  "districts",
  "cities",
  "pincodes",
]

function createLookupState(response?: CustomerProfileLookupResponse): LookupState {
  return {
    addressTypes: response?.addressTypes ?? [],
    bankNames: response?.bankNames ?? [],
    countries: response?.countries ?? [],
    states: response?.states ?? [],
    districts: response?.districts ?? [],
    cities: response?.cities ?? [],
    pincodes: response?.pincodes ?? [],
  }
}

function createFormState(profile: CustomerProfile): CustomerProfileFormState {
  return {
    displayName: profile.displayName,
    companyName: profile.companyName ?? "",
    legalName: profile.legalName ?? "",
    website: profile.website ?? "",
    emails: profile.emails.length
      ? profile.emails.map((entry) => ({
          email: entry.email,
          emailType: entry.emailType,
          isPrimary: entry.isPrimary,
        }))
      : [createEmptyContactEmail()],
    phones: profile.phones.length
      ? profile.phones.map((entry) => ({
          phoneNumber: entry.phoneNumber,
          phoneType: entry.phoneType,
          isPrimary: entry.isPrimary,
        }))
      : [createEmptyContactPhone()],
    addresses: profile.addresses.length
      ? profile.addresses.map((entry) => ({
          addressTypeId: entry.addressTypeId ?? "1",
          addressLine1: entry.addressLine1,
          addressLine2: entry.addressLine2 ?? "",
          cityId: entry.cityId ?? "1",
          districtId: entry.districtId ?? "1",
          stateId: entry.stateId ?? "1",
          countryId: entry.countryId ?? "1",
          pincodeId: entry.pincodeId ?? "1",
          latitude: entry.latitude,
          longitude: entry.longitude,
          isDefault: entry.isDefault,
        }))
      : [createEmptyContactAddress()],
    bankAccounts: profile.bankAccounts.length
      ? profile.bankAccounts.map((entry) => ({
          bankName: entry.bankName,
          accountNumber: entry.accountNumber,
          accountHolderName: entry.accountHolderName,
          ifsc: entry.ifsc,
          branch: entry.branch ?? "",
          isPrimary: entry.isPrimary,
        }))
      : [createEmptyContactBank()],
    gstDetails: profile.gstDetails.length
      ? profile.gstDetails.map((entry) => ({
          gstin: entry.gstin,
          state: entry.state,
          isDefault: entry.isDefault,
        }))
      : [createEmptyContactGst()],
  }
}

function updateCollectionItem<T>(items: T[], index: number, recipe: (item: T) => T) {
  return items.map((item, itemIndex) => (itemIndex === index ? recipe(item) : item))
}

function normalizeUppercase(value: string) {
  return value.toUpperCase()
}

function isMeaningfulValue(value: string | null | undefined) {
  return Boolean(value && value.trim().length > 0 && value.trim() !== "-")
}

function ReadonlyStateField({
  label,
  value,
  active = false,
}: {
  label: string
  value: string
  active?: boolean
}) {
  return (
    <div className="space-y-2">
      <label className="text-sm font-medium leading-none text-foreground">{label}</label>
      <div
        className={cn(
          "flex min-h-14 items-center justify-between rounded-xl px-3 py-2",
          getActivityStatusPanelClassName(active ? "active" : "inactive")
        )}
      >
        <div className="space-y-0.5">
          <p className="text-sm font-medium text-foreground">{value}</p>
          <p className="text-xs text-muted-foreground">
            {label === "Active state"
              ? "This customer profile is available in the portal."
              : "Customer type updates automatically from GST details."}
          </p>
        </div>
      </div>
    </div>
  )
}

export function CustomerProfileSection({
  accessToken,
  profile,
  onSave,
}: CustomerProfileSectionProps) {
  const [form, setForm] = useState<CustomerProfileFormState>(() => createFormState(profile))
  const [lookupState, setLookupState] = useState<LookupState>(createLookupState())
  const [error, setError] = useState<string | null>(null)
  const [isSaving, setIsSaving] = useState(false)
  const [isLoadingLookups, setIsLoadingLookups] = useState(true)
  useGlobalLoading(isSaving)

  useEffect(() => {
    setForm(createFormState(profile))
  }, [profile])

  useEffect(() => {
    let cancelled = false

    async function loadLookups() {
      try {
        setIsLoadingLookups(true)
        const response = await storefrontApi.getCustomerProfileLookups(accessToken)
        if (!cancelled) {
          setLookupState(createLookupState(response))
        }
      } catch (loadError) {
        if (!cancelled) {
          setError(
            loadError instanceof Error
              ? loadError.message
              : "Failed to load customer profile lookups."
          )
        }
      } finally {
        if (!cancelled) {
          setIsLoadingLookups(false)
        }
      }
    }

    void loadLookups()

    return () => {
      cancelled = true
    }
  }, [accessToken])

  const derivedGstin =
    form.gstDetails.find((item) => item.isDefault && isMeaningfulValue(item.gstin))?.gstin ??
    form.gstDetails.find((item) => isMeaningfulValue(item.gstin))?.gstin ??
    ""
  const customerTypeLabel =
    derivedGstin.trim().length > 0 ? "Registered Customer" : "Unregistered Customer"

  async function handleSave() {
    setIsSaving(true)
    setError(null)

    try {
      const primaryPhone =
        form.phones.find((item) => item.isPrimary && isMeaningfulValue(item.phoneNumber)) ??
        form.phones.find((item) => isMeaningfulValue(item.phoneNumber)) ??
        null

      await onSave({
        displayName: form.displayName,
        phoneNumber: primaryPhone?.phoneNumber?.trim() || profile.phoneNumber,
        companyName: form.companyName || null,
        legalName: form.legalName || null,
        gstin: derivedGstin || null,
        website: form.website || null,
        emails: form.emails,
        phones: form.phones,
        addresses: form.addresses,
        bankAccounts: form.bankAccounts,
        gstDetails: form.gstDetails,
      })

      showRecordToast({
        variant: "success",
        action: "saved",
        entity: "Customer profile",
        recordName: form.displayName || profile.displayName,
      })
    } catch (saveError) {
      setError(saveError instanceof Error ? saveError.message : "Failed to save customer profile.")
    } finally {
      setIsSaving(false)
    }
  }

  const tabs = useMemo(
    () =>
      [
        {
          label: "Details",
          value: "details",
          content: (
            <ContactFormSectionCard title="Customer details" description="Keep your profile clear and trustworthy so billing, support, and delivery stay accurate.">
              <div className="grid gap-5 md:grid-cols-2">
                <ContactField label="Full name">
                  <ContactTextField
                    value={form.displayName}
                    onChange={(event) =>
                      setForm((current) => ({ ...current, displayName: event.target.value }))
                    }
                  />
                </ContactField>
                <ContactField label="Company name">
                  <ContactTextField
                    value={form.companyName}
                    onChange={(event) =>
                      setForm((current) => ({ ...current, companyName: event.target.value }))
                    }
                  />
                </ContactField>
                <ContactField label="Legal name" className="md:col-span-2">
                  <ContactTextField
                    value={form.legalName}
                    onChange={(event) =>
                      setForm((current) => ({ ...current, legalName: event.target.value }))
                    }
                  />
                </ContactField>
                <ContactField label="Website" className="md:col-span-2">
                  <ContactTextField
                    value={form.website}
                    onChange={(event) =>
                      setForm((current) => ({ ...current, website: event.target.value }))
                    }
                  />
                </ContactField>
              </div>
              <div className="grid gap-4 md:grid-cols-2">
                <ReadonlyStateField
                  label="Active state"
                  value={profile.isActive ? "Active" : "Inactive"}
                  active={profile.isActive}
                />
                <ReadonlyStateField
                  label="Customer type"
                  value={customerTypeLabel}
                  active={derivedGstin.trim().length > 0}
                />
              </div>
            </ContactFormSectionCard>
          ),
        },
        {
          label: "Communication",
          value: "communication",
          content: (
            <div className="space-y-4">
              <ContactFormSectionCard
                title="Emails"
                description="Primary and supporting customer communication channels."
                onAdd={() =>
                  setForm((current) => ({
                    ...current,
                    emails: [...current.emails, createEmptyContactEmail()],
                  }))
                }
              >
                {form.emails.map((email, index) => (
                  <ContactCollectionRow
                    key={`email-${index}`}
                    onRemove={() =>
                      setForm((current) => ({
                        ...current,
                        emails: current.emails.filter((_, itemIndex) => itemIndex !== index),
                      }))
                    }
                  >
                    <div className="grid gap-4 md:grid-cols-3">
                      <ContactField label="Email">
                        <ContactTextField
                          type="email"
                          value={email.email}
                          onChange={(event) =>
                            setForm((current) => ({
                              ...current,
                              emails: updateCollectionItem(current.emails, index, (item) => ({
                                ...item,
                                email: event.target.value,
                              })),
                            }))
                          }
                        />
                      </ContactField>
                      <ContactSelectField
                        label="Email Type"
                        value={email.emailType}
                        options={contactEmailTypeOptions}
                        onValueChange={(value) =>
                          setForm((current) => ({
                            ...current,
                            emails: updateCollectionItem(current.emails, index, (item) => ({
                              ...item,
                              emailType: value,
                            })),
                          }))
                        }
                      />
                      <ContactCheckboxField
                        checked={email.isPrimary}
                        label="Primary"
                        onCheckedChange={(checked) =>
                          setForm((current) => ({
                            ...current,
                            emails: updateCollectionItem(current.emails, index, (item) => ({
                              ...item,
                              isPrimary: checked,
                            })),
                          }))
                        }
                      />
                    </div>
                  </ContactCollectionRow>
                ))}
              </ContactFormSectionCard>
              <ContactFormSectionCard
                title="Phones"
                description="Phone and messaging channels used for order and account updates."
                onAdd={() =>
                  setForm((current) => ({
                    ...current,
                    phones: [...current.phones, createEmptyContactPhone()],
                  }))
                }
              >
                {form.phones.map((phone, index) => (
                  <ContactCollectionRow
                    key={`phone-${index}`}
                    onRemove={() =>
                      setForm((current) => ({
                        ...current,
                        phones: current.phones.filter((_, itemIndex) => itemIndex !== index),
                      }))
                    }
                  >
                    <div className="grid gap-4 md:grid-cols-3">
                      <ContactField label="Phone Number">
                        <ContactTextField
                          value={phone.phoneNumber}
                          onChange={(event) =>
                            setForm((current) => ({
                              ...current,
                              phones: updateCollectionItem(current.phones, index, (item) => ({
                                ...item,
                                phoneNumber: event.target.value,
                              })),
                            }))
                          }
                        />
                      </ContactField>
                      <ContactSelectField
                        label="Phone Type"
                        value={phone.phoneType}
                        options={contactPhoneTypeOptions}
                        onValueChange={(value) =>
                          setForm((current) => ({
                            ...current,
                            phones: updateCollectionItem(current.phones, index, (item) => ({
                              ...item,
                              phoneType: value,
                            })),
                          }))
                        }
                      />
                      <ContactCheckboxField
                        checked={phone.isPrimary}
                        label="Primary"
                        onCheckedChange={(checked) =>
                          setForm((current) => ({
                            ...current,
                            phones: updateCollectionItem(current.phones, index, (item) => ({
                              ...item,
                              isPrimary: checked,
                            })),
                          }))
                        }
                      />
                    </div>
                  </ContactCollectionRow>
                ))}
              </ContactFormSectionCard>
            </div>
          ),
        },
