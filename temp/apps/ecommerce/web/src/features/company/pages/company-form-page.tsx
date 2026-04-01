import type {
  Company,
  CompanyAddressInput,
  CompanyBankAccountInput,
  CompanyEmailInput,
  CompanyLogoInput,
  CompanyPhoneInput,
  CompanyUpsertPayload,
  CommonModuleKey,
  CommonModuleItem,
} from '@shared/index'
import { useEffect, useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import { ArrowLeft, Plus, Trash2 } from 'lucide-react'
import { MediaImageField } from '@/components/forms/media-image-field'
import { AnimatedTabs, type AnimatedContentTab } from '@/components/ui/animated-tabs'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Checkbox } from '@/components/ui/checkbox'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { AutocompleteLookup } from '@/components/lookups/AutocompleteLookup'
import { createFieldErrors, inputErrorClassName, isBlank, setFieldError, summarizeFieldErrors, type FieldErrors, warningCardClassName } from '@/shared/forms/validation'
import { createCommonLookupOption, toLookupOption } from '@/shared/forms/common-lookup'
import { showFailedActionToast, showSavedToast, showValidationToast } from '@/shared/notifications/toast'
import {
  createCompany,
  getCompany,
  HttpError,
  listCommonModuleItems,
  updateCompany,
} from '@/shared/api/client'

type CompanyFormValues = CompanyUpsertPayload

const addressTypeOptions = [
  { value: 'head_office', label: 'Head Office' },
  { value: 'billing', label: 'Billing' },
  { value: 'shipping', label: 'Shipping' },
  { value: 'branch', label: 'Branch' },
]

const emailTypeOptions = [
  { value: 'admin', label: 'Admin' },
  { value: 'billing', label: 'Billing' },
  { value: 'support', label: 'Support' },
  { value: 'sales', label: 'Sales' },
]

const phoneTypeOptions = [
  { value: 'phone', label: 'Phone' },
  { value: 'mobile', label: 'Mobile' },
  { value: 'office', label: 'Office' },
  { value: 'whatsapp', label: 'WhatsApp' },
]

const emptyLogo = (): CompanyLogoInput => ({ logoUrl: '', logoType: 'primary' })
const emptyAddress = (): CompanyAddressInput => ({
  addressType: 'head_office',
  addressLine1: '',
  addressLine2: '',
  cityId: '1',
  stateId: '1',
  countryId: '1',
  pincodeId: '1',
  latitude: null,
  longitude: null,
  isDefault: true,
})
const emptyEmail = (): CompanyEmailInput => ({ email: '', emailType: 'admin' })
const emptyPhone = (): CompanyPhoneInput => ({ phoneNumber: '', phoneType: 'phone', isPrimary: true })
const emptyBankAccount = (): CompanyBankAccountInput => ({
  bankName: '',
  accountNumber: '',
  accountHolderName: '',
  ifsc: '',
  branch: '',
  isPrimary: true,
})

function createDefaultValues(): CompanyFormValues {
  return {
    name: '',
    legalName: '',
    tagline: '',
    registrationNumber: '',
    pan: '',
    financialYearStart: '',
    booksStart: '',
    website: '',
    description: '',
    facebookUrl: '',
    twitterUrl: '',
    instagramUrl: '',
    youtubeUrl: '',
    isActive: true,
    logos: [],
    addresses: [emptyAddress()],
    emails: [emptyEmail()],
    phones: [emptyPhone()],
    bankAccounts: [emptyBankAccount()],
  }
}

function toErrorMessage(error: unknown) {
  if (error instanceof HttpError) {
    return error.message
  }

  if (error instanceof Error) {
    return error.message
  }

  return 'Failed to save company.'
}

function FieldError({ message }: { message?: string }) {
  return message ? <p className="text-[0.8rem] text-destructive">{message}</p> : null
}

function validateCompany(values: CompanyFormValues) {
  const errors = createFieldErrors()

  if (isBlank(values.name)) setFieldError(errors, 'name', 'Name is required.')

  return errors
}

