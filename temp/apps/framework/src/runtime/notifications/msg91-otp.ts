import { environment } from '../config/environment'

interface Msg91WidgetVerifyResponse {
  message?: string
  type?: string
  identifier?: string
  mobile?: string
  phone?: string
  number?: string
  countryCode?: string
  country_code?: string
  verified?: boolean | string | number
}

function normalizeDigits(value: string | null | undefined) {
  return value?.replace(/\D/g, '') ?? ''
}

export function normalizeMsg91Destination(phoneNumber: string) {
  const digits = normalizeDigits(phoneNumber)
  const countryCode = environment.notifications.msg91.countryCode

  if (digits.startsWith(countryCode)) {
    return digits
  }

  return `${countryCode}${digits}`
}

function extractIdentifier(payload: Msg91WidgetVerifyResponse) {
  const directValue =
    payload.identifier ??
    payload.mobile ??
    payload.phone ??
    payload.number ??
    null

  if (!directValue) {
    return null
  }

  const digits = normalizeDigits(directValue)
  const countryCode = payload.countryCode ?? payload.country_code ?? environment.notifications.msg91.countryCode
  return digits.startsWith(countryCode) ? digits : `${countryCode}${digits}`
}

export async function verifyMsg91WidgetAccessToken(accessToken: string) {
  const response = await fetch(environment.notifications.msg91.widgetVerifyUrl, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Accept: 'application/json',
    },
    body: JSON.stringify({
      authkey: environment.notifications.msg91.authKey,
      'access-token': accessToken,
    }),
  })

  const payload = (await response.json().catch(() => null)) as Msg91WidgetVerifyResponse | null

  if (!response.ok) {
    throw new Error(payload?.message ?? response.statusText ?? 'Unable to verify MSG91 access token.')
  }

  const verifiedFlag = payload?.verified
  const isVerified = verifiedFlag == null
    ? true
    : verifiedFlag === true || verifiedFlag === 'true' || verifiedFlag === 1 || verifiedFlag === '1'

  if (!isVerified) {
    throw new Error(payload?.message ?? 'MSG91 access token is not verified.')
  }

  return {
    identifier: payload ? extractIdentifier(payload) : null,
    raw: payload,
  }
}
