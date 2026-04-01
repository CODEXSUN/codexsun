export const platformBrandingDefaults = {
  brandName: 'codexsun',
  legalName: null,
  tagline: 'Software Made Simple',
  logoUrl: '/logo.svg',
  logoDarkUrl: '/logo-dark.svg',
  summary:
    'Design systems, frontend architecture, and rollout support across web, commerce, and business applications.',
  email: 'hello@codexsun.com',
  phone: '+91 95141 41494',
  website: null,
  location: 'Chennai, India',
} as const

export function buildPlatformLogoCandidates(...values: Array<string | null | undefined>) {
  return [...new Set(values.map((value) => value?.trim() ?? '').filter((value) => value.length > 0))]
}
