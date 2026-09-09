export type IdentityIdentifierType = 'email' | 'mobile' | 'username'

export interface NormalizedIdentityIdentifier {
  type: IdentityIdentifierType
  value: string
}

export function normalizeIdentityIdentifier(input: string): NormalizedIdentityIdentifier {
  const value = input.trim()
  if (value.includes('@')) return { type: 'email', value: value.toLowerCase() }
  if (/^[+\d][\d\s()-]{5,}$/.test(value)) {
    return { type: 'mobile', value: value.replace(/[^+\d]/g, '') }
  }
  return { type: 'username', value: value.toLowerCase() }
}
