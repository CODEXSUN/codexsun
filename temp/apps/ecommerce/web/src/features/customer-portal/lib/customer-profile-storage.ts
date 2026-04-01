export type CustomerAddress = {
  id: string
  label: string
  firstName: string
  lastName: string
  phone: string
  addressLine1: string
  addressLine2: string
  cityId: string
  city: string
  stateId: string
  state: string
  countryId: string
  country: string
  postalCodeId: string
  postalCode: string
  isDefault: boolean
}

export type CustomerProfile = {
  email: string
  addresses: CustomerAddress[]
}

const storageKey = "codexsun-customer-profile"

export function createEmptyAddress(): CustomerAddress {
  return {
    id: `address-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
    label: "Home",
    firstName: "",
    lastName: "",
    phone: "",
    addressLine1: "",
    addressLine2: "",
    cityId: "",
    city: "",
    stateId: "",
    state: "",
    countryId: "",
    country: "",
    postalCodeId: "",
    postalCode: "",
    isDefault: true,
  }
}

export const emptyCustomerProfile: CustomerProfile = {
  email: "",
  addresses: [createEmptyAddress()],
}

function normalizeAddresses(addresses: CustomerAddress[]) {
  if (addresses.length === 0) {
    return [createEmptyAddress()]
  }

  let hasDefault = false

  return addresses.map((address, index) => {
    const normalized = {
      ...createEmptyAddress(),
      ...address,
      id: address.id || createEmptyAddress().id,
      label: address.label || `Address ${index + 1}`,
    }

    if (normalized.isDefault && !hasDefault) {
      hasDefault = true
      return normalized
    }

    return {
      ...normalized,
      isDefault: false,
    }
  }).map((address, index) => {
    if (!hasDefault && index === 0) {
      return {
        ...address,
        isDefault: true,
      }
    }

    return address
  })
}

export function readCustomerProfile() {
  if (typeof window === "undefined") {
    return emptyCustomerProfile
  }

  try {
    const rawValue = window.localStorage.getItem(storageKey)
    if (!rawValue) {
      return emptyCustomerProfile
    }

    const parsed = JSON.parse(rawValue) as Partial<CustomerProfile> | null
    if (!parsed || typeof parsed !== "object") {
      return emptyCustomerProfile
    }

    return {
      email: typeof parsed.email === "string" ? parsed.email : "",
      addresses: normalizeAddresses(Array.isArray(parsed.addresses) ? parsed.addresses : []),
    } satisfies CustomerProfile
  } catch {
    return emptyCustomerProfile
  }
}

export function writeCustomerProfile(profile: CustomerProfile) {
  if (typeof window === "undefined") {
    return
  }

  const nextProfile: CustomerProfile = {
    email: profile.email,
    addresses: normalizeAddresses(profile.addresses),
  }

  window.localStorage.setItem(storageKey, JSON.stringify(nextProfile))
  window.dispatchEvent(new CustomEvent("codexsun-customer-profile-updated"))
}

export function getDefaultCustomerAddress(profile: CustomerProfile) {
  return profile.addresses.find((address) => address.isDefault) ?? profile.addresses[0] ?? createEmptyAddress()
}