function toFormValues(company: Company): CompanyFormValues {
  return {
    name: company.name,
    legalName: company.legalName ?? '',
    tagline: company.tagline ?? '',
    registrationNumber: company.registrationNumber ?? '',
    pan: company.pan ?? '',
    financialYearStart: company.financialYearStart ?? '',
    booksStart: company.booksStart ?? '',
    website: company.website ?? '',
    description: company.description ?? '',
    facebookUrl: company.facebookUrl ?? '',
    twitterUrl: company.twitterUrl ?? '',
    instagramUrl: company.instagramUrl ?? '',
    youtubeUrl: company.youtubeUrl ?? '',
    isActive: company.isActive,
    logos: company.logos.map((logo) => ({ logoUrl: logo.logoUrl, logoType: logo.logoType })),
    addresses: company.addresses.length
      ? company.addresses.map((address) => ({
          addressType: address.addressType,
          addressLine1: address.addressLine1,
          addressLine2: address.addressLine2 ?? '',
          cityId: address.cityId ?? '1',
          stateId: address.stateId ?? '1',
          countryId: address.countryId ?? '1',
          pincodeId: address.pincodeId ?? '1',
          latitude: address.latitude,
          longitude: address.longitude,
          isDefault: address.isDefault,
        }))
      : [emptyAddress()],
    emails: company.emails.length
      ? company.emails.map((email) => ({ email: email.email, emailType: email.emailType }))
      : [emptyEmail()],
    phones: company.phones.length
      ? company.phones.map((phone) => ({
          phoneNumber: phone.phoneNumber,
          phoneType: phone.phoneType,
          isPrimary: phone.isPrimary,
        }))
      : [emptyPhone()],
    bankAccounts: company.bankAccounts.length
      ? company.bankAccounts.map((account) => ({
          bankName: account.bankName,
          accountNumber: account.accountNumber,
          accountHolderName: account.accountHolderName,
          ifsc: account.ifsc,
          branch: account.branch ?? '',
          isPrimary: account.isPrimary,
        }))
      : [emptyBankAccount()],
  }
}

function CollectionCard({
  title,
  description,
  onAdd,
  className,
  contentClassName,
  children,
}: React.PropsWithChildren<{
  title?: string
  description?: string
  onAdd?: () => void
  className?: string
  contentClassName?: string
}>) {
  const headerAction = onAdd ? (
    <Button type="button" variant="outline" size="sm" onClick={onAdd}>
      <Plus className="size-4" />
      Add
    </Button>
  ) : null
  const hasHeader = Boolean(title || description || headerAction)

  return (
    <Card className={className}>
      {hasHeader ? (
        <CardHeader className="flex flex-row items-start justify-between gap-4">
          <div>
            {title ? <CardTitle>{title}</CardTitle> : null}
            {description ? <CardDescription>{description}</CardDescription> : null}
          </div>
          {headerAction}
        </CardHeader>
      ) : null}
      <CardContent className={contentClassName ?? 'grid gap-4'}>{children}</CardContent>
    </Card>
  )
}

function CollectionRow({
  children,
  onRemove,
}: React.PropsWithChildren<{ onRemove: () => void }>) {
  return (
    <div className="rounded-[1.5rem] border border-border/70 p-4">
      <div className="mb-4 flex justify-end">
        <Button type="button" variant="ghost" size="sm" onClick={onRemove}>
          <Trash2 className="size-4" />
          Remove
        </Button>
      </div>
      {children}
    </div>
  )
}

function LookupSelect({
  label,
  value,
  options,
  moduleKey,
  onItemsChange,
  onChange,
}: {
  label: string
  value: string | null
  options: CommonModuleItem[]
  moduleKey?: CommonModuleKey
  onItemsChange?: (items: CommonModuleItem[]) => void
  onChange: (value: string | null) => void
}) {
  return (
    <div className="grid gap-2">
      <Label>{label}</Label>
      <AutocompleteLookup
        value={value ?? ''}
        onChange={(nextValue) => onChange(nextValue || null)}
        options={options.map(toLookupOption)}
        allowEmptyOption
        emptyOptionLabel="-"
        placeholder={`Search ${label.toLowerCase()}`}
        createOption={moduleKey ? async (labelValue) => {
          const { item, option } = await createCommonLookupOption(moduleKey, labelValue)
          onItemsChange?.([...options, item])
          return option
        } : undefined}
      />
    </div>
  )
}

