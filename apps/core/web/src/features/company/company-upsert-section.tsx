import { useEffect, useMemo, useState } from "react"
import { Link, useNavigate } from "react-router-dom"
import { ArrowLeftIcon } from "lucide-react"

import type { CommonModuleItem } from "@core/shared"
import type { CompanyResponse } from "@cxapp/shared"
import { getStoredAccessToken } from "@cxapp/web/src/auth/session-storage"
import { FrameworkMediaPickerField } from "@cxapp/web/src/features/framework-media/media-picker-field"

import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { useGlobalLoading } from "@/features/dashboard/loading/global-loading-provider"
import { AnimatedTabs, type AnimatedContentTab } from "@/registry/concerns/navigation/animated-tabs"

import {
  companyEmailTypeOptions,
  companyPhoneTypeOptions,
  createDefaultCompanyFormValues,
  createEmptyCompanyAddress,
  createEmptyCompanyBankAccount,
  createEmptyCompanyEmail,
  createEmptyCompanyLogo,
  createEmptyCompanyPhone,
  toCompanyFormValues,
  type CompanyFormValues,
  type CompanyLocationModuleKey,
} from "./company-form-state"
import {
  CompanyCheckboxField,
  CompanyCollectionRow,
  CompanyField,
  CompanyFormMessage,
  CompanyFormSectionCard,
  CompanyLookupField,
  CompanySelectField,
  CompanyStatusField,
  CompanyTextField,
} from "./company-form-sections"

type LookupState = Record<CompanyLocationModuleKey, CommonModuleItem[]>
type CompanyFieldErrors = Partial<Record<keyof CompanyFormValues, string>>

const lookupModules: CompanyLocationModuleKey[] = ["addressTypes", "countries", "states", "districts", "cities", "pincodes"]

