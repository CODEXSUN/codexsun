export type CustomerVerificationInterval = 'never' | '90_days' | '180_days'

export type CustomerSecurityPreferences = {
  requireOtpForSensitiveChanges: boolean
  reverifyInactiveContact: boolean
  periodicVerification: CustomerVerificationInterval
}

const storageKey = 'codexsun-customer-security-preferences'

export const defaultCustomerSecurityPreferences: CustomerSecurityPreferences = {
  requireOtpForSensitiveChanges: false,
  reverifyInactiveContact: true,
  periodicVerification: '180_days',
}

export function readCustomerSecurityPreferences() {
  if (typeof window === 'undefined') {
    return defaultCustomerSecurityPreferences
  }

  try {
    const rawValue = window.localStorage.getItem(storageKey)
    if (!rawValue) {
      return defaultCustomerSecurityPreferences
    }

    const parsed = JSON.parse(rawValue) as Partial<CustomerSecurityPreferences> | null
    if (!parsed || typeof parsed !== 'object') {
      return defaultCustomerSecurityPreferences
    }

    const periodicVerification = parsed.periodicVerification
    return {
      requireOtpForSensitiveChanges: Boolean(parsed.requireOtpForSensitiveChanges),
      reverifyInactiveContact: parsed.reverifyInactiveContact !== false,
      periodicVerification:
        periodicVerification === '90_days' || periodicVerification === '180_days' || periodicVerification === 'never'
          ? periodicVerification
          : defaultCustomerSecurityPreferences.periodicVerification,
    } satisfies CustomerSecurityPreferences
  } catch {
    return defaultCustomerSecurityPreferences
  }
}

export function writeCustomerSecurityPreferences(preferences: CustomerSecurityPreferences) {
  if (typeof window === 'undefined') {
    return
  }

  window.localStorage.setItem(storageKey, JSON.stringify(preferences))
}

