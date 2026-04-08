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

import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog"
import { showAppToast, showRecordToast } from "@/components/ui/app-toast"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
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
  onDeactivate: () => Promise<void>
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

const deleteAccountConfirmationText = "DELETE ACCOUNT"

function createLookupState(response?: CustomerProfileLookupResponse): LookupState {
  return {
    contactTypes: [],
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
  onDeactivate,
}: CustomerProfileSectionProps) {
  const [form, setForm] = useState<CustomerProfileFormState>(() => createFormState(profile))
  const [lookupState, setLookupState] = useState<LookupState>(createLookupState())
  const [error, setError] = useState<string | null>(null)
  const [isSaving, setIsSaving] = useState(false)
  const [isDeleting, setIsDeleting] = useState(false)
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false)
  const [deleteConfirmationValue, setDeleteConfirmationValue] = useState("")
  const [isLoadingLookups, setIsLoadingLookups] = useState(true)
  useGlobalLoading(isSaving || isDeleting)

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

  async function handleDeactivate() {
    setIsDeleting(true)
    setError(null)

    try {
      await onDeactivate()
      setIsDeleteDialogOpen(false)
      setDeleteConfirmationValue("")
      showAppToast({
        variant: "success",
        title: "Account deactivated.",
        description: "Your customer portal account was deactivated successfully.",
      })
    } catch (deleteError) {
      setError(
        deleteError instanceof Error
          ? deleteError.message
          : "Failed to deactivate customer account."
      )
      throw deleteError
    } finally {
      setIsDeleting(false)
    }
  }

  function handleDeleteDialogOpenChange(nextOpen: boolean) {
    if (isDeleting && !nextOpen) {
      return
    }

    setIsDeleteDialogOpen(nextOpen)

    if (!nextOpen) {
      setDeleteConfirmationValue("")
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
        {
          label: "Addressing",
          value: "addressing",
          content: (
            <ContactFormSectionCard
              title="Addresses"
              description="Billing and shipping address details used across checkout and order delivery."
              onAdd={() =>
                setForm((current) => ({
                  ...current,
                  addresses: [...current.addresses, createEmptyContactAddress()],
                }))
              }
            >
              {form.addresses.map((address, index) => (
                <ContactCollectionRow
                  key={`address-${index}`}
                  onRemove={() =>
                    setForm((current) => ({
                      ...current,
                      addresses: current.addresses.filter((_, itemIndex) => itemIndex !== index),
                    }))
                  }
                >
                  <div className="grid gap-4 md:grid-cols-2">
                    <ContactLookupField
                      label="Address Type"
                      items={lookupState.addressTypes}
                      value={address.addressTypeId}
                      onValueChange={(value) =>
                        setForm((current) => ({
                          ...current,
                          addresses: updateCollectionItem(current.addresses, index, (item) => ({
                            ...item,
                            addressTypeId: value,
                          })),
                        }))
                      }
                    />
                    <ContactCheckboxField
                      checked={address.isDefault}
                      label="Default address"
                      onCheckedChange={(checked) =>
                        setForm((current) => ({
                          ...current,
                          addresses: updateCollectionItem(current.addresses, index, (item) => ({
                            ...item,
                            isDefault: checked,
                          })),
                        }))
                      }
                    />
                    <ContactField label="Address Line 1" className="md:col-span-2">
                      <ContactTextField
                        value={address.addressLine1}
                        onChange={(event) =>
                          setForm((current) => ({
                            ...current,
                            addresses: updateCollectionItem(current.addresses, index, (item) => ({
                              ...item,
                              addressLine1: event.target.value,
                            })),
                          }))
                        }
                      />
                    </ContactField>
                    <ContactField label="Address Line 2" className="md:col-span-2">
                      <ContactTextField
                        value={address.addressLine2}
                        onChange={(event) =>
                          setForm((current) => ({
                            ...current,
                            addresses: updateCollectionItem(current.addresses, index, (item) => ({
                              ...item,
                              addressLine2: event.target.value,
                            })),
                          }))
                        }
                      />
                    </ContactField>
                    <ContactLookupField
                      label="Country"
                      items={lookupState.countries}
                      value={address.countryId}
                      onValueChange={(value) =>
                        setForm((current) => ({
                          ...current,
                          addresses: updateCollectionItem(current.addresses, index, (item) => ({
                            ...item,
                            countryId: value,
                          })),
                        }))
                      }
                    />
                    <ContactLookupField
                      label="State"
                      items={lookupState.states}
                      value={address.stateId}
                      onValueChange={(value) =>
                        setForm((current) => ({
                          ...current,
                          addresses: updateCollectionItem(current.addresses, index, (item) => ({
                            ...item,
                            stateId: value,
                          })),
                        }))
                      }
                    />
                    <ContactLookupField
                      label="District"
                      items={lookupState.districts}
                      value={address.districtId}
                      onValueChange={(value) =>
                        setForm((current) => ({
                          ...current,
                          addresses: updateCollectionItem(current.addresses, index, (item) => ({
                            ...item,
                            districtId: value,
                          })),
                        }))
                      }
                    />
                    <ContactLookupField
                      label="City"
                      items={lookupState.cities}
                      value={address.cityId}
                      onValueChange={(value) =>
                        setForm((current) => ({
                          ...current,
                          addresses: updateCollectionItem(current.addresses, index, (item) => ({
                            ...item,
                            cityId: value,
                          })),
                        }))
                      }
                    />
                    <ContactLookupField
                      label="Pincode"
                      items={lookupState.pincodes}
                      value={address.pincodeId}
                      onValueChange={(value) =>
                        setForm((current) => ({
                          ...current,
                          addresses: updateCollectionItem(current.addresses, index, (item) => ({
                            ...item,
                            pincodeId: value,
                          })),
                        }))
                      }
                    />
                    <div className="hidden md:block" aria-hidden="true" />
                    <ContactField label="Latitude" className="md:col-span-1">
                      <Input
                        type="number"
                        step="0.0000001"
                        value={address.latitude ?? ""}
                        onChange={(event) =>
                          setForm((current) => ({
                            ...current,
                            addresses: updateCollectionItem(current.addresses, index, (item) => ({
                              ...item,
                              latitude: event.target.value ? Number(event.target.value) : null,
                            })),
                          }))
                        }
                      />
                    </ContactField>
                    <ContactField label="Longitude" className="md:col-span-1">
                      <Input
                        type="number"
                        step="0.0000001"
                        value={address.longitude ?? ""}
                        onChange={(event) =>
                          setForm((current) => ({
                            ...current,
                            addresses: updateCollectionItem(current.addresses, index, (item) => ({
                              ...item,
                              longitude: event.target.value ? Number(event.target.value) : null,
                            })),
                          }))
                        }
                      />
                    </ContactField>
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
              <ContactFormSectionCard
                title="Bank Accounts"
                description="Bank Accounts for refund purpose and customer banking details."
                onAdd={() =>
                  setForm((current) => ({
                    ...current,
                    bankAccounts: [...current.bankAccounts, createEmptyContactBank()],
                  }))
                }
              >
                {form.bankAccounts.map((account, index) => (
                  <ContactCollectionRow
                    key={`bank-${index}`}
                    onRemove={() =>
                      setForm((current) => ({
                        ...current,
                        bankAccounts: current.bankAccounts.filter(
                          (_, itemIndex) => itemIndex !== index
                        ),
                      }))
                    }
                  >
                    <div className="grid gap-4 md:grid-cols-2">
                      <ContactField label="Bank Name">
                        <SearchableLookupField
                          value={account.bankName || undefined}
                          onValueChange={(value) =>
                            setForm((current) => ({
                              ...current,
                              bankAccounts: updateCollectionItem(
                                current.bankAccounts,
                                index,
                                (item) => ({
                                  ...item,
                                  bankName: value,
                                })
                              ),
                            }))
                          }
                          options={lookupState.bankNames.map((item) => ({
                            value: String(item.name ?? item.code ?? item.id),
                            label: String(item.name ?? item.code ?? item.id),
                          }))}
                          placeholder="Select bank name"
                          searchPlaceholder="Search bank name"
                          noResultsMessage="No bank name found."
                        />
                      </ContactField>
                      <ContactField label="Branch">
                        <ContactTextField
                          value={account.branch}
                          onChange={(event) =>
                            setForm((current) => ({
                              ...current,
                              bankAccounts: updateCollectionItem(
                                current.bankAccounts,
                                index,
                                (item) => ({
                                  ...item,
                                  branch: event.target.value,
                                })
                              ),
                            }))
                          }
                        />
                      </ContactField>
                      <ContactField label="Account Number">
                        <ContactTextField
                          value={account.accountNumber}
                          onChange={(event) =>
                            setForm((current) => ({
                              ...current,
                              bankAccounts: updateCollectionItem(
                                current.bankAccounts,
                                index,
                                (item) => ({
                                  ...item,
                                  accountNumber: event.target.value,
                                })
                              ),
                            }))
                          }
                        />
                      </ContactField>
                      <ContactField label="Account Holder Name">
                        <ContactTextField
                          value={account.accountHolderName}
                          onChange={(event) =>
                            setForm((current) => ({
                              ...current,
                              bankAccounts: updateCollectionItem(
                                current.bankAccounts,
                                index,
                                (item) => ({
                                  ...item,
                                  accountHolderName: event.target.value,
                                })
                              ),
                            }))
                          }
                        />
                      </ContactField>
                      <ContactField label="IFSC">
                        <ContactTextField
                          value={account.ifsc}
                          onChange={(event) =>
                            setForm((current) => ({
                              ...current,
                              bankAccounts: updateCollectionItem(
                                current.bankAccounts,
                                index,
                                (item) => ({
                                  ...item,
                                  ifsc: event.target.value.toUpperCase(),
                                })
                              ),
                            }))
                          }
                        />
                      </ContactField>
                      <ContactCheckboxField
                        checked={account.isPrimary}
                        label="Primary account"
                        onCheckedChange={(checked) =>
                          setForm((current) => ({
                            ...current,
                            bankAccounts: updateCollectionItem(
                              current.bankAccounts,
                              index,
                              (item) => ({
                                ...item,
                                isPrimary: checked,
                              })
                            ),
                          }))
                        }
                      />
                    </div>
                  </ContactCollectionRow>
                ))}
              </ContactFormSectionCard>
              <ContactFormSectionCard
                title="GST Details"
                description="GST for registered B2B customer."
                onAdd={() =>
                  setForm((current) => ({
                    ...current,
                    gstDetails: [...current.gstDetails, createEmptyContactGst()],
                  }))
                }
              >
                {form.gstDetails.map((detail, index) => (
                  <ContactCollectionRow
                    key={`gst-${index}`}
                    onRemove={() =>
                      setForm((current) => ({
                        ...current,
                        gstDetails: current.gstDetails.filter(
                          (_, itemIndex) => itemIndex !== index
                        ),
                      }))
                    }
                  >
                    <div className="grid gap-4 md:grid-cols-3">
                      <ContactField label="GSTIN">
                        <ContactTextField
                          value={detail.gstin}
                          onChange={(event) =>
                            setForm((current) => ({
                              ...current,
                              gstDetails: updateCollectionItem(current.gstDetails, index, (item) => ({
                                ...item,
                                gstin: normalizeUppercase(event.target.value),
                              })),
                            }))
                          }
                        />
                      </ContactField>
                      <ContactField label="State">
                        <SearchableLookupField
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
                        />
                      </ContactField>
                      <ContactCheckboxField
                        checked={detail.isDefault}
                        label="Default"
                        onCheckedChange={(checked) =>
                          setForm((current) => ({
                            ...current,
                            gstDetails: updateCollectionItem(current.gstDetails, index, (item) => ({
                              ...item,
                              isDefault: checked,
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
        {
          label: "Settings",
          value: "settings",
          content: (
            <Card className="border-destructive/20 bg-destructive/5 py-3 shadow-sm">
              <CardHeader className="space-y-1">
                <CardTitle className="text-destructive">Delete Account</CardTitle>
                <CardDescription className="text-sm leading-6 text-destructive/80">
                  This removes your portal access and marks the account as deactivated for admin review.
                </CardDescription>
              </CardHeader>
              <CardContent className="flex flex-wrap items-center justify-between gap-3 p-5 pt-2">
                <p className="max-w-2xl text-sm leading-6 text-destructive/80">
                  Use this only if you no longer want to access the customer portal with this account.
                </p>
                <Button
                  type="button"
                  variant="destructive"
                  onClick={() => handleDeleteDialogOpenChange(true)}
                  disabled={isSaving || isDeleting}
                >
                  {isDeleting ? "Deleting..." : "Delete account"}
                </Button>
              </CardContent>
            </Card>
          ),
        },
      ] satisfies AnimatedContentTab[],
    [customerTypeLabel, derivedGstin, form, isDeleting, isSaving, lookupState, profile.isActive]
  )

  return (
    <div className="space-y-8 py-2 md:space-y-10 md:py-4">
      <div className="flex flex-col gap-5 lg:flex-row lg:items-start lg:justify-between">
        <div className="space-y-2">
          <h1 className="text-2xl font-semibold tracking-tight text-foreground md:text-3xl">
            Your Profile
          </h1>
          <p className="max-w-3xl text-sm leading-7 text-muted-foreground">
            Keep your account details current so refunds, invoices, delivery updates, and support requests stay accurate and trusted.
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-3">
          <Button
            type="button"
            variant="outline"
            onClick={() => setForm(createFormState(profile))}
            disabled={isSaving}
          >
            Reset
          </Button>
          <Button type="button" onClick={() => void handleSave()} disabled={isSaving || isLoadingLookups}>
            {isSaving ? "Saving..." : "Save profile"}
          </Button>
        </div>
      </div>

      {error ? (
        <Card className="border-amber-200/70 bg-amber-50/70 shadow-sm">
          <CardContent className="whitespace-pre-wrap p-4 text-sm text-amber-950">
            {error}
          </CardContent>
        </Card>
      ) : null}

      <AnimatedTabs defaultTabValue="details" tabs={tabs} />

      <AlertDialog open={isDeleteDialogOpen} onOpenChange={handleDeleteDialogOpenChange}>
        <AlertDialogContent size="default">
          <AlertDialogHeader>
            <AlertDialogTitle className="text-destructive">Delete account?</AlertDialogTitle>
            <AlertDialogDescription className="space-y-2">
              <span className="block">
                This will deactivate your customer portal access immediately and sign you out.
              </span>
              <span className="block">
                Type <span className="font-mono font-semibold text-foreground">{deleteAccountConfirmationText}</span> to confirm.
              </span>
            </AlertDialogDescription>
          </AlertDialogHeader>
          <div className="space-y-2">
            <Label htmlFor="customer-delete-confirmation">Confirmation text</Label>
            <Input
              id="customer-delete-confirmation"
              value={deleteConfirmationValue}
              onChange={(event) => setDeleteConfirmationValue(event.target.value)}
              placeholder={deleteAccountConfirmationText}
              disabled={isDeleting}
            />
          </div>
          <AlertDialogFooter className="border-destructive/15 bg-destructive/5">
            <AlertDialogCancel disabled={isDeleting}>Cancel</AlertDialogCancel>
            <AlertDialogAction
              variant="destructive"
              onClick={() => void handleDeactivate()}
              disabled={
                isDeleting ||
                deleteConfirmationValue.trim() !== deleteAccountConfirmationText
              }
            >
              {isDeleting ? "Deleting..." : "Delete account"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}