function LocalLookupSelect({
  label,
  value,
  options,
  onChange,
}: {
  label: string
  value: string
  options: { value: string; label: string }[]
  onChange: (value: string) => void
}) {
  return (
    <div className="grid gap-2">
      <Label>{label}</Label>
      <AutocompleteLookup
        value={value}
        onChange={(nextValue) => onChange(nextValue || '')}
        options={options}
        allowEmptyOption
        emptyOptionLabel="-"
        placeholder={`Search ${label.toLowerCase()}`}
      />
    </div>
  )
}

export function CompanyFormPage() {
  const navigate = useNavigate()
  const { companyId } = useParams()
  const isEditMode = Boolean(companyId)
  const [values, setValues] = useState<CompanyFormValues>(createDefaultValues())
  const [loading, setLoading] = useState(isEditMode)
  const [saving, setSaving] = useState(false)
  const [errorMessage, setErrorMessage] = useState<string | null>(null)
  const [fieldErrors, setFieldErrors] = useState<FieldErrors>(createFieldErrors())
  const [countries, setCountries] = useState<CommonModuleItem[]>([])
  const [states, setStates] = useState<CommonModuleItem[]>([])
  const [cities, setCities] = useState<CommonModuleItem[]>([])
  const [pincodes, setPincodes] = useState<CommonModuleItem[]>([])

  useEffect(() => {
    let cancelled = false

    async function loadLookups() {
      const [countryItems, stateItems, cityItems, pincodeItems] = await Promise.all([
        listCommonModuleItems('countries', false),
        listCommonModuleItems('states', false),
        listCommonModuleItems('cities', false),
        listCommonModuleItems('pincodes', false),
      ])

      if (!cancelled) {
        setCountries(countryItems)
        setStates(stateItems)
        setCities(cityItems)
        setPincodes(pincodeItems)
      }
    }

    void loadLookups()
    return () => { cancelled = true }
  }, [])

  useEffect(() => {
    let cancelled = false

    async function loadCompany() {
      if (!companyId) {
        return
      }

      setLoading(true)
      setErrorMessage(null)

      try {
        const company = await getCompany(companyId)
        if (!cancelled) {
          setValues(toFormValues(company))
        }
      } catch (error) {
        if (!cancelled) {
          setErrorMessage(toErrorMessage(error))
        }
      } finally {
        if (!cancelled) {
          setLoading(false)
        }
      }
    }

    void loadCompany()
    return () => { cancelled = true }
  }, [companyId])

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault()
    const nextFieldErrors = validateCompany(values)
    setFieldErrors(nextFieldErrors)
    if (Object.keys(nextFieldErrors).length > 0) {
      setErrorMessage('Validation failed.')
      showValidationToast('company')
      return
    }
    setSaving(true)
    setErrorMessage(null)

    try {
      const savedCompany = companyId
        ? await updateCompany(companyId, values)
        : await createCompany(values)

      showSavedToast({
        entityLabel: 'company',
        recordName: savedCompany.name,
        referenceId: savedCompany.id,
        mode: companyId ? 'update' : 'create',
      })

      void navigate('/admin/dashboard/companies')
    } catch (error) {
      const message = toErrorMessage(error)
      setErrorMessage(message)
      showFailedActionToast({
        entityLabel: 'company',
        action: companyId ? 'update' : 'save',
        detail: message,
      })
    } finally {
      setSaving(false)
    }
  }

  if (loading) {
    return (
      <Card>
        <CardContent className="p-8 text-sm text-muted-foreground">Loading company...</CardContent>
      </Card>
    )
  }

  return (
    <form className="space-y-6 pt-2" onSubmit={(event) => { void handleSubmit(event) }}>
      <div className="flex items-center justify-between gap-4">
        <div>
          <Button variant="ghost" size="sm" asChild className="-ml-3 mb-2">
            <Link to="/admin/dashboard/companies">
              <ArrowLeft className="size-4" />
              Back to companies
            </Link>
          </Button>
          <p className="text-sm text-muted-foreground">Capture company identity, contacts, addresses, and bank details.</p>
        </div>
        <div className="flex items-center gap-3">
          <Button type="button" variant="outline" onClick={() => { void navigate('/admin/dashboard/companies') }}>Cancel</Button>
          <Button type="submit" disabled={saving}>{saving ? 'Saving...' : 'Save Company'}</Button>
        </div>
      </div>

      {errorMessage ? (
        <Card className={`${warningCardClassName} rounded-md`}>
          <CardContent className="rounded-md p-4 text-sm">
            <p className="font-medium">{errorMessage}</p>
            {Object.keys(fieldErrors).length > 0 ? (
              <ul className="mt-2 list-disc space-y-1 pl-5">
                {summarizeFieldErrors(fieldErrors).map((message) => (
                  <li key={message}>{message}</li>
                ))}
              </ul>
            ) : null}
          </CardContent>
        </Card>
      ) : null}

      <AnimatedTabs
        defaultTabValue="company"
        tabs={[
          {
            label: 'Company',
            value: 'company',
            content: (
              <>
                <CollectionCard className="rounded-md" contentClassName="grid gap-4 pt-5 md:grid-cols-2">
                    <div className="grid min-h-[4.75rem] gap-2"><Label className={fieldErrors.name ? 'text-destructive' : undefined}>Name</Label><Input className={inputErrorClassName(Boolean(fieldErrors.name))} value={values.name} onChange={(event) => setValues((current) => ({ ...current, name: event.target.value }))} /><FieldError message={fieldErrors.name} /></div>
                    <div className="grid gap-2"><Label>Legal Name</Label><Input value={values.legalName} onChange={(event) => setValues((current) => ({ ...current, legalName: event.target.value }))} /></div>
                    <div className="grid gap-2 md:col-span-2"><Label>Tagline</Label><Input value={values.tagline} onChange={(event) => setValues((current) => ({ ...current, tagline: event.target.value }))} placeholder="Shown below logo text in menus and footers" /></div>
                    <div className="grid gap-2"><Label>Registration Number</Label><Input value={values.registrationNumber} onChange={(event) => setValues((current) => ({ ...current, registrationNumber: event.target.value }))} /></div>
                    <div className="grid gap-2"><Label>PAN</Label><Input value={values.pan} onChange={(event) => setValues((current) => ({ ...current, pan: event.target.value }))} /></div>
                    <div className="grid gap-2"><Label>Financial Year Start</Label><Input type="date" value={values.financialYearStart} onChange={(event) => setValues((current) => ({ ...current, financialYearStart: event.target.value }))} /></div>
                    <div className="grid gap-2"><Label>Books Start</Label><Input type="date" value={values.booksStart} onChange={(event) => setValues((current) => ({ ...current, booksStart: event.target.value }))} /></div>
                    <div className="grid gap-2 md:col-span-2"><Label>Website</Label><Input value={values.website} onChange={(event) => setValues((current) => ({ ...current, website: event.target.value }))} /></div>
                    <div className="grid gap-2 md:col-span-2"><Label>Description</Label><Textarea value={values.description} onChange={(event) => setValues((current) => ({ ...current, description: event.target.value }))} rows={4} placeholder="Use separate lines or paragraphs if you want multiple footer description blocks." /></div>
                    <label className="flex items-center gap-3 md:col-span-2"><Checkbox checked={values.isActive} onCheckedChange={(checked) => setValues((current) => ({ ...current, isActive: Boolean(checked) }))} /><span className="text-sm font-medium">Active company</span></label>
                </CollectionCard>
                <CollectionCard title="Company Logos" description="Primary, secondary, and favicon branding assets." onAdd={() => setValues((current) => ({ ...current, logos: [...current.logos, emptyLogo()] }))}>
                  {values.logos.map((logo, index) => (
                    <CollectionRow key={`logo-${index}`} onRemove={() => setValues((current) => ({ ...current, logos: current.logos.filter((_, rowIndex) => rowIndex !== index) }))}>
                      <div className="grid gap-4 md:grid-cols-2">
                        <MediaImageField
                          label="Logo"
                          value={logo.logoUrl}
                          onChange={(value) => setValues((current) => ({
                            ...current,
                            logos: current.logos.map((entry, rowIndex) => rowIndex === index ? { ...entry, logoUrl: value } : entry),
                          }))}
                          description="Pick an existing public media asset or upload a new logo."
                        />
                        <div className="grid gap-2"><Label>Logo Type</Label><Input value={logo.logoType} onChange={(event) => setValues((current) => ({ ...current, logos: current.logos.map((entry, rowIndex) => rowIndex === index ? { ...entry, logoType: event.target.value } : entry) }))} /></div>
                      </div>
                    </CollectionRow>
                  ))}
                </CollectionCard>
              </>
            ),
          },
          {
            label: 'Communication',
            value: 'communication',
            content: (
              <>
                <CollectionCard title="Company Emails" description="Operational and communication email addresses." onAdd={() => setValues((current) => ({ ...current, emails: [...current.emails, emptyEmail()] }))}>
                  {values.emails.map((email, index) => (
                    <CollectionRow key={`email-${index}`} onRemove={() => setValues((current) => ({ ...current, emails: current.emails.filter((_, rowIndex) => rowIndex !== index) }))}>
                      <div className="grid gap-4 md:grid-cols-2">
                        <div className="grid gap-2"><Label>Email</Label><Input type="email" value={email.email} onChange={(event) => setValues((current) => ({ ...current, emails: current.emails.map((entry, rowIndex) => rowIndex === index ? { ...entry, email: event.target.value } : entry) }))} /></div>
                        <LocalLookupSelect label="Email Type" value={email.emailType} options={emailTypeOptions} onChange={(value) => setValues((current) => ({ ...current, emails: current.emails.map((entry, rowIndex) => rowIndex === index ? { ...entry, emailType: value || 'admin' } : entry) }))} />
                      </div>
                    </CollectionRow>
                  ))}
                </CollectionCard>
                <CollectionCard title="Company Phones" description="Phone and messaging contacts." onAdd={() => setValues((current) => ({ ...current, phones: [...current.phones, emptyPhone()] }))}>
                  {values.phones.map((phone, index) => (
                    <CollectionRow key={`phone-${index}`} onRemove={() => setValues((current) => ({ ...current, phones: current.phones.filter((_, rowIndex) => rowIndex !== index) }))}>
                      <div className="grid gap-4 md:grid-cols-3">
                        <div className="grid gap-2"><Label>Phone Number</Label><Input value={phone.phoneNumber} onChange={(event) => setValues((current) => ({ ...current, phones: current.phones.map((entry, rowIndex) => rowIndex === index ? { ...entry, phoneNumber: event.target.value } : entry) }))} /></div>
                        <LocalLookupSelect label="Phone Type" value={phone.phoneType} options={phoneTypeOptions} onChange={(value) => setValues((current) => ({ ...current, phones: current.phones.map((entry, rowIndex) => rowIndex === index ? { ...entry, phoneType: value || 'phone' } : entry) }))} />
                        <label className="flex items-center gap-3 pt-8"><Checkbox checked={phone.isPrimary} onCheckedChange={(checked) => setValues((current) => ({ ...current, phones: current.phones.map((entry, rowIndex) => rowIndex === index ? { ...entry, isPrimary: Boolean(checked) } : entry) }))} /><span className="text-sm font-medium">Primary</span></label>
                      </div>
                    </CollectionRow>
                  ))}
                </CollectionCard>
                <CollectionCard title="Social Links" description="Public brand profile links used in the storefront footer.">
                  <div className="grid gap-4 md:grid-cols-2">
                    <div className="grid gap-2"><Label>Facebook URL</Label><Input value={values.facebookUrl} onChange={(event) => setValues((current) => ({ ...current, facebookUrl: event.target.value }))} placeholder="https://facebook.com/yourcompany" /></div>
                    <div className="grid gap-2"><Label>Twitter / X URL</Label><Input value={values.twitterUrl} onChange={(event) => setValues((current) => ({ ...current, twitterUrl: event.target.value }))} placeholder="https://x.com/yourcompany" /></div>
                    <div className="grid gap-2"><Label>Instagram URL</Label><Input value={values.instagramUrl} onChange={(event) => setValues((current) => ({ ...current, instagramUrl: event.target.value }))} placeholder="https://instagram.com/yourcompany" /></div>
                    <div className="grid gap-2"><Label>YouTube URL</Label><Input value={values.youtubeUrl} onChange={(event) => setValues((current) => ({ ...current, youtubeUrl: event.target.value }))} placeholder="https://youtube.com/@yourcompany" /></div>
                  </div>
                </CollectionCard>
              </>
            ),
          },
          {
            label: 'Addressing',
            value: 'addressing',
            content: (
              <CollectionCard title="Company Addresses" description="Billing, shipping, and head-office locations." onAdd={() => setValues((current) => ({ ...current, addresses: [...current.addresses, emptyAddress()] }))}>
                {values.addresses.map((address, index) => (
                  <CollectionRow key={`address-${index}`} onRemove={() => setValues((current) => ({ ...current, addresses: current.addresses.filter((_, rowIndex) => rowIndex !== index) }))}>
                    <div className="grid gap-4 md:grid-cols-2">
                      <LocalLookupSelect label="Address Type" value={address.addressType} options={addressTypeOptions} onChange={(value) => setValues((current) => ({ ...current, addresses: current.addresses.map((entry, rowIndex) => rowIndex === index ? { ...entry, addressType: value || 'head_office' } : entry) }))} />
                      <label className="flex items-center gap-3 pt-8"><Checkbox checked={address.isDefault} onCheckedChange={(checked) => setValues((current) => ({ ...current, addresses: current.addresses.map((entry, rowIndex) => rowIndex === index ? { ...entry, isDefault: Boolean(checked) } : entry) }))} /><span className="text-sm font-medium">Default address</span></label>
                      <div className="grid gap-2 md:col-span-2"><Label>Address Line 1</Label><Input value={address.addressLine1} onChange={(event) => setValues((current) => ({ ...current, addresses: current.addresses.map((entry, rowIndex) => rowIndex === index ? { ...entry, addressLine1: event.target.value } : entry) }))} /></div>
                      <div className="grid gap-2 md:col-span-2"><Label>Address Line 2</Label><Input value={address.addressLine2} onChange={(event) => setValues((current) => ({ ...current, addresses: current.addresses.map((entry, rowIndex) => rowIndex === index ? { ...entry, addressLine2: event.target.value } : entry) }))} /></div>
                      <LookupSelect label="Country" value={address.countryId} options={countries} moduleKey="countries" onItemsChange={setCountries} onChange={(value) => setValues((current) => ({ ...current, addresses: current.addresses.map((entry, rowIndex) => rowIndex === index ? { ...entry, countryId: value ?? '1' } : entry) }))} />
                      <LookupSelect label="State" value={address.stateId} options={states} moduleKey="states" onItemsChange={setStates} onChange={(value) => setValues((current) => ({ ...current, addresses: current.addresses.map((entry, rowIndex) => rowIndex === index ? { ...entry, stateId: value ?? '1' } : entry) }))} />
                      <LookupSelect label="City" value={address.cityId} options={cities} moduleKey="cities" onItemsChange={setCities} onChange={(value) => setValues((current) => ({ ...current, addresses: current.addresses.map((entry, rowIndex) => rowIndex === index ? { ...entry, cityId: value ?? '1' } : entry) }))} />
                      <LookupSelect label="Pincode" value={address.pincodeId} options={pincodes} moduleKey="pincodes" onItemsChange={setPincodes} onChange={(value) => setValues((current) => ({ ...current, addresses: current.addresses.map((entry, rowIndex) => rowIndex === index ? { ...entry, pincodeId: value ?? '1' } : entry) }))} />
                      <div className="grid gap-2"><Label>Latitude</Label><Input type="number" step="0.0000001" value={address.latitude ?? ''} onChange={(event) => setValues((current) => ({ ...current, addresses: current.addresses.map((entry, rowIndex) => rowIndex === index ? { ...entry, latitude: event.target.value ? Number(event.target.value) : null } : entry) }))} /></div>
                      <div className="grid gap-2"><Label>Longitude</Label><Input type="number" step="0.0000001" value={address.longitude ?? ''} onChange={(event) => setValues((current) => ({ ...current, addresses: current.addresses.map((entry, rowIndex) => rowIndex === index ? { ...entry, longitude: event.target.value ? Number(event.target.value) : null } : entry) }))} /></div>
                    </div>
                  </CollectionRow>
                ))}
              </CollectionCard>
            ),
          },
          {
            label: 'Banking',
            value: 'banking',
            content: (
              <CollectionCard title="Bank Accounts" description="Settlement and accounting accounts used by the company." onAdd={() => setValues((current) => ({ ...current, bankAccounts: [...current.bankAccounts, emptyBankAccount()] }))}>
                {values.bankAccounts.map((account, index) => (
                  <CollectionRow key={`bank-${index}`} onRemove={() => setValues((current) => ({ ...current, bankAccounts: current.bankAccounts.filter((_, rowIndex) => rowIndex !== index) }))}>
                    <div className="grid gap-4 md:grid-cols-2">
                        <div className="grid gap-2"><Label>Bank Name</Label><Input value={account.bankName} onChange={(event) => setValues((current) => ({ ...current, bankAccounts: current.bankAccounts.map((entry, rowIndex) => rowIndex === index ? { ...entry, bankName: event.target.value } : entry) }))} /></div>
                        <div className="grid gap-2"><Label>Branch</Label><Input value={account.branch} onChange={(event) => setValues((current) => ({ ...current, bankAccounts: current.bankAccounts.map((entry, rowIndex) => rowIndex === index ? { ...entry, branch: event.target.value } : entry) }))} /></div>
                        <div className="grid gap-2"><Label>Account Number</Label><Input value={account.accountNumber} onChange={(event) => setValues((current) => ({ ...current, bankAccounts: current.bankAccounts.map((entry, rowIndex) => rowIndex === index ? { ...entry, accountNumber: event.target.value } : entry) }))} /></div>
                        <div className="grid gap-2"><Label>Account Holder Name</Label><Input value={account.accountHolderName} onChange={(event) => setValues((current) => ({ ...current, bankAccounts: current.bankAccounts.map((entry, rowIndex) => rowIndex === index ? { ...entry, accountHolderName: event.target.value } : entry) }))} /></div>
                        <div className="grid gap-2"><Label>IFSC</Label><Input value={account.ifsc} onChange={(event) => setValues((current) => ({ ...current, bankAccounts: current.bankAccounts.map((entry, rowIndex) => rowIndex === index ? { ...entry, ifsc: event.target.value } : entry) }))} /></div>
                      <label className="flex items-center gap-3 pt-8"><Checkbox checked={account.isPrimary} onCheckedChange={(checked) => setValues((current) => ({ ...current, bankAccounts: current.bankAccounts.map((entry, rowIndex) => rowIndex === index ? { ...entry, isPrimary: Boolean(checked) } : entry) }))} /><span className="text-sm font-medium">Primary account</span></label>
                    </div>
                  </CollectionRow>
                ))}
              </CollectionCard>
            ),
          },
        ] satisfies AnimatedContentTab[]}
      />
    </form>
  )
}