function getCommonModuleRoute(moduleKey: CompanyLocationModuleKey) {
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

function updateCollectionItem<T>(
  items: T[],
  index: number,
  recipe: (item: T) => T
) {
  return items.map((item, itemIndex) => (itemIndex === index ? recipe(item) : item))
}

function validateCompanyForm(values: CompanyFormValues) {
  const errors: CompanyFieldErrors = {}

  if (values.name.trim().length < 2) {
    errors.name = "Company name is required."
  }

  return errors
}

export function CompanyUpsertSection({ companyId }: { companyId?: string }) {
  const navigate = useNavigate()
  const isEditing = Boolean(companyId)
  const [form, setForm] = useState<CompanyFormValues>(createDefaultCompanyFormValues())
  const [lookupState, setLookupState] = useState<LookupState>({
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
  const [fieldErrors, setFieldErrors] = useState<CompanyFieldErrors>({})
  useGlobalLoading(isLoading || isSaving)

  function openCommonModule(moduleKey: CompanyLocationModuleKey) {
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
            const response = await requestJson<{
              items: CommonModuleItem[]
              module: CompanyLocationModuleKey
            }>(`/internal/v1/core/common-modules/items?module=${moduleKey}`)
            return [moduleKey, response.items] as const
          })
        )

        if (cancelled) {
          return
        }

        setLookupState(Object.fromEntries(lookupEntries) as LookupState)

        if (!companyId) {
          setForm(createDefaultCompanyFormValues())
          setIsLoading(false)
          return
        }

        const company = await requestJson<CompanyResponse>(
          `/internal/v1/cxapp/company?id=${encodeURIComponent(companyId)}`
        )

        if (!cancelled) {
          setForm(toCompanyFormValues(company.item))
          setIsLoading(false)
        }
      } catch (error) {
        if (!cancelled) {
          setLoadError(
            error instanceof Error ? error.message : "Failed to load company workspace data."
          )
          setIsLoading(false)
        }
      }
    }

    void loadWorkspaceData()

    return () => {
      cancelled = true
    }
  }, [companyId])

  const tabs = useMemo(
    () =>
      [
        {
          label: "Details",
          value: "details",
          content: (
            <div className="space-y-5">
              <CompanyFormSectionCard>
                <div className="grid gap-4 md:grid-cols-2">
                  <CompanyField label="Company Name" error={fieldErrors.name}>
                    <CompanyTextField
                      value={form.name}
                      onChange={(event) =>
                        setForm((current) => ({ ...current, name: event.target.value }))
                      }
                    />
                  </CompanyField>
                  <CompanyField label="Legal Name">
                    <CompanyTextField
                      value={form.legalName}
                      onChange={(event) =>
                        setForm((current) => ({ ...current, legalName: event.target.value }))
                      }
                    />
                  </CompanyField>
                  <CompanyField label="Tagline" className="md:col-span-2">
                    <CompanyTextField
                      value={form.tagline}
                      onChange={(event) =>
                        setForm((current) => ({ ...current, tagline: event.target.value }))
                      }
                    />
                  </CompanyField>
                  <CompanyCheckboxField
                    checked={form.isPrimary}
                    label="Primary company for application branding"
                    onCheckedChange={(checked) =>
                      setForm((current) => ({ ...current, isPrimary: checked }))
                    }
                  />
                  <div className="hidden md:block" aria-hidden="true" />
                  <CompanyField label="Registration Number">
                    <CompanyTextField
                      value={form.registrationNumber}
                      onChange={(event) =>
                        setForm((current) => ({
                          ...current,
                          registrationNumber: event.target.value,
                        }))
                      }
                    />
                  </CompanyField>
                  <CompanyField label="PAN">
                    <CompanyTextField
                      value={form.pan}
                      onChange={(event) =>
                        setForm((current) => ({ ...current, pan: event.target.value }))
                      }
                    />
                  </CompanyField>
                  <CompanyField label="Financial Year Start">
                    <Input
                      type="date"
                      value={form.financialYearStart}
                      onChange={(event) =>
                        setForm((current) => ({
                          ...current,
                          financialYearStart: event.target.value,
                        }))
                      }
                    />
                  </CompanyField>
                  <CompanyField label="Books Start">
                    <Input
                      type="date"
                      value={form.booksStart}
                      onChange={(event) =>
                        setForm((current) => ({ ...current, booksStart: event.target.value }))
                      }
                    />
                  </CompanyField>
                  <CompanyField label="Website" className="md:col-span-2">
                    <CompanyTextField
                      value={form.website}
                      onChange={(event) =>
                        setForm((current) => ({ ...current, website: event.target.value }))
                      }
                    />
                  </CompanyField>
                  <CompanyField label="Description" className="md:col-span-2">
                    <Textarea
                      rows={4}
                      value={form.description}
                      onChange={(event) =>
                        setForm((current) => ({ ...current, description: event.target.value }))
                      }
                    />
                  </CompanyField>
                  <div className="md:col-span-2">
                    <CompanyStatusField
                      id="company-status"
                      checked={form.isActive}
                      onCheckedChange={(checked) =>
                        setForm((current) => ({ ...current, isActive: checked }))
                      }
                    />
                  </div>
                </div>
              </CompanyFormSectionCard>

              <CompanyFormSectionCard
                title="Company Logos"
                description="Primary, secondary, and favicon branding assets."
                onAdd={() =>
                  setForm((current) => ({
                    ...current,
                    logos: [...current.logos, createEmptyCompanyLogo()],
                  }))
                }
              >
                {form.logos.length === 0 ? (
                  <div className="rounded-[1.25rem] border border-dashed border-border/70 px-4 py-6 text-sm text-muted-foreground">
                    No logos added yet.
                  </div>
                ) : null}
                <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-5">
                  {form.logos.map((logo, index) => (
                    <FrameworkMediaPickerField
                      key={`logo-${index}`}
                      value={logo.logoUrl}
                      previewAlt={`${form.name || "Company"} logo ${index + 1}`}
                      clearLabel="Clear"
                      onChange={(value) =>
                        setForm((current) => ({
                          ...current,
                          logos: updateCollectionItem(current.logos, index, (item) => ({
                            ...item,
                            logoUrl: value,
                          })),
                        }))
                      }
                      footer={
                        <div className="grid gap-2">
                          <Label>Logo Type</Label>
                          <CompanyTextField
                            value={logo.logoType}
                            onChange={(event) =>
                              setForm((current) => ({
                                ...current,
                                logos: updateCollectionItem(current.logos, index, (item) => ({
                                  ...item,
                                  logoType: event.target.value,
                                })),
                              }))
                            }
                          />
                          <Button
                            type="button"
                            variant="ghost"
                            size="sm"
                            className="justify-start px-0 text-muted-foreground"
                            onClick={() =>
                              setForm((current) => ({
                                ...current,
                                logos: current.logos.filter((_, itemIndex) => itemIndex !== index),
                              }))
                            }
                          >
                            Remove card
                          </Button>
                        </div>
                      }
                    />
                  ))}
                </div>
              </CompanyFormSectionCard>
            </div>
          ),
        },
        {
          label: "Content",
          value: "content",
          content: (
            <CompanyFormSectionCard
              title="Brand Content"
              description="About copy used across the application shell, billing surfaces, and public web pages."
            >
              <div className="grid gap-4">
                <CompanyField label="Short About">
                  <Textarea
                    rows={4}
                    value={form.shortAbout}
                    onChange={(event) =>
                      setForm((current) => ({ ...current, shortAbout: event.target.value }))
                    }
                  />
                </CompanyField>
                <CompanyField label="Long About">
                  <Textarea
                    rows={8}
                    value={form.longAbout}
                    onChange={(event) =>
                      setForm((current) => ({ ...current, longAbout: event.target.value }))
                    }
                  />
                </CompanyField>
              </div>
            </CompanyFormSectionCard>
          ),
        },
        {
          label: "Communication",
          value: "communication",
          content: (
            <div className="space-y-5">
              <CompanyFormSectionCard
                title="Company Emails"
                description="Operational and communication email addresses."
                onAdd={() =>
                  setForm((current) => ({
                    ...current,
                    emails: [...current.emails, createEmptyCompanyEmail()],
                  }))
                }
              >
                {form.emails.map((email, index) => (
                  <CompanyCollectionRow
                    key={`email-${index}`}
                    onRemove={() =>
                      setForm((current) => ({
                        ...current,
                        emails: current.emails.filter((_, itemIndex) => itemIndex !== index),
                      }))
                    }
                  >
                    <div className="grid gap-4 md:grid-cols-2">
                      <CompanyField label="Email">
                        <Input
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
                      </CompanyField>
                      <CompanySelectField
                        label="Email Type"
                        value={email.emailType}
                        options={companyEmailTypeOptions}
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
                    </div>
                  </CompanyCollectionRow>
                ))}
              </CompanyFormSectionCard>

              <CompanyFormSectionCard
                title="Company Phones"
                description="Phone and messaging channels used by the company."
                onAdd={() =>
                  setForm((current) => ({
                    ...current,
                    phones: [...current.phones, createEmptyCompanyPhone()],
                  }))
                }
              >
                {form.phones.map((phone, index) => (
                  <CompanyCollectionRow
                    key={`phone-${index}`}
                    onRemove={() =>
                      setForm((current) => ({
                        ...current,
                        phones: current.phones.filter((_, itemIndex) => itemIndex !== index),
                      }))
                    }
                  >
                    <div className="grid gap-4 md:grid-cols-3">
                      <CompanyField label="Phone Number">
                        <CompanyTextField
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
                      </CompanyField>
                      <CompanySelectField
                        label="Phone Type"
                        value={phone.phoneType}
                        options={companyPhoneTypeOptions}
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
                      <CompanyCheckboxField
                        checked={phone.isPrimary}
                        label="Primary phone"
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
                  </CompanyCollectionRow>
                ))}
              </CompanyFormSectionCard>

              <CompanyFormSectionCard
                title="Social Links"
                description="Public brand links used in profile and storefront surfaces."
              >
                <div className="grid gap-4 md:grid-cols-2">
                  <CompanyField label="Facebook URL">
                    <CompanyTextField
                      value={form.facebookUrl}
                      onChange={(event) =>
                        setForm((current) => ({ ...current, facebookUrl: event.target.value }))
                      }
                    />
                  </CompanyField>
                  <CompanyField label="Twitter / X URL">
                    <CompanyTextField
                      value={form.twitterUrl}
                      onChange={(event) =>
                        setForm((current) => ({ ...current, twitterUrl: event.target.value }))
                      }
                    />
                  </CompanyField>
                  <CompanyField label="Instagram URL">
                    <CompanyTextField
                      value={form.instagramUrl}
                      onChange={(event) =>
                        setForm((current) => ({ ...current, instagramUrl: event.target.value }))
                      }
                    />
                  </CompanyField>
                  <CompanyField label="YouTube URL">
                    <CompanyTextField
                      value={form.youtubeUrl}
                      onChange={(event) =>
                        setForm((current) => ({ ...current, youtubeUrl: event.target.value }))
                      }
                    />
                  </CompanyField>
                </div>
              </CompanyFormSectionCard>
            </div>
          ),
        },
        {
          label: "Addressing",
          value: "addressing",
          content: (
            <CompanyFormSectionCard
              title="Company Addresses"
              description="Billing, shipping, branch, and head-office locations."
              onAdd={() =>
                setForm((current) => ({
                  ...current,
                  addresses: [...current.addresses, createEmptyCompanyAddress()],
                }))
              }
            >
              {form.addresses.map((address, index) => (
                <CompanyCollectionRow
                  key={`address-${index}`}
                  onRemove={() =>
                    setForm((current) => ({
                      ...current,
                      addresses: current.addresses.filter((_, itemIndex) => itemIndex !== index),
                    }))
                  }
                >
                  <div className="grid gap-4 md:grid-cols-2">
                    <CompanyLookupField
                      label="Address Type"
                      items={lookupState.addressTypes}
                      value={address.addressTypeId}
                      createActionLabel='Create new "Address Type"'
                      onCreateNew={() => openCommonModule("addressTypes")}
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
                    <CompanyCheckboxField
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
                    <CompanyField label="Address Line 1" className="md:col-span-2">
                      <CompanyTextField
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
                    </CompanyField>
                    <CompanyField label="Address Line 2" className="md:col-span-2">
                      <CompanyTextField
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
                    </CompanyField>
                    <CompanyLookupField
                      label="Country"
                      items={lookupState.countries}
                      value={address.countryId}
                      createActionLabel='Create new "Country"'
                      onCreateNew={() => openCommonModule("countries")}
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
                    <CompanyLookupField
                      label="State"
                      items={lookupState.states}
                      value={address.stateId}
                      createActionLabel='Create new "State"'
                      onCreateNew={() => openCommonModule("states")}
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
                    <CompanyLookupField
                      label="District"
                      items={lookupState.districts}
                      value={address.districtId}
                      createActionLabel='Create new "District"'
                      onCreateNew={() => openCommonModule("districts")}
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
                    <CompanyLookupField
                      label="City"
                      items={lookupState.cities}
                      value={address.cityId}
                      createActionLabel='Create new "City"'
                      onCreateNew={() => openCommonModule("cities")}
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
                    <CompanyLookupField
                      label="Pincode"
                      items={lookupState.pincodes}
                      value={address.pincodeId}
                      createActionLabel='Create new "Pincode"'
                      onCreateNew={() => openCommonModule("pincodes")}
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
                    <CompanyField label="Latitude" className="md:col-span-1">
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
                    </CompanyField>
                    <CompanyField label="Longitude" className="md:col-span-1">
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
                    </CompanyField>
                  </div>
                </CompanyCollectionRow>
              ))}
            </CompanyFormSectionCard>
          ),
        },
        {
          label: "Banking",
          value: "banking",
          content: (
            <CompanyFormSectionCard
              title="Bank Accounts"
              description="Settlement and accounting accounts used by the company."
              onAdd={() =>
                setForm((current) => ({
                  ...current,
                  bankAccounts: [...current.bankAccounts, createEmptyCompanyBankAccount()],
                }))
              }
            >
              {form.bankAccounts.map((account, index) => (
                <CompanyCollectionRow
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
                    <CompanyField label="Bank Name">
                      <CompanyTextField
                        value={account.bankName}
                        onChange={(event) =>
                          setForm((current) => ({
                            ...current,
                            bankAccounts: updateCollectionItem(
                              current.bankAccounts,
                              index,
                              (item) => ({ ...item, bankName: event.target.value })
                            ),
                          }))
                        }
                      />
                    </CompanyField>
                    <CompanyField label="Branch">
                      <CompanyTextField
                        value={account.branch}
                        onChange={(event) =>
                          setForm((current) => ({
                            ...current,
                            bankAccounts: updateCollectionItem(
                              current.bankAccounts,
                              index,
                              (item) => ({ ...item, branch: event.target.value })
                            ),
                          }))
                        }
                      />
                    </CompanyField>
                    <CompanyField label="Account Number">
                      <CompanyTextField
                        value={account.accountNumber}
                        onChange={(event) =>
                          setForm((current) => ({
                            ...current,
                            bankAccounts: updateCollectionItem(
                              current.bankAccounts,
                              index,
                              (item) => ({ ...item, accountNumber: event.target.value })
                            ),
                          }))
                        }
                      />
                    </CompanyField>
                    <CompanyField label="Account Holder Name">
                      <CompanyTextField
                        value={account.accountHolderName}
                        onChange={(event) =>
                          setForm((current) => ({
                            ...current,
                            bankAccounts: updateCollectionItem(
                              current.bankAccounts,
                              index,
                              (item) => ({ ...item, accountHolderName: event.target.value })
                            ),
                          }))
                        }
                      />
                    </CompanyField>
                    <CompanyField label="IFSC">
                      <CompanyTextField
                        value={account.ifsc}
                        onChange={(event) =>
                          setForm((current) => ({
                            ...current,
                            bankAccounts: updateCollectionItem(
                              current.bankAccounts,
                              index,
                              (item) => ({ ...item, ifsc: event.target.value })
                            ),
                          }))
                        }
                      />
                    </CompanyField>
                    <CompanyCheckboxField
                      checked={account.isPrimary}
                      label="Primary account"
                      onCheckedChange={(checked) =>
                        setForm((current) => ({
                          ...current,
                          bankAccounts: updateCollectionItem(
                            current.bankAccounts,
                            index,
                            (item) => ({ ...item, isPrimary: checked })
                          ),
                        }))
                      }
                    />
                  </div>
                </CompanyCollectionRow>
              ))}
            </CompanyFormSectionCard>
          ),
        },
      ] satisfies AnimatedContentTab[],
    [fieldErrors.name, form, lookupState]
  )

  async function handleSave() {
    const nextFieldErrors = validateCompanyForm(form)
    setFieldErrors(nextFieldErrors)

    if (Object.keys(nextFieldErrors).length > 0) {
      setFormError("Validation failed. Fix the highlighted fields and save again.")
      return
    }

    setIsSaving(true)
    setFormError(null)

    try {
      if (companyId) {
        await requestJson<CompanyResponse>(
          `/internal/v1/cxapp/company?id=${encodeURIComponent(companyId)}`,
          {
            method: "PATCH",
            body: JSON.stringify(form),
          }
        )
      } else {
        await requestJson<CompanyResponse>("/internal/v1/cxapp/companies", {
          method: "POST",
          body: JSON.stringify(form),
        })
      }

      void navigate("/dashboard/settings/companies")
    } catch (error) {
      setFormError(
        error instanceof Error ? error.message : `Failed to save ${form.name || "company"}.`
      )
    } finally {
      setIsSaving(false)
    }
  }

  if (isLoading) {
    return <LoadingCard message="Loading company form..." />
  }

  if (loadError) {
    return <StateCard message={loadError} />
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
        <div className="space-y-2">
          <Button variant="ghost" size="sm" asChild className="-ml-3 w-fit">
            <Link to="/dashboard/settings/companies">
              <ArrowLeftIcon className="size-4" />
              Back to companies
            </Link>
          </Button>
          <div className="space-y-1">
            <h1 className="text-2xl font-semibold tracking-tight text-foreground">
              {isEditing ? "Update Company" : "Create Company"}
            </h1>
            <p className="max-w-3xl text-sm leading-6 text-muted-foreground">
              Capture company identity, communication, addressing, banking, and public
              profile surfaces in one structured workspace.
            </p>
          </div>
        </div>
        <div className="flex flex-wrap items-center gap-3">
          <Button
            type="button"
            variant="outline"
            onClick={() => {
              void navigate("/dashboard/settings/companies")
            }}
            disabled={isSaving}
          >
            Cancel
          </Button>
          <Button type="button" onClick={() => void handleSave()} disabled={isSaving}>
            {isSaving ? "Saving..." : isEditing ? "Update Company" : "Save Company"}
          </Button>
        </div>
      </div>

      {formError ? <CompanyFormMessage>{formError}</CompanyFormMessage> : null}

      <AnimatedTabs defaultTabValue="details" tabs={tabs} />
    </div>
  )
}
