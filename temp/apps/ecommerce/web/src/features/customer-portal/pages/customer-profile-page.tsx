import { useEffect, useMemo, useState } from 'react'
import type { CommonModuleItem } from '@shared/index'
import {
  KeyRoundIcon,
  LoaderCircleIcon,
  MapPinIcon,
  PlusIcon,
  SaveIcon,
  ShieldCheckIcon,
  Trash2Icon,
  UserCircle2Icon,
} from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import { AutocompleteLookup } from '@/components/lookups/AutocompleteLookup'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { useAuth } from '@framework-core/web/auth/components/auth-provider'
import {
  readCustomerSecurityPreferences,
  writeCustomerSecurityPreferences,
  type CustomerSecurityPreferences,
} from '@/features/customer-portal/lib/customer-security-preferences'
import {
  createEmptyAddress,
  readCustomerProfile,
  type CustomerAddress,
  writeCustomerProfile,
} from '@/features/customer-portal/lib/customer-profile-storage'
import {
  changeCustomerPassword,
  deleteCustomerAccount,
  getCustomerProfile,
  HttpError,
  listCommonModuleItems,
  updateCustomerProfile,
} from '@/shared/api/client'
import { createCommonLookupOption, toLookupOption } from '@/shared/forms/common-lookup'
import { showErrorToast, showSuccessToast, showValidationToast } from '@/shared/notifications/toast'

type EditableCustomerProfile = {
  displayName: string
  email: string
  phoneNumber: string
  addresses: CustomerAddress[]
}

type PasswordFormState = {
  currentPassword: string
  newPassword: string
  confirmPassword: string
}

function splitDisplayName(displayName: string) {
  const parts = displayName.trim().split(/\s+/).filter(Boolean)
  return {
    firstName: parts[0] ?? '',
    lastName: parts.slice(1).join(' '),
  }
}

function toErrorMessage(error: unknown) {
  if (error instanceof HttpError) {
    return error.message
  }

  if (error instanceof Error) {
    return error.message
  }

  return 'Unable to save customer profile.'
}

function resolveLookupLabel(items: CommonModuleItem[], value: string) {
  const match = items.find((item) => String(item.id) === value)
  return match ? toLookupOption(match).label : value
}

function buildInitialProfile(sessionUser: { displayName?: string; email?: string; phoneNumber?: string | null } | null | undefined) {
  const storedProfile = readCustomerProfile()
  const fallbackName = splitDisplayName(sessionUser?.displayName ?? '')

  return {
    displayName: sessionUser?.displayName ?? '',
    email: storedProfile.email || sessionUser?.email || '',
    phoneNumber: sessionUser?.phoneNumber ?? '',
    addresses: storedProfile.addresses.map((address, index) => ({
      ...address,
      firstName: address.firstName || fallbackName.firstName,
      lastName: address.lastName || fallbackName.lastName,
      phone: address.phone || sessionUser?.phoneNumber || '',
      label: address.label || `Address ${index + 1}`,
    })),
  } satisfies EditableCustomerProfile
}

function normalizeAddressCollection(addresses: CustomerAddress[]) {
  if (addresses.length === 0) {
    return [createEmptyAddress()]
  }

  let hasDefault = false

  return addresses.map((address, index) => {
    const normalized = {
      ...address,
      label: address.label.trim() || `Address ${index + 1}`,
      firstName: address.firstName.trim(),
      lastName: address.lastName.trim(),
      phone: address.phone.trim(),
      addressLine1: address.addressLine1.trim(),
      addressLine2: address.addressLine2.trim(),
      city: address.city.trim(),
      state: address.state.trim(),
      country: address.country.trim(),
      postalCode: address.postalCode.trim(),
      isDefault: address.isDefault && !hasDefault,
    }

    if (normalized.isDefault) {
      hasDefault = true
    }

    if (!hasDefault && index === 0) {
      hasDefault = true
      return {
        ...normalized,
        isDefault: true,
      }
    }

    return normalized
  })
}

function syncCheckoutProfile(profile: EditableCustomerProfile) {
  writeCustomerProfile({
    email: profile.email,
    addresses: normalizeAddressCollection(profile.addresses),
  })
}

function ProfileLookupField({
  label,
  value,
  options,
  placeholder,
  moduleKey,
  onChange,
  onItemsChange,
}: {
  label: string
  value: string
  options: CommonModuleItem[]
  placeholder: string
  moduleKey: 'countries' | 'states' | 'cities' | 'pincodes'
  onChange: (value: string) => void
  onItemsChange: (items: CommonModuleItem[]) => void
}) {
  return (
    <div className="space-y-2">
      <Label>{label}</Label>
      <AutocompleteLookup
        value={value}
        onChange={onChange}
        options={options.map(toLookupOption)}
        allowEmptyOption
        emptyOptionLabel="-"
        placeholder={placeholder}
        createOption={async (labelValue) => {
          const { item, option } = await createCommonLookupOption(moduleKey, labelValue)
          onItemsChange([...options, item])
          return option
        }}
      />
    </div>
  )
}

export function CustomerProfilePage() {
  const auth = useAuth()
  const navigate = useNavigate()
  const initialProfile = useMemo(() => buildInitialProfile(auth.session?.user), [auth.session?.user])
  const [profile, setProfile] = useState<EditableCustomerProfile>(initialProfile)
  const [lastLoadedProfile, setLastLoadedProfile] = useState<EditableCustomerProfile>(initialProfile)
  const [activeAddressId, setActiveAddressId] = useState<string>(initialProfile.addresses[0]?.id ?? createEmptyAddress().id)
  const [preferences, setPreferences] = useState<CustomerSecurityPreferences>(() => readCustomerSecurityPreferences())
  const [passwordForm, setPasswordForm] = useState<PasswordFormState>({
    currentPassword: '',
    newPassword: '',
    confirmPassword: '',
  })
  const [deleteConfirmation, setDeleteConfirmation] = useState('')
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false)
  const [countries, setCountries] = useState<CommonModuleItem[]>([])
  const [states, setStates] = useState<CommonModuleItem[]>([])
  const [cities, setCities] = useState<CommonModuleItem[]>([])
  const [pincodes, setPincodes] = useState<CommonModuleItem[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [isSavingProfile, setIsSavingProfile] = useState(false)
  const [isSavingPreferences, setIsSavingPreferences] = useState(false)
  const [isChangingPassword, setIsChangingPassword] = useState(false)
  const [isDeletingAccount, setIsDeletingAccount] = useState(false)
  const [errorMessage, setErrorMessage] = useState<string | null>(null)

  useEffect(() => {
    let cancelled = false

    async function loadLookups() {
      try {
        const [countryItems, stateItems, cityItems, pincodeItems] = await Promise.all([
          listCommonModuleItems('countries', false),
          listCommonModuleItems('states', false),
          listCommonModuleItems('cities', false),
          listCommonModuleItems('pincodes', false),
        ])

        if (cancelled) {
          return
        }

        setCountries(countryItems)
        setStates(stateItems)
        setCities(cityItems)
        setPincodes(pincodeItems)
      } catch {
        if (!cancelled) {
          setErrorMessage('Unable to load location lookups right now.')
        }
      }
    }

    void loadLookups()

    return () => {
      cancelled = true
    }
  }, [])

  useEffect(() => {
    let cancelled = false

    async function loadProfile() {
      setIsLoading(true)
      setErrorMessage(null)

      const token = auth.session?.accessToken
      const user = auth.session?.user

      if (token && user?.actorType === 'customer') {
        try {
          const savedProfile = await getCustomerProfile(token)
          if (cancelled) {
            return
          }

          const nextProfile = {
            displayName: savedProfile.displayName,
            email: savedProfile.email,
            phoneNumber: savedProfile.phoneNumber ?? '',
            addresses: normalizeAddressCollection(savedProfile.addresses.length > 0 ? savedProfile.addresses : initialProfile.addresses),
          } satisfies EditableCustomerProfile

          setProfile(nextProfile)
          setLastLoadedProfile(nextProfile)
          setActiveAddressId(nextProfile.addresses[0]?.id ?? createEmptyAddress().id)
          syncCheckoutProfile(nextProfile)
          setIsLoading(false)
          return
        } catch {
          // Fall back to the stored checkout profile if customer profile fetch fails.
        }
      }

      if (!cancelled) {
        setProfile(initialProfile)
        setLastLoadedProfile(initialProfile)
        setActiveAddressId(initialProfile.addresses[0]?.id ?? createEmptyAddress().id)
        setIsLoading(false)
      }
    }

    void loadProfile()

    return () => {
      cancelled = true
    }
  }, [auth.session?.accessToken, auth.session?.user, initialProfile])

  const activeAddress = profile.addresses.find((address) => address.id === activeAddressId) ?? profile.addresses[0]

  function updateAddress(addressId: string, updater: (address: CustomerAddress) => CustomerAddress) {
    setProfile((current) => ({
      ...current,
      addresses: current.addresses.map((address) => (address.id === addressId ? updater(address) : address)),
    }))
  }

  function handleAddAddress() {
    const nameParts = splitDisplayName(profile.displayName)
    const address = {
      ...createEmptyAddress(),
      label: `Address ${profile.addresses.length + 1}`,
      firstName: nameParts.firstName,
      lastName: nameParts.lastName,
      phone: profile.phoneNumber,
      isDefault: false,
    }

    setProfile((current) => ({
      ...current,
      addresses: [...current.addresses, address],
    }))
    setActiveAddressId(address.id)
  }

  function handleRemoveAddress(addressId: string) {
    setProfile((current) => {
      const remaining = current.addresses.filter((address) => address.id !== addressId)
      const nextAddresses = remaining.length === 0 ? [createEmptyAddress()] : normalizeAddressCollection(remaining)

      return {
        ...current,
        addresses: nextAddresses,
      }
    })

    if (activeAddressId === addressId) {
      const nextAddress = profile.addresses.find((address) => address.id !== addressId)
      setActiveAddressId(nextAddress?.id ?? createEmptyAddress().id)
    }
  }

  function handleSetDefault(addressId: string) {
    setProfile((current) => ({
      ...current,
      addresses: current.addresses.map((address) => ({
        ...address,
        isDefault: address.id === addressId,
      })),
    }))
  }

  async function handleSaveProfile() {
    if (!auth.session?.accessToken || auth.session.user.actorType !== 'customer') {
      showValidationToast('customer profile')
      setErrorMessage('Customer profile saving requires an authenticated customer session.')
      return
    }

    if (!profile.displayName.trim()) {
      showValidationToast('customer profile')
      setErrorMessage('Username is required.')
      return
    }

    const normalizedAddresses = normalizeAddressCollection(profile.addresses)
    setIsSavingProfile(true)
    setErrorMessage(null)

    try {
      const savedProfile = await updateCustomerProfile(auth.session.accessToken, {
        displayName: profile.displayName.trim(),
        phoneNumber: profile.phoneNumber.trim() || null,
        addresses: normalizedAddresses,
      })

      const nextProfile = {
        displayName: savedProfile.displayName,
        email: savedProfile.email,
        phoneNumber: savedProfile.phoneNumber ?? '',
        addresses: normalizeAddressCollection(savedProfile.addresses.length > 0 ? savedProfile.addresses : normalizedAddresses),
      } satisfies EditableCustomerProfile

      setProfile(nextProfile)
      setLastLoadedProfile(nextProfile)
      setActiveAddressId(nextProfile.addresses[0]?.id ?? createEmptyAddress().id)
      syncCheckoutProfile(nextProfile)
      await auth.refreshUser()

      showSuccessToast({
        title: 'Profile saved',
        description: 'Account details and delivery addresses are updated.',
      })
    } catch (error) {
      const nextMessage = toErrorMessage(error)
      setErrorMessage(nextMessage)
      showErrorToast({
        title: 'Profile not saved',
        description: nextMessage,
      })
    } finally {
      setIsSavingProfile(false)
    }
  }

  function handleSavePreferences() {
    setIsSavingPreferences(true)
    try {
      writeCustomerSecurityPreferences(preferences)
      showSuccessToast({
        title: 'Verification preferences saved',
        description: 'Your long-term revalidation options are stored for this account environment.',
      })
    } finally {
      setIsSavingPreferences(false)
    }
  }

  async function handleChangePassword() {
    if (!auth.session?.accessToken || auth.session.user.actorType !== 'customer') {
      showValidationToast('password')
      setErrorMessage('Password change requires an authenticated customer session.')
      return
    }

    if (
      !passwordForm.currentPassword.trim()
      || !passwordForm.newPassword.trim()
      || passwordForm.newPassword !== passwordForm.confirmPassword
    ) {
      showValidationToast('password')
      setErrorMessage('Enter the current password and matching new password confirmation.')
      return
    }

    setIsChangingPassword(true)
    setErrorMessage(null)

    try {
      await changeCustomerPassword(auth.session.accessToken, {
        currentPassword: passwordForm.currentPassword,
        newPassword: passwordForm.newPassword,
      })

      setPasswordForm({
        currentPassword: '',
        newPassword: '',
        confirmPassword: '',
      })

      showSuccessToast({
        title: 'Password changed',
        description: 'Your customer account password has been updated.',
      })
    } catch (error) {
      const nextMessage = toErrorMessage(error)
      setErrorMessage(nextMessage)
      showErrorToast({
        title: 'Password not changed',
        description: nextMessage,
      })
    } finally {
      setIsChangingPassword(false)
    }
  }

  async function handleDeleteAccount() {
    if (!auth.session?.accessToken || auth.session.user.actorType !== 'customer') {
      showValidationToast('account')
      setErrorMessage('Account deletion requires an authenticated customer session.')
      return
    }

    if (deleteConfirmation.trim().toLowerCase() !== profile.email.trim().toLowerCase()) {
      showValidationToast('account')
      setErrorMessage('Enter the exact account email before deleting the account.')
      return
    }

    setIsDeletingAccount(true)
    setErrorMessage(null)

    try {
      await deleteCustomerAccount(auth.session.accessToken, {
        confirmation: deleteConfirmation.trim(),
      })

      auth.logout()
      void navigate('/login', { replace: true })
    } catch (error) {
      const nextMessage = toErrorMessage(error)
      setErrorMessage(nextMessage)
      showErrorToast({
        title: 'Account not deleted',
        description: nextMessage,
      })
    } finally {
      setIsDeletingAccount(false)
    }
  }

  if (isLoading || !activeAddress) {
    return (
      <Card>
        <CardContent className="flex items-center gap-3 p-6 text-sm text-muted-foreground">
          <LoaderCircleIcon className="size-4 animate-spin" />
          Loading customer profile...
        </CardContent>
      </Card>
    )
  }

  return (
    <div className="space-y-4 pb-36">
      <Card className="mesh-panel overflow-hidden">
        <CardHeader className="gap-4 border-b border-border/60 p-8">
          <Badge className="w-fit">Customer profile</Badge>
          <CardTitle className="text-4xl tracking-tight sm:text-5xl">
            Account, security, and delivery settings.
          </CardTitle>
          <CardDescription className="max-w-3xl text-base leading-7">
            Manage your customer portal username, account contact, mobile number, saved delivery addresses, password updates, verification preferences, and account deletion controls.
          </CardDescription>
        </CardHeader>
      </Card>

      {errorMessage ? (
        <Card className="border-destructive/40">
          <CardContent className="p-4 text-sm text-destructive">{errorMessage}</CardContent>
        </Card>
      ) : null}

      <Card>
        <CardHeader>
          <div className="flex items-center gap-2">
            <UserCircle2Icon className="size-4 text-muted-foreground" />
            <CardTitle>Account identity</CardTitle>
          </div>
          <CardDescription>
            Keep the customer username, account email, and primary mobile number current for order and support access.
          </CardDescription>
        </CardHeader>
        <CardContent className="grid gap-4 md:grid-cols-2">
          <div className="space-y-2">
            <Label htmlFor="customer-profile-username">Username</Label>
            <Input
              id="customer-profile-username"
              value={profile.displayName}
              onChange={(event) => setProfile((current) => ({ ...current, displayName: event.target.value }))}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="customer-profile-mobile">Mobile number</Label>
            <Input
              id="customer-profile-mobile"
              value={profile.phoneNumber}
              onChange={(event) => setProfile((current) => ({ ...current, phoneNumber: event.target.value }))}
            />
          </div>
          <div className="space-y-2 md:col-span-2">
            <Label htmlFor="customer-profile-email">Account email</Label>
            <Input id="customer-profile-email" type="email" value={profile.email} readOnly />
            <p className="text-xs text-muted-foreground">
              This is the current account login email. It remains the primary verified contact in this profile flow.
            </p>
          </div>
        </CardContent>
      </Card>

      <div className="grid gap-4 xl:grid-cols-[0.9fr_1.1fr]">
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between gap-3">
              <div>
                <CardTitle>Saved addresses</CardTitle>
                <CardDescription>
                  Choose the default delivery address and keep separate address books.
                </CardDescription>
              </div>
              <Button variant="outline" size="sm" onClick={handleAddAddress}>
                <PlusIcon className="size-4" />
                Add
              </Button>
            </div>
          </CardHeader>
          <CardContent className="grid gap-3">
            {profile.addresses.map((address) => (
              <button
                key={address.id}
                type="button"
                className={`rounded-[1.3rem] border p-4 text-left transition ${address.id === activeAddress.id ? 'border-primary bg-accent/30' : 'border-border/70 bg-card/70 hover:bg-accent/20'}`}
                onClick={() => setActiveAddressId(address.id)}
              >
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <p className="font-medium text-foreground">{address.label}</p>
                    <p className="mt-1 text-sm text-muted-foreground">
                      {address.firstName} {address.lastName}
                    </p>
                    <p className="mt-1 text-sm text-muted-foreground">
                      {address.city || 'City'}, {address.state || 'State'}
                    </p>
                  </div>
                  {address.isDefault ? <Badge>Default</Badge> : null}
                </div>
              </button>
            ))}
          </CardContent>
        </Card>

        <div className="space-y-4">
          <Card>
            <CardHeader>
              <div className="flex items-center gap-2">
                <MapPinIcon className="size-4 text-muted-foreground" />
                <CardTitle>Delivery address</CardTitle>
              </div>
              <CardDescription>
                Keep each address complete for smoother order confirmation and delivery.
              </CardDescription>
            </CardHeader>
            <CardContent className="grid gap-4">
              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="customer-address-label">Address label</Label>
                  <Input
                    id="customer-address-label"
                    value={activeAddress.label}
                    onChange={(event) => updateAddress(activeAddress.id, (address) => ({ ...address, label: event.target.value }))}
                  />
                </div>
                <div className="flex items-end gap-3">
                  <label className="flex items-center gap-2 text-sm font-medium">
                    <input
                      type="radio"
                      name="default-address"
                      checked={activeAddress.isDefault}
                      onChange={() => handleSetDefault(activeAddress.id)}
                    />
                    Set as default delivery address
                  </label>
                  {profile.addresses.length > 1 ? (
                    <Button variant="outline" size="sm" onClick={() => handleRemoveAddress(activeAddress.id)}>
                      <Trash2Icon className="size-4" />
                      Remove
                    </Button>
                  ) : null}
                </div>
              </div>
              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="customer-profile-first-name">First name</Label>
                  <Input id="customer-profile-first-name" value={activeAddress.firstName} onChange={(event) => updateAddress(activeAddress.id, (address) => ({ ...address, firstName: event.target.value }))} />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="customer-profile-last-name">Last name</Label>
                  <Input id="customer-profile-last-name" value={activeAddress.lastName} onChange={(event) => updateAddress(activeAddress.id, (address) => ({ ...address, lastName: event.target.value }))} />
                </div>
                <div className="space-y-2 md:col-span-2">
                  <Label htmlFor="customer-profile-phone">Address phone</Label>
                  <Input id="customer-profile-phone" value={activeAddress.phone} onChange={(event) => updateAddress(activeAddress.id, (address) => ({ ...address, phone: event.target.value }))} />
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="customer-profile-address-line-1">Address line 1</Label>
                <Textarea id="customer-profile-address-line-1" value={activeAddress.addressLine1} rows={3} onChange={(event) => updateAddress(activeAddress.id, (address) => ({ ...address, addressLine1: event.target.value }))} />
              </div>
              <div className="space-y-2">
                <Label htmlFor="customer-profile-address-line-2">Address line 2</Label>
                <Input id="customer-profile-address-line-2" value={activeAddress.addressLine2} onChange={(event) => updateAddress(activeAddress.id, (address) => ({ ...address, addressLine2: event.target.value }))} />
              </div>
              <div className="grid gap-4 md:grid-cols-2">
                <ProfileLookupField
                  label="Country"
                  value={activeAddress.countryId}
                  options={countries}
                  placeholder="Search country"
                  moduleKey="countries"
                  onItemsChange={setCountries}
                  onChange={(value) => updateAddress(activeAddress.id, (address) => ({ ...address, countryId: value, country: value ? resolveLookupLabel(countries, value) : '' }))}
                />
                <ProfileLookupField
                  label="State"
                  value={activeAddress.stateId}
                  options={states}
                  placeholder="Search state"
                  moduleKey="states"
                  onItemsChange={setStates}
                  onChange={(value) => updateAddress(activeAddress.id, (address) => ({ ...address, stateId: value, state: value ? resolveLookupLabel(states, value) : '' }))}
                />
                <ProfileLookupField
                  label="City"
                  value={activeAddress.cityId}
                  options={cities}
                  placeholder="Search city"
                  moduleKey="cities"
                  onItemsChange={setCities}
                  onChange={(value) => updateAddress(activeAddress.id, (address) => ({ ...address, cityId: value, city: value ? resolveLookupLabel(cities, value) : '' }))}
                />
                <ProfileLookupField
                  label="Postal code"
                  value={activeAddress.postalCodeId}
                  options={pincodes}
                  placeholder="Search postal code"
                  moduleKey="pincodes"
                  onItemsChange={setPincodes}
                  onChange={(value) => updateAddress(activeAddress.id, (address) => ({ ...address, postalCodeId: value, postalCode: value ? resolveLookupLabel(pincodes, value) : '' }))}
                />
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      <div className="grid gap-4 xl:grid-cols-2">
        <Card>
          <CardHeader>
            <div className="flex items-center gap-2">
              <ShieldCheckIcon className="size-4 text-muted-foreground" />
              <CardTitle>OTP and verification options</CardTitle>
            </div>
            <CardDescription>
              Keep long-term verification and renewal preferences ready without changing the current sign-in UX.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <label className="flex items-start gap-3 rounded-[1rem] border border-border/70 p-4">
              <input
                type="checkbox"
                checked={preferences.requireOtpForSensitiveChanges}
                onChange={(event) => setPreferences((current) => ({ ...current, requireOtpForSensitiveChanges: event.target.checked }))}
              />
              <span className="space-y-1">
                <span className="block text-sm font-medium text-foreground">Require OTP for sensitive changes</span>
                <span className="block text-sm text-muted-foreground">Use this as the preferred policy for future email, mobile, or high-risk account updates.</span>
              </span>
            </label>

            <label className="flex items-start gap-3 rounded-[1rem] border border-border/70 p-4">
              <input
                type="checkbox"
                checked={preferences.reverifyInactiveContact}
                onChange={(event) => setPreferences((current) => ({ ...current, reverifyInactiveContact: event.target.checked }))}
              />
              <span className="space-y-1">
                <span className="block text-sm font-medium text-foreground">Revalidate inactive contact access</span>
                <span className="block text-sm text-muted-foreground">Keep a long-term option to reverify the account when the contact method has been unused for a while.</span>
              </span>
            </label>

            <div className="space-y-2">
              <Label htmlFor="customer-periodic-verification">Periodic verification</Label>
              <select
                id="customer-periodic-verification"
                value={preferences.periodicVerification}
                onChange={(event) => setPreferences((current) => ({ ...current, periodicVerification: event.target.value as CustomerSecurityPreferences['periodicVerification'] }))}
                className="h-10 w-full rounded-md border border-input bg-background px-3 text-sm shadow-xs outline-none focus-visible:border-ring focus-visible:ring-[3px] focus-visible:ring-ring/50"
              >
                <option value="never">No periodic verification</option>
                <option value="90_days">Every 90 days</option>
                <option value="180_days">Every 180 days</option>
              </select>
            </div>

            <Button onClick={handleSavePreferences} disabled={isSavingPreferences}>
              <SaveIcon className="size-4" />
              {isSavingPreferences ? 'Saving preferences...' : 'Save verification options'}
            </Button>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <div className="flex items-center gap-2">
              <KeyRoundIcon className="size-4 text-muted-foreground" />
              <CardTitle>Password change</CardTitle>
            </div>
            <CardDescription>
              Update the account password without affecting the rest of the profile.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="customer-current-password">Current password</Label>
              <Input
                id="customer-current-password"
                type="password"
                value={passwordForm.currentPassword}
                onChange={(event) => setPasswordForm((current) => ({ ...current, currentPassword: event.target.value }))}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="customer-new-password">New password</Label>
              <Input
                id="customer-new-password"
                type="password"
                value={passwordForm.newPassword}
                onChange={(event) => setPasswordForm((current) => ({ ...current, newPassword: event.target.value }))}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="customer-confirm-password">Confirm new password</Label>
              <Input
                id="customer-confirm-password"
                type="password"
                value={passwordForm.confirmPassword}
                onChange={(event) => setPasswordForm((current) => ({ ...current, confirmPassword: event.target.value }))}
              />
            </div>
            <Button onClick={() => void handleChangePassword()} disabled={isChangingPassword}>
              <KeyRoundIcon className="size-4" />
              {isChangingPassword ? 'Changing password...' : 'Change password'}
            </Button>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Save profile</CardTitle>
          <CardDescription>
            This keeps account identity, mobile number, and saved delivery addresses ready for checkout.
          </CardDescription>
        </CardHeader>
        <CardContent className="flex flex-wrap gap-3">
          <Button onClick={() => void handleSaveProfile()} disabled={isSavingProfile}>
            <SaveIcon className="size-4" />
            {isSavingProfile ? 'Saving profile...' : 'Save profile'}
          </Button>
          <Button
            variant="outline"
            onClick={() => {
              setProfile(lastLoadedProfile)
              setActiveAddressId(lastLoadedProfile.addresses[0]?.id ?? createEmptyAddress().id)
              syncCheckoutProfile(lastLoadedProfile)
              setPreferences(readCustomerSecurityPreferences())
              setPasswordForm({
                currentPassword: '',
                newPassword: '',
                confirmPassword: '',
              })
              setDeleteConfirmation('')
            }}
          >
            Reset
          </Button>
        </CardContent>
      </Card>

      <Card className="border-red-200 bg-red-50/80 dark:border-red-900/50 dark:bg-red-950/20">
        <CardHeader>
          <CardTitle>Delete account</CardTitle>
          <CardDescription>
            Schedule this customer account for deletion. Access is disabled immediately, recovery stays available for 15 days by email OTP, and after that the account is permanently removed without recovery.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="customer-delete-confirmation">Confirm account email</Label>
            <Input
              id="customer-delete-confirmation"
              value={deleteConfirmation}
              onChange={(event) => setDeleteConfirmation(event.target.value)}
              placeholder={profile.email}
            />
          </div>
          <Button variant="destructive" onClick={() => setDeleteDialogOpen(true)} disabled={isDeletingAccount}>
            <Trash2Icon className="size-4" />
            {isDeletingAccount ? 'Deleting account...' : 'Delete account'}
          </Button>
        </CardContent>
      </Card>

      <Dialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <DialogContent className="border-red-200 bg-red-50 dark:border-red-900/50 dark:bg-red-950/95">
          <DialogHeader>
            <DialogTitle>Confirm account deletion</DialogTitle>
            <DialogDescription className="text-red-900/80 dark:text-red-100/80">
              This will disable your customer account immediately. The deletion request includes your login access, customer profile, saved addresses, and account-linked customer identity data.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-3 rounded-[1rem] border border-red-200 bg-white/70 p-4 text-sm text-red-950 dark:border-red-900/50 dark:bg-black/20 dark:text-red-50">
            <p>A 15-day grace period starts as soon as you confirm.</p>
            <p>During that window you can recover the account only through email OTP confirmation.</p>
            <p>After 15 days the account is permanently deleted and recovery is no longer available.</p>
            <p>Enter the exact account email before continuing.</p>
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => setDeleteDialogOpen(false)}>
              Cancel
            </Button>
            <Button
              variant="destructive"
              onClick={() => {
                setDeleteDialogOpen(false)
                void handleDeleteAccount()
              }}
              disabled={isDeletingAccount || deleteConfirmation.trim().toLowerCase() !== profile.email.trim().toLowerCase()}
            >
              <Trash2Icon className="size-4" />
              {isDeletingAccount ? 'Deleting account...' : 'Confirm delete'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
